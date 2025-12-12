"""
Risk Management Nodes for Trading
"""
from .base import BaseNode
from typing import Dict, Any, Optional
from app.mt5_handler import mt5_handler


class PositionSizerNode(BaseNode):
    """Calculate position size based on risk percentage"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate lot size based on risk
        
        Config:
            risk_percentage: Risk per trade (default: 1%)
            symbol: Trading symbol (default: EURUSD)
        
        Input:
            stop_loss_pips: Stop loss in pips
            account_balance: Account balance (optional, will fetch if not provided)
        
        Output:
            lot_size: Calculated lot size
            risk_amount: Risk amount in account currency
            position_value: Total position value
        """
        risk_percentage = self.config.get('risk_percentage', 1.0)
        symbol = self.config.get('symbol', 'EURUSD')
        
        # Get stop loss from input
        if not input_data or 'stop_loss_pips' not in input_data:
            raise Exception("Position Sizer requires 'stop_loss_pips' in input")
        
        stop_loss_pips = input_data['stop_loss_pips']
        
        # Get account balance
        if 'account_balance' in input_data:
            account_balance = input_data['account_balance']
        else:
            account_info = await mt5_handler.get_account_info()
            if not account_info:
                raise Exception("Failed to get account info")
            account_balance = account_info['balance']
        
        # Get symbol info for pip value
        symbol_info = await mt5_handler.get_symbol_info(symbol)
        if not symbol_info:
            raise Exception(f"Failed to get symbol info for {symbol}")
        
        # Calculate pip value (simplified for major pairs)
        # For EURUSD, 1 pip = 0.0001, for USDJPY 1 pip = 0.01
        if 'JPY' in symbol:
            pip_value = 0.01
        else:
            pip_value = 0.0001
        
        # Calculate risk amount
        risk_amount = account_balance * (risk_percentage / 100)
        
        # Calculate lot size
        # Risk Amount = Lot Size × Stop Loss Pips × Pip Value × Contract Size
        # Contract size is typically 100,000 for standard lot
        contract_size = 100000
        lot_size = risk_amount / (stop_loss_pips * pip_value * contract_size)
        
        # Round to 2 decimal places (0.01 lot minimum)
        lot_size = round(lot_size, 2)
        
        # Ensure minimum lot size
        min_lot = 0.01
        if lot_size < min_lot:
            lot_size = min_lot
        
        # Calculate position value
        position_value = lot_size * contract_size * symbol_info['bid']
        
        return {
            'lot_size': lot_size,
            'risk_amount': round(risk_amount, 2),
            'risk_percentage': risk_percentage,
            'stop_loss_pips': stop_loss_pips,
            'position_value': round(position_value, 2),
            'account_balance': account_balance,
            'symbol': symbol
        }
    
    def get_required_inputs(self) -> list:
        return ['stop_loss_pips']
    
    def get_outputs(self) -> list:
        return ['lot_size', 'risk_amount', 'risk_percentage', 'position_value']


