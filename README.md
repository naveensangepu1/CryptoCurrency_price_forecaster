# 🪙 Cryptocurrency Price Forecaster

A full-stack web application designed for real-time cryptocurrency market analysis and predictive price forecasting. Built with a high-performance **FastAPI** backend and an interactive **React + TypeScript + Tailwind CSS** frontend, the platform provides live market tracking for major cryptocurrencies, interactive historical charts, 1–30 day price forecasting using **Scikit-Learn Linear Regression**, and live **USD to INR** currency conversion.

---

## 📌 About the Project

The **Cryptocurrency Price Forecaster** enables investors and enthusiasts to analyze historical price trends and forecast future asset values with data-driven machine learning models.

### Key Capabilities:
- **Live 8-Asset Market Dashboard**: Real-time market metrics, 24h price changes, 24h highs/lows, volumes, and intra-day sparkline trends for **Bitcoin (BTC)**, **Ethereum (ETH)**, **BNB (BNB)**, **Polygon (MATIC)**, **Solana (SOL)**, **Dogecoin (DOGE)**, **Cosmos (ATOM)**, and **TRON (TRX)**.
- **Interactive Historical Charts**: Multi-timeframe visualizations (`7D`, `1M`, `3M`, `6M`, `1Y`, `ALL`) with customizable Area and Line chart views powered by Recharts.
- **1–30 Day Predictive Forecaster**: Customizable forecast horizon using Scikit-Learn Ordinary Least Squares (OLS) Linear Regression, with future trajectory projections continuing seamlessly from observed historical prices.
- **Model Evaluation**: Transparent performance metrics reporting the Coefficient of Determination ($R^2$ accuracy score), Mean Absolute Error (MAE), and Root Mean Squared Error (RMSE).
- **Dual Currency Valuation (USD / INR)**: Live `USDINR=X` exchange rate integration with instant one-click toggle between US Dollars ($) and Indian Rupees (₹).
- **Historical Data & CSV Export**: Inspect historical OHLC records (head/tail/all) and export datasets as CSV.

---

## 🛠️ Tech Stack

### Frontend:
- **Framework & Language**: React 19, TypeScript
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React

### Backend:
- **Framework**: FastAPI (Python 3.9+)
- **ASGI Server**: Uvicorn
- **Machine Learning**: Scikit-Learn (Linear Regression, Model Evaluation)
- **Market Data Feed**: Yahoo Finance (`yfinance`)
- **Data Processing**: Pandas, NumPy
- **Data Validation & Schemas**: Pydantic

---

## 📁 Project Structure

```text
CryptoCurrency_Price_Forecaster/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI endpoints, CORS, routers
│   │   ├── config.py            # Supported coin definitions and range settings
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py       # Pydantic request and response schemas
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── market_data.py   # Yahoo Finance data fetching and caching
│   │       ├── forecaster.py    # Scikit-Learn Linear Regression engine
│   │       └── currency.py      # Real-time USD/INR exchange rate service
│   ├── tests/                   # pytest suite (fake Yahoo data, no network needed)
│   ├── Dockerfile               # Production image for the API
│   ├── pyproject.toml           # pytest + ruff settings
│   ├── requirements.txt         # Backend Python dependencies
│   ├── requirements-dev.txt     # Test and lint tools
│   └── run.py                   # Server startup script
│
├── frontend/
│   ├── index.html               # Web application entry point
│   ├── package.json             # Frontend dependencies and scripts
│   ├── vite.config.ts           # Vite bundler configuration & API proxy
│   ├── tsconfig.json            # TypeScript configuration
│   └── src/
│       ├── main.tsx             # React mount entry
│       ├── App.tsx              # Data loading, sidebar shell, picks the page from the URL hash
│       ├── index.css            # Tailwind import, colour + font tokens (@theme)
│       ├── lib/
│       │   ├── format.ts        # Currency, percentage and date formatting helpers
│       │   └── views.ts         # The five sidebar sections and their #/hash URLs
│       ├── types/
│       │   └── index.ts         # TypeScript data models
│       ├── services/
│       │   └── api.ts           # Frontend API client
│       ├── pages/
│       │   ├── OverviewPage.tsx     # #/overview: coin heading, price chart, forecast in brief
│       │   ├── MarketsPage.tsx      # #/markets: sortable table of all 8 coins
│       │   ├── ForecastPage.tsx     # #/forecast: horizon, forecast chart, metrics, day-by-day
│       │   ├── HistoryPage.tsx      # #/history: range summary and full OHLC table
│       │   └── AboutPage.tsx        # #/about: method, metrics, limitations, data sources
│       └── components/
│           ├── Sidebar.tsx          # Left navigation (slide-out menu on phones)
│           ├── Header.tsx           # Page title, currency toggle, refresh
│           ├── WatchlistLayout.tsx  # Content column + watchlist column used by coin pages
│           ├── MarketOverview.tsx   # Watchlist: 8 coins with sparklines and 24h change
│           ├── CoinSelector.tsx     # Selected coin heading (full and compact)
│           ├── PriceChart.tsx       # Recharts area/line chart with forecast overlay
│           ├── ForecastChart.tsx    # Last 30 closes + forecast with a "latest close" marker
│           ├── ForecastPanel.tsx    # Horizon slider, forecast summary, R²/MAE/RMSE, day-by-day table
│           ├── HistoricalTable.tsx  # OHLC data table with CSV export
│           ├── Sparkline.tsx        # Tiny 24h trend line
│           ├── TextTabs.tsx         # Small underlined tab control
│           ├── LoginPage.tsx        # Sign in / create account / guest
│           ├── LoadingSkeleton.tsx  # First-load message
│           └── ErrorAlert.tsx       # Error message with retry
│
├── .github/workflows/ci-cd.yml  # GitHub Actions: checks on every PR, deploys from main
├── .gitignore                   # Git ignore rules for Python and Node
├── requirements.txt             # Root Python dependencies
└── README.md                    # Project documentation
```

