"""The 2 presentation visualizations for CSC345 Phase 1, drawn from eda_results.json.

Usage: python3 eda_spaceship_titanic.py "train (2).csv" && python3 make_charts.py
Writes charts/viz1_cryosleep.(png|svg) and charts/viz2_cabin_side.(png|svg): 16:9 with title and source, for Canva or reports.
Also writes charts/deck_viz1.png and charts/deck_viz2.png: no title or source, sized for the deck's chart area (build_deck.js).
"""
import json
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

HERE = Path(__file__).parent
R = json.loads((HERE / "eda_results.json").read_text())
OUT = HERE / "charts"
OUT.mkdir(exist_ok=True)

# Palette: colour-blind-checked pair (blue / orange); text stays in neutral ink, never series colour
BLUE, ORANGE = "#2a78d6", "#eb6834"
INK, INK2, MUTED, GRID, SURFACE = "#0b0b0b", "#52514e", "#8a8983", "#e3e2dc", "#ffffff"
BASE = R["target_share_true"]

plt.rcParams.update({
    "font.family": ["Helvetica Neue", "Arial", "DejaVu Sans"], "font.size": 12,
    "figure.facecolor": SURFACE, "axes.facecolor": SURFACE, "savefig.facecolor": SURFACE,
    "axes.edgecolor": GRID, "axes.labelcolor": INK2, "text.color": INK,
    "xtick.color": INK2, "ytick.color": INK, "axes.spines.top": False, "axes.spines.right": False,
    "axes.spines.left": False, "legend.frameon": False,
})


def header(fig, title, subtitle, source):
    fig.text(0.04, 0.95, title, fontsize=20, fontweight="bold", color=INK, va="top")
    fig.text(0.04, 0.875, subtitle, fontsize=12.5, color=INK2, va="top")
    fig.text(0.04, 0.03, source, fontsize=9.5, color=MUTED, va="bottom")


def baseline(ax, y_top):
    ax.axvline(BASE, color=MUTED, lw=1.2, ls=(0, (4, 3)), zorder=1)
    ax.text(BASE, y_top, f"overall {BASE:.1f}%", ha="center", va="bottom", fontsize=10, color=MUTED, zorder=4,
            bbox=dict(boxstyle="square,pad=0.15", fc=SURFACE, ec="none"))


def save(fig, name, exts=("png", "svg")):
    for ext in exts:
        fig.savefig(OUT / f"{name}.{ext}", dpi=200)
    plt.close(fig)
    print("wrote", OUT / f"{name}.png")


# ---------- Visualization 1: CryoSleep, spending and age ----------
v = R["viz1"]
groups = [
    ("In CryoSleep", "In CryoSleep"),
    ("Awake, child ≤12", "Awake, child <=12"),
    ("Awake, age 13+, spent nothing", "Awake, age 13+, spent 0"),
    ("Awake, spent money", "Awake, spent > 0"),
]
def draw_viz1(ax):
    ys = range(len(groups))[::-1]
    for y, (label, key) in zip(ys, groups):
        rate, n = v[key]["rate"], v[key]["n"]
        ax.barh(y, rate, height=0.58, color=BLUE, zorder=2)
        ax.text(rate + 1.2, y, f"{rate:.1f}%", va="center", fontsize=15, fontweight="bold", color=INK, zorder=4,
                bbox=dict(boxstyle="square,pad=0.1", fc=SURFACE, ec="none"))
        ax.text(-2, y + 0.1, label, ha="right", va="center", fontsize=14, color=INK)
        ax.text(-2, y - 0.2, f"n = {n:,}", ha="right", va="center", fontsize=11, color=MUTED)
    ax.set_yticks([])
    ax.set_xlim(0, 100); ax.set_ylim(-0.6, len(groups) - 0.35)
    ax.set_xticks(range(0, 101, 25), [f"{t}%" for t in range(0, 101, 25)])
    ax.grid(axis="x", color=GRID, lw=0.8, zorder=0)
    ax.set_xlabel("Share of passengers transported", fontsize=12, labelpad=8)
    baseline(ax, len(groups) - 0.45)

fig, ax = plt.subplots(figsize=(12, 6.75))
fig.subplots_adjust(left=0.30, right=0.93, top=0.74, bottom=0.17)
draw_viz1(ax)
ratio = v["In CryoSleep"]["rate"] / v["Awake, spent > 0"]["rate"]
header(fig, "CryoSleep passengers were transported most often",
       f"{ratio:.1f}× the rate of awake passengers who spent money. Awake children were also high; awake adults and teens\n"
       "who spent nothing look much like spenders, so CryoSleep, not spending, carries the signal.",
       f"Source: Kaggle Spaceship Titanic, train.csv (n = {R['rows'] - R['viz1_excluded_rows']:,}; {R['viz1_excluded_rows']} rows with missing "
       "CryoSleep, spending or age left out). Children ≤12 never spend, so they get their own bar. Association, not cause.")
