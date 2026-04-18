import {
  AUTOSAVE_MS,
  COMBO_WINDOW_MS,
  LOCAL_SAVE_KEY,
  PRESTIGE_BASE,
  PRESTIGE_GROWTH,
  SAVE_SCHEMA_VERSION,
} from "../data/constants";
import { GAMBLER_ASSET_IDS, GAMBLER_ASSETS, type GamblerAssetDef } from "../data/gamblerAssets";
import {
  PPC_SHOP_UPGRADES,
  PPS_SHOP_UPGRADES,
  SHOP_UPGRADE_IDS,
  SHOP_UPGRADES_ALL,
} from "../data/shopUpgrades";
import type { ActiveEffect, EconomyState, GameSnapshot, MetaState, SessionState } from "./types";

const canStructuredClone = typeof globalThis.structuredClone === "function";

function deepClone<T>(value: T): T {
  if (canStructuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function ipadTouchPpcBonus(): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return 1;
  const narrow = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (narrow && coarse) return 1.09;
  if (narrow) return 1.05;
  return 1;
}

export function makeDefaultState(): GameSnapshot {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      chips: 0,
      lifetimeChips: 0,
      clickBase: 1,
      ppsBonusFlat: 0,
      clickBonusFlat: 0,
      comboBonus: 0,
      comboWindowBonus: 0,
      offlineEff: 0.3,
      assets: Object.fromEntries(GAMBLER_ASSETS.map((a) => [a.id, 0])),
      boughtUpgrades: [],
      bulk: 1,
      discountBuys: 0,
    },
    meta: {
      prestige: 0,
      prestigePoints: 0,
    },
    session: {
      runToken: Date.now(),
      producedRun: 0,
      clicksRun: 0,
      maxCombo: 0,
      activeEffects: [],
      comboCount: 0,
      comboUntil: 0,
      discoveredAssets: { luckyCharm: true },
      discoveredUpgrades: {},
      lastSaveAt: 0,
    },
    cosmetics: {
      skin: "default",
    },
  };
}

function migrateSave(raw: unknown): GameSnapshot {
  const fresh = makeDefaultState();
  if (!raw || typeof raw !== "object") return fresh;
  const r = raw as Record<string, unknown>;
  const e = (r.economy ?? {}) as Record<string, unknown>;
  const boughtKnown = Array.isArray(e.boughtUpgrades)
    ? (e.boughtUpgrades as string[]).filter((id) => SHOP_UPGRADE_IDS.has(id))
    : [];

  const metaRaw = (r.meta ?? {}) as Record<string, unknown>;
  const sessionRaw = (r.session ?? {}) as Record<string, unknown>;

  const rawAssets = (e.assets ?? e.buildings) as Record<string, number> | undefined;
  const assetsMerged = { ...fresh.economy.assets };
  if (rawAssets) {
    for (const id of GAMBLER_ASSET_IDS) {
      if (typeof rawAssets[id] === "number") assetsMerged[id] = rawAssets[id];
    }
  }

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      ...fresh.economy,
      chips: Number(e.chips ?? e.pixel) || 0,
      lifetimeChips: Number(e.lifetimeChips ?? e.lifetimePixel) || 0,
      clickBase: Number(e.clickBase) || 1,
      assets: assetsMerged,
      boughtUpgrades: boughtKnown,
      bulk: Number(e.bulk) || 1,
      discountBuys: Number(e.discountBuys) || 0,
      comboBonus: Number(e.comboBonus) || 0,
      comboWindowBonus: Number(e.comboWindowBonus) || 0,
      offlineEff: Number.isFinite(Number(e.offlineEff)) ? Number(e.offlineEff) : 0.3,
    },
    meta: {
      prestige: Math.max(0, Math.floor(Number(metaRaw.prestige) || 0)),
      prestigePoints: Math.max(0, Math.floor(Number(metaRaw.prestigePoints) || 0)),
    },
    session: {
      ...fresh.session,
      runToken: Date.now(),
      producedRun: Number(sessionRaw.producedRun) || 0,
      clicksRun: Number(sessionRaw.clicksRun) || 0,
      maxCombo: Number(sessionRaw.maxCombo) || 0,
      activeEffects: [],
      comboCount: Number(sessionRaw.comboCount) || 0,
      comboUntil: Number(sessionRaw.comboUntil) || 0,
      discoveredAssets: {
        ...fresh.session.discoveredAssets,
        ...((sessionRaw.discoveredAssets ?? sessionRaw.discoveredBuildings) as Record<string, boolean> | undefined),
      },
      discoveredUpgrades: {
        ...fresh.session.discoveredUpgrades,
        ...(sessionRaw.discoveredUpgrades as Record<string, boolean> | undefined),
      },
      lastSaveAt: Number(sessionRaw.lastSaveAt) || 0,
    },
    cosmetics: { ...fresh.cosmetics, ...(r.cosmetics as Record<string, string> | undefined) },
  };
}

