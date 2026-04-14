'use strict';

// ── Konstanten ────────────────────────────────────────────────────────────────
const GRID_BREITE  = 10;
const GRID_HOEHE   = 20;
const BLOCK_SCALE  = 7;                       // Sub-Pixel pro Block-Zelle
const PHYS_BREITE  = GRID_BREITE * BLOCK_SCALE; // 70
const PHYS_HOEHE   = GRID_HOEHE  * BLOCK_SCALE; // 140
const PANEL_B      = 144;
const GEFAHREN_Z   = 2;                       // visuelle Gefahrenzeilen
// 5 Farben: mehr Vielfalt → Verbindungen schwerer zu bauen
const FARBEN_NAMEN = ['rot', 'gruen', 'blau', 'orange', 'lila'];
const FARBEN_HEX   = {
  rot:    '#ef4444',
  gruen:  '#22c55e',
  blau:   '#3b82f6',
  orange: '#f97316',
  lila:   '#a855f7',
};

// ── EXP / Level ───────────────────────────────────────────────────────────────
const MAX_LEVEL        = 50;
const EXP_STEIN        = 5;    // EXP pro platziertem Stein
const EXP_LINIE_1      = 100;  // 1 Farbe verbunden
const EXP_LINIE_2      = 250;  // 2 Farben gleichzeitig
const EXP_LINIE_MULTI  = 500;  // 3+ Farben gleichzeitig

let spielerLevel = 1;
let spielerExp   = 0;

function expFuerLevel(n) { return n * 200; } // Level N braucht N*200 EXP

// ── Stau-System ───────────────────────────────────────────────────────────────
// Nach STAU_SCHWELLE Runden ohne Verbindung → Müll-Reihe von unten
const STAU_SCHWELLE    = 3;
let rundenOhneVerbindung = 0;  // Runden-Counter (reset bei jeder Verbindung)
let verbindungInRunde    = false; // wurde in dieser Runde eine Verbindung gemacht?
const MEILENSTEINE = [500, 1500, 3000, 5000, 10000];

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

// 3 neue Panel-Blöcke generieren (erstStart=true beim allerersten Aufruf)
function neuesBloeckeGenerieren(erstStart = false) {
  if (!erstStart) stauPruefen(); // Runde abgeschlossen → Stau-Check
  panelBloecke   = [zufallsBlock(), zufallsBlock(), zufallsBlock()];
  gesetzteAnzahl = 0;
}

// ── Spielzustand ──────────────────────────────────────────────────────────────
let physGitter = [];      // physGitter[zeile][spalte] = null | farbname  (70×140)
let panelBloecke  = [];
let gesetzteAnzahl = 0;
let score         = 0;
let highscore     = 0;
let running       = false;
let pruefeGerade  = false;
let loopId        = null;
let lastTickTime  = 0;
let physikAccum   = 0;
const PHYSIK_MS   = 5;
let physikWarRuhig = false; // verhindert mehrfachen BFS-Aufruf pro Settle-Event
let stabileFrames = 0;      // Frames ohne Bewegung – BFS erst nach ≥3 stabilen Frames

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
  const blockBr    = maxS + 1;  // in visuellen Spalten
  const visColPx   = BLOCK_SCALE * subGr;
  const roheSpalte = Math.floor(mausX / visColPx) - Math.floor(blockBr / 2);
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
let CW, CH;        // Canvas-Abmessungen
let subGr = 4;     // Pixel pro Sub-Pixel-Zelle (wird in layoutBerechnen gesetzt)
let gitOffX = 0;
let gitOffY = 0;
let panOffX = 0;

// ── Layout berechnen ──────────────────────────────────────────────────────────
function layoutBerechnen() {
  const hudH       = 52;
  const verfBreite = window.innerWidth  - PANEL_B - 8;
  const verfHoehe  = window.innerHeight - hudH    - 8;

  const ausB = Math.floor(verfBreite / PHYS_BREITE);
  const ausH = Math.floor(verfHoehe  / PHYS_HOEHE);
  subGr = Math.max(2, Math.min(ausB, ausH, 6)); // 2–6 px pro Sub-Pixel

  CW = PHYS_BREITE * subGr + PANEL_B;
  CH = PHYS_HOEHE  * subGr;

  canvas.width  = CW;
  canvas.height = CH;

  gitOffX = 0;
  gitOffY = 0;
  panOffX = PHYS_BREITE * subGr + 4;
}

