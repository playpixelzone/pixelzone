'use strict';

/**
 * Block Blast – Spiel-Engine
 * --------------------------
 * Trennung: Board (Logik), BlockGenerator (gewichtete, lösbare Triple),
 * CanvasView (Darstellung), Spiel (Eingabe + Ablauf).
 *
 * Block-Generator (Kurz):
 * 1) Schwierigkeit d ∈ [0,1] aus Score (logarithmisch).
 * 2) Viele Kandidaten-Triple mit gewichteter Zufallsauswahl (kleine Steine
 *    stärker, wenn wenig freie Felder; größere Steine bei hohem d etwas häufiger).
 * 3) Verwerfe Triple, bei denen keines der 3 Teile irgendwo passt.
 * 4) Bewerte Triple nach „bestmöglichen“ Zeilen/Spalten-Clears (Simulation).
 * 5) Nimm bestes Triple; Fallback: drei 1er-Steine, solange Platz ist.
 * So bleibt meist mindestens ein Zug möglich, ohne reines Würfeln.
 */

const RASTER = 8;

/* Kräftige, gesättigte Farben (Referenz Block Blast) */
const PALETTE = [
  '#f4b41a', // Goldgelb
  '#2f6ef0', // Royalblau
  '#8b4fd9', // Violett
  '#ff7a2e', // Orange
  '#2ec96a', // Smaragdgrün
  '#ff4d8d', // Pink
  '#00c4c4', // Cyan
  '#e8c030', // Honig
];

// --- Formen: Zellen [dr,dc] relativ, (0,0) ist immer die obere linke Ecke des Bounding-Box ---
const ROH_FORMEN = [
  { id: 'm1', z: [[0, 0]], stufe: 0 },
  { id: 'd2h', z: [[0, 0], [0, 1]], stufe: 0 },
  { id: 'd2v', z: [[0, 0], [1, 0]], stufe: 0 },
  { id: 'i3', z: [[0, 0], [0, 1], [0, 2]], stufe: 1 },
  { id: 'i3v', z: [[0, 0], [1, 0], [2, 0]], stufe: 1 },
  { id: 'l3a', z: [[0, 0], [1, 0], [1, 1]], stufe: 1 },
  { id: 'l3b', z: [[0, 0], [0, 1], [1, 0]], stufe: 1 },
  { id: 'l3c', z: [[0, 1], [1, 0], [1, 1]], stufe: 1 },
  { id: 'o2', z: [[0, 0], [0, 1], [1, 0], [1, 1]], stufe: 1 },
  { id: 't4', z: [[0, 0], [0, 1], [0, 2], [1, 1]], stufe: 2 },
  { id: 'z4', z: [[0, 0], [0, 1], [1, 1], [1, 2]], stufe: 2 },
  { id: 's4', z: [[0, 1], [0, 2], [1, 0], [1, 1]], stufe: 2 },
  { id: 'i4', z: [[0, 0], [0, 1], [0, 2], [0, 3]], stufe: 2 },
  { id: 'i4v', z: [[0, 0], [1, 0], [2, 0], [3, 0]], stufe: 2 },
  { id: 'l4a', z: [[0, 0], [1, 0], [2, 0], [2, 1]], stufe: 2 },
  { id: 'l4b', z: [[0, 0], [0, 1], [0, 2], [1, 0]], stufe: 2 },
  { id: 'p5a', z: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]], stufe: 3 },
  { id: 'p5b', z: [[0, 0], [0, 1], [0, 2], [1, 1], [1, 2]], stufe: 3 },
  { id: 'i5', z: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], stufe: 3 },
  { id: 'i5v', z: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], stufe: 3 },
  { id: 'b9', z: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], stufe: 4 },
];

/** Normalisiert Koordinaten auf min 0. */
function zellenNormalisieren(z) {
  const mr = Math.min(...z.map(([r]) => r));
  const mc = Math.min(...z.map(([, c]) => c));
  return z.map(([r, c]) => [r - mr, c - mc]);
}

const FORM_BIBLIOTHEK = ROH_FORMEN.map((def, i) => {
  const zellen = zellenNormalisieren(def.z);
  const br = Math.max(...zellen.map(([r]) => r)) + 1;
  const bc = Math.max(...zellen.map(([, c]) => c)) + 1;
  return {
    id: def.id,
    zellen,
    br,
    bc,
    stufe: def.stufe,
    farbe: PALETTE[i % PALETTE.length],
  };
});

// --- Board: 8×8, Zelle = { farbe } oder null ---
class Board {
  constructor(zellen = null) {
    this.zellen = zellen
      ? zellen.map((row) => row.slice())
      : Array.from({ length: RASTER }, () => Array(RASTER).fill(null));
  }

  clone() {
    return new Board(this.zellen);
  }

