import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from ..config import SUPPORTED_COINS, DEFAULT_USD_INR_RATE
from .market_data import fetch_ticker_history
from .currency import get_usd_to_inr_rate
from ..models.schemas import ForecastPoint, ForecastMetrics, ForecastResponse, HistoricalPoint

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "ALL INVESTMENTS ARE SUBJECT TO PRICE FLUCTUATIONS AND OTHER MARKET RISKS. "
    "This tool is strictly for educational, analytical, and demonstration purposes. "
    "Predictions are generated using a simple Linear Regression model fitted on historical closing prices "
    "and should not be construed as investment, financial, or trading advice."
)

def run_price_forecast(symbol: str, n_days: int = 7) -> ForecastResponse:
    """
    Executes the Linear Regression cryptocurrency price forecaster.
    Preserves original logic from app.py:
      - Creates target column shifted by -n_days
      - Splits into 80% train and 20% test
      - Fits LinearRegression
      - Evaluates R² score on test split
      - Uses latest n_days prices as projection input
    """
    if symbol not in SUPPORTED_COINS:
        raise ValueError(f"Coin '{symbol}' is not supported.")

    n_days = max(1, min(30, int(n_days)))
    coin_meta = SUPPORTED_COINS[symbol]
    usd_inr = get_usd_to_inr_rate()

    # Fetch daily historical data (1 to 2 years) for reliable training
    df = fetch_ticker_history(symbol, range_key="1Y")
    if df.empty or len(df) < (n_days + 15):
        df = fetch_ticker_history(symbol, range_key="ALL")

    if df.empty or len(df) < (n_days + 10):
        raise ValueError(f"Insufficient historical data points available to train model for {symbol}.")

    # Clean and extract Close prices
    clean_df = df.dropna(subset=["Close"]).copy()
    clean_df["Close"] = pd.to_numeric(clean_df["Close"], errors="coerce")
    clean_df = clean_df.dropna(subset=["Close"])

    total_rows = len(clean_df)
    if total_rows <= n_days:
        raise ValueError(f"Not enough data points ({total_rows}) for a {n_days}-day forecast horizon.")

    # Feature and Target formulation as in app.py:
    # Target is Close shifted back by n_days
    target_col = f"{n_days}_Day_Price_Forecast"
    clean_df[target_col] = clean_df["Close"].shift(-n_days)

    # X and y vectors excluding the trailing shifted NaNs
    valid_data = clean_df.dropna(subset=[target_col])
    X = valid_data[["Close"]].values
    y = valid_data[target_col].values

    if len(X) < 10:
        raise ValueError("Too few training samples after applying shift horizon.")

    # Train-test split (80/20) with random_state=42 for deterministic reproducible results
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Linear Regression model
    model = LinearRegression()
    model.fit(X_train, y_train)

    # Evaluate metrics
    test_preds = model.predict(X_test)
    r2 = float(model.score(X_test, y_test))
    mae = float(mean_absolute_error(y_test, test_preds))
    try:
        rmse = float(root_mean_squared_error(y_test, test_preds))
    except Exception:
        rmse = float(np.sqrt(np.mean((y_test - test_preds) ** 2)))

    # Projection input: the last n_days of observed closing prices
    x_projection = clean_df[["Close"]].values[-n_days:]
    predictions = model.predict(x_projection)

    current_price = float(clean_df["Close"].iloc[-1])
    current_date_str = str(clean_df["Date"].iloc[-1])
    try:
        last_date = datetime.strptime(current_date_str[:10], "%Y-%m-%d")
    except Exception:
        last_date = datetime.now()

    # Generate forecast points with calendar dates and INR conversions
    forecast_points: List[ForecastPoint] = []
    for i, pred_val in enumerate(predictions):
        day_num = i + 1
        future_date = (last_date + timedelta(days=day_num)).strftime("%Y-%m-%d")
        p_val = float(pred_val)
        delta_pct = ((p_val - current_price) / current_price * 100.0) if current_price != 0 else 0.0

        forecast_points.append(
            ForecastPoint(
                day=day_num,
                date=future_date,
                predicted_usd=round(p_val, 4),
                predicted_inr=round(p_val * usd_inr, 2),
                delta_percentage=round(delta_pct, 2)
            )
        )

    # Recent historical close points (last 30 points) for chart context
    recent_df = clean_df.tail(30)
    recent_history: List[HistoricalPoint] = []
    for _, row in recent_df.iterrows():
        recent_history.append(
            HistoricalPoint(
                date=str(row["Date"]),
                open=round(float(row.get("Open", row["Close"])), 4),
                high=round(float(row.get("High", row["Close"])), 4),
                low=round(float(row.get("Low", row["Close"])), 4),
                close=round(float(row["Close"]), 4),
                volume=round(float(row.get("Volume", 0.0)), 2)
            )
        )

    metrics = ForecastMetrics(
        r2_score=round(r2, 4),
        r2_percentage=round(r2 * 100.0, 2),
        mae=round(mae, 4),
        rmse=round(rmse, 4),
        train_samples=len(X_train),
        test_samples=len(X_test),
        model_type="Linear Regression (scikit-learn)"
    )

    return ForecastResponse(
        symbol=symbol,
        ticker=coin_meta["ticker"],
        name=coin_meta["name"],
        n_days=n_days,
        current_price_usd=round(current_price, 4),
        current_price_inr=round(current_price * usd_inr, 2),
        usd_to_inr_rate=usd_inr,
        forecast=forecast_points,
        metrics=metrics,
        historical_close=recent_history,
        disclaimer=DISCLAIMER_TEXT
    )
