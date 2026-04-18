export interface ActiveEffect {
  key: "prod" | "click" | "missionReward";
  mult: number;
  until: number;
  label: string;
}

export interface EconomyState {
  chips: number;
  lifetimeChips: number;
  clickBase: number;
  ppsBonusFlat: number;
  clickBonusFlat: number;
  comboBonus: number;
  comboWindowBonus: number;
  offlineEff: number;
  assets: Record<string, number>;
  boughtUpgrades: string[];
  bulk: number;
  discountBuys: number;
}

export interface MetaState {
  prestige: number;
  prestigePoints: number;
}

export interface SessionState {
  runToken: number;
  producedRun: number;
  clicksRun: number;
  maxCombo: number;
  activeEffects: ActiveEffect[];
  comboCount: number;
  comboUntil: number;
  discoveredAssets: Record<string, boolean>;
  discoveredUpgrades: Record<string, boolean>;
  lastSaveAt: number;
}

export interface CosmeticsState {
  skin: string;
}

export interface GameSnapshot {
  schemaVersion: number;
  economy: EconomyState;
  meta: MetaState;
  session: SessionState;
  cosmetics: CosmeticsState;
}
