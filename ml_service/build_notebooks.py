"""Generates the four CRISP-DM notebooks (run once; then executed with nbconvert)."""
import nbformat as nbf
from nbformat.v4 import new_notebook, new_markdown_cell as md, new_code_cell as code

SETUP = '''import sys, os, json, warnings
warnings.filterwarnings("ignore")
ROOT = os.path.abspath("..")
sys.path.insert(0, os.path.join(ROOT, "src"))
import numpy as np, pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
%matplotlib inline
import prep
FIG = os.path.join(ROOT, "reports", "figures"); os.makedirs(FIG, exist_ok=True)
RAW = os.path.join(ROOT, "data", "wfp_food_prices_zmb.csv")
PROC = os.path.join(ROOT, "data", "processed"); os.makedirs(PROC, exist_ok=True)
MODELS = os.path.join(ROOT, "models"); os.makedirs(MODELS, exist_ok=True)
plt.rcParams.update({"figure.dpi": 110, "axes.spines.top": False, "axes.spines.right": False,
                     "axes.grid": True, "grid.alpha": .25, "figure.autolayout": True})
def save(name):
    plt.savefig(os.path.join(FIG, name), bbox_inches="tight"); plt.show()
'''

# =====================================================================
# 01 - Business + data understanding
# =====================================================================
nb1 = new_notebook(cells=[
md('''# 01 · Business & Data Understanding  (CRISP-DM phases 1–2)

**Project:** Province-level, one-month-ahead food price forecasting for Zambia (WFP Food Prices dataset).

## Phase 1 – Business understanding
| Item | Decision |
|---|---|
| Business goal | Give planners/NGOs a quick next-month price outlook for each commodity in each province |
| Data-mining goal | Time-series regression: predict next month's price for every *province × commodity* series, with a lower/upper bound |
| Forecast target | price in month *t+1*, where *t* is the **last observation** of that series (e.g. last Beans/Central record = Jun-2025 → forecast Jul-2025) |
| Success criterion | Error under **10 %**. We read this as **MAPE < 10 %** (mean absolute *percentage* error) and also report MAE in ZMW |
| Deployment | FastAPI service: `/health`, `/commodities`, `/predict` |

Phase 2 below explores the data to find out what is (and is not) feasible.'''),
code(SETUP),
md('## 2.1 Load and describe the raw data'),
code('''raw = pd.read_csv(RAW, parse_dates=["date"])
print(raw.shape)
display(raw.head())
display(raw.describe(include="all").T[["count","unique","top","min","max"]])
print("missing values per column:\\n", raw.isna().sum()[raw.isna().sum()>0])'''),
md('''**Observations** – no missing cells, one currency (ZMW), only *Retail* prices, 10 provinces (`admin1`; note WFP spells Muchinga as *Muchiga*). The data are market-level, so we must **aggregate to province level**.'''),
md('## 2.2 Coverage over time – the dataset is very uneven'),
code('''raw["year"] = raw.date.dt.year
fig, ax = plt.subplots(figsize=(9,3.5))
raw.groupby("year").size().plot.bar(ax=ax, color="#2a6f97")
ax.set_title("Number of price records per year"); ax.set_ylabel("records")
save("01_records_per_year.png")'''),
code('''pivot = raw.pivot_table(index="commodity", columns="year", values="price", aggfunc="size", fill_value=0)
fig, ax = plt.subplots(figsize=(11,8))
im = ax.imshow(np.log1p(pivot.values), aspect="auto", cmap="Blues")
ax.set_yticks(range(len(pivot))); ax.set_yticklabels(pivot.index, fontsize=7)
ax.set_xticks(range(len(pivot.columns))); ax.set_xticklabels(pivot.columns, rotation=90, fontsize=7)
ax.grid(False); ax.set_title("Records per commodity and year (log scale)"); plt.colorbar(im, label="log(1+records)")
save("01_commodity_year_heatmap.png")'''),
md('''**Observations** – two survey eras: 2012-2022 (staples, *Beans (dry)*, *Rice (local)*, …) and Nov-2023 onward (a broader basket: *Beans*, *Rice*, eggs, sugar, …). Several commodities exist for only a short window (Cassava meal, Millet, Sorghum end 2016).'''),
md('## 2.3 Naming and unit inconsistencies'),
code('''units = raw.groupby(["commodity","unit"]).agg(first=("date","min"), last=("date","max"), n=("price","size"), median_price=("price","median")).reset_index()
display(units)'''),
md('''**Data-quality findings that drive Phase 3 decisions**
1. *Beans (dry)* (2012–2022) and *Beans* (2023–2025) are the same product → **merge**; likewise *Rice (local)* → *Rice*.
2. The same commodity is quoted in different pack sizes (maize meal 25 KG vs KG, oil 750 ML / 2.5 L / 5 L, …). Prices are **converted to a standard unit** (per KG / per L) so they can be modelled together.
3. Clear typos exist (milk at **ZMW 12,000**) → aggregate with the **median** instead of the mean.
4. Some series have a gap of >1 year between the two survey eras → we do **not** impute across such gaps; the series is split.'''),
code('''display(raw.sort_values("price", ascending=False).head(6)[["date","admin1","market","commodity","unit","price"]])
print(raw.priceflag.value_counts())'''),
md('## 2.4 Price dynamics and seasonality'),
code('''h = prep.harmonise(raw)
key = ["Maize (white)","Beans","Maize meal (white, roller)","Rice"]
fig, axes = plt.subplots(2,2, figsize=(11,6))
for ax, c in zip(axes.ravel(), key):
    s = h[h.commodity_std==c].groupby(["unit_std","month"]).price_std.median().reset_index()
    for u, g in s.groupby("unit_std"):
        ax.plot(g.month, g.price_std, lw=1.2, label=u)
    ax.set_title(f"{c} – national median price (ZMW per std unit)"); ax.legend(fontsize=7)
save("01_price_trends_key_commodities.png")'''),
code('''# seasonality of white maize: month-of-year deviation from yearly mean (log)
m = h[(h.commodity_std=="Maize (white)")&(h.unit_std=="KG")].groupby("month").price_std.median()
lm = np.log(m); dev = lm - lm.rolling(12, center=True, min_periods=6).mean()
seas = dev.groupby(dev.index.month).mean()
fig, ax = plt.subplots(figsize=(7,3.2))
ax.bar(seas.index, seas.values*100, color="#8fb339"); ax.set_xticks(range(1,13))
ax.set_title("White maize: average seasonal deviation from trend (%)"); ax.set_xlabel("month")
save("01_maize_seasonality.png")'''),
md('''**Observations** – strong inflation trend (white maize ~ZMW 0.7/kg in 2003 → 3.6 in 2022) and a visible seasonal cycle (lean-season highs before the harvest). Therefore the model works on **log price changes** (scale-free) and includes calendar/seasonal features.'''),
md('## 2.5 Province panel feasibility'),
code('''agg = prep.aggregate_province(h)
s = agg.groupby(["province","commodity","unit"]).agg(n=("price","size"), first=("month","min"), last=("month","max")).reset_index()
s["span"] = (s["last"].dt.year-s["first"].dt.year)*12 + s["last"].dt.month - s["first"].dt.month + 1
s["coverage"] = s.n/s.span
print("province-commodity-unit series:", len(s))
fig, ax = plt.subplots(1,2, figsize=(10,3.3))
s.n.plot.hist(bins=30, ax=ax[0], color="#2a6f97"); ax[0].set_title("Observed months per series")
s.coverage.plot.hist(bins=20, ax=ax[1], color="#e07a5f"); ax[1].set_title("Share of months observed inside series span")
save("01_series_length_and_coverage.png")
print((s.n>=12).sum(), "series have >= 12 monthly observations")'''),
md('''**Conclusion of Phase 2** – Short series (many have just ~20 months) mean a *single model per series* (ARIMA/ETS) would be unreliable. We will train **one pooled regression model** across all provinces and commodities on lag/seasonal features of the log-price, which also lets sparse series borrow strength from the others. Proceed to notebook 02.'''),
])

