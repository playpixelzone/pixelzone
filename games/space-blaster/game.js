'use strict';

// ── Konstanten ────────────────────────────────────────────────────────────────
const FPS_TARGET = 60;
const HUD_H      = 48;   // Höhe des HUD-Bereichs in Pixel
const PW_H       = 34;   // Höhe des Power-Up-Timer-Bereichs

// ── Spielzustand ──────────────────────────────────────────────────────────────
let canvas, ctx, CW, CH;
let player        = null;
let bullets       = [];
let enemies       = [];
let boss          = null;
let powerups      = [];
let coins         = [];
let particles     = [];
let formation     = { dx: 1, dy: 0, speed: 1, enemies: [], diagonalDy: 0 };
let activePw      = { fastFire: 0, laser: 0, shield: 0 };

let score         = 0;
let wave          = 1;
let lives         = 3;
let gameCoins     = 0;
let running       = false;
let waveClearing  = false;
let bossWave      = false;
let bossDeathAnim = 0;
let loopId        = null;
let bannerTimer   = 0;
let bannerText    = '';

// Spielerdaten (aus Supabase, persistent)
let pdata = { coins: 0, upgrades: { pwDuration: 0, maxLives: 0 } };

// Permanente Upgrade-Definitionen
const UPGRADE_DEFS = {
  pwDuration: [
    { label: 'Power-Up Dauer +5s',  cost: 50,  bonus: 5  * FPS_TARGET },
    { label: 'Power-Up Dauer +10s', cost: 150, bonus: 10 * FPS_TARGET },
    { label: 'Power-Up Dauer +20s', cost: 400, bonus: 20 * FPS_TARGET },
  ],
  maxLives: [
    { label: '+1 Extra-Leben', cost: 300  },
    { label: '+1 Extra-Leben', cost: 800  },
    { label: '+1 Extra-Leben', cost: 2000 },
  ],
};

// Basis-Dauer zeitlicher Power-Ups (10 Sekunden in Frames)
const PW_BASE_DURATION = 10 * FPS_TARGET;

// ── Input ──────────────────────────────────────────────────────────────────────
const keys  = {};
let touchX  = null;

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

document.addEventListener('touchstart', e => {
  touchX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchmove', e => {
  touchX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', () => { touchX = null; });

// ── Canvas & Resize ────────────────────────────────────────────────────────────
function canvasAufbauen() {
  canvas        = document.getElementById('c');
  CW            = window.innerWidth;
  CH            = window.innerHeight;
  canvas.width  = CW;
  canvas.height = CH;
  ctx           = canvas.getContext('2d');
}

window.addEventListener('resize', () => {
  if (!running || !canvas) return;
  CW            = window.innerWidth;
  CH            = window.innerHeight;
  canvas.width  = CW;
  canvas.height = CH;
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
    shootRate: 18,
    shotLevel: 1,
  };
}

function spielerBewegen() {
  if (!player) return;
  const goLeft  = keys['ArrowLeft']  || keys['a'] || (touchX !== null && touchX < CW / 2);
  const goRight = keys['ArrowRight'] || keys['d'] || (touchX !== null && touchX >= CW / 2);
  if (goLeft)  player.x = Math.max(player.w / 2,       player.x - player.speed);
  if (goRight) player.x = Math.min(CW - player.w / 2,  player.x + player.speed);
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
  schiessenUpdate();
  schuesseUpdate();
  formationUpdate();
  gegnerSchiessen();
  bodenCheck();
  powerupsUpdate();
  muenzenUpdate();
  pwTimerUpdate();
  partikelUpdate();
  if (bossWave && boss?.alive) bossUpdate();
  if (bossDeathAnim > 0) {
    bossDeathAnim--;
    if (bossDeathAnim % 8 === 0)
      partikelSpawnen(
        boss.x + (Math.random() - 0.5) * boss.w,
        boss.y + (Math.random() - 0.5) * boss.h,
        boss.color, 6
      );
  }
}

function draw() {
  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, CW, CH);
  sternZeichnen();
  partikelZeichnen();
  muenzenZeichnen();
  powerupsZeichnen();
  schuesseZeichnen();
  laserZeichnen();
  gegnerZeichnen();
  if (bossWave) bossZeichnen();
  spielerZeichnen();
  bannerZeichnen();
}

// ── Sternenhintergrund ─────────────────────────────────────────────────────────
const STERNE = Array.from({ length: 80 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: Math.random() * 1.5 + 0.3,
  a: Math.random() * 0.6 + 0.2,
}));

