import type { MissionDef } from "../data/buildings";

export interface ActiveEffect {
  /** `missionReward` skaliert Missions-Belohnungen (v2 `activeMult`). */
  key: "prod" | "click" | "missionReward";
  mult: number;
  until: number;
  label: string;
}

export interface MissionRuntime extends MissionDef {
  target: number;
  progress: number;
  done: boolean;
}

export interface EconomyState {
  pixel: number;
  lifetimePixel: number;
  clickBase: number;
  ppsBonusFlat: number;
  clickBonusFlat: number;
  comboBonus: number;
  comboWindowBonus: number;
  offlineEff: number;
  buildings: Record<string, number>;
  boughtUpgrades: string[];
  bulk: number;
  discountBuys: number;
}

export interface MetaState {
  prestige: number;
  prestigePoints: number;
  /** Prestige-Skillbaum: Stufen pro Knoten-ID */
  skillLevels: Record<string, number>;
}

/** Slot-Mutation (Events): temporäre PPS-/Klick-Multiplikatoren, persistiert im Save. */
export interface MutationSlotState {
  prodMult: number;
  clickMult: number;
  until: number;
  lastRoll: string[];
}

export interface SessionState {
  runToken: number;
  producedRun: number;
  clicksRun: number;
  maxCombo: number;
  missions: MissionRuntime[];
  activeEffects: ActiveEffect[];
  nextMissionRefreshAt: number;
  comboCount: number;
  comboUntil: number;
  discoveredBuildings: Record<string, boolean>;
  discoveredUpgrades: Record<string, boolean>;
  lastSaveAt: number;
  mutation: MutationSlotState;
}

export interface CosmeticsState {
  skin: string;
}

/** Spielzustand – Schema-Version 5 (kompatibel mit migrateSaveToCurrent aus v2 + skillLevels). */
export interface GameSnapshot {
  schemaVersion: number;
  economy: EconomyState;
  meta: MetaState;
  session: SessionState;
  cosmetics: CosmeticsState;
}
