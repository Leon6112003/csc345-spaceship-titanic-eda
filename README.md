# Who Got Transported? — Spaceship Titanic EDA

CSC345 Project Phase 1 (EDA & Data Visualization) on Kaggle's
[Spaceship Titanic](https://www.kaggle.com/competitions/spaceship-titanic) training data.

## Files

| File | What it does |
|---|---|
| `eda_spaceship_titanic.py` | Data summary, data-quality checks, rule-based cleaning, and every statistic used in the slides. Writes `eda_results.json` |
| `spaceship-titanic_corrected.ipynb` | Full exploratory notebook (distributions, interactions, correlation, mutual information, key findings) |
| `make_charts.py` | Draws the two presentation visualizations from `eda_results.json` into `charts/` |
| `build_deck.js` | Builds the slide deck (PptxGenJS) from `eda_results.json` and `charts/` |
| `charts/` | The two visualizations, PNG and SVG |

## Run it

1. Download `train.csv` from the competition's Data tab (the dataset is not included here).
2. Install and run:

```bash
pip install -r requirements.txt
python3 eda_spaceship_titanic.py path/to/train.csv
python3 make_charts.py
```

The notebook reads `~/Downloads/train (2).csv` by default; set `TRAIN_CSV=path/to/train.csv` to use another file.
Optionally put `test.csv` in place and set `TEST_CSV` to enable the train-vs-test check.

To rebuild the deck: `npm install`, copy `team.example.json` to `team.json` and fill it in, then `node build_deck.js`.

## Main findings (association, not cause)

- CryoSleep passengers were transported 81.8% of the time vs 32.9% awake.
- Awake children (≤12) were transported 68.2%; awake passengers 13+ who spent nothing, 36.2%, close to spenders (30.1%).
- Starboard cabins were transported more often than port on all 7 decks, and within each home planet.

## AI use

AI assistance (Claude, Anthropic) was used for code, statistics, charts and slide drafts, as described
in the AI Declaration slide of the presentation.