  leereZellen() {
    let n = 0;
    for (let r = 0; r < RASTER; r += 1) {
      for (let c = 0; c < RASTER; c += 1) {
        if (!this.zellen[r][c]) n += 1;
      }
    }
    return n;
  }

  kannSetzen(zellen, r0, c0) {
    for (const [dr, dc] of zellen) {
      const r = r0 + dr;
      const c = c0 + dc;
      if (r < 0 || r >= RASTER || c < 0 || c >= RASTER) return false;
      if (this.zellen[r][c]) return false;
    }
    return true;
  }

  /** Alle linken oberen Ecken, an denen die Form passt. */
  gueltigePositionen(zellen) {
    const liste = [];
    for (let r0 = 0; r0 < RASTER; r0 += 1) {
      for (let c0 = 0; c0 < RASTER; c0 += 1) {
        if (this.kannSetzen(zellen, r0, c0)) liste.push([r0, c0]);
      }
    }
    return liste;
  }

  setzen(zellen, r0, c0, farbe) {
    for (const [dr, dc] of zellen) {
      this.zellen[r0 + dr][c0 + dc] = { farbe };
    }
  }

  /**
   * Erkennt volle Zeilen/Spalten ohne zu löschen (für Animation).
   */
  volleLinienScannen() {
    const volleR = [];
    const volleC = [];
    for (let r = 0; r < RASTER; r += 1) {
      if (this.zellen[r].every((z) => z !== null)) volleR.push(r);
    }
    for (let c = 0; c < RASTER; c += 1) {
      let voll = true;
      for (let r = 0; r < RASTER; r += 1) {
        if (!this.zellen[r][c]) { voll = false; break; }
      }
      if (voll) volleC.push(c);
    }
    const geloescht = new Set();
    for (const r of volleR) {
      for (let c = 0; c < RASTER; c += 1) geloescht.add(`${r},${c}`);
    }
    for (const c of volleC) {
      for (let r = 0; r < RASTER; r += 1) geloescht.add(`${r},${c}`);
    }
    return { geloescht, zeilen: volleR.length, spalten: volleC.length };
  }

  /** Löscht die übergebenen Rasterzellen (nach Animation). */
  zellenLeeren(geloescht) {
    geloescht.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      this.zellen[r][c] = null;
    });
  }
}

/**
 * Gewichteter Generator: Triple mit mindestens einem legbaren Stein,
 * bevorzugt hohe Clear-Potenziale.
 */
class BlockGenerator {
  constructor(formen = FORM_BIBLIOTHEK) {
    this.formen = formen;
    this.mono = formen.find((f) => f.zellen.length === 1) || formen[0];
  }

  schwierigkeit01(score) {
    return Math.min(1, Math.max(0, Math.log10(1 + score / 45) / 2.8));
  }

  gewicht(form, d, leere) {
    const n = form.zellen.length;
    let w = [14, 9, 5.5, 3, 1.2][Math.min(4, form.stufe)] || 1;
    if (leere < 22) {
      if (n <= 2) w *= 2.4;
      else if (n <= 3) w *= 1.5;
      else w *= 0.55;
    } else if (leere > 48) {
      if (n >= 5) w *= 1.15 + d * 0.5;
    }
    w *= 1 + d * (form.stufe >= 3 ? 0.35 : -0.12);
    return Math.max(0.15, w);
  }

  /** Beste erreichbare Clear-Anzahl (Zeilen+Spalten als „Treffer“) für eine Platzierung. */
  besteClearPotenzial(board, form) {
    let best = 0;
    const pos = board.gueltigePositionen(form.zellen);
    for (const [r0, c0] of pos) {
      const sim = board.clone();
      sim.setzen(form.zellen, r0, c0, form.farbe);
      const vorR = [];
      const vorC = [];
      for (let r = 0; r < RASTER; r += 1) {
        if (sim.zellen[r].every((z) => z !== null)) vorR.push(r);
      }
      for (let c = 0; c < RASTER; c += 1) {
        let v = true;
        for (let r = 0; r < RASTER; r += 1) {
          if (!sim.zellen[r][c]) { v = false; break; }
        }
        if (v) vorC.push(c);
      }
      const treffer = vorR.length + vorC.length;
      if (treffer > best) best = treffer;
    }
    return best;
  }

  wertTriple(board, teile) {
    let s = 0;
    for (const p of teile) {
      s += this.besteClearPotenzial(board, p) * 12;
      s += p.zellen.length * 0.4;
    }
    return s;
  }

  tripleHatZug(board, teile) {
    return teile.some((p) => board.gueltigePositionen(p.zellen).length > 0);
  }

