"""FastAPI service: next-month province price forecasts.

Run:  uvicorn api.main:app --reload     (from the project root)
"""
import json
import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "src"))
from serve_lib import Forecaster  # noqa: E402

STATE: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    STATE["fc"] = Forecaster(os.path.join(ROOT, "models", "best_model.joblib"),
                             os.path.join(ROOT, "data", "processed", "panel_monthly.csv"))
    with open(os.path.join(ROOT, "models", "metadata.json")) as f:
        STATE["meta"] = json.load(f)
    yield
    STATE.clear()


app = FastAPI(title="Zambia food price forecaster", version="1.0.0",
              description="One-month-ahead province-level retail price forecasts (WFP data).",
              lifespan=lifespan)


class PredictRequest(BaseModel):
    commodity: str = Field(..., examples=["fresh beans"], description="Free text, e.g. 'fresh beans' -> Beans")
    province: Optional[str] = Field(None, examples=["Central"], description="Omit to get all provinces")
    unit: Optional[str] = Field(None, examples=["KG"], description="Only needed if a commodity has several units")


class Forecast(BaseModel):
    province: str
    commodity: str
    unit: str
    last_observation_date: str
    last_observed_price: float
    forecast_date: str
    predicted_price: float
    lower_bound: float
    upper_bound: float
    interval_nominal_coverage: float
    currency: str = "ZMW"
    warning: Optional[str] = None


class PredictResponse(BaseModel):
    query: str
    matched_commodity: str
    match_score: float
    forecasts: List[Forecast]


@app.get("/health")
def health():
    ok = "fc" in STATE
    m = STATE.get("meta", {})
    return {"status": "ok" if ok else "loading", "model": m.get("model"), "variant": m.get("variant"),
            "series": int(len(STATE["fc"].last)) if ok else 0,
            "validation_MAPE_pct": m.get("validation_MAPE_pct"), "test_MAPE_pct": m.get("test_MAPE_pct")}


@app.get("/commodities")
def commodities():
    fc: Forecaster = STATE["fc"]
    return {"count": len(fc.commodity_names), "provinces": fc.provinces, "commodities": fc.commodities()}


def _run(commodity: str, province: Optional[str], unit: Optional[str]) -> PredictResponse:
    fc: Forecaster = STATE["fc"]
    name, sub, score, ranked = fc.resolve(commodity, province, unit)
    if name is None:
        raise HTTPException(404, detail={"error": f"No commodity matches '{commodity}'",
                                         "closest": [r[0] for r in ranked[:3]],
                                         "hint": "see GET /commodities"})
    if isinstance(sub, str) and sub == "BAD_PROVINCE":
        raise HTTPException(404, detail={"error": f"Unknown province '{province}'", "provinces": fc.provinces})
    if len(sub) == 0:
        avail = [c for c in fc.commodities() if c["commodity"] == name][0]
        raise HTTPException(404, detail={"error": f"No series for {name} with the given province/unit "
                                                  "(too few observations, or not recorded there)",
                                         "available_provinces": avail["provinces"], "available_units": avail["units"]})
    # several units for the same commodity -> keep the one with the most recent data
    if not unit and sub["unit"].nunique() > 1:
        best_unit = sub.groupby("unit")["month"].max().idxmax()
        sub = sub[sub["unit"] == best_unit]
    rows = fc.predict_rows(sub)
    newest = fc.last["month"].max()
    q = STATE["meta"]["interval_nominal"]
    out = []
    for r in rows:
        last = fc.last.loc[r["series_id"], "month"]
        lag = (newest.year - last.year) * 12 + newest.month - last.month
        warn = (f"Last record for this series is {lag} months older than the newest record in the dataset ({newest:%Y-%m}); "
                "forecast is for the month after that last record and may be stale.") if lag > 12 else None
        r.pop("series_id")
        out.append(Forecast(**r, interval_nominal_coverage=q, warning=warn))
    return PredictResponse(query=commodity, matched_commodity=name, match_score=round(score, 3), forecasts=out)


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    return _run(req.commodity, req.province, req.unit)


@app.get("/predict", response_model=PredictResponse)
def predict_get(commodity: str = Query(..., examples=["fresh beans"]), province: Optional[str] = None,
                unit: Optional[str] = None):
    return _run(commodity, province, unit)
