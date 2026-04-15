// Pixel Factory Rework v3 (Hard-Reset)
// Komplett neue Kern-Loop mit Missionen, Events, Pfaden, Minigame und Mutationen.

const SAVE_SCHEMA_VERSION = 3;
const GAME_ID = "pixel-factory";
const PRESTIGE_BASE = 6000;
const PRESTIGE_GROWTH = 1.42;
const AUTOSAVE_MS = 45000;
const EVENT_BASE_MS = 120000;
const MINIGAME_COOLDOWN_MS = 90000;

const BUILDINGS = [
  { id: "worker", name: "Pixel-Arbeiter", baseCost: 15, growth: 1.12, pps: 0.35, icon: "🧑‍🏭" },
  { id: "printer", name: "Nano-Drucker", baseCost: 120, growth: 1.14, pps: 2.6, icon: "🖨️" },
  { id: "assembler", name: "Assembler", baseCost: 900, growth: 1.16, pps: 13, icon: "⚙️" },
  { id: "reactor", name: "Fusion-Reaktor", baseCost: 9500, growth: 1.18, pps: 72, icon: "⚡" },
  { id: "matrix", name: "Matrix-Cluster", baseCost: 125000, growth: 1.2, pps: 460, icon: "🧠" },
];

const CLASSIC_UPGRADES = [
  { id: "click1", name: "Präzisions-Klick", cost: 70, desc: "+1 Klickkraft", apply: (s) => { s.economy.clickPower += 1; } },
  { id: "click2", name: "Servo-Finger", cost: 450, desc: "x1.7 Klickkraft", apply: (s) => { s.economy.clickMult *= 1.7; } },
  { id: "prod1", name: "Schichtplanung", cost: 620, desc: "x1.4 Produktion", apply: (s) => { s.economy.prodMult *= 1.4; } },
  { id: "prod2", name: "Qualitätskontrolle", cost: 3600, desc: "x1.9 Produktion", apply: (s) => { s.economy.prodMult *= 1.9; } },
  { id: "hybrid", name: "Lean-Protokoll", cost: 13000, desc: "x1.25 Klick und Produktion", apply: (s) => { s.economy.clickMult *= 1.25; s.economy.prodMult *= 1.25; } },
];

const PATHS = {
  speed: {
    id: "speed",
    name: "Speed-Line",
    desc: "Sehr hoher Output, aber mehr Event-Risiko.",
    prodMult: 1.45,
    clickMult: 1.2,
    eventRisk: 1.3,
    offlineMult: 0.7
  },
  efficiency: {
    id: "efficiency",
    name: "Efficiency-Line",
    desc: "Stabiler, weniger Risiko, solide Skalierung.",
    prodMult: 1.18,
    clickMult: 1.1,
    eventRisk: 0.7,
    offlineMult: 1.0
  },
  automation: {
    id: "automation",
    name: "Automation-Line",
    desc: "Stark im Idle/Offline, schwächer bei aktivem Klick.",
    prodMult: 1.1,
    clickMult: 0.9,
    eventRisk: 0.9,
    offlineMult: 1.55
  }
};

const MUTATION_POOL = [
  {
    id: "hot_machines",
    title: "Heiße Maschinen",
    text: "+22 % Produktion, aber Event-Intervall -20 %",
    apply: (s) => {
      s.meta.mutationProdMult *= 1.22;
      s.meta.mutationEventRate *= 1.2;
    },
  },
  {
    id: "careful_hands",
    title: "Ruhige Hände",
    text: "+35 % Klickkraft, aber -10 % Basiserzeugung",
    apply: (s) => {
      s.meta.mutationClickMult *= 1.35;
      s.meta.mutationProdMult *= 0.9;
    },
  },
  {
    id: "night_shift",
    title: "Nachtschicht",
    text: "+80 % Offline-Bonus, aber Minigame-Belohnung -20 %",
    apply: (s) => {
      s.meta.mutationOfflineMult *= 1.8;
      s.meta.mutationMinigameMult *= 0.8;
    },
  },
  {
    id: "critical_flow",
    title: "Kritischer Fluss",
    text: "Chance auf doppelte Missionsbelohnung 20 %, aber Event-Strafen x1.2",
    apply: (s) => {
      s.meta.doubleRewardChance += 0.2;
      s.meta.eventPenaltyMult *= 1.2;
    },
  },
  {
    id: "quantum_focus",
    title: "Quantum-Fokus",
    text: "+30 % QP-Gewinn, aber Prestige-Schwelle +8 %",
    apply: (s) => {
      s.meta.qpMult *= 1.3;
      s.meta.prestigeThresholdMult *= 1.08;
    },
  },
  {
    id: "low_noise",
    title: "Low-Noise Core",
    text: "Event-Risiko -25 %, dafür Klickkraft -8 %",
    apply: (s) => {
      s.meta.mutationEventRate *= 0.75;
      s.meta.mutationClickMult *= 0.92;
    },
  },
];

