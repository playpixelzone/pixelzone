/**
 * Shop-Definitionen — 25 PPS + 25 PPC, exponentielle Stufen (Basispreis & Kraft).
 * Preis pro Level: basePrice * 1.15^level
 */

/** @typedef {{ id: string; name: string; basePrice: number; type: 'PPS' | 'PPC'; perLevel: number; lore: string }} UpgradeDef */

/** Erste drei Generatoren: bewusst günstiger Einstieg (Spielstand-IDs unverändert). */
const PPS_CORE = /** @type {UpgradeDef[]} */ ([
  {
    id: 'skeletonScraper',
    name: 'Skelett-Schürfer',
    basePrice: 15,
    type: 'PPS',
    perLevel: 0.1,
    lore:
      'Mit rostigen Hacken und leiser Geduld wühlen sie sich durch alte Gräber — jeder Splitter Knochenstaub wird zum Tribut an deinen Altar.',
  },
  {
    id: 'ghoul',
    name: 'Ghul',
    basePrice: 100,
    type: 'PPS',
    perLevel: 0.5,
    lore:
      'Ausgehungerte Schatten an Rand der Schlachtfelder: Sie kauen Fleisch von den Knochen und liefern dir, was übrig bleibt — blank und brauchbar.',
  },
  {
    id: 'boneGolem',
    name: 'Knochen-Golem',
    basePrice: 500,
    type: 'PPS',
    perLevel: 2,
    lore:
      'Ein wankender Koloss aus Rippenbögen und Schädelketten. Jeder Schritt knirscht wie ein Grab, jeder Schritt bringt neue Knochen ans Licht.',
  },
]);

/** Mid- & Late-Game PPS: steigende Basispreise & PPS pro Level (exponentiell über die Stufe). */
const PPS_LATE_META = [
  [
    'bansheeChoir',
    'Banshee-Chor',
    'Ein Chor aus kreischenden Schatten, der durch Mauern fährt. Die Dorfbewohner sterben an Angst — du erntest nur das rhythmische Klappern der Reste.',
  ],
  [
    'bloodMage',
    'Blut-Magier',
    'Sie destillieren Leben zu roter Essenz und gießen sie in Knochenmehl. Was bricht, wird zu Staub; was steht, wird zur Fabrik.',
  ],
  [
    'necropolis',
    'Nekropole',
    'Eine Stadt aus Sarkophagen und offenen Grüften. Jede Straße ist ein Fließband; jede Glocke ruft einen neuen Schädel zur Arbeit.',
  ],
  [
    'soulReaper',
    'Seelen-Ernter',
    'Sie sammeln nicht Fleisch — sie schneiden Fäden aus dem Jenseits. Wo ein Seufzer endet, fällt ein Knochen in deinen Vorrat.',
  ],
  [
    'shadowDragon',
    'Schatten-Drache',
    'Sein Atem ist keine Flamme, sondern Finsternis, die Gräber öffnet. Ganze Friedhöfe kippen wie leere Truhen in deinen Schlund.',
  ],
  [
    'lichKing',
    'Lich-König',
    'Ein Thron aus geborstenen Becken und Krone aus Zähnen. Seine Befehle sind Frost; seine Steuern werden in Knochen entrichtet.',
  ],
  [
    'boneTitan',
    'Knochen-Titan',
    'Ein Titan, der Berge zu Mehl stampft. Jeder Schritt ist ein Erdbeben; jede Furche enthüllt ein Massengrab der Vergangenheit.',
  ],
  [
    'graveWarden',
    'Gruft-Wächter',
    'Ewige Wächter ohne Augen — nur Schlüsselbeine und Treue. Sie schließen niemanden ein; sie schließen nur die Rechnung deiner Knochen.',
  ],
  [
    'boneWurm',
    'Knochen-Wurm',
    'Ein Wurm aus Wirbeln und Gelenken, der sich durch Katakomben frisst. Er lässt Tunnel voller Schätze — und voller Schädel.',
  ],
  [
    'soulLantern',
    'Seelenlaterne',
    'Laternen aus Rippen und Glas, gefüllt mit flackernden Seelen. Ihr Licht lockt Verlorene — und ihr Aschenfall ist reines Material.',
  ],
  [
    'wailLegion',
    'Zeterchor',
    'Ein Heer, das nur schreit. Die Schreie brechen Fenster und Herzen; was herausfällt, wird gezählt und gebündelt.',
  ],
  [
    'ashPriest',
    'Aschen-Priester',
    'Priester in Roben aus Asche. Sie segnen die Brandstätten der Welt — und sieben Knochen aus der Glut wie Gold aus Sand.',
  ],
  [
    'tombColossus',
    'Grabmal-Koloss',
    'Ein lebendiges Mausoleum auf zwei Beinen aus Säulenknochen. Wo es steht, wird Geschichte zu Rohstoff.',
  ],
  [
    'starCorpse',
    'Sternen-Leiche',
    'Ein Körper, der vom Himmel fiel und nie verwesste. Seine Kometenspur hinterlässt eine Spur aus ossifiziertem Regen.',
  ],
  [
    'abyssCatalyst',
    'Abgrund-Katalyt',
    'Ein Gerät aus Obsidian und Rippe, das Realität anknabbert. Was ins Loch fällt, kommt als Knochenregen zurück.',
  ],
  [
    'worldRot',
    'Welten-Fäulnis',
    'Ein Pilz aus Fleisch und Zeit. Er frisst Grenzen zwischen Reichen — und düngt deinen Friedhof mit fremden Skeletten.',
  ],
  [
    'elderLich',
    'Ur-Lich',
    'Älter als Dynastien. Seine Bibliothek sind Wirbelsäulen; seine Feder ist ein Daumenknochen, der Verträge in Fleisch brennt.',
  ],
  [
    'boneDeity',
    'Knochen-Gottheit',
    'Ein halb erwachter Gott aus Ossifikation. Seine Gebete sind Erdbeben; seine Opfergaben sind ganze Generationen.',
  ],
  [
    'voidHerald',
    'Leere-Herold',
    'Er verkündet das Nichts — und das Nichts antwortet mit Knochen, die nirgends herkamen und überall hingehen.',
  ],
  [
    'catacombHeart',
    'Katakomben-Herz',
    'Ein pulsierender Klumpen aus verkalktem Fleisch und Röhren. Es pumpt Knochen durch Tunnel, die kein Lebender kartiert hat.',
  ],
  [
    'ossuaryThrone',
    'Beinhaus-Thron',
    'Ein Thron aus gestapelten Millionen. Wer darauf sitzt, hört jeden Knochen flüstern — und jeder flüstert Produktionsziele.',
  ],
  [
    'endBone',
    'Endknochen',
    'Die letzte Stufe vor dem Mythos: ein Wirbel, der Dimensionen wie Möhren zieht. Hier endet Skalierung — und beginnt Legende.',
  ],
];