// ── Grid initialisieren ───────────────────────────────────────────────────────
function gitterInit() {
  physGitter = Array.from({ length: PHYS_HOEHE },
    () => new Array(PHYS_BREITE).fill(null));
}

// ── Spielfeld zeichnen ────────────────────────────────────────────────────────
function spielfeldZeichnen() {
  const gW = PHYS_BREITE * subGr;
  const gH = PHYS_HOEHE  * subGr;

  // Hintergrund
  ctx.fillStyle = '#101c30';
  ctx.fillRect(gitOffX, gitOffY, gW, gH);

  // Gitterlinien (nur für visuelles 10×20-Raster, sehr dezent)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth   = 0.5;
  for (let z = 0; z <= GRID_HOEHE; z++) {
    const py = gitOffY + z * BLOCK_SCALE * subGr;
    ctx.beginPath(); ctx.moveTo(gitOffX, py); ctx.lineTo(gitOffX + gW, py); ctx.stroke();
  }
  for (let s = 0; s <= GRID_BREITE; s++) {
    const px = gitOffX + s * BLOCK_SCALE * subGr;
    ctx.beginPath(); ctx.moveTo(px, gitOffY); ctx.lineTo(px, gitOffY + gH); ctx.stroke();
  }

  // Gefahrenzone (obere GEFAHREN_Z visuelle Zeilen = GEFAHREN_Z * BLOCK_SCALE physics-Zeilen)
  const gefahrH = GEFAHREN_Z * BLOCK_SCALE * subGr;
  ctx.fillStyle = 'rgba(239,68,68,0.12)';
  ctx.fillRect(gitOffX, gitOffY, gW, gefahrH);
  ctx.strokeStyle = 'rgba(239,68,68,0.7)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(gitOffX,      gitOffY + gefahrH);
  ctx.lineTo(gitOffX + gW, gitOffY + gefahrH);
  ctx.stroke();

  // Sub-Pixel zeichnen
  for (let z = 0; z < PHYS_HOEHE; z++) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      if (physGitter[z][s]) {
        ctx.fillStyle = FARBEN_HEX[physGitter[z][s]];
        ctx.fillRect(gitOffX + s * subGr, gitOffY + z * subGr, subGr, subGr);
      }
    }
  }
}

// Einen Sub-Pixel im Spielfeld zeichnen (physics-Koordinaten)
function subPixelZeichnen(physSpalte, physZeile, farbe, alpha) {
  const x = gitOffX + physSpalte * subGr;
  const y = gitOffY + physZeile  * subGr;
  ctx.save();
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.fillStyle = FARBEN_HEX[farbe];
  ctx.fillRect(x, y, subGr, subGr);
  ctx.restore();
}

// ── Panel-Hintergrund zeichnen (ohne Blöcke) ─────────────────────────────────
function panelHintergrundZeichnen() {
  // Gleiche Farbe wie der Screen-Hintergrund (#1a3a6e)
  ctx.fillStyle = '#1a3a6e';
  ctx.fillRect(panOffX - 4, 0, CW - panOffX + 4, CH);

  // Trennlinie
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
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
      ? 'rgba(0,0,0,0.15)'
      : 'rgba(255,255,255,0.12)';
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

  for (let z = PHYS_HOEHE - 2; z >= 0; z--) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      const farbe = physGitter[z][s];
      if (!farbe) continue;

      if (!physGitter[z + 1][s]) {
        physGitter[z + 1][s] = farbe;
        physGitter[z][s]     = null;
        bewegung              = true;
        continue;
      }

      // Diagonal gleiten: bis zu 3 Zellen weit für natürlichere Sand-Streuung
      let linksDist = 0, rechtsDist = 0;
      for (let d = 1; d <= 3; d++) {
        if (s - d < 0 || physGitter[z + 1][s - d]) break;
        linksDist = d;
      }
      for (let d = 1; d <= 3; d++) {
        if (s + d >= PHYS_BREITE || physGitter[z + 1][s + d]) break;
        rechtsDist = d;
      }

      if (linksDist > 0 && rechtsDist > 0) {
        const richtung = Math.random() < 0.5 ? -linksDist : rechtsDist;
        physGitter[z + 1][s + richtung] = farbe;
        physGitter[z][s]               = null;
        bewegung                        = true;
      } else if (linksDist > 0) {
        physGitter[z + 1][s - linksDist] = farbe;
        physGitter[z][s]                 = null;
        bewegung                          = true;
      } else if (rechtsDist > 0) {
        physGitter[z + 1][s + rechtsDist] = farbe;
        physGitter[z][s]                  = null;
        bewegung                           = true;
      }
    }
  }

  return bewegung;
}

