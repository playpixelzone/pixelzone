// Pixel Factory Rework v3.2
// Fokus: Stabilität, klare UX, echte Entscheidungen, funktionierende Interaktionen.

const GAME_ID = "pixel-factory";
const SAVE_SCHEMA_VERSION = 3;
const AUTOSAVE_MS = 10000;
const BASE_EVENT_INTERVAL_MS = 210000;
const COMBO_WINDOW_MS = 1400;
/** @deprecated Nur noch für Fallback; echte Erneuerung über Halbstunden-Grenze (siehe msBisNaechsteHalbeStunde). */
const MISSION_ROTATE_MS = 30 * 60 * 1000;
const PRESTIGE_BASE = 9000;
const PRESTIGE_GROWTH = 1.5;

const BUILDINGS = [
  { id: "worker", name: "Pixel-Arbeiter", icon: "🧑‍🏭", baseCost: 15, growth: 1.128, pps: 0.4, unlockAt: 0 },
  { id: "intern", name: "Praktikant", icon: "🧢", baseCost: 70, growth: 1.136, pps: 1.4, unlockAt: 50 },
  { id: "printer", name: "Nano-Drucker", icon: "🖨️", baseCost: 260, growth: 1.145, pps: 5.6, unlockAt: 170 },
  { id: "assembler", name: "Assembler", icon: "⚙️", baseCost: 980, growth: 1.154, pps: 16, unlockAt: 650 },
  { id: "robot", name: "Roboterarm", icon: "🤖", baseCost: 3900, growth: 1.162, pps: 49, unlockAt: 2200 },
  { id: "reactor", name: "Fusion-Reaktor", icon: "⚡", baseCost: 15000, growth: 1.171, pps: 170, unlockAt: 8800 },
  { id: "cluster", name: "Chip-Cluster", icon: "🧠", baseCost: 54000, growth: 1.18, pps: 610, unlockAt: 30000 },
  { id: "satellite", name: "Satelliten-Linie", icon: "🛰️", baseCost: 190000, growth: 1.188, pps: 2100, unlockAt: 110000 },
  { id: "laserFab", name: "Laser-Fabrik", icon: "🔴", baseCost: 680000, growth: 1.197, pps: 7000, unlockAt: 420000 },
  { id: "quantumCore", name: "Line-Core", icon: "🌀", baseCost: 2400000, growth: 1.206, pps: 21000, unlockAt: 1500000 },
  { id: "matrix", name: "Matrix-Fabrik", icon: "🏭", baseCost: 8500000, growth: 1.215, pps: 68000, unlockAt: 5000000 },
  { id: "arcology", name: "Pixel-Arcology", icon: "🏙️", baseCost: 31000000, growth: 1.224, pps: 210000, unlockAt: 18000000 },
  { id: "orbitalDock", name: "Orbital-Dock", icon: "🛸", baseCost: 115000000, growth: 1.232, pps: 690000, unlockAt: 70000000 },
];

/** Kosten steigen pro Stufe stärker (PPS-Pfad teurer), Klick-Pfad stützt aktives Spiel (~10–20 % bei schnellem Klicken). */
const UPGRADES = [
  { id: "u_click_1", name: "Präzisions-Klick", desc: "+3 Klickkraft", cost: 52, unlockAt: 32, apply: (s) => { s.economy.clickBase += 3; } },
  { id: "u_click_2", name: "Servo-Hand", desc: "Klickkraft ×1.88", cost: 420, unlockAt: 200, apply: (s) => { s.economy.clickMult *= 1.88; } },
  { id: "u_click_3", name: "Impuls-Handschuh", desc: "Klickkraft ×2.25", cost: 3200, unlockAt: 1500, apply: (s) => { s.economy.clickMult *= 2.25; } },
  { id: "u_click_4", name: "Hyperfinger", desc: "Klickkraft ×2.65", cost: 22000, unlockAt: 10000, apply: (s) => { s.economy.clickMult *= 2.65; } },
  { id: "u_click_5", name: "Neural-Link", desc: "Klickkraft ×3.35", cost: 195000, unlockAt: 120000, apply: (s) => { s.economy.clickMult *= 3.35; } },
  { id: "u_prod_1", name: "Schichtplan", desc: "Produktion ×1.28", cost: 580, unlockAt: 280, apply: (s) => { s.economy.prodMult *= 1.28; } },
  { id: "u_prod_2", name: "Qualitätskette", desc: "Produktion ×1.45", cost: 4800, unlockAt: 2600, apply: (s) => { s.economy.prodMult *= 1.45; } },
  { id: "u_prod_3", name: "Fließband-KI", desc: "Produktion ×1.95", cost: 36000, unlockAt: 20000, apply: (s) => { s.economy.prodMult *= 1.95; } },
  { id: "u_prod_4", name: "Takt-Optimierung", desc: "Produktion ×2.35", cost: 340000, unlockAt: 180000, apply: (s) => { s.economy.prodMult *= 2.35; } },
  { id: "u_prod_5", name: "Parallel-Layer", desc: "Produktion ×2.75", cost: 2800000, unlockAt: 1900000, apply: (s) => { s.economy.prodMult *= 2.75; } },
  { id: "u_combo_1", name: "Flow-Training", desc: "Kombo stärker (+0.1)", cost: 2100, unlockAt: 1000, apply: (s) => { s.economy.comboBonus += 0.1; } },
  { id: "u_combo_2", name: "Flow-Reflex", desc: "Kombo-Fenster +420ms", cost: 11000, unlockAt: 6000, apply: (s) => { s.economy.comboWindowBonus += 420; } },
  { id: "u_combo_3", name: "Burst-Kontrolle", desc: "Kombo stärker (+0.16)", cost: 88000, unlockAt: 48000, apply: (s) => { s.economy.comboBonus += 0.16; } },
  { id: "u_offline_1", name: "Nachtprotokoll", desc: "Offline-Effizienz +24%", cost: 15000, unlockAt: 8000, apply: (s) => { s.economy.offlineEff += 0.24; } },
  { id: "u_offline_2", name: "Auto-Schicht", desc: "Offline-Effizienz +40%", cost: 135000, unlockAt: 85000, apply: (s) => { s.economy.offlineEff += 0.4; } },
  { id: "u_event_1", name: "Notfallplan", desc: "Events seltener", cost: 32000, unlockAt: 20000, apply: (s) => { s.meta.eventRateMult *= 0.9; } },
  { id: "u_event_2", name: "Puffer-Netz", desc: "Events seltener", cost: 340000, unlockAt: 210000, apply: (s) => { s.meta.eventRateMult *= 0.86; } },
  { id: "u_hybrid_1", name: "Lean-Core", desc: "Klick + Produktion ×1.22", cost: 62000, unlockAt: 34000, apply: (s) => { s.economy.clickMult *= 1.22; s.economy.prodMult *= 1.22; } },
  { id: "u_hybrid_2", name: "Dual-Stack", desc: "Klick + Produktion ×1.38", cost: 420000, unlockAt: 260000, apply: (s) => { s.economy.clickMult *= 1.38; s.economy.prodMult *= 1.38; } },
];

