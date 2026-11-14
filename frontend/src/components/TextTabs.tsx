import React from 'react';

interface TextTabsProps<T extends string> {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** A row of plain text buttons with an underline under the active one. */
export function TextTabs<T extends string>({ options, value, onChange, label }: TextTabsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`border-b-2 pb-0.5 font-medium transition-colors ${
              active ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
