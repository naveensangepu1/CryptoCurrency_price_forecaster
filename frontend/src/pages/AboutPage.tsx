import React from 'react';
import type { CoinInfo } from '../types';

const h2 = 'font-serif text-xl font-semibold text-ink';

export const AboutPage: React.FC<{ coins: CoinInfo[] }> = ({ coins }) => (
  <div className="grid gap-x-16 gap-y-10 xl:grid-cols-[minmax(0,1fr)_280px]">
    <article className="max-w-2xl space-y-10 text-[15px] leading-relaxed text-ink-2">
      <p className="border-l-2 border-fc pl-4 text-ink">
        This is a learning project. Nothing here is financial, investment or trading advice, and you shouldn't buy or
        sell anything because of a forecast you see on this site. Crypto prices can move 10% in a day for reasons no
        chart can see coming.
      </p>

      <section id="how">
        <h2 className={h2}>How the forecast is made</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Download about a year of daily closing prices for the coin from Yahoo Finance.</li>
          <li>
            Pick a horizon of <em>n</em> days (1 to 30) and pair every day's close with the close <em>n</em> days
            later.
          </li>
          <li>
            Shuffle those pairs, fit a least-squares linear regression on
            80% of them and score it on the other 20%.
          </li>
          <li>
            Feed the last <em>n</em> closes through the fitted line. The outputs are the prices for the next <em>n</em>{' '}
            days.
          </li>
        </ol>
        <p className="mt-3">
          That's the whole model: one input, one straight line. It's deliberately simple so the numbers are easy to
          check by hand.
        </p>
      </section>

      <section id="metrics">
        <h2 className={h2}>Reading the numbers</h2>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="font-medium text-ink">R²</dt>
            <dd>
              How much of the movement in the test prices the line explains. 1.0 is perfect, 0 is no better than
              always guessing the average.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink">Mean absolute error (MAE)</dt>
            <dd>The average distance between the forecast and the real price on test days, in dollars or rupees.</dd>
          </div>
          <div>
            <dt className="font-medium text-ink">RMSE</dt>
            <dd>Like MAE, but big misses count for more. If RMSE is much larger than MAE, a few days went badly wrong.</dd>
          </div>
        </dl>
        <p className="mt-3">
          One caveat: the train/test split is random rather than by date, so the model has seen days on both sides of
          most test days. That makes the scores look better than they would on genuinely unseen future prices.
        </p>
      </section>

      <section id="limits">
        <h2 className={h2}>What it doesn't know</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>News, regulation, interest rates, exchange outages or anything else outside the price itself.</li>
          <li>Volume, order books, on-chain activity or social sentiment.</li>
          <li>Reversals. A straight line can't bend, so it keeps projecting the recent relationship forward.</li>
          <li>The future beyond a few days in any meaningful way. Treat a 30-day forecast as a trend line.</li>
        </ul>
      </section>

      <section id="data">
        <h2 className={h2}>Where the data comes from</h2>
        <p className="mt-3">
          Prices and the USD to INR rate come from Yahoo Finance through the{' '}
          <code className="font-mono text-[13px]">yfinance</code> library. The 7D chart uses hourly rows, the All
          chart uses weekly rows, and everything else is daily. Yahoo's numbers can lag the live market a little and
          occasionally have gaps.
        </p>
      </section>
    </article>

    <aside className="space-y-10">
      <section>
        <h3 className="border-b border-ink pb-1.5 font-serif text-lg font-semibold">Coins covered</h3>
        <ul className="divide-y divide-rule text-sm">
          {coins.map((c) => (
            <li key={c.symbol} className="flex items-baseline justify-between gap-3 py-2">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-medium">{c.name}</span>
              </span>
              <span className="text-right text-xs text-ink-3">{c.category}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="text-sm text-ink-2">
        <h3 className="border-b border-ink pb-1.5 font-serif text-lg font-semibold text-ink">Built with</h3>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-ink-3">Backend</dt>
          <dd>Hono on Netlify Server, Netlify Database</dd>
          <dt className="text-ink-3">Model</dt>
          <dd>Least-squares linear regression (TypeScript)</dd>
          <dt className="text-ink-3">Data</dt>
          <dd>Yahoo Finance chart API</dd>
          <dt className="text-ink-3">Frontend</dt>
          <dd>React, TypeScript, Vite</dd>
          <dt className="text-ink-3">Charts</dt>
          <dd>Recharts</dd>
          <dt className="text-ink-3">Styling</dt>
          <dd>Tailwind CSS</dd>
        </dl>
      </section>
    </aside>
  </div>
);
