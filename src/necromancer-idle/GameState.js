import { UPGRADE_DEFINITIONS, getDefinitionById, priceAtLevel } from './upgrades.js';

const BASE_BONES_PER_CLICK = 1;
const SAVE_KEY = 'necromancer-idle-save-v1';
const SAVE_VERSION = 1;

const initialUpgrades = () => {
  /** @type {Record<string, number>} */
  const o = {};
  for (const u of UPGRADE_DEFINITIONS) {
    o[u.id] = 0;
  }
  return o;
};

/**
 * Zentraler Spielzustand — Knochen, Upgrade-Level, passives Einkommen.
 */
export const GameState = {
  bones: 0,
  graveGoods: 0,
  worldEssence: 0,
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

/** Für BpS / BpC (kleine Dezimalzahlen sichtbar) */
export function formatRate(value) {
  if (!rateFormatter) rateFormatter = createRateFormatter();
  if (!Number.isFinite(value)) return '0';
  if (value > 0 && value < 0.01) return value.toFixed(2);
  return rateFormatter.format(value);
}

export function getUpgradeLevel(id) {
  return GameState.upgrades[id] ?? 0;
}

export function getBonesPerSecond() {
  let total = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.type !== 'PPS') continue;
    const lv = getUpgradeLevel(def.id);
    total += lv * def.perLevel;
  }
  return total;
}

export function getBonesPerClick() {
  let fromUpgrades = 0;
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.type !== 'PPC') continue;
    const lv = getUpgradeLevel(def.id);
    fromUpgrades += lv * def.perLevel;
  }
  return BASE_BONES_PER_CLICK + fromUpgrades;
}

/**
 * Knochen-Schwelle für den nächsten Dimensions-Prestige (skaliert mit Welten-Essenz).
 */
export function getPrestigeBoneTarget() {
  const base = 100000;
  return Math.floor(base * Math.pow(1.85, GameState.worldEssence));
}

/** Fortschritt 0–100 zur nächsten Dimension */
export function getPrestigeProgressPercent() {
  const target = getPrestigeBoneTarget();
  if (target <= 0) return 0;
  return Math.min(100, (GameState.bones / target) * 100);
}

/**
 * Roh-Menge Knochen addieren (Klicks, passives Tick, Cheats).
 * Für Klicks: addBones(getBonesPerClick()) aufrufen.
 */
export function addBones(amount) {
  if (!Number.isFinite(amount) || amount === 0) return;
  GameState.bones += amount;
  dispatchStateChanged();
}

/**
 * Passives Einkommen über Δt Sekunden (interner Bruchteil für glatte BpS).
 */
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

/** Kauf: genug Knochen? */
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

export function saveGame() {
  try {
    const data = {
      v: SAVE_VERSION,
      bones: GameState.bones,
      upgrades: { ...GameState.upgrades },
      graveGoods: GameState.graveGoods,
      worldEssence: GameState.worldEssence,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent('necro-game-saved'));
    return true;
  } catch (e) {
    console.warn('saveGame', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.v !== SAVE_VERSION || typeof data.upgrades !== 'object') return false;

    GameState.bones = Math.max(0, Number(data.bones) || 0);
    GameState.graveGoods = Math.max(0, Number(data.graveGoods) || 0);
    GameState.worldEssence = Math.max(0, Math.floor(Number(data.worldEssence) || 0));

    const next = initialUpgrades();
    for (const id of Object.keys(next)) {
      const lv = data.upgrades[id];
      next[id] = Math.max(0, Math.floor(Number(lv) || 0));
    }
    GameState.upgrades = next;

    passiveRemainder = 0;
    dispatchStateChanged();
    return true;
  } catch (e) {
    console.warn('loadGame', e);
    return false;
  }
}

/** UI & Shop: regelmäßiger Sync (zusätzlich zu Events) */
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
