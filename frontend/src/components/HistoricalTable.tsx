import React, { useState } from 'react';
import { Download } from 'lucide-react';
import type { HistoricalPoint, CurrencyMode } from '../types';
import { TextTabs } from './TextTabs';
import { money, compactMoney, fullDate } from '../lib/format';

interface HistoricalTableProps {
  points: HistoricalPoint[];
  ticker: string;
  currencyMode: CurrencyMode;
  usdInrRate: number;
}

type Order = 'newest' | 'oldest';

export const HistoricalTable: React.FC<HistoricalTableProps> = ({ points, ticker, currencyMode, usdInrRate }) => {
  const [order, setOrder] = useState<Order>('newest');

  const rate = currencyMode === 'INR' ? usdInrRate : 1;
  const rows = order === 'newest' ? [...points].reverse() : points;

  const exportCSV = () => {
    if (!points.length) return;
    const header = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];
    const lines = points.map((p) =>
      [
        p.date,
        (p.open * rate).toFixed(4),
        (p.high * rate).toFixed(4),
        (p.low * rate).toFixed(4),
        (p.close * rate).toFixed(4),
        p.volume,
      ].join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ticker}_history_${currencyMode}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="history-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-2">
        <h3 id="history-heading" className="font-serif text-xl font-semibold">
          Price table <span className="font-sans text-sm font-normal text-ink-3">{points.length} rows</span>
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-[13px]">
          <TextTabs
            label="Row order"
            value={order}
            onChange={setOrder}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
            ]}
          />
          <button
            onClick={exportCSV}
            disabled={!points.length}
            className="inline-flex items-center gap-1.5 rounded-[3px] border border-rule bg-card px-2.5 py-1 text-xs text-ink-2 hover:border-ink-3 hover:text-ink disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            CSV ({currencyMode})
          </button>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="mt-4 text-sm text-ink-3">No rows for this range.</p>
      ) : (
        // Open and volume are dropped on phones so the table fits without sideways scrolling.
        <div className="mt-2 max-h-[560px] overflow-auto">
          <table className="w-full text-[13px] sm:text-sm">
            <thead className="sticky top-0 bg-paper">
              <tr className="border-b border-ink text-left text-xs text-ink-3">
                <th className="py-1.5 pr-3 font-normal">Date</th>
                <th className="hidden py-1.5 pr-3 text-right font-normal sm:table-cell">Open</th>
                <th className="py-1.5 pr-3 text-right font-normal">High</th>
                <th className="py-1.5 pr-3 text-right font-normal">Low</th>
                <th className="py-1.5 text-right font-normal sm:pr-3">Close</th>
                <th className="hidden py-1.5 text-right font-normal sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((r) => (
                <tr key={r.date} className="border-b border-rule/70 hover:bg-hover/50">
                  <td className="py-1.5 pr-3 font-sans whitespace-nowrap">{fullDate(r.date)}</td>
                  <td className="hidden py-1.5 pr-3 text-right text-ink-2 sm:table-cell">{money(r.open * rate, currencyMode)}</td>
                  <td className="py-1.5 pr-3 text-right text-ink-2">{money(r.high * rate, currencyMode)}</td>
                  <td className="py-1.5 pr-3 text-right text-ink-2">{money(r.low * rate, currencyMode)}</td>
                  <td className="py-1.5 text-right font-medium sm:pr-3">{money(r.close * rate, currencyMode)}</td>
                  <td className="hidden py-1.5 text-right text-ink-3 sm:table-cell">
                    {compactMoney(r.volume * rate, currencyMode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
