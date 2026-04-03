'use strict';

// ── Konstanten ────────────────────────────────────────────────────────────────
const GRID_BREITE   = 10;
const GRID_HOEHE    = 20;
const PANEL_B       = 144;   // Breite des Block-Panels in Canvas-Pixeln
const GEFAHREN_Z    = 2;     // Zeilen von oben bis Gefahrenlinie
const FARBEN_NAMEN  = ['rot', 'gruen', 'blau', 'orange'];
const FARBEN_HEX    = {
  rot:    '#ef4444',
  gruen:  '#22c55e',
  blau:   '#3b82f6',
  orange: '#f97316',
};
const MEILENSTEINE  = [500, 1500, 3000, 5000, 10000];

// ── Block-Formen ──────────────────────────────────────────────────────────────
// Zellen als [zeile, spalte]-Offsets, normalisiert auf 0,0
const BLOCK_FORMEN = [
  { name: 'I',      zellen: [[0,0],[0,1],[0,2],[0,3]] },
  { name: 'O',      zellen: [[0,0],[0,1],[1,0],[1,1]] },
  { name: 'T',      zellen: [[0,1],[1,0],[1,1],[1,2]] },
  { name: 'S',      zellen: [[0,1],[0,2],[1,0],[1,1]] },
  { name: 'Z',      zellen: [[0,0],[0,1],[1,1],[1,2]] },
  { name: 'J',      zellen: [[0,0],[1,0],[1,1],[1,2]] },
  { name: 'L',      zellen: [[0,2],[1,0],[1,1],[1,2]] },
  { name: '1x1',    zellen: [[0,0]] },
  { name: '1x2',    zellen: [[0,0],[0,1]] },
  { name: '1x3',    zellen: [[0,0],[0,1],[0,2]] },
  { name: '3x3',    zellen: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
  { name: 'KlL',    zellen: [[0,0],[1,0],[1,1]] },
  { name: 'Plus',   zellen: [[0,1],[1,0],[1,1],[1,2],[2,1]] },
  { name: 'Rect23', zellen: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]] },
  { name: 'V3',     zellen: [[0,0],[1,0],[2,0]] },
  { name: 'V4',     zellen: [[0,0],[1,0],[2,0],[3,0]] },
  { name: 'LGross', zellen: [[0,0],[1,0],[2,0],[2,1],[2,2]] },
];

// Zufälligen Block generieren
function zufallsBlock() {
  const form  = BLOCK_FORMEN[Math.floor(Math.random() * BLOCK_FORMEN.length)];
  const farbe = FARBEN_NAMEN[Math.floor(Math.random() * FARBEN_NAMEN.length)];
  return { name: form.name, zellen: form.zellen, farbe, gesetzt: false };
}

// 3 neue Panel-Blöcke generieren
function neuesBloeckeGenerieren() {
  panelBloecke   = [zufallsBlock(), zufallsBlock(), zufallsBlock()];
  gesetzteAnzahl = 0;
}

// ── Spielzustand ──────────────────────────────────────────────────────────────
let gitter = [];          // gitter[zeile][spalte] = null | farbname
let panelBloecke  = [];   // Array mit 3 Block-Objekten
let gesetzteAnzahl = 0;   // Wie viele der aktuellen 3 Blöcke platziert wurden
let score         = 0;
let highscore     = 0;
let running       = false;
let pruefeGerade  = false; // true während BFS läuft
let loopId        = null;

// ── Drag-Zustand ──────────────────────────────────────────────────────────────
let drag = {
  aktiv:       false,
  panelIdx:    -1,
  zellen:      [],   // [[zeile, spalte], ...]
  farbe:       '',
  mausX:       0,
  mausY:       0,
  ghostSpalte: -1,   // eingerastete Zielspalte (-1 = außerhalb)
};

// ── Drag-Hilfsfunktionen ──────────────────────────────────────────────────────

