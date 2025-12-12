from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas import SymbolSearchResponse, JSONGeneratorResponse
from app.dependencies import get_current_user
from app.models import User
from app.mt5_handler import mt5_handler
import json

router = APIRouter(prefix="/symbols", tags=["Symbols"])


@router.get("/search", response_model=List[SymbolSearchResponse])
async def search_symbols(
    query: str,
    current_user: User = Depends(get_current_user)
):
    """Search for symbols with autocomplete"""
    
    if not query or len(query) < 1:
        return []
    
    # Initialize MT5 if not already
    await mt5_handler.initialize()
    
    # Search symbols
    results = await mt5_handler.search_symbols(query)
    
    return results


@router.get("/all")
async def get_all_symbols(current_user: User = Depends(get_current_user)):
    """Get all available symbols"""
    
    await mt5_handler.initialize()
    symbols = await mt5_handler.get_symbols()
    
    return {"symbols": symbols, "count": len(symbols)}


@router.get("/{symbol}/info")
async def get_symbol_info(
    symbol: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a symbol"""
    
    await mt5_handler.initialize()
    info = await mt5_handler.get_symbol_info(symbol)
    
    if not info:
        raise HTTPException(status_code=404, detail="Symbol not found")
    
    return {
        "symbol": symbol,
        "bid": info["bid"],
        "ask": info["ask"],
        "last": info["last"],
        "volume": info["volume"]
    }


@router.post("/generate-json", response_model=JSONGeneratorResponse)
async def generate_tradingview_json(
    symbol: str,
    action: str,
    volume: float = 0.01,
    stop_loss: float = None,
    take_profit: float = None,
    current_user: User = Depends(get_current_user)
):
    """Generate JSON message for TradingView alerts"""
    
    if action.upper() not in ["BUY", "SELL", "CLOSE"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be BUY, SELL, or CLOSE"
        )
    
    message = {
        "api_key": current_user.api_key,
        "action": action.upper(),
        "symbol": symbol,
        "volume": volume,
    }
    
    if stop_loss:
        message["stop_loss"] = stop_loss
    
    if take_profit:
        message["take_profit"] = take_profit
    
    # Create formatted example
    example = json.dumps(message, indent=2)
    
    return {
        "message": message,
        "example": example
    }


@router.get("/generate-json/template")
async def get_json_template(current_user: User = Depends(get_current_user)):
    """Get a template for TradingView JSON messages"""
    
    template = {
        "api_key": current_user.api_key,
        "action": "BUY or SELL or CLOSE",
        "symbol": "EURUSD",
        "volume": 0.01,
        "stop_loss": "optional",
        "take_profit": "optional"
    }
    
    instructions = """
How to use in TradingView:

1. Create a new alert in TradingView
2. In the alert message, paste the JSON template
3. Replace the values with your desired settings
4. Use {{close}} or {{open}} for dynamic prices
5. Set the webhook URL to your WebSocket endpoint

Example:
{
  "api_key": "your_api_key_here",
  "action": "BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stop_loss": {{close}} - 0.0050,
  "take_profit": {{close}} + 0.0100
}

Note: Your API Key is: """ + current_user.api_key + """
Your WebSocket URL is: """ + current_user.websocket_url
    
    return {
        "template": template,
        "instructions": instructions,
        "example": json.dumps(template, indent=2)
    }