// Gibt true zurück solange Pixel noch in Bewegung sind
function physikLaeuftNoch() {
  for (let z = 0; z < PHYS_HOEHE - 1; z++) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      if (!physGitter[z][s]) continue;
      if (!physGitter[z + 1][s]) return true;
      let linksDist = 0, rechtsDist = 0;
      for (let d = 1; d <= 3; d++) {
        if (s - d < 0 || physGitter[z + 1][s - d]) break;
        linksDist = d;
      }
      for (let d = 1; d <= 3; d++) {
        if (s + d >= PHYS_BREITE || physGitter[z + 1][s + d]) break;
        rechtsDist = d;
      }
      if (linksDist > 0 || rechtsDist > 0) return true;
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

  if (drag.aktiv) {
    // Ghost (7×7-Cluster pro Zelle, halbtransparent)
    if (drag.ghostSpalte >= 0) {
      drag.zellen.forEach(([bz, bs]) => {
        const physS0 = (drag.ghostSpalte + bs) * BLOCK_SCALE;
        const physZ0 = bz * BLOCK_SCALE;
        for (let dz = 0; dz < BLOCK_SCALE; dz++) {
          for (let ds = 0; ds < BLOCK_SCALE; ds++) {
            subPixelZeichnen(physS0 + ds, physZ0 + dz, drag.farbe, 0.35);
          }
        }
      });
    }

    // Drag-Block unter dem Cursor (visuelle Vorschau)
    const visGr = BLOCK_SCALE * subGr * 0.9;
    drag.zellen.forEach(([bz, bs]) => {
      const x = drag.mausX + bs * visGr - visGr / 2;
      const y = drag.mausY + bz * visGr - visGr;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle   = FARBEN_HEX[drag.farbe];
      ctx.fillRect(x, y, visGr - 1, visGr - 1);
      ctx.restore();
    });
  }
}

// ── Game Loop ─────────────────────────────────────────────────────────────────
function tick(timestamp) {
  if (!running) return;
  loopId = requestAnimationFrame(tick);

  // Zeitdelta berechnen (erster Frame: delta = 0)
  if (!timestamp) timestamp = performance.now();
  const delta = lastTickTime === 0 ? 0 : timestamp - lastTickTime;
  lastTickTime = timestamp;

  // Physik zeitbasiert: ein Schritt alle PHYSIK_MS Millisekunden
  if (!pruefeGerade) {
    physikAccum = Math.min(physikAccum + delta, PHYSIK_MS * 8);
    let nochBewegung = false;
    while (physikAccum >= PHYSIK_MS) {
      if (physikSchritt()) nochBewegung = true;
      physikAccum -= PHYSIK_MS;
    }

    // Stabilitätszähler: BFS erst nach ≥3 aufeinanderfolgenden ruhigen Frames
    if (!nochBewegung && !physikLaeuftNoch()) {
      stabileFrames++;
    } else {
      stabileFrames = 0;
    }

    if (stabileFrames >= 3 && !physikWarRuhig) {
      physikWarRuhig = true;
      stabileFrames  = 0;
      nachPhysikPruefen();
    }
  }

  draw();
}

// Wird einmalig aufgerufen wenn Physik zur Ruhe kommt
function nachPhysikPruefen() {
  const gefahrZeilen = GEFAHREN_Z * BLOCK_SCALE; // 14
  for (let z = 0; z < gefahrZeilen; z++) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      if (physGitter[z][s]) { spielEnde(); return; }
    }
  }
  const verbunden = verbindungsPruefen();
  if (verbunden) {
    // Kettenverbindungen: nach dem nächsten Settle erneut prüfen
    physikWarRuhig = false;
    return;
  }
  if (alleBlocksUnplatzierbar()) { spielEnde(); return; }
}

