"""
Proxy endpoint to handle ngrok browser warning
"""
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
import httpx

router = APIRouter(prefix="/proxy", tags=["Proxy"])


@router.post("/tradingview")
async def tradingview_proxy(request: Request):
    """
    Proxy endpoint that TradingView can call directly
    This bypasses ngrok's browser warning by being on the same domain
    """
    try:
        # Get the request body
        body = await request.json()
        
        # Forward to the actual webhook endpoint
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/webhook/tradingview",
                json=body,
                timeout=30.0
            )
            
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code
            )
            
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )
