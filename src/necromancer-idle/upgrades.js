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
    lore: 'Skelett-Schürfer: Sie graben unermüdlich alte Gräber aus und liefern jeden Knochen, den die Erde hergibt.',
  },
  {
    id: 'ghoul',
    name: 'Ghul',
    basePrice: 100,
    type: 'PPS',
    perLevel: 0.5,
    lore: 'Ghule: Ausgehungerte Untote, die über verlassene Schlachtfelder streifen und alles verwerten, was noch Fleisch oder Knochen trägt.',
  },
  {
    id: 'boneGolem',
    name: 'Knochen-Golem',
    basePrice: 500,
    type: 'PPS',
    perLevel: 2,
    lore: 'Knochen-Golems: Rasselnde Konstrukte aus Rippenbögen und Schädeln — langsam, aber unaufhaltsam in der Knochenproduktion.',
  },
  {
    id: 'boneBlade',
    name: 'Knochenklingen',
    basePrice: 50,
    type: 'PPC',
    perLevel: 1,
    lore: 'Knochenklingen: Gesplitterte Schwerter aus Rippe und Obsidian — jeder Schlag des Altars schneidet tiefer ins Reich der Toten.',
  },
  {
    id: 'soulFocus',
    name: 'Seelen-Fokus',
    basePrice: 250,
    type: 'PPC',
    perLevel: 2,
    lore: 'Seelen-Fokus: Ein verdrehter Kristall, der deinen Willen bündelt — ein Klick wird zur konzentrierten Knochenlawine.',
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