  zufaelligesTeil(rng, gewichtFn) {
    let sum = 0;
    const werte = this.formen.map((f) => {
      const w = gewichtFn(f);
      sum += w;
      return w;
    });
    let t = rng() * sum;
    for (let i = 0; i < this.formen.length; i += 1) {
      t -= werte[i];
      if (t <= 0) return this._teilKopie(this.formen[i]);
    }
    return this._teilKopie(this.formen[this.formen.length - 1]);
  }

  _teilKopie(form) {
    return {
      formId: form.id,
      zellen: form.zellen.map(([r, c]) => [r, c]),
      br: form.br,
      bc: form.bc,
      farbe: form.farbe,
    };
  }

  /** Öffentlich: frischer 1×1-Stein (für Rettungslogik). */
  einzelblock() {
    return this._teilKopie(this.mono);
  }

  notfallTriple(board, debug) {
    if (board.leereZellen() === 0) {
      debug.grund = 'Brett voll';
      return [];
    }
    debug.grund = 'Notfall: 3× Einzelblock';
    return [this._teilKopie(this.mono), this._teilKopie(this.mono), this._teilKopie(this.mono)];
  }

  /**
   * Erzeugt drei Steine. rng: () => [0,1)
   */
  generiere(board, score, rng = Math.random) {
    const debug = {
      versuche: 0,
      verworfen: 0,
      schwierigkeit: this.schwierigkeit01(score),
      grund: '',
      bestMerit: -1,
    };
    const d = debug.schwierigkeit;
    const leere = board.leereZellen();
    const gw = (f) => this.gewicht(f, d, leere);

    let bestTeile = null;
    let bestMerit = -1;

    const maxVersuche = leere < 18 ? 220 : 160;
    for (let v = 0; v < maxVersuche; v += 1) {
      debug.versuche += 1;
      const teile = [this.zufaelligesTeil(rng, gw), this.zufaelligesTeil(rng, gw), this.zufaelligesTeil(rng, gw)];
      if (!this.tripleHatZug(board, teile)) {
        debug.verworfen += 1;
        continue;
      }
      const merit = this.wertTriple(board, teile) + rng() * 1.2;
      if (merit > bestMerit) {
        bestMerit = merit;
        bestTeile = teile;
        debug.bestMerit = bestMerit;
      }
      if (bestMerit > 38 && v > 25) break;
    }

    if (!bestTeile) {
      debug.grund = 'Kein Triple gefunden → Notfall';
      bestTeile = this.notfallTriple(board, debug);
    } else {
      debug.grund = `OK, Merit≈${bestMerit.toFixed(1)}`;
    }

    return { teile: bestTeile, debug };
  }
}

// --- Globale Spielinstanz ---
const generator = new BlockGenerator();
let board = new Board();
let stuecke = [null, null, null];
let punkte = 0;
let highscore = 0;
/** Bestwert aus Speicher zu Partiebeginn – für „Neue Bestleistung“ ohne Tippfehler bei Gleichstand */
let bestwertZuPartiebeginn = 0;
let comboStufe = 1;
let istAnimiert = false;
let istGameOver = false;
let debugMode = false;
let letzteGeneratorDebug = null;

const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
let zellenPixel = 36;
let rasterOffsetX = 0;
let rasterOffsetY = 0;
/** 0 = keine Lücken zwischen den Zellen (wie klassisches Block-Puzzle) */
const GAP = 0;

