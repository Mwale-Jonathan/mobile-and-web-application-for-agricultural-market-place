# AgriMart agricultural marketplace

AgriMart is a mobile agricultural marketplace and market-intelligence project for
Zambia. It is designed to help consumers discover agricultural products and nearby
suppliers, compare prices, and contact farmers, while giving farmers tools to present
and manage their produce. The project also includes a machine-learning service for
province-level commodity price forecasting.

## My responsibility

My contribution to the project is the design and development of two main components:

1. **The mobile application** — a cross-platform Expo/React Native marketplace for
   buyer and farmer workflows.
2. **The ML service** — a Python/FastAPI forecasting service that serves the trained
   Zambia food-price model and its uncertainty intervals.

These components currently live in the `mobile/` and `ml_service/` directories. The
mobile application uses the AgriMart Express API for marketplace features and calls
the ML service directly for forecasts. The ML service runs with checked-in processed
data and trained model artifacts.

## Main features

### Mobile application

- Real buyer and farmer accounts with persistent role-aware navigation
- Product browsing, searching, filtering, and price comparison
- Product details and supplier profiles
- Phone and WhatsApp supplier contact actions
- Nearby supplier map using device location and OpenStreetMap
- Farmer listing creation, editing, sold-out marking, and deletion
- Saved products and live province-level ML price forecasts

### Machine-learning service

- One-month-ahead province × commodity retail price forecasts
- XGBoost model trained on engineered WFP historical price features
- Commodity and province matching for user-friendly queries
- Lower and upper prediction bounds
- FastAPI health, catalogue, and prediction endpoints
- CRISP-DM notebooks, evaluation reports, and reproducible `uv` environment

## Technology stack

| Component | Technologies |
| --- | --- |
| Mobile | Expo SDK 54, React Native, TypeScript, Expo Router, NativeWind |
| Maps and location | Leaflet/OpenStreetMap in a WebView, `expo-location` |
| ML service | Python 3.12, FastAPI, XGBoost, pandas, scikit-learn |
| Python tooling | `uv`, `pyproject.toml`, `uv.lock` |
| Research workflow | Jupyter notebooks and CRISP-DM |

## Quick start

### Mobile application

```bash
cd mobile
npm install
npm start
```

Scan the Expo QR code with Expo Go. See [`mobile/README.md`](mobile/README.md) for
platform requirements, demo users, implemented screens, and known limitations.

### ML service

```bash
cd ml_service
uv sync --frozen
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Open <http://localhost:8000/docs> for the interactive API documentation. See
[`ml_service/README.md`](ml_service/README.md) for API examples, artifact details,
model results, and notebook reproduction instructions.

## Repository structure

```text
mobile-and-web-application-for-agricultural-market-place/
├── mobile/
│   ├── app/                    # Expo Router screens and route groups
│   ├── assets/                 # Images, icons, and other bundled resources
│   ├── components/             # Reusable React Native UI components
│   ├── context/                # Shared application state
│   ├── data/                   # Local mock marketplace data
│   ├── lib/                    # Helpers and reusable utilities
│   ├── app.json                # Expo application configuration
│   ├── package.json            # JavaScript dependencies and scripts
│   └── README.md               # Mobile setup and feature documentation
├── ml_service/
│   ├── api/                    # FastAPI application
│   ├── data/processed/         # Prepared monthly panel and model features
│   ├── models/                 # Trained model bundles and metadata
│   ├── notebooks/              # CRISP-DM research notebooks
│   ├── reports/                # Evaluation tables and figures
│   ├── src/                    # Preprocessing and inference code
│   ├── pyproject.toml          # Python project and dependency configuration
│   ├── uv.lock                 # Locked Python environment
│   └── README.md               # ML service operations and methodology
├── docs/                       # Shared project documentation
└── README.md                   # Project overview and entry point
```

## Current boundaries

- Express and FastAPI are separate services configured with public mobile environment URLs.
- Forecasting is price-focused; product availability forecasting is not implemented.
- The raw WFP training CSV is not committed; the ML API uses the committed processed
  panel and model artifacts.
- Forecasts are estimates derived from historical data and should not be presented as
  guaranteed future market prices.
