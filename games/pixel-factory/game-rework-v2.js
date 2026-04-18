// Pixel Factory Rework v3.5
// Shop: Gebäude + Dauer-Upgrades in einem Panel; 100 Errungenschaften mit sichtbaren Bedingungen.

const GAME_ID = "pixel-factory";
const SAVE_SCHEMA_VERSION = 6;
const AUTOSAVE_MS = 10000;
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

/** Additiv zu Gebäude-PPS (linkes Spalten-Upgrade-Shop). */
const PPS_SHOP_UPGRADES = [
  { id: "ps_1", name: "Schichtplan", desc: "+18 px/s", pps: 18, cost: 580, unlockAt: 280 },
  { id: "ps_2", name: "Qualitätskette", desc: "+85 px/s", pps: 85, cost: 4800, unlockAt: 2600 },
  { id: "ps_3", name: "Fließband-KI", desc: "+420 px/s", pps: 420, cost: 39500, unlockAt: 20000 },
  { id: "ps_4", name: "Takt-Optimierung", desc: "+3.800 px/s", pps: 3800, cost: 365000, unlockAt: 180000 },
  { id: "ps_5", name: "Parallel-Layer", desc: "+32.000 px/s", pps: 32000, cost: 2950000, unlockAt: 1900000 },
];

/** Additiv zur Klickkraft (rechtes Spalten-Shop), nur Addition – kein Multiplikator. */
const PPC_SHOP_UPGRADES = [
  { id: "pc_1", name: "Präzisions-Klick", desc: "+3 Klickkraft", click: 3, cost: 52, unlockAt: 32 },
  { id: "pc_2", name: "Servo-Hand", desc: "+22 Klickkraft", click: 22, cost: 420, unlockAt: 200 },
  { id: "pc_3", name: "Impuls-Handschuh", desc: "+180 Klickkraft", click: 180, cost: 3200, unlockAt: 1500 },
  { id: "pc_4", name: "Hyperfinger", desc: "+1.200 Klickkraft", click: 1200, cost: 22000, unlockAt: 10000 },
  { id: "pc_5", name: "Neural-Link", desc: "+9.500 Klickkraft", click: 9500, cost: 195000, unlockAt: 120000 },
];

const SHOP_UPGRADES_ALL = [...PPS_SHOP_UPGRADES, ...PPC_SHOP_UPGRADES];

/** Leichter PPC-Bonus auf Tablet/iPad – aktives Tippen soll sich lohnen. */
function ipadTouchPpcBonus() {
  if (typeof window.matchMedia !== "function") return 1;
  const narrow = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (narrow && coarse) return 1.09;
  if (narrow) return 1.05;
  return 1;
}

