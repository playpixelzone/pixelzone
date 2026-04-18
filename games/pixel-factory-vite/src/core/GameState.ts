import {
  BUILDINGS,
  MISSIONS,
  PPC_SHOP_UPGRADES,
  PPS_SHOP_UPGRADES,
  SHOP_UPGRADE_IDS,
  SHOP_UPGRADES_ALL,
  type BuildingDef,
} from "../data/buildings";
import {
  AUTOSAVE_MS,
  COMBO_WINDOW_MS,
  LOCAL_SAVE_KEY,
  PRESTIGE_BASE,
  PRESTIGE_GROWTH,
  SAVE_SCHEMA_VERSION,
} from "../data/constants";
import { computeSkillBonuses, isSkillUnlocked, SKILL_NODE_BY_ID, skillCostAt } from "../data/skillTree";
import { fmtNumber } from "./format";
import type {
  ActiveEffect,
  EconomyState,
  GameSnapshot,
  MetaState,
  MissionRuntime,
  MutationSlotState,
  SessionState,
} from "./types";

const canStructuredClone = typeof globalThis.structuredClone === "function";

function deepClone<T>(value: T): T {
  if (canStructuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function migrateMutationSlot(raw: unknown, fresh: MutationSlotState): MutationSlotState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...fresh };
  const o = raw as Record<string, unknown>;
  const lastRoll = Array.isArray(o.lastRoll) ? o.lastRoll.map((x) => String(x)) : [];
  return {
    prodMult: Number.isFinite(Number(o.prodMult)) ? Number(o.prodMult) : 1,
    clickMult: Number.isFinite(Number(o.clickMult)) ? Number(o.clickMult) : 1,
    until: Number(o.until) || 0,
    lastRoll,
  };
}

function msBisNaechsteHalbeStunde(): number {
  const jetzt = new Date();
  const minuten = jetzt.getMinutes();
  const sekunden = jetzt.getSeconds();
  const ms = jetzt.getMilliseconds();
  const sekBis = (minuten < 30 ? 30 - minuten : 60 - minuten) * 60 - sekunden;
  return sekBis * 1000 - ms;
}

function naechsterMissionenWechselZeitpunkt(): number {
  return Date.now() + msBisNaechsteHalbeStunde();
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
      skillLevels: {},
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
      mutation: {
        prodMult: 1,
        clickMult: 1,
        until: 0,
        lastRoll: [],
      },
    },
    cosmetics: {
      skin: "default",
    },
  };
}

/**
 * Übernimmt ältere Save-Versionen (v3/v4/…) und Cloud-Payloads in Schema v5.
 * Erweiterung: `meta.skillLevels` (fehlend → leeres Objekt).
 */
export function migrateSaveToCurrent(raw: unknown): GameSnapshot {
  const fresh = makeDefaultState();
  if (!raw || typeof raw !== "object") return fresh;

  const r = raw as Record<string, unknown>;
  const e = (r.economy ?? {}) as Record<string, unknown>;
  const boughtKnown = Array.isArray(e.boughtUpgrades)
    ? (e.boughtUpgrades as string[]).filter((id) => SHOP_UPGRADE_IDS.has(id))
    : [];

  const metaRaw = (r.meta ?? {}) as Record<string, unknown>;
  const skillRaw = metaRaw.skillLevels;
  const skillLevels: Record<string, number> =
    skillRaw && typeof skillRaw === "object" && !Array.isArray(skillRaw)
      ? Object.fromEntries(
          Object.entries(skillRaw as Record<string, unknown>).map(([k, v]) => [k, Math.max(0, Math.floor(Number(v) || 0))]),
        )
      : {};

  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      ...fresh.economy,
      pixel: Number(e.pixel) || 0,
      lifetimePixel: Number(e.lifetimePixel) || 0,
      clickBase: Number(e.clickBase) || 1,
      buildings: { ...fresh.economy.buildings, ...((e.buildings ?? {}) as Record<string, number>) },
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
      skillLevels,
    },
    session: {
      ...fresh.session,
      runToken: Date.now(),
      producedRun: Number((r.session as Record<string, unknown>)?.producedRun) || 0,
      clicksRun: Number((r.session as Record<string, unknown>)?.clicksRun) || 0,
      maxCombo: Number((r.session as Record<string, unknown>)?.maxCombo) || 0,
      missions: Array.isArray((r.session as Record<string, unknown>)?.missions)
        ? ((r.session as Record<string, unknown>).missions as MissionRuntime[])
        : fresh.session.missions,
      nextMissionRefreshAt:
        Number((r.session as Record<string, unknown>)?.nextMissionRefreshAt) || fresh.session.nextMissionRefreshAt,
      activeEffects: [],
      discoveredBuildings: {
        ...fresh.session.discoveredBuildings,
        ...((r.session as Record<string, unknown>)?.discoveredBuildings as Record<string, boolean> | undefined),
      },
      discoveredUpgrades: {
        ...fresh.session.discoveredUpgrades,
        ...((r.session as Record<string, unknown>)?.discoveredUpgrades as Record<string, boolean> | undefined),
      },
      lastSaveAt: Number((r.session as Record<string, unknown>)?.lastSaveAt) || 0,
      mutation: migrateMutationSlot((r.session as Record<string, unknown>)?.mutation, fresh.session.mutation),
    },
    cosmetics: { ...fresh.cosmetics, ...(r.cosmetics as Record<string, string> | undefined) },
  };
}

