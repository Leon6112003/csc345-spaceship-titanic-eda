// Builds CSC345_Phase1_SpaceshipTitanic.pptx from eda_results.json (produced by eda_spaceship_titanic.py)
const pptxgen = require("pptxgenjs");
const R = require("./eda_results.json");

const C = {
  night: "0B1A33", ink: "0B0B0B", ink2: "52514E", muted: "8A8983",
  line: "E3E2DC", card: "F3F5F9", blue: "2A78D6", orange: "EB6834", white: "FFFFFF", ice: "B9CCEA",
};
const HEAD = "Cambria", BODY = "Calibri";
const fmt = (n) => n.toLocaleString("en-US");
const ALT_VIZ1 = `Bar chart of the share transported: in CryoSleep ${R.viz1["In CryoSleep"].rate}%, awake children 12 or under ${R.viz1["Awake, child <=12"].rate}%, awake age 13+ who spent nothing ${R.viz1["Awake, age 13+, spent 0"].rate}%, awake passengers who spent money ${R.viz1["Awake, spent > 0"].rate}%. Overall rate ${R.target_share_true}%.`;
const ALT_VIZ2 = "Dot chart of the share transported for port and starboard cabins on decks A to G. Starboard is higher on every deck: " +
  "ABCDEFG".split("").map((d) => `deck ${d} +${R.side_gap_by_deck[d]} points`).join(", ") + ".";
// Team names, student IDs and date live in team.json, which is kept out of the public repo.
// Without it the deck builds with placeholders (see team.example.json).
const fs = require("fs");
const T = JSON.parse(fs.readFileSync(fs.existsSync("./team.json") ? "./team.json" : "./team.example.json", "utf8"));
const TEAM = T.members;
const DATE = T.date;
const pc = (v) => `${Number(v).toFixed(1)}%`;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.title = "CSC345 Project Phase 1 - Spaceship Titanic EDA";

let pageNo = 0;
function base(tag, title) {
  const s = pres.addSlide();
  s.background = { color: C.white };
  pageNo++;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 0.45, w: 1.9, h: 0.34, fill: { color: C.card }, rectRadius: 0.17, line: { color: C.card } });
  s.addText(tag, { x: 0.6, y: 0.45, w: 1.9, h: 0.34, fontFace: BODY, fontSize: 11, bold: true, color: C.blue, align: "center", valign: "middle", charSpacing: 2, margin: 0, isTextBox: true });
  s.addText(title, { x: 0.6, y: 0.9, w: 12.1, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: C.ink, margin: 0, valign: "top", isTextBox: true });
  s.addText(`CSC345 · Spaceship Titanic EDA · ${pageNo}`, { x: 8.7, y: 7.0, w: 4.0, h: 0.3, fontFace: BODY, fontSize: 10, color: C.muted, align: "right", margin: 0, isTextBox: true });
  return s;
}
function bullets(s, items, box, size = 16) {
  s.addText(items.map((t, i) => {
    const arr = Array.isArray(t) ? t : [t];
    return { text: arr[0], options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8, bold: false } };
  }), { ...box, fontFace: BODY, fontSize: size, color: C.ink, valign: "top", margin: 0, isTextBox: true });
}
function rich(s, runs, box, size = 16) {
  // runs: array of paragraphs; each paragraph = array of [text, bold?]
  const out = [];
  runs.forEach((p, pi) => p.forEach(([t, b], ri) => out.push({
    text: t, options: { bold: !!b, breakLine: ri === p.length - 1 && pi < runs.length - 1, paraSpaceAfter: 8 },
  })));
  s.addText(out, { ...box, fontFace: BODY, fontSize: size, color: C.ink, valign: "top", margin: 0, isTextBox: true });
}
function card(s, x, y, w, h) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: C.card }, line: { color: C.card }, rectRadius: 0.12 });
}