# =====================================================================
# 02 - Data preparation
# =====================================================================
nb2 = new_notebook(cells=[
md('''# 02 · Data Preparation  (CRISP-DM phase 3)

Steps: harmonise names/units → aggregate markets to **province-month** → build a complete monthly grid → **seasonal imputation of the remaining gaps, with an explicit `is_imputed` flag** → feature engineering → save.'''),
code(SETUP),
md('## 3.1 Harmonise commodity names and units'),
code('''raw = pd.read_csv(RAW)
h = prep.harmonise(raw)
display(h.groupby(["commodity_std","unit_std"]).size().rename("records").reset_index())'''),
md('''## 3.2 Aggregate to province level
Median across all markets in the province for each month. `n_markets` is kept as a feature (reliability of the aggregate).'''),
code('''agg = prep.aggregate_province(h)
print(agg.shape); display(agg.head())'''),
md('''## 3.3 Monthly grid + seasonal imputation (flagged)

* The grid runs from the first to the last *real* observation of each series (we never extrapolate beyond the last real record – so the "last observation date" is always a real one).
* Interior gaps are filled with **seasonal imputation**: linear interpolation of the log-price trend + a (shrunk) month-of-year seasonal effect estimated from that series' own history.
* **Every imputed value gets `is_imputed = 1`**, and that flag is passed to the models as features (`is_imputed_t`, `imp_share_6`) and used to exclude imputed targets from evaluation (we never score a model against a number we invented).
* Gaps longer than 6 months (e.g. between survey eras) are *not* bridged: the series is split into segments.
* Series with < 12 real observations are dropped.'''),
code('''panel = prep.build_monthly_panel(agg)
print("rows:", len(panel), "| series (incl. old segments):", panel.series_id.nunique(),
      "| latest-segment series:", panel.loc[panel.is_latest_segment==1,"series_id"].nunique())
print("imputed share: %.2f%%" % (panel.is_imputed.mean()*100))
display(panel[panel.is_imputed==1].head())'''),
code('''# Example of imputation: choose the series with most imputed months
sid = panel.groupby("series_id").is_imputed.sum().idxmax()
g = panel[panel.series_id==sid]
fig, ax = plt.subplots(figsize=(10,3.6))
ax.plot(g.month, g.price, color="#2a6f97", lw=1.2, label="series used by model")
ax.scatter(g.month[g.is_imputed==0], g.price_raw[g.is_imputed==0], s=12, color="#2a6f97", label="observed")
ax.scatter(g.month[g.is_imputed==1], g.price[g.is_imputed==1], s=45, color="#e63946", marker="x", label="imputed (flag = 1)")
ax.set_title(f"Seasonal imputation example – {sid}"); ax.legend()
save("02_imputation_example.png")'''),
code('''imp = panel.groupby("commodity").is_imputed.mean().sort_values()*100
fig, ax = plt.subplots(figsize=(7,5)); imp.plot.barh(ax=ax, color="#e07a5f")
ax.set_title("Share of months imputed, by commodity (%)")
save("02_imputed_share_by_commodity.png")'''),
md('''## 3.4 Feature engineering (all computed only from information available at month *t*)

| Group | Features | Rationale |
|---|---|---|
| `lags` | log-price k months ago relative to now, k ∈ {1,2,3,6,12} | autoregression, annual cycle |
| `momentum` | 1/3/6-month log change | trend |
| `rolling` | mean/std of monthly changes (3, 6 months) | local drift and volatility |
| `seasonal` | sin/cos of month, **seasonal index** = past average change into the target calendar month | seasonality |
| `imputation` | `is_imputed_t`, share of imputed months in last 6, `n_markets_t` | **lets the algorithm know which observations are imputed** and how reliable the aggregate is |
| `series_id` | province code, commodity code, log price level | series identity |
| `cross_section` | mean momentum of the same commodity in the *other* provinces, price relative to other provinces | prices co-move nationally |

**Target:** `y = log(price_{t+1}) − log(price_t)`; predicted price = `price_t · exp(ŷ)`.'''),
code('''pc, cc = prep.codes(panel)
F = prep.make_features(panel, pc, cc)
print(F.shape); display(F[["series_id","month","price","is_imputed_t","y","y_price","y_imputed"]+prep.ALL_FEATURES[:6]].head())
print("missing share per feature:"); print(F[prep.ALL_FEATURES].isna().mean().round(3).to_string())'''),
code('''fig, ax = plt.subplots(1,2, figsize=(10,3.3))
F.y.clip(-.6,.6).plot.hist(bins=80, ax=ax[0], color="#2a6f97"); ax[0].set_title("Target: next-month log price change (clipped for display)")
F.groupby(F.month.dt.month).y.mean().mul(100).plot.bar(ax=ax[1], color="#8fb339"); ax[1].set_title("Mean next-month change by current calendar month (%)")
save("02_target_distribution_and_seasonality.png")'''),
code('''panel.to_csv(os.path.join(PROC, "panel_monthly.csv"), index=False)
F.to_csv(os.path.join(PROC, "features.csv"), index=False)
json.dump({"province_codes": pc, "commodity_codes": cc}, open(os.path.join(PROC, "codes.json"), "w"), indent=1)
print("saved panel_monthly.csv, features.csv, codes.json")'''),
md('Proceed to notebook 03 (modelling and ablation).'),
])