// Canvas-Koordinaten aus Mouse- oder Touch-Event extrahieren
function canvasPos(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

// Für touchend (changedTouches statt touches)
function canvasPosEnd(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.changedTouches ? e.changedTouches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

// Ghost-Spalte berechnen: wo würde der Block links starten?
function ghostSpalteBerechnen(mausX) {
  const maxS       = Math.max(...drag.zellen.map(([, s]) => s));
  const blockBr    = maxS + 1;
  const roheSpalte = Math.floor(mausX / zellenGr) - Math.floor(blockBr / 2);
  return Math.max(0, Math.min(GRID_BREITE - blockBr, roheSpalte));
}

// Spieler kann ziehen wenn: nicht prüfend und ungesetzte Blöcke vorhanden
function kannZiehen() {
  return !pruefeGerade && panelBloecke.some(b => !b.gesetzt);
}

// Welcher Panel-Slot wurde bei Position (x, y) getroffen?
function panelSlotBeiPos(x, y) {
  if (x < panOffX) return -1; // Nicht im Panel
  const slotIdx = Math.floor(y / (CH / 3));
  if (slotIdx < 0 || slotIdx > 2) return -1;
  if (panelBloecke[slotIdx]?.gesetzt) return -1;
  return slotIdx;
}

// ── Canvas / Layout ───────────────────────────────────────────────────────────
let canvas, ctx;
let CW, CH;           // Canvas-Abmessungen in px
let zellenGr = 32;    // Zellengröße in Canvas-px
let gitOffX  = 0;     // X-Offset Spielfeld auf Canvas
let gitOffY  = 0;     // Y-Offset Spielfeld auf Canvas
let panOffX  = 0;     // X-Offset Panel auf Canvas

// ── Layout berechnen ──────────────────────────────────────────────────────────
function layoutBerechnen() {
  const hudH      = 52;
  const verfBreite = window.innerWidth  - PANEL_B - 8;
  const verfHoehe  = window.innerHeight - hudH    - 8;

  const ausB = Math.floor(verfBreite / GRID_BREITE);
  const ausH = Math.floor(verfHoehe  / GRID_HOEHE);
  zellenGr = Math.max(16, Math.min(ausB, ausH, 40));

  const gitBreitePx = GRID_BREITE * zellenGr;
  const gitHoehePx  = GRID_HOEHE  * zellenGr;

  CW = gitBreitePx + PANEL_B;
  CH = gitHoehePx;

  canvas.width  = CW;
  canvas.height = CH;

  gitOffX = 0;
  gitOffY = 0;
  panOffX = gitBreitePx + 4;
}

// ── Grid initialisieren ───────────────────────────────────────────────────────
function gitterInit() {
  gitter = Array.from({ length: GRID_HOEHE }, () => new Array(GRID_BREITE).fill(null));
}

// ── Spielfeld zeichnen ────────────────────────────────────────────────────────
function spielfeldZeichnen() {
  const gW = GRID_BREITE * zellenGr;
  const gH = GRID_HOEHE  * zellenGr;

  // Spielfeld-Hintergrund
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(gitOffX, gitOffY, gW, gH);

  // Gitter-Linien
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 0.5;
  for (let z = 0; z <= GRID_HOEHE; z++) {
    ctx.beginPath();
    ctx.moveTo(gitOffX,      gitOffY + z * zellenGr);
    ctx.lineTo(gitOffX + gW, gitOffY + z * zellenGr);
    ctx.stroke();
  }
  for (let s = 0; s <= GRID_BREITE; s++) {
    ctx.beginPath();
    ctx.moveTo(gitOffX + s * zellenGr, gitOffY);
    ctx.lineTo(gitOffX + s * zellenGr, gitOffY + gH);
    ctx.stroke();
  }

  // Gefahren-Zone (obere GEFAHREN_Z Zeilen)
  ctx.fillStyle = 'rgba(239,68,68,0.12)';
  ctx.fillRect(gitOffX, gitOffY, gW, GEFAHREN_Z * zellenGr);
  ctx.strokeStyle = 'rgba(239,68,68,0.7)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(gitOffX,      gitOffY + GEFAHREN_Z * zellenGr);
  ctx.lineTo(gitOffX + gW, gitOffY + GEFAHREN_Z * zellenGr);
  ctx.stroke();

  // Pixel zeichnen
  for (let z = 0; z < GRID_HOEHE; z++) {
    for (let s = 0; s < GRID_BREITE; s++) {
      if (gitter[z][s]) pixelZeichnen(s, z, gitter[z][s]);
    }
  }
}

// Einen einzelnen Pixel im Spielfeld zeichnen
function pixelZeichnen(spalte, zeile, farbe, alpha) {
  const x   = gitOffX + spalte * zellenGr;
  const y   = gitOffY + zeile  * zellenGr;
  const pad = 1;
  const gr  = zellenGr - 2 * pad;

  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = FARBEN_HEX[farbe];
  ctx.fillRect(x + pad, y + pad, gr, gr);
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + pad, y + pad, gr, Math.max(2, gr * 0.18));
  ctx.restore();
}

// ── Panel-Hintergrund zeichnen (ohne Blöcke) ─────────────────────────────────
function panelHintergrundZeichnen() {
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(panOffX - 4, 0, CW - panOffX + 4, CH);

  // Trennlinie
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(panOffX - 4, 0);
  ctx.lineTo(panOffX - 4, CH);
  ctx.stroke();
}

// ── Panel-Blöcke zeichnen ─────────────────────────────────────────────────────
function panelZeichnen() {
  const slotH = CH / 3;

  panelBloecke.forEach((block, idx) => {
    const slotY   = idx * slotH;
    const slotMX  = panOffX + (CW - panOffX) / 2;
    const slotMY  = slotY + slotH / 2;

    // Slot-Hintergrund
    ctx.fillStyle = block.gesetzt
      ? 'rgba(0,0,0,0.03)'
      : 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.roundRect(panOffX + 6, slotY + 8, CW - panOffX - 10, slotH - 16, 10);
    ctx.fill();

    if (block.gesetzt) return; // Bereits gesetzte Blöcke nicht zeichnen

    // Block-Abmessungen berechnen
    const maxZ  = Math.max(...block.zellen.map(([z]) => z));
    const maxS  = Math.max(...block.zellen.map(([, s]) => s));
    const vorGr = Math.min(
      Math.floor((CW - panOffX - 28) / (maxS + 1)),
      Math.floor((slotH - 32)        / (maxZ + 1)),
      28
    );

    const bW     = (maxS + 1) * vorGr;
    const bH     = (maxZ + 1) * vorGr;
    const startX = slotMX - bW / 2;
    const startY = slotMY - bH / 2;

    block.zellen.forEach(([z, s]) => {
      const x = startX + s * vorGr;
      const y = startY + z * vorGr;
      ctx.fillStyle = FARBEN_HEX[block.farbe];
      ctx.fillRect(x + 1, y + 1, vorGr - 2, vorGr - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + 1, y + 1, vorGr - 2, Math.max(2, Math.floor(vorGr * 0.2)));
    });
  });
}

// ── Pixel-Physik ──────────────────────────────────────────────────────────────
// Gibt true zurück wenn mindestens ein Pixel bewegt wurde
function physikSchritt() {
  let bewegung = false;

  // Von vorletzter Zeile nach oben iterieren
  for (let z = GRID_HOEHE - 2; z >= 0; z--) {
    for (let s = 0; s < GRID_BREITE; s++) {
      const farbe = gitter[z][s];
      if (!farbe) continue;

      // Direkt nach unten fallen
      if (!gitter[z + 1][s]) {
        gitter[z + 1][s] = farbe;
        gitter[z][s]     = null;
        bewegung          = true;
        continue;
      }

      // Diagonal rutschen (nur wenn direkt unten blockiert)
      const linksrei  = s > 0               && !gitter[z + 1][s - 1];
      const rechtsrei = s < GRID_BREITE - 1 && !gitter[z + 1][s + 1];

      if (linksrei && rechtsrei) {
        // Zufällig eine Seite wählen
        const richtung = Math.random() < 0.5 ? -1 : 1;
        gitter[z + 1][s + richtung] = farbe;
        gitter[z][s]               = null;
        bewegung                    = true;
      } else if (linksrei) {
        gitter[z + 1][s - 1] = farbe;
        gitter[z][s]         = null;
        bewegung              = true;
      } else if (rechtsrei) {
        gitter[z + 1][s + 1] = farbe;
        gitter[z][s]         = null;
        bewegung              = true;
      }
    }
  }

  return bewegung;
}

// Gibt true zurück solange Pixel noch in Bewegung sind
function physikLaeuftNoch() {
  for (let z = 0; z < GRID_HOEHE - 1; z++) {
    for (let s = 0; s < GRID_BREITE; s++) {
      if (!gitter[z][s]) continue;
      if (!gitter[z + 1][s]) return true;
      const linksrei  = s > 0               && !gitter[z + 1][s - 1];
      const rechtsrei = s < GRID_BREITE - 1 && !gitter[z + 1][s + 1];
      if (linksrei || rechtsrei) return true;
    }
  }
  return false;
}

// ── Haupt-Draw ────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, CW, CH);
  panelHintergrundZeichnen();
  spielfeldZeichnen();
  if (panelBloecke.length > 0) panelZeichnen();
  // Ghost zeichnen wenn Drag aktiv
  if (drag.aktiv) {
    if (drag.ghostSpalte >= 0) {
      drag.zellen.forEach(([z, s]) => {
        pixelZeichnen(drag.ghostSpalte + s, z, drag.farbe, 0.35);
      });
    }
    const vorGr = zellenGr * 0.9;
    drag.zellen.forEach(([z, s]) => {
      const x = drag.mausX + s * vorGr - vorGr / 2;
      const y = drag.mausY + z * vorGr - vorGr;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle   = FARBEN_HEX[drag.farbe];
      ctx.fillRect(x, y, vorGr - 1, vorGr - 1);
      ctx.restore();
    });
  }
}

