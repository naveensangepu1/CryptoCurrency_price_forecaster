import React, { useState } from 'react';
import { api } from '../services/api';
import type { UserProfile } from '../types';
import { TextTabs } from './TextTabs';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

const inputClass =
  'w-full rounded-[3px] border border-rule bg-paper/50 px-3 py-2 text-sm text-ink placeholder:text-ink-3/70 focus:border-ink focus:outline-none';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onContinueAsGuest }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    if (isRegister) {
      if (!name) {
        setErrorMessage('Enter your name.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password needs at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("The two passwords don't match.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = isRegister ? await api.register(name, email, password) : await api.login(email, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || "That didn't work. Check your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.login('demo@crypto.com', 'password123');
      onLoginSuccess(res.user);
    } catch {
      // Backend unreachable: fall back to a local demo profile so the page still opens.
      onLoginSuccess({
        id: 'usr-demo-001',
        name: 'Demo Trader',
        email: 'demo@crypto.com',
        token: 'jwt-demo-session',
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_400px] lg:gap-20">
        {/* What this is */}
        <div>
          <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Crypto Price Forecaster
          </h1>
          <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-2">
            Pulls daily prices for eight coins from Yahoo Finance and fits a linear regression to guess where each one
            will be over the next 1 to 30 days.
          </p>
          <ul className="mt-6 max-w-md space-y-2 text-sm text-ink-2">
            {[
              'Charts from the last week back to the first recorded price',
              'Forecasts with R², MAE and RMSE, so you can see how well the line fits',
              'Prices in US dollars or Indian rupees',
              'The raw OHLC data, downloadable as CSV',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="text-ink-3">–</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-sm text-xs leading-relaxed text-ink-3">
            BTC, ETH, BNB, MATIC, SOL, DOGE, ATOM and TRX. A learning project, not investment advice.
          </p>
        </div>

        {/* Sign in */}
        <div className="rounded-[4px] border border-rule bg-card p-6 sm:p-8">
          <div className="text-sm">
            <TextTabs
              label="Sign in or create an account"
              value={isRegister ? 'register' : 'login'}
              onChange={(v) => {
                setIsRegister(v === 'register');
                setErrorMessage(null);
              }}
              options={[
                { value: 'login', label: 'Sign in' },
                { value: 'register', label: 'Create account' },
              ]}
            />
          </div>

          {errorMessage && (
            <p role="alert" className="mt-5 border-l-2 border-down bg-down/5 px-3 py-2 text-sm text-down">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="mb-1 block text-[13px] text-ink-2">
                  Name
                </label>
                <input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1 block text-[13px] text-ink-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <label htmlFor="password" className="text-[13px] text-ink-2">
                  Password
                </label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-ink-3 hover:text-ink">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {isRegister && (
              <div>
                <label htmlFor="confirm" className="mb-1 block text-[13px] text-ink-2">
                  Password again
                </label>
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[3px] bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-2 disabled:opacity-60"
            >
              {isLoading ? 'One moment…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-rule" />
            or
            <span className="h-px flex-1 bg-rule" />
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isLoading}
            className="w-full rounded-[3px] border border-rule px-4 py-2 text-sm text-ink hover:border-ink-3 disabled:opacity-60"
          >
            Use the demo account
          </button>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="mt-3 w-full text-center text-sm text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            Continue without an account
          </button>
        </div>
      </div>
    </div>
  );
};
