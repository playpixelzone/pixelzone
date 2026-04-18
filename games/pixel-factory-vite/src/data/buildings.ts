/** Gebäude- und Shop-Definitionen aus game-rework-v2.js. */

export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  baseCost: number;
  /** Preisfaktor pro gekauftem Stück (wie v2 `growth`). */
  growth: number;
  pps: number;
  unlockAt: number;
}

export const BUILDINGS: BuildingDef[] = [
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

export interface PpsShopUpgradeDef {
  id: string;
  name: string;
  desc: string;
  pps: number;
  cost: number;
  unlockAt: number;
}

export const PPS_SHOP_UPGRADES: PpsShopUpgradeDef[] = [
  { id: "ps_1", name: "Schichtplan", desc: "+18 px/s", pps: 18, cost: 580, unlockAt: 280 },
  { id: "ps_2", name: "Qualitätskette", desc: "+85 px/s", pps: 85, cost: 4800, unlockAt: 2600 },
  { id: "ps_3", name: "Fließband-KI", desc: "+420 px/s", pps: 420, cost: 39500, unlockAt: 20000 },
  { id: "ps_4", name: "Takt-Optimierung", desc: "+3.800 px/s", pps: 3800, cost: 365000, unlockAt: 180000 },
  { id: "ps_5", name: "Parallel-Layer", desc: "+32.000 px/s", pps: 32000, cost: 2950000, unlockAt: 1900000 },
];

export interface PpcShopUpgradeDef {
  id: string;
  name: string;
  desc: string;
  click: number;
  cost: number;
  unlockAt: number;
}

export const PPC_SHOP_UPGRADES: PpcShopUpgradeDef[] = [
  { id: "pc_1", name: "Präzisions-Klick", desc: "+3 Klickkraft", click: 3, cost: 52, unlockAt: 32 },
  { id: "pc_2", name: "Servo-Hand", desc: "+22 Klickkraft", click: 22, cost: 420, unlockAt: 200 },
  { id: "pc_3", name: "Impuls-Handschuh", desc: "+180 Klickkraft", click: 180, cost: 3200, unlockAt: 1500 },
  { id: "pc_4", name: "Hyperfinger", desc: "+1.200 Klickkraft", click: 1200, cost: 22000, unlockAt: 10000 },
  { id: "pc_5", name: "Neural-Link", desc: "+9.500 Klickkraft", click: 9500, cost: 195000, unlockAt: 120000 },
];

export type ShopUpgradeDef = PpsShopUpgradeDef | PpcShopUpgradeDef;

export const SHOP_UPGRADES_ALL: ShopUpgradeDef[] = [...PPS_SHOP_UPGRADES, ...PPC_SHOP_UPGRADES];

export const SHOP_UPGRADE_IDS = new Set(SHOP_UPGRADES_ALL.map((u) => u.id));

export interface MissionDef {
  id: string;
  type: "produce" | "clicks" | "combo";
  name: string;
  desc: string;
  baseTarget: number;
  reward: {
    pixel?: number;
    timedClick?: number;
    timedProd?: number;
  };
}

export const MISSIONS: MissionDef[] = [
  { id: "m_prod_short", type: "produce", name: "Schichtziel", desc: "Produziere {target} Pixel", baseTarget: 24000, reward: { pixel: 9000 } },
  { id: "m_prod_long", type: "produce", name: "Fokuslauf", desc: "Produziere {target} Pixel", baseTarget: 140000, reward: { pixel: 65000 } },
  { id: "m_click", type: "clicks", name: "Handarbeit", desc: "Mache {target} Klicks", baseTarget: 380, reward: { pixel: 18000, timedClick: 1.55 } },
  { id: "m_combo", type: "combo", name: "Flow-Kette", desc: "Erreiche eine Kombo von {target}", baseTarget: 20, reward: { pixel: 12000, timedProd: 1.45 } },
];