// ---------- 1. Title ----------
{
  const s = pres.addSlide(); pageNo++;
  s.background = { color: C.night };
  s.addText("CSC345 PROJECT PHASE 1 · EDA & DATA VISUALIZATION", { x: 0.8, y: 1.3, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: C.ice, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Who Got Transported?", { x: 0.8, y: 1.9, w: 11.5, h: 1.1, fontFace: HEAD, fontSize: 54, bold: true, color: C.white, margin: 0, isTextBox: true });
  s.addText("Exploring Kaggle's Spaceship Titanic passenger data", { x: 0.8, y: 3.0, w: 11.5, h: 0.6, fontFace: HEAD, fontSize: 24, italic: true, color: C.ice, margin: 0, isTextBox: true });
  // Members in two columns (3 + 2), name then student ID
  [TEAM.slice(0, 3), TEAM.slice(3)].forEach((col, ci) => {
    s.addText(col.flatMap(([name, id], i) => [
      { text: name, options: { bold: true } },
      { text: `   ${id}`, options: { color: C.ice, breakLine: i < col.length - 1 } },
    ]), { x: 0.8 + ci * 5.4, y: 4.35, w: 5.2, h: 1.35, fontFace: BODY, fontSize: 18, color: C.white, margin: 0, paraSpaceAfter: 6, valign: "top", isTextBox: true });
  });
  s.addText(`CSC345 · Data Science  ·  ${DATE}`, { x: 0.8, y: 6.2, w: 11.5, h: 0.4, fontFace: BODY, fontSize: 15, color: C.ice, margin: 0, isTextBox: true });
  s.addNotes("~15 s. Introduce the team and the question: which Spaceship Titanic passengers were transported, and what does the data say about them?");
}

// ---------- 2. Dataset overview & research questions ----------
{
  const s = base("DATASET", "Dataset overview & research questions");
  const tiles = [[fmt(R.rows), "passengers (rows)"], [String(R.cols), "attributes (columns)"], [`${R.target_share_true}%`, "Transported = True"]];
  tiles.forEach(([big, small], i) => {
    const x = 0.6 + i * 2.1;
    card(s, x, 2.0, 1.9, 1.5);
    s.addText(big, { x, y: 2.1, w: 1.9, h: 0.8, fontFace: HEAD, fontSize: 32, bold: true, color: C.blue, align: "center", margin: 0, isTextBox: true });
    s.addText(small, { x: x + 0.1, y: 2.85, w: 1.7, h: 0.5, fontFace: BODY, fontSize: 12, color: C.ink2, align: "center", margin: 0, isTextBox: true });
  });
  s.addText("Source: Kaggle competition “Spaceship Titanic”, file train.csv. Target classes are balanced, so a rate far from 50% signals a real pattern.", { x: 0.6, y: 3.7, w: 6.1, h: 0.8, fontFace: BODY, fontSize: 13, color: C.ink2, margin: 0, isTextBox: true });

  const hdr = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.night } } });
  const rows = [
    [hdr("Type"), hdr("Attributes")],
    ["Identifier", "PassengerId (gggg_pp = group_member), Name"],
    ["Categorical", "HomePlanet, CryoSleep, Destination, VIP, Cabin (deck/num/side)"],
    ["Numeric", "Age; spending: RoomService, FoodCourt, ShoppingMall, Spa, VRDeck"],
    ["Target", "Transported (True / False)"],
  ];
  s.addTable(rows, { x: 0.6, y: 4.6, w: 6.1, colW: [1.5, 4.6], fontFace: BODY, fontSize: 12, color: C.ink, border: { type: "solid", pt: 0.75, color: C.line }, rowH: 0.36, valign: "middle" });

  card(s, 7.2, 2.0, 5.5, 4.6);
  s.addText("Research questions", { x: 7.5, y: 2.2, w: 5.0, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
  rich(s, [
    [["RQ1  ", true], ["Does being in CryoSleep – and whether a passenger spent money on board – relate to being transported?  → Visualization 1"]],
    [["RQ2  ", true], ["Does cabin location (deck and port/starboard side) relate to being transported?  → Visualization 2"]],
  ], { x: 7.5, y: 2.85, w: 5.0, h: 3.5 }, 17);
  s.addNotes("~35 s. 8,693 passengers, 14 columns. Transported is almost exactly 50/50, so any rate far from 50% is a strong signal. Our two questions: passenger state (CryoSleep and spending) and cabin location.");
}

// ---------- 3. Attributes & data problems ----------
{
  const s = base("DATA QUALITY", "Data problems we discovered");
  const miss = R.missing_pct_by_col;
  const missCols = Object.entries(miss).filter(([, v]) => v > 0).map(([, v]) => v);
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.night } } });
  const rows = [
    [hdr("Problem"), hdr("Evidence in train.csv"), hdr("Why it matters")],
    ["Missing values", `Every column except PassengerId and Transported is ${Math.min(...missCols)}–${Math.max(...missCols)}% missing; ${fmt(R.rows_with_any_missing)} rows (${(R.rows_with_any_missing / R.rows * 100).toFixed(1)}%) have at least one gap`, "Dropping all incomplete rows would discard about a quarter of the data"],
    ["Highly skewed spending", `Median of every spending column = 0; ${Math.min(...Object.values(R.spend_zero_pct))}–${Math.max(...Object.values(R.spend_zero_pct))}% of known values are exactly 0; max up to ${fmt(Math.max(...Object.values(R.spend_max)))}`, "Means are misleading; better to use spent vs. not spent"],
    ["Packed composite field", "Cabin holds three values: deck / number / side (e.g. B/0/P)", "Must be split before it can be analysed"],
    ["Rare categories", `VIP = True for only ${R.vip_share}% of passengers; deck T has only ${R.deck_n.T} passengers`, "Rates for tiny groups are unreliable"],
    ["Suspicious values", `${R.age_zero} passengers have Age = 0`, "Could be infants or a placeholder; kept, but flagged"],
    ["Confounding", "Decks A, B, C and T hold only Europa passengers; G holds only Earth passengers", "A deck effect may really be a home-planet effect"],
  ];
  s.addTable(rows, { x: 0.6, y: 1.9, w: 12.1, colW: [2.3, 5.8, 4.0], fontFace: BODY, fontSize: 13, color: C.ink, border: { type: "solid", pt: 0.75, color: C.line }, rowH: [0.4, 0.62, 0.62, 0.5, 0.5, 0.5, 0.62], valign: "middle" });
  s.addText(`No duplicate PassengerIds (${R.duplicate_ids} found).`, { x: 0.6, y: 6.4, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: C.ink2, margin: 0, isTextBox: true });
  s.addNotes("~45 s. Missing values are thin (about 2% per column) but touch a quarter of the rows. Spending is extremely skewed. Cabin must be split. And deck is tied to home planet, which matters for Visualization 2.");
}