const MISSIONS = [
  { id: "m_prod_short", type: "produce", name: "Schichtziel", desc: "Produziere {target} Pixel", baseTarget: 24000, reward: { pixel: 9000 } },
  { id: "m_prod_long", type: "produce", name: "Fokuslauf", desc: "Produziere {target} Pixel", baseTarget: 140000, reward: { pixel: 65000 } },
  { id: "m_click", type: "clicks", name: "Handarbeit", desc: "Mache {target} Klicks", baseTarget: 380, reward: { pixel: 18000, timedClick: 1.55 } },
  { id: "m_combo", type: "combo", name: "Flow-Kette", desc: "Erreiche eine Kombo von {target}", baseTarget: 20, reward: { pixel: 12000, timedProd: 1.45 } },
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
  tab: "gebaeude",
  forceShopRender: true,
  nextShopRenderAt: 0,
  achCheckAcc: 0,
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
      ppsBonusFlat: 0,
      clickBonusFlat: 0,
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
      achievementsUnlocked: [],
      track: {
        maxLifetimePixelEver: 0,
        totalClicksEver: 0,
        totalMissionsEver: 0,
        maxComboEver: 0,
      },
    },
    session: {
      runToken: Date.now(),
      producedRun: 0,
      clicksRun: 0,
      maxCombo: 0,
      missions: [],
      activeEffects: [],
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

/** 100 Erfolge mit sichtbarer Bedingung im Modal. */
function buildAchievements() {
  const list = [];

  const LP = [
    100, 400, 1500, 6000, 20000, 50000, 120000, 300000, 750000, 2e6, 5e6, 12e6, 30e6, 75e6, 180e6, 450e6, 1.1e9, 2.8e9, 7e9, 18e9, 45e9, 110e9, 280e9, 700e9, 1.8e12,
  ];
  LP.forEach((t, i) => {
    list.push({
      id: `ach_lp_${i}`,
      title: `Pixel-Bestand ${i + 1}`,
      desc: `Erreiche mindestens ${fmtNumber(t)} Pixel in einem Durchgang (höchster Stand zählt).`,
      check: () => (state.meta.track?.maxLifetimePixelEver || 0) >= t,
    });
  });

  for (let p = 1; p <= 15; p += 1) {
    list.push({
      id: `ach_pr_${p}`,
      title: `Prestige ${p}`,
      desc: `Führe mindestens ${p} Prestige durch (Prestige-Stufe ≥ ${p}).`,
      check: () => state.meta.prestige >= p,
    });
  }

  const CL = [5, 15, 40, 100, 250, 600, 1200, 2500, 5000, 12000, 25000, 50000, 100000, 200000, 400000];
  CL.forEach((t, i) => {
    list.push({
      id: `ach_cl_${i}`,
      title: `Klick-Serie ${i + 1}`,
      desc: `Führe insgesamt ${fmtNumber(t)} Klicks auf den Pixelhaufen aus (über alle Durchgänge).`,
      check: () => (state.meta.track?.totalClicksEver || 0) >= t,
    });
  });

  const CB = [3, 6, 10, 15, 22, 30, 40, 55, 75, 100];
  CB.forEach((t, i) => {
    list.push({
      id: `ach_cb_${i}`,
      title: `Kombo-Stufe ${i + 1}`,
      desc: `Erreiche eine Kombo von mindestens ${t}.`,
      check: () => (state.meta.track?.maxComboEver || 0) >= t,
    });
  });

  const MS = [1, 3, 8, 15, 25, 40, 60, 85, 120, 200];
  MS.forEach((t, i) => {
    list.push({
      id: `ach_ms_${i}`,
      title: `Missionen ${i + 1}`,
      desc: `Schließe insgesamt ${t} Missionen ab.`,
      check: () => (state.meta.track?.totalMissionsEver || 0) >= t,
    });
  });

  BUILDINGS.forEach((b) => {
    list.push({
      id: `ach_own_${b.id}`,
      title: `Fabrik: ${b.name}`,
      desc: `Besitze mindestens 1× „${b.name}“.`,
      check: () => (state.economy.buildings[b.id] || 0) >= 1,
    });
  });

  const BT = [5, 20, 50, 100, 250, 500, 1000];
  BT.forEach((t, i) => {
    list.push({
      id: `ach_bt_${i}`,
      title: `Großbetrieb ${i + 1}`,
      desc: `Besitze mindestens ${t} Gebäude insgesamt (alle Typen addiert).`,
      check: () => {
        let n = 0;
        for (const b of BUILDINGS) n += state.economy.buildings[b.id] || 0;
        return n >= t;
      },
    });
  });

  list.push(
    {
      id: "ach_up_all",
      title: "Volle Aufrüstung",
      desc: `Kaufe alle ${SHOP_UPGRADES_ALL.length} Dauer-Upgrades (PPS + Klick) im Shop.`,
      check: () => state.economy.boughtUpgrades.length >= SHOP_UPGRADES_ALL.length,
    },
    {
      id: "ach_prestige_once",
      title: "Neuanfang",
      desc: "Führe mindestens ein Prestige durch.",
      check: () => state.meta.prestige >= 1,
    },
    {
      id: "ach_qp",
      title: "Prestigepunkte-Sammler",
      desc: "Besitze mindestens 8 Prestigepunkte gleichzeitig.",
      check: () => state.meta.prestigePoints >= 8,
    },
    {
      id: "ach_pps_high",
      title: "Durchsatz-Profi",
      desc: "Erreiche mindestens 100.000 px/s Produktion (Gebäude + flache Boni, ohne zeitliche Booster).",
      check: () => {
        let pps = state.economy.ppsBonusFlat || 0;
        for (const b of BUILDINGS) pps += (state.economy.buildings[b.id] || 0) * b.pps;
        return pps >= 100000;
      },
    },
    {
      id: "ach_bank",
      title: "Volle Kassen",
      desc: "Halte mindestens 50.000.000 Pixel gleichzeitig auf dem Konto.",
      check: () => state.economy.pixel >= 50_000_000,
    },
  );

  return list;
}

const ACHIEVEMENTS = buildAchievements();
if (ACHIEVEMENTS.length !== 100) {
  console.warn("[Pixel Factory] Erwartet 100 Errungenschaften, ist:", ACHIEVEMENTS.length);
}

/** Kombo: fest ×2 solange das Zeitfenster läuft (nicht höher). Beispiel: 5 Pixel Basis → 10 Pixel pro Klick. */
function getComboMult() {
  if (Date.now() > state.session.comboUntil) return 1;
  return 2;
}

function activeMult(key) {
  let m = 1;
  for (const e of state.session.activeEffects) {
    if (e.key === key) m *= e.mult;
  }
  return m;
}

function currentPps() {
  let pps = state.economy.ppsBonusFlat || 0;
  for (const b of BUILDINGS) pps += (state.economy.buildings[b.id] || 0) * b.pps;
  return pps * activeMult("prod");
}

function currentPpk() {
  let progressClickBoost =
    1
    + Math.log10(state.economy.lifetimePixel + 10) * 0.4
    + state.meta.prestige * 0.2;

  // Early/Midgame: Klick soll ~10–20 % der Gesamt-„Feel“-Produktion liefern (bei ~5–8 Klicks/s + Kombo).
  if (state.economy.lifetimePixel < 50_000) progressClickBoost *= 1.85;
  else if (state.economy.lifetimePixel < 2_000_000) progressClickBoost *= 1.5;
  else if (state.economy.lifetimePixel < 80_000_000) progressClickBoost *= 1.22;

  const clickFlat = (state.economy.clickBase || 1) + (state.economy.clickBonusFlat || 0);
  return clickFlat
    * progressClickBoost
    * getComboMult()
    * activeMult("click")
    * ipadTouchPpcBonus();
}

function prestigeThreshold() {
  return Math.floor(PRESTIGE_BASE * Math.pow(PRESTIGE_GROWTH, state.meta.prestige));
}

function missionScaledTarget(base) {
  const p = state.meta.prestige;
  return Math.floor(base * (1 + p * 0.7));
}

function missionRewardScaled(v) {
  return Math.floor(v * (1 + state.meta.prestige * 0.3) * activeMult("missionReward"));
}

function addPixels(amount, reason = "") {
  if (amount <= 0) return;
  state.economy.pixel += amount;
  state.economy.lifetimePixel += amount;
  state.session.producedRun += amount;
  if (reason) toast(`+${fmtNumber(amount)} Pixel · ${reason}`);
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
  for (const u of SHOP_UPGRADES_ALL) {
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

function buyShopUpgrade(id) {
  const u = SHOP_UPGRADES_ALL.find((x) => x.id === id);
  if (!u || !state.session.discoveredUpgrades[id]) return;
  if (state.economy.boughtUpgrades.includes(id)) return;
  if (state.economy.pixel < u.cost) return;
  state.economy.pixel -= u.cost;
  state.economy.boughtUpgrades.push(id);
  recomputeUpgradeBonuses();
  runtime.forceShopRender = true;
  renderStats();
}

function recomputeUpgradeBonuses() {
  let pps = 0;
  let clk = 0;
  for (const id of state.economy.boughtUpgrades) {
    const p = PPS_SHOP_UPGRADES.find((x) => x.id === id);
    if (p) pps += p.pps;
    const c = PPC_SHOP_UPGRADES.find((x) => x.id === id);
    if (c) clk += c.click;
  }
  state.economy.ppsBonusFlat = pps;
  state.economy.clickBonusFlat = clk;
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
  if (m.type === "combo") return state.session.maxCombo;
  return 0;
}

function completeMission(m) {
  m.done = true;
  state.meta.track = state.meta.track || {};
  state.meta.track.totalMissionsEver = (state.meta.track.totalMissionsEver || 0) + 1;
  if (m.reward.pixel) addPixels(missionRewardScaled(m.reward.pixel), "Mission");
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

// Minigames wurden bewusst entfernt.

function calcPrestigeGain() {
  return 1;
}

function spawnPrestigeModalConfetti() {
  const c = document.getElementById("prestigeModalConfetti");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  const rect = c.getBoundingClientRect();
  const w = (c.width = Math.max(320, rect.width || 380));
  const h = (c.height = Math.max(200, rect.height || 260));
  const parts = [];
  for (let i = 0; i < 96; i++) {
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * 60,
      y: h * 0.15 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 9 - 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      col: ["#c4b5fd", "#fcd34d", "#93c5fd", "#6ee7b7", "#f9a8d4"][i % 5],
      s: 3 + Math.random() * 7,
    });
  }
  let frame = 0;
  function step() {
    frame += 1;
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42;
      p.rot += p.vr;
      if (p.y < h + 24) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.55);
      ctx.restore();
    }
    if (alive && frame < 100) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const TUTORIAL_LS_KEY = "pf_pixel_factory_rework_tutorial_done";

function syncTutorialSkipFromState() {
  try {
    if (state.meta.prestige > 0 || state.meta.prestigePoints > 0) {
      localStorage.setItem(TUTORIAL_LS_KEY, "1");
    }
  } catch (_) {
    /* ignore */
  }
}

function shouldShowTutorial() {
  try {
    if (localStorage.getItem(TUTORIAL_LS_KEY) === "1") return false;
  } catch (_) {
    /* ignore */
  }
  if (state.meta.prestige > 0) return false;
  if (state.meta.prestigePoints > 0) return false;
  return true;
}

function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_LS_KEY, "1");
  } catch (_) {
    /* ignore */
  }
}