export class GameStateManager {
  private state: GameSnapshot;
  private autosaveAcc = 0;
  /** Callback z. B. für Toasts (optional). */
  onToast: ((msg: string) => void) | null = null;

  constructor() {
    this.state = makeDefaultState();
  }

  get snapshot(): Readonly<GameSnapshot> {
    return this.state;
  }

  /** Direkter Zugriff für Phaser/UI (sparsam nutzen). */
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

  private skillFx() {
    return computeSkillBonuses(this.state.meta.skillLevels);
  }

  /** Kombo-Fenster inkl. Skills (für HUD & Klicks). */
  effectiveComboWindowMs(): number {
    return COMBO_WINDOW_MS + this.state.economy.comboWindowBonus + this.skillFx().comboWindowMsBonus;
  }

  /** Slot-Mutation (Events): Multiplikatoren solange `until` in der Zukunft liegt. */
  private getMutationFactors(): { prod: number; click: number } {
    const m = this.state.session.mutation;
    if (!m || Date.now() >= m.until) return { prod: 1, click: 1 };
    return { prod: m.prodMult, click: m.clickMult };
  }

  /**
   * Wendet ein Slot-Ergebnis an und speichert. Triple &gt; Paar &gt; keine Übereinstimmung.
   */
  applySlotMutation(triple: string[]): string {
    const now = Date.now();
    const [a, b, c] = triple;
    let prod = 1.03;
    let clk = 1.03;
    let dur = 45_000;
    let summary: string;
    if (a === b && b === c) {
      prod = 1.15;
      clk = 1.12;
      dur = 120_000;
      summary = `Triple! +${Math.round((prod - 1) * 100)}% PPS, +${Math.round((clk - 1) * 100)}% Klick – 2 Min`;
    } else if (a === b || b === c || a === c) {
      prod = 1.08;
      clk = 1.07;
      dur = 75_000;
      summary = `Paar! +${Math.round((prod - 1) * 100)}% PPS, +${Math.round((clk - 1) * 100)}% Klick – 75s`;
    } else {
      summary = `Spin: +${Math.round((prod - 1) * 100)}% PPS & Klick – 45s`;
    }
    this.state.session.mutation = {
      prodMult: prod,
      clickMult: clk,
      until: now + dur,
      lastRoll: [...triple],
    };
    this.saveToLocalStorage();
    return summary;
  }

