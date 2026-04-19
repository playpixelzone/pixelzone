/**
 * Shop-Definitionen (einzige Quelle für Basispreise & Effekte).
 * Preis pro Level: basePrice * 1.15^level
 */
export const UPGRADE_DEFINITIONS = [
  {
    id: 'skeletonScraper',
    name: 'Skelett-Schürfer',
    basePrice: 15,
    type: 'PPS',
    perLevel: 0.1,
  },
  {
    id: 'ghoul',
    name: 'Ghul',
    basePrice: 100,
    type: 'PPS',
    perLevel: 0.5,
  },
  {
    id: 'boneGolem',
    name: 'Knochen-Golem',
    basePrice: 500,
    type: 'PPS',
    perLevel: 2,
  },
  {
    id: 'boneBlade',
    name: 'Knochenklingen',
    basePrice: 50,
    type: 'PPC',
    perLevel: 1,
  },
  {
    id: 'soulFocus',
    name: 'Seelen-Fokus',
    basePrice: 250,
    type: 'PPC',
    perLevel: 2,
  },
];

/** @param {number} basePrice */
export function priceAtLevel(basePrice, level) {
  return basePrice * Math.pow(1.15, level);
}

/** @param {string} id */
export function getDefinitionById(id) {
  return UPGRADE_DEFINITIONS.find((u) => u.id === id);
}
