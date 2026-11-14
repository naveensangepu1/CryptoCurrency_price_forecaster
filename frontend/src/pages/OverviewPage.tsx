import React from 'react';
import type { AppData } from '../types';
import { WatchlistLayout } from '../components/WatchlistLayout';
import { CoinSelector } from '../components/CoinSelector';
import { PriceChart } from '../components/PriceChart';
import { money, signedPct, dayMonth } from '../lib/format';

const linkClass = 'text-[13px] text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink';

export const OverviewPage: React.FC<{ data: AppData }> = ({ data }) => {
  const f = data.forecastData;
  const last = f?.forecast[f.forecast.length - 1];
  const mode = data.currencyMode;

  return (
    <WatchlistLayout
      data={data}
      aside={
        <section aria-labelledby="about-heading" className="text-sm leading-relaxed text-ink-2">
          <h3 id="about-heading" className="border-b border-ink pb-1.5 font-serif text-lg font-semibold text-ink">
            How the forecast works
          </h3>
          <p className="mt-3">
            To look <em>n</em> days ahead, the model learns how each day's close relates to the close <em>n</em> days
            later. Then it runs the last <em>n</em> closes through that line.
          </p>
          <p className="mt-2">
            It only sees past prices, not news or sentiment, so it's good for spotting a trend and bad at predicting
            surprises.
          </p>
          <a href="#/about" className={`mt-2 inline-block ${linkClass}`}>
            More about the model
          </a>
        </section>
      }
    >
      <CoinSelector
        coins={data.coins}
        selectedSymbol={data.selectedSymbol}
        onSelectCoin={data.onSelectCoin}
        activeSummary={data.activeSummary}
        currencyMode={mode}
      />

      <PriceChart
        points={data.historicalPoints}
        symbol={data.selectedSymbol}
        ticker={data.ticker}
        range={data.selectedRange}
        onRangeChange={data.onRangeChange}
        currencyMode={mode}
        usdInrRate={data.usdInrRate}
        forecastPoints={f?.forecast}
        isLoading={data.isLoadingHistory}
      />

      <section aria-labelledby="snapshot-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
          <h3 id="snapshot-heading" className="font-serif text-xl font-semibold">
            Forecast in brief
          </h3>
          <a href="#/forecast" className={linkClass}>
            Open the full forecast
          </a>
        </div>
        {f && last ? (
          <p className={`mt-3 max-w-2xl text-[15px] leading-relaxed ${data.isLoadingForecast ? 'opacity-50' : ''}`}>
            The {f.n_days}-day forecast puts {f.ticker} at{' '}
            <strong className="font-mono font-medium tabular-nums">
              {money(mode === 'USD' ? last.predicted_usd : last.predicted_inr, mode)}
            </strong>{' '}
            on {dayMonth(last.date)},{' '}
            <span className={last.delta_percentage >= 0 ? 'text-up' : 'text-down'}>
              {signedPct(last.delta_percentage)}
            </span>{' '}
            from the latest close. On held-out days the line scores R² {f.metrics.r2_score.toFixed(3)} and misses by
            about {money(mode === 'USD' ? f.metrics.mae : f.metrics.mae * data.usdInrRate, mode)} on average.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-3">
            {data.isLoadingForecast ? 'Working out the forecast…' : 'No forecast yet.'}
          </p>
        )}
      </section>
    </WatchlistLayout>
  );
};
