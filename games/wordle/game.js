'use strict';

// ── Wörterliste ──────────────────────────────────────────────────────────────
// 500+ deutsche 5-Buchstaben-Wörter (Großbuchstaben, keine Eigennamen)
const WOERTER = [...new Set([
  'ABEND','ABGAS','ABTEI','ABWEG','ABZUG','ACHSE','ADLER','ADERN',
  'ALLEE','ALPEN','ALTER','AMPEL','AMSEL','ANGEL','ANGST','ANKER',
  'APFEL','ARCHE','ASCHE','ASSEL','ATLAS','ATOLL','AUGEN','AUTOS',
  'BÄCHE','BAHRE','BANDE','BÄNKE','BARKE','BAUCH','BAUER','BEERE',
  'BEIGE','BELLE','BESEN','BEULE','BIRKE','BIRNE','BITTE','BLASE',
  'BLATT','BLECH','BLICK','BLOCK','BLÖDE','BLÜTE','BLUME','BOMBE',
  'BOOTE','BOGEN','BOHNE','BORKE','BRAND','BRAUT','BRIEF','BRISE',
  'BROTE','BRÜHE','BRUST','BUCHE','BÜROS','BUSEN','BÜSTE',
  'DACHS','DAMPF','DAUER','DAUNE','DECKE','DEGEN','DEICH','DELTA',
  'DEPOT','DICKE','DIELE','DOCHT','DOGGE','DOHLE','DOLCH','DOLDE',
  'DRAHT','DRECK','DROGE','DRÜSE','DUELL','DUNST',
  'EBENE','EICHE','EIFER','EIMER','EILIG','ELCHE','ELEND','EMMER',
  'ENGEL','ERBSE','ERDÖL','ERKER','ERNTE','ESCHE',
  'FABEL','FADEN','FÄHRE','FAHRT','FALKE','FALLE','FARBE','FARNE',
  'FAUST','FEIGE','FEIER','FEILE','FEIND','FERNE','FERSE','FEUER',
  'FIBER','FILET','FINTE','FISCH','FLAUE','FLECK','FLÖHE','FLÖTE',
  'FLORA','FLÜGE','FLUSS','FOLGE','FOLIE','FONDS','FORUM','FREMD',
  'FRIST','FRÜHE','FUCHS','FUGEN','FUNKE','FUHRE','FUNDE','FUSEL',
  'GABEL','GÄHNE','GALLE','GARDE','GARBE','GATTE','GECKO',
  'GEIER','GEIGE','GEIST','GELEE','GEMSE','GERTE','GICHT',
  'GLANZ','GLATT','GLEIS','GLIED','GLÜCK','GNADE','GÖTZE',
  'GRABE','GRADE','GRATE','GRAUE','GRAUS','GREIF','GREIS',
  'GRIFF','GROBE','GRUND','GRÜNE','GURKE','GUNST','GÜSSE',
  'HAARE','HAFEN','HAFER','HAKEN','HALLE','HALME','HÄNDE',
  'HARFE','HASTE','HAUPT','HECHT','HEIDE','HEFTE','HEILE',
  'HELLE','HELME','HEMDE','HERDE','HERTZ','HEUER','HILFE',
  'HIRTE','HÖHLE','HOLDE','HOLME','HONIG','HORDE','HÜGEL',
  'HUMUS','HÜFTE','HÜTTE',
  'IDYLL','IMKER','INDEX','INSEL','IRREN',
  'JACKE','JAGEN','JAHRE','JOPPE','JUBEL',
  'KABEL','KÄFER','KÄFIG','KÄLTE','KAMEL','KANAL','KAMPF',
  'KAPPE','KARTE','KARST','KATZE','KEILE','KELCH','KELLE',
  'KIEME','KIEPE','KISTE','KLAUE','KLEBE','KLANG','KLEID',
  'KLIMA','KLOTZ','KLUGE','KNABE','KNALL','KNOPF','KNÄUL',
  'KOGGE','KOHLE','KOMET','KRAFT','KRAKE','KRÄHE','KRANZ',
  'KREIS','KREUZ','KRONE','KRÖTE','KRUME','KÜCHE','KÜKEN',
  'KUNDE','KUPPE','KUNST','KURVE','KÜSTE',
  'LADEN','LAGER','LAICH','LAKEI','LAMPE','LANZE','LARVE',
  'LAUBE','LAUCH','LAUER','LAUNE','LATTE','LEDER','LEHNE',
  'LEHRE','LEINE','LEISE','LICHT','LIEBE','LINDE','LINIE',
  'LINKE','LINSE','LITER','LISTE','LOCKE','LUCHS','LÜCKE',
  'LUMPE','LUNGE','LUNTE','LÖWEN',
  'MACHO','MAGMA','MAHNE','MÄHNE','MAKEL','MARKE','MARKT',
  'MASKE','MASSE','MATTE','MAUER','MEILE','MEISE','MIENE',
  'MILBE','MILCH','MILDE','MINZE','MÖBEL','MÖHRE','MOLCH',
  'MOLKE','MONDE','MÖNCH','MORAL','MOTTE','MOTIV','MÖWEN',
  'MULDE','MUMIE','MÜNZE','MUSIK','MURKS','MYRTE',
  'NACHT','NADEL','NARBE','NARRE','NATUR','NEBEL','NEBEN',
  'NEIGE','NERVE','NOTIZ','NOTEN','NUDEL','NÜSSE',
  'OCKER','OHREN','OLIVE','OPFER','ORGEL','ORKAN','ORNAT','OTTER',
  'PAKET','PANNE','PAPPE','PAUSE','PEDAL','PELZE','PERLE',
  'PIANO','PICKE','PILZE','PINNE','PISTE','PLAGE','PLANE',
  'PLATZ','PLÄNE','PLATT','POKAL','POLKA','POLLE','POREN',
  'PRALL','PREIS','PROBE','PUNKT','PUDER','PUMPE','PUTZE',
  'QUARZ',
  'RACHE','RAMPE','RASEN','RASSE','RASUR','RATEN','RAUPE',
  'RAUTE','REGEN','REIFE','REIHE','RENTE','RESTE','RIESE',
  'RILLE','RINDE','RINGE','RIPPE','RITZE','ROBBE','ROSEN',
  'RÖHRE','ROTTE','RUDER','RÜCKE',
  'SACHE','SÄCKE','SÄFTE','SAGEN','SAHNE','SAITE','SALBE',
  'SALVE','SALZE','SAMEN','SAMBA','SARGE','SAUNA','SCHAM',
  'SCHAL','SCHAF','SCHAU','SCHEU','SEGEL','SEELE','SEHER',
  'SEIDE','SEIFE','SEILE','SEKTE','SENNE','SENKE','SENSE',
  'SICHT','SIEGE','SIRUP','SKALA','SOCKE','SOLAR','SOHLE',
  'SONDE','SONNE','SORGE','SPALT','SPATZ','SPEER','SPIEL',
  'SPORE','SPORT','SPOTT','SPREU','SPULE','SPÄNE','STAAT',
  'STAHL','STAMM','STAND','STANK','STAUB','STEIG','STICH',
  'STIEG','STIFT','STIRN','STOCK','STOFF','STOLZ','STROH',
  'STROM','STUBE','STUCK','STUHL','STURM','SUCHE','SUCHT',
  'SÜDEN','SUMME','SUMPF','SÜSSE',
  'TAFEL','TANNE','TANKE','TANTE','TAUBE','TEMPO','TIGER',
  'TINTE','TITAN','TONNE','TORTE','TROST','TRAUM','TRECK',
  'TREUE','TRIEB','TRITT','TROTZ','TRÜBE','TÜCKE','TÜRME',
  'TURBO',
  'ÜBUNG','ULMEN','UMWEG','UNRAT',
  'VATER','VERSE','VIECH','VILLA','VIPER','VOGEL','VOLTE',
  'VORNE','VOTUM',
  'WAFFE','WAISE','WALZE','WANNE','WÄRME','WARZE','WATTE',
  'WEIDE','WEILE','WELLE','WENDE','WEITE','WICKE','WIPPE',
  'WIRRE','WITWE','WOLKE','WOLLE','WOCHE','WONNE','WUCHT',
  'WUNDE','WÜRDE','WÜRFE','WÜRME','WÜRZE','WÜSTE',
  'YACHT',
  'ZÄHNE','ZAHME','ZANGE','ZARTE','ZÄUNE','ZECHE','ZEUGE',
  'ZELLE','ZELTE','ZIEGE','ZINKE','ZINNE','ZITAT','ZÖLLE',
  'ZÖPFE','ZOTTE','ZUNFT','ZUNGE','ZUTAT','ZWEIG',
  // Weitere Wörter
  'AALEN','BEBEN','BECKE','DÄMME','DAUBE','DIWAN',
  'DUNEN','FAHNE','FALZE','FARCE','FISCH','FLUSE',
  'FORTE','FRÜHE','FUGEN','GATTE','HAARE','HALSE',
  'HÄNGE','HEFTE','HILFE','HÜGEL','HUFEN',
  'KADER','KAMIN','KANNE','KERBE','KIMME',
  'KNAUF','KNICK','KOLBE','KOMMA','KRÄHE','LOTSE',
  'LUMPE','LUNGE','MALVE','MANKO','MATZE',
  'MIETE','MINNE','MÖHRE','MOLCH',
  'MÜNDE','MURRE','NABEL','PACKE','PAPPE','PEGEL',
  'PENNE','PFOTE','PILZE','POSSE','PRUNK',
  'RAMME','RANKE','RASPE','RECKE','RILLE',
  'RINNE','ROLLE','SAHNE','SALPE','SALZE',
  'SEELE','SENNE','SIEBE','SINKE','SIPPE','SORTE',
  'STALL','STAUB','STICH','STROH','STUBE','STUFE','SÜNDE',
  'TAFEL','TANNE','TEICH','THEKE','TINTE','TÖPFE',
  'TRAGE','TREFF','TRIFT','TRUHE','TULPE',
  'WACHS','WADEN','WANGE','WÄRME','WARTE',
  'WINDE','WOLKE','ZACKE','ZANKE','ZEILE','ZINSE','ZUCHT',
]))];