/** Canvas-Größe und Zellmaß aus Container (Inhaltsbreite minus Padding – symmetrischer Rand) */
function canvasGroesseAnpassen() {
  const wrap = canvas.parentElement;
  const cs = getComputedStyle(wrap);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const contentBreite = Math.max(1, (wrap.clientWidth || 320) - pl - pr);
  const max = Math.min(340, Math.floor(contentBreite));
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${max}px`;
  canvas.style.height = `${max}px`;
  canvas.width = Math.floor(max * dpr);
  canvas.height = Math.floor(max * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  zellenPixel = max / RASTER;
  rasterOffsetX = 0;
  rasterOffsetY = 0;
  boardZeichnen();
}

function rasterZuPixel(r, c) {
  return {
    x: rasterOffsetX + c * (zellenPixel + GAP),
    y: rasterOffsetY + r * (zellenPixel + GAP),
  };
}

function pixelZuRaster(px, py) {
  const rect = canvas.getBoundingClientRect();
  const x = px - rect.left;
  const y = py - rect.top;
  const step = zellenPixel + GAP;
  let c = Math.floor((x - rasterOffsetX) / step);
  let r = Math.floor((y - rasterOffsetY) / step);
  r = Math.max(0, Math.min(RASTER - 1, r));
  c = Math.max(0, Math.min(RASTER - 1, c));
  return { r, c };
}

function hexZuRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** 3D-Bevel: bei lückenlosem Raster etwas flachere Ecken, damit benachbarte Steine zusammenwirken */
function bevelZelle(c, x, y, size, fillHex, alpha = 1) {
  const { r, g, b } = hexZuRgb(fillHex);
  const rad = Math.min(3, size * 0.1);
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = fillHex;
  rundesRechteck(c, x, y, size, size, rad);
  c.fill();
  const rH = Math.min(255, r + 42);
  const gH = Math.min(255, g + 42);
  const bH = Math.min(255, b + 42);
  const rS = Math.max(0, r - 48);
  const gS = Math.max(0, g - 48);
  const bS = Math.max(0, b - 48);
  c.beginPath();
  c.moveTo(x + rad, y + 1.5);
  c.lineTo(x + size - rad, y + 1.5);
  c.lineTo(x + size * 0.42, y + size * 0.38);
  c.lineTo(x + size * 0.08, y + size * 0.3);
  c.closePath();
  c.fillStyle = `rgba(${rH},${gH},${bH},0.55)`;
  c.fill();
  c.beginPath();
  c.moveTo(x + size - 1.5, y + size - rad);
  c.lineTo(x + size - 1.5, y + rad);
  c.lineTo(x + size * 0.55, y + size * 0.42);
  c.lineTo(x + size * 0.88, y + size * 0.58);
  c.closePath();
  c.fillStyle = `rgba(${rS},${gS},${bS},0.45)`;
  c.fill();
  c.beginPath();
  c.moveTo(x + 1.5, y + size - rad);
  c.lineTo(x + rad, y + size - 1.5);
  c.lineTo(x + size * 0.28, y + size * 0.65);
  c.lineTo(x + size * 0.12, y + size * 0.45);
  c.closePath();
  c.fillStyle = `rgba(${rS},${gS},${bS},0.38)`;
  c.fill();
  c.restore();
}

function boardZeichnen() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1e2233';
  ctx.fillRect(0, 0, w, h);

  for (let r = 0; r < RASTER; r += 1) {
    for (let c = 0; c < RASTER; c += 1) {
      const { x, y } = rasterZuPixel(r, c);
      const z = board.zellen[r][c];
      if (!z) {
        ctx.fillStyle = '#2a2e42';
        ctx.fillRect(x, y, zellenPixel, zellenPixel);
      } else {
        bevelZelle(ctx, x, y, zellenPixel, z.farbe, 1);
      }
    }
  }

  /* Dünne Trennlinien auf den inneren Zellgrenzen */
  const gridRight = rasterOffsetX + RASTER * zellenPixel;
  const gridBottom = rasterOffsetY + RASTER * zellenPixel;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 1;
  for (let i = 1; i < RASTER; i += 1) {
    const px = rasterOffsetX + i * zellenPixel;
    ctx.beginPath();
    ctx.moveTo(px + 0.5, rasterOffsetY);
    ctx.lineTo(px + 0.5, gridBottom);
    ctx.stroke();
  }
  for (let i = 1; i < RASTER; i += 1) {
    const py = rasterOffsetY + i * zellenPixel;
    ctx.beginPath();
    ctx.moveTo(rasterOffsetX, py + 0.5);
    ctx.lineTo(gridRight, py + 0.5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 1; i < RASTER; i += 1) {
    for (let j = 1; j < RASTER; j += 1) {
      const px = rasterOffsetX + j * zellenPixel;
      const py = rasterOffsetY + i * zellenPixel;
      ctx.beginPath();
      ctx.arc(px, py, 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (vorschauAktiv && dragStueck) {
    zeichneVorschau();
  }

  if (debugMode && debugPlatzierungen.length) {
    ctx.save();
    for (const [r, c] of debugPlatzierungen) {
      const { x, y } = rasterZuPixel(r, c);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      rundesRechteck(ctx, x, y, zellenPixel, zellenPixel, 6);
      ctx.fill();
    }
    ctx.restore();
  }
}

function rundesRechteck(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

let vorschauAktiv = false;
let vorschauR0 = 0;
let vorschauC0 = 0;
let vorschauGueltig = false;
let dragStueck = null;
let debugPlatzierungen = [];

function zeichneVorschau() {
  if (!dragStueck) return;
  const alpha = vorschauGueltig ? 0.52 : 0.42;
  const farbe = vorschauGueltig ? dragStueck.farbe : '#ff6b6b';
  ctx.save();
  for (const [dr, dc] of dragStueck.zellen) {
    const r = vorschauR0 + dr;
    const c = vorschauC0 + dc;
    if (r < 0 || r >= RASTER || c < 0 || c >= RASTER) continue;
    const { x, y } = rasterZuPixel(r, c);
    bevelZelle(ctx, x, y, zellenPixel, farbe, alpha);
  }
  ctx.restore();
}

function vorschauSetzen(stueck, r0, c0, gueltig) {
  vorschauAktiv = !!stueck;
  dragStueck = stueck;
  vorschauR0 = r0;
  vorschauC0 = c0;
  vorschauGueltig = gueltig;
  boardZeichnen();
}

function vorschauAus() {
  vorschauAktiv = false;
  dragStueck = null;
  boardZeichnen();
}

const ghost = document.getElementById('ghost');

/** Zeiger liegt über dem 8×8-Canvas (Spielfeld). Außerhalb = Zug abbrechen, andere Figur möglich. */
function istImSpielfeld(cx, cy) {
  if (!canvas) return false;
  const r = canvas.getBoundingClientRect();
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
}

function effZellGroesseTray() {
  return 15;
}

let dragIdx = -1;
let dragPointerId = null;
let dragCS = 15;
/** Gleiche Referenz wie bei addEventListener(..., { capture: true }) */
let dragMoveBound = null;
let dragEndBound = null;
let dragCancelBound = null;

const dragOpts = { passive: false, capture: true };
const dragCancelOpts = { capture: true };

function dragStart(e, idx) {
  if (istAnimiert || istGameOver) return;
  const slot = document.getElementById(`slot${idx}`);
  if (slot.classList.contains('cant-fit') || slot.classList.contains('used')) return;
  e.preventDefault();
  dragPointerId = e.pointerId;
  dragIdx = idx;
  const s = stuecke[idx];
  dragStueck = s;
  dragCS = effZellGroesseTray();
  if (debugMode) {
    const pos = board.gueltigePositionen(s.zellen);
    const seen = new Set();
    debugPlatzierungen = [];
    for (const [r0, c0] of pos) {
      for (const [dr, dc] of s.zellen) {
        const k = `${r0 + dr},${c0 + dc}`;
        if (!seen.has(k)) {
          seen.add(k);
          debugPlatzierungen.push([r0 + dr, c0 + dc]);
        }
      }
    }
  } else {
    debugPlatzierungen = [];
  }

  ghost.innerHTML = '';
  ghost.style.display = 'grid';
  const rows = s.br;
  const cols = s.bc;
  ghost.style.gridTemplateColumns = `repeat(${cols}, ${dragCS}px)`;
  ghost.style.gridTemplateRows = `repeat(${rows}, ${dragCS}px)`;
  ghost.style.gap = '0px';
  const occ = new Set(s.zellen.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const gc = document.createElement('div');
      gc.className = 'ghost-cell';
      gc.style.width = `${dragCS}px`;
      gc.style.height = `${dragCS}px`;
      if (occ.has(`${r},${c}`)) {
        gc.style.background = s.farbe;
        gc.style.boxShadow = 'inset 0 3px 0 rgba(255,255,255,.32), inset 0 -2px 0 rgba(0,0,0,.22)';
        gc.style.borderRadius = '3px';
      } else gc.style.background = 'transparent';
      ghost.appendChild(gc);
    }
  }
  ghostPositionieren(e.clientX, e.clientY);

  dragAbmelden();
  dragMoveBound = (ev) => {
    ev.preventDefault();
    dragMove(ev);
  };
  dragEndBound = (ev) => {
    ev.preventDefault();
    dragEnd(ev);
  };
  dragCancelBound = () => {
    dragAbort();
  };
  document.addEventListener('pointermove', dragMoveBound, dragOpts);
  document.addEventListener('pointerup', dragEndBound, dragOpts);
  document.addEventListener('pointercancel', dragCancelBound, dragCancelOpts);
}

function dragAbmelden() {
  if (dragMoveBound) document.removeEventListener('pointermove', dragMoveBound, dragOpts);
  if (dragEndBound) document.removeEventListener('pointerup', dragEndBound, dragOpts);
  if (dragCancelBound) document.removeEventListener('pointercancel', dragCancelBound, dragCancelOpts);
  dragMoveBound = null;
  dragEndBound = null;
  dragCancelBound = null;
}

function ghostPositionieren(cx, cy) {
  const s = stuecke[dragIdx];
  if (!s) return;
  const w = s.bc * dragCS;
  const h = s.br * dragCS;
  ghost.style.left = `${cx - w / 2}px`;
  ghost.style.top = `${cy - h - dragCS * 1.2}px`;
}

/**
 * @param {object|null} [teil] – expliziter Stein (z. B. in dragEnd nach dragIdx=-1),
 *   sonst wird stuecke[dragIdx] verwendet.
 */
function rasterPosAusPointer(cx, cy, teil) {
  const s = teil ?? stuecke[dragIdx];
  if (!s) return { r0: 0, c0: 0 };
  const rect = canvas.getBoundingClientRect();
  const px = cx - rect.left;
  const py = cy - rect.top;
  let bestR = 0;
  let bestC = 0;
  let bestD = Infinity;
  for (let r0 = 0; r0 < RASTER; r0 += 1) {
    for (let c0 = 0; c0 < RASTER; c0 += 1) {
      if (!board.kannSetzen(s.zellen, r0, c0)) continue;
      let sx = 0;
      let sy = 0;
      let n = 0;
      for (const [dr, dc] of s.zellen) {
        const { x, y } = rasterZuPixel(r0 + dr, c0 + dc);
        sx += x + zellenPixel / 2;
        sy += y + zellenPixel / 2;
        n += 1;
      }
      sx /= n;
      sy /= n;
      const d = (px - sx) ** 2 + (py - sy) ** 2;
      if (d < bestD) {
        bestD = d;
        bestR = r0;
        bestC = c0;
      }
    }
  }
  if (bestD === Infinity) {
    const { r, c } = pixelZuRaster(cx, cy);
    return { r0: r, c0: c };
  }
  return { r0: bestR, c0: bestC };
}

function dragMove(e) {
  if (dragIdx < 0 || !stuecke[dragIdx]) return;
  e.preventDefault();
  ghostPositionieren(e.clientX, e.clientY);
  const s = stuecke[dragIdx];
  if (!istImSpielfeld(e.clientX, e.clientY)) {
    if (vorschauAktiv) {
      vorschauAktiv = false;
      boardZeichnen();
    }
    return;
  }
  const { r0, c0 } = rasterPosAusPointer(e.clientX, e.clientY, s);
  const gueltig = board.kannSetzen(s.zellen, r0, c0);
  vorschauSetzen(s, r0, c0, gueltig);
}

function dragAbort() {
  dragAbmelden();
  ghost.style.display = 'none';
  dragPointerId = null;
  dragIdx = -1;
  vorschauAus();
  debugPlatzierungen = [];
  boardZeichnen();
}

async function dragEnd(e) {
  if (dragIdx < 0) return;
  dragAbmelden();
  ghost.style.display = 'none';
  const idx = dragIdx;
  dragPointerId = null;
  const s = stuecke[idx];
  dragIdx = -1;
  vorschauAus();
  debugPlatzierungen = [];
  const cx = e.clientX;
  const cy = e.clientY;
  if (!istImSpielfeld(cx, cy)) return;
  const { r0, c0 } = rasterPosAusPointer(cx, cy, s);
  if (!s || !board.kannSetzen(s.zellen, r0, c0)) return;
  await steinSetzen(idx, r0, c0);
}

function mindestensEinStiftLegbar() {
  for (let i = 0; i < 3; i += 1) {
    const s = stuecke[i];
    if (!s) continue;
    if (board.gueltigePositionen(s.zellen).length > 0) return true;
  }
  return false;
}

/**
 * Wenn die restlichen Steine nirgends passen: neue Steine erzeugen (bis zu 100 Versuche),
 * sonst nur 1×1-Retter. Verhindert frühes „Game Over“ durch ungünstige Kombination.
 */
function retterSteineErsetzen() {
  const offen = [0, 1, 2].filter((i) => stuecke[i]);
  if (offen.length === 0) return false;
  for (let versuch = 0; versuch < 100; versuch += 1) {
    const { teile } = generator.generiere(board, punkte);
    for (let j = 0; j < offen.length; j += 1) {
      stuecke[offen[j]] = teile[j];
    }
    if (mindestensEinStiftLegbar()) return true;
  }
  for (const i of offen) {
    stuecke[i] = generator.einzelblock();
  }
  return mindestensEinStiftLegbar();
}

function passFormPruefen() {
  if (istGameOver) return;
  for (let i = 0; i < 3; i += 1) {
    const slot = document.getElementById(`slot${i}`);
    const s = stuecke[i];
    if (!s) {
      slot.classList.add('used');
      slot.classList.remove('cant-fit');
      continue;
    }
    slot.classList.remove('used');
    const passt = board.gueltigePositionen(s.zellen).length > 0;
    slot.classList.toggle('cant-fit', !passt);
  }
  if (mindestensEinStiftLegbar()) return;
  if (board.leereZellen() === 0) {
    setTimeout(() => spielEnde(), 400);
    return;
  }
  if (retterSteineErsetzen()) {
    letzteGeneratorDebug = { grund: 'Rettung: neue Steine (kein Platz für alte Formen)' };
    debugPanelAktualisieren();
    trayRendern();
    passFormPruefen();
    return;
  }
  setTimeout(() => spielEnde(), 400);
}

function neuePiecesGenerieren() {
  const { teile, debug } = generator.generiere(board, punkte);
  letzteGeneratorDebug = debug;
  debugPanelAktualisieren();
  stuecke = teile.length === 3 ? teile : [null, null, null];
  if (!stuecke[0] && !stuecke[1] && !stuecke[2]) {
    setTimeout(() => spielEnde(), 200);
    return;
  }
  if (!generator.tripleHatZug(board, stuecke.filter(Boolean))) {
    setTimeout(() => spielEnde(), 200);
    return;
  }
  trayRendern();
  passFormPruefen();
}

function trayRendern() {
  for (let i = 0; i < 3; i += 1) {
    const slot = document.getElementById(`slot${i}`);
    slot.innerHTML = '';
    slot.classList.remove('used', 'cant-fit');
    slot.onpointerdown = null;
    const s = stuecke[i];
    if (!s) {
      slot.classList.add('used');
      continue;
    }
    const mg = document.createElement('div');
    mg.className = 'mini-piece';
    mg.style.display = 'grid';
    mg.style.gap = '0px';
    mg.style.gridTemplateColumns = `repeat(${s.bc}, 11px)`;
    mg.style.gridTemplateRows = `repeat(${s.br}, 11px)`;
    const occ = new Set(s.zellen.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < s.br; r += 1) {
      for (let c = 0; c < s.bc; c += 1) {
        const mc = document.createElement('div');
        mc.className = occ.has(`${r},${c}`) ? 'mini-cell filled' : 'mini-cell';
        if (occ.has(`${r},${c}`)) {
          mc.style.background = s.farbe;
        } else mc.style.background = 'transparent';
        mg.appendChild(mc);
      }
    }
    slot.appendChild(mg);
  }
}

async function steinSetzen(idx, r0, c0) {
  if (istAnimiert) return;
  const s = stuecke[idx];
  const farbe = s.farbe;
  board.setzen(s.zellen, r0, c0, farbe);
  punkte += s.zellen.length;
  stuecke[idx] = null;
  comboRendern();
  punkteRendern();
  boardZeichnen();

  const ergebnis = board.volleLinienScannen();
  const zellenGetroffen = ergebnis.geloescht.size;
  const linien = ergebnis.zeilen + ergebnis.spalten;

  if (zellenGetroffen > 0) {
    istAnimiert = true;
    const farbenSnapshot = [...ergebnis.geloescht].map((key) => {
      const [r, c] = key.split(',').map(Number);
      return { key, r, c, farbe: board.zellen[r][c].farbe };
    });
    await zeilenClearAnimation(farbenSnapshot);
    board.zellenLeeren(ergebnis.geloescht);
    const basis = zellenGetroffen * 2;
    let bonus = basis;
    if (linien >= 3) bonus += linien * 35;
    else if (linien >= 2) bonus += linien * 18;
    const mult = comboStufe;
    const add = Math.floor(bonus * mult);
    punkte += add;
    comboStufe = Math.min(12, comboStufe + linien);
    scorePopup(add, r0, c0, true);
    comboRendern();
    punkteRendern();
    istAnimiert = false;
  } else {
    comboStufe = 1;
    comboRendern();
  }

  boardZeichnen();

  if (stuecke.every((p) => p === null)) {
    neuePiecesGenerieren();
  } else {
    trayRendern();
    passFormPruefen();
  }
}

/** Aufhellen + goldener Rand, dann Zellen im Board löschen (nach Aufruf in steinSetzen). */
function zeilenClearAnimation(farbenSnapshot) {
  return new Promise((resolve) => {
    const dauer = 340;
    const start = performance.now();
    const dpr = window.devicePixelRatio || 1;

    function frame(now) {
      const t = Math.min(1, (now - start) / dauer);
      const ease = 1 - (1 - t) ** 2;
      boardZeichnen();
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const { r, c } of farbenSnapshot) {
        const { x, y } = rasterZuPixel(r, c);
        ctx.globalAlpha = 0.55 * (1 - ease);
        ctx.fillStyle = '#ffffff';
        rundesRechteck(ctx, x, y, zellenPixel, zellenPixel, 6);
        ctx.fill();
        ctx.globalAlpha = 0.4 * (1 - ease);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
        rundesRechteck(ctx, x - 1, y - 1, zellenPixel + 2, zellenPixel + 2, 7);
        ctx.fill();
      }
      ctx.restore();
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function scorePopup(n, r, c, linie = false) {
  const { x, y } = rasterZuPixel(Math.min(r, RASTER - 1), Math.min(c, RASTER - 1));
  const rect = canvas.getBoundingClientRect();
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = `+${n}`;
  popup.style.left = `${rect.left + x + zellenPixel / 2}px`;
  popup.style.top = `${rect.top + y + window.scrollY}px`;
  if (linie) popup.classList.add('is-line');
  document.body.appendChild(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

function comboRendern() {
  document.getElementById('comboDisp').textContent = `×${comboStufe}`;
}

function punkteRendern() {
  document.getElementById('scoreDisp').textContent = punkte;
  if (punkte > highscore) highscore = punkte;
  document.getElementById('highscoreDisp').textContent = highscore;
}

function debugPanelAktualisieren() {
  const el = document.getElementById('debugText');
  if (!el || !letzteGeneratorDebug) return;
  const d = letzteGeneratorDebug;
  const zeilen = [];
  if (d.schwierigkeit != null) zeilen.push(`Schwierigkeit: ${d.schwierigkeit.toFixed(3)}`);
  if (d.versuche != null) zeilen.push(`Versuche: ${d.versuche} (verworfen: ${d.verworfen ?? 0})`);
  if (d.grund) zeilen.push(d.grund);
  zeilen.push(`Leere Felder: ${board.leereZellen()}`);
  el.textContent = zeilen.join('\n');
}

function spielStart() {
  bestwertZuPartiebeginn = highscore;
  board = new Board();
  stuecke = [null, null, null];
  punkte = 0;
  comboStufe = 1;
  istGameOver = false;
  istAnimiert = false;
  document.getElementById('gameOverScreen').classList.remove('sichtbar');
  comboRendern();
  punkteRendern();
  canvasGroesseAnpassen();
  neuePiecesGenerieren();
}

async function spielEnde() {
  istGameOver = true;
  document.getElementById('gameOverScreen').classList.add('sichtbar');
  document.getElementById('goScore').textContent = punkte;
  const isNeu = punkte > 0 && punkte > bestwertZuPartiebeginn;
  const hsEl = document.getElementById('goHs');
  hsEl.textContent = isNeu ? 'Neue Bestleistung!' : `Bestleistung: ${highscore}`;
  hsEl.className = `go-hs${isNeu ? ' new-record' : ''}`;
  let nutzername = null;
  try {
    const user = await PZ.getUser().catch(() => null);
    if (user) {
      const saveResult = await PZ.saveGameData('block-blast', punkte, 1, {});
      if (saveResult?.error) console.error('[Block Blast] Speichern fehlgeschlagen:', saveResult.error);
      nutzername = await PZ.getUsername(user.id).catch((err) => {
        console.error('[Block Blast] Benutzername laden fehlgeschlagen:', err);
        return null;
      });
    }
  } catch (err) {
    console.error('[Block Blast] spielEnde Fehler:', err);
  }
  const lbEl = document.getElementById('goLbList');
  try {
    const lb = await PZ.getLeaderboard('block-blast', 5);
    if (!lb || lb.length === 0) {
      lbEl.innerHTML = '<div class="lb-empty">Noch keine Einträge</div>';
    } else {
      lbEl.innerHTML = lb.map((e, i) => {
        const istIch = nutzername && e.benutzername === nutzername;
        const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
        return `<div class="go-lb-row lb-row${istIch ? ' me' : ''}">
          <span class="lb-rank">${medal}</span>
          <span class="lb-name">${e.benutzername || 'Unbekannt'}</span>
          <span class="lb-score">${e.punkte ?? 0}</span>
        </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('[Block Blast] Rangliste laden fehlgeschlagen:', err);
    lbEl.innerHTML = '<div class="lb-empty">Keine Verbindung</div>';
  }
}

