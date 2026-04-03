# Pixel Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pixel Drop als vollständiges Browser-Spiel implementieren – Block-Blast-Mechanik mit Sand-Physik, BFS-Farbenverbindung und Supabase-Rangliste.

**Architecture:** Ein `<canvas>` zeigt Spielfeld (links) + Block-Panel (rechts). Grid ist ein 2D-Array `gitter[zeile][spalte]`. Physik läuft als zellulärer Automat (3 Durchläufe/Frame, unten→oben). Nach jedem Physik-Zyklus prüft BFS ob eine Farbe Rand-zu-Rand verbunden ist. HTML-Overlays für Title/GameOver/Rangliste.

**Tech Stack:** Vanilla HTML/CSS/JS ES6+, requestAnimationFrame, Supabase via `PZ.*`-Wrapper aus `../../auth.js`

---

## Dateistruktur

| Datei | Inhalt |
|-------|--------|
| `games/pixel-drop/index.html` | Screens (title, game, gameover, lb), HUD-div |
| `games/pixel-drop/style.css` | Layout, HUD, Screens, responsive |
| `games/pixel-drop/game.js` | Alles: Konstanten, Grid, Physik, Blöcke, Drag, BFS, Punkte, Supabase |

---

## Task 1: HTML & CSS Grundgerüst

**Dateien:**
- Erstellen: `games/pixel-drop/index.html`
- Erstellen: `games/pixel-drop/style.css`

- [ ] **Schritt 1: index.html anlegen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Pixel Drop — PIXELZONE</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ── TITLE SCREEN ─────────────────────────── -->
<div class="screen" id="screen-title">
  <a href="../../index.html" class="back-btn">← PIXELZONE</a>
  <div class="title-logo">PIXEL<br>DROP</div>
  <div class="title-sub">Block-Physik-Puzzle</div>
  <div class="title-btns">
    <button class="btn btn-primary" id="btn-play">▶ Spielen</button>
    <button class="btn btn-secondary" id="btn-lb-title">🏆 Rangliste</button>
  </div>
</div>

<!-- ── GAME SCREEN ──────────────────────────── -->
<div class="screen hidden" id="screen-game">
  <div id="hud">
    <div class="hud-left">
      <span class="hud-crown">👑</span>
      <span id="hud-score">0</span>
    </div>
    <div class="hud-mid">
      <div class="fortschritt-wrap">
        <div class="fortschritt-bar" id="fortschritt-bar"></div>
      </div>
      <div class="fortschritt-label" id="fortschritt-label">0 / 500</div>
    </div>
    <div class="hud-right">
      <button class="hud-btn" id="btn-neustart" title="Neustart">🔄</button>
      <button class="hud-btn" id="btn-settings" title="Einstellungen">⚙</button>
    </div>
  </div>
  <canvas id="c"></canvas>
</div>

<!-- ── GAME OVER ─────────────────────────────── -->
<div class="screen hidden" id="screen-gameover">
  <div class="go-title">GAME OVER</div>
  <div class="result-box">
    <div class="result-row"><span>Punkte</span><span id="res-score">0</span></div>
    <div class="result-row"><span>Highscore</span><span id="res-highscore">0</span></div>
  </div>
  <div id="go-login-hint" class="login-hint" style="display:none">
    <a href="../../login.html">Anmelden</a> um Score zu speichern
  </div>
  <div class="go-btns">
    <button class="btn btn-primary" id="btn-retry">🔄 Nochmal</button>
    <button class="btn btn-secondary" id="btn-lb-go">🏆 Rangliste</button>
  </div>
</div>

<!-- ── RANGLISTE ─────────────────────────────── -->
<div class="screen hidden" id="screen-lb">
  <button class="back-btn" id="btn-lb-back">← Zurück</button>
  <div class="lb-title">🏆 RANGLISTE</div>
  <div id="lb-content"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="../../auth.js"></script>
<script src="game.js"></script>
</body>
</html>
```

- [ ] **Schritt 2: style.css anlegen**

```css
/* ══════════════════════════════════════════
   PIXEL DROP — Style
   Hell, freundlich, Puzzle-Ästhetik
══════════════════════════════════════════ */
:root {
  --bg:        #fafaf8;
  --hud-bg:    #ffffff;
  --accent:    #3b82f6;
  --text:      #1e293b;
  --text2:     #64748b;
  --btn-prime: #3b82f6;
  --btn-sec:   #e2e8f0;
  --hud-h:     52px;
}

*, *::before, *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

html, body {
  width: 100%; height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: 'Nunito', sans-serif;
  overflow: hidden;
  touch-action: none;
}

/* ── Screens ─────────────────────────────── */
.screen {
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem;
  background: var(--bg);
}
.screen.hidden { display: none; }

/* ── Back-Button ─────────────────────────── */
.back-btn {
  position: absolute; top: 1rem; left: 1rem;
  background: var(--btn-sec);
  border: none; border-radius: 8px;
  color: var(--text2);
  padding: .4rem .9rem;
  font-family: 'Nunito', sans-serif;
  font-size: .85rem; font-weight: 700;
  cursor: pointer; text-decoration: none;
}

/* ── Title Screen ────────────────────────── */
.title-logo {
  font-size: clamp(2.5rem, 9vw, 5rem);
  font-weight: 900;
  line-height: 1;
  text-align: center;
  background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.title-sub {
  font-size: .85rem; color: var(--text2);
  letter-spacing: .05em;
}
.title-btns { display: flex; flex-direction: column; gap: .6rem; width: min(260px, 80vw); }

/* ── Buttons ─────────────────────────────── */
.btn {
  padding: .8rem 1.5rem;
  border: none; border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 1rem; font-weight: 800;
  cursor: pointer; transition: opacity .15s, transform .1s;
}
.btn:hover  { opacity: .88; }
.btn:active { transform: scale(.97); }
.btn-primary  { background: var(--btn-prime); color: #fff; }
.btn-secondary { background: var(--btn-sec); color: var(--text); }

/* ── HUD ─────────────────────────────────── */
#hud {
  position: absolute; top: 0; left: 0; right: 0;
  height: var(--hud-h);
  display: flex; align-items: center;
  padding: 0 .75rem; gap: .5rem;
  background: var(--hud-bg);
  border-bottom: 1px solid #e2e8f0;
  z-index: 10;
}
.hud-left {
  display: flex; align-items: center; gap: .3rem;
  min-width: 90px;
}
.hud-crown { font-size: 1.1rem; }
#hud-score {
  font-size: 1.3rem; font-weight: 900;
  color: var(--text);
}
.hud-mid {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; gap: 2px;
}
.fortschritt-wrap {
  width: min(200px, 50vw); height: 8px;
  background: #e2e8f0; border-radius: 4px; overflow: hidden;
}
.fortschritt-bar {
  height: 100%; width: 0%;
  background: linear-gradient(90deg, #3b82f6, #f97316);
  border-radius: 4px; transition: width .3s;
}
.fortschritt-label {
  font-size: .68rem; color: var(--text2); font-weight: 700;
}
.hud-right { display: flex; gap: .3rem; min-width: 72px; justify-content: flex-end; }
.hud-btn {
  background: var(--btn-sec); border: none; border-radius: 8px;
  width: 34px; height: 34px; font-size: 1rem;
  cursor: pointer; transition: opacity .15s;
}
.hud-btn:hover { opacity: .7; }

/* ── Canvas ──────────────────────────────── */
#c {
  position: absolute;
  top: var(--hud-h); left: 0;
  display: block;
}
#screen-game { overflow: hidden; }

/* ── Game Over ───────────────────────────── */
.go-title {
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 900; color: #ef4444;
}
.result-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  width: min(300px, 86vw);
  display: flex; flex-direction: column; gap: .5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
}
.result-row {
  display: flex; justify-content: space-between;
  font-size: .95rem;
}
.result-row span:last-child { font-weight: 900; color: var(--accent); }
.login-hint { font-size: .8rem; color: var(--text2); text-align: center; }
.login-hint a { color: var(--accent); font-weight: 700; text-decoration: none; }
.go-btns { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: center; width: min(300px, 86vw); }
.go-btns .btn { flex: 1; min-width: 120px; }