// ── Game Loop ─────────────────────────────────────────────────────────────────
function tick() {
  if (!running) return;
  loopId = requestAnimationFrame(tick);

  // Physik: 3 Durchläufe pro Frame für flüssiges Fallen
  if (!pruefeGerade) {
    let nochBewegung = false;
    for (let i = 0; i < 3; i++) {
      if (physikSchritt()) nochBewegung = true;
    }

    // Wenn Physik fertig: Gefahren-Check → Verbindungs-Check
    if (!nochBewegung && !physikLaeuftNoch()) {
      nachPhysikPruefen();
    }
  }

  draw();
}

// Wird einmalig aufgerufen wenn Physik zur Ruhe kommt
function nachPhysikPruefen() {
  // Gefahrenlinie: Pixel in Zeile 0 oder 1?
  for (let z = 0; z < GEFAHREN_Z; z++) {
    for (let s = 0; s < GRID_BREITE; s++) {
      if (gitter[z][s]) { spielEnde(); return; }
    }
  }

  // Verbindungs-Check
  const verbunden = verbindungsPruefen();
  if (verbunden) return; // Physik läuft erneut durch tick()

  // Kein Platz mehr für verbleibende Blöcke?
  if (alleBlocksUnplatzierbar()) {
    spielEnde();
    return;
  }
}

