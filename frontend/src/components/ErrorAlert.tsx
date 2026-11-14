import React from 'react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div role="alert" className="mb-8 flex items-start justify-between gap-4 border-l-4 border-down bg-down/5 px-4 py-3 text-sm">
      <div>
        <p className="font-semibold text-down">Couldn't load market data</p>
        <p className="mt-0.5 text-ink-2">{message}</p>
        <p className="mt-1 text-xs text-ink-3">Check that the backend is running on port 8000, then try again.</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 text-ink underline decoration-rule underline-offset-4 hover:decoration-ink">
          Try again
        </button>
      )}
    </div>
  );
};