/** lx/ly = Position im Skill-Tree (0–100), viewBox 100×100 */
const LINE_TREES = {
  speed: [
    { id: "s_core", name: "Startkern", desc: "Startpunkt der Speed-Line (+18% Produktion)", max: 1, cost: 1, lx: 50, ly: 50, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.18 * lvl); } },
    { id: "s_burst_1", name: "Burst-I", desc: "+38% Produktion", max: 2, cost: 1, req: "s_core", lx: 28, ly: 42, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.38 * lvl); } },
    { id: "s_burst_2", name: "Burst-II", desc: "+55% Produktion", max: 1, cost: 2, req: "s_burst_1", lx: 12, ly: 28, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.55 * lvl); } },
    { id: "s_click_1", name: "Aggro-Klick", desc: "+42% Klickkraft", max: 2, cost: 1, req: "s_core", lx: 72, ly: 42, effect: (s, lvl) => { s.meta.lineClickMult *= (1 + 0.42 * lvl); } },
    { id: "s_click_2", name: "Aggro-Klick II", desc: "+68% Klickkraft", max: 1, cost: 2, req: "s_click_1", lx: 88, ly: 28, effect: (s, lvl) => { s.meta.lineClickMult *= (1 + 0.68 * lvl); } },
    { id: "s_risk_1", name: "Risikotakt", desc: "+70% Produktion, Eventrate +20%", max: 1, cost: 2, req: "s_core", lx: 50, ly: 74, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.7 * lvl); s.meta.eventRateMult *= (1 + 0.2 * lvl); } },
    { id: "s_capstone", name: "Hyperline", desc: "+95% Produktion", max: 1, cost: 3, req: "s_burst_2", lx: 8, ly: 22, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.95 * lvl); } },
  ],
  efficiency: [
    { id: "e_core", name: "Startkern", desc: "Stabile Basis (Events -10%)", max: 1, cost: 1, lx: 50, ly: 54, effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.1 * lvl); } },
    { id: "e_prod_1", name: "Saubere Linie", desc: "+26% Produktion", max: 3, cost: 1, req: "e_core", lx: 26, ly: 42, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.26 * lvl); } },
    { id: "e_prod_2", name: "Saubere Linie II", desc: "+40% Produktion", max: 1, cost: 2, req: "e_prod_1", lx: 10, ly: 28, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.4 * lvl); } },
    { id: "e_ctrl_1", name: "Kontrollraum", desc: "Events -16%", max: 2, cost: 1, req: "e_core", lx: 74, ly: 42, effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.16 * lvl); } },
    { id: "e_ctrl_2", name: "Null-Störung", desc: "Events -24%", max: 1, cost: 2, req: "e_ctrl_1", lx: 90, ly: 28, effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.24 * lvl); } },
    { id: "e_click", name: "Feinmotorik", desc: "+38% Klickkraft", max: 2, cost: 1, req: "e_core", lx: 50, ly: 28, effect: (s, lvl) => { s.meta.lineClickMult *= (1 + 0.38 * lvl); } },
    { id: "e_capstone", name: "Null-Verlust", desc: "Offline +80%", max: 1, cost: 3, req: "e_prod_2", lx: 50, ly: 10, effect: (s, lvl) => { s.economy.offlineEff += 0.8 * lvl; } },
  ],
  automation: [
    { id: "a_core", name: "Startkern", desc: "Automations-Basis (+24% Produktion)", max: 1, cost: 1, lx: 50, ly: 52, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.24 * lvl); } },
    { id: "a_prod_1", name: "Auto-Roboter", desc: "+36% Produktion", max: 3, cost: 1, req: "a_core", lx: 26, ly: 40, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.36 * lvl); } },
    { id: "a_prod_2", name: "Autopilot", desc: "+60% Produktion", max: 1, cost: 2, req: "a_prod_1", lx: 10, ly: 26, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.6 * lvl); } },
    { id: "a_off_1", name: "Ghost-Shift", desc: "Offline +42%", max: 3, cost: 1, req: "a_core", lx: 74, ly: 40, effect: (s, lvl) => { s.economy.offlineEff += 0.42 * lvl; } },
    { id: "a_off_2", name: "Nachtschicht-Netz", desc: "Offline +90%", max: 1, cost: 2, req: "a_off_1", lx: 90, ly: 26, effect: (s, lvl) => { s.economy.offlineEff += 0.9 * lvl; } },
    { id: "a_ctrl", name: "Störfilter", desc: "Events -15%", max: 2, cost: 1, req: "a_core", lx: 50, ly: 70, effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.15 * lvl); } },
    { id: "a_capstone", name: "Fabriknetz", desc: "+65% Produktion und +25% Klick", max: 1, cost: 3, req: "a_prod_2", lx: 50, ly: 14, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.65 * lvl); s.meta.lineClickMult *= (1 + 0.25 * lvl); } },
  ],
};

const MUTATIONS = [
  { id: "m1", title: "Hochdruck", text: "+70% Produktion, Events etwas häufiger", detail: "Produktion x1.7, Eventrate x1.2", apply: (s) => { s.meta.mutationProdMult *= 1.7; s.meta.eventRateMult *= 1.2; } },
  { id: "m2", title: "Reflexlauf", text: "+90% Klickkraft, aber -25% Gebäudeproduktion", detail: "Klick x1.9, Produktion x0.75", apply: (s) => { s.meta.mutationClickMult *= 1.9; s.meta.mutationProdMult *= 0.75; } },
  { id: "m3", title: "Ruhemodus", text: "Events seltener, dafür -20% Klickkraft", detail: "Eventrate x0.65, Klick x0.8", apply: (s) => { s.meta.eventRateMult *= 0.65; s.meta.mutationClickMult *= 0.8; } },
  { id: "m4", title: "Turbo-Run", text: "Missionen +50% Belohnung, Prestige-Schwelle +18%", detail: "Missionsreward x1.5, Prestigeschwelle x1.18", apply: (s) => { s.meta.missionRewardMult *= 1.5; s.meta.prestigeThresholdMult *= 1.18; } },
  { id: "m5", title: "Kettenreaktion", text: "Kombo stark, aber Event-Strafen härter", detail: "Kombo +0.35, Event-Strafe x1.4", apply: (s) => { s.economy.comboBonus += 0.35; s.meta.eventPenaltyMult *= 1.4; } },
  { id: "m6", title: "Langschicht", text: "Offline massiv stärker, aktive Klicks schwächer", detail: "Offline x2.2, Klick x0.75", apply: (s) => { s.economy.offlineEff += 1.2; s.meta.mutationClickMult *= 0.75; } },
];

const EVENT_POOL = [
  {
    id: "power",
    title: "Stromabfall",
    text: "Das Netz bricht kurz ein. Du musst entscheiden:",
    choices: [
      { id: "repair", label: "Sofort reparieren", detail: "20s lang Produktion -15%, danach stabil", apply: (s) => addTimed(s, "prod", 0.85, 20, "Reparatur aktiv") },
      { id: "risk", label: "Weiter auf Risiko", detail: "30s Produktion +35%, danach 25s -20%", apply: (s) => { addTimed(s, "prod", 1.35, 30, "Risikofahrt"); applyDelayedEffectSafe(30000, () => addTimed(state, "prod", 0.8, 25, "Überhitzung")); } },
      { id: "backup", label: "Backup-Generator", detail: "Sofort +18s PPS als Bonus", apply: () => addPixels(currentPps() * 18, "Backup-Generator") },
    ],
  },
  {
    id: "quality",
    title: "Qualitätsfenster",
    text: "Eine seltene Charge ist eingetroffen.",
    choices: [
      { id: "mass", label: "Massenlauf", detail: "45s Produktion +28%", apply: (s) => addTimed(s, "prod", 1.28, 45, "Massenlauf") },
      { id: "premium", label: "Premium-Serie", detail: "35s Klick +60%", apply: (s) => addTimed(s, "click", 1.6, 35, "Premium-Serie") },
      { id: "store", label: "Einlagern", detail: "+22 Saisonpunkte", apply: (s) => addSeasonPoints(s, 22, "Charge eingelagert") },
    ],
  },
  {
    id: "security",
    title: "Sicherheitsalarm",
    text: "Anomalie in den Sensorlogs erkannt.",
    choices: [
      { id: "scan", label: "Vollscan fahren", detail: "Events 90s lang seltener", apply: (s) => addTimed(s, "eventRate", 0.72, 90, "Vollscan läuft") },
      { id: "ignore", label: "Ignorieren", detail: "Sofort +12s PPS, aber 40s Eventrate +20%", apply: (s) => { addPixels(currentPps() * 12, "Unsichere Ausbeute"); addTimed(s, "eventRate", 1.2, 40, "Instabile Sensoren"); } },
      { id: "counter", label: "Gegenmaßnahme", detail: "Missionen +20% für 50s", apply: (s) => addTimed(s, "missionReward", 1.2, 50, "Missionsbonus aktiv") },
    ],
  },
  {
    id: "market",
    title: "Marktfenster",
    text: "Ein Händlernetz bietet kurzfristige Deals.",
    choices: [
      { id: "buy", label: "Material einkaufen", detail: "Nächste 3 Käufe -25%", apply: (s) => { s.economy.discountBuys = 3; showBanner("Nächste 3 Käufe -25%"); } },
      { id: "sell", label: "Schnellverkauf", detail: "Sofort +35s Klickbonus", apply: (s) => addTimed(s, "click", 1.45, 35, "Verkaufspush") },
      { id: "hold", label: "Abwarten", detail: "+15 Saisonpunkte", apply: (s) => addSeasonPoints(s, 15, "Marktbeobachtung") },
    ],
  },
  {
    id: "heat",
    title: "Hitzewelle",
    text: "Die Anlage läuft an der Grenze.",
    choices: [
      { id: "cool", label: "Kühlen", detail: "Produktion 30s -10%, danach Eventrate -20% für 70s", apply: (s) => { addTimed(s, "prod", 0.9, 30, "Kühlung aktiv"); applyDelayedEffectSafe(30000, () => addTimed(state, "eventRate", 0.8, 70, "Thermisch stabil")); } },
      { id: "push", label: "Pushen", detail: "Produktion 25s +45%", apply: (s) => addTimed(s, "prod", 1.45, 25, "Overheat-Boost") },
      { id: "split", label: "Linie teilen", detail: "Klick +40% und Produktion +15% für 30s", apply: (s) => { addTimed(s, "click", 1.4, 30, "Split-Modus"); addTimed(s, "prod", 1.15, 30, "Split-Modus"); } },
    ],
  },
];