// ---------- 4. Cleaning & preprocessing ----------
{
  const s = base("PREPROCESSING", "Cleaning & preprocessing steps");
  const steps = [
    ["1", "Split composite fields", "Cabin → Deck, CabinNum, Side (P = port, S = starboard). PassengerId → Group and GroupSize."],
    ["2", "Verify a domain rule", `CryoSleep passengers never spend: ${R.cryo_with_positive_spend} of them have any spending > 0. Children aged 12 or under also never spend (${R.kids_with_positive_spend} of ${fmt(R.kids_n)}).`],
    ["3", "Rule-based imputation", `Missing spending for those two groups was set to 0: ${R.spend_cells_filled_total} cells (${R.cryo_spend_nan_cells} CryoSleep + ${R.kids_spend_nan_cells_filled} awake children). ${R.spend_nan_cells_after_rules} spending cells stay missing – not guessed.`],
    ["4", "Derived feature", "TotalSpend = sum of the 5 spending columns, calculated only when all 5 are known."],
    ["5", "Per-chart exclusion", `Rows missing a value a chart needs are left out of that chart only (Viz 1: ${R.viz1_excluded_rows} rows; Viz 2: ${R.viz2_excluded_rows} = ${R.missing_by_col.Cabin} with no Cabin + ${R.deck_n.T} on deck T). Nothing is deleted.`],
  ];
  steps.forEach(([n, head, body], i) => {
    const y = 1.95 + i * 0.95;
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fill: { color: C.blue }, line: { color: C.blue } });
    s.addText(n, { x: 0.6, y: y + 0.05, w: 0.55, h: 0.55, fontFace: HEAD, fontSize: 18, bold: true, color: C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(head, { x: 1.4, y, w: 3.2, h: 0.65, fontFace: BODY, fontSize: 17, bold: true, color: C.ink, valign: "middle", margin: 0, isTextBox: true });
    s.addText(body, { x: 4.7, y, w: 8.0, h: 0.75, fontFace: BODY, fontSize: 14, color: C.ink2, valign: "middle", margin: 0, isTextBox: true });
  });
  s.addNotes("~40 s. We only filled values where the data proves the rule: no one in CryoSleep and no child aged 12 or under ever spends, so their missing spending is 0. Everything else stays missing; each chart leaves out the rows it cannot use.");
}

