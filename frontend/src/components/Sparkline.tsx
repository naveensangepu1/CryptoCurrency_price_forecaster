import React from 'react';

interface SparklineProps {
  points: number[];
  up: boolean;
  width?: number;
  height?: number;
}

/** Tiny 24h trend line used in the watchlist and the markets table. */
export const Sparkline: React.FC<SparklineProps> = ({ points, up, width = 56, height = 20 }) => {
  if (!points || points.length < 2) return <span className="inline-block" style={{ width, height }} />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - 2 - ((p - min) / span) * (height - 4);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={up ? 'text-up' : 'text-down'}
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
};