const MISSIONS = [
  { id: "m_prod_short", type: "produce", name: "Schichtziel", desc: "Produziere {target} Pixel", baseTarget: 24000, reward: { pixel: 9000, season: 18 } },
  { id: "m_prod_long", type: "produce", name: "Fokuslauf", desc: "Produziere {target} Pixel", baseTarget: 140000, reward: { pixel: 65000, season: 32 } },
  { id: "m_click", type: "clicks", name: "Handarbeit", desc: "Mache {target} Klicks", baseTarget: 380, reward: { pixel: 18000, season: 24, timedClick: 1.55 } },
  { id: "m_event", type: "events", name: "Krisenmanager", desc: "Löse {target} Events", baseTarget: 4, reward: { season: 46, pixel: 24000 } },
  { id: "m_combo", type: "combo", name: "Flow-Kette", desc: "Erreiche eine Kombo von {target}", baseTarget: 20, reward: { season: 28, timedProd: 1.45 } },
];

/** Millisekunden bis zur nächsten vollen oder halben Stunde (echte Uhr). */
function msBisNaechsteHalbeStunde() {
  const jetzt = new Date();
  const minuten = jetzt.getMinutes();
  const sekunden = jetzt.getSeconds();
  const ms = jetzt.getMilliseconds();
  const sekBis = (minuten < 30 ? 30 - minuten : 60 - minuten) * 60 - sekunden;
  return sekBis * 1000 - ms;
}

/** Zeitpunkt (ms) des nächsten Wechsels an Halbstunden-Grenze. */
function naechsterMissionenWechselZeitpunkt() {
  return Date.now() + msBisNaechsteHalbeStunde();
}

const state = makeDefaultState();
const runtime = {
  running: false,
  lastTs: 0,
  autosave: 0,
  tab: "shop",
  forceShopRender: true,
  nextShopRenderAt: 0,
  recentEvents: [],
};

const ui = {};
const canStructuredClone = typeof globalThis.structuredClone === "function";

function deepClone(value) {
  if (canStructuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function makeDefaultState() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      pixel: 0,
      lifetimePixel: 0,
      clickBase: 1,
      clickMult: 1,
      prodMult: 1,
      comboBonus: 0,
      comboWindowBonus: 0,
      offlineEff: 0.3,
      buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
      boughtUpgrades: [],
      bulk: 1,
      discountBuys: 0,
    },
    meta: {
      prestige: 0,
      prestigePoints: 0,
      selectedLine: null,
      lineLocked: false,
      lineLevels: { speed: {}, efficiency: {}, automation: {} },
      mutationIds: [],
      seasonPoints: 0,
      claimedSeasonTiers: [],
      eventRateMult: 1,
      lineProdMult: 1,
      lineClickMult: 1,
      mutationProdMult: 1,
      mutationClickMult: 1,
      missionRewardMult: 1,
      prestigeThresholdMult: 1,
      eventPenaltyMult: 1,
    },
    session: {
      runToken: Date.now(),
      producedRun: 0,
      clicksRun: 0,
      eventsSolved: 0,
      maxCombo: 0,
      missions: [],
      activeEffects: [],
      activeEvent: null,
      nextEventAt: Date.now() + BASE_EVENT_INTERVAL_MS,
      nextMissionRefreshAt: naechsterMissionenWechselZeitpunkt(),
      comboCount: 0,
      comboUntil: 0,
      discoveredBuildings: { worker: true },
      discoveredUpgrades: {},
      lastSaveAt: 0,
    },
    cosmetics: {
      skin: "default",
    },
  };
}

