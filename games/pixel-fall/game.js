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
//  8. PARTIKEL & SKINS
// ══════════════════════════════════════════════════════
function partikelHinzufuegen(x, y, farbe, anzahl = 1, opt = {}) {
  for (let i = 0; i < anzahl; i++) {
    const winkel = Math.random() * Math.PI * 2;
    const v = (opt.minV ?? 20) + Math.random() * (opt.maxV ?? 60);
    partikel.push({
      x, y,
      vx:      Math.cos(winkel) * v,
      vy:      Math.sin(winkel) * v + (opt.aufwaerts ? -40 : 0),
      alpha:   1,
      size:    (opt.minSize ?? 2) + Math.random() * (opt.maxSize ?? 3),
      color:   Array.isArray(farbe) ? farbe[Math.floor(Math.random() * farbe.length)] : farbe,
      life:    opt.life ?? 0.6,
      maxLife: opt.life ?? 0.6,
    });
  }
}

function partikelAktualisieren(dt) {
  for (let i = partikel.length - 1; i >= 0; i--) {
    const p = partikel[i];
    p.x    += p.vx * dt;
    p.y    += p.vy * dt;
    p.vy   += 30 * dt;
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) partikel.splice(i, 1);
  }
}

function partikelZeichnen() {
  for (const p of partikel) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function trailZeichnen(farbe) {
  for (let i = 1; i < trail.length; i++) {
    ctx.globalAlpha = (1 - i / trail.length) * 0.6;
    ctx.fillStyle   = farbe;
    ctx.beginPath();
    ctx.arc(trail[i].x, trail[i].y, SPIELER_GROESSE * 0.4 * (1 - i / trail.length), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function auraZeichnen(farbe, pulsierend = true) {
  const px   = spieler.x + SPIELER_GROESSE / 2;
  const py   = CH * SPIELER_Y_RATIO + SPIELER_GROESSE / 2;
  const r    = SPIELER_GROESSE * (pulsierend ? 1.2 + Math.sin(zeit * 3) * 0.3 : 1.5);
  const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 2);
  grad.addColorStop(0,   farbe + 'aa');
  grad.addColorStop(0.5, farbe + '44');
  grad.addColorStop(1,   farbe + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, r * 2, 0, Math.PI * 2);
  ctx.fill();
}

function blitzeZeichnen() {
  const px = spieler.x + SPIELER_GROESSE / 2;
  const py = CH * SPIELER_Y_RATIO + SPIELER_GROESSE / 2;
  ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
  for (let i = 0; i < 4; i++) {
    const ax = px + (Math.random() - 0.5) * 40;
    const ay = py + (Math.random() - 0.5) * 40;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + (Math.random() - 0.5) * 20, ay + (Math.random() - 0.5) * 20);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function skinEffektVorCharakter(dt) {
  const effekt = SKINS[pdata.active_skin]?.effekt;
  switch (effekt) {
    case 'trail-feuer':  trailZeichnen('#ff6a00'); break;
    case 'trail-blau':   trailZeichnen('#3a86ff'); break;
    case 'trail-gruen':  trailZeichnen('#00e676'); break;
    case 'trail-lila':   trailZeichnen('#9b5de5'); break;
    case 'aura-cyan':    auraZeichnen('#00f5ff'); break;
    case 'galaxy':       auraZeichnen('#9b5de5'); break;
    case 'god':          auraZeichnen(`hsl(${(zeit * 60) % 360}, 100%, 60%)`); break;
    case 'blitze':       blitzeZeichnen(); break;
    case 'prism':        auraZeichnen(`hsl(${(zeit * 80) % 360}, 100%, 60%)`, false); break;
  }
}

function skinEffektNachCharakter(dt) {
  const px     = spieler.x + SPIELER_GROESSE / 2;
  const py     = CH * SPIELER_Y_RATIO + SPIELER_GROESSE / 2;
  const effekt = SKINS[pdata.active_skin]?.effekt;

  switch (effekt) {
    case 'partikel-weiss':
      if (Math.random() < 0.4) partikelHinzufuegen(px + (Math.random()-0.5)*16, py + (Math.random()-0.5)*16, '#e0e0ff', 1, { life: 0.8, maxV: 30, minV: 5 });
      break;
    case 'partikel-gelb':
      if (Math.random() < 0.5) partikelHinzufuegen(px + (Math.random()-0.5)*12, py + (Math.random()-0.5)*12, '#ffe600', 1, { life: 0.5 });
      break;
    case 'partikel-blau':
      if (Math.random() < 0.3) partikelHinzufuegen(px + (Math.random()-0.5)*10, py, '#3a86ff', 1, { aufwaerts: true, minV: 5, maxV: 20, life: 1.0 });
      break;
    case 'partikel-gruen':
      if (Math.random() < 0.3) partikelHinzufuegen(px + (Math.random()-0.5)*14, py + 6, '#00e676', 1, { aufwaerts: true, life: 0.9 });
      break;
    case 'trail-feuer':
    case 'partikel-feuer':
      if (Math.random() < 0.6) partikelHinzufuegen(px + (Math.random()-0.5)*8, py + 4, ['#ff6a00','#ff2d00','#ffaa00'], 1, { aufwaerts: true, minV: 10, maxV: 40, life: 0.5 });
      break;
    case 'partikel-eis':
      if (Math.random() < 0.4) partikelHinzufuegen(px + (Math.random()-0.5)*14, py + (Math.random()-0.5)*14, ['#a0e4ff','#e0f8ff','#ffffff'], 1, { minV: 5, maxV: 25, life: 0.8 });
      break;
    case 'galaxy':
      if (Math.random() < 0.3) {
        const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 15;
        partikelHinzufuegen(px + Math.cos(a + zeit) * r, py + Math.sin(a + zeit) * r, ['#fff','#c084fc','#60a5fa'], 1, { minV: 2, maxV: 8, life: 1.2 });
      }
      break;
    case 'god':
      if (Math.random() < 0.5) {
        const f = `hsl(${Math.random() * 360}, 100%, 65%)`;
        partikelHinzufuegen(px + (Math.random()-0.5)*30, py + (Math.random()-0.5)*30, f, 1, { minV: 20, maxV: 60, life: 0.7 });
      }
      break;
    case 'prism':
      if (Math.random() < 0.5) {
        const f = `hsl(${(zeit * 120 + Math.random() * 60) % 360}, 100%, 65%)`;
        partikelHinzufuegen(px + (Math.random()-0.5)*20, py + (Math.random()-0.5)*20, f, 1, { minV: 15, maxV: 50, life: 0.6 });
      }
      break;
  }
}

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

function skinVorschauZeichnen(canvas, skinId) {
  const ctx2 = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx2.clearRect(0, 0, w, h);

  const effekt = SKINS[skinId]?.effekt ?? 'keins';

  // Hintergrund
  ctx2.fillStyle = '#1a1a2e';
  ctx2.fillRect(0, 0, w, h);

  // Charakter (kleines Pixel)
  const cx = w / 2 - 5, cy = h / 2 - 5, g = 10;

  // Effekt-Vorschau
  switch (effekt) {
    case 'aura-cyan':
    case 'trail-blau': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,14);
      grad.addColorStop(0,'rgba(0,245,255,0.5)'); grad.addColorStop(1,'rgba(0,245,255,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+5,14,0,Math.PI*2); ctx2.fill();
      break;
    }
    case 'trail-feuer':
    case 'partikel-feuer': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,12);
      grad.addColorStop(0,'rgba(255,106,0,0.6)'); grad.addColorStop(1,'rgba(255,0,0,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+8,12,0,Math.PI*2); ctx2.fill();
      break;
    }
    case 'trail-gruen':
    case 'partikel-gruen': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,12);
      grad.addColorStop(0,'rgba(0,230,118,0.5)'); grad.addColorStop(1,'rgba(0,230,118,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+5,12,0,Math.PI*2); ctx2.fill();
      break;
    }
    case 'trail-lila': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,12);
      grad.addColorStop(0,'rgba(155,93,229,0.5)'); grad.addColorStop(1,'rgba(155,93,229,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+5,12,0,Math.PI*2); ctx2.fill();
      break;
    }
    case 'partikel-weiss': {
      for (let i=0;i<5;i++) {
        ctx2.fillStyle = `rgba(220,220,255,${0.3+Math.random()*0.5})`;
        ctx2.beginPath(); ctx2.arc(cx+Math.random()*18, cy+Math.random()*18, 1.5, 0, Math.PI*2); ctx2.fill();
      }
      break;
    }
    case 'partikel-gelb': {
      for (let i=0;i<5;i++) {
        ctx2.fillStyle = `rgba(255,230,0,${0.4+Math.random()*0.4})`;
        ctx2.beginPath(); ctx2.arc(cx+Math.random()*18, cy+Math.random()*18, 1.5, 0, Math.PI*2); ctx2.fill();
      }
      break;
    }
    case 'partikel-blau': {
      for (let i=0;i<5;i++) {
        ctx2.fillStyle = `rgba(58,134,255,${0.4+Math.random()*0.4})`;
        ctx2.beginPath(); ctx2.arc(cx+Math.random()*18, cy+Math.random()*18, 1.5, 0, Math.PI*2); ctx2.fill();
      }
      break;
    }
    case 'partikel-eis': {
      for (let i=0;i<5;i++) {
        ctx2.fillStyle = `rgba(160,228,255,${0.4+Math.random()*0.4})`;
        ctx2.beginPath(); ctx2.arc(cx+Math.random()*18, cy+Math.random()*18, 1.5, 0, Math.PI*2); ctx2.fill();
      }
      break;
    }
    case 'blitze': {
      ctx2.strokeStyle='#00f5ff'; ctx2.lineWidth=1; ctx2.globalAlpha=0.7;
      ctx2.beginPath(); ctx2.moveTo(cx-3,cy-3); ctx2.lineTo(cx+3,cy+8); ctx2.lineTo(cx,cy+4); ctx2.lineTo(cx+6,cy+14); ctx2.stroke();
      ctx2.globalAlpha=1;
      break;
    }
    case 'galaxy': {
      for (let i=0;i<6;i++) {
        const a = (i/6)*Math.PI*2, r = 11;
        ctx2.fillStyle=['#fff','#c084fc','#60a5fa'][i%3];
        ctx2.beginPath(); ctx2.arc(cx+5+Math.cos(a)*r, cy+5+Math.sin(a)*r, 1.5, 0, Math.PI*2); ctx2.fill();
      }
      break;
    }
    case 'god': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,14);
      grad.addColorStop(0,'rgba(255,255,100,0.6)'); grad.addColorStop(1,'rgba(255,100,0,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+5,14,0,Math.PI*2); ctx2.fill();
      break;
    }
    case 'prism': {
      const grad = ctx2.createRadialGradient(cx+5,cy+5,0,cx+5,cy+5,14);
      grad.addColorStop(0,'rgba(255,0,255,0.4)'); grad.addColorStop(0.5,'rgba(0,255,255,0.3)'); grad.addColorStop(1,'rgba(255,255,0,0)');
      ctx2.fillStyle = grad; ctx2.beginPath(); ctx2.arc(cx+5,cy+5,14,0,Math.PI*2); ctx2.fill();
      break;
    }
  }

  // Charakter-Pixel
  ctx2.fillStyle = '#00f5ff';
  ctx2.fillRect(cx, cy, g, g);
  ctx2.fillStyle = 'rgba(255,255,255,0.5)';
  ctx2.fillRect(cx+1,cy+1,3,3);
  ctx2.fillStyle = 'rgba(0,0,0,0.3)';
  ctx2.fillRect(cx+1,cy+g-3,g-2,2);
}

