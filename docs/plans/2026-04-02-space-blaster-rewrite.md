# Space Blaster – Vollständiger Rewrite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kompletter Rewrite von Space Blaster als vollwertiges Space-Invaders-Spiel mit Wellen-System, Bossen, 8 Power-Up-Typen, permanenten Upgrades und Supabase-Persistenz.

**Architecture:** Vollbild-Canvas (window.innerWidth × window.innerHeight), HUD als HTML-Overlay (position: absolute über dem Canvas). Alle Spiellogik in einer `game.js` mit klar getrennten Abschnitten. Kein Framework, kein TypeScript.

**Tech Stack:** Vanilla HTML/CSS/JS (ES6+), Canvas 2D API, requestAnimationFrame, Supabase via PZ (auth.js)

---

## Dateistruktur

```
games/space-blaster/
├── index.html   ← Alle Screens (title, game, gameover, shop, rangliste)
├── style.css    ← Vollständiger Rewrite: Weltraum-Ästhetik, HUD, Shop, responsive
└── game.js      ← Vollständiger Rewrite: gesamte Spiellogik
```

## Kerndatenstrukturen (Referenz für alle Tasks)

```js
// Spieler
let player = {
  x, y, w: 40, h: 40, speed: 5,
  shootTimer: 0, shootRate: 18,   // Frames zwischen Schüssen
  shotLevel: 1,                   // 1–5 (stackend)
};

// Gegner (einzeln)
{ x, y, w: 32, h: 26, hp, maxHp, points, color,
  canShoot, shootTimer, shootRate }

// Formation-Zustand (enthält alle Gegner der Welle)
let formation = {
  enemies: [],
  dx: 1, dy: 0,       // Richtung
  speed: 1.0,
  stepDown: false,    // eine Reihe nach unten springen
};

// Boss
let boss = {
  x, y, w: 80, h: 60, hp, maxHp,
  dx: 1, speed: 2, shootTimer: 0, shootRate: 90,
  alive: false,
};

// Schuss
{ x, y, dx, dy, speed, w, h, color, type: 'player'|'enemy' }

// Power-Up (sammelbar, fällt vom Bildschirm)
{ x, y, vy: 1.5, type: 'shot'|'fastfire'|'laser'|'shield'|'heart',
  shotLevel: 2–5,   // nur bei type==='shot'
  color, label }

// Münze (sammelbar)
{ x, y, vy: 1.2, value: 1|2|3 }

// Aktive zeitliche Power-Ups (Frames verbleibend)
let activePw = { fastFire: 0, laser: 0, shield: 0 };

// Permanente Upgrades (aus Supabase geladen)
let upgrades = {
  pwDuration: 0,   // 0=basis | 1=+5s | 2=+10s | 3=+20s
  maxLives: 0,     // 0=+0 | 1=+1 | 2=+2 | 3=+3 Extra-Leben
};

// Spielerdaten (Supabase, persistent)
let pdata = { coins: 0, upgrades: { pwDuration: 0, maxLives: 0 } };
```

---

## Task 1: HTML & CSS – Alle Screens, HUD, Shop-UI

**Files:**
- Overwrite: `games/space-blaster/index.html`
- Overwrite: `games/space-blaster/style.css`

- [ ] **Schritt 1: index.html komplett ersetzen**

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Space Blaster — PIXELZONE</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Nunito:wght@400;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

<!-- ── TITLE SCREEN ─────────────────────────── -->
<div class="screen" id="screen-title">
  <a href="../../index.html" class="back-btn">← PIXELZONE</a>
  <div class="title-logo">SPACE<br>BLASTER</div>
  <div class="title-sub">PIXELZONE ARCADE</div>
  <div class="title-coins">🪙 <span id="title-coins">0</span></div>
  <div class="title-btns">
    <button class="btn btn-primary" id="btn-play">▶ Spielen</button>
    <button class="btn btn-secondary" id="btn-lb">🏆 Rangliste</button>
    <button class="btn btn-secondary" id="btn-shop-title">🛒 Shop</button>
  </div>
</div>

<!-- ── GAME SCREEN ──────────────────────────── -->
<div class="screen hidden" id="screen-game">
  <!-- HUD (über dem Canvas) -->
  <div id="hud">
    <div class="hud-item"><span class="hud-label">Punkte</span><span class="hud-val" id="hud-score">0</span></div>
    <div class="hud-item"><span class="hud-label">Welle</span><span class="hud-val" id="hud-wave">1</span></div>
    <div class="hud-item hud-lives"><span class="hud-label">Leben</span><div id="hud-lives-icons"></div></div>
    <div class="hud-item"><span class="hud-label">Münzen</span><span class="hud-val" id="hud-coins">0</span></div>
  </div>
  <!-- Aktive Power-Up Leisten -->
  <div id="pw-timers"></div>
  <!-- Canvas -->
  <canvas id="c"></canvas>
</div>

<!-- ── GAME OVER ─────────────────────────────── -->
<div class="screen hidden" id="screen-gameover">
  <div class="go-title">GAME OVER</div>
  <div class="go-wave" id="go-wave">Welle 1 erreicht</div>
  <div class="result-box">
    <div class="result-row"><span>Punkte</span><span id="res-score">0</span></div>
    <div class="result-row"><span>Höchste Welle</span><span id="res-wave">1</span></div>
    <div class="result-row"><span>Münzen verdient</span><span id="res-coins">0</span></div>
  </div>
  <div id="go-login-hint" class="login-hint" style="display:none">
    <a href="../../login.html">Anmelden</a> um Score zu speichern
  </div>
  <div class="go-btns">
    <button class="btn btn-primary" id="btn-retry">Nochmal</button>
    <button class="btn btn-secondary" id="btn-shop-go">🛒 Shop</button>
    <button class="btn btn-secondary" id="btn-lb-go">🏆 Rangliste</button>
  </div>
</div>

<!-- ── SHOP ──────────────────────────────────── -->
<div class="screen hidden" id="screen-shop">
  <div class="shop-header">
    <button class="back-btn" id="btn-shop-back">←</button>
    <div class="shop-title">SHOP</div>
    <div class="shop-balance">🪙 <span id="shop-coins">0</span></div>
  </div>
  <div class="shop-section-title">Power-Up Dauer verlängern</div>
  <div class="shop-grid" id="shop-pw-duration"></div>
  <div class="shop-section-title">Maximale Leben erhöhen</div>
  <div class="shop-grid" id="shop-max-lives"></div>
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

- [ ] **Schritt 2: style.css komplett ersetzen**

