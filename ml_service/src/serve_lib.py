"""Inference helper shared by the API and the evaluation notebook."""
from __future__ import annotations

import os
import joblib
import numpy as np
import pandas as pd

import prep


class Forecaster:
    def __init__(self, bundle_path: str, panel_path: str):
        self.bundle = joblib.load(bundle_path)
        self.model = self.bundle["model"]
        self.features = self.bundle["features"]
        panel = pd.read_csv(panel_path, parse_dates=["month"])
        self.panel = panel
        feats = prep.make_features(panel, self.bundle["province_codes"],
                                   self.bundle["commodity_codes"], keep_last_row=True)
        last = (feats.sort_values("month").groupby("series_id").tail(1))
        self.last = last[last["series_id"].isin(
            panel.loc[panel.is_latest_segment == 1, "series_id"].unique())].set_index("series_id")
        self.provinces = sorted(self.last["province"].unique())
        self.commodity_names = sorted(self.last["commodity"].unique())

    # ------------------------------------------------------------------
    def commodities(self):
        out = []
        for c, g in self.last.groupby("commodity"):
            out.append({
                "commodity": c,
                "units": sorted(g["unit"].unique()),
                "provinces": sorted(g["province"].unique()),
                "last_observation": g["month"].max().strftime("%Y-%m"),
            })
        return out

    def resolve(self, commodity: str, province: str | None = None, unit: str | None = None):
        name, score, ranked = prep.match_commodity(commodity, self.commodity_names)
        if name is None:
            return None, None, score, ranked
        sub = self.last[self.last["commodity"] == name]
        if unit:
            sub = sub[sub["unit"].str.lower() == unit.lower()]
        prov = None
        if province:
            prov = prep.match_province(province, self.provinces)
            if prov is None:
                return name, "BAD_PROVINCE", score, ranked
            sub = sub[sub["province"] == prov]
        return name, sub, score, ranked

    def predict_rows(self, sub: pd.DataFrame):
        X = sub[self.features]
        yhat = self.model.predict(X)
        sigma = sub["roll_std_6"].fillna(sub["roll_std_3"]).fillna(self.bundle["sigma_default"])
        sigma = sigma.clip(lower=self.bundle["sigma_floor"])
        q = self.bundle["conformal_q"]
        price = sub["price"].values
        pred = price * np.exp(yhat)
        lo = price * np.exp(yhat - q * sigma.values)
        hi = price * np.exp(yhat + q * sigma.values)
        res = []
        for i, (sid, r) in enumerate(sub.iterrows()):
            res.append({
                "series_id": sid,
                "province": r["province"], "commodity": r["commodity"], "unit": r["unit"],
                "last_observation_date": r["month"].strftime("%Y-%m"),
                "last_observed_price": round(float(price[i]), 3),
                "forecast_date": r["next_month"].strftime("%Y-%m"),
                "predicted_price": round(float(pred[i]), 3),
                "lower_bound": round(float(lo[i]), 3),
                "upper_bound": round(float(hi[i]), 3),
            })
        return res