/* ── Rangliste ───────────────────────────── */
#screen-lb {
  justify-content: flex-start;
  padding-top: 4rem; padding-bottom: 2rem;
  overflow-y: auto; gap: .75rem;
}
.lb-title {
  font-size: 1.3rem; font-weight: 800; text-align: center;
}
#lb-content { width: min(420px, 94vw); }
.lb-table { width: 100%; border-collapse: collapse; }
.lb-table th {
  font-size: .7rem; text-transform: uppercase;
  letter-spacing: .08em; color: var(--text2);
  padding: .4rem .5rem; text-align: left;
}
.lb-table td { padding: .45rem .5rem; font-size: .88rem; border-top: 1px solid #f1f5f9; }
.lb-rank  { font-weight: 900; width: 36px; }
.lb-rank.g { color: #f59e0b; }
.lb-rank.s { color: #94a3b8; }
.lb-rank.b { color: #fb923c; }
.lb-name  { font-weight: 700; }
.lb-score { font-weight: 900; color: var(--accent); text-align: right; }
.lb-empty { text-align: center; color: var(--text2); padding: 1.5rem; font-size: .85rem; }
```

- [ ] **Schritt 3: Im Browser öffnen und prüfen**

Öffne `games/pixel-drop/index.html` im Browser.
Erwartung: Titel-Screen mit Logo, zwei Buttons. Heller Hintergrund, kein JS-Fehler in der Konsole.

- [ ] **Schritt 4: Commit**

```bash
git add games/pixel-drop/index.html games/pixel-drop/style.css
git commit -m "feat: Pixel Drop – HTML & CSS Grundgerüst"
```

---

## Task 2: Canvas-Setup & Grid-Rendering

**Dateien:**
- Erstellen: `games/pixel-drop/game.js`

- [ ] **Schritt 1: game.js mit Konstanten und Grid-Datenstruktur anlegen**

```js
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
```

- [ ] **Schritt 2: Render-Funktionen für Spielfeld und Pixel**

Direkt unter dem Code aus Schritt 1 anhängen:

```js
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
```

- [ ] **Schritt 3: Haupt-Draw-Funktion und Game-Loop-Skelett**

```js
// ── Haupt-Draw ────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, CW, CH);
  panelHintergrundZeichnen();
  spielfeldZeichnen();
}

// ── Game Loop ─────────────────────────────────────────────────────────────────
function tick() {
  if (!running) return;
  loopId = requestAnimationFrame(tick);
  draw();
}
```

- [ ] **Schritt 4: Initialisierung und Button-Listener**

```js
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

  if (loopId) cancelAnimationFrame(loopId);
  tick();
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

// ── Rangliste (Platzhalter, Task 10 füllt sie aus) ────────────────────────────
let lbVorher = 'screen-title';
function rangliste_zeigen(vorher) {
  lbVorher = vorher;
  screenZeigen('screen-lb');
  document.getElementById('lb-content').innerHTML =
    '<p class="lb-empty">Wird geladen…</p>';
}

// ── Spiel Ende (Platzhalter, Task 9 füllt aus) ────────────────────────────────
function spielEnde() {
  running = false;
  if (loopId) cancelAnimationFrame(loopId);
  screenZeigen('screen-gameover');
  document.getElementById('res-score').textContent     = score;
  document.getElementById('res-highscore').textContent = Math.max(score, highscore);
}
```

- [ ] **Schritt 5: Im Browser prüfen**

Klicke „Spielen". Erwartung: Spielfeld-Canvas mit dunklem Hintergrund, hellblauem Panel rechts, roter Gefahrenlinie nach 2 Zeilen. Kein JS-Fehler.

- [ ] **Schritt 6: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Canvas-Setup & Grid-Rendering"
```

---

## Task 3: Pixel-Physik & Game-Loop-Update

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: `physikSchritt()` einfügen** (vor `draw()`)

```js
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
```

- [ ] **Schritt 2: `tick()` um Physik-Logik erweitern**

`tick()` aus Task 2 ersetzen durch:

```js
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

  // Verbindungs-Check (Task 7 füllt aus)
  const verbunden = verbindungsPruefen();
  if (verbunden) {
    // Physik erneut starten (Pixel darüber fallen)
    // tick() macht das automatisch
  }
}

// Platzhalter – wird in Task 7 implementiert
function verbindungsPruefen() {
  return false;
}
```

- [ ] **Schritt 3: Im Browser testen**

Öffne die Konsole und gib ein:
```js
// Testpixel eintragen
gitter[0][3] = 'rot';
gitter[0][4] = 'blau';
gitter[5][5] = 'gruen';
```
Erwartung: Pixel fallen nach unten, rutschen auf Hindernissen leicht zur Seite.
(Manuell über Dev-Tools eingeben solange kein Block-System existiert.)

- [ ] **Schritt 4: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Pixel-Physik (Fallen + Rutschen)"
```

---

## Task 4: Block-Definitionen & Panel-Rendering

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: Block-Formen definieren** (nach den Konstanten einfügen)

```js
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
```

- [ ] **Schritt 2: `panelZeichnen()` implementieren** (nach `panelHintergrundZeichnen()` einfügen)

```js
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
```

- [ ] **Schritt 3: `draw()` erweitern um Panel-Blöcke**

`draw()` aus Task 2 ersetzen:

```js
function draw() {
  ctx.clearRect(0, 0, CW, CH);
  panelHintergrundZeichnen();
  spielfeldZeichnen();
  if (panelBloecke.length > 0) panelZeichnen();
}
```

- [ ] **Schritt 4: `spielStarten()` um Block-Generierung erweitern**

In `spielStarten()` nach `hudAktualisieren()` einfügen:

```js
  neuesBloeckeGenerieren();
```

- [ ] **Schritt 5: Im Browser prüfen**

Klicke „Spielen". Erwartung: Im Panel rechts erscheinen 3 Blöcke in verschiedenen Farben und Formen in weißen Karten.

- [ ] **Schritt 6: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Block-Definitionen & Panel-Rendering"
```

---

## Task 5: Drag & Drop System

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: Hilfsfunktionen für Drag** (nach den Drag-Zustand-Variablen einfügen)

```js
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
  const maxS      = Math.max(...drag.zellen.map(([, s]) => s));
  const blockBr   = maxS + 1;
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
```

- [ ] **Schritt 2: Drag-Start, -Move und -End implementieren**

```js
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
```

- [ ] **Schritt 3: Event-Listener registrieren** (ans Ende von `spielStarten()` anhängen)

```js
  // Event-Listener für Drag & Drop
  canvas.addEventListener('mousedown',  dragStart);
  canvas.addEventListener('mousemove',  dragMove);
  canvas.addEventListener('mouseup',    dragEnd);
  canvas.addEventListener('touchstart', dragStart, { passive: true });
  canvas.addEventListener('touchmove',  dragMove,  { passive: false });
  canvas.addEventListener('touchend',   dragEnd);
```

- [ ] **Schritt 4: Ghost im `draw()` zeichnen**

Am Ende von `draw()` (nach `panelZeichnen()`) anhängen:

```js
  // Gezogener Block: Ghost im Spielfeld + schwebend am Finger
  if (drag.aktiv) {
    // Ghost im Grid (halbtransparent, eingerastet)
    if (drag.ghostSpalte >= 0) {
      drag.zellen.forEach(([z, s]) => {
        pixelZeichnen(drag.ghostSpalte + s, z, drag.farbe, 0.35);
      });
    }
    // Block schwimmt am Finger (kleine Vorschau)
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
```

`draw()` sieht danach so aus:
```js
function draw() {
  ctx.clearRect(0, 0, CW, CH);
  panelHintergrundZeichnen();
  spielfeldZeichnen();
  if (panelBloecke.length > 0) panelZeichnen();
  // Ghost zeichnen (Inline am Ende, nicht in eigene Funktion)
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
```

- [ ] **Schritt 5: Im Browser prüfen**

Klicke auf einen Panel-Block und ziehe ihn ins Spielfeld. Erwartung:
- Block folgt dem Finger/Cursor
- Ghost (halbtransparent) rastet spaltenweise ein
- Beim Loslassen bleibt der Block am Ghost-Ort (Physik kommt in Task 6)

- [ ] **Schritt 6: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Drag & Drop System"
```

---

## Task 6: Block-Platzierung & neue Blöcke

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: `blockPlatzieren()` implementieren** (nach `dragEnd()`)

```js
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
```

- [ ] **Schritt 2: Prüfen ob noch ein Block ins Spielfeld passt** (nach `blockPlatzieren()`)

```js
// Gibt true zurück wenn mindestens ein Block noch platzierbar ist
function kannNochPlatziert(block) {
  const maxS = Math.max(...block.zellen.map(([, s]) => s));
  const br   = maxS + 1;

  for (let startS = 0; startS <= GRID_BREITE - br; startS++) {
    // Kann der Block an startS eingetragen werden ohne sofort Game Over zu riskieren?
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

// Prüft ob irgendeiner der 3 Panel-Blöcke noch platziert werden kann
function alleBlocksUnplatzierbar() {
  return panelBloecke
    .filter(b => !b.gesetzt)
    .every(b => !kannNochPlatziert(b));
}
```

- [ ] **Schritt 3: `nachPhysikPruefen()` um Block-Check erweitern**

`nachPhysikPruefen()` aus Task 3 ersetzen:

```js
function nachPhysikPruefen() {
  // Gefahrenlinie
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
```

- [ ] **Schritt 4: Im Browser prüfen**

Blöcke ziehen und platzieren. Erwartung:
- Block erscheint oben im Grid, fällt durch Physik runter
- Nach 3 platzierten Blöcken kommen 3 neue
- Physik-Durchgang funktioniert (Pixel fällt bis zum Boden)

- [ ] **Schritt 5: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Block-Platzierung & neue Blöcke"
```

---

## Task 7: BFS Verbindungs-Check & Punkte

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: `verbindungsPruefen()` aus Task 3 ersetzen**

```js
// ── BFS Verbindungs-Check ─────────────────────────────────────────────────────
// Gibt true zurück wenn mindestens eine Farbe von links nach rechts verbunden ist
function verbindungsPruefen() {
  pruefeGerade     = true;
  let farbZaehler  = 0;   // Wie viele Farben gleichzeitig verschwinden
  let totalPixel   = 0;   // Gesamtzahl verschwundener Pixel

  for (const farbe of FARBEN_NAMEN) {
    const besucht     = Array.from({ length: GRID_HOEHE }, () =>
      new Array(GRID_BREITE).fill(false));
    const gruppe      = [];
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
```

- [ ] **Schritt 2: Im Browser testen**

Baue manuell eine Verbindung auf: Mehrere Blöcke derselben Farbe so platzieren dass sie von links nach rechts reichen. Erwartung: Pixel verschwinden, Punkte steigen, Pixel darüber fallen nach.

- [ ] **Schritt 3: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – BFS Verbindungs-Check & Punkte"
```

---

## Task 8: Game Over Screen

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: `spielEnde()` vollständig implementieren**

`spielEnde()` aus Task 2 ersetzen:

```js
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
```

- [ ] **Schritt 2: Im Browser testen**

Das Spielfeld manuell füllen bis die Gefahrenlinie erreicht wird.
Erwartung: Game-Over-Screen erscheint mit korrekten Punkten. „Nochmal"-Button startet neues Spiel.

- [ ] **Schritt 3: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Game Over Screen"
```

---

## Task 9: Rangliste & Supabase

**Dateien:**
- Ändern: `games/pixel-drop/game.js`

- [ ] **Schritt 1: `rangliste_zeigen()` vollständig implementieren**

`rangliste_zeigen()` aus Task 2 ersetzen:

```js
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
```

- [ ] **Schritt 2: `btn-lb-back`-Listener in DOMContentLoaded anpassen**

Den bestehenden `btn-lb-back`-Listener in `DOMContentLoaded` prüfen – er muss auf `lbVorher` zeigen:

```js
  document.getElementById('btn-lb-back').addEventListener('click', () => screenZeigen(lbVorher));
```

- [ ] **Schritt 3: Im Browser prüfen**

Spiel spielen, Game Over erreichen, „Rangliste" klicken. Erwartung: Entweder „Noch keine Einträge" oder echte Einträge aus Supabase. Kein JS-Fehler.

- [ ] **Schritt 4: Commit**

```bash
git add games/pixel-drop/game.js
git commit -m "feat: Pixel Drop – Rangliste & Supabase"
```

---

## Task 10: Mobile-Polish & Startseite

**Dateien:**
- Ändern: `games/pixel-drop/style.css`
- Ändern: `games/pixel-drop/game.js`
- Ändern: `Spiele Website/index.html`
- Ändern: `Spiele Website/style.css`

- [ ] **Schritt 1: Responsive-CSS in style.css ergänzen**

Am Ende von style.css anhängen:

```css
/* ── Responsive ──────────────────────────── */
@media (max-height: 600px) {
  :root { --hud-h: 40px; }
  #hud-score { font-size: 1rem; }
}

@media (max-width: 400px) {
  .title-logo { font-size: 2.2rem; }
}
```

- [ ] **Schritt 2: Pixel Drop als Spielekarte in `index.html` eintragen**

In `Spiele Website/index.html` eine neue Karte zum Spielegrid hinzufügen (nach dem letzten vorhandenen `.game-card`-Eintrag):

```html
<a class="game-card" href="games/pixel-drop/index.html">
  <div class="card-thumb t-pixeldrop"></div>
  <div class="card-info">
    <div class="card-title">Pixel Drop</div>
    <div class="card-desc">Block-Physik-Puzzle</div>
  </div>
</a>
```

- [ ] **Schritt 3: Thumbnail-Klasse in `style.css` (Hauptordner) hinzufügen**

In `Spiele Website/style.css` nach dem letzten `.t-*`-Eintrag:

```css
.t-pixeldrop { background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); }
```

- [ ] **Schritt 4: Im Browser auf Mobilgerät / DevTools prüfen**

Gerät auf 375px × 812px (iPhone) einstellen. Erwartung:
- Spielfeld passt vollständig auf den Screen
- Block-Panel sichtbar
- Drag mit Touch funktioniert

- [ ] **Schritt 5: Commit**

```bash
git add games/pixel-drop/style.css games/pixel-drop/game.js \
        "Spiele Website/index.html" "Spiele Website/style.css"
git commit -m "feat: Pixel Drop – Mobile-Polish & Startseiten-Karte"
```

---

## Task 11: NOTES.md aktualisieren & GitHub Push

**Dateien:**
- Ändern: `Spiele Website/NOTES.md`

- [ ] **Schritt 1: NOTES.md aktualisieren**

Unter „Was heute gemacht wurde" eintragen:

```
### Pixel Drop (2026-04-03) ✅
- `games/pixel-drop/` angelegt: index.html, game.js, style.css
- 10×20 Grid, Pixel-Physik (Fallen + Rutschen)
- 17 Block-Formen (7 Tetris + 10 Extra), Drag & Drop
- BFS-Verbindungs-Check: Farbe von Rand zu Rand → Pixel verschwinden
- Punkte-Multiplikator bei mehreren Farben gleichzeitig
- Game Over: Gefahrenlinie / kein Platz mehr
- Supabase-Rangliste via PZ.getLeaderboard / PZ.saveGameData
- Startseite: Pixel-Drop-Karte hinzugefügt
```

- [ ] **Schritt 2: Alles committen und pushen**

```bash
cd "C:\Users\leona\Desktop\Claude\Spiele Website"
git add NOTES.md
git commit -m "docs: NOTES.md – Pixel Drop Session abgeschlossen"
git push
```

---

## Selbst-Review

**Spec-Abdeckung:**
- ✅ 10×20 Grid, Pixel-Physik (Task 2, 3)
- ✅ 17 Block-Formen inkl. Tetris + Extra (Task 4)
- ✅ Drag & Drop, Ghost-Vorschau (Task 5)
- ✅ Block-Platzierung oben, Physik übernimmt (Task 6)
- ✅ BFS 8-connected von Spalte 0 → Spalte 9 (Task 7)
- ✅ Punkte × Multiplikator bei mehreren Farben (Task 7)
- ✅ Gefahrenlinie Game-Over-Check (Task 3, 8)
- ✅ Kein-Platz-mehr Game-Over-Check (Task 6)
- ✅ HUD: Score, Fortschrittsleiste (Task 2)
- ✅ Game-Over-Screen mit Retry + Rangliste (Task 8)
- ✅ Supabase-Rangliste Top 10 (Task 9)
- ✅ Mobile-Touch, responsive (Task 10)

**Typen-Konsistenz:**
- `verbindungsPruefen()` → in Task 3 als Platzhalter, in Task 7 ersetzt ✅
- `spielEnde()` → in Task 2 als Platzhalter, in Task 8 ersetzt ✅
- `rangliste_zeigen()` → in Task 2 als Platzhalter, in Task 9 ersetzt ✅
- `lbVorher` → in Task 2 deklariert, in Task 9 Listener angepasst ✅
- `FARBEN_NAMEN`, `FARBEN_HEX`, `BLOCK_FORMEN` → konsistent durch alle Tasks ✅