```css
/* ══════════════════════════════════════════
   SPACE BLASTER — Style
   Dunkel, Weltraum-Ästhetik, HUD overlay
══════════════════════════════════════════ */
:root {
  --bg:        #05050f;
  --hud-bg:    rgba(0,0,0,.75);
  --accent:    #3af;
  --accent2:   #f3a;
  --text:      #e8eaf6;
  --text2:     #90a4ae;
  --btn-prime: #3a86ff;
  --btn-sec:   rgba(255,255,255,.1);
  --coin:      #ffd600;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

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
}
.screen.hidden { display: none; }

/* ── Back-Button ─────────────────────────── */
.back-btn {
  position: absolute; top: 1rem; left: 1rem;
  background: var(--btn-sec);
  border: 1px solid rgba(255,255,255,.15);
  color: var(--text2);
  padding: .4rem .9rem;
  border-radius: 8px;
  font-family: 'Nunito', sans-serif;
  font-size: .85rem; font-weight: 700;
  cursor: pointer; text-decoration: none;
}

/* ── Title Screen ────────────────────────── */
.title-logo {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2.4rem, 8vw, 4.5rem);
  font-weight: 900;
  line-height: 1.05;
  text-align: center;
  background: linear-gradient(135deg, #3af 0%, #f3a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}
.title-sub {
  font-family: 'Orbitron', sans-serif;
  font-size: .75rem; letter-spacing: .3em;
  color: var(--text2); margin-top: -.5rem;
}
.title-coins {
  font-size: 1.1rem; font-weight: 800;
  color: var(--coin);
}
.title-btns { display: flex; flex-direction: column; gap: .6rem; width: min(280px, 80vw); }

/* ── Buttons ─────────────────────────────── */
.btn {
  padding: .8rem 1.5rem;
  border: none; border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 1rem; font-weight: 800;
  cursor: pointer; transition: opacity .15s, transform .1s;
  text-align: center;
}
.btn:hover   { opacity: .88; }
.btn:active  { transform: scale(.97); }
.btn-primary  { background: var(--btn-prime); color: #fff; }
.btn-secondary { background: var(--btn-sec); color: var(--text); border: 1px solid rgba(255,255,255,.15); }

/* ── HUD (über dem Canvas) ───────────────── */
#hud {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center;
  gap: .5rem; padding: .4rem .75rem;
  background: var(--hud-bg);
  backdrop-filter: blur(4px);
  z-index: 10;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.hud-item {
  display: flex; flex-direction: column;
  align-items: center;
  flex: 1; min-width: 0;
}
.hud-label {
  font-size: .62rem; text-transform: uppercase;
  letter-spacing: .08em; color: var(--text2);
}
.hud-val {
  font-family: 'Orbitron', sans-serif;
  font-size: .9rem; font-weight: 700;
  color: var(--text);
}
.hud-lives { flex: 1.5; }
#hud-lives-icons { display: flex; gap: 3px; flex-wrap: wrap; justify-content: center; margin-top: 1px; }
.life-icon { width: 14px; height: 14px; position: relative; }
.life-icon svg { width: 100%; height: 100%; }

/* ── Power-Up Timer Leisten ──────────────── */
#pw-timers {
  position: absolute; top: 48px; left: 0; right: 0;
  display: flex; gap: .3rem; padding: .3rem .5rem;
  z-index: 10; pointer-events: none;
}
.pw-timer-item {
  display: flex; align-items: center; gap: .3rem;
  background: rgba(0,0,0,.6);
  border-radius: 6px; padding: .2rem .5rem;
  font-size: .72rem; font-weight: 800;
  border: 1px solid rgba(255,255,255,.1);
  min-width: 80px;
}
.pw-timer-label { color: var(--text); white-space: nowrap; }
.pw-timer-bar-wrap {
  flex: 1; height: 4px;
  background: rgba(255,255,255,.15);
  border-radius: 2px; overflow: hidden;
}
.pw-timer-bar { height: 100%; border-radius: 2px; transition: width .1s linear; }

/* ── Canvas ──────────────────────────────── */
#c {
  position: absolute; top: 0; left: 0;
  display: block;
}
#screen-game { position: fixed; inset: 0; }

/* ── Game Over ───────────────────────────── */
.go-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 900;
  color: var(--accent2);
}
.go-wave { font-size: 1rem; color: var(--text2); }
.result-box {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  width: min(320px, 88vw);
  display: flex; flex-direction: column; gap: .5rem;
}
.result-row {
  display: flex; justify-content: space-between;
  font-size: .95rem;
}
.result-row span:last-child { font-weight: 800; color: var(--accent); }
.login-hint { font-size: .8rem; color: var(--text2); text-align: center; }
.login-hint a { color: var(--accent); font-weight: 700; text-decoration: none; }
.go-btns { display: flex; gap: .6rem; flex-wrap: wrap; justify-content: center; width: min(320px, 88vw); }
.go-btns .btn { flex: 1; min-width: 100px; }

/* ── Shop ────────────────────────────────── */
.shop-header {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; align-items: center;
  padding: .75rem 1rem;
  background: var(--hud-bg);
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.shop-title {
  flex: 1; text-align: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem; font-weight: 700;
}
.shop-balance { font-size: .95rem; font-weight: 800; color: var(--coin); }
#screen-shop { justify-content: flex-start; padding-top: 70px; overflow-y: auto; gap: .5rem; }
.shop-section-title {
  font-size: .75rem; text-transform: uppercase;
  letter-spacing: .1em; color: var(--text2);
  width: 100%; padding: .5rem .75rem 0;
}
.shop-grid {
  display: flex; flex-direction: column; gap: .5rem;
  width: min(420px, 94vw); padding: 0 .5rem;
}
.shop-card {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 10px;
  padding: .75rem 1rem;
  display: flex; align-items: center; gap: .75rem;
}
.shop-card.owned { border-color: rgba(58,170,255,.35); background: rgba(58,170,255,.06); }
.shop-card.maxed { opacity: .5; }
.shop-card-icon { font-size: 1.4rem; }
.shop-card-info { flex: 1; }
.shop-card-name { font-weight: 800; font-size: .9rem; }
.shop-card-desc { font-size: .75rem; color: var(--text2); margin-top: 2px; }
.shop-card-btn {
  padding: .4rem .85rem;
  border-radius: 8px; border: none;
  font-family: 'Nunito', sans-serif;
  font-size: .85rem; font-weight: 800;
  cursor: pointer; transition: opacity .15s;
  white-space: nowrap;
}
.shop-card-btn:hover { opacity: .8; }
.shop-card-btn.buy   { background: var(--btn-prime); color: #fff; }
.shop-card-btn.done  { background: rgba(255,255,255,.1); color: var(--text2); cursor: default; }

/* ── Rangliste ───────────────────────────── */
#screen-lb { justify-content: flex-start; padding-top: 4rem; overflow-y: auto; gap: .75rem; }
.lb-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.3rem; font-weight: 700; text-align: center;
}
#lb-content { width: min(440px, 94vw); }
.lb-table { width: 100%; border-collapse: collapse; }
.lb-table th { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; color: var(--text2); padding: .4rem .5rem; text-align: left; }
.lb-table td { padding: .45rem .5rem; font-size: .88rem; border-top: 1px solid rgba(255,255,255,.05); }
.lb-rank  { font-weight: 900; width: 36px; }
.lb-rank.g { color: #ffd600; }
.lb-rank.s { color: #b0bec5; }
.lb-rank.b { color: #ff8a65; }
.lb-name   { font-weight: 700; }
.lb-score  { font-weight: 800; color: var(--accent); text-align: right; }
.lb-wave   { font-weight: 700; color: var(--text2); text-align: right; font-size: .8rem; }
.lb-empty  { text-align: center; color: var(--text2); padding: 1.5rem; font-size: .85rem; }

/* ── Responsive ──────────────────────────── */
@media (max-height: 600px) {
  #hud { padding: .25rem .5rem; }
  .hud-val { font-size: .78rem; }
}
```

- [ ] **Schritt 3: Commit**

```bash
cd "Spiele Website"
git add games/space-blaster/index.html games/space-blaster/style.css
git commit -m "Space Blaster: HTML/CSS Rewrite – alle Screens, HUD, Shop-UI"
git push
```

---

## Task 2: Game-Fundament – Zustand, Canvas, Input, Player-Bewegung

**Files:**
- Overwrite: `games/space-blaster/game.js`

- [ ] **Schritt 1: game.js mit Grundgerüst erstellen**