// ── Spielzustand ─────────────────────────────────────────────────────────────
let zielwort    = '';   // aktuelles Zielwort (Großbuchstaben)
let versuche    = [];   // abgeschlossene Versuche als Strings
let eingabe     = '';   // laufende Eingabe (max. 5 Zeichen)
let beendet     = false;
let animiert    = false; // während Flip-Animation: keine Eingabe
let tastaturMap = {};    // { 'A': 'richtig'|'vorhanden'|'abwesend' }

// Statistiken – werden aus Supabase geladen
let stats = {
  gespielt:    0,
  gewonnen:    0,
  aktSerie:    0,
  maxSerie:    0,
  verteilung:  [0, 0, 0, 0, 0, 0], // Index i = Sieg im (i+1). Versuch
};

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  PZ.updateNavbar();
  await statsLaden();
  neuesSpiel();
  document.addEventListener('keydown', tastaturHandler);
});

// ── Neues Spiel ───────────────────────────────────────────────────────────────
function neuesSpiel() {
  zielwort    = WOERTER[Math.floor(Math.random() * WOERTER.length)];
  versuche    = [];
  eingabe     = '';
  beendet     = false;
  animiert    = false;
  tastaturMap = {};

  document.getElementById('endscreen').classList.add('versteckt');
  meldungVerstecken();
  boardRendern();
  tastaturRendern();
}