// ---------- 5. Supporting EDA ----------
{
  const s = base("EDA", "Exploration: transport rate by attribute");
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.night } } });
  const p = pc;
  const rows = [
    [hdr("Attribute"), hdr("Group → % transported")],
    ["CryoSleep", `In CryoSleep ${p(R.cryo_rate)}  ·  Awake ${p(R.awake_rate)}`],
    ["HomePlanet", `Europa ${p(R.rate_by_HomePlanet.Europa)}  ·  Mars ${p(R.rate_by_HomePlanet.Mars)}  ·  Earth ${p(R.rate_by_HomePlanet.Earth)}`],
    ["Destination", `55 Cancri e ${p(R.rate_by_Destination["55 Cancri e"])}  ·  PSO J318.5-22 ${p(R.rate_by_Destination["PSO J318.5-22"])}  ·  TRAPPIST-1e ${p(R.rate_by_Destination["TRAPPIST-1e"])}`],
    ["Age", `0–12 ${p(R.rate_by_age["0-12"])}  ·  13–17 ${p(R.rate_by_age["13-17"])}  ·  18 and older ${p(R.rate_by_age["18-25"])}–${p(R.rate_by_age["41-60"])}`],
    ["Group size", `Travelling alone ${p(R.rate_alone_vs_group.false)}  ·  In a group of 2+ ${p(R.rate_alone_vs_group.true)}`],
    ["Cabin side", `Starboard ${p(R.side_rate.S)}  ·  Port ${p(R.side_rate.P)}`],
    ["VIP", `VIP ${p(R.rate_by_VIP.true)}  ·  Non-VIP ${p(R.rate_by_VIP.false)}  (only ${R.vip_share}% are VIP)`],
  ];
  s.addTable(rows, { x: 0.6, y: 1.9, w: 8.2, colW: [1.9, 6.3], fontFace: BODY, fontSize: 14, color: C.ink, border: { type: "solid", pt: 0.75, color: C.line }, rowH: 0.52, valign: "middle" });
  card(s, 9.2, 1.9, 3.5, 4.2);
  s.addText("What we took from it", { x: 9.45, y: 2.05, w: 3.0, h: 0.45, fontFace: HEAD, fontSize: 18, bold: true, color: C.ink, margin: 0, isTextBox: true });
  bullets(s, [
    "CryoSleep shows the largest gap of any attribute → Visualization 1",
    "Cabin side differs consistently across decks → Visualization 2",
    "Age and Destination also show clear gaps – not charted only because 2 plots are allowed",
  ], { x: 9.45, y: 2.6, w: 3.05, h: 3.4 }, 14);
  s.addText("Overall baseline: 50.4% transported. Percentages are calculated on rows where that attribute is known.", { x: 0.6, y: 6.25, w: 8.2, h: 0.5, fontFace: BODY, fontSize: 12, italic: true, color: C.ink2, margin: 0, isTextBox: true });
  s.addNotes("~30 s. We compared the transport rate across every attribute. CryoSleep has the biggest gap and cabin side the most consistent pattern, so those are our two charts. Age and Destination also differ, but only two plots are allowed.");
}

