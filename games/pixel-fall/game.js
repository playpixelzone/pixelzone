'use strict';

// ══════════════════════════════════════════════════════
//  PIXEL FALL — 1. KONSTANTEN
// ══════════════════════════════════════════════════════
const ZEILEN_HOEHE    = 40;
const SPIELER_GROESSE = 16;
const SPIELER_Y_RATIO = 0.35;
const COIN_RADIUS     = 6;
const COIN_CHANCE     = 0.15;
const TRAIL_LENGTH    = 12;
const SPIEL_NAME      = 'pixel-fall';

const SKINS = {
  'default':           { name: 'Default',       quelle: 'standard',    seltenheit: null,           effekt: 'keins'          },
  'neon-glow':         { name: 'Neon Glow',      quelle: 'meilenstein', seltenheit: 'meilenstein',  effekt: 'aura-cyan',     meilenstein: 25  },
  'fire-trail':        { name: 'Fire Trail',     quelle: 'meilenstein', seltenheit: 'meilenstein',  effekt: 'trail-feuer',   meilenstein: 50  },
  'storm':             { name: 'Storm',           quelle: 'meilenstein', seltenheit: 'meilenstein',  effekt: 'blitze',        meilenstein: 100 },
  'galaxy':            { name: 'Galaxy',          quelle: 'meilenstein', seltenheit: 'meilenstein',  effekt: 'galaxy',        meilenstein: 200 },
  'god-mode':          { name: 'God Mode',        quelle: 'meilenstein', seltenheit: 'meilenstein',  effekt: 'god',           meilenstein: 500 },
  'common-stardust':   { name: 'Stardust',        quelle: 'lootbox',     seltenheit: 'common',       effekt: 'partikel-weiss' },
  'common-sparkle':    { name: 'Sparkle',         quelle: 'lootbox',     seltenheit: 'common',       effekt: 'partikel-gelb'  },
  'common-bubbles':    { name: 'Bubbles',         quelle: 'lootbox',     seltenheit: 'common',       effekt: 'partikel-blau'  },
  'common-leaves':     { name: 'Leaves',          quelle: 'lootbox',     seltenheit: 'common',       effekt: 'partikel-gruen' },
  'rare-blue-trail':   { name: 'Blue Trail',      quelle: 'lootbox',     seltenheit: 'rare',         effekt: 'trail-blau'     },
  'rare-green-trail':  { name: 'Green Trail',     quelle: 'lootbox',     seltenheit: 'rare',         effekt: 'trail-gruen'    },
  'rare-purple-trail': { name: 'Purple Trail',    quelle: 'lootbox',     seltenheit: 'rare',         effekt: 'trail-lila'     },
  'epic-inferno':      { name: 'Inferno',         quelle: 'lootbox',     seltenheit: 'epic',         effekt: 'partikel-feuer' },
  'epic-blizzard':     { name: 'Blizzard',        quelle: 'lootbox',     seltenheit: 'epic',         effekt: 'partikel-eis'   },
  'legendary-prism':   { name: 'Prism',           quelle: 'lootbox',     seltenheit: 'legendary',    effekt: 'prism'          },
};

const MEILENSTEIN_SKINS = [
  { score: 25,  id: 'neon-glow'  },
  { score: 50,  id: 'fire-trail' },
  { score: 100, id: 'storm'      },
  { score: 200, id: 'galaxy'     },
  { score: 500, id: 'god-mode'   },
];

const LOOTBOX_POOL = {
  common:    ['common-stardust','common-sparkle','common-bubbles','common-leaves'],
  rare:      ['rare-blue-trail','rare-green-trail','rare-purple-trail'],
  epic:      ['epic-inferno','epic-blizzard'],
  legendary: ['legendary-prism'],
};

// ══════════════════════════════════════════════════════
//  2. SPIELZUSTAND
// ══════════════════════════════════════════════════════
let canvas, ctx, CW, CH;
let animFrameId      = null;
let running          = false;
let score            = 0;
let gameCoins        = 0;
let scrollOffset     = 0;
let zeit             = 0;
let letzterTimestamp = 0;
let freigeschaltetDieserRun = [];

const spieler = { x: 0, targetX: 0 };
let trail     = [];
let zeilen    = [];
let letzteGapX = 0;
let coinItems  = [];
let partikel   = [];

