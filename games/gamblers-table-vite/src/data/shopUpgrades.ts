/** Additiv zu Passiv-Chips/s (linkes Shop-Upgrade später am Tablett). */
export interface PpsShopUpgradeDef {
  id: string;
  name: string;
  desc: string;
  pps: number;
  cost: number;
  unlockAt: number;
}

export const PPS_SHOP_UPGRADES: PpsShopUpgradeDef[] = [
  { id: "ps_1", name: "Schmieregeld", desc: "+18 Chips/s", pps: 18, cost: 580, unlockAt: 280 },
  { id: "ps_2", name: "Insider-Tipp", desc: "+85 Chips/s", pps: 85, cost: 4800, unlockAt: 2600 },
  { id: "ps_3", name: "VIP-Zugang", desc: "+420 Chips/s", pps: 420, cost: 39500, unlockAt: 20000 },
  { id: "ps_4", name: "Haus-Analyse", desc: "+3.800 Chips/s", pps: 3800, cost: 365000, unlockAt: 180000 },
  { id: "ps_5", name: "Parallel-Spiele", desc: "+32.000 Chips/s", pps: 32000, cost: 2950000, unlockAt: 1900000 },
];

/** Additiv zur Einsatzkraft (Klick), rechte Spalte. */
export interface PpcShopUpgradeDef {
  id: string;
  name: string;
  desc: string;
  click: number;
  cost: number;
  unlockAt: number;
}

export const PPC_SHOP_UPGRADES: PpcShopUpgradeDef[] = [
  { id: "pc_1", name: "Kalte Hand", desc: "+3 Einsatzkraft", click: 3, cost: 52, unlockAt: 32 },
  { id: "pc_2", name: "Markierte Karten", desc: "+22 Einsatzkraft", click: 22, cost: 420, unlockAt: 200 },
  { id: "pc_3", name: "Glücks-Handschuh", desc: "+180 Einsatzkraft", click: 180, cost: 3200, unlockAt: 1500 },
  { id: "pc_4", name: "High-Roller-Finger", desc: "+1.200 Einsatzkraft", click: 1200, cost: 22000, unlockAt: 10000 },
  { id: "pc_5", name: "Neuraler Tisch", desc: "+9.500 Einsatzkraft", click: 9500, cost: 195000, unlockAt: 120000 },
];

export type ShopUpgradeDef = PpsShopUpgradeDef | PpcShopUpgradeDef;

export const SHOP_UPGRADES_ALL: ShopUpgradeDef[] = [...PPS_SHOP_UPGRADES, ...PPC_SHOP_UPGRADES];

export const SHOP_UPGRADE_IDS = new Set(SHOP_UPGRADES_ALL.map((u) => u.id));
