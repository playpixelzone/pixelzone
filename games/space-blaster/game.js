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
let loopId           = null;
let gegnerSchiessKooldown = 0; // globaler Cooldown zwischen Gegnerschüssen
let vorherigerScreen = 'screen-title'; // Screen vor dem Shop
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
  e.preventDefault(); // verhindert blaues Markieren und Kontextmenü
  touchX = e.touches[0].clientX;
}, { passive: false });
document.addEventListener('touchmove', e => {
  e.preventDefault();
  touchX = e.touches[0].clientX;
}, { passive: false });
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

  if (touchX !== null) {
    // Wisch-Steuerung: Schiff folgt direkt dem Finger
    player.x = Math.max(player.w / 2, Math.min(CW - player.w / 2, touchX));
  } else {
    const goLeft  = keys['ArrowLeft']  || keys['a'];
    const goRight = keys['ArrowRight'] || keys['d'];
    if (goLeft)  player.x = Math.max(player.w / 2,       player.x - player.speed);
    if (goRight) player.x = Math.min(CW - player.w / 2,  player.x + player.speed);
  }
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

  // Shot-Level über dem Spieler anzeigen
  if (player && player.shotLevel > 1) {
    ctx.save();
    ctx.fillStyle    = 'rgba(58,170,255,.85)';
    ctx.font         = '700 11px Nunito, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`×${player.shotLevel}`, player.x, player.y - player.h / 2 - 4);
    ctx.restore();
  }

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
  gegnerSchiessKooldown = 0;

  if (loopId) cancelAnimationFrame(loopId);
  tick();
  welleSpawnen();
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