save(fig, "viz1_cryosleep")

fig, ax = plt.subplots(figsize=(7.6, 4.8))           # deck chart area on slide 6
fig.subplots_adjust(left=0.43, right=0.92, top=0.93, bottom=0.14)
draw_viz1(ax)
save(fig, "deck_viz1", exts=("png",))

# ---------- Visualization 2: cabin side on every deck (dumbbell) ----------
by = {(r["deck"], r["side"]): r for r in R["viz2"]}
decks = list("ABCDEFG")
def draw_viz2(ax):
    for y, d in zip(range(len(decks))[::-1], decks):
        p, s = by[(d, "P")]["rate"], by[(d, "S")]["rate"]
        ax.plot([p, s], [y, y], color="#c9c8c1", lw=3, solid_capstyle="round", zorder=2)
        ax.scatter([p], [y], s=150, color=BLUE, edgecolor=SURFACE, linewidth=2, zorder=3)
        ax.scatter([s], [y], s=150, color=ORANGE, edgecolor=SURFACE, linewidth=2, zorder=3)
        ax.text(p - 1.6, y, f"{p:.1f}%", ha="right", va="center", fontsize=11, color=INK2, zorder=4,
                bbox=dict(boxstyle="square,pad=0.1", fc=SURFACE, ec="none"))
        ax.text(s + 1.6, y, f"{s:.1f}%", ha="left", va="center", fontsize=11, color=INK2, zorder=4,
                bbox=dict(boxstyle="square,pad=0.1", fc=SURFACE, ec="none"))
        ax.text(101.5, y, f"+{R['side_gap_by_deck'][d]:.1f}", ha="left", va="center", fontsize=11.5, fontweight="bold", color=INK)
        ax.text(18, y + 0.1, f"Deck {d}", ha="right", va="center", fontsize=13.5, color=INK)
        ax.text(18, y - 0.24, f"n = {R['deck_n'][d]:,}", ha="right", va="center", fontsize=10, color=MUTED)
    ax.text(101.5, len(decks) - 0.45, "starboard\nlead (pts)", ha="left", va="bottom", fontsize=10, color=MUTED)
    ax.set_yticks([])
    ax.set_xlim(20, 100); ax.set_ylim(-0.6, len(decks) - 0.35)
    ax.set_xticks(range(20, 101, 20), [f"{t}%" for t in range(20, 101, 20)])
    ax.grid(axis="x", color=GRID, lw=0.8, zorder=0)
    ax.set_xlabel("Share of passengers transported", fontsize=12, labelpad=8)
    ax.set_clip_on(False)
    baseline(ax, len(decks) - 0.45)
    ax.legend(handles=[Line2D([], [], marker="o", ls="", ms=10, color=BLUE, label="Port (P)"),
                       Line2D([], [], marker="o", ls="", ms=10, color=ORANGE, label="Starboard (S)")],
              loc="lower center", bbox_to_anchor=(0.5, 1.0), ncol=2, fontsize=12, handletextpad=0.3, columnspacing=1.6)

fig, ax = plt.subplots(figsize=(12, 6.75))
fig.subplots_adjust(left=0.13, right=0.86, top=0.74, bottom=0.17)
draw_viz2(ax)
gp = R["side_rate_by_planet"]
header(fig, "Starboard was higher than port on all 7 decks",
       f"Overall {R['side_rate']['S']:.1f}% vs {R['side_rate']['P']:.1f}%. It also holds within each home planet "
       f"(Earth {gp['Earth']['P']:.0f}→{gp['Earth']['S']:.0f}%, Europa {gp['Europa']['P']:.0f}→{gp['Europa']['S']:.0f}%, "
       f"Mars {gp['Mars']['P']:.0f}→{gp['Mars']['S']:.0f}%).\nThe leads on decks D and E are small. Decks A–C hold only Europa passengers.",
       f"Source: Kaggle Spaceship Titanic, train.csv (n = {R['rows'] - R['viz2_excluded_rows']:,}; {R['missing_by_col']['Cabin']} rows "
       f"with no cabin and deck T, n = {R['deck_n']['T']}, left out). Association, not cause.")
save(fig, "viz2_cabin_side")

fig, ax = plt.subplots(figsize=(8.1, 4.8))           # deck chart area on slide 7
fig.subplots_adjust(left=0.15, right=0.84, top=0.86, bottom=0.14)
draw_viz2(ax)
save(fig, "deck_viz2", exts=("png",))