// ══════════════════════════════════════════════════════
//  3. SPIELERDATEN
// ══════════════════════════════════════════════════════
let pdata = {
  coins: 0,
  active_skin: 'default',
  unlocked_skins: ['default'],
  best_score: 0,
};
let currentUsername = null;
const LS_KEY = 'pixelfall_pdata';

async function spielerDatenLaden() {
  const cached = localStorage.getItem(LS_KEY);
  if (cached) { try { Object.assign(pdata, JSON.parse(cached)); } catch(e) {} }

  const data = await PZ.loadScore(SPIEL_NAME);
  if (data) {
    pdata.best_score = data.punkte || 0;
    if (data.extra_daten) {
      pdata.coins          = data.extra_daten.coins          ?? pdata.coins;
      pdata.active_skin    = data.extra_daten.active_skin    ?? pdata.active_skin;
      pdata.unlocked_skins = data.extra_daten.unlocked_skins ?? pdata.unlocked_skins;
    }
  }
  if (!pdata.unlocked_skins.includes('default')) pdata.unlocked_skins.unshift('default');
  localStorage.setItem(LS_KEY, JSON.stringify(pdata));
}

async function spielerDatenSpeichern(runScore, runCoins) {
  pdata.coins += runCoins;
  const extraDaten = {
    coins:          pdata.coins,
    active_skin:    pdata.active_skin,
    unlocked_skins: pdata.unlocked_skins,
  };
  const { isNewRecord } = await PZ.saveGameData(SPIEL_NAME, runScore, 1, extraDaten);
  if (isNewRecord) pdata.best_score = runScore;
  localStorage.setItem(LS_KEY, JSON.stringify(pdata));
  return { isNewRecord };
}

async function meilensteinFreischalten(skinId) {
  if (pdata.unlocked_skins.includes(skinId)) return;
  pdata.unlocked_skins.push(skinId);
  const extraDaten = {
    coins:          pdata.coins,
    active_skin:    pdata.active_skin,
    unlocked_skins: pdata.unlocked_skins,
  };
  await PZ.saveGameData(SPIEL_NAME, pdata.best_score, 1, extraDaten);
  localStorage.setItem(LS_KEY, JSON.stringify(pdata));
}

function meilensteinPruefen(neuerScore) {
  for (const m of MEILENSTEIN_SKINS) {
    if (neuerScore >= m.score
        && !pdata.unlocked_skins.includes(m.id)
        && !freigeschaltetDieserRun.includes(m.id)) {
      freigeschaltetDieserRun.push(m.id);
      meilensteinFreischalten(m.id).catch(err => console.error('Skin-Speichern fehlgeschlagen:', err));
      bannerZeigen(`🏆 Skin freigeschaltet: ${SKINS[m.id].name}!`);
    }
  }
}

// ══════════════════════════════════════════════════════
//  4. ENGINE
// ══════════════════════════════════════════════════════
function canvasGroesseAnpassen() {
  CW = canvas.width  = window.innerWidth;
  CH = canvas.height = window.innerHeight;
}

function spielStarten() {
  score        = 0;
  gameCoins    = 0;
  scrollOffset = 0;
  zeit         = 0;
  trail        = [];
  partikel     = [];
  coinItems    = [];
  freigeschaltetDieserRun = [];

  spieler.x       = CW / 2 - SPIELER_GROESSE / 2;
  spieler.targetX = spieler.x;

  tunnelInitialisieren();
  zeigeScreen('screen-game');
  document.getElementById('screen-game').classList.remove('hud-danger');
  hudAktualisieren();

  running = true;
  letzterTimestamp = 0;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
}

function spielEnde() {
  running = false;
  cancelAnimationFrame(animFrameId);

  const runScore = score;
  const runCoins = gameCoins;

  spielerDatenSpeichern(runScore, runCoins)
    .then(({ isNewRecord }) => {
      document.getElementById('gameover-score').textContent  = runScore;
      document.getElementById('gameover-coins').textContent  = `+${runCoins}`;
      document.getElementById('menu-best-score').textContent = pdata.best_score;
      document.getElementById('menu-coins').textContent      = pdata.coins;

      const badge = document.getElementById('gameover-highscore-badge');
      if (isNewRecord) badge.classList.remove('versteckt');
      else             badge.classList.add('versteckt');

      zeigeScreen('screen-gameover');
    })
    .catch(() => {
      document.getElementById('gameover-score').textContent = runScore;
      document.getElementById('gameover-coins').textContent = `+${runCoins}`;
      zeigeScreen('screen-gameover');
    });
}

