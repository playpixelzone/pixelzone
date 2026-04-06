'use strict';

// ╔══════════════════════════════════════════════════════════╗
// ║  PIXEL FACTORY – Spielkonstanten                        ║
// ╚══════════════════════════════════════════════════════════╝

// === GEBÄUDE ===
const GEBAEUDE = [
  { id: 'maschine',      name: 'Einfache Maschine',          basisPreis: 15,           basisPPS: 0.1,     farbe: '#94a3b8' },
  { id: 'foerderband',   name: 'Förderband',                 basisPreis: 100,          basisPPS: 0.5,     farbe: '#60a5fa' },
  { id: 'drucker',       name: 'Pixel-Drucker',              basisPreis: 500,          basisPPS: 2,       farbe: '#34d399' },
  { id: 'sortieranlage', name: 'Automatische Sortieranlage', basisPreis: 2000,         basisPPS: 8,       farbe: '#f472b6' },
  { id: 'labor',         name: 'Pixel-Labor',                basisPreis: 10000,        basisPPS: 25,      farbe: '#a78bfa' },
  { id: 'quantencomp',   name: 'Quantencomputer',            basisPreis: 50000,        basisPPS: 100,     farbe: '#38bdf8' },
  { id: 'reaktor',       name: 'Pixel-Reaktor',              basisPreis: 200000,       basisPPS: 400,     farbe: '#fb923c' },
  { id: 'portal',        name: 'Dimensionsportal',           basisPreis: 1000000,      basisPPS: 1500,    farbe: '#818cf8' },
  { id: 'universum',     name: 'Pixel-Universum',            basisPreis: 10000000,     basisPPS: 7000,    farbe: '#2dd4bf' },
  { id: 'zeitmaschine',  name: 'Zeitmaschine',               basisPreis: 100000000,         basisPPS: 35000,     farbe: '#fbbf24' },
  { id: 'nanofabrik',    name: 'Nano-Fabrik',                basisPreis: 500000000,         basisPPS: 45000,     farbe: '#06b6d4', minPrestige: 5  },
  { id: 'biomatrix',     name: 'Bio-Matrix',                 basisPreis: 5000000000,        basisPPS: 220000,    farbe: '#84cc16', minPrestige: 10 },
  { id: 'warpgenerator', name: 'Warp-Generator',             basisPreis: 50000000000,       basisPPS: 1100000,   farbe: '#ec4899', minPrestige: 15 },
  { id: 'singularitaet', name: 'Pixel-Singularität',         basisPreis: 500000000000,      basisPPS: 5500000,   farbe: '#f43f5e', minPrestige: 20 },
  { id: 'goettlich',     name: 'Göttliche Fabrik',           basisPreis: 5000000000000,     basisPPS: 28000000,  farbe: '#d946ef', minPrestige: 25 },
];

// Preis eines Gebäudes bei aktueller Anzahl
function gebaeudePreis(g, anzahl) {
  return Math.ceil(g.basisPreis * Math.pow(1.15, anzahl));
}

// === UPGRADES (Normale Upgrades) ===

// Klick-Upgrades (10 Stück)
const KLICK_UPGRADES = [
  { id: 'klick_1',  name: 'Verbesserter Klickmechanismus', beschreibung: '+1 Pixel pro Klick',       preis: 100,        typ: 'klick_add',  wert: 1,  bedingung: (z) => z.gesamtKlicks >= 25 },
  { id: 'klick_2',  name: 'Doppelklick-System',            beschreibung: '+2 Pixel pro Klick',       preis: 500,        typ: 'klick_add',  wert: 2,  bedingung: (z) => z.gesamtKlicks >= 100 },
  { id: 'klick_3',  name: 'Klick-Turbo',                   beschreibung: '+5 Pixel pro Klick',       preis: 5000,       typ: 'klick_add',  wert: 5,  bedingung: (z) => z.gesamtKlicks >= 1000 },
  { id: 'klick_4',  name: 'Klick-Verstärker I',            beschreibung: 'Doppelte Klick-Leistung',  preis: 50000,      typ: 'klick_mult', wert: 2,  bedingung: (z) => z.gesamtKlicks >= 5000 },
  { id: 'klick_5',  name: 'Klick-Verstärker II',           beschreibung: 'Doppelte Klick-Leistung',  preis: 500000,     typ: 'klick_mult', wert: 2,  bedingung: (z) => z.gesamtKlicks >= 25000 },
  { id: 'klick_6',  name: 'Klick-Verstärker III',          beschreibung: '3× Klick-Leistung',        preis: 5000000,    typ: 'klick_mult', wert: 3,  bedingung: (z) => z.gesamtKlicks >= 100000 },
  { id: 'klick_7',  name: 'Mega-Klick',                    beschreibung: '5× Klick-Leistung',        preis: 50000000,   typ: 'klick_mult', wert: 5,  bedingung: (z) => z.gesamtKlicks >= 500000 },
  { id: 'klick_8',  name: 'Hyper-Klick',                   beschreibung: '10× Klick-Leistung',       preis: 500000000,  typ: 'klick_mult', wert: 10, bedingung: (z) => z.gesamtKlicks >= 1000000 },
  { id: 'klick_9',  name: 'Klick-Singularität',            beschreibung: '20× Klick-Leistung',       preis: 5000000000, typ: 'klick_mult', wert: 20, bedingung: (z) => z.gesamtKlicks >= 5000000 },
  { id: 'klick_10', name: 'Göttlicher Klick',              beschreibung: '50× Klick-Leistung',       preis: 5e10,       typ: 'klick_mult', wert: 50, bedingung: (z) => z.gesamtKlicks >= 10000000 },
];

// Automatisch 3 Upgrades pro Gebäude (nur die 10 Basis-Gebäude, nicht Prestige-exklusive)
const GEBAEUDE_UPGRADES = GEBAEUDE.filter(g => !g.minPrestige).flatMap(g => [
  {
    id: `${g.id}_up1`,
    name: `${g.name} Mk.II`,
    beschreibung: `${g.name} produzieren doppelt so viele Pixel`,
    preis: Math.ceil(g.basisPreis * 10),
    typ: 'gebaeude_mult', gebaeude: g.id, wert: 2,
    bedingung: (z) => (z.gebaeude[g.id] || 0) >= 10,
  },
  {
    id: `${g.id}_up2`,
    name: `${g.name} Mk.III`,
    beschreibung: `${g.name} produzieren nochmals doppelt so viele Pixel`,
    preis: Math.ceil(g.basisPreis * 50),
    typ: 'gebaeude_mult', gebaeude: g.id, wert: 2,
    bedingung: (z) => (z.gebaeude[g.id] || 0) >= 25,
  },
  {
    id: `${g.id}_up3`,
    name: `${g.name} Mk.IV`,
    beschreibung: `${g.name} produzieren dreimal so viele Pixel`,
    preis: Math.ceil(g.basisPreis * 200),
    typ: 'gebaeude_mult', gebaeude: g.id, wert: 3,
    bedingung: (z) => (z.gebaeude[g.id] || 0) >= 50,
  },
]);

// Offline-Speicher Upgrades (5 Stück)
const OFFLINE_UPGRADES = [
  { id: 'offline_1', name: 'Offline-Speicher I',   beschreibung: 'Offline-Produktion bis zu 2 Stunden',  preis: 5000,     typ: 'offline_stunden', stunden: 2,  bedingung: (z) => z.lifetimePixel >= 1000 },
  { id: 'offline_2', name: 'Offline-Speicher II',  beschreibung: 'Offline-Produktion bis zu 4 Stunden',  preis: 50000,    typ: 'offline_stunden', stunden: 4,  bedingung: (z) => z.lifetimePixel >= 25000 },
  { id: 'offline_3', name: 'Offline-Speicher III', beschreibung: 'Offline-Produktion bis zu 8 Stunden',  preis: 500000,   typ: 'offline_stunden', stunden: 8,  bedingung: (z) => z.lifetimePixel >= 500000 },
  { id: 'offline_4', name: 'Offline-Speicher IV',  beschreibung: 'Offline-Produktion bis zu 16 Stunden', preis: 5000000,  typ: 'offline_stunden', stunden: 16, bedingung: (z) => z.lifetimePixel >= 10000000 },
  { id: 'offline_5', name: 'Offline-Speicher V',   beschreibung: 'Offline-Produktion bis zu 24 Stunden', preis: 50000000, typ: 'offline_stunden', stunden: 24, bedingung: (z) => z.lifetimePixel >= 100000000 },
];

