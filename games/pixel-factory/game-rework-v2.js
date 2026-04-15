// Pixel Factory Rework v3.2
// Fokus: Stabilität, klare UX, echte Entscheidungen, funktionierende Interaktionen.

const GAME_ID = "pixel-factory";
const SAVE_SCHEMA_VERSION = 3;
const AUTOSAVE_MS = 45000;
const BASE_EVENT_INTERVAL_MS = 210000;
const COMBO_WINDOW_MS = 1400;
const MINIGAME_COOLDOWN_MS = 90000;
const PRESTIGE_BASE = 9000;
const PRESTIGE_GROWTH = 1.5;

const BUILDINGS = [
  { id: "worker", name: "Pixel-Arbeiter", icon: "🧑‍🏭", baseCost: 15, growth: 1.12, pps: 0.35, unlockAt: 0 },
  { id: "intern", name: "Praktikant", icon: "🧢", baseCost: 80, growth: 1.13, pps: 1.2, unlockAt: 60 },
  { id: "printer", name: "Nano-Drucker", icon: "🖨️", baseCost: 350, growth: 1.14, pps: 4.4, unlockAt: 180 },
  { id: "assembler", name: "Assembler", icon: "⚙️", baseCost: 1200, growth: 1.15, pps: 13, unlockAt: 700 },
  { id: "robot", name: "Roboterarm", icon: "🤖", baseCost: 4800, growth: 1.16, pps: 40, unlockAt: 2400 },
  { id: "reactor", name: "Fusion-Reaktor", icon: "⚡", baseCost: 18000, growth: 1.17, pps: 140, unlockAt: 9000 },
  { id: "cluster", name: "Chip-Cluster", icon: "🧠", baseCost: 70000, growth: 1.19, pps: 520, unlockAt: 32000 },
  { id: "satellite", name: "Satelliten-Linie", icon: "🛰️", baseCost: 260000, growth: 1.2, pps: 1850, unlockAt: 120000 },
  { id: "quantumCore", name: "Line-Core", icon: "🌀", baseCost: 950000, growth: 1.21, pps: 6200, unlockAt: 460000 },
  { id: "matrix", name: "Matrix-Fabrik", icon: "🏭", baseCost: 4200000, growth: 1.22, pps: 23000, unlockAt: 1900000 },
];

const UPGRADES = [
  { id: "u_click_1", name: "Präzisions-Klick", desc: "+1 Klickkraft", cost: 90, unlockAt: 60, apply: (s) => { s.economy.clickBase += 1; } },
  { id: "u_click_2", name: "Servo-Hand", desc: "Klickkraft x1.5", cost: 600, unlockAt: 300, apply: (s) => { s.economy.clickMult *= 1.5; } },
  { id: "u_click_3", name: "Impuls-Handschuh", desc: "Klickkraft x1.9", cost: 4600, unlockAt: 2500, apply: (s) => { s.economy.clickMult *= 1.9; } },
  { id: "u_prod_1", name: "Schichtplan", desc: "Produktion x1.35", cost: 460, unlockAt: 250, apply: (s) => { s.economy.prodMult *= 1.35; } },
  { id: "u_prod_2", name: "Qualitätskette", desc: "Produktion x1.55", cost: 3100, unlockAt: 1800, apply: (s) => { s.economy.prodMult *= 1.55; } },
  { id: "u_prod_3", name: "Fließband-KI", desc: "Produktion x2.1", cost: 24000, unlockAt: 14000, apply: (s) => { s.economy.prodMult *= 2.1; } },
  { id: "u_combo_1", name: "Flow-Training", desc: "Kombo stärker (+0.1)", cost: 2400, unlockAt: 1100, apply: (s) => { s.economy.comboBonus += 0.1; } },
  { id: "u_combo_2", name: "Flow-Reflex", desc: "Kombo-Fenster +300ms", cost: 12000, unlockAt: 7000, apply: (s) => { s.economy.comboWindowBonus += 300; } },
  { id: "u_offline_1", name: "Nachtprotokoll", desc: "Offline-Effizienz +20%", cost: 18000, unlockAt: 10000, apply: (s) => { s.economy.offlineEff += 0.2; } },
  { id: "u_offline_2", name: "Auto-Schicht", desc: "Offline-Effizienz +35%", cost: 155000, unlockAt: 90000, apply: (s) => { s.economy.offlineEff += 0.35; } },
  { id: "u_event_1", name: "Notfallplan", desc: "Events seltener", cost: 38000, unlockAt: 20000, apply: (s) => { s.meta.eventRateMult *= 0.88; } },
  { id: "u_hybrid", name: "Lean-Core", desc: "Klick + Produktion x1.25", cost: 64000, unlockAt: 34000, apply: (s) => { s.economy.clickMult *= 1.25; s.economy.prodMult *= 1.25; } },
];