function fmtNumber(v) {
  if (!Number.isFinite(v)) return "0";
  if (Math.abs(v) < 10) return v.toFixed(2);
  if (v < 1000) return Math.floor(v).toString();
  if (v < 1_000_000) return `${(v / 1000).toFixed(2)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return `${(v / 1_000_000_000).toFixed(2)}B`;
}

function fmtPps(v) {
  if (v < 1) return v.toFixed(2);
  return fmtNumber(v);
}

function getComboMult() {
  if (Date.now() > state.session.comboUntil) return 1;
  const base = 1 + Math.min(1.7, state.session.comboCount * (0.045 + state.economy.comboBonus));
  return base;
}

function activeMult(key) {
  let m = 1;
  for (const e of state.session.activeEffects) {
    if (e.key === key) m *= e.mult;
  }
  return m;
}

function currentPps() {
  let pps = 0;
  for (const b of BUILDINGS) pps += (state.economy.buildings[b.id] || 0) * b.pps;
  return pps
    * state.economy.prodMult
    * state.meta.lineProdMult
    * state.meta.mutationProdMult
    * activeMult("prod");
}

function currentPpk() {
  let progressClickBoost =
    1
    + Math.log10(state.economy.lifetimePixel + 10) * 0.4
    + state.meta.prestige * 0.2;

  // Early/Midgame: Klick soll ~10–20 % der Gesamt-„Feel“-Produktion liefern (bei schnellem Klicken).
  if (state.economy.lifetimePixel < 50_000) progressClickBoost *= 1.82;
  else if (state.economy.lifetimePixel < 2_000_000) progressClickBoost *= 1.38;
  else if (state.economy.lifetimePixel < 80_000_000) progressClickBoost *= 1.16;

  return state.economy.clickBase
    * state.economy.clickMult
    * state.meta.lineClickMult
    * state.meta.mutationClickMult
    * progressClickBoost
    * getComboMult()
    * activeMult("click");
}

function prestigeThreshold() {
  return Math.floor(PRESTIGE_BASE * Math.pow(PRESTIGE_GROWTH, state.meta.prestige) * state.meta.prestigeThresholdMult);
}

function seasonLevel() {
  return Math.floor(state.meta.seasonPoints / 100);
}

function missionScaledTarget(base) {
  const p = state.meta.prestige;
  return Math.floor(base * (1 + p * 0.7));
}

function missionRewardScaled(v) {
  return Math.floor(v * (1 + state.meta.prestige * 0.3) * state.meta.missionRewardMult * activeMult("missionReward"));
}

function addPixels(amount, reason = "") {
  if (amount <= 0) return;
  state.economy.pixel += amount;
  state.economy.lifetimePixel += amount;
  state.session.producedRun += amount;
  if (reason) toast(`+${fmtNumber(amount)} Pixel · ${reason}`);
}

function addSeasonPoints(amount, reason = "") {
  if (amount <= 0) return;
  state.meta.seasonPoints += amount;
  if (reason) toast(`+${amount} Saisonpunkte · ${reason}`);
}

function addTimed(s, key, mult, seconds, label) {
  s.session.activeEffects.push({ key, mult, until: Date.now() + seconds * 1000, label });
  showBanner(`${label} (${seconds}s)`);
}

function tickEffects() {
  const now = Date.now();
  state.session.activeEffects = state.session.activeEffects.filter((e) => e.until > now);
}

function discoverUnlocks() {
  for (const b of BUILDINGS) {
    if (state.session.discoveredBuildings[b.id]) continue;
    if (state.economy.pixel >= b.unlockAt) state.session.discoveredBuildings[b.id] = true;
  }
  for (const u of UPGRADES) {
    if (state.session.discoveredUpgrades[u.id]) continue;
    if (state.economy.pixel >= u.unlockAt) state.session.discoveredUpgrades[u.id] = true;
  }
}

function buildingCost(b, extraIndex = 0) {
  const count = (state.economy.buildings[b.id] || 0) + extraIndex;
  let cost = Math.floor(b.baseCost * Math.pow(b.growth, count));
  if (state.economy.discountBuys > 0) cost = Math.floor(cost * 0.75);
  return cost;
}

function canBuyBuildingAmount(b, amount) {
  let left = state.economy.pixel;
  let bought = 0;
  for (let i = 0; i < amount; i += 1) {
    const c = buildingCost(b, i);
    if (left < c) break;
    left -= c;
    bought += 1;
  }
  return bought;
}

function buyBuilding(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b || !state.session.discoveredBuildings[id]) return;
  let target = state.economy.bulk;
  if (target === 0) target = 9999;
  const can = canBuyBuildingAmount(b, target);
  if (can <= 0) return;

  let total = 0;
  for (let i = 0; i < can; i += 1) total += buildingCost(b, i);
  state.economy.pixel -= total;
  state.economy.buildings[id] += can;
  if (state.economy.discountBuys > 0) state.economy.discountBuys = Math.max(0, state.economy.discountBuys - 1);
  runtime.forceShopRender = true;
  renderStats();
}

function buyUpgrade(id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u || !state.session.discoveredUpgrades[id]) return;
  if (state.economy.boughtUpgrades.includes(id)) return;
  if (state.economy.pixel < u.cost) return;
  state.economy.pixel -= u.cost;
  state.economy.boughtUpgrades.push(id);
  u.apply(state);
  runtime.forceShopRender = true;
  renderStats();
}

function recomputeMetaFromLineAndMutations() {
  state.meta.eventRateMult = 1;
  state.meta.lineProdMult = 1;
  state.meta.lineClickMult = 1;
  state.meta.mutationProdMult = 1;
  state.meta.mutationClickMult = 1;
  state.meta.missionRewardMult = 1;
  state.meta.prestigeThresholdMult = 1;
  state.meta.eventPenaltyMult = 1;

  for (const id of state.meta.mutationIds) {
    const m = MUTATIONS.find((x) => x.id === id);
    if (m) m.apply(state);
  }

  const line = state.meta.selectedLine;
  if (!line) return;
  const levels = state.meta.lineLevels[line] || {};
  const tree = LINE_TREES[line];
  for (const node of tree) {
    const lvl = levels[node.id] || 0;
    if (lvl > 0) node.effect(state, lvl);
  }
}

function levelOfNode(line, nodeId) {
  return (state.meta.lineLevels[line] || {})[nodeId] || 0;
}

function canUpgradeLineNode(line, node) {
  if (state.meta.selectedLine !== line) return false;
  if (state.meta.prestigePoints < node.cost) return false;
  if (levelOfNode(line, node.id) >= node.max) return false;
  if (!node.req) return true;
  return levelOfNode(line, node.req) > 0;
}

function upgradeLineNode(line, nodeId) {
  if (state.meta.selectedLine !== line) return;
  const node = LINE_TREES[line].find((n) => n.id === nodeId);
  if (!node || !canUpgradeLineNode(line, node)) return;
  state.meta.prestigePoints -= node.cost;
  if (!state.meta.lineLevels[line]) state.meta.lineLevels[line] = {};
  state.meta.lineLevels[line][node.id] = levelOfNode(line, node.id) + 1;
  recomputeMetaFromLineAndMutations();
  renderLineTree();
  renderStats();
}

function selectLine(line) {
  if (!LINE_TREES[line]) return;
  if (state.meta.lineLocked) {
    toast("Linie ist bis zum nächsten Prestige gesperrt.");
    return;
  }
  state.meta.selectedLine = line;
  state.meta.lineLocked = true;
  recomputeMetaFromLineAndMutations();
  runtime.forceShopRender = true;
  renderLineTree();
  renderStats();
  toast(`Linie gewählt: ${line.toUpperCase()}`);
}

function randomMissionSet() {
  const pool = [...MISSIONS];
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    const m = pool.splice(i, 1)[0];
    const target = missionScaledTarget(m.baseTarget);
    out.push({ ...m, target, progress: 0, done: false });
  }
  state.session.missions = out;
  state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
}

function missionProgress(m) {
  if (m.type === "produce") return state.session.producedRun;
  if (m.type === "clicks") return state.session.clicksRun;
  if (m.type === "events") return state.session.eventsSolved;
  if (m.type === "combo") return state.session.maxCombo;
  return 0;
}

function completeMission(m) {
  m.done = true;
  if (m.reward.pixel) addPixels(missionRewardScaled(m.reward.pixel), "Mission");
  if (m.reward.season) addSeasonPoints(missionRewardScaled(m.reward.season), "Mission");
  if (m.reward.timedProd) addTimed(state, "prod", m.reward.timedProd, 45, "Missions-Boost");
  if (m.reward.timedClick) addTimed(state, "click", m.reward.timedClick, 45, "Missions-Boost");
  toast(`Mission geschafft: ${m.name}`);
}

function updateMissions() {
  if (!state.session.nextMissionRefreshAt) {
    state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
  }
  if (Date.now() >= state.session.nextMissionRefreshAt) {
    randomMissionSet();
    toast("Neue Missionen sind eingetroffen.");
  }
  for (const m of state.session.missions) {
    if (m.done) continue;
    m.progress = Math.min(m.target, missionProgress(m));
    if (m.progress >= m.target) completeMission(m);
  }
}

function pickEvent() {
  const candidates = EVENT_POOL.filter((e) => !runtime.recentEvents.includes(e.id));
  const pool = candidates.length > 0 ? candidates : EVENT_POOL;
  const e = pool[Math.floor(Math.random() * pool.length)];
  runtime.recentEvents.push(e.id);
  if (runtime.recentEvents.length > 3) runtime.recentEvents.shift();
  return e;
}

function eventInterval() {
  return Math.floor(BASE_EVENT_INTERVAL_MS * state.meta.eventRateMult * activeMult("eventRate"));
}

function maybeSpawnEvent() {
  if (state.session.activeEvent) return;
  if (Date.now() < state.session.nextEventAt) return;
  state.session.activeEvent = pickEvent();
  state.session.nextEventAt = Date.now() + eventInterval();
  renderEventModal();
}

function resolveEvent(choiceId) {
  const e = state.session.activeEvent;
  if (!e) return;
  const choice = e.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  choice.apply(state);
  state.session.eventsSolved += 1;
  state.session.activeEvent = null;
  ui.eventOverlay.classList.add("versteckt");
  updateMissions();
}

// Minigames wurden bewusst entfernt.

function calcPrestigeGain() {
  return 1;
}

function openPrestigeModal() {
  if (state.economy.lifetimePixel < prestigeThreshold()) return;
  const choices = [];
  const src = [...MUTATIONS];
  while (choices.length < 3 && src.length > 0) {
    const i = Math.floor(Math.random() * src.length);
    choices.push(src.splice(i, 1)[0]);
  }
  const wrap = document.getElementById("mutationChoices");
  ui.pcQP.textContent = `+${calcPrestigeGain()} Prestigepunkt`;
  wrap.innerHTML = choices.map((m) => `
    <button class="mutation-card" data-mut="${m.id}">
      <strong>${m.title}</strong>
      <span>${m.text}</span>
      <small>${m.detail}</small>
    </button>
  `).join("");
  wrap.querySelectorAll("[data-mut]").forEach((btn) => {
    btn.addEventListener("click", () => doPrestige(btn.dataset.mut));
  });
  const quickBtn = document.getElementById("prestigeConfirmJa");
  if (quickBtn) {
    quickBtn.textContent = "Zufällige Mutation";
    quickBtn.onclick = () => {
      const first = choices[0];
      if (first) doPrestige(first.id);
    };
  }
  ui.prestigeModal.classList.remove("versteckt");
}

function doPrestige(mutationId) {
  const mutation = MUTATIONS.find((m) => m.id === mutationId);
  if (!mutation) return;
  state.meta.prestige += 1;
  state.meta.prestigePoints += calcPrestigeGain();
  state.meta.mutationIds.push(mutationId);
  state.meta.lineLocked = false;

  const keepMeta = deepClone(state.meta);
  const keepCos = deepClone(state.cosmetics);
  const fresh = makeDefaultState();
  const nextRunToken = Date.now();
  state.economy = fresh.economy;
  state.session = fresh.session;
  state.session.runToken = nextRunToken;
  state.meta = keepMeta;
  state.cosmetics = keepCos;

  randomMissionSet();
  recomputeMetaFromLineAndMutations();
  ui.prestigeModal.classList.add("versteckt");
  runtime.forceShopRender = true;
  renderStats();
  renderMissions();
  renderLineTree();
  toast(`Prestige ${state.meta.prestige} erreicht. +1 Prestigepunkt.`);
}

function applyOfflineBonus(lastTs) {
  if (!lastTs) return;
  const delta = Math.max(0, Date.now() - lastTs);
  if (delta < 60000) return;
  const hours = Math.min(18, delta / 3600000);
  const bonus = currentPps() * hours * 3600 * state.economy.offlineEff;
  addPixels(bonus, "Offline");
}

/** Kurzer sichtbarer Hinweis nach automatischem Supabase-Speichern. */
function zeigeSpeicherHinweis() {
  const el = document.getElementById("autosaveInd");
  if (!el) return;
  el.textContent = "Gespeichert ✓";
  el.classList.add("autosave-sichtbar");
  clearTimeout(zeigeSpeicherHinweis._t);
  zeigeSpeicherHinweis._t = setTimeout(() => {
    el.textContent = "";
    el.classList.remove("autosave-sichtbar");
  }, 1000);
}

async function saveGame(withToast = false, zeigeHinweis = false) {
  if (new URLSearchParams(location.search).has("admin")) return;
  const user = await PZ.getUser();
  if (!user) return;
  state.session.lastSaveAt = Date.now();
  const payload = deepClone(state);
  const res = await PZ.saveGameData(GAME_ID, Math.floor(state.economy.lifetimePixel), state.meta.prestige, payload);
  if (res.error) console.error("[Pixel Factory] Speichern fehlgeschlagen:", res.error);
  if (withToast) toast("Gespeichert");
  if (zeigeHinweis && !res.error) zeigeSpeicherHinweis();
}

async function loadGame() {
  const data = await PZ.loadScore(GAME_ID);
  if (!data || !data.extra_daten) {
    randomMissionSet();
    return;
  }

  const incoming = data.extra_daten;
  if (incoming.schemaVersion !== SAVE_SCHEMA_VERSION) {
    Object.assign(state, makeDefaultState());
    randomMissionSet();
    await saveGame(false);
    ui.offlineBonus.hidden = false;
    ui.offlineBonus.textContent = "Hard-Reset aktiv: alter Spielstand wurde auf Rework v3 gesetzt.";
    setTimeout(() => { ui.offlineBonus.hidden = true; }, 8000);
    return;
  }

  const fresh = makeDefaultState();
  state.economy = {
    ...fresh.economy,
    ...(incoming.economy || {}),
    buildings: {
      ...fresh.economy.buildings,
      ...((incoming.economy && incoming.economy.buildings) || {}),
    },
    boughtUpgrades: Array.isArray(incoming.economy?.boughtUpgrades)
      ? incoming.economy.boughtUpgrades
      : fresh.economy.boughtUpgrades,
  };
  state.meta = {
    ...fresh.meta,
    ...(incoming.meta || {}),
    lineLevels: {
      ...fresh.meta.lineLevels,
      ...(incoming.meta?.lineLevels || {}),
      speed: { ...fresh.meta.lineLevels.speed, ...(incoming.meta?.lineLevels?.speed || {}) },
      efficiency: { ...fresh.meta.lineLevels.efficiency, ...(incoming.meta?.lineLevels?.efficiency || {}) },
      automation: { ...fresh.meta.lineLevels.automation, ...(incoming.meta?.lineLevels?.automation || {}) },
    },
    mutationIds: Array.isArray(incoming.meta?.mutationIds)
      ? incoming.meta.mutationIds
      : fresh.meta.mutationIds,
    claimedSeasonTiers: Array.isArray(incoming.meta?.claimedSeasonTiers)
      ? incoming.meta.claimedSeasonTiers
      : fresh.meta.claimedSeasonTiers,
  };
  state.session = {
    ...fresh.session,
    ...(incoming.session || {}),
    discoveredBuildings: {
      ...fresh.session.discoveredBuildings,
      ...(incoming.session?.discoveredBuildings || {}),
    },
    discoveredUpgrades: {
      ...fresh.session.discoveredUpgrades,
      ...(incoming.session?.discoveredUpgrades || {}),
    },
    missions: Array.isArray(incoming.session?.missions)
      ? incoming.session.missions
      : fresh.session.missions,
    activeEffects: Array.isArray(incoming.session?.activeEffects)
      ? incoming.session.activeEffects
      : fresh.session.activeEffects,
  };
  state.cosmetics = {
    ...fresh.cosmetics,
    ...(incoming.cosmetics || {}),
  };
  state.schemaVersion = SAVE_SCHEMA_VERSION;

  if (!Array.isArray(state.session.missions) || state.session.missions.length === 0) randomMissionSet();
  if (state.session.nextMissionRefreshAt < Date.now()) randomMissionSet();
  recomputeMetaFromLineAndMutations();
  applyOfflineBonus(state.session.lastSaveAt);
}

function showBanner(txt) {
  ui.banner.hidden = false;
  ui.banner.textContent = txt;
  setTimeout(() => { ui.banner.hidden = true; }, 2500);
}

function toast(txt) {
  const d = document.createElement("div");
  d.className = "toast";
  d.textContent = txt;
  ui.toast.appendChild(d);
  setTimeout(() => d.remove(), 2300);
}

function drawPile() {
  const c = ui.canvas;
  const ctx = c.getContext("2d");
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);

  const stage = Math.min(1, Math.log10(state.economy.pixel + 1) / 7);
  const radius = 44 + stage * 88;
  const skin = SKINS.find((s) => s.id === state.cosmetics.skin) || SKINS[0];
  const time = Date.now() * 0.00045;
  const toneA = skin.pile?.a || "90,140,255";
  const toneB = skin.pile?.b || "60,95,220";
  const glow = 0.22 + stage * 0.5;

  ctx.save();
  ctx.translate(w / 2, h / 2 + 14);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, radius + 24);
  g.addColorStop(0, `rgba(${toneA},${0.3 + stage * 0.25})`);
  g.addColorStop(1, `rgba(${toneB},0.08)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 120; i += 1) {
    const a = (Math.PI * 2 * i) / 120 + time * 0.22;
    const r = ((i * 37) % 97) / 97 * radius;
    const wobble = Math.sin(time + i * 0.35) * (2 + stage * 2);
    const x = Math.cos(a) * (r + wobble);
    const y = Math.sin(a) * (r + wobble) * 0.62;
    const size = 2 + ((i * 13) % 7) * 0.45 + stage * 1.5;
    const light = 52 + ((i * 19) % 28);
    ctx.fillStyle = `hsla(${212 + stage * 68 + (i % 12)},82%,${light}%,${0.72 + glow * 0.2})`;
    ctx.fillRect(x, y, size, size);
  }

  ctx.strokeStyle = `rgba(${toneA},0.55)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 8 + Math.sin(time * 1.4) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function renderStats() {
  ui.statPixel.textContent = `${fmtNumber(state.economy.pixel)} Pixel`;
  ui.statPps.textContent = fmtPps(currentPps());
  ui.statPpk.textContent = fmtPps(currentPpk());
  ui.statQp.textContent = `${state.meta.prestigePoints}`;
  ui.statPrestige.textContent = `${state.meta.prestige}`;

  const needed = prestigeThreshold() - state.economy.lifetimePixel;
  const ready = needed <= 0;
  ui.prestigeBtn.disabled = !ready;
  ui.prestigeInfo.textContent = ready
    ? "Prestige bereit · Mutation wählen"
    : `${fmtNumber(needed)} Pixel bis Prestige`;

  const comboActive = Date.now() <= state.session.comboUntil;
  const fill = comboActive ? Math.max(0, (state.session.comboUntil - Date.now()) / (COMBO_WINDOW_MS + state.economy.comboWindowBonus)) : 0;
  ui.comboFill.style.width = `${Math.floor(fill * 100)}%`;
  ui.comboLabel.textContent = comboActive
    ? `Kombo x${getComboMult().toFixed(2)} (${state.session.comboCount})`
    : "Kombo";
}

function renderMissions() {
  const leftMs = Math.max(0, (state.session.nextMissionRefreshAt || 0) - Date.now());
  const leftMin = Math.floor(leftMs / 60000);
  const leftSec = Math.floor((leftMs % 60000) / 1000);
  const refreshInfo = document.getElementById("missionRefreshInfo");
  if (refreshInfo) refreshInfo.textContent = `Neu in ${leftMin}:${String(leftSec).padStart(2, "0")}`;

  ui.missionList.innerHTML = state.session.missions.map((m) => {
    const ratio = Math.min(1, (m.progress || 0) / m.target);
    const rewards = [];
    if (m.reward.pixel) rewards.push(`${missionRewardScaled(m.reward.pixel)} Pixel`);
    if (m.reward.season) rewards.push(`${missionRewardScaled(m.reward.season)} Saison`);
    return `
      <div class="mission-card ${m.done ? "done" : ""}">
        <div class="mission-top"><strong>${m.name}</strong><span>${Math.floor(ratio * 100)}%</span></div>
        <div class="upgrade-text">${m.desc.replace("{target}", fmtNumber(m.target))}</div>
        <div class="mission-bar"><div style="width:${ratio * 100}%"></div></div>
        <div class="mission-reward">${rewards.join(" · ")}</div>
      </div>
    `;
  }).join("");
}

/** Shop-Upgrade-Karte: Klick (blau) / Produktion (Bernstein) / Sonstiges */
function upgradeCardKind(u) {
  if (u.id.startsWith("u_click")) return "click";
  if (u.id.startsWith("u_prod")) return "prod";
  return "other";
}

function renderShopCards() {
  ui.shopMain.innerHTML = `<div class="pf-card-grid pf-card-grid--shop">${BUILDINGS.map((b) => {
    const discovered = !!state.session.discoveredBuildings[b.id];
    if (!discovered) {
      return `
        <button type="button" class="pf-game-card pf-game-card--building pf-game-card--locked" disabled>
          <div class="pf-card-icon pf-card-icon--muted">?</div>
          <div class="pf-card-main">
            <h3 class="pf-card-title">???</h3>
            <p class="pf-card-meta">Noch nicht entdeckt</p>
          </div>
          <span class="pf-card-buy pf-card-buy--disabled">???</span>
        </button>`;
    }
    const can = canBuyBuildingAmount(b, state.economy.bulk === 0 ? 1 : state.economy.bulk) > 0;
    const cost = buildingCost(b, 0);
    const cnt = state.economy.buildings[b.id] || 0;
    return `
      <button type="button" class="pf-game-card pf-game-card--building ${can ? "pf-game-card--afford" : "pf-game-card--expensive"}" data-buy-building="${b.id}">
        <div class="pf-card-icon pf-card-icon--building">${b.icon}</div>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${b.name} <span class="pf-card-badge">${cnt}</span></h3>
          <p class="pf-card-effect pf-card-effect--pps">+${fmtPps(b.pps)} <span class="pf-effect-label">PPS</span> <small>pro Stück</small></p>
        </div>
        <span class="pf-card-buy">${fmtNumber(cost)} <span class="pf-pixel-unit">Pixel</span></span>
      </button>`;
  }).join("")}</div>`;

  ui.shopMain.querySelectorAll("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => buyBuilding(btn.dataset.buyBuilding));
  });
}

function renderUpgradeCards() {
  const lineHint = state.meta.lineLocked
    ? "Die Linie ist bis zum nächsten Prestige fest – danach kannst du wechseln."
    : "Wähle eine Linie für den Linienbaum (Tab „Linienbaum“).";

  const lineButtons = `
    <div class="pf-path-grid">
      ${Object.keys(LINE_TREES).map((line) => `
        <button type="button" class="pf-path-card ${state.meta.selectedLine === line ? "pf-path-card--active" : ""}" data-line-pick="${line}">
          <span class="pf-path-card__tag">${line === "speed" ? "⚡" : line === "efficiency" ? "✓" : "🤖"}</span>
          <strong class="pf-path-card__title">${line.toUpperCase()}</strong>
          <span class="pf-path-card__sub">${line === "speed" ? "Burst & Tempo" : line === "efficiency" ? "Stabilität & Kontrolle" : "Auto & Offline"}</span>
          ${state.meta.selectedLine === line ? '<span class="pf-path-card__ribbon">Aktiv</span>' : ""}
        </button>
      `).join("")}
    </div>
    <p class="pf-section-hint">${lineHint}</p>
  `;

  const byKind = { click: [], prod: [], other: [] };
  for (const u of UPGRADES) {
    const k = upgradeCardKind(u);
    if (k === "click") byKind.click.push(u);
    else if (k === "prod") byKind.prod.push(u);
    else byKind.other.push(u);
  }

  function cardHtml(u) {
    const discovered = !!state.session.discoveredUpgrades[u.id];
    if (!discovered) {
      return `
        <button type="button" class="pf-game-card pf-game-card--upgrade pf-game-card--locked" disabled>
          <div class="pf-card-main">
            <h3 class="pf-card-title">???</h3>
            <p class="pf-card-meta">Noch nicht entdeckt</p>
          </div>
          <span class="pf-card-buy pf-card-buy--disabled">???</span>
        </button>`;
    }
    const bought = state.economy.boughtUpgrades.includes(u.id);
    const can = !bought && state.economy.pixel >= u.cost;
    const kind = upgradeCardKind(u);
    const effClass = kind === "click" ? "pf-card-effect--ppk" : kind === "prod" ? "pf-card-effect--ppsu" : "pf-card-effect--misc";
    const stateClass = bought ? "pf-game-card--bought" : can ? "pf-game-card--afford" : "pf-game-card--expensive";
    return `
      <button type="button" class="pf-game-card pf-game-card--upgrade pf-game-card--${kind} ${stateClass}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${u.name}</h3>
          <p class="pf-card-effect ${effClass}">${u.desc}</p>
        </div>
        <span class="pf-card-buy">${bought ? "Gekauft" : `${fmtNumber(u.cost)} Pixel`}</span>
      </button>`;
  }

  const sec = (title, arr) =>
    arr.length
      ? `<div class="pf-upgrade-section"><h4 class="pf-upgrade-section__title">${title}</h4><div class="pf-card-grid pf-card-grid--upgrades">${arr.map(cardHtml).join("")}</div></div>`
      : "";

  ui.shopUpgrades.innerHTML = `${lineButtons}
    ${sec("Klickkraft (PPC)", byKind.click)}
    ${sec("Produktion (PPS)", byKind.prod)}
    ${sec("Sonstiges", byKind.other)}`;

  ui.shopUpgrades.querySelectorAll("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => buyUpgrade(btn.dataset.buyUpgrade));
  });
  ui.shopUpgrades.querySelectorAll("[data-line-pick]").forEach((btn) => {
    btn.addEventListener("click", () => selectLine(btn.dataset.linePick));
  });
}

function skillNodeButtonClass(line, n) {
  const lvl = levelOfNode(line, n.id);
  if (lvl >= n.max) return "pf-skill-node pf-skill-node--done";
  if (canUpgradeLineNode(line, n)) return "pf-skill-node pf-skill-node--ready";
  return "pf-skill-node pf-skill-node--locked";
}

function renderLineTree() {
  const line = state.meta.selectedLine;
  if (!line) {
    ui.shopLine.innerHTML = `
      <div class="pf-line-intro">
        <strong>Kein Linienbaum aktiv</strong>
        <p class="pf-section-hint">Wähle im Tab „Upgrades“ eine Line (Speed, Efficiency oder Automation). Danach erscheint der verzweigte Baum hier.</p>
      </div>`;
    return;
  }
  const tree = LINE_TREES[line];
  const edgeLines = [];
  for (const n of tree) {
    if (!n.req) continue;
    const p = tree.find((x) => x.id === n.req);
    if (!p || p.lx == null || n.lx == null) continue;
    edgeLines.push(`<line class="pf-skill-edge" x1="${p.lx}" y1="${p.ly}" x2="${n.lx}" y2="${n.ly}" />`);
  }
  const nodesHtml = tree.map((n) => {
    const lvl = levelOfNode(line, n.id);
    const can = canUpgradeLineNode(line, n);
    const reqNode = n.req ? tree.find((x) => x.id === n.req) : null;
    const reqTxt = reqNode && lvl === 0 && !can ? `Benötigt: ${reqNode.name}` : "";
    const cls = skillNodeButtonClass(line, n);
    const maxed = lvl >= n.max;
    const tip = `${n.name} (${lvl}/${n.max})${reqTxt ? " · " + reqTxt : ""}`;
    return `
      <button type="button"
        class="${cls}"
        style="left:${n.lx}%;top:${n.ly}%;"
        data-line-node="${n.id}"
        ${maxed || !can ? "disabled" : ""}
        title="${tip.replace(/"/g, "'")}">
        <span class="pf-skill-node__name">${n.name}</span>
        <span class="pf-skill-node__lvl">${lvl}/${n.max}</span>
        <span class="pf-skill-node__cost">${n.cost} PP</span>
      </button>`;
  }).join("");

  ui.shopLine.innerHTML = `
    <div class="pf-line-tree-head">
      <div>
        <strong class="pf-line-tree-head__line">${line.toUpperCase()}-Linie</strong>
        <span class="pf-line-tree-head__qp">Prestigepunkte: <b>${state.meta.prestigePoints}</b></span>
      </div>
      <p class="pf-section-hint">Startkern in der Mitte – Verzweigungen zeigen Abhängigkeiten. Gold = voll, leuchtender Rand = kaufbar.</p>
    </div>
    <div class="pf-skill-tree-board">
      <svg class="pf-skill-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${edgeLines.join("")}</svg>
      <div class="pf-skill-nodes">${nodesHtml}</div>
    </div>
  `;
  ui.shopLine.querySelectorAll("[data-line-node]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      upgradeLineNode(line, btn.dataset.lineNode);
    });
  });
}

function maybeRenderShop() {
  const now = Date.now();
  if (!runtime.forceShopRender && now < runtime.nextShopRenderAt) return;
  renderShopCards();
  renderUpgradeCards();
  renderLineTree();
  runtime.forceShopRender = false;
  runtime.nextShopRenderAt = now + 900;
}

function renderEventModal() {
  const e = state.session.activeEvent;
  if (!e) return;
  document.getElementById("eventTitle").textContent = e.title;
  document.getElementById("eventText").textContent = e.text;
  const wrap = document.getElementById("eventChoices");
  wrap.innerHTML = e.choices.map((c) => `
    <button class="btn-aktion event-choice" data-event-choice="${c.id}">
      <strong>${c.label}</strong><small>${c.detail}</small>
    </button>
  `).join("");
  wrap.querySelectorAll("[data-event-choice]").forEach((btn) => {
    btn.addEventListener("click", () => resolveEvent(btn.dataset.eventChoice));
  });
  ui.eventOverlay.classList.remove("versteckt");
}

async function renderLeaderboard(mode) {
  let rows = [];
  try {
    rows = await PZ.getLeaderboard(GAME_ID, 60);
  } catch (e) {
    console.error("[Pixel Factory] Rangliste getLeaderboard:", e);
    ui.rankContent.innerHTML = `<div class="rang-fehler">Rangliste konnte nicht geladen werden. Details in der Konsole.</div>`;
    return;
  }
  const filteredV3 = rows.filter((r) => r.extra_daten?.schemaVersion === SAVE_SCHEMA_VERSION);
  if (rows.length > 0 && filteredV3.length === 0) {
    console.warn("[Pixel Factory] Rangliste: Keine Einträge mit Schema v3 – zeige alle gespeicherten Zeilen.");
  }
  const nutze = filteredV3.length > 0 ? filteredV3 : rows;
  let sorted = [...nutze];
  if (mode === "prestige") sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
  else if (mode === "season") sorted.sort((a, b) => (b.extra_daten?.meta?.seasonPoints || 0) - (a.extra_daten?.meta?.seasonPoints || 0));
  else sorted.sort((a, b) => (b.punkte || 0) - (a.punkte || 0));

  if (sorted.length === 0) {
    ui.rankContent.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-muted)">Noch keine Einträge. Nach dem Anmelden wird der Spielstand automatisch gespeichert.</div>`;
    return;
  }
  ui.rankContent.innerHTML = `
    <table class="rangliste-tabelle">
      <thead><tr><th>#</th><th>Spieler</th><th>${mode === "pixel" ? "Pixel" : mode === "prestige" ? "Prestige" : "Saison"}</th></tr></thead>
      <tbody>
        ${sorted.slice(0, 20).map((r, i) => {
          const val = mode === "pixel" ? fmtNumber(r.punkte || 0) : mode === "prestige" ? (r.level || 0) : (r.extra_daten?.meta?.seasonPoints || 0);
          return `<tr><td>${i + 1}</td><td>${r.benutzername || "Anonym"}</td><td>${val}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderSeasonModal() {
  const lvl = seasonLevel();
  const nextTierPts = (lvl + 1) * 100;
  const nextDiff = nextTierPts - state.meta.seasonPoints;
  const reward = `Nächster Tier-Bonus: +${5 + lvl * 2}% Produktion für diesen Run`;
  const progressPct = Math.max(0, Math.min(100, Math.floor((state.meta.seasonPoints % 100))));
  document.getElementById("errungenschaftenGrid").innerHTML = `
    <div class="season-wrap">
      <div class="season-card">
        <div class="season-top">
          <strong>Level ${lvl}</strong>
          <span>${state.meta.seasonPoints} Punkte</span>
        </div>
        <div class="season-bar"><div style="width:${progressPct}%"></div></div>
        <div class="upgrade-text">${nextDiff <= 0 ? "Tier bereit!" : `${nextDiff} Punkte bis Tier ${lvl + 1}`}</div>
      </div>
      <div class="season-grid">
        <div class="season-card"><strong>Belohnung</strong><div class="upgrade-text">${reward}</div></div>
        <div class="season-card"><strong>Wie bekomme ich Punkte?</strong><div class="upgrade-text">Missionen abschließen und Event-Entscheidungen meistern.</div></div>
        <div class="season-card"><strong>Tipp</strong><div class="upgrade-text">Schwere Missionen bringen deutlich mehr Saisonpunkte als kurze Aufgaben.</div></div>
      </div>
    </div>
  `;
  document.getElementById("errungenschaftenModal").classList.remove("versteckt");
}