function shopRendern() {
  document.getElementById('shop-coins-display').textContent = `🪙 ${pdata.coins}`;

  // Lootbox-Button deaktivieren wenn alle Skins freigeschaltet
  const alleLootboxIds = [...LOOTBOX_POOL.common, ...LOOTBOX_POOL.rare, ...LOOTBOX_POOL.epic, ...LOOTBOX_POOL.legendary];
  const alleFreigeschaltet = alleLootboxIds.every(id => pdata.unlocked_skins.includes(id));
  const lootboxBtn = document.getElementById('btn-lootbox');
  if (alleFreigeschaltet) {
    lootboxBtn.textContent = '✓ ALLE SKINS FREIGESCHALTET';
    lootboxBtn.disabled = true;
  } else {
    lootboxBtn.textContent = 'BOX ÖFFNEN (100 🪙)';
    lootboxBtn.disabled = false;
  }

  const grid = document.getElementById('skins-grid');
  grid.innerHTML = '';

  for (const [id, skin] of Object.entries(SKINS)) {
    const freigeschaltet = pdata.unlocked_skins.includes(id);
    const istAktiv       = pdata.active_skin === id;

    const karte = document.createElement('div');
    karte.className = 'skin-card' + (istAktiv ? ' aktiv' : '') + (!freigeschaltet ? ' gesperrt' : '');

    // Canvas-Vorschau
    const vorschau = document.createElement('canvas');
    vorschau.className = 'skin-preview';
    vorschau.width  = 36;
    vorschau.height = 36;
    karte.appendChild(vorschau);
    skinVorschauZeichnen(vorschau, id);

    // Name (Meilenstein-Skins immer sichtbar, Lootbox-Skins als ??? wenn gesperrt)
    const nameEl = document.createElement('div');
    nameEl.className = 'skin-name';
    nameEl.textContent = (freigeschaltet || skin.quelle === 'meilenstein') ? skin.name : '???';
    karte.appendChild(nameEl);

    // Seltenheit / Quelle
    if (skin.seltenheit) {
      const rarEl = document.createElement('div');
      rarEl.className = `skin-rarity rarity-${skin.seltenheit}`;
      const texte = { common:'Common', rare:'Rare', epic:'Epic', legendary:'Legendary', meilenstein:'Meilenstein' };
      rarEl.textContent = texte[skin.seltenheit] ?? skin.seltenheit;
      karte.appendChild(rarEl);
    }

    // Meilenstein-Hinweis
    if (skin.quelle === 'meilenstein' && !freigeschaltet) {
      const hinweis = document.createElement('div');
      hinweis.className = 'skin-rarity rarity-meilenstein';
      hinweis.textContent = `Score ${skin.meilenstein}`;
      karte.appendChild(hinweis);
    }

    // Button
    const btn = document.createElement('button');
    btn.className = 'btn';
    if (istAktiv) {
      btn.textContent = '✓ AKTIV';
      btn.classList.add('btn-primary');
      btn.disabled = true;
    } else if (freigeschaltet) {
      btn.textContent = 'ANLEGEN';
      btn.classList.add('btn-secondary');
      btn.addEventListener('click', () => {
        pdata.active_skin = id;
        const extraDaten = { coins: pdata.coins, active_skin: pdata.active_skin, unlocked_skins: pdata.unlocked_skins };
        PZ.saveGameData(SPIEL_NAME, pdata.best_score, 1, extraDaten).catch(() => {});
        localStorage.setItem(LS_KEY, JSON.stringify(pdata));
        shopRendern();
      });
    } else {
      btn.textContent = skin.quelle === 'lootbox' ? '🎁 LOOTBOX' : '🔒';
      btn.classList.add('btn-secondary');
      btn.disabled = true;
    }
    karte.appendChild(btn);

    grid.appendChild(karte);
  }
}

