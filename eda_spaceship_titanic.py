"""CSC345 Project Phase 1 - EDA of Kaggle's Spaceship Titanic (train.csv).

Usage: python3 eda_spaceship_titanic.py path/to/train.csv
Writes eda_results.json (every number used in the slides) next to this script.
"""
import json
import sys
from pathlib import Path

import pandas as pd

SPEND = ["RoomService", "FoodCourt", "ShoppingMall", "Spa", "VRDeck"]

df = pd.read_csv(sys.argv[1] if len(sys.argv) > 1 else "train.csv")
out = {}

# ---- 1. Attribute summary & data problems (raw data) ----
out["rows"], out["cols"] = df.shape
out["missing_by_col"] = df.isna().sum().to_dict()
out["missing_pct_by_col"] = (df.isna().mean() * 100).round(1).to_dict()
out["rows_with_any_missing"] = int(df.isna().any(axis=1).sum())
out["duplicate_ids"] = int(df.PassengerId.duplicated().sum())
out["target_share_true"] = round(df.Transported.mean() * 100, 1)
out["age_zero"] = int((df.Age == 0).sum())
out["age_min_max_median"] = [df.Age.min(), df.Age.max(), df.Age.median()]
out["vip_share"] = round(df.VIP.mean() * 100, 1)
out["spend_median"] = {c: df[c].median() for c in SPEND}
out["spend_max"] = {c: df[c].max() for c in SPEND}
# share of zeros among known (non-missing) values
out["spend_zero_pct"] = {c: round((df[c].dropna() == 0).mean() * 100, 1) for c in SPEND}

# ---- 2. Cleaning / feature engineering ----
d = df.copy()
d[["Deck", "CabinNum", "Side"]] = d.Cabin.str.split("/", expand=True)
d["Group"] = d.PassengerId.str[:4]
d["GroupSize"] = d.groupby("Group").Group.transform("size")

# Consistency check: nobody in CryoSleep spends anything
cryo = d.CryoSleep == True  # noqa: E712 (column is object dtype with NaN)
out["cryo_with_positive_spend"] = int((d.loc[cryo, SPEND].fillna(0).sum(axis=1) > 0).sum())
out["cryo_spend_nan_cells"] = int(d.loc[cryo, SPEND].isna().sum().sum())
# -> rule-based imputation: missing spend of a CryoSleep passenger = 0
d.loc[cryo, SPEND] = d.loc[cryo, SPEND].fillna(0)
# Children 12 and under: check whether they ever spend
kids = d.Age <= 12
out["kids_with_positive_spend"] = int((d.loc[kids, SPEND].fillna(0).sum(axis=1) > 0).sum())
out["kids_n"] = int(kids.sum())
out["kids_spend_nan_cells_filled"] = int(d.loc[kids, SPEND].isna().sum().sum())  # awake children only; CryoSleep ones already filled
d.loc[kids, SPEND] = d.loc[kids, SPEND].fillna(0)
out["spend_cells_filled_total"] = out["cryo_spend_nan_cells"] + out["kids_spend_nan_cells_filled"]
out["spend_nan_cells_after_rules"] = int(d[SPEND].isna().sum().sum())
# TotalSpend stays NaN unless all 5 amounts are known (avoids treating a missing amount as 0)
d["TotalSpend"] = d[SPEND].sum(axis=1, min_count=len(SPEND))