const SKINS = [
  { id: "default", name: "Standard", pile: { a: "90,140,255", b: "56,98,222" }, vars: { "--primary": "#4f6ef8", "--bg": "#f6f9ff", "--surface": "#ffffff", "--text": "#162033", "--border": "#d7e3fb" } },
  { id: "sunny", name: "Sonnig", pile: { a: "251,191,36", b: "245,158,11" }, vars: { "--primary": "#ea9b1e", "--bg": "#fff8ea", "--surface": "#ffffff", "--text": "#6e3e0d", "--border": "#f9d59a" } },
  { id: "mint", name: "Mint", pile: { a: "34,197,164", b: "16,185,129" }, vars: { "--primary": "#10b981", "--bg": "#eefdf7", "--surface": "#ffffff", "--text": "#14453a", "--border": "#baeede" } },
  { id: "violet", name: "Violett", pile: { a: "167,139,250", b: "124,58,237" }, vars: { "--primary": "#7c4df3", "--bg": "#f6f2ff", "--surface": "#ffffff", "--text": "#32205e", "--border": "#ded2ff" } },
  { id: "lagoon", name: "Lagune", pile: { a: "56,189,248", b: "14,116,144" }, vars: { "--primary": "#0ea5e9", "--bg": "#eef9ff", "--surface": "#ffffff", "--text": "#12354a", "--border": "#bfe8fb" } },
  { id: "rose", name: "Rose", pile: { a: "251,113,133", b: "225,29,72" }, vars: { "--primary": "#e11d48", "--bg": "#fff1f5", "--surface": "#ffffff", "--text": "#4a1a2f", "--border": "#fec7d7" } },
];