async function ranglisteRendern() {
  const liste = document.getElementById('leaderboard-list');
  liste.innerHTML = '<div class="leaderboard-loading">Lade...</div>';

  try {
    const eintraege = await PZ.getLeaderboard(SPIEL_NAME, 10);
    if (!eintraege || eintraege.length === 0) {
      liste.innerHTML = '<div class="leaderboard-loading">Noch keine Einträge.</div>';
      return;
    }

    liste.innerHTML = '';
    eintraege.forEach((e, i) => {
      const zeile = document.createElement('div');
      const istEigene = e.username === currentUsername;
      zeile.className = 'leaderboard-row' + (istEigene ? ' eigene' : '');

      let rangText;
      if      (i === 0) rangText = '🥇';
      else if (i === 1) rangText = '🥈';
      else if (i === 2) rangText = '🥉';
      else              rangText = `#${i + 1}`;

      zeile.innerHTML = `
        <span class="lb-rang">${rangText}</span>
        <span class="lb-name">${e.username ?? '???'}</span>
        <span class="lb-score">${e.punkte ?? 0}</span>
      `;
      liste.appendChild(zeile);
    });
  } catch (err) {
    liste.innerHTML = '<div class="leaderboard-loading">Fehler beim Laden.</div>';
  }
}

async function lootboxOeffnen() {
  if (pdata.coins < 100) {
    document.getElementById('lootbox-result').textContent = 'Zu wenig Coins!';
    document.getElementById('lootbox-result').style.color = '#ff2d78';
    return;
  }

  const btn = document.getElementById('btn-lootbox');
  btn.disabled = true;

  // Coin abziehen
  pdata.coins -= 100;
  document.getElementById('shop-coins-display').textContent = `🪙 ${pdata.coins}`;

  // Animation
  const visual = document.getElementById('lootbox-visual');
  visual.classList.add('spinning');
  visual.textContent = '🎁';
  document.getElementById('lootbox-result').textContent = '';
  document.getElementById('lootbox-result').style.color = '';

  // Nicht-besessene Skins pro Seltenheit
  const verfuegbar = {
    common:    LOOTBOX_POOL.common.filter(id => !pdata.unlocked_skins.includes(id)),
    rare:      LOOTBOX_POOL.rare.filter(id => !pdata.unlocked_skins.includes(id)),
    epic:      LOOTBOX_POOL.epic.filter(id => !pdata.unlocked_skins.includes(id)),
    legendary: LOOTBOX_POOL.legendary.filter(id => !pdata.unlocked_skins.includes(id)),
  };

  // Alle Lootbox-Skins schon freigeschaltet?
  const alleLootboxIds = [...LOOTBOX_POOL.common, ...LOOTBOX_POOL.rare, ...LOOTBOX_POOL.epic, ...LOOTBOX_POOL.legendary];
  const allFreigeschaltet = alleLootboxIds.every(id => pdata.unlocked_skins.includes(id));

  if (allFreigeschaltet) {
    pdata.coins += 100; // Rückerstattung
    localStorage.setItem(LS_KEY, JSON.stringify(pdata));
    visual.classList.remove('spinning');
    visual.textContent = '🎁';
    const resultEl2 = document.getElementById('lootbox-result');
    resultEl2.textContent = 'Alle Skins bereits freigeschaltet! Coins zurückerstattet.';
    resultEl2.style.color = 'var(--neon-yell)';
    document.getElementById('shop-coins-display').textContent = `🪙 ${pdata.coins}`;
    btn.disabled = false;
    return;
  }

  // Gewichtete Zufallsauswahl, Fallback falls Tier leer
  const roll = Math.random();
  let seltenheit;
  if      (roll < 0.03) seltenheit = 'legendary';
  else if (roll < 0.15) seltenheit = 'epic';
  else if (roll < 0.40) seltenheit = 'rare';
  else                  seltenheit = 'common';

  // Falls gewürfeltes Tier keine neuen Skins hat, nächstes verfügbares nehmen
  const tierReihenfolge = ['common', 'rare', 'epic', 'legendary'];
  if (verfuegbar[seltenheit].length === 0) {
    seltenheit = tierReihenfolge.find(t => verfuegbar[t].length > 0);
  }

  const gewonnenId = verfuegbar[seltenheit][Math.floor(Math.random() * verfuegbar[seltenheit].length)];
  const skin = SKINS[gewonnenId];

  await new Promise(r => setTimeout(r, 820));

  visual.classList.remove('spinning');
  visual.textContent = '✨';

  // Emoji pro Seltenheit
  const emojis = { common: '⭐', rare: '💎', epic: '🔮', legendary: '👑' };
  const rarText = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
  const farben  = { common: 'var(--common)', rare: 'var(--rare)', epic: 'var(--epic)', legendary: 'var(--legendary)' };

  const resultEl = document.getElementById('lootbox-result');
  resultEl.textContent = `${emojis[skin.seltenheit]} ${rarText[skin.seltenheit]}: ${skin.name}!`;
  resultEl.style.color = farben[skin.seltenheit];
  pdata.unlocked_skins.push(gewonnenId);

  // Speichern
  const extraDaten = { coins: pdata.coins, active_skin: pdata.active_skin, unlocked_skins: pdata.unlocked_skins };
  await PZ.saveGameData(SPIEL_NAME, pdata.best_score, 1, extraDaten).catch(() => {});
  localStorage.setItem(LS_KEY, JSON.stringify(pdata));

  // Shop-Grid aktualisieren
  shopRendern();

  btn.disabled = false;
}

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
