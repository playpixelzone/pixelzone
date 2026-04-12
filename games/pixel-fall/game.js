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
//  6. HINDERNISSE
// ══════════════════════════════════════════════════════
function hindernisGenerieren(leftX, rightX, worldY) {
  if (Math.random() > 0.25) return null; // ~25% Chance pro Zeile

  const mitte = (leftX + rightX) / 2;

  let typen;
  if      (score >= 200) typen = ['saegeblatt','flamme','eisblock','laser','lava'];
  else if (score >= 100) typen = ['saegeblatt','flamme','eisblock','laser'];
  else if (score >= 50)  typen = ['saegeblatt','flamme','eisblock'];
  else if (score >= 25)  typen = ['saegeblatt','flamme'];
  else                   typen = ['saegeblatt'];

  const typ = typen[Math.floor(Math.random() * typen.length)];
  return hindernisObjekt(typ, mitte, leftX, rightX, worldY);
}

function hindernisObjekt(typ, mitte, leftX, rightX, worldY) {
  const gb = rightX - leftX;
  switch (typ) {
    case 'saegeblatt': return { typ, x: mitte, worldY: worldY + ZEILEN_HOEHE / 2, r: 14 };
    case 'flamme':     return { typ, x: mitte, worldY: worldY + ZEILEN_HOEHE / 2, breite: gb * 0.6, hoehe: ZEILEN_HOEHE * 0.7 };
    case 'eisblock':   return { typ, x: mitte - 18, worldY: worldY + 4, breite: 36, hoehe: ZEILEN_HOEHE - 8 };
    case 'laser':      return { typ, leftX, rightX, worldY: worldY + ZEILEN_HOEHE / 2 };
    case 'lava':       return { typ, leftX, rightX, worldY };
    default:           return null;
  }
}