export class GameStateManager {
  private state: GameSnapshot;
  private autosaveAcc = 0;

  constructor() {
    this.state = makeDefaultState();
  }

  get snapshot(): Readonly<GameSnapshot> {
    return this.state;
  }

  get economy(): Readonly<EconomyState> {
    return this.state.economy;
  }

  get meta(): Readonly<MetaState> {
    return this.state.meta;
  }

  get session(): Readonly<SessionState> {
    return this.state.session;
  }

  prestigeThreshold(): number {
    return Math.floor(PRESTIGE_BASE * Math.pow(PRESTIGE_GROWTH, this.state.meta.prestige));
  }

  calcPrestigeGain(): number {
    return 1;
  }

  effectiveComboWindowMs(): number {
    return COMBO_WINDOW_MS + this.state.economy.comboWindowBonus;
  }

  getComboMult(): number {
    if (Date.now() > this.state.session.comboUntil) return 1;
    const base = 1 + Math.min(1.7, this.state.session.comboCount * (0.045 + this.state.economy.comboBonus));
    return base;
  }

  activeMult(key: ActiveEffect["key"]): number {
    let m = 1;
    for (const e of this.state.session.activeEffects) {
      if (e.key === key) m *= e.mult;
    }
    return m;
  }

  currentPps(): number {
    let pps = this.state.economy.ppsBonusFlat || 0;
    for (const a of GAMBLER_ASSETS) {
      pps += (this.state.economy.assets[a.id] || 0) * a.pps;
    }
    return pps * this.activeMult("prod");
  }

  currentPpk(): number {
    let progressClickBoost =
      1 + Math.log10(this.state.economy.lifetimeChips + 10) * 0.4 + this.state.meta.prestige * 0.2;

    if (this.state.economy.lifetimeChips < 50_000) progressClickBoost *= 1.85;
    else if (this.state.economy.lifetimeChips < 2_000_000) progressClickBoost *= 1.5;
    else if (this.state.economy.lifetimeChips < 80_000_000) progressClickBoost *= 1.22;

    const clickFlat = (this.state.economy.clickBase || 1) + (this.state.economy.clickBonusFlat || 0);
    return clickFlat * progressClickBoost * this.getComboMult() * this.activeMult("click") * ipadTouchPpcBonus();
  }

  assetCost(asset: GamblerAssetDef, extraIndex = 0): number {
    const count = (this.state.economy.assets[asset.id] || 0) + extraIndex;
    let cost = Math.floor(asset.baseCost * Math.pow(asset.growth, count));
    if (this.state.economy.discountBuys > 0) cost = Math.floor(cost * 0.75);
    return cost;
  }

  canBuyAssetAmount(asset: GamblerAssetDef, amount: number): number {
    let left = this.state.economy.chips;
    let bought = 0;
    for (let i = 0; i < amount; i += 1) {
      const c = this.assetCost(asset, i);
      if (left < c) break;
      left -= c;
      bought += 1;
    }
    return bought;
  }

  buyAsset(id: string): void {
    const a = GAMBLER_ASSETS.find((x) => x.id === id);
    if (!a || !this.state.session.discoveredAssets[id]) return;
    let target = this.state.economy.bulk;
    if (target === 0) target = 9999;
    const can = this.canBuyAssetAmount(a, target);
    if (can <= 0) return;

    let total = 0;
    for (let i = 0; i < can; i += 1) total += this.assetCost(a, i);
    this.state.economy.chips -= total;
    this.state.economy.assets[id] += can;
    if (this.state.economy.discountBuys > 0) {
      this.state.economy.discountBuys = Math.max(0, this.state.economy.discountBuys - 1);
    }
  }

  setBulk(amount: number): void {
    if (!Number.isFinite(amount)) return;
    const floored = Math.floor(amount);
    if (floored === 0) {
      this.state.economy.bulk = 0;
      return;
    }
    this.state.economy.bulk = Math.max(1, floored);
  }

  buyShopUpgrade(id: string): void {
    const u = SHOP_UPGRADES_ALL.find((x) => x.id === id);
    if (!u || !this.state.session.discoveredUpgrades[id]) return;
    if (this.state.economy.boughtUpgrades.includes(id)) return;
    if (this.state.economy.chips < u.cost) return;
    this.state.economy.chips -= u.cost;
    this.state.economy.boughtUpgrades.push(id);
    this.recomputeUpgradeBonuses();
  }

