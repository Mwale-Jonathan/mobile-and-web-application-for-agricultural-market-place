import pandas as pd
import pytest
from httpx import ASGITransport, AsyncClient

import api.main as api_main


class ContractForecaster:
    """Deterministic model double that keeps HTTP contract tests fast."""

    def __init__(self, _bundle_path: str, _panel_path: str):
        rows = [
            {
                "series_id": "Lusaka|Maize grain (white)|KG",
                "province": "Lusaka",
                "commodity": "Maize grain (white)",
                "unit": "KG",
                "month": pd.Timestamp("2025-12-01"),
                "price": 12.5,
            },
            {
                "series_id": "Central|Maize grain (white)|KG",
                "province": "Central",
                "commodity": "Maize grain (white)",
                "unit": "KG",
                "month": pd.Timestamp("2025-11-01"),
                "price": 11.0,
            },
        ]
        self.last = pd.DataFrame(rows).set_index("series_id")
        self.provinces = ["Central", "Lusaka"]
        self.commodity_names = ["Maize grain (white)"]

    def commodities(self):
        return [
            {
                "commodity": "Maize grain (white)",
                "units": ["KG"],
                "provinces": self.provinces,
                "last_observation": "2025-12",
            }
        ]

    def resolve(self, commodity, province=None, unit=None):
        if "maize" not in commodity.lower():
            return None, None, 0.1, [("Maize grain (white)", 0.1)]
        sub = self.last[self.last["commodity"] == "Maize grain (white)"]
        if unit:
            sub = sub[sub["unit"].str.lower() == unit.lower()]
        if province:
            matched = next((p for p in self.provinces if p.lower() == province.lower()), None)
            if matched is None:
                return "Maize grain (white)", "BAD_PROVINCE", 0.95, []
            sub = sub[sub["province"] == matched]
        return "Maize grain (white)", sub, 0.95, []

    def predict_rows(self, sub):
        return [
            {
                "series_id": series_id,
                "province": row["province"],
                "commodity": row["commodity"],
                "unit": row["unit"],
                "last_observation_date": row["month"].strftime("%Y-%m"),
                "last_observed_price": float(row["price"]),
                "forecast_date": (row["month"] + pd.offsets.MonthBegin()).strftime("%Y-%m"),
                "predicted_price": 13.25,
                "lower_bound": 10.5,
                "upper_bound": 16.0,
            }
            for series_id, row in sub.iterrows()
        ]


@pytest.fixture(scope="module", autouse=True)
def api_state():
    api_main.STATE["fc"] = ContractForecaster("", "")
    api_main.STATE["meta"] = {
        "model": "contract-double",
        "variant": "test",
        "interval_nominal": 0.9,
        "validation_MAPE_pct": 9.0,
        "test_MAPE_pct": 10.0,
    }
    try:
        yield
    finally:
        api_main.STATE.clear()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=api_main.app), base_url="http://testserver"
    ) as test_client:
        yield test_client


@pytest.mark.anyio
async def test_health_and_catalogue_contracts(client):
    health = await client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    catalogue = await client.get("/commodities")
    assert catalogue.status_code == 200
    body = catalogue.json()
    assert body["count"] == len(body["commodities"])
    assert body["provinces"]
    assert {"commodity", "units", "provinces", "last_observation"} <= body["commodities"][0].keys()


@pytest.mark.anyio
async def test_prediction_supports_province_all_provinces_and_unit(client):
    response = await client.post("/predict", json={"commodity": "maize", "province": "Lusaka"})
    assert response.status_code == 200
    body = response.json()
    assert body["matched_commodity"] == "Maize grain (white)"
    assert len(body["forecasts"]) == 1
    assert body["forecasts"][0]["currency"] == "ZMW"

    all_provinces = await client.post("/predict", json={"commodity": "maize", "unit": "KG"})
    assert all_provinces.status_code == 200
    assert len(all_provinces.json()["forecasts"]) == 2


@pytest.mark.anyio
async def test_prediction_errors_include_suggestions(client):
    unknown = await client.post("/predict", json={"commodity": "not-a-real-commodity"})
    assert unknown.status_code == 404
    assert unknown.json()["detail"]["closest"] == ["Maize grain (white)"]

    bad_province = await client.post("/predict", json={"commodity": "maize", "province": "Atlantis"})
    assert bad_province.status_code == 404
    assert bad_province.json()["detail"]["provinces"] == ["Central", "Lusaka"]


@pytest.mark.anyio
async def test_cors_preflight(client):
    response = await client.options(
        "/predict",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"
