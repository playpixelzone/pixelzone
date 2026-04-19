import { UPGRADE_DEFINITIONS, getDefinitionById, priceAtLevel } from './upgrades.js';
import {
  ARTIFACT_DEFS,
  ARTIFACT_DROP_CHANCE,
  ELITE_UNITS,
  EXPEDITION_DURATION_SEC,
  PLUNDER_LOSS_MAX,
  PLUNDER_LOSS_MIN,
  getArtifactDefById,
  getEliteUnitById,
} from './expeditionData.js';
import {
  fetchUserProgress,
  getCurrentUserId,
  upsertUserProgress,
} from './necroSupabase.js';

const BASE_BONES_PER_CLICK = 1;
const SAVE_KEY = 'necromancer-idle-save-v3';
const SAVE_VERSION = 3;

const MAX_CLICKS_PER_SEC = 15;

const initialUpgrades = () => {
  /** @type {Record<string, number>} */
  const o = {};
  for (const u of UPGRADE_DEFINITIONS) {
    o[u.id] = 0;
  }
  return o;
};

/**
 * Zentraler Spielzustand — Knochen, Upgrade-Level, Prestige, Dimensionen.
 */
export const GameState = {
  bones: 0,
  graveGoods: 0,
  worldEssence: 0,
  /** Abgeschlossene Dimensionen (Prestige-Zähler) */
  dimensionsCompleted: 0,
  /** Permanent: startet bei 1, +0.5 pro Prestige */
  dimensionMultiplier: 1,
  /** In dieser Runde insgesamt erspielte Knochen (für Prestige-Belohnung) */
  lifetimeBonesThisRun: 0,
  /** Level je Gebäude-ID */
  upgrades: initialUpgrades(),
  /** Expedition / Auto-Battler */
  expeditionState: {
    currentMap: 'menschendorf',
    /** @type {Record<string, number>} */
    activeUnits: { skeletonWarrior: 0 },
    explorationProgress: 0,
    running: false,
    /** Während Plünderung: entsandte Skelette */
    deployedThisRun: 0,
  },
  /** Artefakt-Id → Anzahl (permanente Buffs) */
  /** @type {Record<string, number>} */
  artifactsOwned: {},
};

let passiveRemainder = 0;

/**
 * Elite-Krieger anwerben (Knochen).
 * @param {string} unitId
 */
export function recruitEliteUnit(unitId) {
  const u = getEliteUnitById(unitId);
  if (!u) return false;
  if (GameState.expeditionState.running) return false;
  if (GameState.bones < u.boneCost) return false;
  GameState.bones -= u.boneCost;
  GameState.expeditionState.activeUnits[unitId] =
    Math.max(0, Math.floor(GameState.expeditionState.activeUnits[unitId] ?? 0)) + 1;
  dispatchStateChanged();
  return true;
}

/**
 * Plünderung starten: gesamte Armee zieht ins Dorf (Lager leer bis zum Ende).
 */
export function startExpedition() {
  const es = GameState.expeditionState;
  if (es.running) return false;
  const n = Math.max(0, Math.floor(es.activeUnits.skeletonWarrior ?? 0));
  if (n <= 0) return false;
  es.deployedThisRun = n;
  es.activeUnits.skeletonWarrior = 0;
  es.running = true;
  es.explorationProgress = 0;
  dispatchStateChanged();
  return true;
}

/**
 * Nach abgeschlossenem Balken: Verluste, Beute, Überlebende kehren zurück.
 * @returns {null | { lost: number; survived: number; deployed: number; artifactName: string | null; artifactDropped: boolean }}
 */