class RiskRewardCalculatorNode(BaseNode):
    """Calculate Risk/Reward ratio for a trade"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate R:R ratio
        
        Config:
            min_rr_ratio: Minimum acceptable R:R ratio (default: 2.0)
        
        Input:
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
        
        Output:
            risk_reward_ratio: R:R ratio
            risk_pips: Risk in pips
            reward_pips: Reward in pips
            is_acceptable: Whether trade meets minimum R:R
        """
        min_rr_ratio = self.config.get('min_rr_ratio', 2.0)
        
        if not input_data:
            raise Exception("Risk/Reward Calculator requires input data")
        
        required_fields = ['entry_price', 'stop_loss', 'take_profit']
        for field in required_fields:
            if field not in input_data:
                raise Exception(f"Missing required field: {field}")
        
        entry_price = input_data['entry_price']
        stop_loss = input_data['stop_loss']
        take_profit = input_data['take_profit']
        
        # Calculate risk and reward
        risk = abs(entry_price - stop_loss)
        reward = abs(take_profit - entry_price)
        
        # Calculate R:R ratio
        if risk == 0:
            raise Exception("Risk cannot be zero")
        
        rr_ratio = reward / risk
        
        # Convert to pips (assuming 4-digit pricing)
        risk_pips = risk * 10000
        reward_pips = reward * 10000
        
        # Check if acceptable
        is_acceptable = rr_ratio >= min_rr_ratio
        
        return {
            'risk_reward_ratio': round(rr_ratio, 2),
            'risk_pips': round(risk_pips, 1),
            'reward_pips': round(reward_pips, 1),
            'risk_amount': round(risk, 5),
            'reward_amount': round(reward, 5),
            'is_acceptable': is_acceptable,
            'min_rr_ratio': min_rr_ratio,
            'recommendation': 'TAKE_TRADE' if is_acceptable else 'SKIP_TRADE'
        }
    
    def get_required_inputs(self) -> list:
        return ['entry_price', 'stop_loss', 'take_profit']
    
    def get_outputs(self) -> list:
        return ['risk_reward_ratio', 'risk_pips', 'reward_pips', 'is_acceptable', 'recommendation']


class DrawdownMonitorNode(BaseNode):
    """Monitor account drawdown"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Monitor drawdown
        
        Config:
            max_drawdown_percentage: Maximum acceptable drawdown (default: 10%)
            alert_threshold: Alert when drawdown reaches this % (default: 5%)
        
        Input:
            peak_equity: Peak equity (optional, will calculate if not provided)
            current_equity: Current equity (optional, will fetch if not provided)
        
        Output:
            current_drawdown: Current drawdown percentage
            drawdown_amount: Drawdown in currency
            is_critical: Whether drawdown exceeds max
            should_alert: Whether to send alert
        """
        max_drawdown = self.config.get('max_drawdown_percentage', 10.0)
        alert_threshold = self.config.get('alert_threshold', 5.0)
        
        # Get account info
        account_info = await mt5_handler.get_account_info()
        if not account_info:
            raise Exception("Failed to get account info")
        
        current_equity = account_info['equity']
        
        # Get peak equity from input or use current as peak
        if input_data and 'peak_equity' in input_data:
            peak_equity = input_data['peak_equity']
        else:
            # In production, you'd store this in database
            peak_equity = current_equity
        
        # Calculate drawdown
        if peak_equity == 0:
            drawdown_percentage = 0
            drawdown_amount = 0
        else:
            drawdown_amount = peak_equity - current_equity
            drawdown_percentage = (drawdown_amount / peak_equity) * 100
        
        # Check thresholds
        is_critical = drawdown_percentage >= max_drawdown
        should_alert = drawdown_percentage >= alert_threshold
        
        # Determine status
        if is_critical:
            status = 'CRITICAL'
        elif should_alert:
            status = 'WARNING'
        else:
            status = 'NORMAL'
        
        return {
            'current_drawdown': round(drawdown_percentage, 2),
            'drawdown_amount': round(drawdown_amount, 2),
            'peak_equity': peak_equity,
            'current_equity': current_equity,
            'is_critical': is_critical,
            'should_alert': should_alert,
            'status': status,
            'max_drawdown': max_drawdown,
            'alert_threshold': alert_threshold
        }
    
    def get_outputs(self) -> list:
        return ['current_drawdown', 'drawdown_amount', 'is_critical', 'should_alert', 'status']


