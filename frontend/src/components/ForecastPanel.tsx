import React, { useState } from 'react';
import type { ForecastResponse, CurrencyMode } from '../types';
import { money, signedPct, dayMonth } from '../lib/format';
import { ForecastChart } from './ForecastChart';

interface ForecastPanelProps {
  forecast: ForecastResponse | null;
  selectedDays: number;
  onDaysChange: (days: number) => void;
  onRunForecast: (days: number) => void;
  isLoading: boolean;
  currencyMode: CurrencyMode;
  usdInrRate: number;
}

const PRESETS = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '30 days' },
];

export const ForecastPanel: React.FC<ForecastPanelProps> = ({
  forecast,
  selectedDays,
  onDaysChange,
  onRunForecast,
  isLoading,
  currencyMode,
  usdInrRate,
}) => {
  const [showAll, setShowAll] = useState(false);

  const last = forecast?.forecast[forecast.forecast.length - 1];
  const rows = forecast ? (showAll ? forecast.forecast : forecast.forecast.slice(0, 7)) : [];
  const m = forecast?.metrics;
  const toMode = (usd: number) => (currencyMode === 'USD' ? usd : usd * usdInrRate);

  return (
    <section aria-labelledby="forecast-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2">
        <h3 id="forecast-heading" className="font-serif text-xl font-semibold">
          Next {selectedDays} {selectedDays === 1 ? 'day' : 'days'}
        </h3>
        <span className="text-xs text-ink-3">Linear regression (scikit-learn), 80/20 train/test split</span>
      </div>

      {/* Horizon */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
        <label htmlFor="horizon" className="text-ink-2">
          Days ahead
        </label>
        <div className="flex items-center gap-2">
          <input
            id="horizon"
            type="range"
            min={1}
            max={30}
            value={selectedDays}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="w-40 sm:w-56"
          />
          <output htmlFor="horizon" className="w-6 text-right font-mono tabular-nums">
            {selectedDays}
          </output>
        </div>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => onDaysChange(p.days)}
              className={`rounded-[3px] border px-2 py-0.5 text-xs transition-colors ${
                selectedDays === p.days
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule text-ink-2 hover:border-ink-3'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-3">
          {isLoading ? (
            'Working it out…'
          ) : (
            <button onClick={() => onRunForecast(selectedDays)} className="underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink">
              Run again
            </button>
          )}
        </span>
      </div>

      {!forecast && !isLoading && (
        <p className="mt-6 text-sm text-ink-3">No forecast yet. Pick a coin and a number of days.</p>
      )}

      {forecast && last && m && (
        <div className={`transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
          {/* The result, in words */}
          <p className="mt-6 max-w-2xl text-[15px] leading-relaxed">
            In {forecast.n_days} {forecast.n_days === 1 ? 'day' : 'days'} ({dayMonth(last.date)}) the model puts{' '}
            {forecast.ticker} at{' '}
            <strong className="font-mono font-medium tabular-nums">
              {money(currencyMode === 'USD' ? last.predicted_usd : last.predicted_inr, currencyMode)}
            </strong>
            . That's{' '}
            <span className={last.delta_percentage >= 0 ? 'text-up' : 'text-down'}>
              {Math.abs(last.delta_percentage).toFixed(2)}% {last.delta_percentage >= 0 ? 'above' : 'below'}
            </span>{' '}
            the latest close of{' '}
            <span className="font-mono tabular-nums">
              {money(currencyMode === 'USD' ? forecast.current_price_usd : forecast.current_price_inr, currencyMode)}
            </span>
            .{' '}
            <span className="text-ink-3">
              {currencyMode === 'USD'
                ? `In rupees that's ${money(last.predicted_inr, 'INR')}`
                : `In dollars that's ${money(last.predicted_usd, 'USD')}`}{' '}
              at ₹{usdInrRate.toFixed(2)} to the dollar.
            </span>
          </p>

          <div className="mt-6">
            <ForecastChart forecast={forecast} currencyMode={currencyMode} usdInrRate={usdInrRate} />
          </div>

          {/* How good is the fit */}
          <dl className="mt-5 grid grid-cols-2 border-y border-rule text-sm sm:grid-cols-4">
            <div className="py-3 pr-4">
              <dt className="text-xs text-ink-3">R² on test data</dt>
              <dd className="mt-0.5 font-mono text-lg tabular-nums">{m.r2_score.toFixed(3)}</dd>
              <dd className="text-xs text-ink-3">1.000 would be a perfect fit</dd>
            </div>
            <div className="border-l border-rule py-3 px-4">
              <dt className="text-xs text-ink-3">Mean absolute error</dt>
              <dd className="mt-0.5 font-mono text-lg tabular-nums">{money(toMode(m.mae), currencyMode)}</dd>
              <dd className="text-xs text-ink-3">typical miss on test days</dd>
            </div>
            <div className="border-t border-rule py-3 pr-4 sm:border-t-0 sm:border-l sm:px-4">
              <dt className="text-xs text-ink-3">RMSE</dt>
              <dd className="mt-0.5 font-mono text-lg tabular-nums">{money(toMode(m.rmse), currencyMode)}</dd>
              <dd className="text-xs text-ink-3">weights big misses more</dd>
            </div>
            <div className="border-t border-l border-rule py-3 px-4 sm:border-t-0">
              <dt className="text-xs text-ink-3">Rows used</dt>
              <dd className="mt-0.5 font-mono text-lg tabular-nums">
                {m.train_samples} / {m.test_samples}
              </dd>
              <dd className="text-xs text-ink-3">train / test</dd>
            </div>
          </dl>

          {m.r2_score < 0.5 && (
            <p className="mt-3 border-l-2 border-fc pl-3 text-sm text-ink-2">
              The fit is weak for this horizon (R² below 0.5), so read this forecast as a rough direction at best.
            </p>
          )}

          {/* Day by day */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="pb-2 text-left text-xs text-ink-3">
                Day-by-day, compared with the latest close
              </caption>
              <thead>
                <tr className="border-b border-ink text-left text-xs text-ink-3">
                  <th className="py-1.5 pr-3 font-normal">Day</th>
                  <th className="py-1.5 pr-3 font-normal">Date</th>
                  <th className={`py-1.5 pr-3 text-right font-normal ${currencyMode === 'USD' ? '' : 'hidden sm:table-cell'}`}>USD</th>
                  <th className={`py-1.5 pr-3 text-right font-normal ${currencyMode === 'INR' ? '' : 'hidden sm:table-cell'}`}>INR</th>
                  <th className="py-1.5 text-right font-normal">Change</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rows.map((fp) => (
                  <tr key={fp.day} className="border-b border-rule/70 hover:bg-hover/50">
                    <td className="py-1.5 pr-3 text-ink-3">+{fp.day}</td>
                    <td className="py-1.5 pr-3 font-sans">{dayMonth(fp.date)}</td>
                    <td className={`py-1.5 pr-3 text-right ${currencyMode === 'USD' ? 'text-ink' : 'hidden text-ink-3 sm:table-cell'}`}>
                      {money(fp.predicted_usd, 'USD')}
                    </td>
                    <td className={`py-1.5 pr-3 text-right ${currencyMode === 'INR' ? 'text-ink' : 'hidden text-ink-3 sm:table-cell'}`}>
                      {money(fp.predicted_inr, 'INR')}
                    </td>
                    <td className={`py-1.5 text-right ${fp.delta_percentage >= 0 ? 'text-up' : 'text-down'}`}>
                      {signedPct(fp.delta_percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {forecast.forecast.length > 7 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-xs text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              {showAll ? 'Show the first 7 days only' : `Show all ${forecast.forecast.length} days`}
            </button>
          )}
        </div>
      )}
    </section>
  );
};