// ── BFS Verbindungs-Check ─────────────────────────────────────────────────────
// Gibt true zurück wenn mindestens eine Farbe von links nach rechts verbunden ist
function verbindungsPruefen() {
  pruefeGerade    = true;
  let farbZaehler = 0;
  let totalPixel  = 0;

  for (const farbe of FARBEN_NAMEN) {
    const besucht = Array.from({ length: PHYS_HOEHE },
      () => new Array(PHYS_BREITE).fill(false));
    const gruppe  = [];
    const queue   = [];

    for (let z = 0; z < PHYS_HOEHE; z++) {
      if (physGitter[z][0] === farbe) {
        besucht[z][0] = true;
        queue.push([z, 0]);
      }
    }

    let verbunden = false;
    let head = 0;
    while (head < queue.length) {
      const [z, s] = queue[head++];
      gruppe.push([z, s]);
      if (s === PHYS_BREITE - 1) verbunden = true;

      for (let dz = -1; dz <= 1; dz++) {
        for (let ds = -1; ds <= 1; ds++) {
          if (dz === 0 && ds === 0) continue;
          const nz = z + dz, ns = s + ds;
          if (nz < 0 || nz >= PHYS_HOEHE || ns < 0 || ns >= PHYS_BREITE) continue;
          if (besucht[nz][ns] || physGitter[nz][ns] !== farbe) continue;
          besucht[nz][ns] = true;
          queue.push([nz, ns]);
        }
      }
    }

    if (verbunden && gruppe.length > 0) {
      farbZaehler++;
      totalPixel += gruppe.length;
      for (const [z, s] of gruppe) physGitter[z][s] = null;
    }
  }

  pruefeGerade = false;
  physikAccum  = 0;

  if (farbZaehler > 0) {
    verbindungInRunde = true; // für Stau-System merken
    const multi = farbZaehler === 1 ? 1
                : farbZaehler === 2 ? 1.5
                : farbZaehler === 3 ? 2.0
                : 3.0;
    score += Math.round((totalPixel / (BLOCK_SCALE * BLOCK_SCALE)) * 10 * multi);
    if (score > highscore) highscore = score;
    hudAktualisieren();
    // EXP für Verbindungen vergeben
    const expGewinn = farbZaehler >= 3 ? EXP_LINIE_MULTI
                    : farbZaehler === 2 ? EXP_LINIE_2
                    : EXP_LINIE_1;
    expVerdienen(expGewinn);
    return true;
  }
  return false;
}

// ── EXP & Level ───────────────────────────────────────────────────────────────
function expVerdienen(menge) {
  if (spielerLevel >= MAX_LEVEL) return;
  spielerExp += menge;

  let levelUpGeschehen = false;
  while (spielerLevel < MAX_LEVEL && spielerExp >= expFuerLevel(spielerLevel)) {
    spielerExp -= expFuerLevel(spielerLevel);
    spielerLevel++;
    levelUpGeschehen = true;
  }
  if (spielerLevel >= MAX_LEVEL) spielerExp = 0;

  expBarAktualisieren();
  if (levelUpGeschehen) {
    levelUpToastZeigen(spielerLevel);
    expSpeichernStill();
  }
}

