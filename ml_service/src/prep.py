"""Shared data-preparation and feature code.

Used by BOTH the notebooks (training) and the FastAPI service (serving) so that
there is no train/serve skew.
"""
from __future__ import annotations

import re
import numpy as np
import pandas as pd

# --------------------------------------------------------------------------
# 1. Commodity / unit harmonisation
# --------------------------------------------------------------------------
# Same product recorded under different names in different survey rounds.
NAME_MAP = {
    "Beans (dry)": "Beans",
    "Rice (local)": "Rice",
}
# unit -> (standard unit, divisor to convert price to the standard unit)
UNIT_MAP = {
    "KG": ("KG", 1.0),
    "5 KG": ("KG", 5.0),
    "25 KG": ("KG", 25.0),
    "400 G": ("KG", 0.4),
    "90 G": ("KG", 0.09),
    "L": ("L", 1.0),
    "750 ML": ("L", 0.75),
    "500 ML": ("L", 0.5),
    "2.5 L": ("L", 2.5),
    "5 L": ("L", 5.0),
    "30 pcs": ("30 pcs", 1.0),
    "Bundle": ("Bundle", 1.0),
    "Tin (20 L)": ("Tin (20 L)", 1.0),
}
# Pack-size specific products that must NOT be merged with the bulk product.
SUFFIX_IF_UNIT = {("Maize (white)", "Tin (20 L)"): "Maize (white, tin)"}

MIN_OBS_SERIES = 12  # series with fewer real monthly observations are not modelled


def harmonise(raw: pd.DataFrame) -> pd.DataFrame:
    df = raw.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["commodity_std"] = df["commodity"].replace(NAME_MAP)
    std = df["unit"].map(lambda u: UNIT_MAP[u][0])
    div = df["unit"].map(lambda u: UNIT_MAP[u][1])
    df["unit_std"] = std
    df["price_std"] = df["price"] / div
    for (c, u), new in SUFFIX_IF_UNIT.items():
        df.loc[(df.commodity_std == c) & (df.unit == u), "commodity_std"] = new
    df["month"] = df["date"].dt.to_period("M").dt.to_timestamp()
    return df


# --------------------------------------------------------------------------
# 2. Province-level aggregation
# --------------------------------------------------------------------------
def aggregate_province(df: pd.DataFrame) -> pd.DataFrame:
    """Median across markets/admin2 per province-commodity-unit-month.

    Median is used (not mean) because a few entries are clear typos
    (e.g. milk at ZMW 12,000) and the number of markets varies by month.
    """
    keys = ["admin1", "commodity_std", "unit_std", "month"]
    g = (df.groupby(keys)
           .agg(price=("price_std", "median"),
                n_markets=("market_id", "nunique"),
                n_obs=("price_std", "size"))
           .reset_index())
    g = g.rename(columns={"admin1": "province", "commodity_std": "commodity", "unit_std": "unit"})
    return g