```js
'use strict';

// ── Konstanten ────────────────────────────────────────────────────────────────
const FPS_TARGET = 60;
const HUD_H      = 48;    // Pixel die der HUD-Bereich verbraucht
const PW_H       = 34;    // Pixel für Power-Up Timer-Leiste

// ── Spielzustand ──────────────────────────────────────────────────────────────
let canvas, ctx, CW, CH;
let player;
let bullets       = [];
let enemies       = [];
let boss          = null;
let powerups      = [];
let coins         = [];
let particles     = [];
let formation     = { dx: 1, dy: 0, speed: 1, enemies: [] };
let activePw      = { fastFire: 0, laser: 0, shield: 0 };

let score         = 0;
let wave          = 1;
let lives         = 3;
let gameCoins     = 0;    // diese Runde gesammelte Münzen
let running       = false;
let paused        = false;
let waveClearing  = false;  // Pause zwischen Wellen
let bossWave      = false;
let bossDeathAnim = 0;      // Frames für Sieg-Animation
let loopId        = null;

// Spielerdaten (aus Supabase, persistent)
let pdata = { coins: 0, upgrades: { pwDuration: 0, maxLives: 0 } };

// Permanente Upgrade-Definitionen
const UPGRADE_DEFS = {
  pwDuration: [
    { label: 'Power-Up Dauer +5s',  cost: 50,   bonus: 5  * FPS_TARGET },
    { label: 'Power-Up Dauer +10s', cost: 150,  bonus: 10 * FPS_TARGET },
    { label: 'Power-Up Dauer +20s', cost: 400,  bonus: 20 * FPS_TARGET },
  ],
  maxLives: [
    { label: '+1 Extra-Leben',  cost: 300  },
    { label: '+1 Extra-Leben',  cost: 800  },
    { label: '+1 Extra-Leben',  cost: 2000 },
  ],
};

// Basis-Dauer zeitlicher Power-Ups (in Frames)
const PW_BASE_DURATION = 10 * FPS_TARGET;   // 10 Sekunden

// ── Input ──────────────────────────────────────────────────────────────────────
const keys = {};
let touchX = null;

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch: links/rechts je nach Bildschirmhälfte
document.addEventListener('touchstart', e => {
  touchX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchmove', e => {
  touchX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', () => { touchX = null; });

// ── Canvas & Resize ────────────────────────────────────────────────────────────
function canvasAufbauen() {
  canvas = document.getElementById('c');
  CW = window.innerWidth;
  CH = window.innerHeight;
  canvas.width  = CW;
  canvas.height = CH;
  ctx = canvas.getContext('2d');
}

window.addEventListener('resize', () => {
  if (!running) return;
  CW = window.innerWidth;
  CH = window.innerHeight;
  canvas.width  = CW;
  canvas.height = CH;
  // Spieler-Position korrigieren
  if (player) player.y = CH - 80;
});

// ── Spieler ────────────────────────────────────────────────────────────────────
function spielerErstellen() {
  player = {
    x: CW / 2,
    y: CH - 80,
    w: 40, h: 40,
    speed: 5,
    shootTimer: 0,
    shootRate: 18,     // Frames zwischen Schüssen
    shotLevel: 1,      // 1–5
  };
}

function spielerBewegen() {
  const goLeft  = keys['ArrowLeft']  || keys['a'] || (touchX !== null && touchX < CW / 2);
  const goRight = keys['ArrowRight'] || keys['d'] || (touchX !== null && touchX >= CW / 2);
  if (goLeft)  player.x = Math.max(player.w / 2, player.x - player.speed);
  if (goRight) player.x = Math.min(CW - player.w / 2, player.x + player.speed);
}

// ── Game Loop ──────────────────────────────────────────────────────────────────
function tick() {
  if (!running) return;
  loopId = requestAnimationFrame(tick);
  update();
  draw();
}

function update() {
  spielerBewegen();
  // (weitere Systeme in späteren Tasks)
}

function draw() {
  // Sternenhintergrund
  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, CW, CH);
  sternZeichnen();
  spielerZeichnen();
}

// Einfacher Sternenhintergrund
const STERNE = Array.from({ length: 80 }, (_, i) => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 1.5 + 0.3,
  a: Math.random() * 0.6 + 0.2,
}));

function sternZeichnen() {
  STERNE.forEach(s => {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x * CW, s.y * CH, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function spielerZeichnen() {
  if (!player) return;
  const { x, y, w, h } = player;
  ctx.save();
  ctx.fillStyle = activePw.shield > 0 ? '#34d399' : '#3af';
  ctx.shadowColor = activePw.shield > 0 ? '#34d399' : '#3af';
  ctx.shadowBlur = 14;
  // Schiff: Dreieck mit Flügeln
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x + w * 0.28, y + h * 0.2);
  ctx.lineTo(x - w * 0.28, y + h * 0.2);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fill();
  // Schild-Ring
  if (activePw.shield > 0) {
    ctx.strokeStyle = 'rgba(52,211,153,.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Screens ────────────────────────────────────────────────────────────────────
function screenZeigen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// ── Spiel starten ──────────────────────────────────────────────────────────────
function spielStarten() {
  screenZeigen('screen-game');
  canvasAufbauen();
  spielerErstellen();
  bullets    = []; enemies = []; powerups = []; coins = []; particles = [];
  formation  = { dx: 1, dy: 0, speed: 1, enemies: [] };
  activePw   = { fastFire: 0, laser: 0, shield: 0 };
  score      = 0;
  wave       = 1;
  lives      = 3 + (pdata.upgrades?.maxLives || 0);
  gameCoins  = 0;
  running    = true;
  waveClearing = false;
  boss       = null;
  bossWave   = false;

  if (loopId) cancelAnimationFrame(loopId);
  tick();
  // Welle 1 in Task 4 starten
}

// ── Init bei DOMContentLoaded ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await spielerDatenLaden();
  titelMünzenZeigen();

  document.getElementById('btn-play').addEventListener('click', spielStarten);
  document.getElementById('btn-retry').addEventListener('click', spielStarten);
  document.getElementById('btn-lb').addEventListener('click', rangliste_zeigen);
  document.getElementById('btn-lb-go').addEventListener('click', rangliste_zeigen);
  document.getElementById('btn-lb-back').addEventListener('click', () => screenZeigen('screen-title'));
  document.getElementById('btn-shop-title').addEventListener('click', shop_zeigen);
  document.getElementById('btn-shop-go').addEventListener('click', shop_zeigen);
  document.getElementById('btn-shop-back').addEventListener('click', () => screenZeigen(running ? 'screen-gameover' : 'screen-title'));
});

function titelMünzenZeigen() {
  document.getElementById('title-coins').textContent = pdata.coins;
}
```

- [ ] **Schritt 2: Spielerdaten laden (Supabase)**

Am Ende von game.js hinzufügen:

```js
// ── Spielerdaten (Supabase) ────────────────────────────────────────────────────
async function spielerDatenLaden() {
  try {
    const data = await PZ.loadScore('space-blaster');
    if (data?.extra_daten) {
      pdata.coins    = data.extra_daten.coins    || 0;
      pdata.upgrades = data.extra_daten.upgrades || { pwDuration: 0, maxLives: 0 };
    }
  } catch (_) {}
}

async function spielerDatenSpeichern() {
  try {
    await PZ.saveGameData('space-blaster', score, wave, {
      coins:    pdata.coins,
      upgrades: pdata.upgrades,
    });
  } catch (_) {}
}
```

- [ ] **Schritt 3: Im Browser testen**

Öffne `games/space-blaster/index.html`. Erwartetes Verhalten:
- Title Screen erscheint mit Logo, Buttons, Münzzähler (0)
- „Spielen" öffnet den Game Screen mit Sternenhintergrund
- Raumschiff in der Mitte unten sichtbar
- Raumschiff bewegt sich mit Pfeiltasten links/rechts, bleibt im Bildschirm