// ---------- 6. Visualization 1 ----------
{
  const s = base("VISUALIZATION 1", "CryoSleep passengers were transported most often");
  const v = R.viz1;
  const order = [["In CryoSleep", "In CryoSleep"], ["Awake, child <=12", "Awake, child ≤12"], ["Awake, age 13+, spent 0", "Awake, age 13+, spent 0"], ["Awake, spent > 0", "Awake, spent > 0"]];
  const labels = order.map(([k, lbl]) => `${lbl} (n=${fmt(v[k].n)})`);
  const vals = order.map(([k]) => v[k].rate / 100);
  // Chart image from make_charts.py (drawn from eda_results.json)
  s.addImage({ path: "charts/deck_viz1.png", x: 0.5, y: 1.8, w: 7.44, h: 4.7, altText: ALT_VIZ1 });
  s.addText(`n = ${fmt(R.rows - R.viz1_excluded_rows)}; ${R.viz1_excluded_rows} rows missing CryoSleep, a spending value, or (for zero-spenders) age are left out. Children ≤12 never spend, so they get their own bar. Overall rate: ${pc(R.target_share_true)}.`, { x: 0.6, y: 6.6, w: 7.5, h: 0.4, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  card(s, 8.5, 1.9, 4.2, 4.8);
  s.addText("Insight", { x: 8.75, y: 2.05, w: 3.8, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
  const cs = v["In CryoSleep"], kid = v["Awake, child <=12"], idle = v["Awake, age 13+, spent 0"], spent = v["Awake, spent > 0"];
  rich(s, [
    [["CryoSleep passengers were transported ", false], [`${(cs.rate / spent.rate).toFixed(1)}× as often`, true], [" as awake passengers who spent money.", false]],
    [["Awake children were also high (", false], [pc(kid.rate), true], [") – age matters too.", false]],
    [["Awake passengers aged 13+ who spent nothing: only ", false], [pc(idle.rate), true], [`, close to spenders (${pc(spent.rate)}). Not spending is not the signal by itself; CryoSleep is.`, false]],
    [["This shows a relationship, not a cause.", false]],
  ], { x: 8.75, y: 2.6, w: 3.75, h: 4.0 }, 14);
  s.addNotes(`~70 s. Top to bottom: ${pc(cs.rate)} of CryoSleep passengers were transported, ${pc(kid.rate)} of awake children, ${pc(idle.rate)} of awake passengers aged 13+ who spent nothing, and ${pc(spent.rate)} of those who spent money. We split out children because they never spend; otherwise the zero-spend group would be about ${Math.round(R.awake0_child_share)}% children and look like an inactivity effect. Once they are separated, awake non-spenders look much like spenders, so CryoSleep – not spending – is the strong signal. This is a relationship, not a cause.`);
}

// ---------- 7. Visualization 2 ----------
{
  const s = base("VISUALIZATION 2", "Starboard was higher than port on all 7 decks");
  const decks = ["A", "B", "C", "D", "E", "F", "G"];
  const get = (d, side) => R.viz2.find((r) => r.deck === d && r.side === side);
  const labels = decks.map((d) => `${d} (n=${fmt(R.deck_n[d])})`);
  // Chart image from make_charts.py (drawn from eda_results.json)
  s.addImage({ path: "charts/deck_viz2.png", x: 0.5, y: 1.85, w: 8.1, h: 4.8, altText: ALT_VIZ2 });
  s.addText(`n = ${fmt(R.rows - R.viz2_excluded_rows)}; ${R.viz2_excluded_rows} rows left out (${R.missing_by_col.Cabin} with no Cabin, ${R.deck_n.T} on deck T – too few to compare).`, { x: 0.6, y: 6.7, w: 8.0, h: 0.3, fontFace: BODY, fontSize: 11, color: C.muted, margin: 0, isTextBox: true });
  card(s, 8.9, 1.9, 3.8, 4.8);
  s.addText("Insight", { x: 9.15, y: 2.05, w: 3.4, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
  const gp = R.side_rate_by_planet, gd = R.side_gap_by_deck, pd = R.planet_deck;
  rich(s, [
    [["Starboard is higher on ", false], ["all 7 decks", true], [` (overall ${pc(R.side_rate.S)} vs ${pc(R.side_rate.P)}). The gaps on D and E are small (${gd.D} and ${gd.E} points).`, false]],
    [["It also holds ", false], ["within each home planet", true], [` – Earth ${pc(gp.Earth.P)} → ${pc(gp.Earth.S)}, Europa ${pc(gp.Europa.P)} → ${pc(gp.Europa.S)}, Mars ${pc(gp.Mars.P)} → ${pc(gp.Mars.S)} – so side is not just a planet effect.`, false]],
    [["Deck matters ", false], ["within a planet", true], [` too: Mars ${pc(pd["Mars/E"].rate)} on deck E vs ${pc(pd["Mars/F"].rate)} on F; Earth ${pc(pd["Earth/F"].rate)} on F vs ${pc(pd["Earth/G"].rate)} on G.`, false]],
  ], { x: 9.15, y: 2.6, w: 3.4, h: 4.0 }, 14);
  s.addNotes(`~65 s. On every deck the orange starboard dot is to the right of the blue port dot, from ${gd.E} points on deck E to ${gd.C} points on deck C; the small gaps on D and E on their own could be chance. The pattern also holds inside each home planet, so it is not explained by planet. Deck matters too, even inside one planet: Mars passengers were transported ${pc(pd["Mars/E"].rate)} of the time on deck E but ${pc(pd["Mars/F"].rate)} on deck F (n=${fmt(pd["Mars/F"].n)}), and Earth passengers ${pc(pd["Earth/F"].rate)} on F vs ${pc(pd["Earth/G"].rate)} on G. So the deck pattern is not just home planet in disguise.`);
}

// ---------- 8. Key findings ----------
{
  const s = base("FINDINGS", "Key findings & interpretation");
  // Plain text rows (no big-number tiles), so this slide can't be mistaken for a third visualization
  const f = [
    ["CryoSleep (RQ1)", `${pc(R.cryo_rate)} of CryoSleep passengers were transported, compared with ${pc(R.awake_rate)} of awake passengers. This is the strongest single signal we found.`],
    ["Age", `${pc(R.viz1["Awake, child <=12"].rate)} of awake children aged 12 or under were transported. Awake passengers aged 13+ who spent nothing were at ${pc(R.viz1["Awake, age 13+, spent 0"].rate)}, close to those who spent money.`],
    ["Cabin side (RQ2)", "Starboard passengers were transported more often than port on all 7 decks, and within each home planet. Deck differences are partly tied to HomePlanet."],
  ];
  f.forEach(([head, body], i) => {
    const y = 2.0 + i * 1.4;
    s.addText(head, { x: 0.6, y, w: 3.2, h: 1.1, fontFace: BODY, fontSize: 20, bold: true, color: C.ink, margin: 0, valign: "top", isTextBox: true });
    s.addText(body, { x: 3.9, y, w: 8.8, h: 1.1, fontFace: BODY, fontSize: 18, color: C.ink2, margin: 0, valign: "top", isTextBox: true });
  });
  s.addText("All findings describe relationships in train.csv; none of them prove cause and effect.", { x: 0.6, y: 6.45, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: C.ink2, margin: 0, isTextBox: true });
  s.addNotes("~25 s. Three takeaways: CryoSleep, age, and starboard cabins. All are relationships in the data, not causes.");
}

// ---------- 9. Limitations & future work ----------
{
  const s = base("NEXT STEPS", "Limitations & future analysis");
  card(s, 0.6, 1.95, 5.9, 4.1);
  card(s, 6.8, 1.95, 5.9, 4.1);
  s.addText("Limitations", { x: 0.9, y: 2.1, w: 5.3, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
  bullets(s, [
    `The ${R.viz1_excluded_rows} rows left out of Viz 1 are not typical: ${pc(R.viz1_excluded_rate)} transported vs ${pc(R.target_share_true)} overall. The ${R.missing_by_col.Cabin} no-cabin rows left out of Viz 2 look typical (${pc(R.no_cabin_rate)})`,
    "CryoSleep, spending and age are tied together, and deck is tied to HomePlanet – so we cannot fully separate their effects",
    "Only train.csv has labels; the patterns are not yet checked on unseen data",
    `${R.age_zero} Age = 0 values are unverified`,
  ], { x: 0.9, y: 2.75, w: 5.3, h: 3.2 }, 16);
  s.addText("Future analysis (Phase 2+)", { x: 7.1, y: 2.1, w: 5.3, h: 0.5, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink, margin: 0, isTextBox: true });
  bullets(s, [
    "Model deck, side and home planet together to measure how much each adds",
    "Fill in missing values using group members (same group → same planet / cabin?)",
    "Test whether CabinNum (position along the deck) adds signal",
    "Build and compare classifiers with cross-validation",
  ], { x: 7.1, y: 2.75, w: 5.3, h: 3.2 }, 16);
  s.addNotes("~20 s. Main limitations: the rows missing from Viz 1 are not typical, several attributes are tied together, and nothing is checked on unseen data yet. Next phase: control for home planet and start modelling.");
}

// ---------- 10. AI Declaration (directly before References) ----------
{
  const s = base("AI DECLARATION", "AI Declaration: How I used AI in this assignment work");
  const X = "[X]", O = "[  ]";
  card(s, 0.6, 1.85, 6.0, 4.95);
  s.addText([
    { text: "Project Title: Who Got Transported? – Spaceship Titanic EDA", options: { breakLine: true } },
    { text: `Author/Team Members: ${TEAM.map(([n]) => n).join(", ")}`, options: { breakLine: true } },
    { text: `Date: ${DATE}`, options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "1. AI usage status", options: { bold: true, breakLine: true } },
    { text: `${O} No AI tools were used`, options: { breakLine: true } },
    { text: `${X} AI tools were used as assistive technology`, options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "2. Scope of AI assistance", options: { bold: true, breakLine: true } },
    { text: `${X} Brainstorming – slide outline and choice of the 2 charts`, options: { breakLine: true } },
    { text: `${O} Editing & Grammar`, options: { breakLine: true } },
    { text: `${X} Data Analysis – wrote the Python/pandas EDA code, computed the statistics, built the charts, and reviewed and corrected the team's EDA notebook`, options: { breakLine: true } },
    { text: `${X} Content Generation – drafted slide text and speaker notes`, options: { breakLine: true } },
    { text: `${O} Other: ____` },
  ], { x: 0.85, y: 2.0, w: 5.6, h: 4.7, fontFace: BODY, fontSize: 15, color: C.ink, valign: "top", margin: 0, isTextBox: true });
  card(s, 6.9, 1.85, 5.8, 4.95);
  s.addText([
    { text: "3. Tools & applications", options: { bold: true, breakLine: true } },
    { text: "1. Tool: Claude (Anthropic), Claude Code desktop app  |  Used for: the analysis script, charts and slide draft in section 2, and correcting the team notebook (spaceship-titanic_corrected.ipynb)", options: { breakLine: true } },
    { text: `2. Tool: ${T.ai_tool2}  |  Used for: ____`, options: { breakLine: true } },
    { text: " ", options: { breakLine: true, fontSize: 6 } },
    { text: "4. Verification & sign-off", options: { bold: true, breakLine: true } },
    { text: "We confirm that: all AI-generated content was fact-checked and verified; the final analysis, interpretations and conclusions are our own work; prompts/outputs are documented as required.", options: { breakLine: true } },
    { text: "How we checked: [e.g. re-ran eda_spaceship_titanic.py and matched every number; reviewed and rewrote the interpretations]", options: { italic: true, breakLine: true } },
    { text: "Signature: ____________   Date: ________" },
  ], { x: 7.15, y: 2.0, w: 5.35, h: 4.7, fontFace: BODY, fontSize: 15, color: C.ink, valign: "top", margin: 0, paraSpaceAfter: 4, isTextBox: true });
  s.addNotes("~10 s. Follows the four sections of CSC345_ai_declaration_form.docx. Before signing, the team must actually do the checks described in section 4 and fill in 'How we checked' truthfully. Adjust the ticked boxes if you rewrite parts yourselves or use other AI tools.");
}

// ---------- 11. References (last) ----------
{
  const s = base("REFERENCES", "References");
  bullets(s, [
    "Dataset: Kaggle, “Spaceship Titanic” competition, train.csv. https://www.kaggle.com/competitions/spaceship-titanic",
    "Analysis: Python 3.14 and pandas 3.0.6 (The pandas development team). https://pandas.pydata.org",
    "Plot tool (Visualizations 1 and 2): Matplotlib 3.11.2. https://matplotlib.org",
    "Exploration notebook plots: seaborn 0.13.2. https://seaborn.pydata.org",
    "Mutual information (exploration notebook): scikit-learn 1.9.0. https://scikit-learn.org",
    "Slides built with PptxGenJS. https://gitbrent.github.io/PptxGenJS/",
    "AI assistance: Claude (Anthropic), https://www.anthropic.com/claude – see AI Declaration slide",
    "Source code (GitHub): https://github.com/Leon6112003/csc345-spaceship-titanic-eda",
  ], { x: 0.6, y: 1.95, w: 12.1, h: 4.8 }, 16);
  s.addNotes("~5 s. The rubric asks for the concept idea, visualization techniques, the plot tool, and a GitHub link to the code.");
}

pres.writeFile({ fileName: "CSC345_Phase1_SpaceshipTitanic.pptx" }).then((f) => console.log("wrote", f));
