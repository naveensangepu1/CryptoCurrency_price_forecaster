"""
Checks on the regression itself.

With the fake prices from conftest (100, 101, 102 ...), the close n days later is always
today's close + n. A straight line fits that exactly, so the expected forecast is known.
"""

import pandas as pd
import pytest

from app.services import forecaster
from app.services.market_data import fetch_ticker_history
from tests.conftest import FAKE_USD_INR


@pytest.mark.parametrize("n_days", [1, 7, 30])
def test_forecast_on_a_straight_line_is_exact(n_days):
    closes = fetch_ticker_history("BTC-USD", "1Y")["Close"].tolist()
    result = forecaster.run_price_forecast("BTC-USD", n_days)

    assert result.metrics.r2_score == pytest.approx(1.0)
    assert result.metrics.mae == pytest.approx(0.0, abs=1e-6)
    assert len(result.forecast) == n_days

    # Day i is predicted from the close (n_days - i + 1) rows before the end, plus n_days.
    expected = [c + n_days for c in closes[-n_days:]]
    assert [p.predicted_usd for p in result.forecast] == pytest.approx(expected)


def test_forecast_converts_to_inr_and_reports_change_from_latest_close():
    result = forecaster.run_price_forecast("SOL-USD", 7)
    for p in result.forecast:
        assert p.predicted_inr == pytest.approx(p.predicted_usd * FAKE_USD_INR, abs=0.01)
        expected_pct = (p.predicted_usd - result.current_price_usd) / result.current_price_usd * 100
        assert p.delta_percentage == pytest.approx(expected_pct, abs=0.01)


def test_train_test_split_is_80_20():
    m = forecaster.run_price_forecast("BTC-USD", 7).metrics
    total = m.train_samples + m.test_samples
    assert m.test_samples == pytest.approx(total * 0.2, abs=1)


def test_unsupported_coin_raises():
    with pytest.raises(ValueError):
        forecaster.run_price_forecast("FAKE-USD", 7)


def test_too_little_history_raises(monkeypatch):
    tiny = pd.DataFrame({"Date": ["2026-01-01"] * 10, "Close": [1.0] * 10})
    monkeypatch.setattr(forecaster, "fetch_ticker_history", lambda *_args, **_kwargs: tiny)
    with pytest.raises(ValueError, match="Insufficient"):
        forecaster.run_price_forecast("BTC-USD", 7)