function sternZeichnen() {
  STERNE.forEach(s => {
    ctx.globalAlpha = s.a;
    ctx.fillStyle   = '#fff';
    ctx.beginPath();
    ctx.arc(s.x * CW, s.y * CH, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ── Spieler zeichnen ───────────────────────────────────────────────────────────
function spielerZeichnen() {
  if (!player) return;
  const { x, y, w, h } = player;
  const schildAktiv = activePw.shield > 0;

  ctx.save();
  ctx.fillStyle   = schildAktiv ? '#34d399' : '#3af';
  ctx.shadowColor = schildAktiv ? '#34d399' : '#3af';
  ctx.shadowBlur  = 14;

  // Raumschiff-Form: Dreieck mit Flügeln
  ctx.beginPath();
  ctx.moveTo(x,           y - h / 2);
  ctx.lineTo(x + w / 2,   y + h / 2);
  ctx.lineTo(x + w * 0.28, y + h * 0.2);
  ctx.lineTo(x - w * 0.28, y + h * 0.2);
  ctx.lineTo(x - w / 2,   y + h / 2);
  ctx.closePath();
  ctx.fill();

  // Schild-Ring
  if (schildAktiv) {
    ctx.strokeStyle = 'rgba(52,211,153,.6)';
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 18;
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Schießen (Auto-Fire) ───────────────────────────────────────────────────────
function schiessenUpdate() {
  if (!player) return;
  // Laser-Modus: Treffer direkt in laserTrefferCheck(), keine Einzelschüsse
  if (activePw.laser > 0) return;

  const rate = activePw.fastFire > 0 ? Math.floor(player.shootRate / 2) : player.shootRate;
  player.shootTimer++;
  if (player.shootTimer < rate) return;
  player.shootTimer = 0;

  const lvl = player.shotLevel;
  const px  = player.x;
  const py  = player.y - player.h / 2;

  if (lvl === 1) {
    bullets.push(schussErstellen(px, py, 0));
  } else if (lvl === 2) {
    bullets.push(schussErstellen(px - 8, py, 0));
    bullets.push(schussErstellen(px + 8, py, 0));
  } else if (lvl === 3) {
    bullets.push(schussErstellen(px, py,  0));
    bullets.push(schussErstellen(px, py, -0.28));
    bullets.push(schussErstellen(px, py,  0.28));
  } else if (lvl === 4) {
    bullets.push(schussErstellen(px - 7, py, 0));
    bullets.push(schussErstellen(px + 7, py, 0));
    bullets.push(schussErstellen(px, py, -0.35));
    bullets.push(schussErstellen(px, py,  0.35));
  } else {
    bullets.push(schussErstellen(px, py,  0));
    bullets.push(schussErstellen(px, py, -0.28));
    bullets.push(schussErstellen(px, py,  0.28));
    bullets.push(schussErstellen(px, py, -0.52));
    bullets.push(schussErstellen(px, py,  0.52));
  }
}

// Schuss-Objekt erstellen (winkel in Bogenmass, 0 = gerade nach oben)
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

// ── Schüsse bewegen & Kollision ────────────────────────────────────────────────
function schuesseUpdate() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;

    if (b.y < -30 || b.y > CH + 30 || b.x < -30 || b.x > CW + 30) {
      bullets.splice(i, 1);
      continue;
    }

    if (b.type === 'player') {
      let getroffen = false;

      // Spielerschuss trifft Gegner
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (kollision(b.x, b.y, e.x, e.y, e.w, e.h)) {
          e.hp--;
          partikelSpawnen(b.x, b.y, e.color, 5);
          bullets.splice(i, 1);
          if (e.hp <= 0) gegnerTod(e, j);
          getroffen = true;
          break;
        }
      }
      if (getroffen) continue;

      // Spielerschuss trifft Boss
      if (!getroffen && bossWave && boss?.alive) {
        if (kollision(b.x, b.y, boss.x, boss.y, boss.w, boss.h)) {
          boss.hp--;
          partikelSpawnen(b.x, b.y, boss.color, 4);
          bullets.splice(i, 1);
          if (boss.hp <= 0) bossTod();
          continue;
        }
      }
    }

    // Gegnerschuss trifft Spieler
    if (b.type === 'enemy' && player) {
      if (kollision(b.x, b.y, player.x, player.y, player.w, player.h)) {
        bullets.splice(i, 1);
        if (activePw.shield > 0) continue;
        spielerTreffer();
        continue;
      }
    }
  }
}

// ── Schüsse zeichnen ───────────────────────────────────────────────────────────
function schuesseZeichnen() {
  bullets.forEach(b => {
    ctx.save();
    ctx.fillStyle   = b.type === 'player' ? b.color : '#f43f5e';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur  = 6;
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.atan2(b.dx, -b.dy));
    ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
    ctx.restore();
  });
}

// ── Laser zeichnen (wenn Laser-Power-Up aktiv) ─────────────────────────────────
function laserZeichnen() {
  if (!player || activePw.laser <= 0) return;
  ctx.save();
  ctx.strokeStyle  = '#f3a';
  ctx.lineWidth    = 4;
  ctx.shadowColor  = '#f3a';
  ctx.shadowBlur   = 18;
  ctx.globalAlpha  = 0.85 + Math.sin(Date.now() * 0.03) * 0.15;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.h / 2);
  ctx.lineTo(player.x, 0);
  ctx.stroke();
  ctx.restore();
}

// ── XSS-Schutz ────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
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

  bullets      = [];
  enemies      = [];
  powerups     = [];
  coins        = [];
  particles    = [];
  formation    = { dx: 1, dy: 0, speed: 1, enemies: [], diagonalDy: 0 };
  activePw     = { fastFire: 0, laser: 0, shield: 0 };
  score        = 0;
  wave         = 1;
  lives        = 3 + (pdata.upgrades?.maxLives || 0);
  gameCoins    = 0;
  running      = true;
  waveClearing = false;
  boss         = null;
  bossWave     = false;
  bossDeathAnim = 0;
  bannerTimer  = 0;

  if (loopId) cancelAnimationFrame(loopId);
  tick();
  welleSpawnen();   // wird in Task 4 implementiert
}