// ── Gegner schießen (ab Welle 6, globaler Cooldown) ───────────────────────────
function gegnerSchiessen() {
  if (wave < 6 || !enemies.length) return;

  if (gegnerSchiessKooldown > 0) { gegnerSchiessKooldown--; return; }

  // Zufälligen Gegner auswählen – immer nur EINER schießt auf einmal
  const e = enemies[Math.floor(Math.random() * enemies.length)];
  bullets.push({
    x: e.x, y: e.y + e.h / 2,
    dx: 0, dy: 5 + wave * 0.1,
    w: 4, h: 10,
    color: '#f43f5e',
    type: 'enemy',
  });

  // Cooldown: Welle 6 ≈ 0.8s, steigt mit Welle, Minimum 0.25s (15 Frames)
  gegnerSchiessKooldown = Math.max(15, 65 - wave * 3);
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
function bossSpawnen() {
  const bossNr = wave / 10;
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
    color: `hsl(${(bossNr * 40 + 10) % 360}, 90%, 55%)`,
    alive: true,
    phase: 1,
  };
  bannerZeigen(`BOSS — WELLE ${wave}`, 90);
  hudAktualisieren();
}
function bossUpdate() {
  if (!boss?.alive) return;

  // Bewegung links-rechts
  boss.x += boss.dx * boss.speed;
  if (boss.x + boss.w / 2 >= CW - 10) boss.dx = -1;
  if (boss.x - boss.w / 2 <= 10)      boss.dx =  1;

  // Phase 2 bei 50% HP
  if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) {
    boss.phase     = 2;
    boss.speed    *= 1.5;
    boss.shootRate = Math.max(20, boss.shootRate - 20);
  }

  // Schießen
  boss.shootTimer++;
  if (boss.shootTimer >= boss.shootRate) {
    boss.shootTimer = 0;
    if (boss.phase === 2) {
      bullets.push({ x: boss.x, y: boss.y + boss.h / 2, dx: -1.5, dy: 5, w: 5, h: 12, color: boss.color, type: 'enemy' });
      bullets.push({ x: boss.x, y: boss.y + boss.h / 2, dx:  0,   dy: 6, w: 5, h: 12, color: boss.color, type: 'enemy' });
      bullets.push({ x: boss.x, y: boss.y + boss.h / 2, dx:  1.5, dy: 5, w: 5, h: 12, color: boss.color, type: 'enemy' });
    } else {
      bullets.push({ x: boss.x, y: boss.y + boss.h / 2, dx: 0, dy: 6, w: 5, h: 12, color: boss.color, type: 'enemy' });
    }
  }
}
function bossZeichnen() {
  if (!boss) return;

  // Sieg-Blinken: Boss blinkt nach Tod
  if (!boss.alive) {
    if (bossDeathAnim % 6 < 3) return;
  }

  const { x, y, w, h, hp, maxHp, color } = boss;

  ctx.save();
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 22;

  // Boss-Körper: Hexagon
  ctx.beginPath();
  ctx.moveTo(x,         y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 4);
  ctx.lineTo(x + w / 2, y + h / 4);
  ctx.lineTo(x,         y + h / 2);
  ctx.lineTo(x - w / 2, y + h / 4);
  ctx.lineTo(x - w / 2, y - h / 4);
  ctx.closePath();
  ctx.fill();

  // Inneres Auge
  ctx.fillStyle  = 'rgba(255,255,255,.25)';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, w * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // HP-Balken oben im Spielfeld
  const barW = CW * 0.6;
  const barX = (CW - barW) / 2;
  const barY = HUD_H + PW_H + 5;

  ctx.shadowBlur  = 0;
  ctx.fillStyle   = 'rgba(0,0,0,.5)';
  ctx.fillRect(barX, barY, barW, 8);
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.fillRect(barX, barY, barW * (hp / maxHp), 8);

  ctx.fillStyle    = 'rgba(255,255,255,.8)';
  ctx.shadowBlur   = 0;
  ctx.font         = '700 10px Nunito, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`BOSS  ${Math.max(0, hp)} / ${maxHp}`, CW / 2, barY - 2);

  ctx.restore();
}
function bossTod() {
  boss.alive    = false;
  bossDeathAnim = 90;
  partikelSpawnen(boss.x, boss.y, boss.color, 40);
  bannerZeigen('BOSS BESIEGT! 🎉', 120);

  // Münzen: 20–40
  const anzahl = 20 + Math.floor(Math.random() * 21);
  for (let i = 0; i < anzahl; i++) {
    coins.push({
      x: boss.x + (Math.random() - 0.5) * boss.w,
      y: boss.y + (Math.random() - 0.5) * boss.h,
      vy: 1 + Math.random() * 1.5,
      value: 1,
    });
  }

  score += 500 + (wave / 10) * 200;
  hudAktualisieren();

  setTimeout(() => {
    wave++;
    welleSpawnen();
  }, 2200);
}
// ── Power-Up Konfiguration ────────────────────────────────────────────────────
const PW_CONFIG = {
  shot2:    { label: '×2',    color: '#38bdf8', shotLevel: 2 },
  shot3:    { label: '×3',    color: '#818cf8', shotLevel: 3 },
  shot4:    { label: '×4',    color: '#a78bfa', shotLevel: 4 },
  shot5:    { label: '×5',    color: '#e879f9', shotLevel: 5 },
  fastfire: { label: '⚡',    color: '#fbbf24' },
  laser:    { label: '🔴',    color: '#f472b6' },
  shield:   { label: '◈',     color: '#34d399' },
  heart:    { label: '❤',     color: '#f43f5e' },
};

const PW_POOL = [
  'shot2','shot2','shot3','shot3','shot4','shot5',
  'fastfire','fastfire','laser','shield','shield','heart',
];

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

function partikelZeichnen() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
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

function muenzenSpawnen(x, y) {
  const waveStark = wave >= 6;
  const chance    = waveStark ? 0.35 : 0.08;
  if (Math.random() > chance) return;
  const value = waveStark && Math.random() < 0.4
    ? (Math.random() < 0.5 ? 2 : 3)
    : 1;
  coins.push({ x, y, vy: 1.2 + Math.random() * 0.6, value });
}

function muenzenZeichnen() {
  coins.forEach(c => {
    ctx.save();
    ctx.fillStyle   = '#ffd600';
    ctx.shadowColor = '#ffd600';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    if (c.value > 1) {
      ctx.fillStyle  = '#000';
      ctx.shadowBlur = 0;
      ctx.font       = '700 7px Nunito, sans-serif';
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.value, c.x, c.y);
    }
    ctx.restore();
  });
}

function muenzenUpdate() {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    c.y += c.vy;
    if (c.y > CH + 20) { coins.splice(i, 1); continue; }
    if (player && kollision(c.x, c.y, player.x, player.y, 28, 28)) {
      gameCoins += c.value;
      coins.splice(i, 1);
      hudAktualisieren();
    }
  }
}