// Synergie-Upgrades (5 Stück)
const SYNERGIE_UPGRADES = [
  { id: 'syn_1', name: 'Fließband-Synergie',    beschreibung: 'Förderband erhält +1% PpS pro Einfache Maschine',    preis: 500000,     typ: 'synergie', von: 'maschine',   auf: 'foerderband',  faktor: 0.01, bedingung: (z) => (z.gebaeude.maschine || 0) >= 15 && (z.gebaeude.foerderband || 0) >= 15 },
  { id: 'syn_2', name: 'Labor-Synergie',         beschreibung: 'Pixel-Labor erhält +1% PpS pro Pixel-Drucker',       preis: 5000000,    typ: 'synergie', von: 'drucker',    auf: 'labor',        faktor: 0.01, bedingung: (z) => (z.gebaeude.drucker || 0) >= 15 && (z.gebaeude.labor || 0) >= 15 },
  { id: 'syn_3', name: 'Quanten-Synergie',       beschreibung: 'Quantencomputer erhält +1% PpS pro Pixel-Labor',     preis: 50000000,   typ: 'synergie', von: 'labor',      auf: 'quantencomp',  faktor: 0.01, bedingung: (z) => (z.gebaeude.labor || 0) >= 15 && (z.gebaeude.quantencomp || 0) >= 15 },
  { id: 'syn_4', name: 'Portal-Synergie',        beschreibung: 'Dimensionsportal erhält +1% PpS pro Reaktor',        preis: 500000000,  typ: 'synergie', von: 'reaktor',    auf: 'portal',       faktor: 0.01, bedingung: (z) => (z.gebaeude.reaktor || 0) >= 15 && (z.gebaeude.portal || 0) >= 15 },
  { id: 'syn_5', name: 'Zeitmaschinen-Synergie', beschreibung: 'Zeitmaschine erhält +1% PpS pro Pixel-Universum',    preis: 5000000000, typ: 'synergie', von: 'universum',  auf: 'zeitmaschine', faktor: 0.01, bedingung: (z) => (z.gebaeude.universum || 0) >= 15 && (z.gebaeude.zeitmaschine || 0) >= 15 },
];

// Alle normalen Upgrades zusammenführen
// Typ-Felder Referenz:
//   klick_add, klick_mult, gebaeude_mult  → wert (Zahl)
//   offline_stunden                        → stunden (Zahl, kein wert-Feld)
//   synergie                               → faktor (Zahl, kein wert-Feld)
const UPGRADES = [...KLICK_UPGRADES, ...GEBAEUDE_UPGRADES, ...OFFLINE_UPGRADES, ...SYNERGIE_UPGRADES];

// === PRESTIGE-UPGRADES (mit Quantum-Pixel kaufbar) ===
// Kein 'bedingung'-Feld – sie sind immer sichtbar (nur QP-Preis entscheidet)
const PRESTIGE_UPGRADES = [
  // Globale Multiplikatoren (10 Stück)
  { id: 'qp_global_1',  name: 'Quanten-Fabrik I',    beschreibung: 'Alle Produktion ×1,5',   preisQP: 1,    typ: 'qp_global_mult', wert: 1.5  },
  { id: 'qp_global_2',  name: 'Quanten-Fabrik II',   beschreibung: 'Alle Produktion ×2',     preisQP: 3,    typ: 'qp_global_mult', wert: 2    },
  { id: 'qp_global_3',  name: 'Quanten-Fabrik III',  beschreibung: 'Alle Produktion ×3',     preisQP: 8,    typ: 'qp_global_mult', wert: 3    },
  { id: 'qp_global_4',  name: 'Quanten-Fabrik IV',   beschreibung: 'Alle Produktion ×5',     preisQP: 20,   typ: 'qp_global_mult', wert: 5    },
  { id: 'qp_global_5',  name: 'Quanten-Fabrik V',    beschreibung: 'Alle Produktion ×10',    preisQP: 50,   typ: 'qp_global_mult', wert: 10   },
  { id: 'qp_global_6',  name: 'Quanten-Fabrik VI',   beschreibung: 'Alle Produktion ×25',    preisQP: 100,  typ: 'qp_global_mult', wert: 25   },
  { id: 'qp_global_7',  name: 'Quanten-Fabrik VII',  beschreibung: 'Alle Produktion ×50',    preisQP: 200,  typ: 'qp_global_mult', wert: 50   },
  { id: 'qp_global_8',  name: 'Quanten-Fabrik VIII', beschreibung: 'Alle Produktion ×100',   preisQP: 500,  typ: 'qp_global_mult', wert: 100  },
  { id: 'qp_global_9',  name: 'Quanten-Fabrik IX',   beschreibung: 'Alle Produktion ×250',   preisQP: 1000, typ: 'qp_global_mult', wert: 250  },
  { id: 'qp_global_10', name: 'Quanten-Fabrik X',    beschreibung: 'Alle Produktion ×1000',  preisQP: 2500, typ: 'qp_global_mult', wert: 1000 },
  // Klick-Multiplikatoren (5 Stück)
  { id: 'qp_klick_1', name: 'Quanten-Klick I',   beschreibung: 'Klick-Leistung ×2',   preisQP: 2,   typ: 'qp_klick_mult', wert: 2   },
  { id: 'qp_klick_2', name: 'Quanten-Klick II',  beschreibung: 'Klick-Leistung ×5',   preisQP: 10,  typ: 'qp_klick_mult', wert: 5   },
  { id: 'qp_klick_3', name: 'Quanten-Klick III', beschreibung: 'Klick-Leistung ×20',  preisQP: 40,  typ: 'qp_klick_mult', wert: 20  },
  { id: 'qp_klick_4', name: 'Quanten-Klick IV',  beschreibung: 'Klick-Leistung ×100', preisQP: 150, typ: 'qp_klick_mult', wert: 100 },
  { id: 'qp_klick_5', name: 'Quanten-Klick V',   beschreibung: 'Klick-Leistung ×500', preisQP: 500, typ: 'qp_klick_mult', wert: 500 },
  // Goldene Pixel (3 Stück)
  { id: 'qp_golden_1', name: 'Goldene Augen I',   beschreibung: 'Goldene Pixel erscheinen 2× häufiger', preisQP: 5,  typ: 'qp_golden_freq',  wert: 2 },
  { id: 'qp_golden_2', name: 'Goldene Augen II',  beschreibung: 'Goldene Pixel geben 3× mehr Bonus',    preisQP: 15, typ: 'qp_golden_bonus', wert: 3 },
  { id: 'qp_golden_3', name: 'Goldene Augen III', beschreibung: 'Goldene Pixel erscheinen 5× häufiger', preisQP: 50, typ: 'qp_golden_freq',  wert: 5 },
  // Besondere (2 Stück)
  { id: 'qp_pps_base', name: 'Quanten-Effizienz', beschreibung: 'PpS ×5 als globaler Bonus',          preisQP: 30, typ: 'qp_global_mult',  wert: 5   },
  { id: 'qp_start',    name: 'Quantum-Start',      beschreibung: 'Starte nach Prestige mit 100 Pixel', preisQP: 25, typ: 'qp_start_bonus',  wert: 100 },
  // ✦ Meilenstein-Upgrades (jede 10. Prestige-Stufe)
  { id: 'ms_10', name: '✦ Meilenstein: Dekade I',    beschreibung: 'Alle Produktion ×8 (dauerhaft)',  preisQP: 8,   typ: 'qp_global_mult', wert: 8,   minPrestige: 10, meilenstein: true },
  { id: 'ms_20', name: '✦ Meilenstein: Dekade II',   beschreibung: 'Alle Produktion ×20 (dauerhaft)', preisQP: 25,  typ: 'qp_global_mult', wert: 20,  minPrestige: 20, meilenstein: true },
  { id: 'ms_30', name: '✦ Meilenstein: Dekade III',  beschreibung: 'Klick-Leistung ×500 (dauerhaft)', preisQP: 75,  typ: 'qp_klick_mult',  wert: 500, minPrestige: 30, meilenstein: true },
  { id: 'ms_40', name: '✦ Meilenstein: Dekade IV',   beschreibung: 'Alle Produktion ×75 (dauerhaft)', preisQP: 200, typ: 'qp_global_mult', wert: 75,  minPrestige: 40, meilenstein: true },
  { id: 'ms_50', name: '✦ Meilenstein: Dekade V',    beschreibung: 'Alle Produktion ×300 (dauerhaft)',preisQP: 500, typ: 'qp_global_mult', wert: 300, minPrestige: 50, meilenstein: true },
];