// ── BFS Verbindungs-Check ─────────────────────────────────────────────────────
// Gibt true zurück wenn mindestens eine Farbe von links nach rechts verbunden ist
function verbindungsPruefen() {
  pruefeGerade     = true;
  let farbZaehler  = 0;   // Wie viele Farben gleichzeitig verschwinden
  let totalPixel   = 0;   // Gesamtzahl verschwundener Pixel

  for (const farbe of FARBEN_NAMEN) {
    const besucht       = Array.from({ length: GRID_HOEHE }, () =>
      new Array(GRID_BREITE).fill(false));
    const gruppe        = [];
    const warteschlange = [];

    // Startpunkte: alle Pixel dieser Farbe in Spalte 0
    for (let z = 0; z < GRID_HOEHE; z++) {
      if (gitter[z][0] === farbe) {
        besucht[z][0] = true;
        warteschlange.push([z, 0]);
      }
    }

    let verbunden = false;

    while (warteschlange.length > 0) {
      const [z, s] = warteschlange.shift();
      gruppe.push([z, s]);
      if (s === GRID_BREITE - 1) verbunden = true;

      // 8 Nachbarn prüfen
      for (let dz = -1; dz <= 1; dz++) {
        for (let ds = -1; ds <= 1; ds++) {
          if (dz === 0 && ds === 0) continue;
          const nz = z + dz;
          const ns = s + ds;
          if (nz < 0 || nz >= GRID_HOEHE || ns < 0 || ns >= GRID_BREITE) continue;
          if (besucht[nz][ns] || gitter[nz][ns] !== farbe) continue;
          besucht[nz][ns] = true;
          warteschlange.push([nz, ns]);
        }
      }
    }

    if (verbunden && gruppe.length > 0) {
      farbZaehler++;
      totalPixel += gruppe.length;
      // Verbundene Pixel entfernen
      for (const [z, s] of gruppe) gitter[z][s] = null;
    }
  }

  pruefeGerade = false;

  if (farbZaehler > 0) {
    // Punkte berechnen
    const multi = farbZaehler === 1 ? 1
                : farbZaehler === 2 ? 1.5
                : farbZaehler === 3 ? 2.0
                : 3.0;
    score += Math.round(totalPixel * 10 * multi);
    if (score > highscore) highscore = score;
    hudAktualisieren();
    return true; // Physik soll erneut laufen
  }

  return false;
}