# ---- 3. Visualization 1: CryoSleep x spending (x age) vs Transported ----
# Children <=12 never spend, so the awake zero-spend group is split by age;
# otherwise it is mostly children and mixes an age effect into "spent 0".
known = d.CryoSleep.notna() & d.TotalSpend.notna()
awake0 = known & (d.CryoSleep == False) & (d.TotalSpend == 0)  # noqa: E712
known &= ~(awake0 & d.Age.isna())  # awake zero-spenders with unknown age can't be placed
v = d[known].copy()
v["State"] = "Awake, spent > 0"
v.loc[(v.CryoSleep == False) & (v.TotalSpend == 0) & (v.Age > 12), "State"] = "Awake, age 13+, spent 0"  # noqa: E712
v.loc[(v.CryoSleep == False) & (v.TotalSpend == 0) & (v.Age <= 12), "State"] = "Awake, child <=12"  # noqa: E712
v.loc[v.CryoSleep == True, "State"] = "In CryoSleep"  # noqa: E712
g = v.groupby("State").Transported.agg(["mean", "size"])
out["viz1"] = {k: {"rate": round(r["mean"] * 100, 1), "n": int(r["size"])} for k, r in g.iterrows()}
out["viz1_excluded_rows"] = int((~known).sum())
out["viz1_excluded_rate"] = round(d.loc[~known, "Transported"].mean() * 100, 1)
out["awake0_child_share"] = round((d.loc[awake0, "Age"] <= 12).mean() * 100, 1)
out["cryo_rate"] = round(d[cryo].Transported.mean() * 100, 1)
out["awake_rate"] = round(d[d.CryoSleep == False].Transported.mean() * 100, 1)  # noqa: E712

# ---- 4. Visualization 2: Cabin deck x side vs Transported ----
c = d[d.Deck.notna()]
t = c.groupby(["Deck", "Side"]).Transported.agg(["mean", "size"]).reset_index()
out["viz2"] = [
    {"deck": r.Deck, "side": r.Side, "rate": round(r["mean"] * 100, 1), "n": int(r["size"])}
    for _, r in t.iterrows()
]
side_tab = c.groupby(["Deck", "Side"]).Transported.mean().unstack()
out["side_gap_by_deck"] = ((side_tab.S - side_tab.P) * 100).round(1).to_dict()  # starboard minus port, in points
out["side_rate"] =(c.groupby("Side").Transported.mean() * 100).round(1).to_dict()
out["deck_rate"] = (c.groupby("Deck").Transported.mean() * 100).round(1).to_dict()
out["deck_n"] = c.Deck.value_counts().to_dict()
out["viz2_excluded_rows"] = int(d.Cabin.isna().sum() + (d.Deck == "T").sum())  # no cabin + deck T (n too small)
out["no_cabin_rate"] = round(d.loc[d.Cabin.isna(), "Transported"].mean() * 100, 1)
# Does the side pattern survive within each home planet? (deck is confounded with planet)
# Does deck still matter inside one home planet? (rate and n for every planet x deck cell with passengers)
pdk = c.groupby(["HomePlanet", "Deck"]).Transported.agg(["mean", "size"])
out["planet_deck"] = {f"{p}/{k}": {"rate": round(r["mean"] * 100, 1), "n": int(r["size"])} for (p, k), r in pdk.iterrows()}
out["side_rate_by_planet"] =(c.groupby(["HomePlanet", "Side"]).Transported.mean() * 100).round(1).unstack().to_dict("index")

# ---- 5. Supporting EDA (reported as text, not as extra plots) ----
for col in ["HomePlanet", "Destination", "VIP"]:
    out[f"rate_by_{col}"] = (d.groupby(col).Transported.mean() * 100).round(1).to_dict()
age_bins = pd.cut(d.Age, [-1, 12, 17, 25, 40, 60, 80], labels=["0-12", "13-17", "18-25", "26-40", "41-60", "61+"])
out["rate_by_age"] = (d.groupby(age_bins, observed=True).Transported.mean() * 100).round(1).to_dict()
out["rate_by_groupsize"] = (d.groupby(d.GroupSize).Transported.mean() * 100).round(1).to_dict()
out["rate_alone_vs_group"] = (d.groupby(d.GroupSize > 1).Transported.mean() * 100).round(1).to_dict()
out["cryo_share_by_planet"] = (d.groupby("HomePlanet").CryoSleep.apply(lambda s: (s == True).mean() * 100).round(1).to_dict())  # noqa: E712
out["decks_by_planet"] = {p: s.value_counts().to_dict() for p, s in d.groupby("HomePlanet").Deck}

Path(__file__).with_name("eda_results.json").write_text(json.dumps(out, indent=2, default=str))
print(json.dumps(out, indent=2, default=str))