export function finishExpeditionPlunder() {
  const es = GameState.expeditionState;
  if (!es.running) return null;

  const deployed = Math.max(0, Math.floor(es.deployedThisRun ?? 0));
  es.running = false;
  es.explorationProgress = 0;
  es.deployedThisRun = 0;

  let lost = 0;
  let survived = 0;
  if (deployed > 0) {
    const lossPct = PLUNDER_LOSS_MIN + Math.random() * (PLUNDER_LOSS_MAX - PLUNDER_LOSS_MIN);
    lost = Math.max(0, Math.floor(deployed * lossPct));
    survived = Math.max(0, deployed - lost);
  }

  es.activeUnits.skeletonWarrior = survived;

  let artifactName = null;
  if (deployed > 0 && Math.random() < ARTIFACT_DROP_CHANCE) {
    const def = ARTIFACT_DEFS[0];
    if (def) {
      GameState.artifactsOwned[def.id] = (GameState.artifactsOwned[def.id] ?? 0) + 1;
      artifactName = def.name;
    }
  }

  const result = {
    lost,
    survived,
    deployed,
    artifactName,
    artifactDropped: artifactName != null,
  };
  dispatchStateChanged();
  document.dispatchEvent(new CustomEvent('necro-expedition-complete', { detail: result }));
  return result;
}

export function tickExpedition(deltaSeconds) {
  const es = GameState.expeditionState;
  if (!es.running || deltaSeconds <= 0) return;

  const progressDelta = (deltaSeconds / EXPEDITION_DURATION_SEC) * 100;
  es.explorationProgress = Math.min(100, es.explorationProgress + progressDelta);

  if (es.explorationProgress >= 100) {
    finishExpeditionPlunder();
  }
}

/** @type {ReturnType<typeof createNumberFormatter>} */
let bonesFormatter;
/** @type {ReturnType<typeof createRateFormatter>} */
let rateFormatter;

function createNumberFormatter() {
  return new Intl.NumberFormat('de-DE', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  });
}

function createRateFormatter() {
  return new Intl.NumberFormat('de-DE', {
    notation: 'compact',
    compactDisplay: 'short',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatGameNumber(value) {
  if (!bonesFormatter) bonesFormatter = createNumberFormatter();
  if (!Number.isFinite(value)) return '0';
  return bonesFormatter.format(value);
}

export function formatRate(value) {
  if (!rateFormatter) rateFormatter = createRateFormatter();
  if (!Number.isFinite(value)) return '0';
  if (value > 0 && value < 0.01) return value.toFixed(2);
  return rateFormatter.format(value);
}

export function getUpgradeLevel(id) {
  return GameState.upgrades[id] ?? 0;
}

function baseBonesPerSecond() {
  let total = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.type !== 'PPS') continue;
    const lv = getUpgradeLevel(def.id);
    total += lv * def.perLevel;
  }
  return total;
}

function baseBonesPerClick() {
  let fromUpgrades = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.type !== 'PPC') continue;
    const lv = getUpgradeLevel(def.id);
    fromUpgrades += lv * def.perLevel;
  }
  return BASE_BONES_PER_CLICK + fromUpgrades;
}

export function getBonesPerSecond() {
  return baseBonesPerSecond() * GameState.dimensionMultiplier;
}

export function getArtifactClickMultiplier() {
  let bonus = 0;
  for (const [id, n] of Object.entries(GameState.artifactsOwned)) {
    const def = getArtifactDefById(id);
    const c = Math.max(0, Math.floor(Number(n) || 0));
    if (!def || c <= 0) continue;
    bonus += def.clickPowerBonus * c;
  }
  return 1 + bonus;
}

export function getCombatPower() {
  let p = 0;
  for (const u of ELITE_UNITS) {
    const n = Math.max(0, Math.floor(GameState.expeditionState.activeUnits[u.id] ?? 0));
    p += n * u.combatPowerPerUnit;
  }
  return p;
}

export function getBonesPerClick() {
  return baseBonesPerClick() * GameState.dimensionMultiplier * getArtifactClickMultiplier();
}

/**
 * Schwelle Knochen für nächstes Prestige (skaliert mit abgeschlossenen Dimensionen).
 */
export function getPrestigeBoneTarget() {
  const base = 100000;
  return Math.floor(base * Math.pow(1.85, GameState.dimensionsCompleted));
}

export function getPrestigeProgressPercent() {
  const target = getPrestigeBoneTarget();
  if (target <= 0) return 0;
  return Math.min(100, (GameState.bones / target) * 100);
}

export function canPrestigeNow() {
  return GameState.bones >= getPrestigeBoneTarget() && getPrestigeProgressPercent() >= 100;
}

/**
 * Welten-Essenz aus dieser Runde (gesammelte Knochen gesamt).
 */
function calcPrestigeEssenceReward() {
  const L = GameState.lifetimeBonesThisRun;
  if (L <= 0) return 1;
  return Math.max(1, Math.floor(Math.pow(L, 0.55) / 18));
}

/**
 * Nach Prestige-Animation: Belohnung, Reset, Multiplier.
 */
export function performPrestige() {
  if (!canPrestigeNow()) return false;

  const reward = calcPrestigeEssenceReward();
  GameState.worldEssence += reward;
  GameState.dimensionsCompleted += 1;
  GameState.dimensionMultiplier += 0.5;

  GameState.bones = 0;
  GameState.upgrades = initialUpgrades();
  GameState.lifetimeBonesThisRun = 0;
  passiveRemainder = 0;

  GameState.expeditionState = {
    currentMap: 'menschendorf',
    activeUnits: { skeletonWarrior: 0 },
    explorationProgress: 0,
    running: false,
    deployedThisRun: 0,
  };

  dispatchStateChanged();
  return true;
}

export function addBones(amount) {
  if (!Number.isFinite(amount) || amount === 0) return;
  GameState.bones += amount;
  if (amount > 0) {
    GameState.lifetimeBonesThisRun += amount;
  }
  dispatchStateChanged();
}

export function tickPassive(deltaSeconds) {
  if (deltaSeconds <= 0) return;
  tickExpedition(deltaSeconds);
  const bps = getBonesPerSecond();
  if (bps <= 0) return;
  passiveRemainder += bps * deltaSeconds;
  const whole = Math.floor(passiveRemainder);
  passiveRemainder -= whole;
  if (whole > 0) {
    addBones(whole);
  }
}

export function getUpgradeCurrentPrice(id) {
  const def = getDefinitionById(id);
  if (!def) return Infinity;
  const lv = getUpgradeLevel(id);
  return priceAtLevel(def.basePrice, lv);
}

export function canAffordUpgrade(id) {
  return GameState.bones >= getUpgradeCurrentPrice(id);
}

export function buyUpgrade(id) {
  const def = getDefinitionById(id);
  if (!def) return false;
  const price = getUpgradeCurrentPrice(id);
  if (GameState.bones < price) return false;
  GameState.bones -= price;
  GameState.upgrades[id] = getUpgradeLevel(id) + 1;
  dispatchStateChanged();
  document.dispatchEvent(new CustomEvent('necro-upgrade-bought', { detail: { id } }));
  return true;
}

let stateDispatchPending = false;

function dispatchStateChanged() {
  if (stateDispatchPending) return;
  stateDispatchPending = true;
  requestAnimationFrame(() => {
    stateDispatchPending = false;
    document.dispatchEvent(
      new CustomEvent('necro-state-changed', {
        detail: {
          bones: GameState.bones,
          bps: getBonesPerSecond(),
          bpc: getBonesPerClick(),
        },
      }),
    );
  });
}

/** Admin-Testpanel (`?admin=1`, nur Site-Admin): Ressourcen geben */
export function cheatGrantResources({ bones = 0, worldEssence = 0 }) {
  if (worldEssence) {
    GameState.worldEssence = Math.max(0, GameState.worldEssence + worldEssence);
  }
  if (bones) {
    addBones(bones);
  } else if (worldEssence) {
    dispatchStateChanged();
  }
}

function applyLoadedState(data) {
  GameState.bones = Math.max(0, Number(data.bones) || 0);
  GameState.graveGoods = Math.max(0, Number(data.grave_goods ?? data.graveGoods) || 0);
  GameState.worldEssence = Math.max(0, Math.floor(Number(data.world_essence ?? data.worldEssence) || 0));
  GameState.dimensionsCompleted = Math.max(
    0,
    Math.floor(Number(data.dimensions_completed ?? data.dimensionsCompleted) || 0),
  );
  GameState.dimensionMultiplier = Math.max(
    0.5,
    Number(data.dimension_multiplier ?? data.dimensionMultiplier) || 1,
  );
  GameState.lifetimeBonesThisRun = Math.max(
    0,
    Math.floor(Number(data.lifetime_bones_this_run ?? data.lifetimeBonesThisRun) || 0),
  );

  const next = initialUpgrades();
  const rawUp = data.upgrades;
  if (rawUp && typeof rawUp === 'object') {
    for (const id of Object.keys(next)) {
      const lv = rawUp[id];
      next[id] = Math.max(0, Math.floor(Number(lv) || 0));
    }
  }
  GameState.upgrades = next;
  passiveRemainder = 0;

  const defExp = {
    currentMap: 'menschendorf',
    activeUnits: { skeletonWarrior: 0 },
    explorationProgress: 0,
    running: false,
    deployedThisRun: 0,
  };
  const ex = data.expedition_state ?? data.expeditionState;
  if (ex && typeof ex === 'object') {
    const au = ex.active_units ?? ex.activeUnits;
    const mergedUnits = { ...defExp.activeUnits };
    if (au && typeof au === 'object') {
      for (const u of ELITE_UNITS) {
        const n = au[u.id];
        if (n !== undefined) mergedUnits[u.id] = Math.max(0, Math.floor(Number(n) || 0));
      }
    }
    GameState.expeditionState = {
      ...defExp,
      currentMap:
        typeof ex.current_map === 'string'
          ? ex.current_map
          : typeof ex.currentMap === 'string'
            ? ex.currentMap
            : defExp.currentMap,
      activeUnits: mergedUnits,
      explorationProgress: Math.max(
        0,
        Math.min(100, Number(ex.exploration_progress ?? ex.explorationProgress) || 0),
      ),
      running: Boolean(ex.running),
      deployedThisRun: Math.max(
        0,
        Math.floor(Number(ex.deployed_this_run ?? ex.deployedThisRun) || 0),
      ),
    };
  } else {
    GameState.expeditionState = { ...defExp };
  }

  const art = data.artifacts_owned ?? data.artifactsOwned;
  if (art && typeof art === 'object') {
    /** @type {Record<string, number>} */
    const nextArt = {};
    for (const [k, v] of Object.entries(art)) {
      nextArt[k] = Math.max(0, Math.floor(Number(v) || 0));
    }
    GameState.artifactsOwned = nextArt;
  } else {
    GameState.artifactsOwned = {};
  }

  dispatchStateChanged();
}

const clickTimestamps = [];

/** Klick-Limiter: max. MAX_CLICKS_PER_SEC Klicks pro Sekunde */
export function tryRegisterClick() {
  const now = performance.now();
  while (clickTimestamps.length && now - clickTimestamps[0] > 1000) clickTimestamps.shift();
  if (clickTimestamps.length >= MAX_CLICKS_PER_SEC) return false;
  clickTimestamps.push(now);
  return true;
}

/**
 * @returns {object}
 */
function buildPersistPayload() {
  return {
    bones: GameState.bones,
    grave_goods: GameState.graveGoods,
    world_essence: GameState.worldEssence,
    dimensions_completed: GameState.dimensionsCompleted,
    dimension_multiplier: GameState.dimensionMultiplier,
    lifetime_bones_this_run: GameState.lifetimeBonesThisRun,
    upgrades: { ...GameState.upgrades },
    expedition_state: {
      current_map: GameState.expeditionState.currentMap,
      active_units: { ...GameState.expeditionState.activeUnits },
      exploration_progress: GameState.expeditionState.explorationProgress,
      running: GameState.expeditionState.running,
      deployed_this_run: GameState.expeditionState.deployedThisRun,
    },
    artifacts_owned: { ...GameState.artifactsOwned },
  };
}

export async function saveToSupabase() {
  try {
    const auth = await getCurrentUserId();
    if (!auth) return false;
    return await upsertUserProgress(auth.userId, buildPersistPayload());
  } catch (e) {
    console.error('[Necro] saveToSupabase', e);
    return false;
  }
}