function openPrestigeModal() {
  if (state.economy.lifetimePixel < prestigeThreshold()) return;
  ui.pcQP.textContent = `+${calcPrestigeGain()} Prestigepunkt`;
  ui.prestigeModal.classList.remove("versteckt");
  requestAnimationFrame(() => spawnPrestigeModalConfetti());
}

function doPrestige() {
  if (state.economy.lifetimePixel < prestigeThreshold()) return;
  state.meta.prestige += 1;
  state.meta.prestigePoints += calcPrestigeGain();

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
  recomputeUpgradeBonuses();
  ui.prestigeModal.classList.add("versteckt");
  runtime.forceShopRender = true;
  renderStats();
  renderMissions();
  toast(`Prestige ${state.meta.prestige} · +1 Prestigepunkt`);
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

/** Übernimmt ältere Save-Versionen (v3/v4/v5…) in das aktuelle Schema v6. */
function migrateSaveToCurrent(raw) {
  const fresh = makeDefaultState();
  const e = raw.economy || {};
  const boughtKnown = Array.isArray(e.boughtUpgrades)
    ? e.boughtUpgrades.filter((id) => SHOP_UPGRADES_ALL.some((u) => u.id === id))
    : [];
  const achIds = new Set((ACHIEVEMENTS || []).map((a) => a.id));
  const achRaw = Array.isArray(raw.meta?.achievementsUnlocked) ? raw.meta.achievementsUnlocked : [];
  const achievementsUnlocked = achRaw.filter((id) => achIds.has(id));
  const tr = raw.meta?.track || {};
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      ...fresh.economy,
      pixel: Number(e.pixel) || 0,
      lifetimePixel: Number(e.lifetimePixel) || 0,
      clickBase: Number(e.clickBase) || 1,
      buildings: { ...fresh.economy.buildings, ...(e.buildings || {}) },
      boughtUpgrades: boughtKnown,
      bulk: Number(e.bulk) || 1,
      discountBuys: Number(e.discountBuys) || 0,
      comboBonus: Number(e.comboBonus) || 0,
      comboWindowBonus: Number(e.comboWindowBonus) || 0,
      offlineEff: Number.isFinite(Number(e.offlineEff)) ? Number(e.offlineEff) : 0.3,
    },
    meta: {
      prestige: Math.max(0, Math.floor(Number(raw.meta?.prestige) || 0)),
      prestigePoints: Math.max(0, Math.floor(Number(raw.meta?.prestigePoints) || 0)),
      achievementsUnlocked,
      track: {
        maxLifetimePixelEver: Math.max(0, Number(tr.maxLifetimePixelEver) || 0),
        totalClicksEver: Math.max(0, Number(tr.totalClicksEver) || 0),
        totalMissionsEver: Math.max(0, Number(tr.totalMissionsEver) || 0),
        maxComboEver: Math.max(0, Number(tr.maxComboEver) || 0),
      },
    },
    session: {
      ...fresh.session,
      runToken: Date.now(),
      producedRun: Number(raw.session?.producedRun) || 0,
      clicksRun: Number(raw.session?.clicksRun) || 0,
      maxCombo: Number(raw.session?.maxCombo) || 0,
      missions: Array.isArray(raw.session?.missions) ? raw.session.missions : fresh.session.missions,
      nextMissionRefreshAt: Number(raw.session?.nextMissionRefreshAt) || fresh.session.nextMissionRefreshAt,
      activeEffects: [],
      discoveredBuildings: { ...fresh.session.discoveredBuildings, ...(raw.session?.discoveredBuildings || {}) },
      discoveredUpgrades: { ...fresh.session.discoveredUpgrades, ...(raw.session?.discoveredUpgrades || {}) },
      lastSaveAt: Number(raw.session?.lastSaveAt) || 0,
    },
    cosmetics: { ...fresh.cosmetics, ...(raw.cosmetics || {}) },
  };
}

