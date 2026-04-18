/**
 * Skill-/Linien-Baum (Prestigepunkte) – Daten für UI + GameState.
 * Unlock-Regel: Sobald der Parent mindestens Stufe 1 hat, gilt der Child-Knoten als freigeschaltet
 * (Fix für „graue Boxen“, die trotz gekauftem Parent gesperrt bleiben).
 */

export type SkillBranch = "speed" | "efficiency" | "automation" | "synergy";

export interface SkillNodeDef {
  id: string;
  name: string;
  parentId: string | null;
  branch: SkillBranch;
  maxLevel: number;
  baseCost: number;
  /** Kosten für die nächste Stufe: baseCost * costGrowth^currentLevel */
  costGrowth: number;
  /** SVG-/Board-Position in Prozent (0–100), View von oben links. */
  layoutX: number;
  layoutY: number;
  /** Kurzinfo für „?“-Tooltip */
  help?: string;
}

/** Referenz-Knoten „Stabil-Kern“ als Wurzel (zentriert später im SVG-Layout). */
export const STABIL_KERN_ID = "core_stabil";

export const SKILL_NODES: SkillNodeDef[] = [
  {
    id: STABIL_KERN_ID,
    name: "Stabil-Kern",
    parentId: null,
    branch: "synergy",
    maxLevel: 12,
    baseCost: 1,
    costGrowth: 1.15,
    layoutX: 50,
    layoutY: 52,
    help: "Wurzel des Linienbaums: PPS, Klick, Offline, Missionen, Kombo – je Stufe stärker.",
  },
  {
    id: "speed_line",
    name: "Takt-Linie",
    parentId: STABIL_KERN_ID,
    branch: "speed",
    maxLevel: 8,
    baseCost: 2,
    costGrowth: 1.15,
    layoutX: 50,
    layoutY: 28,
    help: "Höhere Taktrate: stark bonus auf PPS, etwas auf Klick und Missionen.",
  },
  {
    id: "eff_grid",
    name: "Effizienz-Raster",
    parentId: STABIL_KERN_ID,
    branch: "efficiency",
    maxLevel: 8,
    baseCost: 2,
    costGrowth: 1.15,
    layoutX: 76,
    layoutY: 36,
    help: "Weniger Schwund: PPS, Offline-Zeit und Missions-Belohnungen.",
  },
  {
    id: "auto_nexus",
    name: "Auto-Nexus",
    parentId: "speed_line",
    branch: "automation",
    maxLevel: 5,
    baseCost: 3,
    costGrowth: 1.15,
    layoutX: 28,
    layoutY: 14,
    help: "Automation: PPS & Klick, längeres Kombo-Fenster, leichter Offline-Bonus.",
  },
  {
    id: "syn_mesh",
    name: "Synergie-Mesh",
    parentId: "eff_grid",
    branch: "synergy",
    maxLevel: 5,
    baseCost: 3,
    costGrowth: 1.15,
    layoutX: 82,
    layoutY: 58,
    help: "Klick-Fokus mit Synergie zu PPS, Missionen und Kombo.",
  },
];

export const SKILL_NODE_BY_ID = new Map(SKILL_NODES.map((n) => [n.id, n]));

/** Pro Stufe kumulierte Boni (additiv vor Cap), je Knoten. */
interface SkillEffectRow {
  ppsPerLv: number;
  clickPerLv: number;
  /** Additiv zur Offline-Effizienz (0–1), z. B. 0.004 = +0.4 %-Punkte effektiv pro Stufe */
  offlinePerLv: number;
  missionPerLv: number;
  comboMsPerLv: number;
}

const SKILL_EFFECT: Record<string, SkillEffectRow> = {
  core_stabil: { ppsPerLv: 0.012, clickPerLv: 0.006, offlinePerLv: 0.003, missionPerLv: 0.008, comboMsPerLv: 8 },
  speed_line: { ppsPerLv: 0.018, clickPerLv: 0.004, offlinePerLv: 0, missionPerLv: 0.005, comboMsPerLv: 0 },
  eff_grid: { ppsPerLv: 0.01, clickPerLv: 0.003, offlinePerLv: 0.007, missionPerLv: 0.01, comboMsPerLv: 0 },
  auto_nexus: { ppsPerLv: 0.014, clickPerLv: 0.012, offlinePerLv: 0.002, missionPerLv: 0.006, comboMsPerLv: 10 },
  syn_mesh: { ppsPerLv: 0.009, clickPerLv: 0.015, offlinePerLv: 0.003, missionPerLv: 0.012, comboMsPerLv: 8 },
};

/** Ausgabe für GameState (Multiplikatoren / additive Werte, gedeckelt). */
export interface SkillBonuses {
  ppsMult: number;
  clickMult: number;
  /** Zum Basiswert `economy.offlineEff` addieren, danach global deckeln. */
  offlineEffAdd: number;
  missionRewardMult: number;
  comboWindowMsBonus: number;
}

export function computeSkillBonuses(levels: Readonly<Record<string, number>>): SkillBonuses {
  let pps = 0;
  let click = 0;
  let off = 0;
  let mis = 0;
  let combo = 0;
  for (const node of SKILL_NODES) {
    const lv = levels[node.id] ?? 0;
    if (lv <= 0) continue;
    const e = SKILL_EFFECT[node.id];
    if (!e) continue;
    pps += lv * e.ppsPerLv;
    click += lv * e.clickPerLv;
    off += lv * e.offlinePerLv;
    mis += lv * e.missionPerLv;
    combo += lv * e.comboMsPerLv;
  }
  return {
    ppsMult: 1 + Math.min(0.52, pps),
    clickMult: 1 + Math.min(0.48, click),
    offlineEffAdd: Math.min(0.4, off),
    missionRewardMult: 1 + Math.min(0.32, mis),
    comboWindowMsBonus: Math.min(900, combo),
  };
}

/** Tooltip: was der Knoten pro Stufe bewirkt. */
export function describeSkillNodeEffects(nodeId: string): string {
  const e = SKILL_EFFECT[nodeId];
  if (!e) return "";
  const parts: string[] = [];
  if (e.ppsPerLv > 0) parts.push(`PPS +${(e.ppsPerLv * 100).toFixed(1)}% pro Stufe`);
  if (e.clickPerLv > 0) parts.push(`Klick +${(e.clickPerLv * 100).toFixed(1)}% pro Stufe`);
  if (e.offlinePerLv > 0) parts.push(`Offline +${(e.offlinePerLv * 100).toFixed(2)} pro Stufe (Eff.)`);
  if (e.missionPerLv > 0) parts.push(`Missionen +${(e.missionPerLv * 100).toFixed(1)}% pro Stufe`);
  if (e.comboMsPerLv > 0) parts.push(`Kombo +${e.comboMsPerLv} ms pro Stufe`);
  return parts.join(" · ");
}

/** Parent hat mindestens eine Stufe → Child ist sichtbar/freigeschaltet (kein Grau-Lock). */
export function isSkillUnlocked(skillLevels: Readonly<Record<string, number>>, nodeId: string): boolean {
  const node = SKILL_NODE_BY_ID.get(nodeId);
  if (!node) return false;
  if (node.parentId === null) return true;
  return (skillLevels[node.parentId] ?? 0) > 0;
}

export function skillCostAt(node: SkillNodeDef, currentLevel: number): number {
  return Math.floor(node.baseCost * Math.pow(node.costGrowth, currentLevel));
}