function applySkin(id) {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0];
  state.cosmetics.skin = skin.id;
  Object.entries(skin.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

function renderSkinModal() {
  const grid = document.getElementById("skinGrid");
  grid.innerHTML = SKINS.map((s) => `
    <button class="skin-karte ${state.cosmetics.skin === s.id ? "aktiv" : ""}" data-skin="${s.id}">
      <div class="skin-vorschau" style="background:${s.vars["--bg"]};border-color:${s.vars["--border"]};"></div>
      <div class="skin-name">${s.name}</div>
    </button>
  `).join("");
  grid.querySelectorAll("[data-skin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applySkin(btn.dataset.skin);
      renderSkinModal();
    });
  });
}

/** HTML-Adminleiste (#adminPanel) – nur mit ?admin oder ?admin=1 in der URL. */
function wireAdminPanel() {
  if (!new URLSearchParams(location.search).has("admin")) return;
  const panel = document.getElementById("adminPanel");
  if (!panel) return;
  panel.style.display = "block";

  document.getElementById("adm-pixel-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-pixel")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.economy.pixel = v;
    state.economy.lifetimePixel = Math.max(state.economy.lifetimePixel, v);
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast(`Pixel: ${fmtNumber(v)}`);
  });

  document.getElementById("adm-prestige-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-prestige")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.meta.prestige = Math.floor(v);
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast(`Prestige: ${state.meta.prestige}`);
  });

  document.getElementById("adm-qp-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-qp")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.meta.prestigePoints = Math.floor(v);
    renderStats();
    renderLineTree();
    toast(`Prestigepunkte: ${state.meta.prestigePoints}`);
  });

  document.getElementById("adm-vorspulen-btn")?.addEventListener("click", () => {
    const h = Number(document.getElementById("adm-vorspulen")?.value) || 1;
    const bonus = currentPps() * h * 3600;
    addPixels(bonus, "Admin-Zeitsprung");
    toast(`+${fmtNumber(bonus)} Pixel (${h} h)`);
  });

  document.getElementById("adm-alle-upgrades")?.addEventListener("click", () => {
    for (const u of UPGRADES) {
      if (state.economy.boughtUpgrades.includes(u.id)) continue;
      state.economy.boughtUpgrades.push(u.id);
      u.apply(state);
    }
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast("Alle Shop-Upgrades");
  });

  document.getElementById("adm-alle-skins")?.addEventListener("click", () => {
    const last = SKINS[SKINS.length - 1];
    applySkin(last.id);
    toast(`Skin: ${last.name}`);
  });

  document.getElementById("adm-alle-err")?.addEventListener("click", () => {
    state.meta.seasonPoints += 10000;
    renderStats();
    toast("+10000 Saisonpunkte");
  });

  document.getElementById("adm-toggle")?.addEventListener("click", () => {
    const body = panel.querySelector(".adm-body");
    if (!body) return;
    body.style.display = body.style.display === "none" ? "block" : "none";
  });
}