// === SKINS ===
const SKINS = [
  { id: 'standard',   name: 'Standard',   minPrestige: 0,  farben: ['#cbd5e1','#94a3b8','#64748b','#e2e8f0'] },
  { id: 'blau',       name: 'Blau',       minPrestige: 1,  farben: ['#60a5fa','#3b82f6','#2563eb','#bfdbfe'] },
  { id: 'gruen',      name: 'Grün',       minPrestige: 3,  farben: ['#34d399','#10b981','#059669','#a7f3d0'] },
  { id: 'lila',       name: 'Lila ✦',    minPrestige: 5,  farben: ['#a78bfa','#8b5cf6','#7c3aed','#ede9fe'], glitzer: true },
  { id: 'gold',       name: 'Gold ✦',    minPrestige: 10, farben: ['#fbbf24','#f59e0b','#d97706','#fef3c7'], glitzer: true },
  { id: 'regenbogen', name: 'Regenbogen', minPrestige: 15, farben: ['#f87171','#fbbf24','#34d399','#60a5fa','#a78bfa'], animiert: true },
  { id: 'kristall',   name: 'Kristall',   minPrestige: 20, farben: ['rgba(148,163,184,0.6)','rgba(203,213,225,0.8)','rgba(226,232,240,0.9)','rgba(241,245,249,0.7)'], kristall: true },
  { id: 'plasma',     name: 'Plasma ✦',  minPrestige: 25, farben: ['#f0abfc','#e879f9','#d946ef','#a21caf'], pulsierend: true, glitzer: true },
];

// === ERRUNGENSCHAFTEN ===
const ERRUNGENSCHAFTEN = [
  // Pixel-Meilensteine (8)
  { id: 'px_100',    name: 'Erste Schritte',    icon: '🔹', text: '100 Lifetime-Pixel produziert',        pruefe: (z) => z.lifetimePixel >= 100 },
  { id: 'px_1k',     name: 'Pixel-Starter',      icon: '⬛', text: '1.000 Lifetime-Pixel produziert',      pruefe: (z) => z.lifetimePixel >= 1000 },
  { id: 'px_10k',    name: 'Pixel-Sammler',       icon: '🟦', text: '10.000 Lifetime-Pixel produziert',     pruefe: (z) => z.lifetimePixel >= 10000 },
  { id: 'px_100k',   name: 'Pixel-Enthusiast',    icon: '💎', text: '100.000 Lifetime-Pixel produziert',    pruefe: (z) => z.lifetimePixel >= 100000 },
  { id: 'px_1m',     name: 'Pixel-Millionär',     icon: '🏭', text: '1 Million Pixel produziert',           pruefe: (z) => z.lifetimePixel >= 1000000 },
  { id: 'px_1b',     name: 'Pixel-Magnat',        icon: '🌐', text: '1 Milliarde Pixel produziert',         pruefe: (z) => z.lifetimePixel >= 1000000000 },
  { id: 'px_1t',     name: 'Pixel-Kaiser',        icon: '🌌', text: '1 Billion Pixel produziert',           pruefe: (z) => z.lifetimePixel >= 1e12 },
  { id: 'px_1qd',    name: 'Pixel-Gott',          icon: '✨', text: '1 Quadrillion Pixel produziert',       pruefe: (z) => z.lifetimePixel >= 1e15 },
  // Gebäude-Meilensteine (6)
  { id: 'geb_erst',  name: 'Erste Fabrik',        icon: '⚙️', text: 'Erstes Gebäude gekauft',               pruefe: (z) => Object.values(z.gebaeude).some(n => n >= 1) },
  { id: 'geb_10',    name: 'Kleine Fabrik',        icon: '🏗️', text: '10 Gebäude gekauft',                   pruefe: (z) => gesamtGebaeude(z) >= 10 },
  { id: 'geb_50',    name: 'Mittlere Fabrik',      icon: '🏭', text: '50 Gebäude gekauft',                   pruefe: (z) => gesamtGebaeude(z) >= 50 },
  { id: 'geb_100',   name: 'Großfabrik',           icon: '🌆', text: '100 Gebäude gekauft',                  pruefe: (z) => gesamtGebaeude(z) >= 100 },
  { id: 'geb_alle',  name: 'Sammler',              icon: '🎯', text: 'Alle Basis-Gebäudetypen besitzen',     pruefe: (z) => GEBAEUDE.filter(g => !g.minPrestige).every(g => (z.gebaeude[g.id] || 0) >= 1) },
  { id: 'geb_250',   name: 'Mega-Fabrik',          icon: '🌇', text: '250 Gebäude insgesamt',                pruefe: (z) => gesamtGebaeude(z) >= 250 },
  // Prestige-Meilensteine (5)
  { id: 'pre_1',     name: 'Neustart',             icon: '♻️', text: 'Erstes Prestige gemacht',              pruefe: (z) => z.prestige >= 1 },
  { id: 'pre_5',     name: 'Serienrestart',         icon: '🔄', text: '5× Prestige gemacht',                  pruefe: (z) => z.prestige >= 5 },
  { id: 'pre_10',    name: 'Prestige-Meister',      icon: '🏅', text: '10× Prestige gemacht',                 pruefe: (z) => z.prestige >= 10 },
  { id: 'pre_25',    name: 'Prestige-Legende',      icon: '🥇', text: '25× Prestige gemacht',                 pruefe: (z) => z.prestige >= 25 },
  { id: 'pre_50',    name: 'Prestige-Gott',         icon: '👑', text: '50× Prestige gemacht',                 pruefe: (z) => z.prestige >= 50 },
  // Klick-Meilensteine (4)
  { id: 'kl_100',    name: 'Klick-Starter',         icon: '👆', text: '100 Mal geklickt',                     pruefe: (z) => z.gesamtKlicks >= 100 },
  { id: 'kl_1k',     name: 'Klick-Sammler',         icon: '✌️', text: '1.000 Mal geklickt',                   pruefe: (z) => z.gesamtKlicks >= 1000 },
  { id: 'kl_10k',    name: 'Klick-Profi',           icon: '🖐️', text: '10.000 Mal geklickt',                  pruefe: (z) => z.gesamtKlicks >= 10000 },
  { id: 'kl_100k',   name: 'Klick-Legende',         icon: '💪', text: '100.000 Mal geklickt',                 pruefe: (z) => z.gesamtKlicks >= 100000 },
  // Goldene Pixel (3)
  { id: 'gld_1',     name: 'Goldfieber',            icon: '⭐', text: 'Ersten goldenen Pixel angeklickt',     pruefe: (z) => z.goldenPixelKlicks >= 1 },
  { id: 'gld_10',    name: 'Goldsucher',            icon: '🌟', text: '10 goldene Pixel angeklickt',          pruefe: (z) => z.goldenPixelKlicks >= 10 },
  { id: 'gld_100',   name: 'Goldmeister',           icon: '💫', text: '100 goldene Pixel angeklickt',         pruefe: (z) => z.goldenPixelKlicks >= 100 },
  // Skins (2)
  { id: 'skin_1',    name: 'Modebewusst',           icon: '🎨', text: 'Ersten Skin freigeschaltet',           pruefe: (z) => (z.skins?.freigeschaltet?.length || 0) >= 2 },
  { id: 'skin_alle', name: 'Skin-Sammler',          icon: '🌈', text: 'Alle Skins freigeschaltet',            pruefe: (z) => (z.skins?.freigeschaltet?.length || 0) >= SKINS.length },
  // Sonstiges (3)
  { id: 'offline',   name: 'Fleißige Fabrik',       icon: '💤', text: 'Offline-Bonus erhalten',               pruefe: (z) => z._offlineBonusErhalten },
  { id: 'speedrun',  name: 'Speedrunner',           icon: '⚡', text: '1.000 Pixel in unter 60 Sekunden',     pruefe: (z) => z._speedrunOk },
  { id: 'reich',     name: 'Wohlstand',             icon: '💰', text: '1.000 Quantum-Pixel gesammelt (gesamt)', pruefe: (z) => z._gesamtQP >= 1000 },
];

// ╔══════════════════════════════════════════════════════════╗
// ║  TUTORIAL                                               ║
// ╚══════════════════════════════════════════════════════════╝

const TUTORIAL_SCHRITTE = [
  {
    icon:  '🏭',
    titel: 'Willkommen!',
    text:  'Klicke auf den <strong>Pixel-Haufen</strong> in der Mitte, um Pixel zu produzieren!',
  },
  {
    icon:  '🏗',
    titel: 'Gebäude kaufen',
    text:  'Mit Pixeln kannst du im <strong>Shop rechts</strong> Gebäude kaufen, die automatisch Pixel produzieren.',
  },
  {
    icon:  '✦',
    titel: 'Prestige',
    text:  'Wenn du genug Pixel hast, mache <strong>Prestige</strong> für Quantum-Pixel – damit kaufst du dauerhafte Upgrades!',
  },
  {
    icon:  '🎯',
    titel: "Los geht's!",
    text:  "Das war's! Baue die größte Pixel-Fabrik der Welt. <em>Viel Erfolg!</em>",
  },
];

