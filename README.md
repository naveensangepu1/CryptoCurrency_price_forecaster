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
│   ├── requirements.txt         # Backend Python dependencies
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
├── .gitignore                   # Git ignore rules for Python and Node
├── requirements.txt             # Root Python dependencies
└── README.md                    # Project documentation
```

---

## 🚀 How to Start Frontend and Backend

Make sure you have **Python 3.9+** and **Node.js 18+** installed. Run the backend and frontend in separate terminal windows.

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
