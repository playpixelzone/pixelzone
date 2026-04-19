/**
 * Expedition: Karten, Elite-Einheiten, Artefakte (Daten nur).
 */

export const EXPEDITION_MAPS = [
  { id: 'menschendorf', name: 'Menschendorf', villagerHpScale: 1 },
];

/** Elite-Einheiten: Kosten in Knochen, Kampfkraft pro Stück */
export const ELITE_UNITS = [
  {
    id: 'skeletonWarrior',
    name: 'Skelett-Krieger',
    boneCost: 400,
    /** Kampfkraft pro Einheit */
    combatPowerPerUnit: 4,
  },
];

/** Permanente Artefakt-Buffs (Id → Effekt) */
export const ARTIFACT_DEFS = [
  {
    id: 'rustySword',
    name: 'Rostiges Schwert',
    description: '+2 % Klick-Kraft',
    clickPowerBonus: 0.02,
  },
];

/** @param {string} id */
export function getEliteUnitById(id) {
  return ELITE_UNITS.find((u) => u.id === id);
}

/** @param {string} id */
export function getArtifactDefById(id) {
  return ARTIFACT_DEFS.find((a) => a.id === id);
}

/** Dauer einer Plünderung (Fortschrittsbalken) */
export const EXPEDITION_DURATION_SEC = 10;

export const ARTIFACT_DROP_CHANCE = 0.05;

/** Verlustquote der entsandten Armee nach Abschluss: 20 % bis 50 % */
export const PLUNDER_LOSS_MIN = 0.2;
export const PLUNDER_LOSS_MAX = 0.5;
