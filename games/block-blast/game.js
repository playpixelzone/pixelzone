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

const PALETTE = [
  '#5b8def', '#5ec9c8', '#e8956b', '#9b7ed9', '#6bc96b',
  '#e86b9c', '#d9b35e', '#7a9eb8',
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
const GAP = 2;

/** Canvas-Größe und Zellmaß aus Container */
function canvasGroesseAnpassen() {
  const wrap = canvas.parentElement;
  const max = Math.min(340, wrap.clientWidth || 320);
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${max}px`;
  canvas.style.height = `${max}px`;
  canvas.width = Math.floor(max * dpr);
  canvas.height = Math.floor(max * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const inner = max - GAP * (RASTER + 1);
  zellenPixel = inner / RASTER;
  rasterOffsetX = GAP;
  rasterOffsetY = GAP;
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
  const c = Math.floor((x - rasterOffsetX) / (zellenPixel + GAP));
  const r = Math.floor((y - rasterOffsetY) / (zellenPixel + GAP));
  return { r, c };
}

function boardZeichnen() {
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, w, h);

  for (let r = 0; r < RASTER; r += 1) {
    for (let c = 0; c < RASTER; c += 1) {
      const { x, y } = rasterZuPixel(r, c);
      const z = board.zellen[r][c];
      ctx.fillStyle = z ? z.farbe : '#e8edf5';
      if (!z) {
        ctx.fillStyle = '#e8edf5';
      }
      rundesRechteck(ctx, x, y, zellenPixel, zellenPixel, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (z) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(x + 2, y + 2, zellenPixel * 0.7, zellenPixel * 0.25);
        ctx.restore();
      }
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
  const farbe = vorschauGueltig ? dragStueck.farbe : 'rgba(220, 80, 80, 0.55)';
  ctx.save();
  ctx.globalAlpha = vorschauGueltig ? 0.55 : 0.45;
  for (const [dr, dc] of dragStueck.zellen) {
    const r = vorschauR0 + dr;
    const c = vorschauC0 + dc;
    if (r < 0 || r >= RASTER || c < 0 || c >= RASTER) continue;
    const { x, y } = rasterZuPixel(r, c);
    ctx.fillStyle = farbe;
    rundesRechteck(ctx, x, y, zellenPixel, zellenPixel, 6);
    ctx.fill();
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

function effZellGroesseTray() {
  return 15;
}

let dragIdx = -1;
let dragCS = 15;

function dragStart(e, idx) {
  if (istAnimiert || istGameOver) return;
  const slot = document.getElementById(`slot${idx}`);
  if (slot.classList.contains('cant-fit') || slot.classList.contains('used')) return;
  e.preventDefault();
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
  ghost.style.gap = '2px';
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
      } else gc.style.background = 'transparent';
      ghost.appendChild(gc);
    }
  }
  ghostPositionieren(e.clientX, e.clientY);
  document.addEventListener('pointermove', dragMove);
  document.addEventListener('pointerup', dragEnd);
  document.addEventListener('pointercancel', dragAbort);
}

function ghostPositionieren(cx, cy) {
  const s = stuecke[dragIdx];
  if (!s) return;
  const w = s.bc * dragCS + (s.bc - 1) * 2;
  const h = s.br * dragCS + (s.br - 1) * 2;
  ghost.style.left = `${cx - w / 2}px`;
  ghost.style.top = `${cy - h - dragCS * 1.2}px`;
}

function rasterPosAusPointer(cx, cy) {
  const s = stuecke[dragIdx];
  if (!s) return { r0: 0, c0: 0 };
  const rect = canvas.getBoundingClientRect();
  const { r, c } = pixelZuRaster(cx, cy);
  const zielR = r;
  const zielC = c;
  let bestR = 0;
  let bestC = 0;
  let bestD = Infinity;
  for (let r0 = 0; r0 < RASTER; r0 += 1) {
    for (let c0 = 0; c0 < RASTER; c0 += 1) {
      if (!board.kannSetzen(s.zellen, r0, c0)) continue;
      const { y } = rasterZuPixel(r0, c0);
      const { x } = rasterZuPixel(r0, c0);
      const cx0 = rect.left + x + zellenPixel / 2;
      const cy0 = rect.top + y + zellenPixel / 2;
      const d = (cx - cx0) ** 2 + (cy - cy0) ** 2;
      if (d < bestD) {
        bestD = d;
        bestR = r0;
        bestC = c0;
      }
    }
  }
  if (bestD === Infinity) {
    return { r0: zielR, c0: zielC };
  }
  return { r0: bestR, c0: bestC };
}

function dragMove(e) {
  if (dragIdx < 0 || !stuecke[dragIdx]) return;
  ghostPositionieren(e.clientX, e.clientY);
  const s = stuecke[dragIdx];
  const { r0, c0 } = rasterPosAusPointer(e.clientX, e.clientY);
  const gueltig = board.kannSetzen(s.zellen, r0, c0);
  vorschauSetzen(s, r0, c0, gueltig);
}

function dragAbort() {
  document.removeEventListener('pointermove', dragMove);
  document.removeEventListener('pointerup', dragEnd);
  document.removeEventListener('pointercancel', dragAbort);
  ghost.style.display = 'none';
  dragIdx = -1;
  vorschauAus();
  debugPlatzierungen = [];
  boardZeichnen();
}

async function dragEnd(e) {
  if (dragIdx < 0) return;
  document.removeEventListener('pointermove', dragMove);
  document.removeEventListener('pointerup', dragEnd);
  document.removeEventListener('pointercancel', dragAbort);
  ghost.style.display = 'none';
  const idx = dragIdx;
  const s = stuecke[idx];
  dragIdx = -1;
  vorschauAus();
  debugPlatzierungen = [];
  const { r0, c0 } = rasterPosAusPointer(e.clientX, e.clientY);
  if (!board.kannSetzen(s.zellen, r0, c0)) return;
  await steinSetzen(idx, r0, c0);
}

function passFormPruefen() {
  const noch = stuecke.map((s, i) => ({ s, i })).filter((x) => x.s);
  if (noch.length === 0) return;
  let moeglich = false;
  for (const { s, i } of noch) {
    const slot = document.getElementById(`slot${i}`);
    if (board.gueltigePositionen(s.zellen).length > 0) {
      moeglich = true;
      slot.classList.remove('cant-fit');
    } else {
      slot.classList.add('cant-fit');
    }
  }
  if (!moeglich) setTimeout(() => spielEnde(), 450);
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
    mg.style.gridTemplateColumns = `repeat(${s.bc}, 15px)`;
    mg.style.gridTemplateRows = `repeat(${s.br}, 15px)`;
    const occ = new Set(s.zellen.map(([r, c]) => `${r},${c}`));
    for (let r = 0; r < s.br; r += 1) {
      for (let c = 0; c < s.bc; c += 1) {
        const mc = document.createElement('div');
        mc.className = 'mini-cell';
        if (occ.has(`${r},${c}`)) {
          mc.style.background = s.farbe;
          mc.style.boxShadow = 'inset 0 2px 0 rgba(255,255,255,.28), inset 0 -2px 0 rgba(0,0,0,.22)';
        } else mc.style.background = 'transparent';
        mg.appendChild(mc);
      }
    }
    slot.appendChild(mg);
    slot.onpointerdown = (ev) => dragStart(ev, i);
  }
}

async function steinSetzen(idx, r0, c0) {
  if (istAnimiert) return;
  const s = stuecke[idx];
  const farbe = s.farbe;
  board.setzen(s.zellen, r0, c0, farbe);
  punkte += s.zellen.length;
  stuecke[idx] = null;
  document.getElementById(`slot${idx}`).classList.add('used');
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
  el.textContent = [
    `Schwierigkeit: ${d.schwierigkeit.toFixed(3)}`,
    `Versuche: ${d.versuche} (verworfen: ${d.verworfen})`,
    d.grund || '',
    `Leere Felder: ${board.leereZellen()}`,
  ].join('\n');
}

function spielStart() {
  board = new Board();
  stuecke = [null, null, null];
  punkte = 0;
  comboStufe = 1;
  istGameOver = false;
  istAnimiert = false;
  document.getElementById('gameOverScreen').classList.remove('show');
  comboRendern();
  punkteRendern();
  canvasGroesseAnpassen();
  neuePiecesGenerieren();
}

async function spielEnde() {
  istGameOver = true;
  document.getElementById('gameOverScreen').classList.add('show');
  document.getElementById('goScore').textContent = punkte;
  const isNeu = punkte > 0 && punkte >= highscore;
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
        return `<div class="lb-row${istIch ? ' me' : ''}">
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

  window.addEventListener('resize', () => {
    canvasGroesseAnpassen();
  });

  spielStart();
});