let tutorialSchritt = 0;

function tutorialZeigen() {
  const overlay = document.getElementById('tutorialOverlay');
  if (!overlay) return;
  if (zustand._tutorialGesehen) return; // versteckt bereits per HTML-Klasse
  tutorialSchritt = 0;
  tutorialSchrittRendern();
  overlay.classList.remove('versteckt');
}

function tutorialSchrittRendern() {
  const s = TUTORIAL_SCHRITTE[tutorialSchritt];
  document.getElementById('tutorialIcon').textContent  = s.icon;
  document.getElementById('tutorialTitel').textContent = s.titel;
  document.getElementById('tutorialText').innerHTML    = s.text;

  document.querySelectorAll('.tut-punkt').forEach((p, i) => {
    p.classList.toggle('aktiv', i === tutorialSchritt);
  });

  const isLast = tutorialSchritt === TUTORIAL_SCHRITTE.length - 1;
  document.getElementById('tutWeiter').textContent = isLast ? 'Spielen! 🎮' : 'Weiter →';
}

function tutorialSchliessen() {
  zustand._tutorialGesehen = true;
  document.getElementById('tutorialOverlay').classList.add('versteckt');
}

// Hilfsfunktion: Gesamtgebäude zählen
function gesamtGebaeude(z) {
  return Object.values(z.gebaeude).reduce((s, n) => s + n, 0);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SPIELZUSTAND                                           ║
// ╚══════════════════════════════════════════════════════════╝

// Standard-Zustand (wird beim ersten Start verwendet)
function standardZustand() {
  return {
    pixel: 0,
    lifetimePixel: 0,
    quantumPixel: 0,
    prestige: 0,
    gesamtKlicks: 0,
    goldenPixelKlicks: 0,
    letzterBesuch: Date.now(),
    maxOfflineStunden: 1,
    gebaeude: Object.fromEntries(GEBAEUDE.map(g => [g.id, 0])),
    upgrades: [],
    prestigeUpgrades: [],
    skins: { freigeschaltet: ['standard'], aktiv: 'standard' },
    errungenschaften: [],
    _offlineBonusErhalten: false,
    _speedrunOk: false,
    _speedrunStart: Date.now(),
    _gesamtQP: 0,
    _tutorialGesehen: false,
  };
}

let zustand = standardZustand();

// Abgeleitete Stats (werden laufend neu berechnet)
let berechneteStats = { pps: 0, ppk: 1 };

let bulkMenge = 1; // 0 = Max

function gebaeudeGesamtPreis(g, menge) {
  const anzahl = zustand.gebaeude[g.id] || 0;
  let total = 0;
  for (let i = 0; i < menge; i++) {
    total += gebaeudePreis(g, anzahl + i);
  }
  return total;
}

function gebaeudeMaxMenge(g) {
  let n = 0;
  let tempPixel = zustand.pixel;
  let tempAnzahl = zustand.gebaeude[g.id] || 0;
  while (n < 10000) { // Sicherheitsgrenze gegen Endlosschleife
    const p = gebaeudePreis(g, tempAnzahl + n);
    if (p <= 0 || tempPixel < p) break;
    tempPixel -= p;
    n++;
  }
  return n;
}

function upgradesInterleaved(upgrades) {
  const klickTypen = ['klick_add', 'klick_mult'];
  const klick = upgrades.filter(u => klickTypen.includes(u.typ));
  const prod  = upgrades.filter(u => !klickTypen.includes(u.typ));
  const result = [];
  const maxLen = Math.max(klick.length, prod.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < klick.length) result.push(klick[i]);
    if (i < prod.length)  result.push(prod[i]);
  }
  return result;
}

// === ZAHLENFORMATIERUNG ===
const EINHEITEN = ['', 'K', 'M', 'B', 'T', 'Qd', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return '0';
  if (n < 1000) return Math.floor(n).toString();
  const exp = Math.min(Math.floor(Math.log10(n) / 3), EINHEITEN.length - 1);
  const wert = n / Math.pow(1000, exp);
  const nachkomma = wert >= 100 ? 0 : wert >= 10 ? 1 : 2;
  return wert.toFixed(nachkomma).replace('.', ',') + EINHEITEN[exp];
}

// ╔══════════════════════════════════════════════════════════╗
// ║  BERECHNUNGEN                                           ║
// ╚══════════════════════════════════════════════════════════╝

function berechnePrestigeMultiplikator() {
  const p = zustand.prestige;
  if (p === 0) return 1;
  let mult = 1 + p * 0.05;
  if (p >= 25) mult *= Math.pow(p, 0.5);
  return mult;
}

function berechnePPS() {
  let pps = 0;

  for (const g of GEBAEUDE) {
    const anzahl = zustand.gebaeude[g.id] || 0;
    if (anzahl === 0) continue;

    let basePPS = g.basisPPS * anzahl;
    let mult = 1;

    for (const upId of zustand.upgrades) {
      const up = UPGRADES.find(u => u.id === upId);
      if (!up) continue;
      if (up.typ === 'gebaeude_mult' && up.gebaeude === g.id) mult *= up.wert;
    }

    for (const upId of zustand.upgrades) {
      const up = UPGRADES.find(u => u.id === upId);
      if (!up || up.typ !== 'synergie' || up.auf !== g.id) continue;
      const vonAnzahl = zustand.gebaeude[up.von] || 0;
      mult += vonAnzahl * up.faktor;
    }

    pps += basePPS * mult;
  }

  for (const upId of zustand.prestigeUpgrades) {
    const up = PRESTIGE_UPGRADES.find(u => u.id === upId);
    if (up?.typ === 'qp_global_mult') pps *= up.wert;
  }

  pps *= berechnePrestigeMultiplikator();
  return pps;
}

function berechnePPK() {
  let additiv = 0;
  let mult = 1;

  for (const upId of zustand.upgrades) {
    const up = UPGRADES.find(u => u.id === upId);
    if (!up) continue;
    if (up.typ === 'klick_add') additiv += up.wert;
    if (up.typ === 'klick_mult') mult *= up.wert;
  }

  for (const upId of zustand.prestigeUpgrades) {
    const up = PRESTIGE_UPGRADES.find(u => u.id === upId);
    if (up?.typ === 'qp_klick_mult') mult *= up.wert;
  }

  return (1 + additiv) * mult * berechnePrestigeMultiplikator();
}

function maxOfflineStunden() {
  let stunden = 1;
  for (const upId of zustand.upgrades) {
    const up = UPGRADES.find(u => u.id === upId);
    if (up?.typ === 'offline_stunden') stunden = Math.max(stunden, up.stunden);
  }
  if (zustand.prestige >= 10) stunden *= 2;
  return stunden;
}

function berechneQPGewinn() {
  return Math.max(1, Math.floor(Math.sqrt(zustand.lifetimePixel / 1e9)) + 1);
}

function statsNeuBerechnen() {
  berechneteStats.pps = berechnePPS();
  berechneteStats.ppk = berechnePPK();
}

// ╔══════════════════════════════════════════════════════════╗
// ║  GAME LOOP                                              ║
// ╚══════════════════════════════════════════════════════════╝

let letzterFrame = 0;
let loopId = null;
let hintergrundInterval = null;
let spielGestartet = false;

let aktiveBoosts = { ppsMultiplikator: 1, ppkMultiplikator: 1, endeMs: 0 };

function boostAktualisieren() {
  if (Date.now() > aktiveBoosts.endeMs) {
    aktiveBoosts.ppsMultiplikator = 1;
    aktiveBoosts.ppkMultiplikator = 1;
  }
}

function gameLoop(timestamp) {
  if (!letzterFrame) letzterFrame = timestamp;
  const delta = Math.min(timestamp - letzterFrame, 1000);
  letzterFrame = timestamp;

  boostAktualisieren();

  const produktion = berechneteStats.pps * aktiveBoosts.ppsMultiplikator * (delta / 1000);
  zustand.pixel += produktion;
  zustand.lifetimePixel += produktion;

  if (typeof skinsPruefen === 'function') skinsPruefen();

  if (Math.floor(timestamp / 1000) !== Math.floor((timestamp - delta) / 1000)) {
    if (typeof errungenschaftenPruefen === 'function') errungenschaftenPruefen();
  }

  if (typeof prestigeBtnAktualisieren === 'function') prestigeBtnAktualisieren();

  if (!zustand._speedrunOk && zustand.pixel >= 1000) {
    if ((Date.now() - zustand._speedrunStart) < 60000) zustand._speedrunOk = true;
  }

  if (typeof renderStats === 'function') renderStats();
  if (typeof renderHaufen === 'function') renderHaufen();

  loopId = requestAnimationFrame(gameLoop);
}

