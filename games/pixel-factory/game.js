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
  { id: 'zeitmaschine',  name: 'Zeitmaschine',               basisPreis: 100000000,    basisPPS: 35000,   farbe: '#fbbf24' },
  { id: 'singularitaet', name: 'Pixel-Singularität',         basisPreis: 1000000000,   basisPPS: 200000,  farbe: '#f43f5e', minPrestige: 20 },
  { id: 'goettlich',     name: 'Göttliche Fabrik',           basisPreis: 100000000000, basisPPS: 2000000, farbe: '#d946ef', minPrestige: 25 },
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
const UPGRADES = [...KLICK_UPGRADES, ...GEBAEUDE_UPGRADES, ...OFFLINE_UPGRADES, ...SYNERGIE_UPGRADES];

// === PRESTIGE-UPGRADES (mit Quantum-Pixel kaufbar) ===
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

// Hilfsfunktion: Gesamtgebäude zählen
function gesamtGebaeude(z) {
  return Object.values(z.gebaeude).reduce((s, n) => s + n, 0);
}