function buildLatePps() {
  return PPS_LATE_META.map(([id, name, lore], j) => ({
    id,
    name,
    basePrice: Math.round(2200 * Math.pow(2.58, j)),
    type: 'PPS',
    perLevel: Number((2.85 * Math.pow(1.365, j)).toFixed(5)),
    lore,
  }));
}

const PPC_CORE = /** @type {UpgradeDef[]} */ ([
  {
    id: 'boneBlade',
    name: 'Knochenklingen',
    basePrice: 50,
    type: 'PPC',
    perLevel: 1,
    lore:
      'Gesplitterte Klingen aus Rippe und Obsidian — der Altar fühlt sich jeden Hieb, und die Welt bezahlt in Schädeln.',
  },
  {
    id: 'soulFocus',
    name: 'Seelen-Fokus',
    basePrice: 250,
    type: 'PPC',
    perLevel: 2,
    lore:
      'Ein verdrehter Kristall, der deinen Willen bündelt. Ein Klick wird zur konzentrierten Lawine aus Knochenmehl.',
  },
]);

const PPC_LATE_META = [
  [
    'ritualDagger',
    'Ritualdolch',
    'Ein Dolch, der nur in Mondschatten scharf ist. Jeder Stich ist eine Unterschrift im Fleisch der Realität.',
  ],
  [
    'bloodPact',
    'Blut-Pakt',
    'Du hast unterschrieben — nicht mit Tinte, sondern mit Puls. Jeder Herzschlag wird zu zusätzlicher Wucht auf den Altar.',
  ],
  [
    'curseOfWeakness',
    'Fluch der Schwäche',
    'Ein Fluch, der den Boden unter den Lebenden weich macht. Sie fallen schneller — du klickst härter.',
  ],
  [
    'necronomiconPage',
    'Nekronomicon-Seite',
    'Nur eine Seite — aber sie flüstert in sieben Sprachen gleichzeitig. Dein Finger wird zum Katalog des Todes.',
  ],
  [
    'ghostGauntlet',
    'Geister-Handschuh',
    'Ein Handschuh aus kalter Luft und Phalangen. Er greift durch Haut und Hoffnung gleichermaßen.',
  ],
  [
    'essenceSiphon',
    'Essenz-Sog',
    'Ein Trichter aus Silber und Nebel. Er saugt nicht Luft — er saugt Potenzial und presst es in deinen Klick.',
  ],
  [
    'marrowCrown',
    'Mark-Krone',
    'Eine Krone aus durchsichtigem Knochen. Sie drückt auf deine Schläfen — und auf die Skala deiner Gewalt.',
  ],
  [
    'fingerBone',
    'Fingerknochen-Fetisch',
    'Kleine Knochen, die an deinen Fingern rasseln. Jede Geste wird zur Trommel — jeder Schlag zur Fanfare.',
  ],
  [
    'graveSigil',
    'Grab-Siegel',
    'Ein Siegel, das Gräber öffnet, ohne sie zu berühren. Dein Klick wird zum Schlüssel unzähliger Türen.',
  ],
  [
    'soulShred',
    'Seelen-Fetzen',
    'Scharfe Schnipsel aus Seide und Schrei. Sie umwickeln deinen Willen und ziehen ihn straff.',
  ],
  [
    'brittleHex',
    'Spröder Fluch',
    'Ein Fluch, der Dinge brüchig macht — auch Wahrscheinlichkeiten. Plötzlich fühlt sich jeder Klick „zu leicht“ an.',
  ],
  [
    'ossuaryKey',
    'Beinhaus-Schlüssel',
    'Er passt in jedes Schloss, das je ein Schädel war. Dreh ihn — und Hallen öffnen sich in deiner Hand.',
  ],
  [
    'wailFocus',
    'Wehklage-Fokus',
    'Ein Kristall, der Schreie speichert und freisetzt. Dein Klick trägt Echo — und Echo trägt Gewicht.',
  ],
  [
    'ashCircle',
    'Aschen-Kreis',
    'Ein Kreis aus grauer Linie auf dem Boden. Was darin steht, wird leichter — was du klickst, wird schwerer.',
  ],
  [
    'tombBrand',
    'Grabmal-Brandmal',
    'Ein Brandzeichen, das auf Haut und Zeit brennt. Es markiert jeden Klick als Eigentum der Krypta.',
  ],
  [
    'starGrasp',
    'Sternen-Greif',
    'Deine Hand wird zu einem Sternbild — jede Spitze ein Nagel im Firmament der Lebenden.',
  ],
  [
    'abyssTouch',
    'Abgrund-Berührung',
    'Kühle Finger, die aus dem Nichts kommen. Sie helfen beim Klicken — und zählen mit.',
  ],
  [
    'voidNail',
    'Leere-Nagel',
    'Ein Nagel ohne Kopf und Ende. Er schlägt durch Dimensionen und nagelt deinen Schaden fest.',
  ],
  [
    'worldBite',
    'Weltbiss',
    'Ein Gebiss aus Meteoriten und Zähnen. Es beißt in die Realität — und spuckt Knochenfragmente aus.',
  ],
  [
    'elderMark',
    'Uraltes Mal',
    'Ein Symbol, älter als Sprache. Es erscheint auf deiner Hand — und vervielfacht die Bedeutung jedes Klicks.',
  ],
  [
    'boneScript',
    'Knochen-Schrift',
    'Runen, die nur auf Schädeln lesbar sind. Du schreibst mit dem Nagel — und die Welt antwortet mit Knacken.',
  ],
  [
    'throneEdge',
    'Thron-Kante',
    'Die scharfe Kante eines unsichtbaren Thrones. Du sitzt auf Macht — und schneidest mit ihr.',
  ],
  [
    'endClick',
    'Endklick-Fokus',
    'Die letzte Verstärkung vor dem Mythos: ein Ring aus verkohlten Daumen. Hier wird Klicken zur Religion.',
  ],
];

function buildLatePpc() {
  return PPC_LATE_META.map(([id, name, lore], j) => ({
    id,
    name,
    basePrice: Math.round(900 * Math.pow(3.05, j)),
    type: 'PPC',
    perLevel: Number((3.2 * Math.pow(1.42, j)).toFixed(5)),
    lore,
  }));
}

export const UPGRADE_DEFINITIONS = /** @type {UpgradeDef[]} */ ([
  ...PPS_CORE,
  ...buildLatePps(),
  ...PPC_CORE,
  ...buildLatePpc(),
]);

/** @param {number} basePrice */
export function priceAtLevel(basePrice, level) {
  return basePrice * Math.pow(1.15, level);
}

/** @param {string} id */
export function getDefinitionById(id) {
  return UPGRADE_DEFINITIONS.find((u) => u.id === id);
}
