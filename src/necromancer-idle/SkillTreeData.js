/**
 * Welten-Essenz-Skilltree: Spinnennetz mit Querverbindungen (Blut / Schatten / Eroberer).
 */

/** @typedef {{ id: string; name: string; cost: number; requires: string[]; x: number; y: number; path: string }} SkillNodeDef */

/** @param {string} id */
export function getSkillNodeById(id) {
  return SKILL_TREE_NODES.find((n) => n.id === id);
}

export const SKILL_TREE_NODES = /** @type {SkillNodeDef[]} */ ([
  {
    id: 'center',
    name: 'Das Erwachen',
    cost: 1,
    requires: [],
    x: 50,
    y: 50,
    path: 'Zentrum',
  },
  // —— Pfad des Blutes (Klicks) — oben links
  {
    id: 'blood_1',
    name: 'Puls der Fingerknochen',
    cost: 3,
    requires: ['center'],
    x: 38,
    y: 42,
    path: 'Blut',
  },
  {
    id: 'blood_2',
    name: 'Ader des Altars',
    cost: 8,
    requires: ['blood_1'],
    x: 28,
    y: 34,
    path: 'Blut',
  },
  {
    id: 'blood_3',
    name: 'Herzklopfen der Toten',
    cost: 18,
    requires: ['blood_2', 'hybrid_bs'],
    x: 18,
    y: 26,
    path: 'Blut',
  },
  {
    id: 'blood_4',
    name: 'Blutpakt der Sieben Siegel',
    cost: 40,
    requires: ['blood_3'],
    x: 10,
    y: 18,
    path: 'Blut',
  },
  // —— Pfad der Schatten (Passiv) — oben rechts
  {
    id: 'shadow_1',
    name: 'Flüstern der Gruft',
    cost: 3,
    requires: ['center'],
    x: 62,
    y: 42,
    path: 'Schatten',
  },
  {
    id: 'shadow_2',
    name: 'Nebel der endlosen Schichten',
    cost: 8,
    requires: ['shadow_1'],
    x: 72,
    y: 34,
    path: 'Schatten',
  },
  {
    id: 'shadow_3',
    name: 'Schatten-Webwerk',
    cost: 18,
    requires: ['shadow_2', 'hybrid_bs'],
    x: 82,
    y: 26,
    path: 'Schatten',
  },
  {
    id: 'shadow_4',
    name: 'Kern der schweigenden Fabrik',
    cost: 40,
    requires: ['shadow_3'],
    x: 90,
    y: 18,
    path: 'Schatten',
  },
  // —— Pfad der Eroberer — unten
  {
    id: 'war_1',
    name: 'Erster Tritt ins Dorf',
    cost: 3,
    requires: ['center'],
    x: 44,
    y: 60,
    path: 'Eroberer',
  },
  {
    id: 'war_2',
    name: 'Banner aus Rippen',
    cost: 8,
    requires: ['war_1'],
    x: 40,
    y: 72,
    path: 'Eroberer',
  },
  {
    id: 'war_3',
    name: 'Beute-Katalog der Angst',
    cost: 18,
    requires: ['war_2', 'hybrid_bw'],
    x: 34,
    y: 84,
    path: 'Eroberer',
  },
  {
    id: 'war_4',
    name: 'Heerlager der Leere',
    cost: 40,
    requires: ['war_3'],
    x: 28,
    y: 92,
    path: 'Eroberer',
  },
  // —— Querverbindungen (2 Voraussetzungen)
  {
    id: 'hybrid_bs',
    name: 'Kreuzung aus Nebel und Blut',
    cost: 22,
    requires: ['blood_2', 'shadow_2'],
    x: 50,
    y: 30,
    path: 'Verbindung',
  },
  {
    id: 'hybrid_bw',
    name: 'Pfad der gezackten Triumphe',
    cost: 22,
    requires: ['blood_2', 'war_2'],
    x: 30,
    y: 54,
    path: 'Verbindung',
  },
  {
    id: 'hybrid_sw',
    name: 'Schatten über dem Feld',
    cost: 22,
    requires: ['shadow_2', 'war_2'],
    x: 70,
    y: 54,
    path: 'Verbindung',
  },
  {
    id: 'triad_nexus',
    name: 'Dreifaltiger Schlüssel',
    cost: 75,
    requires: ['blood_4', 'shadow_4', 'war_4'],
    x: 50,
    y: 58,
    path: 'Nexus',
  },
]);

/** Kanten: requires → eingehende Linie von jedem Parent zum Kind */
export function getSkillTreeEdges() {
  /** @type {{ from: string; to: string }[]} */
  const edges = [];
  for (const node of SKILL_TREE_NODES) {
    for (const req of node.requires) {
      edges.push({ from: req, to: node.id });
    }
  }
  return edges;
}
