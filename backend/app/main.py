from datetime import datetime, timezone
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware

from .config import SUPPORTED_COINS, VALID_RANGES
from .models.schemas import (
    CoinInfo,
    MarketSummaryResponse,
    HistoricalDataResponse,
    ForecastResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserProfile,
    AuthResponse
)
from .services.market_data import get_market_overview, get_coin_historical_data
from .services.forecaster import run_price_forecast
from .services.currency import get_usd_to_inr_rate
from .services.auth import login_user, register_user, get_user_by_token

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("crypto-forecaster-api")

app = FastAPI(
    title="Cryptocurrency Price Forecaster API",
    description="Full-stack forecasting API leveraging Yahoo Finance market data and Scikit-Learn Linear Regression.",
    version="2.0.0"
)

# Enable CORS for local development and production hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Cryptocurrency Price Forecaster Backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# ----------------- Auth Endpoints ----------------- #
@app.post("/api/auth/login", response_model=AuthResponse)
def login_endpoint(credentials: UserLoginRequest):
    """Authenticate a user with email and password."""
    try:
        user = login_user(credentials.email, credentials.password)
        return AuthResponse(user=user, message="Login successful")
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/auth/register", response_model=AuthResponse)
def register_endpoint(user_data: UserRegisterRequest):
    """Register a new user account."""
    try:
        user = register_user(user_data.name, user_data.email, user_data.password)
        return AuthResponse(user=user, message="Registration successful")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/auth/me", response_model=UserProfile)
def get_current_user_endpoint(authorization: Optional[str] = Header(None)):
    """Retrieve current user profile by bearer token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return user

# ----------------- Market Data Endpoints ----------------- #
@app.get("/api/coins", response_model=List[CoinInfo])
def get_supported_coins():
    """Retrieve metadata for all supported cryptocurrencies."""
    return list(SUPPORTED_COINS.values())

@app.get("/api/rate/usd-inr")
def get_exchange_rate():
    """Retrieve the current USD to INR exchange rate."""
    rate = get_usd_to_inr_rate()
    return {
        "base": "USD",
        "target": "INR",
        "rate": rate,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/market/overview", response_model=MarketSummaryResponse)
def get_market_overview_endpoint():
    """Retrieve 24-hour summary, sparklines, and USD/INR prices for all 8 coins."""
    try:
        coins = get_market_overview()
        usd_inr = get_usd_to_inr_rate()
        return MarketSummaryResponse(
            coins=coins,
            usd_to_inr_rate=usd_inr,
            last_updated=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        logger.error(f"Failed to generate market overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/historical/{symbol}", response_model=HistoricalDataResponse)
def get_historical_data_endpoint(
    symbol: str,
    range: str = Query("1Y", description="Time range: 7D, 1M, 3M, 6M, 1Y, ALL")
):
    """Retrieve historical OHLC time-series data and summary stats for a coin."""
    if symbol not in SUPPORTED_COINS:
        raise HTTPException(
            status_code=404,
            detail=f"Coin symbol '{symbol}' not found. Supported symbols: {list(SUPPORTED_COINS.keys())}"
        )
    
    range_clean = range.upper()
    if range_clean not in VALID_RANGES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid range '{range}'. Valid ranges are: {list(VALID_RANGES.keys())}"
        )

    try:
        data = get_coin_historical_data(symbol, range_clean)
        return data
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast/{symbol}", response_model=ForecastResponse)
def get_price_forecast_endpoint(
    symbol: str,
    days: int = Query(7, ge=1, le=30, description="Forecast horizon in days (1 to 30)")
):
    """Generate linear regression price forecast and model evaluation metrics."""
    if symbol not in SUPPORTED_COINS:
        raise HTTPException(
            status_code=404,
            detail=f"Coin symbol '{symbol}' not found. Supported symbols: {list(SUPPORTED_COINS.keys())}"
        )

    try:
        forecast = run_price_forecast(symbol, days)
        return forecast
    except Exception as e:
        logger.error(f"Forecasting error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