function trayPointerDown(e) {
  if (istAnimiert || istGameOver) return;
  const slot = e.target.closest('.tray-slot');
  if (!slot || slot.classList.contains('used') || slot.classList.contains('cant-fit')) return;
  const i = Number(slot.dataset.slot);
  if (!Number.isInteger(i) || i < 0 || i > 2) return;
  if (!stuecke[i]) return;
  dragStart(e, i);
}

document.addEventListener('DOMContentLoaded', async () => {
  PZ.updateNavbar();
  try {
    const stored = await PZ.loadScore('block-blast');
    highscore = Number(stored?.punkte || 0);
  } catch (err) {
    console.error('[Block Blast] Highscore laden fehlgeschlagen:', err);
  }
  document.getElementById('highscoreDisp').textContent = highscore;

  const params = new URLSearchParams(location.search);
  debugMode = params.has('debug');
  const panel = document.getElementById('debugPanel');
  if (debugMode) panel.classList.remove('versteckt');

  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      debugMode = !debugMode;
      panel.classList.toggle('versteckt', !debugMode);
      debugPanelAktualisieren();
      boardZeichnen();
    }
  });

  document.getElementById('btnNeustart').addEventListener('click', () => spielStart());
  document.getElementById('btnNochmal').addEventListener('click', () => spielStart());
  document.getElementById('tray').addEventListener('pointerdown', trayPointerDown);

  window.addEventListener('resize', () => {
    canvasGroesseAnpassen();
  });

  spielStart();
});