---

## 🚀 How to Start Frontend and Backend

Make sure you have **Python 3.9+** and **Node.js 20.19+** (22 recommended; Vite 8 needs at least 20.19) installed. Run the backend and frontend in separate terminal windows.

### 1. Start the Backend (FastAPI)

In your first terminal, navigate to the project root:

```bash
# Navigate to the project root
cd CryptoCurrency_Price_Forecaster

# Install Python backend dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server (runs on http://localhost:8000)
python backend/run.py
```

- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

### 2. Start the Frontend (React + Vite)

In your second terminal, navigate to the `frontend` directory:

```bash
# Navigate to the frontend directory
cd CryptoCurrency_Price_Forecaster/frontend

# Install Node dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

- **Frontend App:** `http://localhost:5173`

*(The Vite development server automatically proxies `/api` requests to `http://localhost:8000`)*

---

## CI/CD

Everything lives in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) and runs on GitHub Actions.

| When | What runs |
|---|---|
| Pull request into `main` | **Frontend:** `npm ci`, oxlint, TypeScript check, production build<br>**Backend:** ruff, pytest, Docker image build (not pushed) |
| Push to `main` (e.g. merging a PR) | All of the above, then if everything passed:<br>**Backend:** image pushed to `ghcr.io/naveensangepu1/crypto-forecaster-api` and your host's deploy hook called<br>**Frontend:** built and published to GitHub Pages |

The deploy jobs never run on pull requests, and on `main` they only start after every check has passed.

### Run the same checks on your machine

```bash
# backend
cd backend
pip install -r requirements.txt -r requirements-dev.txt
ruff check .
pytest

# frontend
cd frontend
npm ci
npm run lint
npm run build
```

The backend tests replace Yahoo Finance with fixed fake prices (see `backend/tests/conftest.py`), so they run offline and always give the same result.

### One-time setup for deployment

GitHub Pages can only host the frontend, so the backend needs a host that runs Docker images. These steps use [Render](https://render.com) as the example; any host with a deploy webhook works the same way.

1. **Backend host.** On Render, create a *Web Service* from this repository with **Root Directory** `backend` and **Runtime** Docker. Set the health check path to `/api/health`. Turn **Auto-Deploy off**, so it only deploys after CI passes. Copy the service's **Deploy Hook** URL and its public URL (e.g. `https://crypto-forecaster-api.onrender.com`).
2. **Deploy hook secret.** In GitHub: *Settings → Secrets and variables → Actions → Secrets → New repository secret*. Name: `BACKEND_DEPLOY_HOOK_URL`, value: the deploy hook URL.
3. **Turn on Pages.** *Settings → Pages → Build and deployment → Source:* **GitHub Actions**.
4. **Tell the frontend where the API is.** *Settings → Secrets and variables → Actions → Variables → New repository variable*. Name: `VITE_API_URL`, value: the backend's public URL from step 1.
5. Push to `main` (or use *Actions → CI/CD → Run workflow*). The site appears at `https://naveensangepu1.github.io/CryptoCurrency_price_forecaster/`.

Until step 4 is done, the frontend deploy job is skipped (the site would have no prices without a backend). Until step 2 is done, the backend job only publishes the Docker image and leaves a note in the run summary.

The Docker image on GitHub Container Registry is private by default. To let anyone `docker pull` it, open the package from your GitHub profile → *Packages* → *Package settings* → *Change visibility*.