# =====================================================================
# 03 - Modelling + ablation
# =====================================================================
nb3 = new_notebook(cells=[
md('''# 03 · Modelling & Ablation Study  (CRISP-DM phase 4)

Plan
1. Chronological split **inside every series** (first 70 % train / next 15 % validation / last 15 % test) – no random shuffling, so no future leaks into the past of a series.
2. Baselines: naive (last value) and seasonal-naive.
3. **Screen 8 regression algorithms** on validation MAPE → keep the **5 best**.
4. Light hyper-parameter tuning on validation.
5. **Ablation study** on the 5 models: remove one feature group at a time, and test excluding imputed rows from training.
6. Pick the best (smallest validation MAPE, must be < 10 %), build **prediction intervals** (normalised split-conformal), report the test result, refit on all data and save.

Metrics are always computed on **real** target months only (`y_imputed == 0`).'''),
code(SETUP + '''
import time
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.ensemble import RandomForestRegressor, ExtraTreesRegressor, HistGradientBoostingRegressor
import lightgbm as lgb, xgboost as xgb
F = pd.read_csv(os.path.join(PROC, "features.csv"), parse_dates=["month","next_month"])
codes = json.load(open(os.path.join(PROC, "codes.json")))
F = F.sort_values(["series_id","month"]).reset_index(drop=True)'''),
md('## 4.1 Chronological split inside each series'),
code('''F["rk"] = F.groupby("series_id").cumcount(); F["n"] = F.groupby("series_id").month.transform("size")
F["split"] = np.where(F.rk >= F.n*0.85, "test", np.where(F.rk >= F.n*0.70, "val", "train"))
print(F.split.value_counts())
fig, ax = plt.subplots(figsize=(9,2.8))
F.groupby(["month","split"]).size().unstack(fill_value=0).plot.area(ax=ax, stacked=True, alpha=.8)
ax.set_title("Rows per month and split (each series is cut chronologically)")
save("03_split_timeline.png")'''),
md('''## 4.2 Metrics and baselines
`MAPE` is the headline metric (target < 10 %). `MAE` is in ZMW per standard unit; `MdAPE` is the median % error.'''),
code('''def metrics(d, pred_price):
    ok = d.y_imputed.values == 0
    y, p = d.y_price.values[ok], np.asarray(pred_price)[ok]
    ape = np.abs(y-p)/y
    return {"MAPE_%": ape.mean()*100, "MdAPE_%": np.median(ape)*100, "MAE_ZMW": np.abs(y-p).mean(), "n": int(ok.sum())}

tr = F[F.split=="train"]; va = F[F.split=="val"]; te = F[F.split=="test"]
rows = []
for name, fn in {"naive (last value)": lambda d: d.price.values,
                 "seasonal naive (+avg change)": lambda d: d.price.values*np.exp(d.seas_index.fillna(0).values)}.items():
    rows.append({"model": name, **{f"val_{k}":v for k,v in metrics(va, fn(va)).items() if k!="n"},
                 **{f"test_{k}":v for k,v in metrics(te, fn(te)).items()}})
baselines = pd.DataFrame(rows); display(baselines.round(3))'''),
md('''## 4.3 Screening 8 candidate algorithms

Models are trained on the **log price change**. Tree boosters use an **L1 loss** (it matches MAE/MAPE better than squared error and is robust to the occasional price spike). Linear/forest models get a median imputer for missing lags (and scaling for the linear ones); LightGBM/XGBoost/HistGB handle missing values natively.'''),
code('''def make_model(name, **kw):
    if name == "Ridge":        return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), Ridge(alpha=kw.get("alpha", 10)))
    if name == "ElasticNet":   return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(), ElasticNet(alpha=kw.get("alpha", 0.001), l1_ratio=kw.get("l1_ratio", .5), max_iter=5000))
    if name == "RandomForest": return make_pipeline(SimpleImputer(strategy="median"), RandomForestRegressor(n_estimators=kw.get("n_estimators", 300), min_samples_leaf=kw.get("min_samples_leaf", 10), max_features=kw.get("max_features", .5), n_jobs=-1, random_state=0))
    if name == "ExtraTrees":   return make_pipeline(SimpleImputer(strategy="median"), ExtraTreesRegressor(n_estimators=kw.get("n_estimators", 300), min_samples_leaf=kw.get("min_samples_leaf", 10), max_features=kw.get("max_features", .7), n_jobs=-1, random_state=0))
    if name == "HistGradientBoosting": return HistGradientBoostingRegressor(loss="absolute_error", learning_rate=kw.get("learning_rate", .05), max_iter=kw.get("max_iter", 300), max_leaf_nodes=kw.get("max_leaf_nodes", 15), min_samples_leaf=kw.get("min_samples_leaf", 20), random_state=0)
    if name == "LightGBM":     return lgb.LGBMRegressor(objective="l1", n_estimators=kw.get("n_estimators", 300), learning_rate=kw.get("learning_rate", .03), num_leaves=kw.get("num_leaves", 15), min_child_samples=kw.get("min_child_samples", 20), subsample=.8, subsample_freq=1, colsample_bytree=.8, verbose=-1, random_state=0, n_jobs=-1)
    if name == "XGBoost":      return xgb.XGBRegressor(objective="reg:absoluteerror", n_estimators=kw.get("n_estimators", 300), learning_rate=kw.get("learning_rate", .03), max_depth=kw.get("max_depth", 4), subsample=.8, colsample_bytree=.8, min_child_weight=kw.get("min_child_weight", 5), random_state=0, n_jobs=-1)
    if name == "GradientBoosting(sklearn)":
        from sklearn.ensemble import GradientBoostingRegressor
        return make_pipeline(SimpleImputer(strategy="median"), GradientBoostingRegressor(loss="absolute_error", n_estimators=200, max_depth=3, learning_rate=.05, subsample=.8, random_state=0))

CANDIDATES = ["Ridge","ElasticNet","RandomForest","ExtraTrees","HistGradientBoosting","LightGBM","XGBoost","GradientBoosting(sklearn)"]
FEATS = prep.ALL_FEATURES
def fit_eval(name, feats=FEATS, train=tr, **kw):
    m = make_model(name, **kw); t = time.time()
    m.fit(train[feats], train.y)
    pv = va.price.values*np.exp(m.predict(va[feats])); pt = te.price.values*np.exp(m.predict(te[feats]))
    return m, metrics(va, pv), metrics(te, pt), time.time()-t

screen = []
for name in CANDIDATES:
    _, mv, mt, sec = fit_eval(name)
    screen.append({"model": name, "val_MAPE_%": mv["MAPE_%"], "val_MAE_ZMW": mv["MAE_ZMW"], "test_MAPE_%": mt["MAPE_%"], "test_MAE_ZMW": mt["MAE_ZMW"], "fit_sec": sec})
screen = pd.DataFrame(screen).sort_values("val_MAPE_%").reset_index(drop=True)
display(screen.round(3))
TOP5 = screen.model.head(5).tolist(); print("Top-5 by validation MAPE:", TOP5)'''),
code('''fig, ax = plt.subplots(figsize=(8,4))
x = np.arange(len(screen)); w = .38
ax.bar(x-w/2, screen["val_MAPE_%"], w, label="validation", color="#2a6f97"); ax.bar(x+w/2, screen["test_MAPE_%"], w, label="test", color="#e07a5f")
ax.axhline(10, color="k", ls="--", lw=1); ax.text(len(screen)-.5, 10.1, "10 % target", ha="right", fontsize=8)
nv = baselines.loc[0]; ax.axhline(nv["val_MAPE_%"], color="#2a6f97", ls=":", lw=1); ax.axhline(nv["test_MAPE_%"], color="#e07a5f", ls=":", lw=1)
ax.set_xticks(x); ax.set_xticklabels(screen.model, rotation=30, ha="right"); ax.set_ylabel("MAPE (%)")
ax.set_title("Model screening (dotted lines = naive baseline)"); ax.legend()
save("03_model_screening.png")'''),
md('''## 4.4 Light hyper-parameter tuning (validation set only)
A small grid per model; test data are never used for tuning.'''),
code('''GRIDS = {
 "Ridge": [{"alpha": a} for a in [1, 10, 100, 1000]],
 "ElasticNet": [{"alpha": a, "l1_ratio": l} for a in [1e-4, 1e-3, 1e-2] for l in [.2,.8]],
 "RandomForest": [{"min_samples_leaf": l, "max_features": f} for l in [5, 20, 50] for f in [.33, .6]],
 "ExtraTrees": [{"min_samples_leaf": l, "max_features": f} for l in [5, 20, 50] for f in [.5, .8]],
 "HistGradientBoosting": [{"learning_rate": lr, "max_leaf_nodes": n, "min_samples_leaf": s} for lr in [.03,.1] for n in [7,15] for s in [20,60]],
 "LightGBM": [{"learning_rate": lr, "num_leaves": n, "min_child_samples": s} for lr in [.02,.05] for n in [7,15,31] for s in [20,60]],
 "XGBoost": [{"learning_rate": lr, "max_depth": d, "min_child_weight": s} for lr in [.02,.05] for d in [3,5] for s in [5,20]],
 "GradientBoosting(sklearn)": [{}],
}
best_params, tuning_log = {}, []
for name in TOP5:
    best = (1e9, {})
    for p in GRIDS[name]:
        _, mv, _, _ = fit_eval(name, **p)
        tuning_log.append({"model": name, **{k:str(v) for k,v in p.items()}, "val_MAPE_%": mv["MAPE_%"]})
        if mv["MAPE_%"] < best[0]: best = (mv["MAPE_%"], p)
    best_params[name] = best[1]; print(f"{name:28s} best val MAPE {best[0]:.3f}  params {best[1]}")
pd.DataFrame(tuning_log).to_csv(os.path.join(ROOT,"reports","tuning_log.csv"), index=False)'''),
md('''## 4.5 Ablation study on the 5 best models

For each tuned model we re-train and re-evaluate after

* removing **one feature group at a time** (`lags`, `momentum`, `rolling`, `seasonal`, `imputation`, `series_id`, `cross_section`),
* keeping **only lags** (minimal autoregressive model),
* **dropping imputed rows from the training data** (does imputation help or hurt?).

A positive Δ (higher MAPE than the full model) means the removed component was useful.'''),
code('''variants = {"full": (FEATS, None)}
for g, cols in prep.FEATURE_GROUPS.items():
    variants[f"- {g}"] = ([f for f in FEATS if f not in cols], None)
variants["only lags"] = (prep.FEATURE_GROUPS["lags"], None)
variants["train w/o imputed rows"] = (FEATS, "drop_imputed")

abl, store = [], {}
for name in TOP5:
    for vname, (fs, special) in variants.items():
        train = tr if special is None else tr[(tr.is_imputed_t==0) & (tr.y_imputed==0)]
        m, mv, mt, _ = fit_eval(name, feats=fs, train=train, **best_params[name])
        abl.append({"model": name, "variant": vname, "n_features": len(fs), "val_MAPE_%": mv["MAPE_%"], "val_MAE_ZMW": mv["MAE_ZMW"], "test_MAPE_%": mt["MAPE_%"], "test_MAE_ZMW": mt["MAE_ZMW"]})
        store[(name, vname)] = (m, fs)
abl = pd.DataFrame(abl)
full = abl[abl.variant=="full"].set_index("model")
abl["delta_val_MAPE"] = abl.apply(lambda r: r["val_MAPE_%"] - full.loc[r.model, "val_MAPE_%"], axis=1)
abl["delta_test_MAPE"] = abl.apply(lambda r: r["test_MAPE_%"] - full.loc[r.model, "test_MAPE_%"], axis=1)
abl.to_csv(os.path.join(ROOT,"reports","ablation_results.csv"), index=False)
display(abl.round(3))'''),
code('''pv = abl.pivot(index="variant", columns="model", values="delta_val_MAPE").drop("full")
fig, ax = plt.subplots(figsize=(9,4.5))
im = ax.imshow(pv.values, cmap="RdBu_r", vmin=-abs(pv.values).max(), vmax=abs(pv.values).max(), aspect="auto")
ax.set_xticks(range(pv.shape[1])); ax.set_xticklabels(pv.columns, rotation=25, ha="right"); ax.set_yticks(range(pv.shape[0])); ax.set_yticklabels(pv.index)
for i in range(pv.shape[0]):
    for j in range(pv.shape[1]): ax.text(j, i, f"{pv.values[i,j]:+.2f}", ha="center", va="center", fontsize=8)
ax.grid(False); ax.set_title("Ablation: change in validation MAPE (pp) vs full model\\n(red = component helps, blue = removing it improves)"); plt.colorbar(im)
save("03_ablation_heatmap.png")'''),
code('''fig, ax = plt.subplots(figsize=(10,4.5))
piv = abl.pivot(index="variant", columns="model", values="val_MAPE_%")
piv.plot.bar(ax=ax, width=.8); ax.axhline(10, color="k", ls="--", lw=1)
ax.set_ylabel("validation MAPE (%)"); ax.set_ylim(piv.min().min()-.7, piv.max().max()+.3); ax.set_title("Ablation – validation MAPE by variant and model"); plt.xticks(rotation=30, ha="right")
save("03_ablation_bars.png")'''),
md('''**Reading the ablation** – see the heatmap. Check in particular (a) whether the `imputation` group (the flag the algorithm uses to know which values were imputed) helps, (b) whether training without imputed rows is better, (c) how much the cross-province and seasonal features contribute versus plain lags.

## 4.6 Model selection
We pick the (model, variant) with the **smallest validation MAPE** that is **under 10 %**; the test set is only used to report the final unbiased figure.'''),
code('''cand = abl.sort_values("val_MAPE_%").reset_index(drop=True)
display(cand.head(8).round(3))
under = cand[cand["val_MAPE_%"] < 10]
choice = (under if len(under) else cand).iloc[0]
MEETS_TARGET_VAL = bool(len(under))
print("CHOSEN:", choice.model, "|", choice.variant, f"| val MAPE {choice['val_MAPE_%']:.3f}  test MAPE {choice['test_MAPE_%']:.3f}  test MAE {choice['test_MAE_ZMW']:.3f} ZMW")
print("meets <10% on validation:", MEETS_TARGET_VAL, "| meets <10% on test:", choice["test_MAPE_%"] < 10)'''),
md('''## 4.7 Prediction intervals – normalised split-conformal
Residuals on the **validation** set (model trained on train only) are scaled by each series' recent volatility (`roll_std_6`, floored). The 90 % quantile of the scaled residuals `q` gives

`lower = price_t · exp(ŷ − q·σ)`, `upper = price_t · exp(ŷ + q·σ)`

Coverage is then checked on the untouched **test** set.'''),
code('''best_model, FS = store[(choice.model, choice.variant)]
SIG_FLOOR = 0.03
sig_default = float(F.roll_std_6.median())
def sigma(d): return d.roll_std_6.fillna(d.roll_std_3).fillna(sig_default).clip(lower=SIG_FLOOR).values
def interval(d, model, q):
    yh = model.predict(d[FS]); s = sigma(d)
    return d.price.values*np.exp(yh), d.price.values*np.exp(yh-q*s), d.price.values*np.exp(yh+q*s)

okv = va.y_imputed.values==0
res_v = np.abs(va.y.values - best_model.predict(va[FS]))/sigma(va)
ALPHA = .10
n = okv.sum(); q = float(np.quantile(res_v[okv], min(1, np.ceil((n+1)*(1-ALPHA))/n)))
pred, lo, hi = interval(te, best_model, q); okt = te.y_imputed.values==0
cover = np.mean((te.y_price.values[okt]>=lo[okt])&(te.y_price.values[okt]<=hi[okt]))
width = np.mean((hi-lo)[okt]/pred[okt])*100
print(f"conformal q = {q:.3f} | test coverage (target 90%) = {cover*100:.1f}% | mean relative width = {width:.1f}% of forecast")'''),
md('''## 4.8 Refit and save

* `best_model_trainonly.joblib` – trained on the train split only (used in notebook 04 for honest test evaluation).
* `best_model.joblib` – **deployed model**, same hyper-parameters, refit on *all* rows (train+val+test) so the most recent months inform the forecast. Conformal quantile `q` is kept from the validation calibration.'''),
code('''import joblib, copy
bundle_common = dict(features=FS, model_name=choice.model, variant=choice.variant, params=best_params[choice.model],
                     conformal_q=q, conformal_alpha=ALPHA, sigma_floor=SIG_FLOOR, sigma_default=sig_default,
                     province_codes=codes["province_codes"], commodity_codes=codes["commodity_codes"])
joblib.dump({**bundle_common, "model": best_model}, os.path.join(MODELS, "best_model_trainonly.joblib"))

train_all = F if choice.variant != "train w/o imputed rows" else F[(F.is_imputed_t==0)&(F.y_imputed==0)]
final = make_model(choice.model, **best_params[choice.model]).fit(train_all[FS], train_all.y)
joblib.dump({**bundle_common, "model": final, "trained_through": str(F.month.max().date())}, os.path.join(MODELS, "best_model.joblib"))
meta = {"model": choice.model, "variant": choice.variant, "params": {k:str(v) for k,v in best_params[choice.model].items()},
        "features": FS, "validation_MAPE_pct": float(choice["val_MAPE_%"]), "test_MAPE_pct": float(choice["test_MAPE_%"]),
        "test_MAE_ZMW": float(choice["test_MAE_ZMW"]), "test_MdAPE_pct": float(metrics(te, pred)["MdAPE_%"]),
        "naive_test_MAPE_pct": float(baselines.loc[0,"test_MAPE_%"]), "naive_val_MAPE_pct": float(baselines.loc[0,"val_MAPE_%"]),
        "meets_10pct_target_validation": bool(choice["val_MAPE_%"]<10), "meets_10pct_target_test": bool(choice["test_MAPE_%"]<10),
        "interval_coverage_test": float(cover), "interval_nominal": 1-ALPHA, "interval_mean_rel_width_pct": float(width),
        "n_series": int(F.series_id.nunique()), "n_training_rows": int(len(train_all))}
json.dump(meta, open(os.path.join(MODELS, "metadata.json"), "w"), indent=2); print(json.dumps(meta, indent=2))
screen.to_csv(os.path.join(ROOT,"reports","model_screening.csv"), index=False); baselines.to_csv(os.path.join(ROOT,"reports","baselines.csv"), index=False)'''),
])