- [ ] **Schritt 4: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Grundgerüst – Canvas, Spieler, Input, Screens"
git push
```

---

## Task 3: Schießsystem – Auto-Fire, 5 Shot-Level, Laser

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Schuss-Funktion hinzufügen**

In `update()` nach `spielerBewegen()` einfügen:

```js
  schiessenUpdate();
  schuesseUpdate();
```

Neue Funktion:

```js
// ── Schießen (Auto-Fire) ───────────────────────────────────────────────────────
function schiessenUpdate() {
  if (!player) return;

  // Laser-Modus: kein Einzel-Bullet-Spawning nötig (wird direkt gezeichnet)
  if (activePw.laser > 0) return;

  const rate = activePw.fastFire > 0 ? Math.floor(player.shootRate / 2) : player.shootRate;
  player.shootTimer++;
  if (player.shootTimer < rate) return;
  player.shootTimer = 0;

  const lvl = player.shotLevel;
  const px  = player.x;
  const py  = player.y - player.h / 2;

  // Kegel-Winkel je Stufe (in Bogenmass vom vertikalen Zentrum)
  // Stufe 1: 1 Schuss gerade
  // Stufe 2: 2 Schüsse parallel (kein Winkel, versetzt)
  // Stufe 3-5: Kegel mit steigendem Winkel
  const kegelWinkel = [0, 0, 0, 0.28, 0.28, 0.28]; // rad für äußere Schüsse

  if (lvl === 1) {
    bullets.push(schussErstellen(px, py, 0));
  } else if (lvl === 2) {
    bullets.push(schussErstellen(px - 8, py, 0));
    bullets.push(schussErstellen(px + 8, py, 0));
  } else if (lvl === 3) {
    bullets.push(schussErstellen(px, py, 0));
    bullets.push(schussErstellen(px, py, -0.28));
    bullets.push(schussErstellen(px, py,  0.28));
  } else if (lvl === 4) {
    bullets.push(schussErstellen(px - 7, py, 0));
    bullets.push(schussErstellen(px + 7, py, 0));
    bullets.push(schussErstellen(px, py, -0.35));
    bullets.push(schussErstellen(px, py,  0.35));
  } else { // 5
    bullets.push(schussErstellen(px, py, 0));
    bullets.push(schussErstellen(px, py, -0.28));
    bullets.push(schussErstellen(px, py,  0.28));
    bullets.push(schussErstellen(px, py, -0.52));
    bullets.push(schussErstellen(px, py,  0.52));
  }
}

// Schuss-Objekt (Winkel in Bogenmass, 0 = gerade hoch)
function schussErstellen(x, y, winkel) {
  const speed = 12;
  return {
    x, y,
    dx: Math.sin(winkel) * speed,
    dy: -Math.cos(winkel) * speed,
    w: 4, h: 14,
    color: '#3af',
    type: 'player',
  };
}
```

- [ ] **Schritt 2: Schüsse bewegen + zeichnen**

```js
// ── Schüsse bewegen ────────────────────────────────────────────────────────────
function schuesseUpdate() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;
    // Außerhalb Bildschirm: entfernen
    if (b.y < -30 || b.y > CH + 30 || b.x < -30 || b.x > CW + 30) {
      bullets.splice(i, 1);
    }
  }
}
```

In `draw()` nach `spielerZeichnen()`:

```js
  schuesseZeichnen();
  laserZeichnen();
```

```js
// ── Schüsse zeichnen ───────────────────────────────────────────────────────────
function schuesseZeichnen() {
  bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle = b.type === 'player' ? b.color : '#f43f5e';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.dx, -b.dy));
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  });
}

// ── Laser zeichnen (wenn aktiv) ────────────────────────────────────────────────
function laserZeichnen() {
  if (!player || activePw.laser <= 0) return;
  ctx.save();
  ctx.strokeStyle = '#f3a';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#f3a';
  ctx.shadowBlur = 18;
  ctx.globalAlpha = 0.85 + Math.sin(Date.now() * 0.03) * 0.15;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.h / 2);
  ctx.lineTo(player.x, 0);
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Schritt 3: Im Browser testen**

Schiff schießt automatisch einzelne Schüsse nach oben. Schüsse verschwinden am Bildschirmrand.

- [ ] **Schritt 4: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Schießsystem – Auto-Fire, 5 Shot-Level, Laser-Modus"
git push
```

---

## Task 4: Gegner, Formation & Welle 1–5

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Welle spawnen**

Funktion `welleSpawnen()` und Aufruf in `spielStarten()`:

```js
// ── Wellen-Konfiguration ───────────────────────────────────────────────────────
function welleKonfiguration(w) {
  // Anzahl Gegner: Basis 8, +3 pro Welle, max 40 (ohne Boss)
  const anzahl  = Math.min(8 + (w - 1) * 3, 40);
  const speed   = 0.5 + w * 0.12;        // Formation-Grundgeschwindigkeit
  const hp      = w >= 6 ? (w >= 10 ? 3 : 2) : 1;
  const punkte  = hp * 10;
  const istBoss = w % 10 === 0;
  return { anzahl, speed, hp, punkte, istBoss };
}

function welleSpawnen() {
  waveClearing = false;
  bossWave     = false;
  boss         = null;
  enemies      = [];

  const cfg = welleKonfiguration(wave);

  if (cfg.istBoss) {
    bossWave = true;
    bossSpawnen();
    return;
  }

  const cols     = Math.min(cfg.anzahl, 8);
  const rows     = Math.ceil(cfg.anzahl / cols);
  const cellW    = 52;
  const cellH    = 48;
  const startX   = (CW - cols * cellW) / 2 + cellW / 2;
  const startY   = HUD_H + PW_H + 20;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * cols + c >= cfg.anzahl) break;
      const farben = ['#818cf8', '#38bdf8', '#a78bfa', '#34d399', '#fb923c'];
      enemies.push({
        x: startX + c * cellW,
        y: startY + r * cellH,
        w: 28, h: 22,
        hp: cfg.hp, maxHp: cfg.hp,
        points: cfg.punkte,
        color: farben[r % farben.length],
        canShoot: wave >= 6,
        shootTimer: Math.floor(Math.random() * 120),
        shootRate: Math.max(30, 120 - wave * 5),
      });
    }
  }

  formation = {
    dx: 1, dy: 0,
    speed: cfg.speed,
    // Diagonal erst ab Welle 4
    diagonalDy: wave >= 4 ? 0.3 : 0,
    enemies,
  };

  hudAktualisieren();
}
```

In `spielStarten()` ganz am Ende einfügen: `welleSpawnen();`

- [ ] **Schritt 2: Formation bewegen (Bounds-Check)**

In `update()` einfügen:

```js
  formationUpdate();
```

```js
// ── Formation bewegen ──────────────────────────────────────────────────────────
function formationUpdate() {
  if (!formation.enemies.length) return;

  // Bounding Box der gesamten Formation
  let minX = Infinity, maxX = -Infinity;
  formation.enemies.forEach(e => {
    minX = Math.min(minX, e.x - e.w / 2);
    maxX = Math.max(maxX, e.x + e.w / 2);
  });

  // Richtung umkehren wenn Rand erreicht
  if (maxX >= CW - 4 && formation.dx > 0)  { formation.dx = -1; formationSchritt(); }
  if (minX <= 4       && formation.dx < 0)  { formation.dx =  1; formationSchritt(); }

  const moveX = formation.dx * formation.speed;
  // Diagonal (Welle 4+): Y-Versatz pro Frame
  const moveY = formation.diagonalDy * formation.dx * 0.15;

  formation.enemies.forEach(e => {
    e.x += moveX;
    e.y += moveY;
  });
}

// Formation einen Schritt nach unten (klassisches Space-Invaders-Muster)
function formationSchritt() {
  // Nur bei Wellen 1-3 nach unten; bei 4+ diagonal verändert dy
  if (wave <= 3) {
    formation.enemies.forEach(e => { e.y += 20; });
  }
}
```

- [ ] **Schritt 3: Kollision Spieler-Schuss → Gegner**

In `schuesseUpdate()` innerhalb der for-Schleife vor dem Out-of-Bounds-Check:

```js
    // Spieler-Schuss trifft Gegner
    if (b.type === 'player') {
      let getroffen = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (kollision(b.x, b.y, e.x, e.y, e.w, e.h)) {
          e.hp--;
          partikelSpawnen(b.x, b.y, e.color, 5);
          bullets.splice(i, 1);
          if (e.hp <= 0) {
            score += e.points;
            gegnerTod(e, j);
          }
          getroffen = true;
          break;
        }
      }
      if (getroffen) continue;
    }
```

Hilfsfunktionen:

```js
// AABB-Kollision (Mittelpunkt + halbe Breite/Höhe)
function kollision(x1, y1, x2, y2, w, h) {
  return Math.abs(x1 - x2) < (w / 2 + 4) && Math.abs(y1 - y2) < (h / 2 + 4);
}

function gegnerTod(e, idx) {
  partikelSpawnen(e.x, e.y, e.color, 10);
  enemies.splice(idx, 1);
  formation.enemies = enemies;
  // Münzen zufällig fallen lassen
  muenzenSpawnen(e.x, e.y, false);
  // Power-Up zufällig fallen lassen
  if (Math.random() < 0.12) powerupSpawnen(e.x, e.y);
  welleAbgeschlossenPruefen();
}

function welleAbgeschlossenPruefen() {
  if (enemies.length === 0 && !bossWave && !waveClearing) {
    waveClearing = true;
    setTimeout(() => {
      wave++;
      welleSpawnen();
    }, 1800);
  }
}
```

- [ ] **Schritt 4: Gegner zeichnen**

In `draw()`:

```js
  gegnerZeichnen();
```

```js
// ── Gegner zeichnen ────────────────────────────────────────────────────────────
function gegnerZeichnen() {
  enemies.forEach(e => {
    ctx.save();
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    // Alien-Form: kleines UFO/Dreieck nach unten
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.h / 2);
    ctx.lineTo(e.x + e.w / 2, e.y - e.h / 2);
    ctx.lineTo(e.x + e.w * 0.28, e.y - e.h * 0.1);
    ctx.lineTo(e.x - e.w * 0.28, e.y - e.h * 0.1);
    ctx.lineTo(e.x - e.w / 2, e.y - e.h / 2);
    ctx.closePath();
    ctx.fill();
    // HP-Balken (nur wenn hp > 1)
    if (e.maxHp > 1) {
      const bw = e.w;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(e.x - bw/2, e.y + e.h/2 + 3, bw, 3);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - bw/2, e.y + e.h/2 + 3, bw * (e.hp/e.maxHp), 3);
    }
    ctx.restore();
  });
}
```

- [ ] **Schritt 5: Gegner-Schüsse (Welle 6+)**

In `update()` einfügen:

```js
  gegnerSchiessen();
```

```js
// ── Gegner schießen (ab Welle 6) ──────────────────────────────────────────────
function gegnerSchiessen() {
  if (wave < 6) return;
  enemies.forEach(e => {
    e.shootTimer++;
    if (e.shootTimer >= e.shootRate) {
      e.shootTimer = 0;
      bullets.push({
        x: e.x, y: e.y + e.h / 2,
        dx: 0, dy: 5 + wave * 0.1,
        w: 4, h: 10,
        color: '#f43f5e',
        type: 'enemy',
      });
    }
  });
}
```

Kollision Gegner-Schuss → Spieler in `schuesseUpdate()`:

```js
    // Gegner-Schuss trifft Spieler
    if (b.type === 'enemy') {
      if (kollision(b.x, b.y, player.x, player.y, player.w, player.h)) {
        bullets.splice(i, 1);
        if (activePw.shield > 0) continue; // Schild absorbiert
        spielerTreffer();
        continue;
      }
    }
```

```js
function spielerTreffer() {
  lives--;
  partikelSpawnen(player.x, player.y, '#e85d04', 14);
  hudAktualisieren();
  if (lives <= 0) spielEnde();
}
```

- [ ] **Schritt 6: Im Browser testen**

Welle 1 erscheint: Gegner stehen still, Spieler kann sie abschießen. Neue Welle spawnt nach 1,8s. Ab Welle 2 bewegt sich die Formation. Ab Welle 4 diagonal. Ab Welle 6 schießen Gegner zurück.

- [ ] **Schritt 7: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Gegner-Formation, Wellen 1-5 Bewegung, Schuss-Kollision, Welle 6+ Gegner schießen"
git push
```

---

## Task 5: Boss (jede 10. Welle)

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Boss spawnen**

```js
// ── Boss ───────────────────────────────────────────────────────────────────────
function bossSpawnen() {
  const bossNr = wave / 10;           // 1. Boss, 2. Boss usw.
  const hp     = 20 + bossNr * 15;
  boss = {
    x: CW / 2,
    y: HUD_H + PW_H + 70,
    w: 80 + bossNr * 8,
    h: 60 + bossNr * 5,
    hp, maxHp: hp,
    speed: 1.2 + bossNr * 0.4,
    dx: 1,
    shootTimer: 0,
    shootRate: Math.max(30, 90 - bossNr * 10),
    color: `hsl(${bossNr * 40 + 10}, 90%, 55%)`,
    alive: true,
    phase: 1,
  };
  hudAktualisieren();
}
```

- [ ] **Schritt 2: Boss-Update**

In `update()`:

```js
  if (bossWave && boss?.alive) bossUpdate();
```

```js
function bossUpdate() {
  // Bewegung (links-rechts)
  boss.x += boss.dx * boss.speed;
  if (boss.x + boss.w / 2 >= CW - 10) { boss.dx = -1; }
  if (boss.x - boss.w / 2 <= 10)      { boss.dx =  1; }

  // Phase-Wechsel bei 50% HP (schneller + häufiger schießen)
  if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) {
    boss.phase = 2;
    boss.speed *= 1.5;
    boss.shootRate = Math.max(20, boss.shootRate - 20);
  }

  // Schießen
  boss.shootTimer++;
  if (boss.shootTimer >= boss.shootRate) {
    boss.shootTimer = 0;
    // 3-Weg-Schuss ab Phase 2
    if (boss.phase === 2) {
      bullets.push({ x: boss.x, y: boss.y + boss.h/2, dx: -1.5, dy: 5, w: 5, h: 12, color: boss.color, type: 'enemy' });
      bullets.push({ x: boss.x, y: boss.y + boss.h/2, dx: 0,    dy: 6, w: 5, h: 12, color: boss.color, type: 'enemy' });
      bullets.push({ x: boss.x, y: boss.y + boss.h/2, dx:  1.5, dy: 5, w: 5, h: 12, color: boss.color, type: 'enemy' });
    } else {
      bullets.push({ x: boss.x, y: boss.y + boss.h/2, dx: 0, dy: 6, w: 5, h: 12, color: boss.color, type: 'enemy' });
    }
  }
}
```

- [ ] **Schritt 3: Boss-Treffer-Kollision**

In `schuesseUpdate()` nach Gegner-Kollision (innerhalb `b.type === 'player'`):

```js
      // Spieler-Schuss trifft Boss
      if (!getroffen && bossWave && boss?.alive) {
        if (kollision(b.x, b.y, boss.x, boss.y, boss.w, boss.h)) {
          boss.hp--;
          partikelSpawnen(b.x, b.y, boss.color, 4);
          bullets.splice(i, 1);
          if (boss.hp <= 0) bossTod();
          continue;
        }
      }
```

- [ ] **Schritt 4: Boss-Tod + Sieg-Animation**

```js
function bossTod() {
  boss.alive = false;
  bossDeathAnim = 90;   // 1,5 Sekunden Animation
  partikelSpawnen(boss.x, boss.y, boss.color, 40);
  // Münzen: 20–40
  const anzahl = 20 + Math.floor(Math.random() * 21);
  for (let i = 0; i < anzahl; i++) {
    coins.push({
      x: boss.x + (Math.random() - 0.5) * boss.w,
      y: boss.y,
      vy: 1 + Math.random() * 1.5,
      value: 1,
    });
  }
  score += 500 + (wave / 10) * 200;
  setTimeout(() => {
    wave++;
    welleSpawnen();
  }, 2200);
}
```

In `update()`:

```js
  if (bossDeathAnim > 0) {
    bossDeathAnim--;
    if (bossDeathAnim % 8 === 0)
      partikelSpawnen(
        boss.x + (Math.random() - 0.5) * boss.w,
        boss.y + (Math.random() - 0.5) * boss.h,
        boss.color, 6
      );
  }
```

- [ ] **Schritt 5: Boss zeichnen**

In `draw()`:

```js
  if (bossWave) bossZeichnen();
```

```js
function bossZeichnen() {
  if (!boss) return;
  // Sieg-Blinken
  if (!boss.alive) {
    if (bossDeathAnim % 6 < 3) return;
  }
  const { x, y, w, h, hp, maxHp, color } = boss;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;

  // Boss-Körper (6-Eck / Hexagon-Form)
  ctx.beginPath();
  ctx.moveTo(x,         y - h/2);
  ctx.lineTo(x + w/2,   y - h/4);
  ctx.lineTo(x + w/2,   y + h/4);
  ctx.lineTo(x,         y + h/2);
  ctx.lineTo(x - w/2,   y + h/4);
  ctx.lineTo(x - w/2,   y - h/4);
  ctx.closePath();
  ctx.fill();

  // Inneres Auge
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.beginPath();
  ctx.arc(x, y, w * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // HP-Leiste (oben)
  const barY  = HUD_H + PW_H + 5;
  const barW  = CW * 0.6;
  const barX  = (CW - barW) / 2;
  ctx.fillStyle = 'rgba(0,0,0,.5)';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.fillStyle = color;
  ctx.shadowBlur = 6;
  ctx.fillRect(barX, barY, barW * (hp / maxHp), 8);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.font = '700 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`BOSS  ${hp} / ${maxHp}`, CW / 2, barY - 3);

  ctx.restore();
}
```

- [ ] **Schritt 6: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Boss-System – jede 10. Welle, HP-Balken, Phase 2, Sieg-Animation, Münzen-Drop"
git push
```

---

## Task 6: Power-Up System – Alle 8 Typen, Stacking, Timer-HUD

**Files:**
- Modify: `games/space-blaster/game.js`
- Modify: `games/space-blaster/style.css` (Power-Up-Timer-Farben)

- [ ] **Schritt 1: Power-Up spawnen & bewegen**

```js
// ── Power-Ups ──────────────────────────────────────────────────────────────────
const PW_CONFIG = {
  shot2:    { label: '×2 Schuss',   color: '#38bdf8', shotLevel: 2 },
  shot3:    { label: '×3 Schuss',   color: '#818cf8', shotLevel: 3 },
  shot4:    { label: '×4 Schuss',   color: '#a78bfa', shotLevel: 4 },
  shot5:    { label: '×5 Schuss',   color: '#e879f9', shotLevel: 5 },
  fastfire: { label: '⚡ Schnell',   color: '#fbbf24' },
  laser:    { label: '🔴 Laser',    color: '#f472b6' },
  shield:   { label: '◈ Schild',    color: '#34d399' },
  heart:    { label: '❤ Leben',     color: '#f43f5e' },
};

// Gewichtete Zufallsauswahl
const PW_POOL = [
  'shot2','shot2','shot3','shot3','shot4','shot5',
  'fastfire','fastfire','laser','shield','shield','heart',
];

function powerupSpawnen(x, y) {
  const type = PW_POOL[Math.floor(Math.random() * PW_POOL.length)];
  const cfg  = PW_CONFIG[type];
  powerups.push({ x, y, vy: 1.5, type, color: cfg.color, label: cfg.label });
}

function powerupsUpdate() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += p.vy;
    if (p.y > CH + 20) { powerups.splice(i, 1); continue; }
    // Spieler sammelt ein
    if (kollision(p.x, p.y, player.x, player.y, 36, 36)) {
      powerupAktivieren(p.type);
      powerups.splice(i, 1);
    }
  }
}
```

- [ ] **Schritt 2: Power-Up aktivieren**

```js
function pwDauer() {
  const bonus = UPGRADE_DEFS.pwDuration[pdata.upgrades.pwDuration - 1]?.bonus || 0;
  return PW_BASE_DURATION + bonus;
}

function powerupAktivieren(type) {
  if (type.startsWith('shot')) {
    // Shot-Level nur erhöhen, nie senken
    const lvl = PW_CONFIG[type].shotLevel;
    if (lvl > player.shotLevel) player.shotLevel = lvl;
  } else if (type === 'fastfire') {
    activePw.fastFire = pwDauer();
  } else if (type === 'laser') {
    activePw.laser = pwDauer();
  } else if (type === 'shield') {
    activePw.shield = pwDauer();
  } else if (type === 'heart') {
    lives++;
    hudAktualisieren();
  }
}
```

- [ ] **Schritt 3: Zeitliche Power-Ups heruntertickern**

In `update()`:

```js
  powerupsUpdate();
  pwTimerUpdate();
```

```js
function pwTimerUpdate() {
  if (activePw.fastFire > 0) activePw.fastFire--;
  if (activePw.laser    > 0) activePw.laser--;
  if (activePw.shield   > 0) activePw.shield--;
  // Laser: Treffer-Check läuft durch laserTrefferCheck()
  if (activePw.laser > 0) laserTrefferCheck();
  pwTimerHudAktualisieren();
}

// Laser trifft alle Gegner/Boss in einer senkrechten Linie
function laserTrefferCheck() {
  if (!player || activePw.laser <= 0) return;
  // Nur jeden 3. Frame (Performance)
  if (activePw.laser % 3 !== 0) return;
  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    if (Math.abs(e.x - player.x) < e.w / 2 + 6) {
      e.hp -= 0.5;
      partikelSpawnen(e.x, e.y, e.color, 2);
      if (e.hp <= 0) gegnerTod(e, j);
    }
  }
  if (bossWave && boss?.alive && Math.abs(boss.x - player.x) < boss.w / 2 + 8) {
    boss.hp -= 0.5;
    if (boss.hp <= 0) bossTod();
  }
}
```

- [ ] **Schritt 4: Power-Up-Timer im HUD**

```js
function pwTimerHudAktualisieren() {
  const container = document.getElementById('pw-timers');
  if (!container) return;
  const gesamtDauer = pwDauer();
  let html = '';

  if (activePw.fastFire > 0) {
    const pct = (activePw.fastFire / gesamtDauer * 100).toFixed(1);
    html += pwTimerHTML('⚡ Schnell', '#fbbf24', pct, Math.ceil(activePw.fastFire / FPS_TARGET));
  }
  if (activePw.laser > 0) {
    const pct = (activePw.laser / gesamtDauer * 100).toFixed(1);
    html += pwTimerHTML('🔴 Laser', '#f472b6', pct, Math.ceil(activePw.laser / FPS_TARGET));
  }
  if (activePw.shield > 0) {
    const pct = (activePw.shield / gesamtDauer * 100).toFixed(1);
    html += pwTimerHTML('◈ Schild', '#34d399', pct, Math.ceil(activePw.shield / FPS_TARGET));
  }
  container.innerHTML = html;
}