function levelUpToastZeigen(level) {
  const toast = document.getElementById('level-up-toast');
  if (!toast) return;
  toast.textContent = `Level ${level} erreicht! ⭐`;
  toast.classList.remove('hidden');
  const wrap = document.getElementById('exp-leiste-wrap');
  if (wrap) { wrap.classList.add('level-up-blink'); setTimeout(() => wrap.classList.remove('level-up-blink'), 600); }
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

function expBarAktualisieren() {
  const badge = document.getElementById('level-badge');
  const bar   = document.getElementById('exp-bar');
  const label = document.getElementById('exp-label');
  if (!badge || !bar || !label) return;

  badge.textContent = spielerLevel >= MAX_LEVEL ? 'Lv.MAX' : `Lv.${spielerLevel}`;

  if (spielerLevel >= MAX_LEVEL) {
    bar.style.width   = '100%';
    label.textContent = 'MAX';
  } else {
    const noetig = expFuerLevel(spielerLevel);
    bar.style.width   = `${Math.min(100, (spielerExp / noetig) * 100).toFixed(1)}%`;
    label.textContent = `${spielerExp} / ${noetig} EXP`;
  }
}

async function expSpeichernStill() {
  const user = await PZ.getUser().catch(() => null);
  if (!user || adminModus) return;
  try {
    await PZ.saveGameData('pixel-drop', score, spielerLevel, { exp: spielerExp });
  } catch (err) { console.error('[Pixel Drop] EXP speichern fehlgeschlagen:', err); }
}

// ── Stau-System: Müll-Reihe von unten ────────────────────────────────────────
function stauPruefen() {
  if (verbindungInRunde) {
    rundenOhneVerbindung = 0; // Verbindung gemacht → Stau-Counter reset
  } else {
    rundenOhneVerbindung++;
  }
  verbindungInRunde = false;

  // Stau-Warnung aktualisieren
  stauWarnungZeigen(rundenOhneVerbindung);

  if (rundenOhneVerbindung >= STAU_SCHWELLE) {
    rundenOhneVerbindung = 0;
    muellZeileHinzufuegen();
  }
}

function muellZeileHinzufuegen() {
  // Alle Zeilen um BLOCK_SCALE Reihen nach oben verschieben
  for (let z = 0; z < PHYS_HOEHE - BLOCK_SCALE; z++) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      physGitter[z][s] = physGitter[z + BLOCK_SCALE][s];
    }
  }
  // Unterste BLOCK_SCALE Zeilen mit zufälligen Farben füllen (85% Dichte, Lücken für Strategie)
  for (let z = PHYS_HOEHE - BLOCK_SCALE; z < PHYS_HOEHE; z++) {
    for (let s = 0; s < PHYS_BREITE; s++) {
      physGitter[z][s] = Math.random() < 0.85
        ? FARBEN_NAMEN[Math.floor(Math.random() * FARBEN_NAMEN.length)]
        : null;
    }
  }
  // Physik-Flags zurücksetzen damit der neue Stand geprüft wird
  physikWarRuhig = false;
  stabileFrames  = 0;
}