const LINE_TREES = {
  speed: [
    { id: "s1", name: "Overclock", desc: "+30% Produktion", max: 3, cost: 1, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.3 * lvl); } },
    { id: "s2", name: "Rausch", desc: "+40% Klickkraft", max: 2, cost: 1, req: "s1", effect: (s, lvl) => { s.meta.lineClickMult *= (1 + 0.4 * lvl); } },
    { id: "s3", name: "Instabil", desc: "Events +20%, aber +50% Produktion", max: 2, cost: 1, req: "s1", effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.5 * lvl); s.meta.eventRateMult *= (1 + 0.2 * lvl); } },
    { id: "s4", name: "Hyperline", desc: "+80% Produktion", max: 1, cost: 2, req: "s3", effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.8 * lvl); } },
  ],
  efficiency: [
    { id: "e1", name: "Stabilität", desc: "Events -18%", max: 3, cost: 1, effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.18 * lvl); } },
    { id: "e2", name: "Saubere Linie", desc: "+22% Produktion", max: 3, cost: 1, req: "e1", effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.22 * lvl); } },
    { id: "e3", name: "Präzision", desc: "+25% Klickkraft", max: 2, cost: 1, req: "e1", effect: (s, lvl) => { s.meta.lineClickMult *= (1 + 0.25 * lvl); } },
    { id: "e4", name: "Null-Verlust", desc: "Offline +60%", max: 1, cost: 2, req: "e2", effect: (s, lvl) => { s.economy.offlineEff += 0.6 * lvl; } },
  ],
  automation: [
    { id: "a1", name: "Auto-Roboter", desc: "+35% Produktion", max: 3, cost: 1, effect: (s, lvl) => { s.meta.lineProdMult *= (1 + 0.35 * lvl); } },
    { id: "a2", name: "Ghost-Shift", desc: "Offline +35%", max: 3, cost: 1, req: "a1", effect: (s, lvl) => { s.economy.offlineEff += 0.35 * lvl; } },
    { id: "a3", name: "Predictive AI", desc: "Minigame-Bonus +25%", max: 2, cost: 1, req: "a1", effect: (s, lvl) => { s.meta.minigameMult *= (1 + 0.25 * lvl); } },
    { id: "a4", name: "Autopilot", desc: "Events -20%, Klick -15%", max: 1, cost: 2, req: "a2", effect: (s, lvl) => { s.meta.eventRateMult *= (1 - 0.2 * lvl); s.meta.lineClickMult *= (1 - 0.15 * lvl); } },
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
  { id: "m_prod_short", type: "produce", name: "Schichtziel", desc: "Produziere {target} Pixel", baseTarget: 5000, reward: { pixel: 2500, season: 10 } },
  { id: "m_prod_long", type: "produce", name: "Fokuslauf", desc: "Produziere {target} Pixel", baseTarget: 22000, reward: { pixel: 14000, season: 20 } },
  { id: "m_click", type: "clicks", name: "Handarbeit", desc: "Mache {target} Klicks", baseTarget: 140, reward: { pixel: 7000, season: 14, timedClick: 1.35 } },
  { id: "m_event", type: "events", name: "Krisenmanager", desc: "Löse {target} Events", baseTarget: 2, reward: { season: 30 } },
  { id: "m_mini", type: "minigame", name: "Arcade-Shift", desc: "Gewinne {target} Minigames", baseTarget: 1, reward: { season: 26, timedProd: 1.35 } },
];