function hindernisZeichnen(h, screenY, leftX, rightX) {
  switch (h.typ) {
    case 'saegeblatt': {
      const hy = h.worldY - scrollOffset;
      ctx.save();
      ctx.translate(h.x, hy);
      ctx.rotate(zeit * 3);
      ctx.beginPath();
      const zaehne = 8;
      for (let i = 0; i < zaehne; i++) {
        const a1     = (i / zaehne) * Math.PI * 2;
        const a2     = ((i + 0.5) / zaehne) * Math.PI * 2;
        const aussen = h.r, innen = h.r * 0.6;
        if (i === 0) ctx.moveTo(Math.cos(a1) * aussen, Math.sin(a1) * aussen);
        else         ctx.lineTo(Math.cos(a1) * aussen, Math.sin(a1) * aussen);
        ctx.lineTo(Math.cos(a2) * innen, Math.sin(a2) * innen);
      }
      ctx.closePath();
      ctx.fillStyle = '#888'; ctx.fill();
      ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#555'; ctx.fill();
      ctx.restore();
      break;
    }
    case 'flamme': {
      const aktiv = Math.sin(zeit * 2) > 0;
      const hy    = h.worldY - scrollOffset;
      if (!aktiv) {
        ctx.fillStyle = '#554400';
        ctx.fillRect(h.x - 8, hy - 6, 16, 8);
        break;
      }
      const sy   = hy - h.hoehe / 2;
      const grad = ctx.createLinearGradient(h.x, sy, h.x, sy + h.hoehe);
      grad.addColorStop(0,   'rgba(255,255,0,0.9)');
      grad.addColorStop(0.4, 'rgba(255,100,0,0.8)');
      grad.addColorStop(1,   'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(h.x, sy + h.hoehe / 2, h.breite / 2, h.hoehe / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'eisblock': {
      const hy   = h.worldY - scrollOffset;
      const grad = ctx.createLinearGradient(h.x, hy, h.x + h.breite, hy + h.hoehe);
      grad.addColorStop(0, 'rgba(150,220,255,0.9)');
      grad.addColorStop(1, 'rgba(80,160,220,0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(h.x, hy, h.breite, h.hoehe);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      ctx.strokeRect(h.x, hy, h.breite, h.hoehe);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(h.x + 3, hy + 3, h.breite / 3, 4);
      break;
    }
    case 'laser': {
      const aktiv = Math.sin(zeit * 4) > 0.3;
      const hy    = h.worldY - scrollOffset;
      if (aktiv) {
        ctx.strokeStyle = '#ff2d78'; ctx.lineWidth = 3;
        ctx.shadowColor = '#ff2d78'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(h.leftX, hy); ctx.lineTo(h.rightX, hy); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff6ea0';
        ctx.beginPath(); ctx.arc(h.leftX,  hy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(h.rightX, hy, 4, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#550022';
        ctx.beginPath(); ctx.arc(h.leftX,  hy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(h.rightX, hy, 4, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'lava': {
      // Lava-Partikel aus den Wänden
      if (Math.random() < 0.3) {
        partikel.push({
          x: leftX + Math.random() * 10, y: screenY + Math.random() * ZEILEN_HOEHE,
          vx: 20 + Math.random() * 30, vy: -30 - Math.random() * 40,
          alpha: 0.8, size: 3 + Math.random() * 3, color: '#ff4400',
          life: 0.4, maxLife: 0.4,
        });
      }
      break;
    }
  }
}

function kollisionPruefen() {
  const hitboxS   = SPIELER_GROESSE * 0.8;
  const hitboxOff = (SPIELER_GROESSE - hitboxS) / 2;
  const sl = spieler.x + hitboxOff;
  const sr = sl + hitboxS;
  const st = CH * SPIELER_Y_RATIO + hitboxOff;
  const sb = st + hitboxS;

  for (const z of zeilen) {
    const screenY = z.worldY - scrollOffset;
    if (screenY > CH || screenY + ZEILEN_HOEHE < 0) continue;
    const zt = screenY, zb = screenY + ZEILEN_HOEHE;

    // Wandkollision
    if (sb > zt && st < zb) {
      if (sl < z.leftX || sr > z.rightX) return true;
    }

    const h = z.hindernis;
    if (!h) continue;
    const hy = h.worldY - scrollOffset;

    switch (h.typ) {
      case 'saegeblatt': {
        const dx = (sl + hitboxS / 2) - h.x;
        const dy = (st + hitboxS / 2) - hy;
        if (Math.sqrt(dx * dx + dy * dy) < h.r + hitboxS / 2 - 4) return true;
        break;
      }
      case 'flamme':
        if (Math.sin(zeit * 2) <= 0) break;
        if (sr > h.x - h.breite / 2 && sl < h.x + h.breite / 2 &&
            sb > hy - h.hoehe / 2   && st < hy + h.hoehe / 2) return true;
        break;
      case 'eisblock':
        if (sr > h.x && sl < h.x + h.breite && sb > hy && st < hy + h.hoehe) return true;
        break;
      case 'laser':
        if (Math.sin(zeit * 4) <= 0.3) break;
        if (sl < h.rightX && sr > h.leftX && st < hy + 6 && sb > hy - 6) return true;
        break;
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════
//  7. COINS
// ══════════════════════════════════════════════════════
function coinsZeichnen() {
  for (const c of coinItems) {
    if (c.gesammelt) continue;
    const sy = c.worldY - scrollOffset;
    if (sy < -20 || sy > CH + 20) continue;

    const pulse = 1 + Math.sin(zeit * 4 + c.worldY * 0.01) * 0.15;
    const r     = COIN_RADIUS * pulse;

    ctx.beginPath();
    ctx.arc(c.x, sy, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(c.x - 2, sy - 2, 1, c.x, sy, r);
    grad.addColorStop(0,   '#fff7aa');
    grad.addColorStop(0.5, '#ffd700');
    grad.addColorStop(1,   '#cc8800');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(c.x - 2, sy - 2, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
  }
}

function coinsAktualisieren() {
  const px          = spieler.x + SPIELER_GROESSE / 2;
  const py          = CH * SPIELER_Y_RATIO + SPIELER_GROESSE / 2;
  const sammelRadius = COIN_RADIUS + SPIELER_GROESSE / 2 + 2;

  for (const c of coinItems) {
    if (c.gesammelt) continue;
    const sy = c.worldY - scrollOffset;
    if (sy < -40) { c.gesammelt = true; continue; }

    const dx = px - c.x, dy = py - sy;
    if (Math.sqrt(dx * dx + dy * dy) < sammelRadius) {
      c.gesammelt = true;
      gameCoins++;
      for (let i = 0; i < 6; i++) {
        const winkel = (i / 6) * Math.PI * 2;
        partikel.push({
          x: c.x, y: sy,
          vx: Math.cos(winkel) * 60, vy: Math.sin(winkel) * 60,
          alpha: 1, size: 3, color: '#ffd700',
          life: 0.4, maxLife: 0.4,
        });
      }
      hudAktualisieren();
    }
  }

  // Aufräumen alle ~100 Frames
  if (Math.random() < 0.01) {
    coinItems = coinItems.filter(c => !c.gesammelt && c.worldY > scrollOffset - ZEILEN_HOEHE * 2);
  }
}

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
function verdrahteButtons() {
  // Hauptmenü
  document.getElementById('btn-spielen').addEventListener('click', spielStarten);
  document.getElementById('btn-shop').addEventListener('click', () => {
    shopRendern();
    zeigeScreen('screen-shop');
  });
  document.getElementById('btn-rangliste').addEventListener('click', () => {
    ranglisteRendern();
    zeigeScreen('screen-leaderboard');
  });
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await PZ.logout();
    window.location.href = '../../index.html';
  });

  // Game Over
  document.getElementById('btn-retry').addEventListener('click', spielStarten);
  document.getElementById('btn-menu-from-gameover').addEventListener('click', () => {
    menuAktualisieren();
    zeigeScreen('screen-menu');
  });

  // Shop
  document.getElementById('btn-shop-back').addEventListener('click', () => {
    menuAktualisieren();
    zeigeScreen('screen-menu');
  });
  document.getElementById('btn-lootbox').addEventListener('click', lootboxOeffnen);

  // Rangliste
  document.getElementById('btn-leaderboard-back').addEventListener('click', () => {
    zeigeScreen('screen-menu');
  });
}
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