function handleClick() {
  addPixels(currentPpk());
  state.session.clicksRun += 1;
  const now = Date.now();
  const win = COMBO_WINDOW_MS + state.economy.comboWindowBonus;
  if (now <= state.session.comboUntil) state.session.comboCount += 1;
  else state.session.comboCount = 1;
  state.session.comboUntil = now + win;
  state.session.maxCombo = Math.max(state.session.maxCombo || 0, state.session.comboCount);
  ui.klickInfo.textContent = `+${fmtPps(currentPpk())} pro Klick`;
  drawPile();
}

function maybeRenderTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  const title = document.getElementById("tutorialTitel");
  const text = document.getElementById("tutorialText");
  const icon = document.getElementById("tutorialIcon");
  const nextBtn = document.getElementById("tutWeiter");
  const skipBtn = document.getElementById("tutSkip");

  const steps = [
    { icon: "🏭", title: "Willkommen beim Rework", text: "Hier ist alles auf Entscheidungen gebaut: Missionen, Events und Linienbaum." },
    { icon: "🛒", title: "Shop & Upgrades", text: "Kaufe im Shop Gebäude. Unbekannte Items zeigen ??? und werden automatisch freigeschaltet, sobald du genug Pixel hast." },
    { icon: "🌿", title: "Line-Baum", text: "Mit jedem Prestige bekommst du 1 Prestigepunkt. Investiere ihn in deinen aktiven Linienbaum." },
    { icon: "✦", title: "Prestige-Mutationen", text: "Bei Prestige musst du 1 Mutation wählen. Diese kann den Run stark verändern (stark positiv + klarer Nachteil)." },
    { icon: "📅", title: "Saison & Missionen", text: "Missionen werden automatisch alle 30 Minuten neu gemischt. Saisonpunkte bringen Fortschritt und Rangliste." },
  ];
  let idx = 0;
  function render() {
    const s = steps[idx];
    icon.textContent = s.icon;
    title.textContent = s.title;
    text.textContent = s.text;
    nextBtn.textContent = idx >= steps.length - 1 ? "Fertig" : "Weiter →";
    document.querySelectorAll(".tut-punkt").forEach((p, i) => p.classList.toggle("aktiv", i === idx));
  }
  function close() { overlay.classList.add("versteckt"); }
  nextBtn.onclick = () => {
    if (idx >= steps.length - 1) close();
    else { idx += 1; render(); }
  };
  skipBtn.onclick = close;
  overlay.classList.remove("versteckt");
  render();
}

