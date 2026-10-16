# Zambia food-price forecaster (WFP data) – CRISP-DM project

One-month-ahead retail price forecast per **province × commodity**, with lower/upper bounds, served by FastAPI.

## Layout
- `notebooks/01_business_data_understanding.ipynb` – CRISP-DM phases 1-2
- `notebooks/02_data_preparation.ipynb` – phase 3: unit/name harmonisation, province aggregation (median), monthly grid, **seasonal imputation + `is_imputed` flag**, features
- `notebooks/03_modeling_ablation.ipynb` – phase 4: 8 candidates screened -> top-5 tuned -> **ablation study** -> selection -> conformal intervals -> save model
- `notebooks/04_evaluation_deployment.ipynb` – phases 5-6: test evaluation, diagnostics, next-month forecasts for all series
- `src/prep.py`, `src/serve_lib.py` – code shared by notebooks and API (no train/serve skew)
- `api/main.py` – FastAPI app (`/health`, `/commodities`, `/predict`)
- `models/` – `best_model.joblib` (deployed), `best_model_trainonly.joblib`, `metadata.json`
- `reports/` – `figures/*.png`, `ablation_results.csv`, `model_screening.csv`, `next_month_forecasts.csv`

## Run
```
pip install -r requirements.txt
uvicorn api.main:app --port 8000        # docs at /docs
python build_notebooks.py && cd notebooks && jupyter nbconvert --to notebook --execute --inplace *.ipynb   # optional re-run
```
```
curl -X POST localhost:8000/predict -H 'content-type: application/json' \
     -d '{"commodity":"fresh beans","province":"Central"}'
```
`province` is optional (omit for all provinces); `unit` is optional.
Forecast month = month of the series' last real observation + 1.

## Results (selected: XGBoost, all features except series-id codes)
| | validation | test |
|---|---|---|
| MAPE | 9.35 % | 10.62 % |
| naive last-value MAPE | 9.77 % | 11.16 % |
| MAE (ZMW) | – | 2.53 |
| median APE | – | 5.7 % |

The 10 % target (read as MAPE) is met on validation but **not on the held-out test set** (10.6 %). Errors are concentrated in volatile or discontinued commodities (cassava meal, millet, sorghum, breakfast maize meal). 90 % intervals cover 91.7 % of test cases but are wide (~70 % of the forecast on average).
