# AgriMart Zambia food-price forecasting service

This FastAPI service provides one-month-ahead retail price forecasts for Zambian
agricultural commodities at province level. It uses a pooled XGBoost model trained
on World Food Programme price data and returns a point forecast with lower and
upper uncertainty bounds.

Python dependencies and commands are managed with
[`uv`](https://docs.astral.sh/uv/). Do not create a virtual environment manually
or install this project with `pip`.

## Requirements

- Python 3.12 or newer, as declared in `.python-version` and `pyproject.toml`
- `uv` installed on the development machine

Install `uv` by following the official installation guide, then confirm it is
available:

```bash
uv --version
```

## Setup

Run all ML service commands from this directory:

```bash
cd ml_service
uv sync --frozen
```

`uv sync --frozen` creates the local `.venv` and installs the exact dependency
versions recorded in `uv.lock`. The environment is managed automatically, so
activation is optional. Use `uv run` for every Python command shown below.

## Run the API

Start the service locally:

```bash
uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Open the interactive API documentation at <http://localhost:8000/docs>.

For Expo web or another browser client, configure allowed origins as a
comma-separated list. Native mobile requests are not subject to browser CORS:

```bash
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006 \
  uv run uvicorn api.main:app --host 0.0.0.0 --port 8000
```

The service loads these existing artifacts during startup:

- `models/best_model.joblib` — deployed XGBoost model
- `models/metadata.json` — evaluation metrics and model metadata
- `data/processed/panel_monthly.csv` — series history used to build inference features

Startup should fail clearly if a required artifact is missing or incompatible.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Report readiness, model name, variant, series count, and headline metrics |
| `GET` | `/commodities` | List supported commodities, units, provinces, and latest observations |
| `GET` | `/predict` | Request a forecast with query parameters |
| `POST` | `/predict` | Request a forecast with a JSON body |

Example POST request:

```bash
curl -X POST http://localhost:8000/predict \
  -H 'content-type: application/json' \
  -d '{"commodity":"fresh beans","province":"Central"}'
```

Equivalent GET request:

```bash
curl 'http://localhost:8000/predict?commodity=fresh%20beans&province=Central'
```

`province` is optional; omitting it returns matching series from all available
provinces. `unit` is also optional and is only needed when a commodity has more
than one supported unit. The forecast month is the month immediately following
the series' last real observation, which may be historical for stale series.

## Tests

Run the API contract suite with:

```bash
uv run pytest -q
```

## Docker and Google Cloud Run

The production image installs only the API runtime dependencies, runs as a
non-root user, and starts Uvicorn on the `PORT` environment variable supplied by
Cloud Run.

Build and test the image locally from this directory:

```bash
docker build -t agrimart-ml-api .
docker run --rm -d --name agrimart-ml-api -p 8080:8080 \
  -e ALLOWED_ORIGINS=http://localhost:3000 \
  agrimart-ml-api
curl http://localhost:8080/health
docker stop agrimart-ml-api
```

With the Google Cloud CLI authenticated and a project selected, enable the
required services once:

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

Then build and deploy the checked-in `Dockerfile` directly from `ml_service/`:

```bash
gcloud run deploy agrimart-ml-api \
  --source . \
  --region africa-south1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 1Gi \
  --set-env-vars ALLOWED_ORIGINS=https://your-web-app.example
```

Replace the allowed origin with the deployed web application's exact origin.
Use a comma-separated value when more than one browser origin is required. Omit
`--allow-unauthenticated` if the API should require authenticated Cloud Run
requests.

The repository-root `render.yaml` remains available for Render deployments and
also uses the locked production dependency set.

## Reproduce the notebooks and model artifacts

The checked-in model and processed data are sufficient to run the API. Rebuilding
the analysis requires the original WFP CSV, which is not stored in this repository.
Place it at:

```text
data/wfp_food_prices_zmb.csv
```

Then regenerate and execute the notebooks:

```bash
uv run python build_notebooks.py
uv run jupyter nbconvert \
  --to notebook \
  --execute \
  --inplace \
  notebooks/01_business_data_understanding.ipynb \
  notebooks/02_data_preparation.ipynb \
  notebooks/03_modeling_ablation.ipynb \
  notebooks/04_evaluation_deployment.ipynb
```

The pipeline follows CRISP-DM:

1. Business and data understanding
2. Data preparation and seasonal gap imputation
3. Model screening, tuning, ablation, and selection
4. Held-out evaluation, uncertainty intervals, and deployment artifacts

## Dependency maintenance

Use `uv` when changing dependencies so `pyproject.toml` and `uv.lock` remain in
sync:

```bash
uv add package-name
uv remove package-name
uv lock --upgrade
uv sync --frozen
```

Commit both `pyproject.toml` and `uv.lock` after an intentional dependency change.
Do not commit `.venv`.

## Model results and limitations

The selected model is XGBoost using all engineered features except series identity
codes.

| Metric | Validation | Test |
| --- | ---: | ---: |
| MAPE | 9.35% | 10.62% |
| Naive last-value MAPE | 9.77% | 11.16% |
| MAE | — | ZMW 2.53 |
| Median absolute percentage error | — | 5.7% |

The model meets the 10% MAPE target on validation but not on the held-out test set.
Its 90% intervals cover 91.7% of test observations, but their average width is
approximately 70% of the forecast. Treat predictions as decision-support estimates,
not guaranteed market prices. Volatile, discontinued, or stale commodity series can
have materially larger errors.

## Folder structure

```text
ml_service/
├── api/
│   └── main.py                 # FastAPI application and request/response models
├── data/
│   └── processed/
│       ├── codes.json          # Province and commodity encodings
│       ├── features.csv        # Engineered training/evaluation rows
│       └── panel_monthly.csv   # Monthly province × commodity panel
├── models/
│   ├── best_model.joblib       # Deployed model trained on all available rows
│   ├── best_model_trainonly.joblib
│   └── metadata.json
├── notebooks/                  # Four CRISP-DM analysis notebooks
├── reports/
│   ├── figures/                # Generated evaluation plots
│   └── *.csv                   # Baselines, ablations, tuning, and forecasts
├── src/
│   ├── prep.py                 # Shared preprocessing and feature engineering
│   ├── serve_lib.py            # Model loading, matching, and inference
│   └── zambia_prices/
├── build_notebooks.py          # Recreates the notebook files
├── pyproject.toml              # Project metadata and dependency declarations
├── uv.lock                     # Reproducible dependency lockfile
└── README.md
```