function hintergrundTick() {
  const now = Date.now();
  const delta = Math.min(now - (zustand.letzterBesuch || now), 2000);
  zustand.letzterBesuch = now;

  const offlineMult = zustand.prestige >= 10 ? 2 : 1;
  const produktion = berechneteStats.pps * (delta / 1000) * offlineMult;
  zustand.pixel += produktion;
  zustand.lifetimePixel += produktion;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (loopId) { cancelAnimationFrame(loopId); loopId = null; }
    zustand.letzterBesuch = Date.now();
    hintergrundInterval = setInterval(hintergrundTick, 1000);
  } else {
    if (hintergrundInterval) { clearInterval(hintergrundInterval); hintergrundInterval = null; }
    letzterFrame = 0;
    if (spielGestartet) loopId = requestAnimationFrame(gameLoop);
  }
});

// ╔══════════════════════════════════════════════════════════╗
// ║  PIXEL-HAUFEN CANVAS                                    ║
// ╚══════════════════════════════════════════════════════════╝

const HAUFEN_STUFEN = [
  { schwelle: 0,          anzahl: 1   },
  { schwelle: 100,        anzahl: 10  },
  { schwelle: 1000,       anzahl: 30  },
  { schwelle: 10000,      anzahl: 60  },
  { schwelle: 100000,     anzahl: 100 },
  { schwelle: 1000000,    anzahl: 150 },
  { schwelle: 1000000000, anzahl: 200 },
];

let haufenPartikel = [];
let animationsWinkel = 0;

function haufeInitialisieren() {
  haufenPartikel = [];
  const ziel = haufenZielAnzahl();
  const canvas = document.getElementById('pixelHaufen');
  const w = canvas.width, h = canvas.height;
  for (let i = 0; i < ziel; i++) {
    haufenPartikel.push(zufaelligerHaufenPixel(w, h));
  }
}

function haufenZielAnzahl() {
  const lp = zustand.lifetimePixel;
  let stufe = HAUFEN_STUFEN[0];
  for (const s of HAUFEN_STUFEN) {
    if (lp >= s.schwelle) stufe = s;
    else break;
  }
  return stufe.anzahl;
}

function zufaelligerHaufenPixel(w, h) {
  const cx = w / 2, cy = h * 0.58;
  const rx = w * 0.38, ry = h * 0.28;
  let x, y;
  do {
    x = cx + (Math.random() * 2 - 1) * rx;
    y = cy + (Math.random() * 2 - 1) * ry;
  } while (Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2) > 1);
  const groesse = 4 + Math.random() * 8;
  return { x, y, groesse, farbIndex: Math.floor(Math.random() * 4), dy: Math.random() * 0.3 - 0.15, phase: Math.random() * Math.PI * 2 };
}

function renderHaufen() {
  const canvas = document.getElementById('pixelHaufen');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const skin = SKINS.find(s => s.id === (zustand.skins?.aktiv || 'standard')) || SKINS[0];
  animationsWinkel += 0.02;

  // Haufen-Partikel auffüllen wenn Schwelle überschritten
  const ziel = haufenZielAnzahl();
  while (haufenPartikel.length < ziel) {
    haufenPartikel.push(zufaelligerHaufenPixel(w, h));
  }

  // Leichte Bewegung der Partikel
  for (const p of haufenPartikel) {
    p.y += p.dy;
    const cx = w / 2, cy = h * 0.58, rx = w * 0.38, ry = h * 0.28;
    if (Math.pow((p.x - cx) / rx, 2) + Math.pow((p.y - cy) / ry, 2) > 1.1) {
      Object.assign(p, zufaelligerHaufenPixel(w, h));
    }
  }

  // Pixel zeichnen
  for (const p of haufenPartikel) {
    let farbe;
    if (skin.animiert) {
      const idx = Math.floor((animationsWinkel + p.x / 30) % skin.farben.length);
      farbe = skin.farben[Math.abs(idx) % skin.farben.length];
    } else if (skin.pulsierend) {
      farbe = skin.farben[p.farbIndex % skin.farben.length];
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(animationsWinkel + p.x / 20);
    } else if (skin.kristall) {
      farbe = skin.farben[p.farbIndex % skin.farben.length];
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(animationsWinkel * 0.8 + p.phase);
    } else {
      farbe = skin.farben[p.farbIndex % skin.farben.length];
    }

    ctx.fillStyle = farbe;
    ctx.fillRect(Math.round(p.x - p.groesse / 2), Math.round(p.y - p.groesse / 2), Math.round(p.groesse), Math.round(p.groesse));
    ctx.globalAlpha = 1;

    // Glitzer-Effekt
    if (skin.glitzer && Math.random() < 0.002) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - 1), 2, 2);
    }
  }

  // Rahmen
  ctx.strokeStyle = 'rgba(148,163,184,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(2, 2, w - 4, h - 4);
}

