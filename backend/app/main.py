from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth, mt5, trades, symbols, watchlist, notifications, websocket, webhook
from app.agentic.routers import workflows, execution, nodes, scheduler
from app.backtest.router import router as backtest_router

settings = get_settings()

app = FastAPI(
    title="Trading Maven API",
    description="TradingView to MT5 Bridge - Ultra-low latency trading",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    # Allow explicit origins from settings and common localhost variants
    allow_origins=settings.cors_origins_list or [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    # Regex fallback for local development hosts
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(mt5.router, prefix="/api")
app.include_router(trades.router, prefix="/api")
app.include_router(symbols.router, prefix="/api")
app.include_router(watchlist.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(webhook.router, prefix="/api")
app.include_router(websocket.router)

# Agentic system routers
app.include_router(workflows.router, prefix="/api/agentic")
app.include_router(execution.router, prefix="/api/agentic")
app.include_router(nodes.router)
app.include_router(scheduler.router, prefix="/api/agentic")

# Backtest system router
app.include_router(backtest_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Trading Maven API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "trading-bridge-api"
    }


@app.on_event("startup")
async def startup_event():
    print("🚀 Trading Maven API Started")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"🔄 WebSocket Endpoint: ws://localhost:8000/ws")


@app.on_event("shutdown")
async def shutdown_event():
    from app.mt5_handler import mt5_handler
    await mt5_handler.shutdown()
    print("👋 Trading Maven API Shutdown")
