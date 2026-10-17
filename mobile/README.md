# AgriMart Mobile

AgriMart Mobile is an Expo SDK 54 marketplace for Zambian agricultural products.
It uses the AgriMart Express API for accounts and marketplace data, and calls the
Zambia Prices FastAPI service directly for province-level price forecasts.

## Services

| Capability | Service |
| --- | --- |
| Authentication, profiles, products, saves, comparisons, uploads | Express API |
| Commodity catalogue and price forecasts | FastAPI ML service |
| Local encrypted JWT storage | Expo SecureStore |

## Configure the API URLs

Copy `.env.example` to `.env.local` and set both URLs:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
EXPO_PUBLIC_ML_API_URL=http://192.168.1.100:8000
```

Use the development computer's LAN address when testing with Expo Go on a
physical device; `localhost` on the phone points to the phone itself. For hosted
builds, use public HTTPS URLs. These values are bundled into the app and must not
contain credentials or private API keys.

## Run locally

Start the two APIs in separate terminals:

```bash
cd /path/to/AgriMart/agri-backend
npm install
npm run dev
```

```bash
cd /path/to/mobile-and-web-application-for-agricultural-market-place/ml_service
uv sync --frozen
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Then start Expo:

```bash
cd mobile
npm install
npm start
```

Expo Go supports the SecureStore, ImagePicker, and Location modules used here.

## Main flows

- Register with a username, then sign in with that username or a unique account email and password.
- Restore the seven-day JWT securely when the app restarts.
- Browse, search, save, and compare database-backed listings.
- Create and edit farmer listings with a product photo up to 5 MB.
- Persist profile details, password changes, and precise location coordinates.
- Explore ML forecasts by commodity, province, and unit.
- Open a product and choose **Forecast this product** to prefill the ML request.

Forecasts are estimates based on historical market data. The UI displays the
prediction interval and stale-series warnings returned by FastAPI.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm test
```

The nearby-farms map remains native-focused; Expo web displays its existing
fallback while the rest of the marketplace and forecast experience work on web.