// Klick-Partikel erzeugen
function partikelErzeugen(x, y, text) {
  const el = document.createElement('div');
  el.className = 'partikel';
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  KLICK-MECHANIK + UI-RENDERING                          ║
// ╚══════════════════════════════════════════════════════════╝

function klickHandler(event) {
  const ppk = berechneteStats.ppk * aktiveBoosts.ppkMultiplikator;
  zustand.pixel += ppk;
  zustand.lifetimePixel += ppk;
  zustand.gesamtKlicks++;

  // Klick-Ring pulsieren
  const ring = document.getElementById('klickRing');
  if (ring) {
    ring.classList.remove('puls');
    void ring.offsetWidth; // Reflow um Animation neu zu starten
    ring.classList.add('puls');
  }

  const rect = event.currentTarget.getBoundingClientRect();
  partikelErzeugen(
    event.clientX || rect.left + rect.width / 2,
    event.clientY || rect.top + rect.height / 2,
    '+' + fmt(ppk)
  );

  document.getElementById('klickInfo').textContent = '+' + fmt(ppk) + ' Pixel';
  if (typeof errungenschaftenPruefen === 'function') errungenschaftenPruefen();
}

function renderStats() {
  const statPixel = document.getElementById('statPixel');
  if (!statPixel) return;
  statPixel.textContent = fmt(zustand.pixel) + ' Pixel';
  document.getElementById('statPPS').textContent = fmt(berechneteStats.pps) + '/s';
  document.getElementById('statPPK').textContent = fmt(berechneteStats.ppk);
  document.getElementById('statQP').textContent = fmt(zustand.quantumPixel) + ' QP';
  document.getElementById('statPrestige').textContent = zustand.prestige;
}

function prestigeBtnAktualisieren() {
  const btn = document.getElementById('prestigeBtn');
  const info = document.getElementById('prestigeInfo');
  const schwelle = zustand.prestige === 0 ? 1000 : 1000 * Math.pow(10, zustand.prestige);
  if (zustand.pixel >= schwelle || zustand.lifetimePixel >= schwelle) {
    btn.disabled = false;
    const qp = berechneQPGewinn();
    info.textContent = `+${fmt(qp)} Quantum-Pixel`;
  } else {
    btn.disabled = true;
    info.textContent = `Brauche ${fmt(schwelle)} Pixel`;
  }
}

function shopTabAktivieren(tabName) {
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.toggle('aktiv', t.dataset.tab === tabName));
  document.getElementById('shopGebaeude').classList.toggle('versteckt', tabName !== 'gebaeude');
  document.getElementById('shopUpgrades').classList.toggle('versteckt', tabName !== 'upgrades');
  document.getElementById('shopPrestige').classList.toggle('versteckt', tabName !== 'prestige');
  document.getElementById('bulkLeiste').classList.toggle('versteckt', tabName !== 'gebaeude');
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SHOP                                                   ║
// ╚══════════════════════════════════════════════════════════╝

function shopRendern() {
  shopGebaeudeRendern();
  shopUpgradesRendern();
  shopPrestigeRendern();
}

function gebaeudeIconZeichen(id) {
  const icons = {
    maschine: '⚙', foerderband: '⇒', drucker: '▤', sortieranlage: '⊞',
    labor: '⌬', quantencomp: '◈', reaktor: '⊕', portal: '⊗',
    universum: '✦', zeitmaschine: '↻', nanofabrik: '◆', biomatrix: '⬡',
    warpgenerator: '⊜', singularitaet: '◉', goettlich: '✧',
  };
  return icons[id] || '?';
}

function shopGebaeudeRendern() {
  const container = document.getElementById('shopGebaeude');
  container.innerHTML = '';

  for (const g of GEBAEUDE) {
    if (g.minPrestige && zustand.prestige < g.minPrestige) {
      const el = document.createElement('div');
      el.className = 'gebaeude-eintrag gesperrt';
      el.innerHTML = `
        <div class="gebaeude-icon" style="background:${g.farbe}22">🔒</div>
        <div class="gebaeude-info">
          <div class="gebaeude-name">${g.name}</div>
          <div class="gebaeude-pps">Ab Prestige ${g.minPrestige}</div>
        </div>
        <div class="gebaeude-preis-block"></div>`;
      container.appendChild(el);
      continue;
    }

    const anzahl = zustand.gebaeude[g.id] || 0;
    const menge = bulkMenge === 0 ? gebaeudeMaxMenge(g) : bulkMenge;
    const preis = menge <= 1 ? gebaeudePreis(g, anzahl) : gebaeudeGesamtPreis(g, menge);
    const kannKaufen = zustand.pixel >= gebaeudePreis(g, anzahl);
    const el = document.createElement('div');
    el.className = `gebaeude-eintrag${kannKaufen ? ' leistbar' : ' zu-teuer'}`;

    const bulkInfo = menge > 1 && kannKaufen
      ? `<div class="gebaeude-bulk-info">×${menge} = ${fmt(preis)}</div>`
      : (menge > 1 ? `<div class="gebaeude-bulk-info">×${menge}</div>` : '');

    el.innerHTML = `
      <div class="gebaeude-icon" style="background:${g.farbe}22; color:${g.farbe}">
        ${gebaeudeIconZeichen(g.id)}
      </div>
      <div class="gebaeude-info">
        <div class="gebaeude-name">${g.name}</div>
        <div class="gebaeude-pps">${fmt(g.basisPPS)}/s pro Stück</div>
      </div>
      <div class="gebaeude-preis-block">
        <div class="gebaeude-preis">${fmt(menge <= 1 ? preis : gebaeudePreis(g, anzahl))}</div>
        ${anzahl > 0 ? `<div class="gebaeude-anzahl-badge">${anzahl}</div>` : ''}
        ${bulkInfo}
      </div>`;

    el.addEventListener('click', () => gebaeudeKaufen(g));
    container.appendChild(el);
  }
}

function gebaeudeKaufen(g) {
  const menge = bulkMenge === 0 ? gebaeudeMaxMenge(g) : bulkMenge;
  if (menge <= 0) return;
  for (let i = 0; i < menge; i++) {
    const anzahl = zustand.gebaeude[g.id] || 0;
    const preis = gebaeudePreis(g, anzahl);
    if (zustand.pixel < preis) break;
    zustand.pixel -= preis;
    zustand.gebaeude[g.id] = anzahl + 1;
  }
  statsNeuBerechnen();
  shopRendern();
}

function shopUpgradesRendern() {
  const container = document.getElementById('shopUpgrades');
  container.innerHTML = '';

  const verfuegbar = UPGRADES.filter(up =>
    !zustand.upgrades.includes(up.id) && up.bedingung(zustand)
  );

  if (verfuegbar.length === 0) {
    container.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;text-align:center">Noch keine Upgrades verfügbar</div>';
    return;
  }

  const klickTypen = ['klick_add', 'klick_mult'];
  const sortiert = upgradesInterleaved(verfuegbar);

  for (const up of sortiert) {
    const istKlick = klickTypen.includes(up.typ);
    const kannKaufen = zustand.pixel >= up.preis;
    const el = document.createElement('div');
    const kategorieKlasse = istKlick ? 'ppk-upgrade' : 'pps-upgrade';
    el.className = `upgrade-eintrag ${kategorieKlasse}${kannKaufen ? ' leistbar' : ' zu-teuer'}`;
    el.innerHTML = `
      <div class="upgrade-name">${up.name}</div>
      <div class="upgrade-beschreibung">${up.beschreibung}</div>
      <div class="upgrade-preis">${fmt(up.preis)} Pixel</div>`;
    el.addEventListener('click', () => upgradeKaufen(up));
    container.appendChild(el);
  }
}

function upgradeKaufen(up) {
  if (zustand.upgrades.includes(up.id)) return;
  if (zustand.pixel < up.preis) return;
  zustand.pixel -= up.preis;
  zustand.upgrades.push(up.id);
  statsNeuBerechnen();
  shopRendern();
}

function shopPrestigeRendern() {
  const container = document.getElementById('shopPrestige');
  container.innerHTML = '';

  // Nur Upgrades die noch nicht gekauft sind und deren Prestige-Voraussetzung erfüllt ist
  const verfuegbar = PRESTIGE_UPGRADES.filter(up =>
    !zustand.prestigeUpgrades.includes(up.id) &&
    (!up.minPrestige || zustand.prestige >= up.minPrestige)
  );

  // Gesperrte Meilenstein-Upgrades als Vorschau anzeigen
  const gesperrteMeilensteine = PRESTIGE_UPGRADES.filter(up =>
    !zustand.prestigeUpgrades.includes(up.id) &&
    up.meilenstein &&
    up.minPrestige && zustand.prestige < up.minPrestige
  );

  if (verfuegbar.length === 0 && gesperrteMeilensteine.length === 0) {
    container.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;text-align:center">Alle Quantum-Upgrades gekauft!</div>';
    return;
  }

  for (const up of verfuegbar) {
    const kannKaufen = zustand.quantumPixel >= up.preisQP;
    const el = document.createElement('div');
    el.className = `upgrade-eintrag prestige-up${up.meilenstein ? ' meilenstein-up' : ''}${kannKaufen ? ' leistbar' : ' zu-teuer'}`;
    el.innerHTML = `
      <div class="upgrade-name">${up.name}</div>
      <div class="upgrade-beschreibung">${up.beschreibung}</div>
      <div class="upgrade-preis">⬡ ${fmt(up.preisQP)} Quantum-Pixel</div>`;
    el.addEventListener('click', () => prestigeUpgradeKaufen(up));
    container.appendChild(el);
  }

  // Gesperrte Meilensteine als Ausblick zeigen
  for (const up of gesperrteMeilensteine) {
    const el = document.createElement('div');
    el.className = 'upgrade-eintrag prestige-up meilenstein-up gesperrt';
    el.innerHTML = `
      <div class="upgrade-name">${up.name}</div>
      <div class="upgrade-beschreibung">Ab Prestige ${up.minPrestige} verfügbar</div>
      <div class="upgrade-preis">⬡ ${fmt(up.preisQP)} Quantum-Pixel</div>`;
    container.appendChild(el);
  }
}

function prestigeUpgradeKaufen(up) {
  if (zustand.prestigeUpgrades.includes(up.id)) return;
  if (zustand.quantumPixel < up.preisQP) return;
  zustand.quantumPixel -= up.preisQP;
  zustand.prestigeUpgrades.push(up.id);
  if (up.typ === 'qp_start_bonus') zustand.pixel += up.wert;
  statsNeuBerechnen();
  shopRendern();
}

// ╔══════════════════════════════════════════════════════════╗
// ║  PRESTIGE                                               ║
// ╚══════════════════════════════════════════════════════════╝

function prestigeDurchfuehren() {
  const schwelle = zustand.prestige === 0 ? 1000 : 1000 * Math.pow(10, zustand.prestige);
  if (zustand.pixel < schwelle && zustand.lifetimePixel < schwelle) return;

  const qpGewinn = berechneQPGewinn();
  document.getElementById('pcQP').textContent = `+${fmt(qpGewinn)} Quantum-Pixel`;
  document.getElementById('prestigeConfirmModal').classList.remove('versteckt');
  document.getElementById('prestigeConfirmModal').dataset.qp = qpGewinn;
}

function prestigeAusfuehren(qpGewinn) {
  zustand.quantumPixel += qpGewinn;
  zustand._gesamtQP += qpGewinn;
  zustand.prestige += 1;
  zustand.pixel = 0;
  zustand.gebaeude = Object.fromEntries(GEBAEUDE.map(g => [g.id, 0]));
  zustand.upgrades = [];
  zustand._speedrunStart = Date.now();
  zustand._speedrunOk = false;

  const startBonusGekauft = zustand.prestigeUpgrades.includes('qp_start');
  if (startBonusGekauft) {
    const startBonus = PRESTIGE_UPGRADES.find(u => u.id === 'qp_start');
    if (startBonus) zustand.pixel += startBonus.wert;
  }

  skinsPruefen();
  statsNeuBerechnen();
  haufeInitialisieren();
  shopRendern();
  errungenschaftenPruefen();
  toastZeigen(`✦ Prestige ${zustand.prestige}! +${fmt(qpGewinn)} Quantum-Pixel`);
  spielstandSpeichern();
}

function prestigeAnimationZeigen(qpGewinn, callback) {
  const overlay = document.getElementById('prestigeAnimOverlay');
  const canvas  = document.getElementById('prestigePartikelCanvas');
  document.getElementById('paQPText').textContent = `+${fmt(qpGewinn)} Quantum-Pixel`;

  overlay.hidden = false;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext('2d');
  const farben = ['#8b5cf6','#a78bfa','#fbbf24','#60a5fa','#34d399','#f472b6'];
  const partikel = [];

  for (let i = 0; i < 130; i++) {
    partikel.push({
      x:    Math.random() * canvas.width,
      y:    canvas.height + Math.random() * 60,
      vx:   (Math.random() - 0.5) * 5,
      vy:   -(3 + Math.random() * 6),
      size: 5 + Math.random() * 9,
      farbe: farben[Math.floor(Math.random() * farben.length)],
    });
  }

  const start = performance.now();
  const dauer = 2600;

  function frame(now) {
    const t = (now - start) / dauer;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of partikel) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.06; // leichte Schwerkraft
      const alpha = Math.max(0, 1 - t * 1.1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = p.farbe;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      overlay.hidden = true;
      callback();
    }
  }

  requestAnimationFrame(frame);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SKINS                                                  ║
// ╚══════════════════════════════════════════════════════════╝

function skinsPruefen() {
  const p = zustand.prestige;
  for (const skin of SKINS) {
    if (p >= skin.minPrestige && !zustand.skins.freigeschaltet.includes(skin.id)) {
      zustand.skins.freigeschaltet.push(skin.id);
      if (typeof toastZeigen === 'function') toastZeigen(`🎨 Skin freigeschaltet: ${skin.name}!`);
    }
  }
}

function skinModalRendern() {
  const grid = document.getElementById('skinGrid');
  grid.innerHTML = '';

  for (const skin of SKINS) {
    const freigeschaltet = zustand.skins.freigeschaltet.includes(skin.id);
    const aktiv = zustand.skins.aktiv === skin.id;
    const el = document.createElement('div');
    el.className = `skin-karte${aktiv ? ' aktiv' : ''}${freigeschaltet ? '' : ' gesperrt'}`;

    const vorschau = document.createElement('div');
    vorschau.className = 'skin-vorschau';
    if (freigeschaltet) {
      vorschau.style.background = skin.animiert
        ? `linear-gradient(135deg, ${skin.farben.join(', ')})`
        : skin.farben[0];
    } else {
      vorschau.style.background = '#e2e8f0';
    }
    el.appendChild(vorschau);

    el.innerHTML += `
      <div class="skin-name">${skin.name}</div>
      <div class="skin-anforderung">${freigeschaltet ? (aktiv ? '✓ Aktiv' : 'Klicken zum Aktivieren') : `Prestige ${skin.minPrestige}`}</div>`;

    if (freigeschaltet) {
      el.addEventListener('click', () => {
        zustand.skins.aktiv = skin.id;
        skinModalRendern();
        haufeInitialisieren();
      });
    }

    grid.appendChild(el);
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  GOLDENE PIXEL + EREIGNISSE                             ║
// ╚══════════════════════════════════════════════════════════╝

let goldenTimerId = null;
let ereignisTimerId = null;
let aktivesGoldElement = null;

function goldenIntervallMs() {
  let ms = 240000; // 4 Minuten Basis
  for (const upId of zustand.prestigeUpgrades) {
    const up = PRESTIGE_UPGRADES.find(u => u.id === upId);
    if (up?.typ === 'qp_golden_freq') ms /= up.wert;
  }
  if (zustand.prestige >= 5) ms *= 0.8;
  return Math.max(ms, 30000);
}

function goldenPixelSpawnen() {
  if (aktivesGoldElement) return;

  const el = document.createElement('div');
  el.className = 'goldener-pixel';

  const x = 60 + Math.random() * (window.innerWidth - 120);
  const y = 80 + Math.random() * (window.innerHeight - 160);
  el.style.left = x + 'px';
  el.style.top = y + 'px';

  el.addEventListener('click', () => goldenPixelKlicken(el));
  document.getElementById('goldenLayer').appendChild(el);
  aktivesGoldElement = el;

  setTimeout(() => {
    if (aktivesGoldElement === el) {
      el.remove();
      aktivesGoldElement = null;
    }
  }, 30000);

  goldenTimerId = setTimeout(goldenPixelSpawnen, goldenIntervallMs());
}

function goldenPixelKlicken(el) {
  el.remove();
  aktivesGoldElement = null;
  zustand.goldenPixelKlicks++;

  let bonus = berechneteStats.pps * 15 * 60; // 15 Minuten Produktion
  if (zustand.prestige >= 15) bonus *= 2;
  for (const upId of zustand.prestigeUpgrades) {
    const up = PRESTIGE_UPGRADES.find(u => u.id === upId);
    if (up?.typ === 'qp_golden_bonus') bonus *= up.wert;
  }

  zustand.pixel += bonus;
  zustand.lifetimePixel += bonus;
  if (typeof toastZeigen === 'function') toastZeigen(`⭐ Goldener Pixel! +${fmt(bonus)} Pixel`);
  errungenschaftenPruefen();
}

const EREIGNISSE = [
  { name: 'Produktionsboost', text: '⚡ Produktionsboost! 2× PpS für 60 Sek.', dauer: 60000, ppsM: 2, ppkM: 1 },
  { name: 'Klick-Boost',      text: '👆 Klick-Boost! 10× PpK für 30 Sek.',     dauer: 30000, ppsM: 1, ppkM: 10 },
  { name: 'Pixel-Regen',      text: '🌧 Pixel-Regen! +5% Pixel sofort.',         dauer: 0,     ppsM: 1, ppkM: 1, sofort: (z) => { const b = z.pixel * 0.05; z.pixel += b; z.lifetimePixel += b; } },
];

function ereignisIntervallMs() {
  let ms = 420000; // 7 Minuten
  if (zustand.prestige >= 5)  ms *= 0.7;
  if (zustand.prestige >= 10) ms *= 0.7;
  return Math.max(ms, 60000);
}

function zufaelligesEreignis() {
  const e = EREIGNISSE[Math.floor(Math.random() * EREIGNISSE.length)];
  const banner = document.getElementById('ereignisBanner');

  if (e.sofort) {
    e.sofort(zustand);
  } else if (e.dauer > 0) {
    aktiveBoosts.ppsMultiplikator = e.ppsM;
    aktiveBoosts.ppkMultiplikator = e.ppkM;
    aktiveBoosts.endeMs = Date.now() + e.dauer;
  }

  banner.textContent = e.text;
  banner.hidden = false;
  setTimeout(() => { banner.hidden = true; }, 5000);
  if (typeof toastZeigen === 'function') toastZeigen(e.text);

  ereignisTimerId = setTimeout(zufaelligesEreignis, ereignisIntervallMs());
}

function ereignisseStarten() {
  goldenTimerId = setTimeout(goldenPixelSpawnen, goldenIntervallMs());
  ereignisTimerId = setTimeout(zufaelligesEreignis, ereignisIntervallMs());
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ERRUNGENSCHAFTEN + TOAST                               ║
// ╚══════════════════════════════════════════════════════════╝

function errungenschaftenPruefen() {
  for (const e of ERRUNGENSCHAFTEN) {
    if (zustand.errungenschaften.includes(e.id)) continue;
    try {
      if (e.pruefe(zustand)) {
        zustand.errungenschaften.push(e.id);
        toastZeigen(`${e.icon} Errungenschaft: ${e.name}`);
      }
    } catch (_) { /* Prüfung schlägt still fehl */ }
  }
}

function toastZeigen(text) {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function errungenschaftenModalRendern() {
  const grid = document.getElementById('errungenschaftenGrid');
  grid.innerHTML = '';

  const gesamt = ERRUNGENSCHAFTEN.length;
  const erreicht = zustand.errungenschaften.length;
  const header = document.createElement('div');
  header.style.cssText = 'grid-column:1/-1;margin-bottom:8px;font-size:0.85rem;color:var(--text-muted)';
  header.textContent = `${erreicht} / ${gesamt} freigeschaltet`;
  grid.appendChild(header);

  for (const e of ERRUNGENSCHAFTEN) {
    const freigeschaltet = zustand.errungenschaften.includes(e.id);
    const el = document.createElement('div');
    el.className = `errungenschaft-karte ${freigeschaltet ? 'freigeschaltet' : 'gesperrt'}`;
    el.innerHTML = `
      <div class="errungenschaft-icon">${e.icon}</div>
      <div class="errungenschaft-name">${freigeschaltet ? e.name : '???'}</div>
      <div class="errungenschaft-text">${freigeschaltet ? e.text : 'Noch nicht erreicht'}</div>`;
    grid.appendChild(el);
  }
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SUPABASE SPEICHERN / LADEN                             ║
// ╚══════════════════════════════════════════════════════════╝

async function spielstandSpeichern(mitToast = true) {
  const user = await PZ.getUser();
  if (!user) {
    if (mitToast) toastZeigen('⚠ Nicht eingeloggt – Spielstand nicht gespeichert');
    return;
  }

  zustand.letzterBesuch = Date.now();

  // _speedrunStart ist nur Laufzeit, nicht speichern
  const { _speedrunStart, ...zustandZumSpeichern } = zustand;

  await PZ.saveGameData(
    'pixel-factory',
    Math.floor(zustand.lifetimePixel),
    zustand.prestige,
    zustandZumSpeichern
  );

  if (mitToast) toastZeigen('💾 Gespeichert!');
}

async function spielstandLaden() {
  const daten = await PZ.loadScore('pixel-factory');
  if (!daten || !daten.extra_daten) return false;

  // Gespeicherten Zustand mit Standard zusammenführen (neue Felder ergänzen)
  const standard = standardZustand();
  zustand = { ...standard, ...daten.extra_daten, _speedrunStart: Date.now() };

  // Offline-Bonus berechnen
  const jetzt = Date.now();
  const deltaMs = Math.max(0, jetzt - (zustand.letzterBesuch || jetzt));
  const maxMs = maxOfflineStunden() * 3600 * 1000;
  const bonusMs = Math.min(deltaMs, maxMs);

  if (bonusMs > 60000) {
    statsNeuBerechnen();
    const bonus = berechneteStats.pps * (bonusMs / 1000) * 0.5; // 50 % Offline-Effizienz
    if (bonus > 0) {
      zustand.pixel += bonus;
      zustand.lifetimePixel += bonus;
      zustand._offlineBonusErhalten = true;

      const minuten = Math.floor(bonusMs / 60000);
      const banner = document.getElementById('offlineBonus');
      banner.textContent = `💤 Offline-Bonus: +${fmt(bonus)} Pixel (${minuten} Minuten)`;
      banner.hidden = false;
      setTimeout(() => { banner.hidden = true; }, 8000);
    }
  }

  zustand.letzterBesuch = jetzt;
  return true;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RANGLISTE                                              ║
// ╚══════════════════════════════════════════════════════════╝

let ranglisteAktivTab = 'pixel';

async function ranglisteRendern() {
  const inhalt = document.getElementById('ranglisteInhalt');
  inhalt.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Lade…</div>';

  const eintraege = await PZ.getLeaderboard('pixel-factory', 10);
  const eigenerUser = await PZ.getUser();
  const eigenerId = eigenerUser?.id;

  if (!eintraege.length) {
    inhalt.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted)">Noch keine Einträge</div>';
    return;
  }

  // Prestige-Tab: client-seitig nach level sortieren
  let sortiert = [...eintraege];
  if (ranglisteAktivTab === 'prestige') {
    sortiert.sort((a, b) => (b.level || 0) - (a.level || 0));
  }

  const hauptSpalte = ranglisteAktivTab === 'prestige' ? 'Prestige' : 'Pixel';
  const nebenSpalte = ranglisteAktivTab === 'prestige' ? 'Pixel' : 'Prestige';

  let html = `<table class="rangliste-tabelle">
    <thead><tr>
      <th>#</th><th>Spieler</th><th>${hauptSpalte}</th><th>${nebenSpalte}</th>
    </tr></thead><tbody>`;

  sortiert.forEach((e, i) => {
    const rang = i + 1;
    const klasse = rang === 1 ? 'rang-1' : rang === 2 ? 'rang-2' : rang === 3 ? 'rang-3' : '';
    const eigenKlasse = e.user_id === eigenerId ? ' rang-eigen' : '';
    const hauptwert = ranglisteAktivTab === 'prestige'
      ? (e.level || 0)
      : fmt(e.punkte || 0);
    const nebenwert = ranglisteAktivTab === 'prestige'
      ? fmt(e.punkte || 0)
      : (e.level || 0);
    const medal = rang === 1 ? '🥇' : rang === 2 ? '🥈' : rang === 3 ? '🥉' : rang;
    html += `<tr class="${klasse}${eigenKlasse}">
      <td>${medal}</td>
      <td>${e.username || 'Anonym'}</td>
      <td>${hauptwert}</td>
      <td>${nebenwert}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  inhalt.innerHTML = html;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  INITIALISIERUNG                                        ║
// ╚══════════════════════════════════════════════════════════╝

document.addEventListener('DOMContentLoaded', async () => {
  await PZ.updateNavbar();

  // Tutorial-Buttons
  document.getElementById('tutWeiter').addEventListener('click', () => {
    if (tutorialSchritt < TUTORIAL_SCHRITTE.length - 1) {
      tutorialSchritt++;
      tutorialSchrittRendern();
    } else {
      tutorialSchliessen();
    }
  });
  document.getElementById('tutSkip').addEventListener('click', tutorialSchliessen);

  // Spielstand laden (oder frischen Zustand verwenden)
  const geladen = await spielstandLaden();
  if (!geladen) zustand = standardZustand();

  statsNeuBerechnen();
  skinsPruefen();
  haufeInitialisieren();
  shopRendern();
  errungenschaftenPruefen();
  prestigeBtnAktualisieren();

  // Canvas – Klick + Touch
  const canvas = document.getElementById('pixelHaufen');
  canvas.addEventListener('click', klickHandler);
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    klickHandler(e.changedTouches?.[0] || e);
  }, { passive: false });

  // Prestige
  document.getElementById('prestigeBtn').addEventListener('click', prestigeDurchfuehren);

  // Prestige Bestätigungs-Modal
  document.getElementById('prestigeConfirmJa').addEventListener('click', () => {
    const qpGewinn = Number(document.getElementById('prestigeConfirmModal').dataset.qp);
    document.getElementById('prestigeConfirmModal').classList.add('versteckt');
    prestigeAnimationZeigen(qpGewinn, () => prestigeAusfuehren(qpGewinn));
  });
  document.getElementById('prestigeConfirmNein').addEventListener('click', () => {
    document.getElementById('prestigeConfirmModal').classList.add('versteckt');
  });

  // Speichern
  document.getElementById('speichernBtn').addEventListener('click', () => spielstandSpeichern(true));

  // Rangliste
  document.getElementById('ranglisteBtn').addEventListener('click', () => {
    document.getElementById('ranglisteModal').classList.remove('versteckt');
    ranglisteRendern();
  });
  document.getElementById('ranglisteSchliessen').addEventListener('click', () => {
    document.getElementById('ranglisteModal').classList.add('versteckt');
  });
  document.querySelectorAll('.rl-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rl-tab').forEach(t => t.classList.remove('aktiv'));
      tab.classList.add('aktiv');
      ranglisteAktivTab = tab.dataset.rl;
      ranglisteRendern();
    });
  });

  // Errungenschaften
  document.getElementById('errungenschaftenBtn').addEventListener('click', () => {
    errungenschaftenModalRendern();
    document.getElementById('errungenschaftenModal').classList.remove('versteckt');
  });
  document.getElementById('errungenschaftenSchliessen').addEventListener('click', () => {
    document.getElementById('errungenschaftenModal').classList.add('versteckt');
  });

  // Skins
  document.getElementById('skinBtn').addEventListener('click', () => {
    skinModalRendern();
    document.getElementById('skinModal').classList.remove('versteckt');
  });
  document.getElementById('skinSchliessen').addEventListener('click', () => {
    document.getElementById('skinModal').classList.add('versteckt');
  });

  // Modal-Hintergrund klick schließt Modal
  document.querySelectorAll('.modal-hintergrund').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.add('versteckt');
    });
  });

  // Shop-Tabs
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => shopTabAktivieren(tab.dataset.tab));
  });

  // Bulk-Kauf Buttons
  document.querySelectorAll('.bulk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bulk-btn').forEach(b => b.classList.remove('aktiv'));
      btn.classList.add('aktiv');
      bulkMenge = Number(btn.dataset.menge);
      shopGebaeudeRendern();
    });
  });

  // Game Loop starten
  spielGestartet = true;
  loopId = requestAnimationFrame(gameLoop);

  // Ereignisse starten
  ereignisseStarten();

  // Tutorial bei erstem Start zeigen
  tutorialZeigen();

  // Autosave alle 60 Sekunden (kein Toast)
  setInterval(() => spielstandSpeichern(false), 30000);

  // Beim Verlassen: letzterBesuch aktualisieren damit Offline-Bonus stimmt
  window.addEventListener('beforeunload', () => {
    zustand.letzterBesuch = Date.now();
  });
});