// ── Board rendern ─────────────────────────────────────────────────────────────
function boardRendern() {
  const feld = document.getElementById('spielfeld');
  feld.innerHTML = '';

  for (let r = 0; r < 6; r++) {
    const reihe = document.createElement('div');
    reihe.className = 'reihe';
    reihe.id = `reihe-${r}`;

    for (let k = 0; k < 5; k++) {
      const kachel = document.createElement('div');
      kachel.className = 'kachel';
      kachel.id = `kachel-${r}-${k}`;
      reihe.appendChild(kachel);
    }
    feld.appendChild(reihe);
  }
}

// ── Tastatur rendern ──────────────────────────────────────────────────────────
function tastaturRendern() {
  const layout = [
    ['Q','W','E','R','T','Z','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Y','X','C','V','B','N','M','⌫'],
    ['Ä','Ö','Ü'],
  ];

  const tastatur = document.getElementById('tastatur');
  tastatur.innerHTML = '';

  for (const reihe of layout) {
    const div = document.createElement('div');
    div.className = 'taste-reihe';

    for (const key of reihe) {
      const btn = document.createElement('button');
      const breit = key === 'ENTER' || key === '⌫';
      btn.className = 'taste' + (breit ? ' breit' : '');
      btn.textContent = key;
      btn.dataset.key = key;
      btn.type = 'button';

      const status = tastaturMap[key];
      if (status) btn.classList.add(status);

      btn.addEventListener('click', () => tasteTippen(key));
      div.appendChild(btn);
    }
    tastatur.appendChild(div);
  }
}

// ── Eingabe ───────────────────────────────────────────────────────────────────
function tastaturHandler(e) {
  if (beendet || animiert) return;
  const key = e.key.toUpperCase();
  if (key === 'ENTER')     { tasteTippen('ENTER'); return; }
  if (key === 'BACKSPACE') { tasteTippen('⌫');     return; }
  if (/^[A-ZÄÖÜ]$/.test(key)) tasteTippen(key);
}

function tasteTippen(key) {
  if (beendet || animiert) return;

  if (key === 'ENTER') {
    bestaetigen();
  } else if (key === '⌫') {
    if (eingabe.length > 0) {
      eingabe = eingabe.slice(0, -1);
      eingabeAnzeigen();
    }
  } else {
    if (eingabe.length < 5) {
      eingabe += key;
      eingabeAnzeigen();
    }
  }
}

// Aktuelle Eingabe ins Board schreiben
function eingabeAnzeigen() {
  const reihe = versuche.length;
  for (let k = 0; k < 5; k++) {
    const kachel = document.getElementById(`kachel-${reihe}-${k}`);
    if (!kachel) return;
    const b = eingabe[k] || '';
    kachel.textContent = b;
    kachel.classList.toggle('gefuellt', b !== '');
  }
}

// ── Meldungszeile ─────────────────────────────────────────────────────────────
let meldungTimer = null;

function meldungAnzeigen(text, dauer = 1500) {
  const el = document.getElementById('meldung');
  el.textContent = text;
  el.classList.add('sichtbar');
  clearTimeout(meldungTimer);
  meldungTimer = setTimeout(() => el.classList.remove('sichtbar'), dauer);
}

function meldungVerstecken() {
  clearTimeout(meldungTimer);
  document.getElementById('meldung').classList.remove('sichtbar');
}

// ── Schüttel-Animation ────────────────────────────────────────────────────────
function reiheSchütteln(reihe) {
  const el = document.getElementById(`reihe-${reihe}`);
  if (!el) return;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}