  /** Kurzzeile für UI (leer wenn abgelaufen). */
  getMutationStatusLine(): string {
    const m = this.state.session.mutation;
    if (!m || Date.now() >= m.until || m.prodMult <= 1.001) return "";
    const left = Math.max(0, m.until - Date.now());
    const s = Math.ceil(left / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    const pp = Math.round((m.prodMult - 1) * 100);
    const pc = Math.round((m.clickMult - 1) * 100);
    return `Mutation aktiv: +${pp}% PPS, +${pc}% Klick · ${mm}:${String(ss).padStart(2, "0")}`;
  }

  currentPps(): number {
    let pps = this.state.economy.ppsBonusFlat || 0;
    for (const b of BUILDINGS) pps += (this.state.economy.buildings[b.id] || 0) * b.pps;
    const { prod } = this.getMutationFactors();
    const sk = this.skillFx();
    return pps * this.activeMult("prod") * prod * sk.ppsMult;
  }

  currentPpk(): number {
    let progressClickBoost =
      1 + Math.log10(this.state.economy.lifetimePixel + 10) * 0.4 + this.state.meta.prestige * 0.2;

    if (this.state.economy.lifetimePixel < 50_000) progressClickBoost *= 1.85;
    else if (this.state.economy.lifetimePixel < 2_000_000) progressClickBoost *= 1.5;
    else if (this.state.economy.lifetimePixel < 80_000_000) progressClickBoost *= 1.22;

    const clickFlat = (this.state.economy.clickBase || 1) + (this.state.economy.clickBonusFlat || 0);
    const { click } = this.getMutationFactors();
    const sk = this.skillFx();
    return clickFlat * progressClickBoost * this.getComboMult() * this.activeMult("click") * ipadTouchPpcBonus() * click * sk.clickMult;
  }

  missionScaledTarget(base: number): number {
    const p = this.state.meta.prestige;
    return Math.floor(base * (1 + p * 0.7));
  }

  missionRewardScaled(v: number): number {
    return Math.floor(
      v * (1 + this.state.meta.prestige * 0.3) * this.activeMult("missionReward") * this.skillFx().missionRewardMult,
    );
  }

  buildingCost(b: BuildingDef, extraIndex = 0): number {
    const count = (this.state.economy.buildings[b.id] || 0) + extraIndex;
    let cost = Math.floor(b.baseCost * Math.pow(b.growth, count));
    if (this.state.economy.discountBuys > 0) cost = Math.floor(cost * 0.75);
    return cost;
  }

  canBuyBuildingAmount(b: BuildingDef, amount: number): number {
    let left = this.state.economy.pixel;
    let bought = 0;
    for (let i = 0; i < amount; i += 1) {
      const c = this.buildingCost(b, i);
      if (left < c) break;
      left -= c;
      bought += 1;
    }
    return bought;
  }

  buyBuilding(id: string): void {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b || !this.state.session.discoveredBuildings[id]) return;
    let target = this.state.economy.bulk;
    if (target === 0) target = 9999;
    const can = this.canBuyBuildingAmount(b, target);
    if (can <= 0) return;

    let total = 0;
    for (let i = 0; i < can; i += 1) total += this.buildingCost(b, i);
    this.state.economy.pixel -= total;
    this.state.economy.buildings[id] += can;
    if (this.state.economy.discountBuys > 0) {
      this.state.economy.discountBuys = Math.max(0, this.state.economy.discountBuys - 1);
    }
  }

  /** `0` = Max-Kauf (wie v2). */
  setBulk(amount: number): void {
    if (!Number.isFinite(amount)) return;
    const a = Math.floor(amount);
    if (a === 0) {
      this.state.economy.bulk = 0;
      return;
    }
    this.state.economy.bulk = Math.max(1, a);
  }