function powerupSpawnen(x, y) {
  const type = PW_POOL[Math.floor(Math.random() * PW_POOL.length)];
  const cfg  = PW_CONFIG[type];
  powerups.push({ x, y, vy: 1.5, type, color: cfg.color, label: cfg.label });
}

function powerupsZeichnen() {
  powerups.forEach(p => {
    ctx.save();
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 12;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle    = '#fff';
    ctx.shadowBlur   = 0;
    ctx.font         = '700 9px Nunito, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, p.x, p.y);
    ctx.restore();
  });
}

function powerupsUpdate() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    p.y += p.vy;
    if (p.y > CH + 20) { powerups.splice(i, 1); continue; }
    if (player && kollision(p.x, p.y, player.x, player.y, 36, 36)) {
      powerupAktivieren(p.type);
      powerups.splice(i, 1);
    }
  }
}

function pwDauer() {
  const stufe = pdata.upgrades?.pwDuration || 0;
  const bonus = stufe > 0 ? UPGRADE_DEFS.pwDuration[stufe - 1].bonus : 0;
  return PW_BASE_DURATION + bonus;
}

function powerupAktivieren(type) {
  const cfg = PW_CONFIG[type];
  if (type.startsWith('shot')) {
    // Shot-Level nur erhöhen, nie senken
    if (cfg.shotLevel > player.shotLevel) player.shotLevel = cfg.shotLevel;
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

function pwTimerUpdate() {
  if (activePw.fastFire > 0) activePw.fastFire--;
  if (activePw.laser    > 0) activePw.laser--;
  if (activePw.shield   > 0) activePw.shield--;
  if (activePw.laser    > 0) laserTrefferCheck();
  pwTimerHudAktualisieren();
}

function laserTrefferCheck() {
  if (!player || activePw.laser <= 0) return;
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

function pwTimerHudAktualisieren() {
  const container = document.getElementById('pw-timers');
  if (!container) return;
  const gesamt = pwDauer();
  let html = '';
  if (activePw.fastFire > 0) html += pwTimerHTML('⚡ Schnell', '#fbbf24', activePw.fastFire, gesamt);
  if (activePw.laser    > 0) html += pwTimerHTML('🔴 Laser',  '#f472b6', activePw.laser,    gesamt);
  if (activePw.shield   > 0) html += pwTimerHTML('◈ Schild',  '#34d399', activePw.shield,   gesamt);
  container.innerHTML = html;
}

function pwTimerHTML(label, color, verbleibend, gesamt) {
  const pct = Math.max(0, (verbleibend / gesamt * 100)).toFixed(1);
  const sek = Math.ceil(verbleibend / FPS_TARGET);
  return `<div class="pw-timer-item">
    <span class="pw-timer-label">${label} ${sek}s</span>
    <div class="pw-timer-bar-wrap">
      <div class="pw-timer-bar" style="width:${pct}%;background:${color}"></div>
    </div>
  </div>`;
}

// ── HUD aktualisieren ─────────────────────────────────────────────────────────
function hudAktualisieren() {
  const scoreEl = document.getElementById('hud-score');
  const waveEl  = document.getElementById('hud-wave');
  const coinsEl = document.getElementById('hud-coins');
  const livesEl = document.getElementById('hud-lives-icons');

  if (scoreEl) scoreEl.textContent = score;
  if (waveEl)  waveEl.textContent  = wave;
  if (coinsEl) coinsEl.textContent = gameCoins;

  // Leben als Raumschiff-Symbole (zeigt auch mehr als 3)
  if (livesEl) {
    let html = '';
    for (let i = 0; i < Math.max(lives, 0); i++) {
      html += `<svg class="life-icon" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="7,1 12,13 9.5,10.5 4.5,10.5 2,13" fill="#3af"/>
      </svg>`;
    }
    livesEl.innerHTML = html;
  }
}
// ── Spiel beenden ─────────────────────────────────────────────────────────────
async function spielEnde() {
  running = false;
  if (loopId) cancelAnimationFrame(loopId);

  // Münzen aus dieser Runde permanent addieren
  pdata.coins += gameCoins;

  // Score + Münzen in Supabase speichern
  const user = await PZ.getUser().catch(() => null);
  const loginHint = document.getElementById('go-login-hint');
  if (user) {
    if (loginHint) loginHint.style.display = 'none';
    spielerDatenSpeichern();
  } else {
    if (loginHint) loginHint.style.display = 'block';
  }

  // Titel-Münzanzeige aktualisieren
  titelMuenzenZeigen();

  // Game-Over-Screen befüllen
  const resScore = document.getElementById('res-score');
  const resWave  = document.getElementById('res-wave');
  const resCoins = document.getElementById('res-coins');
  const goWave   = document.getElementById('go-wave');
  if (resScore) resScore.textContent = score;
  if (resWave)  resWave.textContent  = wave;
  if (resCoins) resCoins.textContent = gameCoins;
  if (goWave)   goWave.textContent   = `Welle ${wave} erreicht`;

  screenZeigen('screen-gameover');
}

// ── Shop ──────────────────────────────────────────────────────────────────────
function shop_zeigen() {
  // Vorherigen Screen merken um später zurücknavigieren zu können
  vorherigerScreen = running ? 'screen-gameover' : 'screen-title';
  screenZeigen('screen-shop');
  shopRendern();
}

function shopRendern() {
  const coinsEl = document.getElementById('shop-coins');
  if (coinsEl) coinsEl.textContent = pdata.coins;

  const pwGrid    = document.getElementById('shop-pw-duration');
  const livesGrid = document.getElementById('shop-max-lives');
  if (pwGrid)    pwGrid.innerHTML    = shopKartenHTML('pwDuration', '⏱');
  if (livesGrid) livesGrid.innerHTML = shopKartenHTML('maxLives',   '❤');
}

function shopKartenHTML(key, icon) {
  const stufen  = UPGRADE_DEFS[key];
  const aktuell = pdata.upgrades?.[key] || 0;

  return stufen.map((s, i) => {
    const gekauft  = i < aktuell;
    const istNaechste = i === aktuell;
    const gesperrt = i > aktuell;
    const genugMuenzen = pdata.coins >= s.cost;

    const klass    = gekauft ? 'owned' : gesperrt ? 'locked' : '';
    const btnText  = gekauft  ? '✓ Gekauft'
                   : gesperrt ? '🔒 Gesperrt'
                   : `🪙 ${s.cost}`;
    const btnKlass = (gekauft || gesperrt || !genugMuenzen) ? 'done' : 'buy';
    const disabled = (gekauft || gesperrt) ? 'disabled' : '';
    const desc     = gekauft  ? 'Bereits aktiviert'
                   : gesperrt ? 'Vorherige Stufe kaufen'
                   : `${pdata.coins} Münzen verfügbar`;

    return `<div class="shop-card ${klass}">
      <div class="shop-card-icon">${icon}</div>
      <div class="shop-card-info">
        <div class="shop-card-name">Stufe ${i + 1}: ${s.label}</div>
        <div class="shop-card-desc">${desc}</div>
      </div>
      <button class="shop-card-btn ${btnKlass}" ${disabled}
        onclick="upgradeKaufen('${key}',${i})">${btnText}</button>
    </div>`;
  }).join('');
}

async function upgradeKaufen(key, stufe) {
  const aktuell = pdata.upgrades?.[key] || 0;
  if (stufe !== aktuell) return;   // Muss nächste Stufe sein

  const def = UPGRADE_DEFS[key][stufe];
  if (!def) return;
  if (pdata.coins < def.cost) return;

  pdata.coins          -= def.cost;
  pdata.upgrades[key]   = stufe + 1;

  // Sofort in Supabase sichern
  await spielerDatenSpeichern();

  shopRendern();
  titelMuenzenZeigen();
}

// ── Rangliste ─────────────────────────────────────────────────────────────────
async function rangliste_zeigen() {
  screenZeigen('screen-lb');
  const content = document.getElementById('lb-content');
  if (content) content.innerHTML = '<p style="text-align:center;color:#90a4ae;padding:1.5rem">Lade…</p>';

  try {
    const eintraege = await PZ.getLeaderboard('space-blaster', 10);
    if (content) content.innerHTML = ranglisteHTML(eintraege);
  } catch (_) {
    if (content) content.innerHTML = '<p style="text-align:center;color:#90a4ae;padding:1.5rem">Konnte nicht geladen werden.</p>';
  }
}

function ranglisteHTML(lb) {
  if (!lb?.length) return '<p class="lb-empty">Noch keine Einträge</p>';
  const medalien = ['🥇', '🥈', '🥉'];
  const klassen  = ['g',  's',  'b'];
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
  document.getElementById('btn-shop-back').addEventListener('click', () => screenZeigen(vorherigerScreen));
});