function bindDom() {
  ui.statPixel = document.getElementById("statPixel");
  ui.statPps = document.getElementById("statPPS");
  ui.statPpk = document.getElementById("statPPK");
  ui.statQp = document.getElementById("statQP");
  ui.statPrestige = document.getElementById("statPrestige");
  ui.prestigeBtn = document.getElementById("prestigeBtn");
  ui.prestigeInfo = document.getElementById("prestigeInfo");
  ui.canvas = document.getElementById("pixelHaufen");
  ui.klickInfo = document.getElementById("klickInfo");
  ui.comboFill = document.getElementById("komboFill");
  ui.comboLabel = document.getElementById("komboLabel");
  ui.shopMain = document.getElementById("shopGebaeude");
  ui.shopUpgrades = document.getElementById("shopUpgrades");
  ui.shopLine = document.getElementById("shopPrestige");
  ui.offlineBonus = document.getElementById("offlineBonus");
  ui.banner = document.getElementById("ereignisBanner");
  ui.toast = document.getElementById("toastContainer");
  ui.rankContent = document.getElementById("ranglisteInhalt");
  ui.eventOverlay = document.getElementById("eventOverlay");
  ui.prestigeModal = document.getElementById("prestigeConfirmModal");
  ui.pcQP = document.getElementById("pcQP");
}

function setupDynamicUi() {
  const actions = document.querySelector(".aktionen");
  const missionPanel = document.createElement("div");
  missionPanel.className = "rework-panel";
  missionPanel.innerHTML = `
    <div class="rework-head">
      <strong>Missionen</strong>
      <span class="upgrade-text" id="missionRefreshInfo">Neu in 30:00</span>
    </div>
    <div id="missionList"></div>
  `;
  actions.appendChild(missionPanel);
  ui.missionList = document.getElementById("missionList");

  const ev = document.createElement("div");
  ev.id = "eventOverlay";
  ev.className = "modal-hintergrund versteckt";
  ev.innerHTML = `<div class="modal"><h2 id="eventTitle"></h2><p id="eventText"></p><div id="eventChoices" class="event-choices"></div></div>`;
  document.body.appendChild(ev);

  const mut = document.createElement("div");
  mut.id = "mutationChoices";
  mut.className = "mutation-grid";
  document.querySelector(".pc-liste").appendChild(mut);
}

function bindEvents() {
  document.querySelector(".shop-tab[data-tab='gebaeude']").textContent = "🛒 Shop";
  document.querySelector(".shop-tab[data-tab='prestige']").textContent = "🌿 Linienbaum";

  document.querySelectorAll(".shop-tab").forEach((t) => {
    t.addEventListener("click", () => {
      runtime.tab = t.dataset.tab;
      document.querySelectorAll(".shop-tab").forEach((x) => x.classList.toggle("aktiv", x === t));
      ui.shopMain.classList.toggle("versteckt", runtime.tab !== "gebaeude");
      ui.shopUpgrades.classList.toggle("versteckt", runtime.tab !== "upgrades");
      ui.shopLine.classList.toggle("versteckt", runtime.tab !== "prestige");
      const bulk = document.getElementById("bulkLeiste");
      if (bulk) bulk.classList.toggle("versteckt", runtime.tab !== "gebaeude");
      runtime.forceShopRender = true;
    });
  });

  document.querySelectorAll(".bulk-btn").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".bulk-btn").forEach((x) => x.classList.toggle("aktiv", x === b));
      state.economy.bulk = Number(b.dataset.menge);
    });
  });

  ui.canvas.addEventListener("click", handleClick);
  ui.prestigeBtn.addEventListener("click", openPrestigeModal);
  document.getElementById("prestigeConfirmNein").addEventListener("click", () => ui.prestigeModal.classList.add("versteckt"));

  document.getElementById("errungenschaftenBtn").textContent = "📅 Saison";
  document.getElementById("errungenschaftenBtn").addEventListener("click", renderSeasonModal);
  document.getElementById("errungenschaftenSchliessen").addEventListener("click", () => document.getElementById("errungenschaftenModal").classList.add("versteckt"));

  document.getElementById("skinBtn").addEventListener("click", () => {
    renderSkinModal();
    document.getElementById("skinModal").classList.remove("versteckt");
  });
  document.getElementById("skinSchliessen").addEventListener("click", () => document.getElementById("skinModal").classList.add("versteckt"));

  document.getElementById("ranglisteBtn").addEventListener("click", async () => {
    document.getElementById("ranglisteModal").classList.remove("versteckt");
    await renderLeaderboard("pixel");
  });
  document.getElementById("ranglisteSchliessen").addEventListener("click", () => document.getElementById("ranglisteModal").classList.add("versteckt"));
  const tabs = document.querySelector(".rangliste-tabs");
  if (!tabs.querySelector('[data-rl="season"]')) {
    const s = document.createElement("button");
    s.className = "rl-tab";
    s.dataset.rl = "season";
    s.textContent = "Saison";
    tabs.appendChild(s);
  }
  tabs.querySelectorAll(".rl-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabs.querySelectorAll(".rl-tab").forEach((x) => x.classList.toggle("aktiv", x === tab));
      await renderLeaderboard(tab.dataset.rl);
    });
  });
}

function applyDelayedEffectSafe(delayMs, cb) {
  const token = state.session.runToken;
  setTimeout(() => {
    if (state.session.runToken !== token) return;
    cb();
  }, delayMs);
}

function removeGameLoadingOverlay() {
  const overlay = document.getElementById("pz-game-overlay");
  if (overlay) overlay.remove();
}

function frame(ts) {
  if (!runtime.running) return;
  if (!runtime.lastTs) runtime.lastTs = ts;
  const dt = Math.min(0.05, (ts - runtime.lastTs) / 1000);
  runtime.lastTs = ts;

  discoverUnlocks();
  tickEffects();

  addPixels(currentPps() * dt);
  updateMissions();
  maybeSpawnEvent();

  runtime.autosave += dt * 1000;
  if (runtime.autosave >= AUTOSAVE_MS) {
    runtime.autosave = 0;
    saveGame(false, true);
  }

  drawPile();
  renderStats();
  renderMissions();
  maybeRenderShop();

  requestAnimationFrame(frame);
}

async function init() {
  setupDynamicUi();
  bindDom();
  bindEvents();
  const adminTest = new URLSearchParams(location.search).has("admin");
  if (adminTest) {
    Object.assign(state, makeDefaultState());
    state.economy.pixel = 1e15;
    state.economy.lifetimePixel = 1e18;
    state.meta.prestige = 8;
    state.meta.prestigePoints = 120;
    randomMissionSet();
  } else {
    applySkin(state.cosmetics.skin);
    await loadGame();
  }
  applySkin(state.cosmetics.skin);
  recomputeMetaFromLineAndMutations();
  renderStats();
  renderMissions();
  maybeRenderShop();
  drawPile();
  if (!adminTest) maybeRenderTutorial();
  wireAdminPanel();

  runtime.running = true;
  requestAnimationFrame(frame);
  window.addEventListener("beforeunload", () => { state.session.lastSaveAt = Date.now(); });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof PZ !== "undefined" && typeof PZ.updateNavbar === "function") {
      await PZ.updateNavbar();
    }
    await init();
    removeGameLoadingOverlay();
  } catch (err) {
    console.error("[Pixel Factory] Init-Fehler:", err);
    removeGameLoadingOverlay();
    const label = document.getElementById("klickInfo");
    if (label) label.textContent = "Fehler beim Laden - bitte Seite neu laden.";
  }
});