class DailyLossLimitNode(BaseNode):
    """Check if daily loss limit has been reached"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Check daily loss limit
        
        Config:
            daily_loss_limit: Maximum loss per day in currency (default: 100)
            daily_loss_percentage: Maximum loss per day in % (default: 2%)
        
        Input:
            daily_pnl: Today's P&L (optional, will calculate if not provided)
        
        Output:
            can_trade: Whether trading is allowed
            daily_pnl: Today's profit/loss
            limit_reached: Whether limit is reached
            remaining_loss_allowed: How much more loss is allowed
        """
        daily_loss_limit = self.config.get('daily_loss_limit', 100)
        daily_loss_percentage = self.config.get('daily_loss_percentage', 2.0)
        
        # Get account info
        account_info = await mt5_handler.get_account_info()
        if not account_info:
            raise Exception("Failed to get account info")
        
        # Get daily P&L from input or current profit
        if input_data and 'daily_pnl' in input_data:
            daily_pnl = input_data['daily_pnl']
        else:
            # In production, calculate from today's trades
            daily_pnl = account_info['profit']
        
        # Calculate percentage loss
        balance = account_info['balance']
        loss_percentage = abs(daily_pnl / balance * 100) if daily_pnl < 0 else 0
        
        # Check limits
        limit_by_amount = abs(daily_pnl) >= daily_loss_limit if daily_pnl < 0 else False
        limit_by_percentage = loss_percentage >= daily_loss_percentage
        
        limit_reached = limit_by_amount or limit_by_percentage
        can_trade = not limit_reached
        
        # Calculate remaining loss allowed
        remaining_by_amount = daily_loss_limit - abs(daily_pnl) if daily_pnl < 0 else daily_loss_limit
        remaining_by_percentage = daily_loss_percentage - loss_percentage
        
        return {
            'can_trade': can_trade,
            'daily_pnl': round(daily_pnl, 2),
            'loss_percentage': round(loss_percentage, 2),
            'limit_reached': limit_reached,
            'limit_by_amount': limit_by_amount,
            'limit_by_percentage': limit_by_percentage,
            'remaining_loss_allowed': round(remaining_by_amount, 2),
            'remaining_percentage': round(remaining_by_percentage, 2),
            'daily_loss_limit': daily_loss_limit,
            'daily_loss_percentage': daily_loss_percentage,
            'status': 'STOP_TRADING' if limit_reached else 'CAN_TRADE'
        }
    
    def get_outputs(self) -> list:
        return ['can_trade', 'daily_pnl', 'limit_reached', 'status']


class MaxPositionsNode(BaseNode):
    """Check if maximum number of positions is reached"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Check max positions
        
        Config:
            max_positions: Maximum allowed open positions (default: 5)
            max_per_symbol: Maximum positions per symbol (default: 2)
            symbol: Symbol to check (optional)
        
        Output:
            can_open_position: Whether new position can be opened
            current_positions: Number of open positions
            positions_by_symbol: Positions grouped by symbol
            limit_reached: Whether limit is reached
        """
        max_positions = self.config.get('max_positions', 5)
        max_per_symbol = self.config.get('max_per_symbol', 2)
        check_symbol = self.config.get('symbol', None)
        
        # Get open positions
        positions = await mt5_handler.get_positions()
        
        if not positions:
            return {
                'can_open_position': True,
                'current_positions': 0,
                'positions_by_symbol': {},
                'limit_reached': False,
                'max_positions': max_positions,
                'max_per_symbol': max_per_symbol
            }
        
        # Count positions
        total_positions = len(positions)
        
        # Count by symbol
        positions_by_symbol = {}
        for pos in positions:
            symbol = pos.get('symbol', 'UNKNOWN')
            positions_by_symbol[symbol] = positions_by_symbol.get(symbol, 0) + 1
        
        # Check limits
        total_limit_reached = total_positions >= max_positions
        
        symbol_limit_reached = False
        if check_symbol and check_symbol in positions_by_symbol:
            symbol_limit_reached = positions_by_symbol[check_symbol] >= max_per_symbol
        
        can_open_position = not (total_limit_reached or symbol_limit_reached)
        
        return {
            'can_open_position': can_open_position,
            'current_positions': total_positions,
            'positions_by_symbol': positions_by_symbol,
            'limit_reached': total_limit_reached or symbol_limit_reached,
            'total_limit_reached': total_limit_reached,
            'symbol_limit_reached': symbol_limit_reached,
            'max_positions': max_positions,
            'max_per_symbol': max_per_symbol,
            'status': 'CAN_OPEN' if can_open_position else 'LIMIT_REACHED'
        }
    
    def get_outputs(self) -> list:
        return ['can_open_position', 'current_positions', 'limit_reached', 'status']
