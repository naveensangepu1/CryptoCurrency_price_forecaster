from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class CoinInfo(BaseModel):
    symbol: str
    ticker: str
    name: str
    color: str
    category: str
    description: str

class MarketSummaryItem(BaseModel):
    symbol: str
    ticker: str
    name: str
    color: str
    category: str
    current_price_usd: float
    current_price_inr: float
    price_change_24h: float
    price_change_percentage_24h: float
    high_24h: float
    low_24h: float
    volume_24h: float
    sparkline: List[float] = []

class MarketSummaryResponse(BaseModel):
    coins: List[MarketSummaryItem]
    usd_to_inr_rate: float
    last_updated: str

class HistoricalPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class HistoricalDataResponse(BaseModel):
    symbol: str
    ticker: str
    name: str
    range: str
    points: List[HistoricalPoint]
    latest_price_usd: float
    latest_price_inr: float
    usd_to_inr_rate: float
    statistics: Dict[str, Any]

class ForecastPoint(BaseModel):
    day: int
    date: str
    predicted_usd: float
    predicted_inr: float
    delta_percentage: float

class ForecastMetrics(BaseModel):
    r2_score: float
    r2_percentage: float
    mae: float
    rmse: float
    train_samples: int
    test_samples: int
    model_type: str = "Linear Regression (scikit-learn)"

class ForecastResponse(BaseModel):
    symbol: str
    ticker: str
    name: str
    n_days: int
    current_price_usd: float
    current_price_inr: float
    usd_to_inr_rate: float
    forecast: List[ForecastPoint]
    metrics: ForecastMetrics
    historical_close: List[HistoricalPoint]
    disclaimer: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    token: str
    created_at: str

class AuthResponse(BaseModel):
    user: UserProfile
    message: str