// ── Drag-Events ────────────────────────────────────────────────────────────────
function dragStart(e) {
  if (!kannZiehen()) return;
  const { x, y } = canvasPos(e);
  const slotIdx   = panelSlotBeiPos(x, y);
  if (slotIdx < 0) return;

  const block = panelBloecke[slotIdx];
  drag.aktiv       = true;
  drag.panelIdx    = slotIdx;
  drag.zellen      = block.zellen;
  drag.farbe       = block.farbe;
  drag.mausX       = x;
  drag.mausY       = y;
  drag.ghostSpalte = ghostSpalteBerechnen(x);
}

function dragMove(e) {
  if (!drag.aktiv) return;
  e.preventDefault();
  const { x, y } = canvasPos(e);
  drag.mausX       = x;
  drag.mausY       = y;
  drag.ghostSpalte = x < panOffX ? ghostSpalteBerechnen(x) : -1;
}

function dragEnd(e) {
  if (!drag.aktiv) return;
  const { x } = canvasPosEnd(e);

  // Über dem Spielfeld losgelassen?
  if (x < panOffX && drag.ghostSpalte >= 0) {
    blockPlatzieren(drag.panelIdx, drag.ghostSpalte);
  }

  drag.aktiv       = false;
  drag.ghostSpalte = -1;
}

// ── Block ins Spielfeld setzen ────────────────────────────────────────────────
function blockPlatzieren(panelIdx, startSpalte) {
  const block = panelBloecke[panelIdx];

  // Zellen des Blocks in die obersten Zeilen des Grids eintragen
  block.zellen.forEach(([z, s]) => {
    const spalte = startSpalte + s;
    const zeile  = z;
    if (spalte >= 0 && spalte < GRID_BREITE && zeile >= 0 && zeile < GRID_HOEHE) {
      gitter[zeile][spalte] = block.farbe;
    }
  });

  block.gesetzt  = true;
  gesetzteAnzahl++;

  // Alle 3 Blöcke gesetzt? → Neue generieren
  if (gesetzteAnzahl >= 3) {
    neuesBloeckeGenerieren();
  }
}

// Gibt true zurück wenn dieser Block noch platzierbar ist
function kannNochPlatziert(block) {
  const maxS = Math.max(...block.zellen.map(([, s]) => s));
  const br   = maxS + 1;

  for (let startS = 0; startS <= GRID_BREITE - br; startS++) {
    let passt = true;
    for (const [z, s] of block.zellen) {
      const zeile  = z;
      const spalte = startS + s;
      if (zeile < GEFAHREN_Z && gitter[zeile][spalte]) {
        passt = false;
        break;
      }
    }
    if (passt) return true;
  }
  return false;
}

// Prüft ob irgendeiner der verbleibenden Panel-Blöcke platzierbar ist
function alleBlocksUnplatzierbar() {
  return panelBloecke
    .filter(b => !b.gesetzt)
    .every(b => !kannNochPlatziert(b));
}

// ── Screens ────────────────────────────────────────────────────────────────────
function screenZeigen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ── Spiel starten ─────────────────────────────────────────────────────────────
function spielStarten() {
  screenZeigen('screen-game');
  canvas       = document.getElementById('c');
  ctx          = canvas.getContext('2d');
  layoutBerechnen();
  gitterInit();
  score         = 0;
  pruefeGerade  = false;
  drag.aktiv    = false;
  running       = true;

  hudAktualisieren();
  neuesBloeckeGenerieren();

  if (loopId) cancelAnimationFrame(loopId);
  tick();

  // Alte Listener entfernen (verhindert Dopplung bei Neustart)
  canvas.removeEventListener('mousedown',  dragStart);
  canvas.removeEventListener('mousemove',  dragMove);
  canvas.removeEventListener('mouseup',    dragEnd);
  canvas.removeEventListener('touchstart', dragStart);
  canvas.removeEventListener('touchmove',  dragMove);
  canvas.removeEventListener('touchend',   dragEnd);
  // Neue Listener
  canvas.addEventListener('mousedown',  dragStart);
  canvas.addEventListener('mousemove',  dragMove);
  canvas.addEventListener('mouseup',    dragEnd);
  canvas.addEventListener('touchstart', dragStart, { passive: true });
  canvas.addEventListener('touchmove',  dragMove,  { passive: false });
  canvas.addEventListener('touchend',   dragEnd);
}