  recomputeUpgradeBonuses(): void {
    let pps = 0;
    let clk = 0;
    for (const id of this.state.economy.boughtUpgrades) {
      const p = PPS_SHOP_UPGRADES.find((x) => x.id === id);
      if (p) pps += p.pps;
      const c = PPC_SHOP_UPGRADES.find((x) => x.id === id);
      if (c) clk += c.click;
    }
    this.state.economy.ppsBonusFlat = pps;
    this.state.economy.clickBonusFlat = clk;
  }

  addChips(amount: number): void {
    if (amount <= 0) return;
    this.state.economy.chips += amount;
    this.state.economy.lifetimeChips += amount;
    this.state.session.producedRun += amount;
  }

  tickEffects(): void {
    const now = Date.now();
    this.state.session.activeEffects = this.state.session.activeEffects.filter((e) => e.until > now);
  }

  discoverUnlocks(): void {
    for (const a of GAMBLER_ASSETS) {
      if (this.state.session.discoveredAssets[a.id]) continue;
      if (this.state.economy.chips >= a.unlockAt) this.state.session.discoveredAssets[a.id] = true;
    }
    for (const u of SHOP_UPGRADES_ALL) {
      if (this.state.session.discoveredUpgrades[u.id]) continue;
      if (this.state.economy.chips >= u.unlockAt) this.state.session.discoveredUpgrades[u.id] = true;
    }
  }

  doPrestige(): boolean {
    if (this.state.economy.lifetimeChips < this.prestigeThreshold()) return false;
    this.state.meta.prestige += 1;
    this.state.meta.prestigePoints += this.calcPrestigeGain();

    const keepMeta = deepClone(this.state.meta);
    const keepCos = deepClone(this.state.cosmetics);
    const fresh = makeDefaultState();
    const nextRunToken = Date.now();
    this.state.economy = fresh.economy;
    this.state.session = fresh.session;
    this.state.session.runToken = nextRunToken;
    this.state.meta = keepMeta;
    this.state.cosmetics = keepCos;

    this.recomputeUpgradeBonuses();
    return true;
  }

  /**
   * Klick = Einsatz: Chips nach v2-Klickformel; `crit` nur für VFX (kein extra Multiplikator).
   */
  registerClick(critChance = 0.1): { ppk: number; crit: boolean } {
    const ppk = this.currentPpk();
    const crit = Math.random() < critChance;
    this.addChips(ppk);
    this.state.session.clicksRun += 1;
    const now = Date.now();
    const win = this.effectiveComboWindowMs();
    if (now <= this.state.session.comboUntil) this.state.session.comboCount += 1;
    else this.state.session.comboCount = 1;
    this.state.session.comboUntil = now + win;
    this.state.session.maxCombo = Math.max(this.state.session.maxCombo || 0, this.state.session.comboCount);
    return { ppk, crit };
  }

  tick(dt: number): void {
    this.discoverUnlocks();
    this.tickEffects();
    this.addChips(this.currentPps() * dt);

    this.autosaveAcc += dt * 1000;
    if (this.autosaveAcc >= AUTOSAVE_MS) {
      this.autosaveAcc = 0;
      this.saveToLocalStorage();
    }
  }

  loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(LOCAL_SAVE_KEY);
      if (!raw) {
        this.recomputeUpgradeBonuses();
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      this.state = migrateSave(parsed);
      this.recomputeUpgradeBonuses();
      this.applyOfflineCatchup(this.state.session.lastSaveAt);
    } catch {
      this.state = makeDefaultState();
      this.recomputeUpgradeBonuses();
    }
  }

  /** Vereinfachte Offline-Zeit: Anteil der PPS als Chips (wie grobe v2-Offline-Idee). */
  private applyOfflineCatchup(lastSaveAt: number): void {
    if (!lastSaveAt || lastSaveAt > Date.now()) return;
    const maxMs = 1000 * 60 * 60 * 8;
    const dt = Math.min(Date.now() - lastSaveAt, maxMs) / 1000;
    const eff = this.state.economy.offlineEff;
    this.addChips(this.currentPps() * dt * eff);
  }

  saveToLocalStorage(): void {
    try {
      this.state.session.lastSaveAt = Date.now();
      const payload = deepClone(this.state);
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }

  resetToDefaults(): void {
    this.state = makeDefaultState();
    this.recomputeUpgradeBonuses();
  }
}

export const gameState = new GameStateManager();