const state = makeDefaultState();
const runtime = {
  running: false,
  lastTs: 0,
  autosave: 0,
  tab: "shop",
  rerollCdUntil: 0,
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
      minigameMult: 1,
      missionRewardMult: 1,
      prestigeThresholdMult: 1,
      eventPenaltyMult: 1,
    },
    session: {
      runToken: Date.now(),
      producedRun: 0,
      clicksRun: 0,
      eventsSolved: 0,
      minigameWins: 0,
      missions: [],
      activeEffects: [],
      activeEvent: null,
      nextEventAt: Date.now() + BASE_EVENT_INTERVAL_MS,
      comboCount: 0,
      comboUntil: 0,
      minigameCooldownUntil: 0,
      minigame: null,
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
  const base = 1 + Math.min(1.5, state.session.comboCount * (0.03 + state.economy.comboBonus));
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
  return state.economy.clickBase
    * state.economy.clickMult
    * state.meta.lineClickMult
    * state.meta.mutationClickMult
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
  return Math.floor(base * (1 + p * 0.45));
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
  state.meta.minigameMult = 1;
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
}

function missionProgress(m) {
  if (m.type === "produce") return state.session.producedRun;
  if (m.type === "clicks") return state.session.clicksRun;
  if (m.type === "events") return state.session.eventsSolved;
  if (m.type === "minigame") return state.session.minigameWins;
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

function randomMinigameType() {
  const all = ["timing", "rapid", "pick"];
  return all[Math.floor(Math.random() * all.length)];
}

function startMinigame() {
  if (Date.now() < state.session.minigameCooldownUntil) {
    const sec = Math.ceil((state.session.minigameCooldownUntil - Date.now()) / 1000);
    toast(`Minigame Cooldown: ${sec}s`);
    return;
  }
  const type = randomMinigameType();
  state.session.minigame = {
    type,
    startedAt: Date.now(),
    marker: 0.08,
    dir: 1,
    taps: 0,
    pickGood: Math.floor(Math.random() * 3) + 1,
  };
  renderMinigame(type);
  ui.minigameOverlay.classList.remove("versteckt");
}

function finishMinigame(score01, reason) {
  const mult = (1 + score01 * 1.2) * state.meta.minigameMult;
  const sec = Math.floor(18 + score01 * 40);
  addTimed(state, "prod", mult, sec, `Minigame: ${reason}`);
  if (score01 >= 0.55) {
    state.session.minigameWins += 1;
    addSeasonPoints(Math.floor(10 + score01 * 16), "Minigame");
  }
  state.session.minigameCooldownUntil = Date.now() + MINIGAME_COOLDOWN_MS;
  state.session.minigame = null;
  ui.minigameOverlay.classList.add("versteckt");
  updateMissions();
}

function runTimingTick(dt) {
  const m = state.session.minigame;
  if (!m || m.type !== "timing") return;
  m.marker += m.dir * dt * 1.0;
  if (m.marker >= 1) { m.marker = 1; m.dir = -1; }
  if (m.marker <= 0) { m.marker = 0; m.dir = 1; }
  const marker = document.getElementById("miniMarker");
  if (marker) marker.style.left = `${m.marker * 100}%`;
}

function stopTiming() {
  const m = state.session.minigame;
  if (!m || m.type !== "timing") return;
  const dist = Math.abs(0.5 - m.marker);
  const score = Math.max(0, 1 - dist * 2);
  finishMinigame(score, "Kalibrierung");
}

function rapidTap() {
  const m = state.session.minigame;
  if (!m || m.type !== "rapid") return;
  m.taps += 1;
  const info = document.getElementById("miniRapidInfo");
  if (info) info.textContent = `Taps: ${m.taps}/24`;
}

function finishRapid() {
  const m = state.session.minigame;
  if (!m || m.type !== "rapid") return;
  const score = Math.min(1, m.taps / 24);
  finishMinigame(score, "Rapid Tap");
}

function pickDoor(n) {
  const m = state.session.minigame;
  if (!m || m.type !== "pick") return;
  const score = n === m.pickGood ? 1 : 0.35;
  finishMinigame(score, "Door Pick");
}

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

async function saveGame(withToast = false) {
  if (location.search.includes("admin=1")) return;
  const user = await PZ.getUser();
  if (!user) return;
  state.session.lastSaveAt = Date.now();
  const payload = deepClone(state);
  await PZ.saveGameData(GAME_ID, Math.floor(state.economy.lifetimePixel), state.meta.prestige, payload);
  if (withToast) toast("Gespeichert");
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
  const radius = 42 + stage * 92;
  const glow = 0.2 + stage * 0.65;
  const hue = 212 + Math.floor(stage * 70);

  ctx.save();
  ctx.translate(w / 2, h / 2 + 14);
  ctx.fillStyle = `rgba(40,80,180,${glow})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 18, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 130; i += 1) {
    const a = (Math.PI * 2 * i) / 130;
    const r = Math.random() * radius;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * 0.62;
    const size = 2 + Math.random() * (2 + stage * 4);
    ctx.fillStyle = `hsla(${hue + Math.random() * 24},85%,${56 + Math.random() * 20}%,0.88)`;
    ctx.fillRect(x, y, size, size);
  }
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

function renderShopCards() {
  ui.shopMain.innerHTML = BUILDINGS.map((b) => {
    const discovered = !!state.session.discoveredBuildings[b.id];
    if (!discovered) {
      return `
        <button class="upgrade-eintrag gesperrt" disabled>
          <div class="upgrade-name">???</div>
          <div class="upgrade-text">Noch nicht entdeckt</div>
          <div class="upgrade-preis">???</div>
        </button>
      `;
    }
    const can = canBuyBuildingAmount(b, state.economy.bulk === 0 ? 1 : state.economy.bulk) > 0;
    const cost = buildingCost(b, 0);
    return `
      <button class="upgrade-eintrag ${can ? "leistbar" : "zu-teuer"}" data-buy-building="${b.id}">
        <div class="upgrade-name">${b.icon} ${b.name} <small>x${state.economy.buildings[b.id]}</small></div>
        <div class="upgrade-text">+${fmtPps(b.pps)} PPS</div>
        <div class="upgrade-preis">${fmtNumber(cost)} Pixel</div>
      </button>
    `;
  }).join("");

  ui.shopMain.querySelectorAll("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => buyBuilding(btn.dataset.buyBuilding));
  });
}

function renderUpgradeCards() {
  const lineButtons = `
    <div class="path-grid">
      ${Object.keys(LINE_TREES).map((line) => `
        <button class="path-card ${state.meta.selectedLine === line ? "aktiv" : ""}" data-line-pick="${line}">
          <strong>${line.toUpperCase()}-Line ${state.meta.selectedLine === line ? "(Aktiv)" : ""}</strong>
          <span>${line === "speed" ? "Offensiv, riskanter" : line === "efficiency" ? "Stabil, kontrolliert" : "Offline/Automatisierung"}</span>
        </button>
      `).join("")}
    </div>
    <div class="upgrade-text">Linie kann nur nach Prestige neu gewählt werden.</div>
  `;

  const upgrades = UPGRADES.map((u) => {
    const discovered = !!state.session.discoveredUpgrades[u.id];
    if (!discovered) {
      return `
        <button class="upgrade-eintrag gesperrt" disabled>
          <div class="upgrade-name">???</div>
          <div class="upgrade-text">Noch nicht entdeckt</div>
          <div class="upgrade-preis">???</div>
        </button>
      `;
    }
    const bought = state.economy.boughtUpgrades.includes(u.id);
    const can = !bought && state.economy.pixel >= u.cost;
    return `
      <button class="upgrade-eintrag ${bought ? "gesperrt" : (can ? "leistbar" : "zu-teuer")}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
        <div class="upgrade-name">${u.name}</div>
        <div class="upgrade-text">${u.desc}</div>
        <div class="upgrade-preis">${bought ? "Gekauft" : `${fmtNumber(u.cost)} Pixel`}</div>
      </button>
    `;
  }).join("");

  ui.shopUpgrades.innerHTML = `${lineButtons}<div class="upgrade-list">${upgrades}</div>`;
  ui.shopUpgrades.querySelectorAll("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => buyUpgrade(btn.dataset.buyUpgrade));
  });
  ui.shopUpgrades.querySelectorAll("[data-line-pick]").forEach((btn) => {
    btn.addEventListener("click", () => selectLine(btn.dataset.linePick));
  });
}

function renderLineTree() {
  const line = state.meta.selectedLine;
  if (!line) {
    ui.shopLine.innerHTML = `
      <div class="rework-panel">
        <strong>Kein Baum aktiv</strong>
        <div class="upgrade-text">Wähle zuerst eine Line im Upgrade-Tab.</div>
      </div>
    `;
    return;
  }
  const nodes = LINE_TREES[line].map((n) => {
    const lvl = levelOfNode(line, n.id);
    const can = canUpgradeLineNode(line, n);
    const reqTxt = n.req ? ` · Benötigt ${n.req}` : "";
    return `
      <button class="upgrade-eintrag ${can ? "leistbar" : "zu-teuer"} ${lvl >= n.max ? "gesperrt" : ""}" data-line-node="${n.id}" ${lvl >= n.max ? "disabled" : ""}>
        <div class="upgrade-name">${n.name} <small>${lvl}/${n.max}</small></div>
        <div class="upgrade-text">${n.desc}${reqTxt}</div>
        <div class="upgrade-preis">${n.cost} Prestigepunkt(e)</div>
      </button>
    `;
  }).join("");
  ui.shopLine.innerHTML = `
    <div class="rework-panel">
      <div><strong>Aktive Line:</strong> ${line.toUpperCase()}</div>
      <div><strong>Prestigepunkte:</strong> ${state.meta.prestigePoints}</div>
      <div class="upgrade-text">Hier investierst du Prestigepunkte in deinen Linien-Baum.</div>
    </div>
    <div class="upgrade-list">${nodes}</div>
  `;
  ui.shopLine.querySelectorAll("[data-line-node]").forEach((btn) => {
    btn.addEventListener("click", () => upgradeLineNode(line, btn.dataset.lineNode));
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

function renderMinigame(type) {
  const body = document.getElementById("miniBody");
  if (type === "timing") {
    body.innerHTML = `
      <h2>Kalibrierung</h2>
      <p>Stoppe den Marker möglichst in der Mitte.</p>
      <div class="mini-bar"><div id="miniMarker"></div><div class="mini-center"></div></div>
      <button id="miniTimingStop" class="btn-aktion">Stoppen</button>
    `;
    document.getElementById("miniTimingStop").addEventListener("click", stopTiming);
    return;
  }
  if (type === "rapid") {
    body.innerHTML = `
      <h2>Rapid Tap</h2>
      <p>Klicke in 8 Sekunden so oft wie möglich (Ziel 24).</p>
      <div id="miniRapidInfo" class="upgrade-text">Taps: 0/24</div>
      <button id="miniRapidTap" class="btn-aktion">Tap!</button>
    `;
    document.getElementById("miniRapidTap").addEventListener("click", rapidTap);
    setTimeout(() => {
      if (state.session.minigame && state.session.minigame.type === "rapid") finishRapid();
    }, 8000);
    return;
  }
  body.innerHTML = `
    <h2>Door Pick</h2>
    <p>Wähle eine Tür. Eine hat den Jackpot.</p>
    <div class="event-choices">
      <button class="btn-aktion" data-door="1">Tür 1</button>
      <button class="btn-aktion" data-door="2">Tür 2</button>
      <button class="btn-aktion" data-door="3">Tür 3</button>
    </div>
  `;
  body.querySelectorAll("[data-door]").forEach((btn) => btn.addEventListener("click", () => pickDoor(Number(btn.dataset.door))));
}

async function renderLeaderboard(mode) {
  const rows = await PZ.getLeaderboard(GAME_ID, 60);
  const filtered = rows.filter((r) => r.extra_daten?.schemaVersion === SAVE_SCHEMA_VERSION);
  let sorted = [...filtered];
  if (mode === "prestige") sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
  else if (mode === "season") sorted.sort((a, b) => (b.extra_daten?.meta?.seasonPoints || 0) - (a.extra_daten?.meta?.seasonPoints || 0));
  else sorted.sort((a, b) => (b.punkte || 0) - (a.punkte || 0));

  if (sorted.length === 0) {
    ui.rankContent.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-muted)">Noch keine Rework-v3 Einträge.</div>`;
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
  document.getElementById("errungenschaftenGrid").innerHTML = `
    <div class="rework-panel">
      <div><strong>Saisonpunkte:</strong> ${state.meta.seasonPoints}</div>
      <div><strong>Saison-Level:</strong> ${lvl}</div>
      <div><strong>Fortschritt:</strong> ${nextDiff <= 0 ? "Tier bereit!" : `${nextDiff} Punkte bis Tier ${lvl + 1}`}</div>
      <div class="upgrade-text">${reward}</div>
      <hr style="margin:10px 0;border:none;border-top:1px solid var(--border);" />
      <div class="upgrade-text">Saison bringt dir langfristige Run-Boni und Ranglisten-Fortschritt. Punkte bekommst du über Missionen, Events und Minigames.</div>
    </div>
  `;
  document.getElementById("errungenschaftenModal").classList.remove("versteckt");
}

const SKINS = [
  { id: "default", name: "Standard", vars: { "--primary": "#3a86ff", "--bg": "#f0f7ff", "--surface": "#ffffff", "--text": "#1e293b", "--border": "#dde6f5" } },
  { id: "sunny", name: "Sonnig", vars: { "--primary": "#f59e0b", "--bg": "#fff7ed", "--surface": "#fffaf0", "--text": "#7c2d12", "--border": "#fed7aa" } },
  { id: "mint", name: "Mint", vars: { "--primary": "#10b981", "--bg": "#ecfdf5", "--surface": "#ffffff", "--text": "#14532d", "--border": "#bbf7d0" } },
  { id: "violet", name: "Violett", vars: { "--primary": "#8b5cf6", "--bg": "#f5f3ff", "--surface": "#ffffff", "--text": "#312e81", "--border": "#ddd6fe" } },
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

function handleClick() {
  addPixels(currentPpk());
  state.session.clicksRun += 1;
  const now = Date.now();
  const win = COMBO_WINDOW_MS + state.economy.comboWindowBonus;
  if (now <= state.session.comboUntil) state.session.comboCount += 1;
  else state.session.comboCount = 1;
  state.session.comboUntil = now + win;
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
    { icon: "🎮", title: "Minigames & Saison", text: "Mehrere Minigames geben starke Burst-Boni. Saisonpunkte bringen Fortschritt und Rangliste." },
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
  ui.minigameOverlay = document.getElementById("minigameOverlay");
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
      <button id="missionRerollBtn" class="btn-aktion btn-klein">Neu würfeln</button>
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

  const mg = document.createElement("div");
  mg.id = "minigameOverlay";
  mg.className = "modal-hintergrund versteckt";
  mg.innerHTML = `<div class="modal" id="miniBody"></div>`;
  document.body.appendChild(mg);

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

  document.getElementById("missionRerollBtn").addEventListener("click", () => {
    if (Date.now() < runtime.rerollCdUntil) return toast("Reroll noch im Cooldown.");
    runtime.rerollCdUntil = Date.now() + 35000;
    randomMissionSet();
    renderMissions();
  });

  document.getElementById("talentBtn").textContent = "🎮 Minigames";
  document.getElementById("talentBtn").addEventListener("click", startMinigame);

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
  runTimingTick(dt);

  addPixels(currentPps() * dt);
  updateMissions();
  maybeSpawnEvent();

  runtime.autosave += dt * 1000;
  if (runtime.autosave >= AUTOSAVE_MS) {
    runtime.autosave = 0;
    saveGame(false);
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
  applySkin(state.cosmetics.skin);
  await loadGame();
  applySkin(state.cosmetics.skin);
  recomputeMetaFromLineAndMutations();
  renderStats();
  renderMissions();
  maybeRenderShop();
  drawPile();
  maybeRenderTutorial();

  runtime.running = true;
  requestAnimationFrame(frame);
  setInterval(() => saveGame(false), 120000);
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