async function loadGame() {
  const data = await PZ.loadScore(GAME_ID);
  if (!data || !data.extra_daten) {
    randomMissionSet();
    return;
  }

  const migrated = migrateSaveToCurrent(data.extra_daten);
  const fresh = makeDefaultState();
  state.economy = {
    ...fresh.economy,
    ...migrated.economy,
    buildings: {
      ...fresh.economy.buildings,
      ...migrated.economy.buildings,
    },
  };
  state.meta = { ...fresh.meta, ...migrated.meta };
  state.session = {
    ...fresh.session,
    ...migrated.session,
    discoveredBuildings: {
      ...fresh.session.discoveredBuildings,
      ...migrated.session.discoveredBuildings,
    },
    discoveredUpgrades: {
      ...fresh.session.discoveredUpgrades,
      ...migrated.session.discoveredUpgrades,
    },
  };
  state.cosmetics = { ...fresh.cosmetics, ...migrated.cosmetics };
  state.schemaVersion = SAVE_SCHEMA_VERSION;

  if (!Array.isArray(state.session.missions) || state.session.missions.length === 0) randomMissionSet();
  if (state.session.nextMissionRefreshAt < Date.now()) randomMissionSet();
  recomputeUpgradeBonuses();
  applyOfflineBonus(state.session.lastSaveAt);
  state.meta.track = { ...makeDefaultState().meta.track, ...state.meta.track };
  state.meta.track.maxLifetimePixelEver = Math.max(
    state.meta.track.maxLifetimePixelEver || 0,
    state.economy.lifetimePixel || 0,
  );
  state.meta.track.maxComboEver = Math.max(state.meta.track.maxComboEver || 0, state.session.maxCombo || 0);
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
    ? "Prestige bereit"
    : `${fmtNumber(needed)} Pixel bis Prestige`;

  const comboActive = Date.now() <= state.session.comboUntil;
  const fill = comboActive ? Math.max(0, (state.session.comboUntil - Date.now()) / (COMBO_WINDOW_MS + state.economy.comboWindowBonus)) : 0;
  ui.comboFill.style.width = `${Math.floor(fill * 100)}%`;
  ui.comboLabel.textContent = comboActive
    ? `Kombo ×2 (${state.session.comboCount})`
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
  const buildingsHtml = `<div class="pf-card-grid pf-card-grid--shop">${BUILDINGS.map((b) => {
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

  function upgradeCardHtml(u, kind) {
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
    const effClass = kind === "ppc" ? "pf-card-effect--ppk" : "pf-card-effect--ppsu";
    const stateClass = bought ? "pf-game-card--bought" : can ? "pf-game-card--afford" : "pf-game-card--expensive";
    const cssKind = kind === "ppc" ? "click" : "prod";
    return `
      <button type="button" class="pf-game-card pf-game-card--upgrade pf-game-card--${cssKind} ${stateClass}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${u.name}</h3>
          <p class="pf-card-effect ${effClass}">${u.desc}</p>
        </div>
        <span class="pf-card-buy">${bought ? "Gekauft" : `${fmtNumber(u.cost)} Pixel`}</span>
      </button>`;
  }

  const colPps = PPS_SHOP_UPGRADES.map((u) => upgradeCardHtml(u, "pps")).join("");
  const colPpc = PPC_SHOP_UPGRADES.map((u) => upgradeCardHtml(u, "ppc")).join("");

  const upgradesHtml = `
    <div class="pf-shop-upgrades-block">
      <h4 class="pf-shop-upgrades-title">Dauer-Upgrades</h4>
      <p class="pf-shop-upgrades-sub">Links: Bonus auf Pixel pro Sekunde · Rechts: additiv Pixel pro Klick</p>
      <div class="pf-upgrade-two-col">
        <div class="pf-upgrade-col pf-upgrade-col--pps">
          <h4 class="pf-upgrade-col__title">Pixel pro Sekunde</h4>
          <div class="pf-card-grid pf-card-grid--upgrades pf-card-grid--upgrades-col">${colPps}</div>
        </div>
        <div class="pf-upgrade-col pf-upgrade-col--ppc">
          <h4 class="pf-upgrade-col__title">Pixel pro Klick</h4>
          <div class="pf-card-grid pf-card-grid--upgrades pf-card-grid--upgrades-col">${colPpc}</div>
        </div>
      </div>
    </div>`;

  ui.shopMain.innerHTML = buildingsHtml + upgradesHtml;

  ui.shopMain.querySelectorAll("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => buyBuilding(btn.dataset.buyBuilding));
  });
  ui.shopMain.querySelectorAll("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => buyShopUpgrade(btn.dataset.buyUpgrade));
  });
}

function maybeRenderShop() {
  const now = Date.now();
  if (!runtime.forceShopRender && now < runtime.nextShopRenderAt) return;
  renderShopCards();
  runtime.forceShopRender = false;
  runtime.nextShopRenderAt = now + 900;
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
  const filteredSchema = rows.filter((r) => {
    const v = r.extra_daten?.schemaVersion;
    return v === SAVE_SCHEMA_VERSION || v === 5 || v === 4 || v === 3;
  });
  if (rows.length > 0 && filteredSchema.length === 0) {
    console.warn("[Pixel Factory] Rangliste: Keine Einträge mit passendem Schema – zeige alle gespeicherten Zeilen.");
  }
  const nutze = filteredSchema.length > 0 ? filteredSchema : rows;
  let sorted = [...nutze];
  if (mode === "prestige") sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
  else sorted.sort((a, b) => (b.punkte || 0) - (a.punkte || 0));

  if (sorted.length === 0) {
    ui.rankContent.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-muted)">Noch keine Einträge. Nach dem Anmelden wird der Spielstand automatisch gespeichert.</div>`;
    return;
  }
  ui.rankContent.innerHTML = `
    <table class="rangliste-tabelle">
      <thead><tr><th>#</th><th>Spieler</th><th>${mode === "pixel" ? "Pixel" : "Prestige"}</th></tr></thead>
      <tbody>
        ${sorted.slice(0, 20).map((r, i) => {
          const val = mode === "pixel" ? fmtNumber(r.punkte || 0) : (r.level || 0);
          return `<tr><td>${i + 1}</td><td>${r.benutzername || "Anonym"}</td><td>${val}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderErfolgeModal() {
  const grid = document.getElementById("errungenschaftenGrid");
  const lead = document.getElementById("errungenschaftenLead");
  const unlocked = new Set(state.meta.achievementsUnlocked || []);
  const total = ACHIEVEMENTS.length;
  const done = unlocked.size;
  if (lead) {
    lead.innerHTML = `<span class="pf-ach-pill">${done} / ${total}</span><span class="pf-ach-lead-hint">Karte antippen · volle Aufgabe</span>`;
  }
  if (grid) {
    grid.innerHTML = ACHIEVEMENTS.map((a) => {
      const ok = unlocked.has(a.id);
      const st = ok ? "Erreicht" : "Offen";
      const titleE = escapeHtml(a.title);
      const descE = escapeHtml(a.desc);
      const labelE = escapeHtml(`${a.title}: ${a.desc}`);
      return `
        <button type="button" class="pf-ach-card ${ok ? "pf-ach-card--done" : "pf-ach-card--locked"}" aria-expanded="false" aria-label="${labelE}">
          <div class="pf-ach-card__icon" aria-hidden="true">${ok ? "★" : "○"}</div>
          <div class="pf-ach-card__body">
            <div class="pf-ach-card__top">
              <span class="pf-ach-card__title">${titleE}</span>
              <span class="pf-ach-card__chev" aria-hidden="true">▾</span>
            </div>
            <span class="pf-ach-card__status">${st}</span>
            <p class="pf-ach-card__desc">${descE}</p>
          </div>
        </button>`;
    }).join("");

    grid.querySelectorAll(".pf-ach-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const open = btn.classList.toggle("pf-ach-card--open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }
  document.getElementById("errungenschaftenModal").classList.remove("versteckt");
}

function persistTrackStats() {
  state.meta.track = state.meta.track || {};
  const t = state.meta.track;
  t.maxLifetimePixelEver = Math.max(t.maxLifetimePixelEver || 0, state.economy.lifetimePixel || 0);
  t.maxComboEver = Math.max(t.maxComboEver || 0, state.session.maxCombo || 0);
}

function tickAchievements() {
  const cur = state.meta.achievementsUnlocked || [];
  const set = new Set(cur);
  let neu = false;
  for (const a of ACHIEVEMENTS) {
    if (set.has(a.id)) continue;
    try {
      if (a.check()) {
        set.add(a.id);
        neu = true;
        toast(`🏅 Erfolg: ${a.title}`);
      }
    } catch (err) {
      console.warn("[Pixel Factory] Erfolg-Check:", a.id, err);
    }
  }
  if (neu) {
    state.meta.achievementsUnlocked = [...set];
    saveGame(false, true);
  }
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
    recomputeUpgradeBonuses();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast(`Pixel: ${fmtNumber(v)}`);
  });

  document.getElementById("adm-prestige-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-prestige")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.meta.prestige = Math.floor(v);
    recomputeUpgradeBonuses();
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
    toast(`Prestigepunkte: ${state.meta.prestigePoints}`);
  });

  document.getElementById("adm-vorspulen-btn")?.addEventListener("click", () => {
    const h = Number(document.getElementById("adm-vorspulen")?.value) || 1;
    const bonus = currentPps() * h * 3600;
    addPixels(bonus, "Admin-Zeitsprung");
    toast(`+${fmtNumber(bonus)} Pixel (${h} h)`);
  });

  document.getElementById("adm-alle-upgrades")?.addEventListener("click", () => {
    for (const u of SHOP_UPGRADES_ALL) {
      if (state.economy.boughtUpgrades.includes(u.id)) continue;
      state.economy.boughtUpgrades.push(u.id);
    }
    recomputeUpgradeBonuses();
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
    state.meta.achievementsUnlocked = ACHIEVEMENTS.map((a) => a.id);
    toast("Alle Errungenschaften freigeschaltet (Test)");
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
  state.meta.track = state.meta.track || {};
  state.meta.track.totalClicksEver = (state.meta.track.totalClicksEver || 0) + 1;
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
  if (!shouldShowTutorial()) return;
  const overlay = document.getElementById("tutorialOverlay");
  const title = document.getElementById("tutorialTitel");
  const text = document.getElementById("tutorialText");
  const icon = document.getElementById("tutorialIcon");
  const nextBtn = document.getElementById("tutWeiter");
  const skipBtn = document.getElementById("tutSkip");

  const steps = [
    { icon: "🏭", title: "Willkommen", text: "Klicke den Pixelhaufen. Im Shop: Gebäude und darunter Dauer-Upgrades (Pixel/s und Klick). Über „Erfolge“ gibt es 100 Errungenschaften – die Aufgabe steht immer auf der Karte." },
    { icon: "📋", title: "Missionen", text: "Missionen erneuern sich zur vollen und halben Stunde; Belohnungen unterstützen deinen Fortschritt." },
    { icon: "✦", title: "Prestige", text: "Genug Lifetime-Pixel? Prestige setzt den Run zurück, erhöht dein Prestige-Level und gibt dir Prestigepunkte." },
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
  function close() {
    markTutorialDone();
    overlay.classList.add("versteckt");
  }
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
  ui.offlineBonus = document.getElementById("offlineBonus");
  ui.banner = document.getElementById("ereignisBanner");
  ui.toast = document.getElementById("toastContainer");
  ui.rankContent = document.getElementById("ranglisteInhalt");
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
}

function bindEvents() {
  document.querySelectorAll(".bulk-btn").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".bulk-btn").forEach((x) => x.classList.toggle("aktiv", x === b));
      state.economy.bulk = Number(b.dataset.menge);
    });
  });

  ui.canvas.addEventListener("click", handleClick);
  ui.prestigeBtn.addEventListener("click", openPrestigeModal);
  document.getElementById("prestigeConfirmNein").addEventListener("click", () => {
    ui.prestigeModal.classList.add("versteckt");
  });

  document.getElementById("prestigeConfirmJa").addEventListener("click", () => {
    if (state.economy.lifetimePixel < prestigeThreshold()) return;
    doPrestige();
  });

  document.getElementById("errungenschaftenBtn").textContent = "🎖 Erfolge";
  document.getElementById("errungenschaftenBtn").addEventListener("click", renderErfolgeModal);
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
  tabs.querySelectorAll(".rl-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabs.querySelectorAll(".rl-tab").forEach((x) => x.classList.toggle("aktiv", x === tab));
      await renderLeaderboard(tab.dataset.rl);
    });
  });
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

  persistTrackStats();
  runtime.achCheckAcc += dt;
  if (runtime.achCheckAcc >= 1.25) {
    runtime.achCheckAcc = 0;
    tickAchievements();
  }

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
  syncTutorialSkipFromState();
  recomputeUpgradeBonuses();
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
