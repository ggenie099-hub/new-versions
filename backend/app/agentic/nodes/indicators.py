"""
Technical Indicator Nodes for Trading Strategies
"""
from .base import BaseNode
from typing import Dict, Any, Optional, List
import numpy as np


class RSINode(BaseNode):
    """Calculate Relative Strength Index (RSI)"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate RSI
        
        Config:
            period: RSI period (default: 14)
            overbought: Overbought level (default: 70)
            oversold: Oversold level (default: 30)
        
        Input:
            prices: List of closing prices
        
        Output:
            rsi: Current RSI value
            signal: 'overbought', 'oversold', or 'neutral'
            previous_rsi: Previous RSI value
        """
        period = self.config.get('period', 14)
        overbought = self.config.get('overbought', 70)
        oversold = self.config.get('oversold', 30)
        
        # Get prices from input
        if not input_data or 'prices' not in input_data:
            raise Exception("RSI node requires 'prices' in input data")
        
        prices = input_data['prices']
        
        if len(prices) < period + 1:
            raise Exception(f"Need at least {period + 1} prices for RSI calculation")
        
        # Calculate RSI
        rsi_value, previous_rsi = self._calculate_rsi(prices, period)
        
        # Determine signal
        if rsi_value >= overbought:
            signal = 'overbought'
        elif rsi_value <= oversold:
            signal = 'oversold'
        else:
            signal = 'neutral'
        
        return {
            'rsi': round(rsi_value, 2),
            'previous_rsi': round(previous_rsi, 2) if previous_rsi else None,
            'signal': signal,
            'period': period,
            'overbought_level': overbought,
            'oversold_level': oversold
        }
    
    def _calculate_rsi(self, prices: List[float], period: int) -> tuple:
        """Calculate RSI using standard formula"""
        prices_array = np.array(prices)
        
        # Calculate price changes
        deltas = np.diff(prices_array)
        
        # Separate gains and losses
        gains = np.where(deltas > 0, deltas, 0)
        losses = np.where(deltas < 0, -deltas, 0)
        
        # Calculate average gains and losses
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        
        # Calculate RS and RSI
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        # Calculate previous RSI if possible
        previous_rsi = None
        if len(gains) > period:
            prev_avg_gain = np.mean(gains[-(period+1):-1])
            prev_avg_loss = np.mean(losses[-(period+1):-1])
            if prev_avg_loss > 0:
                prev_rs = prev_avg_gain / prev_avg_loss
                previous_rsi = 100 - (100 / (1 + prev_rs))
        
        return rsi, previous_rsi
    
    def get_required_inputs(self) -> list:
        return ['prices']
    
    def get_outputs(self) -> list:
        return ['rsi', 'previous_rsi', 'signal', 'period']


