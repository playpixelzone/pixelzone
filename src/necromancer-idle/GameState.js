import { UPGRADE_DEFINITIONS, getDefinitionById, priceAtLevel } from './upgrades.js';
import {
  fetchUserProgress,
  getCurrentUserId,
  upsertUserProgress,
} from './necroSupabase.js';

const BASE_BONES_PER_CLICK = 1;
const SAVE_KEY = 'necromancer-idle-save-v2';
const SAVE_VERSION = 2;

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
};

let passiveRemainder = 0;

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

export function getBonesPerClick() {
  return baseBonesPerClick() * GameState.dimensionMultiplier;
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
  const bps = getBonesPerSecond();
  if (bps <= 0 || deltaSeconds <= 0) return;
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
  };
}

export async function saveToSupabase() {
  const auth = await getCurrentUserId();
  if (!auth) return false;
  return upsertUserProgress(auth.userId, buildPersistPayload());
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
  const cloud = await saveToSupabase();
  if (!cloud) {
    saveGameLocal();
  } else {
    document.dispatchEvent(new CustomEvent('necro-game-saved'));
  }
  return true;
}

export function loadGameLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
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