const EVENT_POOL = [
  {
    id: "power_dip",
    title: "Stromabfall",
    text: "Die Fabrik schwankt. Wie reagierst du?",
    choices: [
      { id: "repair", label: "Sofort reparieren", effect: (s) => applyTimedEffect(s, "prodMult", 0.85, 45, "Reparatur bremst Produktion") },
      { id: "risk", label: "Riskant weiterfahren", effect: (s) => applyTimedEffect(s, "prodMult", 1.25, 35, "Überlastung bringt mehr Output") },
      { id: "balance", label: "Teil-Bypass", effect: (s) => addPixels(s, getPps(s) * 18, "Bypass-Ausbeute") }
    ]
  },
  {
    id: "quality_boom",
    title: "Qualitäts-Boom",
    text: "Neue Materialcharge erhöht die Reinheit.",
    choices: [
      { id: "mass", label: "Massenproduktion", effect: (s) => applyTimedEffect(s, "prodMult", 1.32, 40, "Qualitäts-Boom aktiv") },
      { id: "premium", label: "Premium-Linie", effect: (s) => { addPixels(s, getPpk(s) * 120, "Premium-Charge"); applyTimedEffect(s, "clickMult", 1.25, 45, "Premium-Klicklinie"); } }
    ]
  },
  {
    id: "sabotage",
    title: "Mikro-Sabotage",
    text: "Jemand hat Sensoren verstellt.",
    choices: [
      { id: "scan", label: "Vollscan starten", effect: (s) => applyTimedEffect(s, "eventRate", 0.65, 70, "System gesichert") },
      { id: "ignore", label: "Ignorieren", effect: (s) => applyTimedEffect(s, "prodMult", 1.18, 25, "Kurzzeit-Ausbeute") },
      { id: "counter", label: "Gegenmaßnahme", effect: (s) => addSeasonPoints(s, 18, "Sabotage abgewehrt") }
    ]
  }
];

const MISSION_POOL = [
  { id: "produce_small", type: "produce", name: "Schichtziel", desc: "Produziere 6.000 Pixel", target: 6000, reward: { pixel: 2500, season: 12 } },
  { id: "produce_mid", type: "produce", name: "Fokuslauf", desc: "Produziere 35.000 Pixel", target: 35000, reward: { pixel: 12000, season: 20, tempProd: 1.25 } },
  { id: "clicks", type: "clicks", name: "Handarbeit", desc: "Mache 220 Klicks", target: 220, reward: { pixel: 8000, season: 16, tempClick: 1.35 } },
  { id: "event", type: "events", name: "Krisenmanager", desc: "Löse 2 Events", target: 2, reward: { season: 28, shards: 1 } },
  { id: "minigame", type: "minigame", name: "Kalibrierprofi", desc: "Gewinne 1 Minigame", target: 1, reward: { pixel: 9000, season: 26 } },
];

const state = createFreshState();
const runtime = {
  running: false,
  lastTs: 0,
  autosaveTimer: 0,
  currentTab: "gebaeude",
  missionRerollCooldownUntil: 0,
  nextShopRenderAt: 0,
  forceShopRender: true,
};

const el = {};

function createFreshState() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    hardResetApplied: true,
    economy: {
      pixel: 0,
      lifetimePixel: 0,
      clickPower: 1,
      clickMult: 1,
      prodMult: 1,
      buildingCount: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
      purchasedUpgrades: [],
    },
    meta: {
      prestige: 0,
      qp: 0,
      chosenPath: "efficiency",
      seasonPoints: 0,
      mutationIds: [],
      mutationProdMult: 1,
      mutationClickMult: 1,
      mutationOfflineMult: 1,
      mutationEventRate: 1,
      mutationMinigameMult: 1,
      eventPenaltyMult: 1,
      doubleRewardChance: 0,
      qpMult: 1,
      prestigeThresholdMult: 1,
      shards: 0,
    },
    session: {
      producedThisRun: 0,
      clicksThisRun: 0,
      eventsSolved: 0,
      minigameWins: 0,
      missions: [],
      activeEffects: [],
      eventState: null,
      nextEventAt: Date.now() + EVENT_BASE_MS,
      minigameCooldownUntil: 0,
      minigameActive: false,
      minigameTicker: 0,
      minigameDirection: 1,
    },
    ui: {
      showHardResetInfo: false,
      lastSaveAt: 0,
    }
  };
}

function currency(v) {
  if (!Number.isFinite(v)) return "0";
  if (v < 1000) return `${Math.floor(v)}`;
  if (v < 1_000_000) return `${(v / 1000).toFixed(1)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return `${(v / 1_000_000_000).toFixed(2)}B`;
}

function getPathProfile() {
  return PATHS[state.meta.chosenPath] || PATHS.efficiency;
}

function buildingCost(building) {
  const owned = state.economy.buildingCount[building.id] || 0;
  return Math.floor(building.baseCost * Math.pow(building.growth, owned));
}

function getPps() {
  let pps = 0;
  for (const building of BUILDINGS) {
    pps += (state.economy.buildingCount[building.id] || 0) * building.pps;
  }

  const path = getPathProfile();
  let mult = state.economy.prodMult * path.prodMult * state.meta.mutationProdMult;
  mult *= activeEffectMultiplier("prodMult");
  return pps * mult;
}

function getPpk() {
  const path = getPathProfile();
  let ppk = state.economy.clickPower * state.economy.clickMult * path.clickMult * state.meta.mutationClickMult;
  ppk *= activeEffectMultiplier("clickMult");
  return ppk;
}

function getEventIntervalMs() {
  const path = getPathProfile();
  const eventRateEffect = activeEffectMultiplier("eventRate");
  const risk = path.eventRisk * state.meta.mutationEventRate * eventRateEffect;
  return Math.max(35000, EVENT_BASE_MS / risk);
}

function activeEffectMultiplier(key) {
  let result = 1;
  for (const effect of state.session.activeEffects) {
    if (effect.key === key) result *= effect.mult;
  }
  return result;
}

function applyTimedEffect(s, key, mult, seconds, label) {
  s.session.activeEffects.push({
    key,
    mult,
    label,
    endsAt: Date.now() + seconds * 1000,
  });
  showBanner(`${label} (${seconds}s)`);
}

function addPixels(s, amount, reason = "") {
  if (amount <= 0) return;
  s.economy.pixel += amount;
  s.economy.lifetimePixel += amount;
  s.session.producedThisRun += amount;
  if (reason) toast(`+${currency(amount)} Pixel · ${reason}`);
}

function addSeasonPoints(s, points, reason = "") {
  if (points <= 0) return;
  s.meta.seasonPoints += points;
  if (reason) toast(`+${points} Saisonpunkte · ${reason}`);
}

function applyUpgrade(upgrade) {
  upgrade.apply(state);
  state.economy.purchasedUpgrades.push(upgrade.id);
}

function prestigeThreshold() {
  return Math.floor(PRESTIGE_BASE * Math.pow(PRESTIGE_GROWTH, state.meta.prestige) * state.meta.prestigeThresholdMult);
}

function calcQpGain() {
  const fromProduction = Math.floor(Math.sqrt(state.economy.lifetimePixel / 1800));
  const fromRun = Math.floor(Math.sqrt(state.session.producedThisRun / 1500));
  const value = Math.max(1, fromProduction + fromRun + Math.floor(state.meta.prestige * 0.25));
  return Math.floor(value * state.meta.qpMult);
}

function pickMissions() {
  const picks = [];
  const source = [...MISSION_POOL];
  while (picks.length < 3 && source.length > 0) {
    const i = Math.floor(Math.random() * source.length);
    const mission = source.splice(i, 1)[0];
    picks.push({
      ...mission,
      progress: 0,
      completed: false,
    });
  }
  state.session.missions = picks;
}

function missionProgressValue(mission) {
  if (mission.type === "produce") return state.session.producedThisRun;
  if (mission.type === "clicks") return state.session.clicksThisRun;
  if (mission.type === "events") return state.session.eventsSolved;
  if (mission.type === "minigame") return state.session.minigameWins;
  return 0;
}

function maybeCompleteMissions() {
  for (const mission of state.session.missions) {
    if (mission.completed) continue;
    mission.progress = Math.min(mission.target, missionProgressValue(mission));
    if (mission.progress >= mission.target) {
      mission.completed = true;
      applyMissionReward(mission.reward);
      toast(`Mission geschafft: ${mission.name}`);
    }
  }
}

function applyMissionReward(reward) {
  const rollDouble = Math.random() < state.meta.doubleRewardChance;
  const factor = rollDouble ? 2 : 1;
  if (reward.pixel) addPixels(state, reward.pixel * factor, "Missionsbelohnung");
  if (reward.season) addSeasonPoints(state, reward.season * factor, "Mission");
  if (reward.shards) state.meta.shards += reward.shards * factor;
  if (reward.tempProd) applyTimedEffect(state, "prodMult", reward.tempProd, 45, "Missions-Boost Produktion");
  if (reward.tempClick) applyTimedEffect(state, "clickMult", reward.tempClick, 45, "Missions-Boost Klick");
}

function rollEvent() {
  if (state.session.eventState) return;
  const pool = EVENT_POOL;
  const event = pool[Math.floor(Math.random() * pool.length)];
  state.session.eventState = event;
  renderEventModal();
}

function resolveEventChoice(choiceId) {
  const event = state.session.eventState;
  if (!event) return;
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  choice.effect(state);
  state.session.eventsSolved += 1;
  state.session.eventState = null;
  state.session.nextEventAt = Date.now() + getEventIntervalMs();
  if (el.eventOverlay) el.eventOverlay.classList.add("versteckt");
  maybeCompleteMissions();
}

function openMinigame() {
  if (Date.now() < state.session.minigameCooldownUntil) {
    toast("Minigame noch im Cooldown");
    return;
  }
  state.session.minigameActive = true;
  state.session.minigameTicker = 0.08;
  state.session.minigameDirection = 1;
  if (el.minigameOverlay) el.minigameOverlay.classList.remove("versteckt");
}

function stopMinigame() {
  if (!state.session.minigameActive) return;
  const dist = Math.abs(0.5 - state.session.minigameTicker);
  const quality = Math.max(0, 1 - dist * 2);
  const mult = 1 + quality * 1.1;
  const duration = Math.floor(20 + quality * 35);
  const boosted = mult * state.meta.mutationMinigameMult;
  applyTimedEffect(state, "prodMult", boosted, duration, "Kalibrierungs-Boost");
  if (quality >= 0.6) {
    state.session.minigameWins += 1;
    addSeasonPoints(state, 10 + Math.floor(quality * 14), "Minigame");
  }
  state.session.minigameActive = false;
  state.session.minigameCooldownUntil = Date.now() + MINIGAME_COOLDOWN_MS;
  if (el.minigameOverlay) el.minigameOverlay.classList.add("versteckt");
  maybeCompleteMissions();
}

function choosePath(pathId) {
  if (!PATHS[pathId]) return;
  state.meta.chosenPath = pathId;
  toast(`Produktionspfad: ${PATHS[pathId].name}`);
  renderShop();
}

function pickMutationChoices() {
  const available = MUTATION_POOL.filter((m) => !state.meta.mutationIds.includes(m.id));
  const source = available.length >= 3 ? available : MUTATION_POOL;
  const picked = [];
  const copy = [...source];
  while (picked.length < 3 && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(i, 1)[0]);
  }
  return picked;
}

function openPrestigeModal() {
  if (state.economy.lifetimePixel < prestigeThreshold()) return;
  const choices = pickMutationChoices();
  el.prestigeConfirmModal.classList.remove("versteckt");
  el.pcQP.textContent = `+${calcQpGain()} Quantum-Pixel`;
  const wrap = document.getElementById("mutationChoices");
  wrap.innerHTML = choices.map((m) => `
    <button class="mutation-card" data-mutation="${m.id}">
      <strong>${m.title}</strong>
      <span>${m.text}</span>
    </button>
  `).join("");
  wrap.querySelectorAll(".mutation-card").forEach((btn) => {
    btn.addEventListener("click", () => doPrestige(btn.dataset.mutation));
  });
}

function doPrestige(mutationId) {
  const mutation = MUTATION_POOL.find((m) => m.id === mutationId);
  if (!mutation) return;
  const gain = calcQpGain();
  state.meta.prestige += 1;
  state.meta.qp += gain;
  if (!state.meta.mutationIds.includes(mutationId)) {
    state.meta.mutationIds.push(mutationId);
  }

  const keepMeta = { ...state.meta };
  const fresh = createFreshState();
  state.economy = fresh.economy;
  state.session = fresh.session;
  state.meta = keepMeta;
  recalcMutations();
  pickMissions();
  el.prestigeConfirmModal.classList.add("versteckt");
  toast(`Prestige ${state.meta.prestige} · Mutation: ${mutation.title}`);
}

function recalcMutations() {
  state.meta.mutationProdMult = 1;
  state.meta.mutationClickMult = 1;
  state.meta.mutationOfflineMult = 1;
  state.meta.mutationEventRate = 1;
  state.meta.mutationMinigameMult = 1;
  state.meta.eventPenaltyMult = 1;
  state.meta.doubleRewardChance = 0;
  state.meta.qpMult = 1;
  state.meta.prestigeThresholdMult = 1;
  for (const id of state.meta.mutationIds) {
    const m = MUTATION_POOL.find((x) => x.id === id);
    if (m) m.apply(state);
  }
}

async function saveGame(withToast = false) {
  if (window.location.search.includes("admin=1")) {
    if (withToast) toast("Test-Modus: kein Speichern");
    return;
  }
  const user = await PZ.getUser();
  if (!user) return;
  const payload = JSON.parse(JSON.stringify(state));
  await PZ.saveGameData(GAME_ID, Math.floor(state.economy.lifetimePixel), state.meta.prestige, payload);
  state.ui.lastSaveAt = Date.now();
  if (withToast) toast("Gespeichert");
}

async function loadGame() {
  const data = await PZ.loadScore(GAME_ID);
  if (!data || !data.extra_daten) {
    pickMissions();
    return;
  }
  if (data.extra_daten.schemaVersion !== SAVE_SCHEMA_VERSION) {
    Object.assign(state, createFreshState());
    state.ui.showHardResetInfo = true;
    pickMissions();
    return;
  }

  Object.assign(state, data.extra_daten);
  recalcMutations();
  if (!Array.isArray(state.session.missions) || state.session.missions.length === 0) {
    pickMissions();
  }
}

function applyOfflineBonus(lastVisitMs) {
  if (!lastVisitMs) return;
  const delta = Math.max(0, Date.now() - lastVisitMs);
  if (delta < 60000) return;
  const hours = Math.min(12, delta / 3600000);
  const path = getPathProfile();
  const offlinePps = getPps() * path.offlineMult * state.meta.mutationOfflineMult;
  const bonus = offlinePps * hours * 3600 * 0.3;
  addPixels(state, bonus, "Offline-Bonus");
}

function buildDynamicUi() {
  const actions = document.querySelector(".aktionen");
  const helpPanel = document.createElement("div");
  helpPanel.className = "rework-panel help-panel";
  helpPanel.innerHTML = `
    <div class="rework-head"><strong>So funktioniert das Rework</strong></div>
    <ul class="help-list">
      <li><strong>Missionen:</strong> Erfülle Ziele für Pixel, Saisonpunkte und Boosts.</li>
      <li><strong>Events:</strong> Alle paar Minuten erscheint eine Entscheidung mit Risiko/Belohnung.</li>
      <li><strong>Minigame:</strong> Über den 🎯 Button Timing-Boost starten (mit Cooldown).</li>
      <li><strong>Prestige:</strong> Bei Prestige wählst du 1 Mutation für den nächsten Run.</li>
      <li><strong>Pfade:</strong> Im Upgrade-Tab zwischen Speed, Efficiency und Automation wählen.</li>
    </ul>
  `;
  actions.appendChild(helpPanel);

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

  const eventOverlay = document.createElement("div");
  eventOverlay.id = "eventOverlay";
  eventOverlay.className = "modal-hintergrund versteckt";
  eventOverlay.innerHTML = `<div class="modal"><h2 id="eventTitle"></h2><p id="eventText"></p><div id="eventChoices" class="event-choices"></div></div>`;
  document.body.appendChild(eventOverlay);

  const minigameOverlay = document.createElement("div");
  minigameOverlay.id = "minigameOverlay";
  minigameOverlay.className = "modal-hintergrund versteckt";
  minigameOverlay.innerHTML = `
    <div class="modal">
      <h2>Kalibrierungs-Minispiel</h2>
      <p>Stoppe den Marker möglichst mittig für einen starken Boost.</p>
      <div class="mini-bar"><div id="miniMarker"></div><div class="mini-center"></div></div>
      <button id="miniStopBtn" class="btn-aktion">Jetzt stoppen</button>
    </div>
  `;
  document.body.appendChild(minigameOverlay);

  const mutationWrap = document.createElement("div");
  mutationWrap.id = "mutationChoices";
  mutationWrap.className = "mutation-grid";
  document.querySelector(".pc-liste").appendChild(mutationWrap);

  el.eventOverlay = eventOverlay;
  el.minigameOverlay = minigameOverlay;
}

function bindElements() {
  el.statPixel = document.getElementById("statPixel");
  el.statPPS = document.getElementById("statPPS");
  el.statPPK = document.getElementById("statPPK");
  el.statQP = document.getElementById("statQP");
  el.statPrestige = document.getElementById("statPrestige");
  el.pixelHaufen = document.getElementById("pixelHaufen");
  el.klickInfo = document.getElementById("klickInfo");
  el.prestigeBtn = document.getElementById("prestigeBtn");
  el.prestigeInfo = document.getElementById("prestigeInfo");
  el.shopGebaeude = document.getElementById("shopGebaeude");
  el.shopUpgrades = document.getElementById("shopUpgrades");
  el.shopPrestige = document.getElementById("shopPrestige");
  el.ranglisteBtn = document.getElementById("ranglisteBtn");
  el.ranglisteModal = document.getElementById("ranglisteModal");
  el.ranglisteInhalt = document.getElementById("ranglisteInhalt");
  el.ranglisteSchliessen = document.getElementById("ranglisteSchliessen");
  el.prestigeConfirmModal = document.getElementById("prestigeConfirmModal");
  el.prestigeConfirmNein = document.getElementById("prestigeConfirmNein");
  el.pcQP = document.getElementById("pcQP");
  el.offlineBonus = document.getElementById("offlineBonus");
  el.ereignisBanner = document.getElementById("ereignisBanner");
  el.toastContainer = document.getElementById("toastContainer");
}

function bindEvents() {
  document.querySelectorAll(".shop-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      runtime.currentTab = tab.dataset.tab;
      document.querySelectorAll(".shop-tab").forEach((t) => t.classList.toggle("aktiv", t === tab));
      el.shopGebaeude.classList.toggle("versteckt", runtime.currentTab !== "gebaeude");
      el.shopUpgrades.classList.toggle("versteckt", runtime.currentTab !== "upgrades");
      el.shopPrestige.classList.toggle("versteckt", runtime.currentTab !== "prestige");
    });
  });

  el.pixelHaufen.addEventListener("click", () => {
    const gain = getPpk();
    addPixels(state, gain);
    state.session.clicksThisRun += 1;
    maybeCompleteMissions();
    renderMissions();
    renderStats();
  });

  el.prestigeBtn.addEventListener("click", openPrestigeModal);
  el.prestigeConfirmNein.addEventListener("click", () => el.prestigeConfirmModal.classList.add("versteckt"));

  el.ranglisteBtn.addEventListener("click", async () => {
    el.ranglisteModal.classList.remove("versteckt");
    await renderLeaderboard("pixel");
  });
  el.ranglisteSchliessen.addEventListener("click", () => el.ranglisteModal.classList.add("versteckt"));
  document.querySelectorAll(".rl-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      document.querySelectorAll(".rl-tab").forEach((t) => t.classList.toggle("aktiv", t === tab));
      await renderLeaderboard(tab.dataset.rl);
    });
  });

  // Alte Buttons werden im Rework neu genutzt.
  const talentBtn = document.getElementById("talentBtn");
  talentBtn.textContent = "🎯 Minigame";
  talentBtn.addEventListener("click", openMinigame);
  const errBtn = document.getElementById("errungenschaftenBtn");
  errBtn.textContent = "📅 Saison";
  errBtn.addEventListener("click", () => toast(`Saisonpunkte: ${state.meta.seasonPoints}`));

  document.getElementById("missionRerollBtn").addEventListener("click", () => {
    if (Date.now() < runtime.missionRerollCooldownUntil) {
      toast("Reroll im Cooldown");
      return;
    }
    runtime.missionRerollCooldownUntil = Date.now() + 35000;
    pickMissions();
    renderMissions();
  });

  document.getElementById("miniStopBtn").addEventListener("click", stopMinigame);
}

function renderStats() {
  el.statPixel.textContent = `${currency(state.economy.pixel)} Pixel`;
  el.statPPS.textContent = currency(getPps());
  el.statPPK.textContent = currency(getPpk());
  el.statQP.textContent = currency(state.meta.qp);
  el.statPrestige.textContent = `${state.meta.prestige}`;
  const need = prestigeThreshold();
  const can = state.economy.lifetimePixel >= need;
  el.prestigeBtn.disabled = !can;
  el.prestigeInfo.textContent = can ? `Bereit · +${calcQpGain()} QP` : `${currency(need - state.economy.lifetimePixel)} Pixel bis Prestige`;
}

function renderShop() {
  el.shopGebaeude.innerHTML = BUILDINGS.map((b) => {
    const cost = buildingCost(b);
    const owned = state.economy.buildingCount[b.id] || 0;
    const can = state.economy.pixel >= cost;
    return `
      <button class="upgrade-eintrag ${can ? "leistbar" : "zu-teuer"}" data-buy-building="${b.id}">
        <div class="upgrade-name">${b.icon} ${b.name} <small>x${owned}</small></div>
        <div class="upgrade-text">+${currency(b.pps)} PPS</div>
        <div class="upgrade-preis">${currency(cost)} Pixel</div>
      </button>
    `;
  }).join("");

  el.shopUpgrades.innerHTML = `
    <div class="path-grid">
      ${Object.values(PATHS).map((p) => `
        <button class="path-card ${p.id === state.meta.chosenPath ? "aktiv" : ""}" data-path="${p.id}">
          <strong>${p.name}</strong>
          <span>${p.desc}</span>
        </button>
      `).join("")}
    </div>
    <div class="upgrade-list">
      ${CLASSIC_UPGRADES.map((u) => {
        const bought = state.economy.purchasedUpgrades.includes(u.id);
        const can = state.economy.pixel >= u.cost && !bought;
        return `
          <button class="upgrade-eintrag ${bought ? "gesperrt" : (can ? "leistbar" : "zu-teuer")}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
            <div class="upgrade-name">${u.name}</div>
            <div class="upgrade-text">${u.desc}</div>
            <div class="upgrade-preis">${bought ? "Gekauft" : `${currency(u.cost)} Pixel`}</div>
          </button>
        `;
      }).join("")}
    </div>
  `;

  el.shopPrestige.innerHTML = `
    <div class="rework-panel">
      <div><strong>Mutationen aktiv:</strong> ${state.meta.mutationIds.length}</div>
      <div><strong>Saisonpunkte:</strong> ${state.meta.seasonPoints}</div>
      <div><strong>Shards:</strong> ${state.meta.shards}</div>
      <div class="upgrade-text">Nächstes Prestige bei ${currency(prestigeThreshold())} Lifetime Pixel.</div>
    </div>
  `;

  el.shopGebaeude.querySelectorAll("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const building = BUILDINGS.find((b) => b.id === btn.dataset.buyBuilding);
      if (!building) return;
      const cost = buildingCost(building);
      if (state.economy.pixel < cost) return;
      state.economy.pixel -= cost;
      state.economy.buildingCount[building.id] += 1;
      runtime.forceShopRender = true;
      renderShop();
      renderStats();
    });
  });

  el.shopUpgrades.querySelectorAll("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const upgrade = CLASSIC_UPGRADES.find((u) => u.id === btn.dataset.buyUpgrade);
      if (!upgrade || state.economy.purchasedUpgrades.includes(upgrade.id)) return;
      if (state.economy.pixel < upgrade.cost) return;
      state.economy.pixel -= upgrade.cost;
      applyUpgrade(upgrade);
      runtime.forceShopRender = true;
      renderShop();
      renderStats();
    });
  });

  el.shopUpgrades.querySelectorAll("[data-path]").forEach((btn) => {
    btn.addEventListener("click", () => choosePath(btn.dataset.path));
  });
}

function renderMissions() {
  const list = document.getElementById("missionList");
  list.innerHTML = state.session.missions.map((m) => {
    const ratio = Math.min(1, (m.progress || 0) / m.target);
    const rewardText = [
      m.reward.pixel ? `${currency(m.reward.pixel)} Pixel` : null,
      m.reward.season ? `${m.reward.season} Saison` : null,
      m.reward.shards ? `${m.reward.shards} Shard` : null,
    ].filter(Boolean).join(" · ");
    return `
      <div class="mission-card ${m.completed ? "done" : ""}">
        <div class="mission-top"><strong>${m.name}</strong><span>${Math.floor(ratio * 100)}%</span></div>
        <div class="upgrade-text">${m.desc}</div>
        <div class="mission-bar"><div style="width:${ratio * 100}%"></div></div>
        <div class="mission-reward">${rewardText}</div>
      </div>
    `;
  }).join("");
}

function renderEventModal() {
  const event = state.session.eventState;
  if (!event) return;
  document.getElementById("eventTitle").textContent = event.title;
  document.getElementById("eventText").textContent = event.text;
  const choices = document.getElementById("eventChoices");
  choices.innerHTML = event.choices.map((c) => `<button class="btn-aktion" data-event-choice="${c.id}">${c.label}</button>`).join("");
  choices.querySelectorAll("[data-event-choice]").forEach((btn) => {
    btn.addEventListener("click", () => resolveEventChoice(btn.dataset.eventChoice));
  });
  el.eventOverlay.classList.remove("versteckt");
}

async function renderLeaderboard(mode) {
  const entries = await PZ.getLeaderboard(GAME_ID, 40);
  let sorted = [...entries];
  if (mode === "prestige") {
    sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
  } else if (mode === "season") {
    sorted.sort((a, b) => {
      const av = a.extra_daten?.meta?.seasonPoints || 0;
      const bv = b.extra_daten?.meta?.seasonPoints || 0;
      return bv - av;
    });
  } else {
    sorted.sort((a, b) => (b.punkte || 0) - (a.punkte || 0));
  }

  el.ranglisteInhalt.innerHTML = `
    <table class="rangliste-tabelle">
      <thead><tr><th>#</th><th>Spieler</th><th>${mode === "pixel" ? "Pixel" : mode === "prestige" ? "Prestige" : "Saison"}</th></tr></thead>
      <tbody>
        ${sorted.slice(0, 20).map((e, i) => {
          const value = mode === "pixel"
            ? currency(e.punkte || 0)
            : mode === "prestige"
              ? (e.level || 0)
              : (e.extra_daten?.meta?.seasonPoints || 0);
          return `<tr><td>${i + 1}</td><td>${e.benutzername || "Anonym"}</td><td>${value}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function tickEffects() {
  const now = Date.now();
  state.session.activeEffects = state.session.activeEffects.filter((e) => e.endsAt > now);
}

function maybeRenderShopSlowly() {
  const now = Date.now();
  if (runtime.forceShopRender || now >= runtime.nextShopRenderAt) {
    renderShop();
    runtime.forceShopRender = false;
    runtime.nextShopRenderAt = now + 800;
  }
}

function tickMinigame(dtSec) {
  if (!state.session.minigameActive) return;
  const speed = 0.9;
  state.session.minigameTicker += state.session.minigameDirection * dtSec * speed;
  if (state.session.minigameTicker >= 1) {
    state.session.minigameTicker = 1;
    state.session.minigameDirection = -1;
  } else if (state.session.minigameTicker <= 0) {
    state.session.minigameTicker = 0;
    state.session.minigameDirection = 1;
  }
  const marker = document.getElementById("miniMarker");
  if (marker) marker.style.left = `${state.session.minigameTicker * 100}%`;
}

function showBanner(text) {
  el.ereignisBanner.textContent = text;
  el.ereignisBanner.hidden = false;
  setTimeout(() => { el.ereignisBanner.hidden = true; }, 2200);
}

function toast(text) {
  const d = document.createElement("div");
  d.className = "toast";
  d.textContent = text;
  el.toastContainer.appendChild(d);
  setTimeout(() => d.remove(), 2200);
}

function updateTopActions() {
  const saveAgo = Date.now() - (state.ui.lastSaveAt || 0);
  const autosaveEl = document.getElementById("autosaveInd");
  if (saveAgo < 15000) autosaveEl.textContent = "✓ Gespeichert";
  else autosaveEl.textContent = "… läuft";
}

function frame(ts) {
  if (!runtime.running) return;
  if (!runtime.lastTs) runtime.lastTs = ts;
  const dt = Math.min(0.05, (ts - runtime.lastTs) / 1000);
  runtime.lastTs = ts;

  const pps = getPps();
  addPixels(state, pps * dt);
  tickEffects();
  tickMinigame(dt);
  maybeCompleteMissions();

  if (Date.now() >= state.session.nextEventAt) {
    rollEvent();
    state.session.nextEventAt = Date.now() + getEventIntervalMs();
  }

  runtime.autosaveTimer += dt * 1000;
  if (runtime.autosaveTimer >= AUTOSAVE_MS) {
    runtime.autosaveTimer = 0;
    saveGame(false);
  }

  renderStats();
  renderMissions();
  maybeRenderShopSlowly();
  updateTopActions();
  requestAnimationFrame(frame);
}

async function init() {
  buildDynamicUi();
  bindElements();
  bindEvents();
  await loadGame();

  if (state.ui.showHardResetInfo) {
    el.offlineBonus.hidden = false;
    el.offlineBonus.textContent = "Rework aktiv: alter Save wurde auf v3 zurückgesetzt.";
    setTimeout(() => { el.offlineBonus.hidden = true; }, 8000);
  } else {
    applyOfflineBonus(state.ui.lastSaveAt);
  }

  // Zusätzlicher Saison-Tab in der Rangliste.
  const tabs = document.querySelector(".rangliste-tabs");
  if (!tabs.querySelector('[data-rl="season"]')) {
    const seasonTab = document.createElement("button");
    seasonTab.className = "rl-tab";
    seasonTab.dataset.rl = "season";
    seasonTab.textContent = "Saison";
    tabs.appendChild(seasonTab);
    seasonTab.addEventListener("click", async () => {
      document.querySelectorAll(".rl-tab").forEach((t) => t.classList.toggle("aktiv", t === seasonTab));
      await renderLeaderboard("season");
    });
  }

  runtime.running = true;
  renderStats();
  renderMissions();
  renderShop();
  requestAnimationFrame(frame);
  setInterval(() => saveGame(false), 120000);

  window.addEventListener("beforeunload", () => {
    state.ui.lastSaveAt = Date.now();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await PZ.updateNavbar();
  await init();
});