# --------------------------------------------------------------------------
# 3. Gap filling with seasonal imputation (+ explicit flag)
# --------------------------------------------------------------------------
def _seasonal_impute(s: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Fill interior gaps of a monthly series.

    log(price) = trend + seasonal.  Trend is linearly interpolated between the
    neighbouring real observations; seasonal is the mean month-of-year deviation
    from a centred 12-month rolling trend (only when >= 2 observations exist for
    that calendar month, otherwise 0 -> pure interpolation).
    Returns (filled series, is_imputed flag).
    """
    obs = s.notna()
    logp = np.log(s)
    trend_interp = logp.interpolate(method="linear", limit_area="inside")
    # centred rolling trend of the interpolated series
    trend = trend_interp.rolling(12, center=True, min_periods=3).mean()
    dev = (logp - trend)
    seas = dev.groupby(dev.index.month).agg(["mean", "count"])
    seas_val = seas["mean"].where(seas["count"] >= 2, 0.0).fillna(0.0)
    seas_val = seas_val - seas_val.mean()  # zero-centred
    month_eff = pd.Series(seas_val.reindex(logp.index.month).values, index=logp.index)
    filled_log = logp.copy()
    gap = ~obs & trend_interp.notna()
    # shrink the seasonal effect for gaps so imputation does not over-shoot
    filled_log[gap] = trend_interp[gap] + 0.5 * month_eff[gap]
    out = np.exp(filled_log)
    flag = gap.astype(int)
    return out, flag


MAX_GAP = 6  # gaps longer than this many missing months are NOT imputed: the series is split


def build_monthly_panel(agg: pd.DataFrame, min_obs: int = MIN_OBS_SERIES) -> pd.DataFrame:
    """Complete monthly grid per province-commodity-unit, short gaps filled by
    seasonal imputation and flagged (is_imputed=1). Long gaps (> MAX_GAP months,
    e.g. between survey rounds with different methodology) split the series into
    segments; the latest segment keeps the plain series_id."""
    frames = []
    for (p, c, u), g in agg.groupby(["province", "commodity", "unit"]):
        g = g.sort_values("month")
        months = g["month"].reset_index(drop=True)
        step = ((months.dt.year.diff() * 12) + months.dt.month.diff()).fillna(1)
        seg = (step > MAX_GAP + 1).cumsum()
        kept = [k for k in range(int(seg.max()) + 1) if (seg == k).sum() >= min_obs]
        for j, k in enumerate(kept):
            gg = g.iloc[(seg == k).values]
            s = gg.set_index("month")["price"].sort_index()
            full_idx = pd.date_range(s.index.min(), s.index.max(), freq="MS")
            s = s.reindex(full_idx)
            nm = gg.set_index("month")["n_markets"].reindex(full_idx)
            filled, flag = _seasonal_impute(s)
            base = f"{p}|{c}|{u}"
            is_last = j == len(kept) - 1          # latest *kept* segment keeps the plain id
            out = pd.DataFrame({
                "province": p, "commodity": c, "unit": u, "month": full_idx,
                "price_raw": s.values, "price": filled.values,
                "is_imputed": flag.values, "n_markets": nm.values,
                "series_id": base if is_last else f"{base}#seg{k}",
                "is_latest_segment": int(is_last),
            })
            frames.append(out)
    panel = pd.concat(frames, ignore_index=True)
    panel["n_markets"] = panel["n_markets"].fillna(0)
    return panel


# --------------------------------------------------------------------------
# 4. Features
# --------------------------------------------------------------------------
LAGS = [1, 2, 3, 6, 12]
FEATURE_GROUPS = {
    "lags": [f"lag_{k}" for k in LAGS],
    "momentum": ["mom_1", "mom_3", "mom_6"],
    "rolling": ["roll_mean_3", "roll_std_3", "roll_mean_6", "roll_std_6"],
    "seasonal": ["month_sin", "month_cos", "seas_index"],
    "imputation": ["is_imputed_t", "imp_share_6", "n_markets_t"],
    "series_id": ["province_code", "commodity_code", "log_level"],
    "cross_section": ["nat_mom_1", "nat_mom_3", "rel_nat"],
}
ALL_FEATURES = [f for g in FEATURE_GROUPS.values() for f in g]


def make_features(panel: pd.DataFrame, province_codes: dict, commodity_codes: dict,
                  keep_last_row: bool = False) -> pd.DataFrame:
    """Features at month t describe information available at t; target is
    log(price_{t+1}) - log(price_t).  With keep_last_row=True the final row of
    every series (no target) is kept - used at serving time."""
    out = []
    for sid, g in panel.groupby("series_id", sort=False):
        g = g.sort_values("month").reset_index(drop=True)
        lp = np.log(g["price"])
        f = pd.DataFrame({"series_id": sid, "province": g.province, "commodity": g.commodity,
                          "unit": g.unit, "month": g.month, "price": g.price,
                          "price_raw": g.price_raw, "is_imputed_t": g.is_imputed})
        f["log_price"] = lp
        for k in LAGS:
            f[f"lag_{k}"] = lp.shift(k)  # log-price k months ago (NaN if unavailable)
        # express lags relative to current level -> scale free
        for k in LAGS:
            f[f"lag_{k}"] = f[f"lag_{k}"] - lp
        f["mom_1"] = lp - lp.shift(1)
        f["mom_3"] = lp - lp.shift(3)
        f["mom_6"] = lp - lp.shift(6)
        d1 = lp.diff()
        f["roll_mean_3"] = d1.rolling(3, min_periods=2).mean()
        f["roll_std_3"] = d1.rolling(3, min_periods=2).std()
        f["roll_mean_6"] = d1.rolling(6, min_periods=3).mean()
        f["roll_std_6"] = d1.rolling(6, min_periods=3).std()
        f["month_sin"] = np.sin(2 * np.pi * (g.month.dt.month) / 12)
        f["month_cos"] = np.cos(2 * np.pi * (g.month.dt.month) / 12)
        # seasonal index of the *target* month: expanding mean of past month-on-month
        # changes observed in the same calendar month as t+1 (only real, past data)
        tgt_month = ((g.month.dt.month % 12) + 1)
        d1_real = d1.where((g.is_imputed == 0) & (g.is_imputed.shift(1) == 0))
        seas = np.full(len(g), np.nan)
        hist: dict[int, list] = {}
        for i in range(len(g)):
            m = int(tgt_month.iloc[i])
            seas[i] = np.mean(hist[m]) if hist.get(m) else np.nan
            # change that ends at month i belongs to calendar month of i
            cm = int(g.month.dt.month.iloc[i])
            if not np.isnan(d1_real.iloc[i]):
                hist.setdefault(cm, []).append(d1_real.iloc[i])
        f["seas_index"] = seas
        f["imp_share_6"] = g.is_imputed.rolling(6, min_periods=1).mean()
        f["n_markets_t"] = g.n_markets
        f["province_code"] = g.province.map(province_codes)
        f["commodity_code"] = g.commodity.map(commodity_codes)
        f["log_level"] = lp
        f["next_month"] = g.month + pd.offsets.MonthBegin(1)
        f["y"] = lp.shift(-1) - lp                      # target: next month log change
        f["y_price"] = g.price.shift(-1)
        f["y_imputed"] = g.is_imputed.shift(-1)
        f["n_hist"] = np.arange(1, len(g) + 1)
        f["n_real_hist"] = (1 - g.is_imputed).cumsum()
        out.append(f)
    feats = pd.concat(out, ignore_index=True)
    # cross-province information: the same commodity in the OTHER provinces in the same month
    k = ["commodity", "unit", "month"]
    grp = feats.groupby(k)
    for c in ["mom_1", "mom_3"]:
        s, n = grp[c].transform("sum"), grp[c].transform("count")
        feats["nat_" + c] = (s - feats[c].fillna(0)) / (n - feats[c].notna().astype(int)).replace(0, np.nan)
    s, n = grp["log_price"].transform("sum"), grp["log_price"].transform("count")
    feats["rel_nat"] = feats["log_price"] - (s - feats["log_price"]) / (n - 1).replace(0, np.nan)
    if keep_last_row:
        return feats
    return feats[feats["y"].notna()].reset_index(drop=True)


def codes(panel: pd.DataFrame):
    prov = {p: i for i, p in enumerate(sorted(panel.province.unique()))}
    comm = {c: i for i, c in enumerate(sorted(panel.commodity.unique()))}
    return prov, comm


# --------------------------------------------------------------------------
# 5. Fuzzy commodity / province matching (used by the API)
# --------------------------------------------------------------------------
import difflib

QUALIFIERS = {"fresh", "dry", "dried", "local", "imported", "white", "raw", "cooking",
              "cut", "mixed", "shelled", "breakfast", "roller", "of", "the", "a"}
PROVINCE_ALIASES = {"muchinga": "Muchiga", "north western": "North-Western",
                    "northwestern": "North-Western", "nw": "North-Western",
                    "copper belt": "Copperbelt"}


def _tokens(text: str) -> list[str]:
    return [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]


TOKEN_ALIASES = {"mealie": "maize", "mealies": "maize", "corn": "maize", "kapenta": "kapenta", "bean": "beans", "egg": "eggs"}


def match_commodity(query: str, names: list[str], min_score: float = 0.7):
    """Return (best_name, score, ranked list). 'fresh beans' -> 'Beans'.
    Qualifier words (fresh/dry/local...) carry little weight so the *noun*
    decides, but they break ties ('fresh fish' -> 'Fish (fresh)')."""
    qt = [TOKEN_ALIASES.get(x, x) for x in _tokens(query)]
    if not qt:
        return None, 0.0, []
    scored = []
    for n in names:
        nt = _tokens(n)
        if not nt:
            continue
        tot_w, hit_w = 0.0, 0.0
        for t in qt:
            w = 0.3 if t in QUALIFIERS else 1.0
            best = max(difflib.SequenceMatcher(None, t, x).ratio() for x in nt)
            # also allow simple plural/singular
            tot_w += w
            hit_w += w * (best if best >= 0.8 else 0.0)
        s_q = hit_w / tot_w if tot_w else 0.0           # how much of the query is explained
        # penalise candidate tokens not in the query (prefer simpler names), lightly
        extra = sum(0.3 if x in QUALIFIERS else 1.0 for x in nt
                    if max(difflib.SequenceMatcher(None, x, t).ratio() for t in qt) < 0.8)
        score = s_q - 0.03 * extra
        scored.append((n, round(score, 4)))
    scored.sort(key=lambda x: -x[1])
    best = scored[0]
    return (best[0] if best[1] >= min_score else None), best[1], scored[:5]


def match_province(query: str, provinces: list[str]):
    q = query.strip().lower()
    q = PROVINCE_ALIASES.get(q, q)
    low = {p.lower(): p for p in provinces}
    if q.lower() in low:
        return low[q.lower()]
    m = difflib.get_close_matches(q.lower(), list(low), n=1, cutoff=0.7)
    return low[m[0]] if m else None