function gameLoop(timestamp) {
  if (!running) return;

  if (!letzterTimestamp) letzterTimestamp = timestamp;
  let dt = (timestamp - letzterTimestamp) / 1000;
  letzterTimestamp = timestamp;
  if (dt > 0.05) dt = 0.05;

  zeit += dt;

  const speed = Math.min(180 + Math.log(score + 1) * 30, 600);
  scrollOffset += speed * dt;

  const neuerScore = Math.floor(scrollOffset / ZEILEN_HOEHE);
  if (neuerScore !== score) {
    score = neuerScore;
    meilensteinPruefen(score);
    hudAktualisieren();
  }

  spieler.x += (spieler.targetX - spieler.x) * 0.18;

  trail.unshift({ x: spieler.x + SPIELER_GROESSE / 2, y: CH * SPIELER_Y_RATIO + SPIELER_GROESSE / 2 });
  if (trail.length > TRAIL_LENGTH) trail.pop();

  zeilenAktualisieren();
  coinsAktualisieren();
  partikelAktualisieren(dt);

  if (kollisionPruefen()) { spielEnde(); return; }

  ctx.clearRect(0, 0, CW, CH);
  tunnelZeichnen();
  coinsZeichnen();
  skinEffektVorCharakter(dt);
  spielerZeichnen();
  skinEffektNachCharakter(dt);
  partikelZeichnen();

  animFrameId = requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════
//  5. TUNNEL-GENERIERUNG
// ══════════════════════════════════════════════════════
function tunnelInitialisieren() {
  zeilen    = [];
  coinItems = [];
  letzteGapX = CW / 2;
  const anzahl = Math.ceil(CH / ZEILEN_HOEHE) + 5;
  for (let i = 0; i < anzahl; i++) {
    zeilen.push(zeileBauen(i * ZEILEN_HOEHE));
  }
}

function gapBreiteBerechnen() {
  return Math.max(80, 260 - score * 0.5);
}

function zeileBauen(worldY) {
  letzteGapX += (Math.random() - 0.5) * 60;
  const gb   = gapBreiteBerechnen();
  const minX = 60 + gb / 2;
  const maxX = CW - 60 - gb / 2;
  letzteGapX = Math.max(minX, Math.min(maxX, letzteGapX));

  const leftX  = letzteGapX - gb / 2;
  const rightX = letzteGapX + gb / 2;

  let hindernis = null;
  if (score >= 10) hindernis = hindernisGenerieren(leftX, rightX, worldY);

  if (!hindernis && Math.random() < COIN_CHANCE) {
    coinItems.push({
      x:         leftX + Math.random() * (rightX - leftX),
      worldY:    worldY + ZEILEN_HOEHE / 2,
      gesammelt: false,
    });
  }

  return { worldY, leftX, rightX, hindernis };
}

function zeilenAktualisieren() {
  while (zeilen.length && (zeilen[0].worldY - scrollOffset) < -ZEILEN_HOEHE) {
    zeilen.shift();
  }
  while (!zeilen.length || (zeilen[zeilen.length - 1].worldY - scrollOffset) < CH + ZEILEN_HOEHE * 2) {
    const naechsteY = zeilen.length ? zeilen[zeilen.length - 1].worldY + ZEILEN_HOEHE : 0;
    zeilen.push(zeileBauen(naechsteY));
  }
}

function tunnelZeichnen() {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, CW, CH);

  for (const z of zeilen) {
    const screenY = z.worldY - scrollOffset;
    if (screenY > CH || screenY + ZEILEN_HOEHE < 0) continue;

    const istLava = score >= 200 && z.hindernis?.typ === 'lava';
    ctx.fillStyle = istLava ? '#5a1500' : '#1a1a3e';

    ctx.fillRect(0, screenY, z.leftX, ZEILEN_HOEHE);
    ctx.fillRect(z.rightX, screenY, CW - z.rightX, ZEILEN_HOEHE);

    ctx.fillStyle = '#3a3a6e';
    ctx.fillRect(z.leftX - 2, screenY, 2, ZEILEN_HOEHE);
    ctx.fillRect(z.rightX,    screenY, 2, ZEILEN_HOEHE);

    if (z.hindernis) hindernisZeichnen(z.hindernis, screenY, z.leftX, z.rightX);
  }
}