// ── Resize ─────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (!running || !canvas) return;
  layoutBerechnen();
});

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Highscore laden
  try {
    const data = await PZ.loadScore('pixel-drop');
    if (data?.score) highscore = data.score;
  } catch (_) {}

  document.getElementById('btn-play').addEventListener('click', spielStarten);
  document.getElementById('btn-lb-title').addEventListener('click', () => rangliste_zeigen('screen-title'));
  document.getElementById('btn-neustart').addEventListener('click', spielStarten);
  document.getElementById('btn-retry').addEventListener('click', spielStarten);
  document.getElementById('btn-lb-go').addEventListener('click', () => rangliste_zeigen('screen-gameover'));
  document.getElementById('btn-lb-back').addEventListener('click', () => screenZeigen(lbVorher));
  document.getElementById('btn-settings').addEventListener('click', () => {/* Platzhalter */});
});

// ── HUD ────────────────────────────────────────────────────────────────────────
function hudAktualisieren() {
  document.getElementById('hud-score').textContent = score;

  // Fortschrittsleiste
  const naechster = MEILENSTEINE.find(m => m > score) || MEILENSTEINE[MEILENSTEINE.length - 1];
  const vorheriger = [...MEILENSTEINE].reverse().find(m => m <= score) || 0;
  const pct = naechster === vorheriger ? 100
    : Math.min(100, ((score - vorheriger) / (naechster - vorheriger)) * 100);
  document.getElementById('fortschritt-bar').style.width = pct + '%';
  document.getElementById('fortschritt-label').textContent = `${score} / ${naechster}`;
}

// ── Rangliste ─────────────────────────────────────────────────────────────────
let lbVorher = 'screen-title';
async function rangliste_zeigen(vorher) {
  lbVorher = vorher;
  screenZeigen('screen-lb');
  const content = document.getElementById('lb-content');
  content.innerHTML = '<p class="lb-empty">Lade…</p>';

  try {
    const eintraege = await PZ.getLeaderboard('pixel-drop', 10);
    content.innerHTML = ranglisteHTML(eintraege);
  } catch (_) {
    content.innerHTML = '<p class="lb-empty">Konnte nicht geladen werden.</p>';
  }
}

function ranglisteHTML(lb) {
  if (!lb?.length) return '<p class="lb-empty">Noch keine Einträge</p>';
  const medalien = ['🥇','🥈','🥉'];
  const klassen  = ['g', 's', 'b'];
  let h = `<table class="lb-table">
    <thead><tr><th>#</th><th>Name</th><th>Punkte</th></tr></thead><tbody>`;
  lb.forEach((e, i) => {
    const rang = medalien[i] || (i + 1);
    const cls  = klassen[i]  || '';
    h += `<tr>
      <td class="lb-rank ${cls}">${rang}</td>
      <td class="lb-name">${e.username ?? '—'}</td>
      <td class="lb-score">${e.score ?? 0}</td>
    </tr>`;
  });
  return h + '</tbody></table>';
}

// ── Spiel Ende ────────────────────────────────────────────────────────────────
async function spielEnde() {
  running = false;
  if (loopId) cancelAnimationFrame(loopId);
  drag.aktiv = false;

  if (score > highscore) highscore = score;

  // Supabase speichern
  const user = await PZ.getUser().catch(() => null);
  const loginHint = document.getElementById('go-login-hint');
  if (user) {
    if (loginHint) loginHint.style.display = 'none';
    try { await PZ.saveGameData('pixel-drop', score, 1, {}); } catch (_) {}
  } else {
    if (loginHint) loginHint.style.display = 'block';
  }

  document.getElementById('res-score').textContent     = score;
  document.getElementById('res-highscore').textContent = highscore;
  screenZeigen('screen-gameover');
}