// ── Spielerdaten laden (Supabase) ──────────────────────────────────────────────
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

// ── Titel-Münzen anzeigen ──────────────────────────────────────────────────────
function titelMuenzenZeigen() {
  const el = document.getElementById('title-coins');
  if (el) el.textContent = pdata.coins;
}

// ── Wellen-Konfiguration ───────────────────────────────────────────────────────
function welleKonfiguration(w) {
  const anzahl = Math.min(8 + (w - 1) * 3, 40);
  const speed  = 0.5 + w * 0.12;
  const hp     = w >= 10 ? 3 : w >= 6 ? 2 : 1;
  const punkte = hp * 10;
  return { anzahl, speed, hp, punkte, istBoss: w % 10 === 0 };
}

function welleSpawnen() {
  waveClearing = false;
  bossWave     = false;
  boss         = null;
  enemies      = [];

  const cfg = welleKonfiguration(wave);

  if (cfg.istBoss) {
    bossWave = true;
    bossSpawnen();   // in Task 5 implementiert
    return;
  }

  const cols   = Math.min(cfg.anzahl, 8);
  const rows   = Math.ceil(cfg.anzahl / cols);
  const cellW  = 52;
  const cellH  = 48;
  const startX = (CW - cols * cellW) / 2 + cellW / 2;
  const startY = HUD_H + PW_H + 20;
  const farben = ['#818cf8', '#38bdf8', '#a78bfa', '#34d399', '#fb923c'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r * cols + c >= cfg.anzahl) break;
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
    diagonalDy: wave >= 4 ? 0.3 : 0,
    enemies,
  };

  bannerZeigen(`WELLE ${wave}`, 90);
  hudAktualisieren();
}

// ── AABB-Kollision ─────────────────────────────────────────────────────────────
function kollision(x1, y1, x2, y2, w, h) {
  return Math.abs(x1 - x2) < (w / 2 + 4) && Math.abs(y1 - y2) < (h / 2 + 4);
}

// ── Formation bewegen (Bounds-Check) ──────────────────────────────────────────
function formationUpdate() {
  if (!formation.enemies.length) return;

  let minX = Infinity, maxX = -Infinity;
  formation.enemies.forEach(e => {
    if (e.x - e.w / 2 < minX) minX = e.x - e.w / 2;
    if (e.x + e.w / 2 > maxX) maxX = e.x + e.w / 2;
  });

  if (maxX >= CW - 4 && formation.dx > 0) {
    formation.dx = -1;
    if (wave <= 3) formation.enemies.forEach(e => { e.y += 20; });
  }
  if (minX <= 4 && formation.dx < 0) {
    formation.dx = 1;
    if (wave <= 3) formation.enemies.forEach(e => { e.y += 20; });
  }

  const moveX = formation.dx * formation.speed;
  const moveY = formation.diagonalDy * formation.dx * 0.15;

  formation.enemies.forEach(e => {
    e.x += moveX;
    e.y += moveY;
  });
}

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