// ══════════════════════════════════════════════════════
//  6. HINDERNISSE  (in Task 3 gefüllt)
// ══════════════════════════════════════════════════════
function hindernisGenerieren(leftX, rightX, worldY) { return null; }
function hindernisZeichnen(h, screenY, leftX, rightX) {}
function kollisionPruefen() { return false; }

// ══════════════════════════════════════════════════════
//  7. COINS  (in Task 4 gefüllt)
// ══════════════════════════════════════════════════════
function coinsZeichnen() {}
function coinsAktualisieren() {}

// ══════════════════════════════════════════════════════
//  8. PARTIKEL & SKINS  (in Task 7 gefüllt)
// ══════════════════════════════════════════════════════
function partikelAktualisieren(dt) {}
function partikelZeichnen() {}
function skinEffektVorCharakter(dt) {}
function skinEffektNachCharakter(dt) {}

// ══════════════════════════════════════════════════════
//  9. UI
// ══════════════════════════════════════════════════════
function zeigeScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('versteckt'));
  if (id) document.getElementById(id).classList.remove('versteckt');
}

function menuAktualisieren() {
  document.getElementById('menu-username').textContent   = currentUsername || 'Spieler';
  document.getElementById('menu-best-score').textContent = pdata.best_score;
  document.getElementById('menu-coins').textContent      = pdata.coins;
}

function hudAktualisieren() {
  const el = document.getElementById('hud-score');
  el.textContent = score;
  if (score >= 10) {
    el.style.color      = '#ff6a00';
    el.style.textShadow = `0 0 ${8 + Math.sin(zeit * 3) * 4}px #ff6a00`;
    document.getElementById('screen-game').classList.add('hud-danger');
  } else {
    el.style.color = el.style.textShadow = '';
    document.getElementById('screen-game').classList.remove('hud-danger');
  }
  document.getElementById('hud-coins').textContent = `🪙 ${gameCoins}`;
}

let _bannerTimeout = null;
function bannerZeigen(text, dauer = 2500) {
  const el = document.getElementById('banner');
  el.textContent = text;
  el.classList.remove('versteckt');
  if (_bannerTimeout) clearTimeout(_bannerTimeout);
  _bannerTimeout = setTimeout(() => el.classList.add('versteckt'), dauer);
}

function spielerZeichnen() {
  const sx = Math.round(spieler.x);
  const sy = Math.round(CH * SPIELER_Y_RATIO);
  const g  = SPIELER_GROESSE;

  ctx.fillStyle = '#00f5ff';
  ctx.fillRect(sx, sy, g, g);

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(sx + 2, sy + 2, 4, 4);
  ctx.fillRect(sx + 2, sy + 2, g - 4, 2);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(sx + 2, sy + g - 4, g - 4, 2);
  ctx.fillRect(sx + g - 4, sy + 2, 2, g - 4);

  ctx.fillStyle = '#000';
  ctx.fillRect(sx + 4,  sy + 5, 2, 3);
  ctx.fillRect(sx + 10, sy + 5, 2, 3);
}

function shopRendern() {}
function ranglisteRendern() {}
async function lootboxOeffnen() {}

// ══════════════════════════════════════════════════════
//  10. INPUT & BUTTONS  (in Task 2 + Task 6 gefüllt)
// ══════════════════════════════════════════════════════
function verdrahteButtons() {}
function verdrahteInput() {
  window.addEventListener('mousemove', e => {
    if (!running) return;
    spieler.targetX = e.clientX - SPIELER_GROESSE / 2;
  });

  window.addEventListener('touchmove', e => {
    if (!running) return;
    e.preventDefault();
    spieler.targetX = e.touches[0].clientX - SPIELER_GROESSE / 2;
  }, { passive: false });

  window.addEventListener('touchstart', e => {
    if (!running) return;
    e.preventDefault();
    spieler.targetX = e.touches[0].clientX - SPIELER_GROESSE / 2;
  }, { passive: false });
}

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  PZ.init();
  const session = await PZ.getSession();
  if (!session) { window.location.href = '../../login.html'; return; }
  currentUsername = await PZ.currentUsername();

  canvas = document.getElementById('canvas');
  ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvasGroesseAnpassen();
  window.addEventListener('resize', canvasGroesseAnpassen);

  await spielerDatenLaden();
  verdrahteButtons();
  verdrahteInput();

  zeigeScreen('screen-menu');
  menuAktualisieren();
});