  buyShopUpgrade(id: string): void {
    const u = SHOP_UPGRADES_ALL.find((x) => x.id === id);
    if (!u || !this.state.session.discoveredUpgrades[id]) return;
    if (this.state.economy.boughtUpgrades.includes(id)) return;
    if (this.state.economy.pixel < u.cost) return;
    this.state.economy.pixel -= u.cost;
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

  /**
   * Prestigepunkt-Skill kaufen. Parent-Stufe ≥ 1 schaltet Children sofort frei
   * (`isSkillUnlocked`); hier keine zusätzliche Sperre.
   */
  buySkill(nodeId: string): boolean {
    const node = SKILL_NODE_BY_ID.get(nodeId);
    if (!node) return false;
    if (!isSkillUnlocked(this.state.meta.skillLevels, nodeId)) return false;
    const lvl = this.state.meta.skillLevels[nodeId] ?? 0;
    if (lvl >= node.maxLevel) return false;
    const cost = skillCostAt(node, lvl);
    if (this.state.meta.prestigePoints < cost) return false;
    this.state.meta.prestigePoints -= cost;
    this.state.meta.skillLevels[nodeId] = lvl + 1;
    return true;
  }

  addPixels(amount: number, reason = ""): void {
    if (amount <= 0) return;
    this.state.economy.pixel += amount;
    this.state.economy.lifetimePixel += amount;
    this.state.session.producedRun += amount;
    if (reason && this.onToast) {
      this.onToast(`+${fmtNumber(amount)} Pixel · ${reason}`);
    }
  }

  addTimed(key: ActiveEffect["key"], mult: number, seconds: number, label: string): void {
    this.state.session.activeEffects.push({ key, mult, until: Date.now() + seconds * 1000, label });
  }

  tickEffects(): void {
    const now = Date.now();
    this.state.session.activeEffects = this.state.session.activeEffects.filter((e) => e.until > now);
  }

  discoverUnlocks(): void {
    for (const b of BUILDINGS) {
      if (this.state.session.discoveredBuildings[b.id]) continue;
      if (this.state.economy.pixel >= b.unlockAt) this.state.session.discoveredBuildings[b.id] = true;
    }
    for (const u of SHOP_UPGRADES_ALL) {
      if (this.state.session.discoveredUpgrades[u.id]) continue;
      if (this.state.economy.pixel >= u.unlockAt) this.state.session.discoveredUpgrades[u.id] = true;
    }
  }

  randomMissionSet(): void {
    const pool = [...MISSIONS];
    const out: MissionRuntime[] = [];
    while (out.length < 3 && pool.length > 0) {
      const i = Math.floor(Math.random() * pool.length);
      const m = pool.splice(i, 1)[0]!;
      const target = this.missionScaledTarget(m.baseTarget);
      out.push({ ...m, target, progress: 0, done: false });
    }
    this.state.session.missions = out;
    this.state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
  }

  missionProgress(m: MissionRuntime): number {
    if (m.type === "produce") return this.state.session.producedRun;
    if (m.type === "clicks") return this.state.session.clicksRun;
    if (m.type === "combo") return this.state.session.maxCombo;
    return 0;
  }

  private completeMission(m: MissionRuntime): void {
    m.done = true;
    if (m.reward.pixel) this.addPixels(this.missionRewardScaled(m.reward.pixel), "Mission");
    if (m.reward.timedProd) this.addTimed("prod", m.reward.timedProd, 45, "Missions-Boost");
    if (m.reward.timedClick) this.addTimed("click", m.reward.timedClick, 45, "Missions-Boost");
    if (this.onToast) this.onToast(`Mission geschafft: ${m.name}`);
  }

  updateMissions(): void {
    if (!this.state.session.nextMissionRefreshAt) {
      this.state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
    }
    if (Date.now() >= this.state.session.nextMissionRefreshAt) {
      this.randomMissionSet();
      if (this.onToast) this.onToast("Neue Missionen sind eingetroffen.");
    }
    for (const m of this.state.session.missions) {
      if (m.done) continue;
      m.progress = Math.min(m.target, this.missionProgress(m));
      if (m.progress >= m.target) this.completeMission(m);
    }
  }

  applyOfflineBonus(lastTs: number): void {
    if (!lastTs) return;
    const delta = Math.max(0, Date.now() - lastTs);
    if (delta < 60000) return;
    const hours = Math.min(18, delta / 3600000);
    const eff = Math.min(0.78, this.state.economy.offlineEff + this.skillFx().offlineEffAdd);
    const bonus = this.currentPps() * hours * 3600 * eff;
    this.addPixels(bonus, "Offline");
  }

  doPrestige(): boolean {
    if (this.state.economy.lifetimePixel < this.prestigeThreshold()) return false;
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

    this.randomMissionSet();
    this.recomputeUpgradeBonuses();
    return true;
  }

  /**
   * Spieler-Klick: Pixel + Kombo. `critChance` nur für VFX (Balance bleibt `ppk`).
   */
  registerClick(critChance = 0.1): { ppk: number; crit: boolean } {
    const ppk = this.currentPpk();
    const crit = Math.random() < critChance;
    this.addPixels(ppk);
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
    this.addPixels(this.currentPps() * dt);
    this.updateMissions();

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
        this.randomMissionSet();
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const migrated = migrateSaveToCurrent(parsed);
      const fresh = makeDefaultState();
      this.state.economy = {
        ...fresh.economy,
        ...migrated.economy,
        buildings: { ...fresh.economy.buildings, ...migrated.economy.buildings },
      };
      this.state.meta = { ...fresh.meta, ...migrated.meta, skillLevels: { ...fresh.meta.skillLevels, ...migrated.meta.skillLevels } };
      this.state.session = {
        ...fresh.session,
        ...migrated.session,
        discoveredBuildings: { ...fresh.session.discoveredBuildings, ...migrated.session.discoveredBuildings },
        discoveredUpgrades: { ...fresh.session.discoveredUpgrades, ...migrated.session.discoveredUpgrades },
      };
      this.state.cosmetics = { ...fresh.cosmetics, ...migrated.cosmetics };
      this.state.schemaVersion = SAVE_SCHEMA_VERSION;

      if (!Array.isArray(this.state.session.missions) || this.state.session.missions.length === 0) {
        this.randomMissionSet();
      }
      if (this.state.session.nextMissionRefreshAt < Date.now()) this.randomMissionSet();
      this.recomputeUpgradeBonuses();
      this.applyOfflineBonus(this.state.session.lastSaveAt);
    } catch {
      this.state = makeDefaultState();
      this.randomMissionSet();
    }
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

  /** Admin / Tests: Setzt Run zurück. */
  resetToDefaults(): void {
    this.state = makeDefaultState();
    this.randomMissionSet();
    this.recomputeUpgradeBonuses();
  }
}

export const gameState = new GameStateManager();