# =====================================================================
# 04 - Evaluation + deployment
# =====================================================================
nb4 = new_notebook(cells=[
md('''# 04 · Evaluation & Deployment Readiness  (CRISP-DM phases 5–6)

Phase 5 – evaluate the chosen model against the business criterion on the untouched test set (using the **train-only** model, because the deployed model has seen the test months).
Phase 6 – produce the next-month forecast for every series exactly as the API will, and smoke-test the serving library.'''),
code(SETUP + '''
import joblib
from serve_lib import Forecaster
meta = json.load(open(os.path.join(MODELS, "metadata.json"))); print(json.dumps(meta, indent=1))
F = pd.read_csv(os.path.join(PROC, "features.csv"), parse_dates=["month","next_month"]).sort_values(["series_id","month"]).reset_index(drop=True)
F["rk"] = F.groupby("series_id").cumcount(); F["n"] = F.groupby("series_id").month.transform("size")
F["split"] = np.where(F.rk >= F.n*0.85, "test", np.where(F.rk >= F.n*0.70, "val", "train"))
B = joblib.load(os.path.join(MODELS, "best_model_trainonly.joblib"))
te = F[(F.split=="test")].copy()
yh = B["model"].predict(te[B["features"]])
sig = te.roll_std_6.fillna(te.roll_std_3).fillna(B["sigma_default"]).clip(lower=B["sigma_floor"]).values
te["pred"] = te.price*np.exp(yh); te["lo"] = te.price*np.exp(yh-B["conformal_q"]*sig); te["hi"] = te.price*np.exp(yh+B["conformal_q"]*sig)
te = te[te.y_imputed==0].copy()
te["ape"] = (te.pred-te.y_price).abs()/te.y_price*100; te["naive_ape"] = (te.price-te.y_price).abs()/te.y_price*100
print(f"TEST  model MAPE {te.ape.mean():.2f}% | naive MAPE {te.naive_ape.mean():.2f}% | MAE {np.abs(te.pred-te.y_price).mean():.3f} ZMW | MdAPE {te.ape.median():.2f}%")'''),
md('## 5.1 Business-criterion check (MAPE < 10 %)'),
code('''verdict = "MEETS" if te.ape.mean() < 10 else "DOES NOT MEET"
print(f"Test MAPE = {te.ape.mean():.2f}%  ->  {verdict} the 10% target;  validation MAPE = {meta['validation_MAPE_pct']:.2f}%")
print(f"share of test forecasts within 10% of actual: {(te.ape<10).mean()*100:.1f}%")'''),
md('## 5.2 Where is the model good / bad?'),
code('''bc = te.groupby("commodity").agg(MAPE=("ape","mean"), naive_MAPE=("naive_ape","mean"), n=("ape","size")).sort_values("MAPE")
fig, ax = plt.subplots(figsize=(8,6)); y = np.arange(len(bc))
ax.barh(y-.2, bc.MAPE, .4, label="model", color="#2a6f97"); ax.barh(y+.2, bc.naive_MAPE, .4, label="naive", color="#cfcfcf")
ax.axvline(10, color="k", ls="--", lw=1); ax.set_yticks(y); ax.set_yticklabels(bc.index, fontsize=8); ax.legend(); ax.set_xlabel("test MAPE (%)")
ax.set_title("Test MAPE by commodity"); save("04_mape_by_commodity.png"); display(bc.round(2))'''),
code('''bp = te.groupby("province").agg(MAPE=("ape","mean"), naive_MAPE=("naive_ape","mean"), n=("ape","size")).sort_values("MAPE")
fig, ax = plt.subplots(figsize=(7,3.6)); bp[["MAPE","naive_MAPE"]].plot.bar(ax=ax, color=["#2a6f97","#cfcfcf"])
ax.axhline(10, color="k", ls="--", lw=1); ax.set_ylabel("test MAPE (%)"); ax.set_title("Test MAPE by province"); plt.xticks(rotation=30, ha="right")
save("04_mape_by_province.png"); display(bp.round(2))'''),
code('''fig, ax = plt.subplots(1,3, figsize=(14,4))
ax[0].scatter(te.y_price, te.pred, s=5, alpha=.35, color="#2a6f97"); lim=[te.y_price.min(), te.y_price.max()]
ax[0].plot(lim, lim, "k--", lw=1); ax[0].set_xscale("log"); ax[0].set_yscale("log"); ax[0].set_xlabel("actual"); ax[0].set_ylabel("predicted"); ax[0].set_title("Actual vs predicted (log axes)")
ax[1].hist(np.log(te.y_price/te.pred).clip(-.5,.5), bins=60, color="#8fb339"); ax[1].set_title("Residual log(actual/predicted)")
te["yr"] = te.next_month.dt.year; te.groupby("yr").ape.mean().plot.bar(ax=ax[2], color="#e07a5f"); ax[2].axhline(10, color="k", ls="--", lw=1); ax[2].set_title("Test MAPE by forecast year")
save("04_diagnostics.png")'''),
md('''## 5.3 Prediction-interval quality'''),
code('''te["covered"] = (te.y_price>=te.lo)&(te.y_price<=te.hi)
print(f"90% interval coverage on test: {te.covered.mean()*100:.1f}%  | mean width {((te.hi-te.lo)/te.pred).mean()*100:.1f}% of forecast")
cov = te.groupby("commodity").covered.mean().mul(100).sort_values()
fig, ax = plt.subplots(figsize=(7,5)); cov.plot.barh(ax=ax, color="#2a6f97"); ax.axvline(90, color="k", ls="--", lw=1)
ax.set_title("Interval coverage by commodity (%) – dashed = 90% nominal"); save("04_interval_coverage.png")'''),
md('''## 5.4 Sensitivity to imputed data
How do errors change when the *current* month (the model's starting point) is itself imputed?'''),
code('''te_all = F[F.split=="test"].copy(); te_all["pred"]=te_all.price*np.exp(B["model"].predict(te_all[B["features"]]))
te_all = te_all[te_all.y_imputed==0]; te_all["ape"]=(te_all.pred-te_all.y_price).abs()/te_all.y_price*100
print(te_all.groupby("is_imputed_t").ape.agg(["mean","median","size"]).round(2).rename(index={0:"start month observed",1:"start month imputed"}))'''),
md('''## 6.1 Next-month forecasts for every series (exactly as served)
`Forecaster` is the same class the API uses: forecast month = last observation month + 1.'''),
code('''fc = Forecaster(os.path.join(MODELS, "best_model.joblib"), os.path.join(PROC, "panel_monthly.csv"))
allf = pd.DataFrame(fc.predict_rows(fc.last)); allf.to_csv(os.path.join(ROOT,"reports","next_month_forecasts.csv"), index=False)
print(len(allf), "series forecast"); display(allf.head(10))
print(fc.predict_rows(fc.resolve("fresh beans","Central")[1]))'''),
code('''# plot history + forecast + interval for a few series
pick = ["Central|Beans|KG","Lusaka|Maize meal (white, roller)|KG","Copperbelt|Sugar|KG","Southern|Eggs|30 pcs"]
pick = [p for p in pick if p in fc.last.index][:4]
fig, axes = plt.subplots(2,2, figsize=(12,6))
for ax, sid in zip(axes.ravel(), pick):
    g = fc.panel[fc.panel.series_id==sid].tail(36); r = allf[allf.series_id==sid].iloc[0]
    ax.plot(g.month, g.price, color="#2a6f97", marker="o", ms=3); ax.scatter(g.month[g.is_imputed==1], g.price[g.is_imputed==1], color="red", marker="x", s=40, zorder=3)
    d = pd.to_datetime(r.forecast_date+"-01"); ax.errorbar([d],[r.predicted_price], yerr=[[r.predicted_price-r.lower_bound],[r.upper_bound-r.predicted_price]], fmt="s", color="#e07a5f", capsize=4)
    ax.set_title(sid, fontsize=9)
save("04_example_forecasts.png")'''),
md('''## 6.2 Conclusions & deployment notes
* Model, features, conformal quantile and codes are stored in `models/best_model.joblib`; the API loads it together with `data/processed/panel_monthly.csv` (history incl. the `is_imputed` flag).
* Re-training: re-run notebooks 02 → 03 with new WFP data; the API picks up the new artefacts at restart.
* Limitations: monthly prices of this dataset are noisy (market sample changes between rounds); several commodities end years ago, so a forecast is still "next month after the last record" but may be stale – the API flags this.'''),
])

for n, nb in {"01_business_data_understanding": nb1, "02_data_preparation": nb2,
              "03_modeling_ablation": nb3, "04_evaluation_deployment": nb4}.items():
    nb.metadata["kernelspec"] = {"display_name": "Python 3", "language": "python", "name": "python3"}
    nbf.write(nb, f"notebooks/{n}.ipynb")
print("written")