function pwTimerHTML(label, color, pct, sek) {
  return `<div class="pw-timer-item">
    <span class="pw-timer-label">${label} ${sek}s</span>
    <div class="pw-timer-bar-wrap">
      <div class="pw-timer-bar" style="width:${pct}%;background:${color}"></div>
    </div>
  </div>`;
}
```

- [ ] **Schritt 5: Power-Ups zeichnen**

In `draw()`:

```js
  powerupsZeichnen();
```

```js
function powerupsZeichnen() {
  powerups.forEach(p => {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 8px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(p.label.slice(0, 3), p.x, p.y);
    ctx.restore();
  });
}
```

- [ ] **Schritt 6: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Power-Up System – 8 Typen, Shot-Stacking, Timer-HUD, Laser-Schaden"
git push
```

---

## Task 7: Münzen-System + Partikel + HUD komplett

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Münzen spawnen & einsammeln**

```js
// ── Münzen ─────────────────────────────────────────────────────────────────────
function muenzenSpawnen(x, y, istBoss) {
  if (istBoss) return; // Boss-Münzen in bossTod() separat
  const waveStark = wave >= 6;
  const chance    = waveStark ? 0.35 : 0.08;
  if (Math.random() > chance) return;
  const value = waveStark && Math.random() < 0.4 ? (Math.random() < 0.5 ? 2 : 3) : 1;
  coins.push({ x, y, vy: 1.2 + Math.random() * 0.6, value });
}

function muenzenUpdate() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.y += c.vy;
    if (c.y > CH + 20) { coins.splice(i, 1); continue; }
    if (kollision(c.x, c.y, player.x, player.y, 28, 28)) {
      gameCoins += c.value;
      coins.splice(i, 1);
      hudAktualisieren();
    }
  }
}
```

In `update()`: `muenzenUpdate();`

- [ ] **Schritt 2: Partikel-System**

```js
// ── Partikel ────────────────────────────────────────────────────────────────────
function partikelSpawnen(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1,
      color,
      r: 2 + Math.random() * 2,
    });
  }
}

function partikelUpdate() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vx   *= 0.9;
    p.vy   *= 0.9;
    p.life -= 0.04;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
```

In `update()`: `partikelUpdate();`

In `draw()`:

```js
  partikelZeichnen();
  muenzenZeichnen();
```

```js
function partikelZeichnen() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function muenzenZeichnen() {
  coins.forEach(c => {
    ctx.save();
    ctx.fillStyle = '#ffd600';
    ctx.shadowColor = '#ffd600';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff9';
    ctx.font = '700 7px Nunito';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.value > 1 ? c.value : '', c.x, c.y);
    ctx.restore();
  });
}
```

- [ ] **Schritt 3: HUD vollständig aktualisieren**

```js
// ── HUD ───────────────────────────────────────────────────────────────────────
function hudAktualisieren() {
  const score_el = document.getElementById('hud-score');
  const wave_el  = document.getElementById('hud-wave');
  const coins_el = document.getElementById('hud-coins');
  const lives_el = document.getElementById('hud-lives-icons');
  if (score_el) score_el.textContent = score;
  if (wave_el)  wave_el.textContent  = wave;
  if (coins_el) coins_el.textContent = gameCoins;

  // Leben-Symbole (Raumschiff-Icon als SVG-Clip)
  if (lives_el) {
    let html = '';
    for (let i = 0; i < Math.max(lives, 0); i++) {
      html += `<svg class="life-icon" viewBox="0 0 14 14" fill="none">
        <polygon points="7,1 12,13 9,10 5,10 2,13" fill="#3af"/>
      </svg>`;
    }
    lives_el.innerHTML = html;
  }
}
```

- [ ] **Schritt 4: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Münzen-System, Partikel-Effekte, vollständiger HUD"
git push
```

---

## Task 8: Game Over + Supabase Leaderboard

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: spielEnde() implementieren**

```js
// ── Spiel beenden ──────────────────────────────────────────────────────────────
async function spielEnde() {
  running = false;
  if (loopId) cancelAnimationFrame(loopId);

  // Münzen permanent speichern
  pdata.coins += gameCoins;

  // Supabase: Score + Münzen speichern
  const user = await PZ.getUser().catch(() => null);
  const loginHint = document.getElementById('go-login-hint');
  if (user) {
    if (loginHint) loginHint.style.display = 'none';
    spielerDatenSpeichern();
  } else {
    if (loginHint) loginHint.style.display = 'block';
  }

  // Game-Over-Screen befüllen
  document.getElementById('res-score').textContent  = score;
  document.getElementById('res-wave').textContent   = wave;
  document.getElementById('res-coins').textContent  = gameCoins;
  document.getElementById('go-wave').textContent    = `Welle ${wave} erreicht`;

  screenZeigen('screen-gameover');
}
```

- [ ] **Schritt 2: Rangliste laden & anzeigen**

```js
// ── Rangliste ──────────────────────────────────────────────────────────────────
async function rangliste_zeigen() {
  screenZeigen('screen-lb');
  const content = document.getElementById('lb-content');
  content.innerHTML = '<p style="text-align:center;color:#90a4ae;padding:1rem">Lade…</p>';

  try {
    const eintraege = await PZ.getLeaderboard('space-blaster', 10);
    content.innerHTML = ranglisteHTML(eintraege);
  } catch (_) {
    content.innerHTML = '<p style="text-align:center;color:#90a4ae;padding:1rem">Konnte nicht geladen werden.</p>';
  }
}

