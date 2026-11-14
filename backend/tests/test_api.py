"""HTTP-level checks for every endpoint the frontend calls."""

from datetime import date, timedelta

import pytest

from app.config import SUPPORTED_COINS, VALID_RANGES
from tests.conftest import FAKE_LAST_DAY, FAKE_USD_INR


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_coins_lists_all_supported_coins(client):
    res = client.get("/api/coins")
    assert res.status_code == 200
    assert [c["symbol"] for c in res.json()] == list(SUPPORTED_COINS)


def test_usd_inr_rate_comes_from_yahoo(client):
    assert client.get("/api/rate/usd-inr").json()["rate"] == FAKE_USD_INR


# ---------- auth ----------


def test_demo_login(client):
    res = client.post("/api/auth/login", json={"email": "demo@crypto.com", "password": "password123"})
    assert res.status_code == 200
    assert res.json()["user"]["name"] == "Demo Trader"


def test_login_with_wrong_password_is_rejected(client):
    res = client.post("/api/auth/login", json={"email": "demo@crypto.com", "password": "nope"})
    assert res.status_code == 401


def test_register_then_fetch_profile_with_token(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "ci-user@example.com", "password": "secret123"},
    )
    assert res.status_code == 200
    token = res.json()["user"]["token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "ci-user@example.com"

    again = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "ci-user@example.com", "password": "secret123"},
    )
    assert again.status_code == 400, "registering the same email twice should fail"


def test_profile_without_token_is_rejected(client):
    assert client.get("/api/auth/me").status_code == 401


# ---------- market data ----------


def test_market_overview_has_every_coin_with_prices(client):
    res = client.get("/api/market/overview")
    assert res.status_code == 200
    body = res.json()
    assert body["usd_to_inr_rate"] == FAKE_USD_INR
    assert len(body["coins"]) == len(SUPPORTED_COINS)
    for coin in body["coins"]:
        assert coin["current_price_usd"] > 0
        assert coin["current_price_inr"] == pytest.approx(coin["current_price_usd"] * FAKE_USD_INR, abs=0.01)
        assert coin["price_change_percentage_24h"] > 0  # fake prices only go up
        assert coin["sparkline"], "sparkline should not be empty"


@pytest.mark.parametrize("range_key", list(VALID_RANGES))
def test_historical_data_for_every_range(client, range_key):
    res = client.get(f"/api/market/historical/BTC-USD?range={range_key}")
    assert res.status_code == 200
    points = res.json()["points"]
    assert points
    # The chart parses "YYYY-MM-DD" for daily/weekly rows and "YYYY-MM-DD HH:MM" for hourly ones.
    expected_len = 16 if range_key == "7D" else 10
    assert all(len(p["date"]) == expected_len for p in points)


def test_historical_rejects_unknown_coin_and_range(client):
    assert client.get("/api/market/historical/FAKE-USD").status_code == 404
    assert client.get("/api/market/historical/BTC-USD?range=2Y").status_code == 400


# ---------- forecast ----------


def test_forecast_returns_one_point_per_day(client):
    res = client.get("/api/forecast/ETH-USD?days=5")
    assert res.status_code == 200
    body = res.json()
    assert body["n_days"] == 5
    last = date.fromisoformat(FAKE_LAST_DAY)
    assert [p["date"] for p in body["forecast"]] == [str(last + timedelta(days=i)) for i in range(1, 6)]


@pytest.mark.parametrize("days", [0, 31])
def test_forecast_horizon_must_be_1_to_30(client, days):
    assert client.get(f"/api/forecast/BTC-USD?days={days}").status_code == 422


def test_forecast_rejects_unknown_coin(client):
    assert client.get("/api/forecast/FAKE-USD").status_code == 404