// ── Gegner-Tod ─────────────────────────────────────────────────────────────────
function gegnerTod(e, idx) {
  partikelSpawnen(e.x, e.y, e.color, 10);
  enemies.splice(idx, 1);
  formation.enemies = enemies;
  muenzenSpawnen(e.x, e.y);
  if (Math.random() < 0.12) powerupSpawnen(e.x, e.y);
  welleAbgeschlossenPruefen();
}

function welleAbgeschlossenPruefen() {
  if (enemies.length === 0 && !bossWave && !waveClearing) {
    waveClearing = true;
    setTimeout(() => { wave++; welleSpawnen(); }, 1800);
  }
}

// ── Spieler getroffen ──────────────────────────────────────────────────────────
function spielerTreffer() {
  lives--;
  partikelSpawnen(player.x, player.y, '#e85d04', 14);
  hudAktualisieren();
  if (lives <= 0) spielEnde();
}

// ── Boden-Check ────────────────────────────────────────────────────────────────
function bodenCheck() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].y + enemies[i].h / 2 > CH) {
      enemies.splice(i, 1);
      formation.enemies = enemies;
      spielerTreffer();
    }
  }
}

// ── Gegner zeichnen ────────────────────────────────────────────────────────────
function gegnerZeichnen() {
  enemies.forEach(e => {
    ctx.save();
    ctx.fillStyle   = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(e.x,             e.y + e.h / 2);
    ctx.lineTo(e.x + e.w / 2,  e.y - e.h / 2);
    ctx.lineTo(e.x + e.w * 0.28, e.y - e.h * 0.1);
    ctx.lineTo(e.x - e.w * 0.28, e.y - e.h * 0.1);
    ctx.lineTo(e.x - e.w / 2,  e.y - e.h / 2);
    ctx.closePath();
    ctx.fill();
    if (e.maxHp > 1) {
      const bw = e.w;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(e.x - bw / 2, e.y + e.h / 2 + 3, bw, 3);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - bw / 2, e.y + e.h / 2 + 3, bw * (e.hp / e.maxHp), 3);
    }
    ctx.restore();
  });
}

// ── Wellen-Banner ─────────────────────────────────────────────────────────────
function bannerZeigen(text, frames) {
  bannerText  = text;
  bannerTimer = frames;
}

function bannerZeichnen() {
  if (bannerTimer <= 0) return;
  bannerTimer--;
  const alpha = Math.min(1, bannerTimer / 20);
  ctx.save();
  ctx.globalAlpha  = alpha;
  ctx.fillStyle    = 'rgba(0,0,0,.6)';
  ctx.fillRect(0, CH / 2 - 28, CW, 56);
  ctx.fillStyle    = '#3af';
  ctx.font         = `900 clamp(1.4rem, 4vw, 2rem) Orbitron, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#3af';
  ctx.shadowBlur   = 16;
  ctx.fillText(bannerText, CW / 2, CH / 2);
  ctx.restore();
}

// Platzhalter für Tasks 5–7 (werden später ersetzt/ergänzt)
function bossSpawnen()    {}
function bossUpdate()     {}
function bossZeichnen()   {}
function partikelSpawnen(x, y, color, n) {}
function partikelZeichnen() {}
function partikelUpdate() {}
function muenzenSpawnen(x, y) {}
function muenzenZeichnen()   {}
function muenzenUpdate()     {}
function powerupSpawnen(x, y) {}
function powerupsZeichnen()   {}
function powerupsUpdate()     {}
function pwTimerUpdate()       {}
function pwTimerHudAktualisieren() {}
function laserTrefferCheck()  {}
function bossTod()            {}

function hudAktualisieren() {}
function rangliste_zeigen() { screenZeigen('screen-lb'); }
function shop_zeigen()      { screenZeigen('screen-shop'); }
function spielEnde()        { running = false; if (loopId) cancelAnimationFrame(loopId); screenZeigen('screen-gameover'); }

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await spielerDatenLaden();
  titelMuenzenZeigen();

  document.getElementById('btn-play').addEventListener('click', spielStarten);
  document.getElementById('btn-retry').addEventListener('click', spielStarten);
  document.getElementById('btn-lb').addEventListener('click', rangliste_zeigen);
  document.getElementById('btn-lb-go').addEventListener('click', rangliste_zeigen);
  document.getElementById('btn-lb-back').addEventListener('click', () => screenZeigen('screen-title'));
  document.getElementById('btn-shop-title').addEventListener('click', shop_zeigen);
  document.getElementById('btn-shop-go').addEventListener('click', shop_zeigen);
  document.getElementById('btn-shop-back').addEventListener('click', () => screenZeigen('screen-title'));
});
