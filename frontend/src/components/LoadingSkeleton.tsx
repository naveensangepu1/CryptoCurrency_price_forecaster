import React from 'react';

/** Shown on first load while the backend fetches prices for all eight coins (can take a few seconds). */
export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="py-24 text-center" role="status">
      <p className="font-serif text-xl text-ink-2">Fetching prices…</p>
      <p className="mt-2 text-sm text-ink-3">
        The first load pulls prices for eight coins from Yahoo Finance, so it can take a few seconds.
      </p>
    </div>
  );
};