export function saveGameLocal() {
  try {
    const data = {
      v: SAVE_VERSION,
      bones: GameState.bones,
      upgrades: { ...GameState.upgrades },
      graveGoods: GameState.graveGoods,
      worldEssence: GameState.worldEssence,
      dimensionsCompleted: GameState.dimensionsCompleted,
      dimensionMultiplier: GameState.dimensionMultiplier,
      lifetimeBonesThisRun: GameState.lifetimeBonesThisRun,
      expeditionState: {
        currentMap: GameState.expeditionState.currentMap,
        activeUnits: { ...GameState.expeditionState.activeUnits },
        explorationProgress: GameState.expeditionState.explorationProgress,
        running: GameState.expeditionState.running,
        deployedThisRun: GameState.expeditionState.deployedThisRun,
      },
      artifactsOwned: { ...GameState.artifactsOwned },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('necro-game-saved'));
    return true;
  } catch (e) {
    console.warn('saveGameLocal', e);
    return false;
  }
}

export async function saveGame() {
  try {
    const cloud = await saveToSupabase();
    if (!cloud) {
      saveGameLocal();
    } else {
      document.dispatchEvent(new CustomEvent('necro-game-saved'));
    }
    return true;
  } catch (e) {
    console.error('[Necro] saveGame', e);
    try {
      saveGameLocal();
    } catch (e2) {
      console.error('[Necro] saveGameLocal fallback', e2);
    }
    return false;
  }
}

const SAVE_KEY_LEGACY = 'necromancer-idle-save-v2';

export function loadGameLocal() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) raw = localStorage.getItem(SAVE_KEY_LEGACY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (typeof data.upgrades !== 'object') return false;

    if (data.v === SAVE_VERSION) {
      applyLoadedState({
        bones: data.bones,
        grave_goods: data.graveGoods,
        world_essence: data.worldEssence,
        dimensions_completed: data.dimensionsCompleted,
        dimension_multiplier: data.dimensionMultiplier,
        lifetime_bones_this_run: data.lifetimeBonesThisRun,
        upgrades: data.upgrades,
        expedition_state: data.expeditionState,
        artifacts_owned: data.artifactsOwned,
      });
      return true;
    }
    if (data.v === 2) {
      applyLoadedState({
        bones: data.bones,
        grave_goods: data.graveGoods,
        world_essence: data.worldEssence,
        dimensions_completed: data.dimensionsCompleted,
        dimension_multiplier: data.dimensionMultiplier,
        lifetime_bones_this_run: data.lifetimeBonesThisRun,
        upgrades: data.upgrades,
      });
      return true;
    }
    if (data.v === 1) {
      applyLoadedState({
        bones: data.bones,
        grave_goods: data.graveGoods,
        world_essence: data.worldEssence,
        dimensions_completed: 0,
        dimension_multiplier: 1,
        lifetime_bones_this_run: 0,
        upgrades: data.upgrades,
      });
      return true;
    }
    return false;
  } catch (e) {
    console.warn('loadGameLocal', e);
    return false;
  }
}

export async function loadFromSupabase() {
  const auth = await getCurrentUserId();
  if (!auth) return false;
  const row = await fetchUserProgress(auth.userId);
  if (!row) return false;
  applyLoadedState({
    bones: row.bones,
    grave_goods: row.grave_goods,
    world_essence: row.world_essence,
    dimensions_completed: row.dimensions_completed,
    dimension_multiplier: row.dimension_multiplier,
    lifetime_bones_this_run: row.lifetime_bones_this_run,
    upgrades: row.upgrades,
    expedition_state: row.expedition_state,
    artifacts_owned: row.artifacts_owned,
  });
  return true;
}

/** Supabase zuerst (wenn eingeloggt + Zeile), sonst localStorage */
export async function loadGameAsync() {
  const fromCloud = await loadFromSupabase();
  if (fromCloud) return true;
  return loadGameLocal();
}

export function startPassiveLoop() {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    tickPassive(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