function stauWarnungZeigen(zaehler) {
  const el = document.getElementById('stau-warnung');
  if (!el) return;
  if (zaehler === 0) {
    el.textContent = '';
    el.className   = 'stau-ok';
  } else if (zaehler === 1) {
    el.textContent = '⚠ Stau';
    el.className   = 'stau-warn1';
  } else if (zaehler >= 2) {
    el.textContent = '🚨 Stau!';
    el.className   = 'stau-warn2';
  }
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
function blockPlatzieren(panelIdx, startVisSpalte) {
  physikWarRuhig = false;
  stabileFrames  = 0;
  const block = panelBloecke[panelIdx];

  // Jede Block-Zelle [bz, bs] → 7×7 Cluster in physGitter
  block.zellen.forEach(([bz, bs]) => {
    const physS0 = (startVisSpalte + bs) * BLOCK_SCALE;
    const physZ0 = bz * BLOCK_SCALE;
    for (let dz = 0; dz < BLOCK_SCALE; dz++) {
      for (let ds = 0; ds < BLOCK_SCALE; ds++) {
        const pz = physZ0 + dz;
        const ps = physS0 + ds;
        if (pz >= 0 && pz < PHYS_HOEHE && ps >= 0 && ps < PHYS_BREITE) {
          physGitter[pz][ps] = block.farbe;
        }
      }
    }
  });

  block.gesetzt  = true;
  gesetzteAnzahl++;
  expVerdienen(EXP_STEIN); // +5 EXP pro platziertem Stein
  if (gesetzteAnzahl >= 3) neuesBloeckeGenerieren();
}

// Gibt true zurück wenn dieser Block noch platzierbar ist
function kannNochPlatziert(block) {
  const maxS         = Math.max(...block.zellen.map(([, s]) => s));
  const br           = maxS + 1;  // visuelle Breite
  const gefahrZeilen = GEFAHREN_Z * BLOCK_SCALE;

  for (let startS = 0; startS <= GRID_BREITE - br; startS++) {
    let passt = true;
    outer:
    for (const [bz, bs] of block.zellen) {
      const physS0 = (startS + bs) * BLOCK_SCALE;
      const physZ0 = bz * BLOCK_SCALE;
      for (let dz = 0; dz < BLOCK_SCALE; dz++) {
        for (let ds = 0; ds < BLOCK_SCALE; ds++) {
          const pz = physZ0 + dz;
          const ps = physS0 + ds;
          if (pz < gefahrZeilen && physGitter[pz][ps]) {
            passt = false;
            break outer;
          }
        }
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
  score                = 0;
  pruefeGerade         = false;
  physikWarRuhig       = false;
  stabileFrames        = 0;
  drag.aktiv           = false;
  running              = true;
  lastTickTime         = 0;
  physikAccum          = 0;
  rundenOhneVerbindung = 0;
  verbindungInRunde    = false;
  stauWarnungZeigen(0);

  hudAktualisieren();
  expBarAktualisieren();
  neuesBloeckeGenerieren(true); // erstStart: kein Stau-Check beim Spielbeginn

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

// ── Admin-Modus ────────────────────────────────────────────────────────────────
let adminModus = false;

// ── DOMContentLoaded ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  adminModus = await PZ.adminPanelErstellen([
    {label:'💯 Score +10000', onClick:() => { score += 10000; hudAktualisieren(); }},
  ]);

  if (!adminModus) {
    // Spielstand + EXP/Level laden
    try {
      const data = await PZ.loadScore('pixel-drop');
      if (data) {
        highscore    = data.punkte || 0;
        spielerLevel = data.level  || 1;
        spielerExp   = data.extra_daten?.exp || 0;
      }
    } catch (err) { console.error('[Pixel Drop] Laden fehlgeschlagen:', err); }
  }

  expBarAktualisieren();

  document.getElementById('btn-play').addEventListener('click', spielStarten);
  document.getElementById('btn-lb-title').addEventListener('click', () => rangliste_zeigen('screen-title'));
  document.getElementById('btn-neustart').addEventListener('click', spielStarten);
  document.getElementById('btn-retry').addEventListener('click', spielStarten);
  document.getElementById('btn-lb-go').addEventListener('click', () => rangliste_zeigen('screen-gameover'));
  document.getElementById('btn-lb-back').addEventListener('click', () => screenZeigen(lbVorher));
});

// ── HUD ────────────────────────────────────────────────────────────────────────
function hudAktualisieren() {
  document.getElementById('hud-score').textContent = score;

  // Fortschrittsleiste
  const naechster = MEILENSTEINE.find(m => m > score);
  if (naechster === undefined) {
    // Alle Meilensteine erreicht
    document.getElementById('fortschritt-bar').style.width = '100%';
    document.getElementById('fortschritt-label').textContent = `${score} — MAX`;
  } else {
    const vorheriger = [...MEILENSTEINE].reverse().find(m => m <= score) || 0;
    const pct = Math.min(100, ((score - vorheriger) / (naechster - vorheriger)) * 100);
    document.getElementById('fortschritt-bar').style.width = pct + '%';
    document.getElementById('fortschritt-label').textContent = `${score} / ${naechster}`;
  }
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
  } catch (err) {
    console.error('[Pixel Drop] Rangliste laden fehlgeschlagen:', err);
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
      <td class="lb-name">${e.benutzername ?? '—'}</td>
      <td class="lb-score">${e.punkte ?? 0}</td>
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
  if (user && !adminModus) {
    if (loginHint) loginHint.style.display = 'none';
    try {
      const r = await PZ.saveGameData('pixel-drop', score, spielerLevel, {
        exp: spielerExp,
      });
      if (r?.error) console.error('[Pixel Drop] Speichern fehlgeschlagen:', r.error);
    } catch (err) { console.error('[Pixel Drop] spielEnde Fehler:', err); }
  } else {
    if (loginHint) loginHint.style.display = 'block';
  }

  document.getElementById('res-score').textContent     = score;
  document.getElementById('res-highscore').textContent = highscore;
  screenZeigen('screen-gameover');
}