class MACDNode(BaseNode):
    """Calculate MACD (Moving Average Convergence Divergence)"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate MACD
        
        Config:
            fast_period: Fast EMA period (default: 12)
            slow_period: Slow EMA period (default: 26)
            signal_period: Signal line period (default: 9)
        
        Input:
            prices: List of closing prices
        
        Output:
            macd_line: MACD line value
            signal_line: Signal line value
            histogram: MACD histogram
            crossover: 'bullish', 'bearish', or 'none'
        """
        fast_period = self.config.get('fast_period', 12)
        slow_period = self.config.get('slow_period', 26)
        signal_period = self.config.get('signal_period', 9)
        
        if not input_data or 'prices' not in input_data:
            raise Exception("MACD node requires 'prices' in input data")
        
        prices = input_data['prices']
        min_required = slow_period + signal_period
        
        if len(prices) < min_required:
            raise Exception(f"Need at least {min_required} prices for MACD calculation")
        
        # Calculate MACD
        macd_line, signal_line, histogram, crossover = self._calculate_macd(
            prices, fast_period, slow_period, signal_period
        )
        
        return {
            'macd_line': round(macd_line, 5),
            'signal_line': round(signal_line, 5),
            'histogram': round(histogram, 5),
            'crossover': crossover,
            'fast_period': fast_period,
            'slow_period': slow_period,
            'signal_period': signal_period
        }
    
    def _calculate_ema(self, prices: List[float], period: int) -> float:
        """Calculate Exponential Moving Average"""
        prices_array = np.array(prices)
        multiplier = 2 / (period + 1)
        
        # Start with SMA
        ema = np.mean(prices_array[:period])
        
        # Calculate EMA
        for price in prices_array[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def _calculate_macd(self, prices: List[float], fast: int, slow: int, signal: int) -> tuple:
        """Calculate MACD, Signal, and Histogram"""
        # Calculate fast and slow EMAs
        fast_ema = self._calculate_ema(prices, fast)
        slow_ema = self._calculate_ema(prices, slow)
        
        # MACD line
        macd_line = fast_ema - slow_ema
        
        # For signal line, we need MACD values history
        # Simplified: use current MACD as signal (in production, calculate properly)
        signal_line = macd_line * 0.9  # Placeholder
        
        # Histogram
        histogram = macd_line - signal_line
        
        # Detect crossover
        crossover = 'none'
        if histogram > 0 and abs(histogram) < 0.0001:
            crossover = 'bullish'
        elif histogram < 0 and abs(histogram) < 0.0001:
            crossover = 'bearish'
        
        return macd_line, signal_line, histogram, crossover
    
    def get_required_inputs(self) -> list:
        return ['prices']
    
    def get_outputs(self) -> list:
        return ['macd_line', 'signal_line', 'histogram', 'crossover']


class MovingAverageNode(BaseNode):
    """Calculate Moving Average (SMA, EMA, WMA)"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate Moving Average
        
        Config:
            period: MA period (default: 20)
            ma_type: 'SMA', 'EMA', or 'WMA' (default: 'SMA')
        
        Input:
            prices: List of closing prices
        
        Output:
            ma_value: Moving average value
            trend: 'up', 'down', or 'sideways'
            price_position: 'above' or 'below' MA
        """
        period = self.config.get('period', 20)
        ma_type = self.config.get('ma_type', 'SMA').upper()
        
        if not input_data or 'prices' not in input_data:
            raise Exception("Moving Average node requires 'prices' in input data")
        
        prices = input_data['prices']
        
        if len(prices) < period:
            raise Exception(f"Need at least {period} prices for MA calculation")
        
        # Calculate MA based on type
        if ma_type == 'SMA':
            ma_value = self._calculate_sma(prices, period)
        elif ma_type == 'EMA':
            ma_value = self._calculate_ema(prices, period)
        elif ma_type == 'WMA':
            ma_value = self._calculate_wma(prices, period)
        else:
            raise Exception(f"Unknown MA type: {ma_type}")
        
        # Determine trend
        if len(prices) >= period + 5:
            prev_ma = self._calculate_sma(prices[:-5], period)
            if ma_value > prev_ma * 1.001:
                trend = 'up'
            elif ma_value < prev_ma * 0.999:
                trend = 'down'
            else:
                trend = 'sideways'
        else:
            trend = 'unknown'
        
        # Price position relative to MA
        current_price = prices[-1]
        price_position = 'above' if current_price > ma_value else 'below'
        
        return {
            'ma_value': round(ma_value, 5),
            'ma_type': ma_type,
            'period': period,
            'trend': trend,
            'price_position': price_position,
            'current_price': current_price
        }
    
    def _calculate_sma(self, prices: List[float], period: int) -> float:
        """Simple Moving Average"""
        return np.mean(prices[-period:])
    
    def _calculate_ema(self, prices: List[float], period: int) -> float:
        """Exponential Moving Average"""
        prices_array = np.array(prices)
        multiplier = 2 / (period + 1)
        ema = np.mean(prices_array[:period])
        
        for price in prices_array[period:]:
            ema = (price * multiplier) + (ema * (1 - multiplier))
        
        return ema
    
    def _calculate_wma(self, prices: List[float], period: int) -> float:
        """Weighted Moving Average"""
        prices_array = np.array(prices[-period:])
        weights = np.arange(1, period + 1)
        return np.sum(prices_array * weights) / np.sum(weights)
    
    def get_required_inputs(self) -> list:
        return ['prices']
    
    def get_outputs(self) -> list:
        return ['ma_value', 'ma_type', 'period', 'trend', 'price_position']


class BollingerBandsNode(BaseNode):
    """Calculate Bollinger Bands"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate Bollinger Bands
        
        Config:
            period: Period for MA (default: 20)
            std_dev: Standard deviation multiplier (default: 2)
        
        Input:
            prices: List of closing prices
        
        Output:
            upper_band: Upper Bollinger Band
            middle_band: Middle Band (SMA)
            lower_band: Lower Bollinger Band
            bandwidth: Band width
            price_position: 'above_upper', 'below_lower', or 'inside'
        """
        period = self.config.get('period', 20)
        std_dev = self.config.get('std_dev', 2)
        
        if not input_data or 'prices' not in input_data:
            raise Exception("Bollinger Bands node requires 'prices' in input data")
        
        prices = input_data['prices']
        
        if len(prices) < period:
            raise Exception(f"Need at least {period} prices for Bollinger Bands")
        
        # Calculate bands
        prices_array = np.array(prices[-period:])
        middle_band = np.mean(prices_array)
        std = np.std(prices_array)
        
        upper_band = middle_band + (std_dev * std)
        lower_band = middle_band - (std_dev * std)
        bandwidth = upper_band - lower_band
        
        # Determine price position
        current_price = prices[-1]
        if current_price > upper_band:
            price_position = 'above_upper'
        elif current_price < lower_band:
            price_position = 'below_lower'
        else:
            price_position = 'inside'
        
        return {
            'upper_band': round(upper_band, 5),
            'middle_band': round(middle_band, 5),
            'lower_band': round(lower_band, 5),
            'bandwidth': round(bandwidth, 5),
            'price_position': price_position,
            'current_price': current_price,
            'period': period,
            'std_dev': std_dev
        }
    
    def get_required_inputs(self) -> list:
        return ['prices']
    
    def get_outputs(self) -> list:
        return ['upper_band', 'middle_band', 'lower_band', 'bandwidth', 'price_position']


class ATRNode(BaseNode):
    """Calculate Average True Range (ATR) - Volatility Indicator"""
    
    async def execute(self, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calculate ATR
        
        Config:
            period: ATR period (default: 14)
        
        Input:
            high: List of high prices
            low: List of low prices
            close: List of closing prices
        
        Output:
            atr: ATR value
            volatility: 'high', 'medium', or 'low'
        """
        period = self.config.get('period', 14)
        
        if not input_data:
            raise Exception("ATR node requires price data")
        
        # Check for required inputs
        if 'high' not in input_data or 'low' not in input_data or 'close' not in input_data:
            raise Exception("ATR requires 'high', 'low', and 'close' prices")
        
        high = input_data['high']
        low = input_data['low']
        close = input_data['close']
        
        if len(high) < period + 1:
            raise Exception(f"Need at least {period + 1} bars for ATR calculation")
        
        # Calculate True Range
        true_ranges = []
        for i in range(1, len(high)):
            tr = max(
                high[i] - low[i],
                abs(high[i] - close[i-1]),
                abs(low[i] - close[i-1])
            )
            true_ranges.append(tr)
        
        # Calculate ATR (average of true ranges)
        atr = np.mean(true_ranges[-period:])
        
        # Determine volatility level
        avg_price = np.mean(close[-period:])
        atr_percentage = (atr / avg_price) * 100
        
        if atr_percentage > 2:
            volatility = 'high'
        elif atr_percentage > 1:
            volatility = 'medium'
        else:
            volatility = 'low'
        
        return {
            'atr': round(atr, 5),
            'atr_percentage': round(atr_percentage, 2),
            'volatility': volatility,
            'period': period
        }
    
    def get_required_inputs(self) -> list:
        return ['high', 'low', 'close']
    
    def get_outputs(self) -> list:
        return ['atr', 'atr_percentage', 'volatility']
