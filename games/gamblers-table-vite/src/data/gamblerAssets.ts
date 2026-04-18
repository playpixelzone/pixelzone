/**
 * Ehemals BUILDINGS (game-rework-v2.js): gleiche Kosten/PPS-Kurve pro Asset.
 * Umbenennungen: Worker→Glücksbringer, Printer→Gezinkte Würfel, Assembler→Karten-Zähler.
 */
export interface GamblerAssetDef {
  id: string;
  name: string;
  /** Kurz-Label für UI (keine Emoji-Icons). */
  shortLabel: string;
  baseCost: number;
  /** Preisfaktor pro gekauftem Stück (v2: je Gebäude leicht unterschiedlich; Mittel ~1,15). */
  growth: number;
  pps: number;
  unlockAt: number;
}

export const GAMBLER_ASSETS: GamblerAssetDef[] = [
  { id: "luckyCharm", name: "Glücksbringer", shortLabel: "GB", baseCost: 15, growth: 1.128, pps: 0.4, unlockAt: 0 },
  { id: "intern", name: "Praktikant", shortLabel: "PR", baseCost: 70, growth: 1.136, pps: 1.4, unlockAt: 50 },
  {
    id: "weightedDice",
    name: "Gezinkte Würfel",
    shortLabel: "GW",
    baseCost: 260,
    growth: 1.145,
    pps: 5.6,
    unlockAt: 170,
  },
  {
    id: "cardCounter",
    name: "Karten-Zähler",
    shortLabel: "KZ",
    baseCost: 980,
    growth: 1.154,
    pps: 16,
    unlockAt: 650,
  },
  { id: "robot", name: "Roboterarm", shortLabel: "RB", baseCost: 3900, growth: 1.162, pps: 49, unlockAt: 2200 },
  { id: "reactor", name: "Fusion-Reaktor", shortLabel: "FR", baseCost: 15000, growth: 1.171, pps: 170, unlockAt: 8800 },
  { id: "cluster", name: "Chip-Cluster", shortLabel: "CC", baseCost: 54000, growth: 1.18, pps: 610, unlockAt: 30000 },
  { id: "satellite", name: "Satelliten-Linie", shortLabel: "SL", baseCost: 190000, growth: 1.188, pps: 2100, unlockAt: 110000 },
  { id: "laserFab", name: "Laser-Fabrik", shortLabel: "LF", baseCost: 680000, growth: 1.197, pps: 7000, unlockAt: 420000 },
  { id: "quantumCore", name: "Line-Core", shortLabel: "QC", baseCost: 2400000, growth: 1.206, pps: 21000, unlockAt: 1500000 },
  { id: "matrix", name: "Matrix-Fabrik", shortLabel: "MX", baseCost: 8500000, growth: 1.215, pps: 68000, unlockAt: 5000000 },
  { id: "arcology", name: "Pixel-Arcology", shortLabel: "AR", baseCost: 31000000, growth: 1.224, pps: 210000, unlockAt: 18000000 },
  { id: "orbitalDock", name: "Orbital-Dock", shortLabel: "OD", baseCost: 115000000, growth: 1.232, pps: 690000, unlockAt: 70000000 },
];

export const GAMBLER_ASSET_IDS = new Set(GAMBLER_ASSETS.map((a) => a.id));