function ranglisteHTML(lb) {
  if (!lb?.length) return '<p class="lb-empty">Noch keine Einträge</p>';
  const medalien = ['🥇','🥈','🥉'];
  const klassen  = ['g','s','b'];
  let h = `<table class="lb-table">
    <thead><tr><th>#</th><th>Name</th><th>Punkte</th><th>Welle</th></tr></thead>
    <tbody>`;
  lb.forEach((e, i) => {
    const rang = medalien[i] || (i + 1);
    const cls  = klassen[i]  || '';
    h += `<tr>
      <td class="lb-rank ${cls}">${rang}</td>
      <td class="lb-name">${esc(e.benutzername || '?')}</td>
      <td class="lb-score">${e.punkte || 0}</td>
      <td class="lb-wave">W${e.level || 1}</td>
    </tr>`;
  });
  return h + '</tbody></table>';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
```

- [ ] **Schritt 3: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Game Over Screen, Supabase Score + Münzen speichern, Rangliste"
git push
```

---

## Task 9: Permanente Upgrades – Shop

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Shop anzeigen & befüllen**

```js
// ── Shop ───────────────────────────────────────────────────────────────────────
function shop_zeigen() {
  screenZeigen('screen-shop');
  shopRendern();
}

function shopRendern() {
  const coinsEl = document.getElementById('shop-coins');
  if (coinsEl) coinsEl.textContent = pdata.coins;

  // Power-Up Dauer
  const pwGrid = document.getElementById('shop-pw-duration');
  if (pwGrid) pwGrid.innerHTML = shopKartenHTML('pwDuration', '⏱', UPGRADE_DEFS.pwDuration);

  // Max Leben
  const livesGrid = document.getElementById('shop-max-lives');
  if (livesGrid) livesGrid.innerHTML = shopKartenHTML('maxLives', '❤', UPGRADE_DEFS.maxLives);
}

function shopKartenHTML(key, icon, stufen) {
  const aktuell = pdata.upgrades[key] || 0;
  return stufen.map((s, i) => {
    const gekauft  = i < aktuell;
    const aktiv    = i === aktuell;
    const gesperrt = i > aktuell;
    const klass    = gekauft ? 'owned' : gesperrt ? 'maxed' : '';
    const btnText  = gekauft ? '✓ Gekauft' : `🪙 ${s.cost}`;
    const btnKlass = (gekauft || gesperrt) ? 'done' : 'buy';
    const disabled = (gekauft || gesperrt) ? 'disabled' : '';
    return `<div class="shop-card ${klass}">
      <div class="shop-card-icon">${icon}</div>
      <div class="shop-card-info">
        <div class="shop-card-name">Stufe ${i + 1}: ${s.label}</div>
        <div class="shop-card-desc">${gekauft ? 'Bereits gekauft' : gesperrt ? 'Vorherige Stufe kaufen' : `${pdata.coins} Münzen verfügbar`}</div>
      </div>
      <button class="shop-card-btn ${btnKlass}" ${disabled}
        onclick="upgradeKaufen('${key}',${i})">${btnText}</button>
    </div>`;
  }).join('');
}
```

- [ ] **Schritt 2: Upgrade kaufen**

```js
async function upgradeKaufen(key, stufe) {
  const def    = UPGRADE_DEFS[key][stufe];
  const aktuell = pdata.upgrades[key] || 0;

  // Prüfungen
  if (stufe !== aktuell)       return; // Muss nächste Stufe sein
  if (pdata.coins < def.cost)  return; // Zu wenig Münzen

  pdata.coins -= def.cost;
  pdata.upgrades[key] = stufe + 1;

  // Sofort in Supabase speichern
  await spielerDatenSpeichern();

  shopRendern();
  // Titel-Münzanzeige aktualisieren
  const titleCoins = document.getElementById('title-coins');
  if (titleCoins) titleCoins.textContent = pdata.coins;
}
```

- [ ] **Schritt 3: Upgrades bei Spielstart anwenden**

Am Anfang von `spielStarten()` sind die Lives bereits korrekt mit `pdata.upgrades.maxLives`.
Power-Up-Dauer wird via `pwDauer()` dynamisch berechnet – keine weitere Änderung nötig.

- [ ] **Schritt 4: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Permanenter Upgrade-Shop – Power-Up-Dauer und Max-Leben, Supabase-Persistenz"
git push
```

---

## Task 10: Wellen-Banner, Wave-Clear-Anzeige, Mobile-Polish

**Files:**
- Modify: `games/space-blaster/game.js`

- [ ] **Schritt 1: Wellen-Banner auf Canvas**

In `draw()` nach allen anderen Elementen:

```js
  wellenbanner_zeigen();
```

```js
// ── Wellen-Banner ──────────────────────────────────────────────────────────────
let bannerTimer = 0;
let bannerText  = '';

function bannerZeigen(text, frames) {
  bannerText  = text;
  bannerTimer = frames;
}

function wellenbanner_zeigen() {
  if (bannerTimer <= 0) return;
  bannerTimer--;
  const alpha = Math.min(1, bannerTimer / 20);  // Fade-out
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,.6)';
  ctx.fillRect(0, CH / 2 - 28, CW, 56);
  ctx.fillStyle = '#3af';
  ctx.font = `900 clamp(1.4rem, 4vw, 2rem) Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#3af';
  ctx.shadowBlur = 16;
  ctx.fillText(bannerText, CW / 2, CH / 2);
  ctx.restore();
}
```

In `welleSpawnen()` am Anfang einfügen:

```js
  bannerZeigen(`WELLE ${wave}`, 90);
```

In `bossTod()` einfügen:

```js
  bannerZeigen('BOSS BESIEGT!', 120);
```

- [ ] **Schritt 2: Gegner berühren Boden → Leben verlieren**

In `update()`:

```js
  boden_check();
```

```js
function boden_check() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.y + e.h / 2 > CH) {
      enemies.splice(i, 1);
      formation.enemies = enemies;
      spielerTreffer();
    }
  }
}
```

- [ ] **Schritt 3: Touch-Anzeige (Mobile – linke/rechte Hälfte)**

In `draw()` ganz am Anfang (hinter Sternenhintergrund):

```js
  // Mobile-Hinweis: halbe Bildschirmhälften leicht hervorheben
  if (touchX !== null) {
    ctx.fillStyle = 'rgba(255,255,255,.03)';
    ctx.fillRect(touchX < CW/2 ? 0 : CW/2, 0, CW/2, CH);
  }
```

- [ ] **Schritt 4: Schuss-Level-Anzeige im HUD**

In `hudAktualisieren()` hinzufügen (nach lives-icons):

```js
  // Shot-Level-Anzeige im HUD (optional, kleiner Text unterm Score)
  const scoreEl = document.getElementById('hud-score');
  if (scoreEl && player) {
    scoreEl.title = `Schuss-Stufe: ${player.shotLevel}`;
  }
```

Besser: Anzeige als Canvas-Text über dem Spieler:

In `draw()` nach `spielerZeichnen()`:

```js
  // Shot-Level-Anzeige über dem Spieler
  if (player && player.shotLevel > 1) {
    ctx.save();
    ctx.fillStyle = 'rgba(58,170,255,.8)';
    ctx.font = '700 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`×${player.shotLevel}`, player.x, player.y - player.h / 2 - 6);
    ctx.restore();
  }
```

- [ ] **Schritt 5: Commit**

```bash
git add games/space-blaster/game.js
git commit -m "Space Blaster: Wellen-Banner, Boden-Check, Mobile Touch-Feedback, Shot-Level-Anzeige"
git push
```

---

## Spec-Abgleich

| Anforderung | Task |
|---|---|
| Vollbild-Canvas | Task 2 |
| Spieler links/rechts, Auto-Schuss | Task 2+3 |
| 3 Startleben, erhöhbar per Upgrade | Task 2+9 |
| Welle 1: statisch | Task 4 |
| Welle 2–3: links/rechts | Task 4 |
| Welle 4–5: diagonal | Task 4 |
| Welle 6+: Gegner schießen, Frequenz steigt | Task 4 |
| Gegner nie außerhalb Spielfeld | Task 4 (Formation-Bounds) |
| Boss alle 10 Wellen | Task 5 |
| Boss-HP-Balken sichtbar | Task 5 |
| Boss Phase 2 (schneller, mehr Schüsse) | Task 5 |
| Boss-Sieg-Animation | Task 5 |
| Power-Up: Doppel/Dreifach/Vierfach/Fünffach-Schuss | Task 6 |
| Shot-Stacking | Task 6 |
| Fast-Fire (zeitlich, Timer) | Task 6 |
| Laser (zeitlich, Timer) | Task 6 |
| Schild 10s (zeitlich, Timer) | Task 6 |
| Herz (+1 Leben, >3 möglich) | Task 6 |
| Sofortiges Ablaufen ohne Vorwarnung | Task 6 (pwTimerUpdate) |
| HUD: Punkte, Welle, Leben-Symbole, Münzen | Task 7 |
| HUD: Power-Up-Timer als Balken | Task 6 |
| Münzen von Gegnern | Task 7 |
| Münzen: Häufigkeit nach Welle | Task 7 |
| Boss: 20–40 Münzen garantiert | Task 5 |
| Münzen permanent Supabase | Task 8+9 |
| Shop: Power-Up-Dauer 3 Stufen | Task 9 |
| Shop: Max-Leben 3 Stufen | Task 9 |
| Shop nach Game Over erreichbar | Task 1 (HTML) |
| Game Over: Punkte, Welle, Münzen | Task 8 |
| Rangliste: Platz, Name, Punkte, Welle | Task 8 |
| Login-Hinweis wenn nicht angemeldet | Task 8 |
| requestAnimationFrame Loop | Task 2 |
| Kein Framework | ✓ überall |
