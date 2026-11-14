import React from 'react';
import type { AppData } from '../types';
import { WatchlistLayout } from '../components/WatchlistLayout';
import { CoinSelector } from '../components/CoinSelector';
import { ForecastPanel } from '../components/ForecastPanel';

export const ForecastPage: React.FC<{ data: AppData }> = ({ data }) => (
  <WatchlistLayout
    data={data}
    aside={
      <section className="text-sm leading-relaxed text-ink-2">
        <h3 className="border-b border-ink pb-1.5 font-serif text-lg font-semibold text-ink">Picking a horizon</h3>
        <p className="mt-3">
          Short horizons fit best because tomorrow's price is usually close to today's: a 1-day forecast typically
          scores an R² above 0.9. Past two weeks it drops quickly, and at 30 days it's often below 0.5, which is
          closer to a guess than a forecast.
        </p>
        <a
          href="#/about"
          className="mt-2 inline-block text-[13px] underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
        >
          What R², MAE and RMSE mean
        </a>
      </section>
    }
  >
    <CoinSelector
      compact
      coins={data.coins}
      selectedSymbol={data.selectedSymbol}
      onSelectCoin={data.onSelectCoin}
      activeSummary={data.activeSummary}
      currencyMode={data.currencyMode}
    />
    <ForecastPanel
      forecast={data.forecastData}
      selectedDays={data.forecastDays}
      onDaysChange={data.onForecastDaysChange}
      onRunForecast={data.onRunForecast}
      isLoading={data.isLoadingForecast}
      currencyMode={data.currencyMode}
      usdInrRate={data.usdInrRate}
    />
  </WatchlistLayout>
);
