/**
 * Kleine Relikte aus abgeschlossenen Expeditionen (permanent, leicht, klickfokus).
 * @typedef {{
 *   id: string;
 *   name: string;
 *   shortName: string;
 *   description: string;
 *   bpsAddPerStack: number;
 *   baseClickAddPerStack: number;
 *   buildingCostReliefPerStack: number;
 * }} RelicDef
 */

export const EXPEDITION_RELIC_DEFS = /** @type {RelicDef[]} */ ([
  {
    id: 'relic_haste',
    name: 'Splitter der Eile',
    shortName: 'Eile',
    description: '+1 % globaler BpS (additiv pro Stapel; Summe gedeckelt).',
    bpsAddPerStack: 0.01,
    baseClickAddPerStack: 0,
    buildingCostReliefPerStack: 0,
  },
  {
    id: 'relic_cursedTooth',
    name: 'Verfluchter Zahn',
    shortName: 'Zahn',
    description: '+2 Basis-Klichwert (additiv, vor Multiplikator) pro Stapel.',
    bpsAddPerStack: 0,
    baseClickAddPerStack: 2,
    buildingCostReliefPerStack: 0,
  },
  {
    id: 'relic_oldCoin',
    name: 'Alte Münze',
    shortName: 'Münze',
    description: '−1 % Gebäude-Kosten (additiv, max. 20 % pro Relikt-Typ).',
    bpsAddPerStack: 0,
    baseClickAddPerStack: 0,
    buildingCostReliefPerStack: 0.01,
  },
]);

/** @param {string} id */
export function getRelicDefById(id) {
  return EXPEDITION_RELIC_DEFS.find((r) => r.id === id);
}

/**
 * Wählt ein zufälliges Relikt (expeditions-gebundene Tropen).
 * @returns {RelicDef}
 */
export function rollRandomExpeditionRelic() {
  const i = Math.floor(Math.random() * EXPEDITION_RELIC_DEFS.length);
  return EXPEDITION_RELIC_DEFS[i] ?? EXPEDITION_RELIC_DEFS[0];
}
