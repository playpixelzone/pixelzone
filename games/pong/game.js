'use strict';

const CANVAS_W = 800;
const CANVAS_H = 480;
const PADDLE_W = 14;
const PADDLE_H = 96;
const BALL_SIZE = 14;
const TARGET_SCORE = 7;

const DIFFICULTIES = {
  easy: { label: 'Einfach', botSpeed: 260, reaction: 0.22, error: 44, maxAngle: 0.85 },
  medium: { label: 'Mittel', botSpeed: 340, reaction: 0.14, error: 24, maxAngle: 1.0 },
  hard: { label: 'Schwer', botSpeed: 440, reaction: 0.06, error: 8, maxAngle: 1.12 },
};

const DIFF_GAME_KEYS = {
  easy: 'pong-easy',
  medium: 'pong-medium',
  hard: 'pong-hard',
};

const state = {
  mode: null,
  difficulty: 'easy',
  running: false,
  finished: false,
  winner: null,
  userId: null,
  username: null,
  roomId: null,
  roomCode: null,
  channel: null,
  currentRoom: null,
  isHost: false,
  lastRoomSyncAt: 0,
  keyUp: false,
  keyDown: false,
  pointerY: null,
  aiThinkAt: 0,
  aiTarget: CANVAS_H / 2,
  hostSyncAt: 0,
  guestPaddleSyncAt: 0,
  hostSyncInFlight: false,
  guestSyncInFlight: false,
  lastTs: 0,
  game: createBaseGameState(),
};

const canvas = document.getElementById('pong-canvas');
const ctx = canvas.getContext('2d');

function $(id) { return document.getElementById(id); }

function createBaseGameState() {
  // Ausgangslage für jede neue Runde (Single + Multiplayer)
  return {
    leftY: CANVAS_H / 2 - PADDLE_H / 2,
    rightY: CANVAS_H / 2 - PADDLE_H / 2,
    ballX: CANVAS_W / 2 - BALL_SIZE / 2,
    ballY: CANVAS_H / 2 - BALL_SIZE / 2,
    ballVx: 300,
    ballVy: 140,
    leftScore: 0,
    rightScore: 0,
  };
}

function showScreen(id) {
  ['screen-gate', 'screen-home', 'screen-single', 'screen-leaderboard', 'screen-multi', 'screen-lobby', 'screen-game', 'screen-finish'].forEach((screenId) => {
    $(screenId).classList.toggle('hidden', screenId !== id);
  });
}

function setDifficulty(diff) {
  state.difficulty = diff;
  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.diff === diff);
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetBall(toRight = true) {
  // Ball wird nach jedem Punkt in die Mitte gesetzt
  state.game.ballX = CANVAS_W / 2 - BALL_SIZE / 2;
  state.game.ballY = CANVAS_H / 2 - BALL_SIZE / 2;
  const speedX = 300 + Math.random() * 40;
  const speedY = (Math.random() * 220 - 110);
  state.game.ballVx = toRight ? speedX : -speedX;
  state.game.ballVy = speedY;
}

function startSingleplayer() {
  state.mode = 'single';
  state.finished = false;
  state.winner = null;
  state.running = true;
  state.game = createBaseGameState();
  resetBall(Math.random() > 0.5);
  $('game-mode-label').textContent = `Singleplayer · ${DIFFICULTIES[state.difficulty].label}`;
  $('target-score').textContent = String(TARGET_SCORE);
  $('multi-status').classList.add('hidden');
  showScreen('screen-game');
}

function finishRound(winner) {
  state.running = false;
  state.finished = true;
  state.winner = winner;
  $('finish-title').textContent = winner === 'left' ? 'Du hast gewonnen! 🎉' : (winner === 'right' ? 'Du hast verloren' : 'Runde beendet');
  $('finish-sub').textContent = `${state.game.leftScore} : ${state.game.rightScore}`;
  $('rematch-state').textContent = '';
  showScreen('screen-finish');
}

async function saveSingleScore() {
  if (!state.userId) return;
  const gameKey = DIFF_GAME_KEYS[state.difficulty];
  await PZ.saveGameData(gameKey, state.game.leftScore, 1, {
    gegnerPunkte: state.game.rightScore,
    modus: 'singleplayer',
    schwierigkeit: state.difficulty,
  });
  await loadSingleLeaderboard();
}

function renderLeaderboardRows(entries) {
  if (!entries.length) return '<p class="hint">Noch keine Einträge.</p>';
  return entries.map((entry, idx) => {
    const name = entry.benutzername || 'Anonym';
    return `<div class="leaderboard-row"><span class="leaderboard-name"><span class="lb-rank">${idx + 1}.</span>${escapeHtml(name)}</span><strong>${entry.punkte}</strong></div>`;
  }).join('');
}

async function loadSingleLeaderboard() {
  const gameKey = DIFF_GAME_KEYS[state.difficulty];
  const entries = await PZ.getLeaderboard(gameKey, 10);
  return entries || [];
}

async function loadDifficultyBoards() {
  const [easy, medium, hard] = await Promise.all([
    PZ.getLeaderboard(DIFF_GAME_KEYS.easy, 10),
    PZ.getLeaderboard(DIFF_GAME_KEYS.medium, 10),
    PZ.getLeaderboard(DIFF_GAME_KEYS.hard, 10),
  ]);
  $('board-easy').innerHTML = renderLeaderboardRows(easy || []);
  $('board-medium').innerHTML = renderLeaderboardRows(medium || []);
  $('board-hard').innerHTML = renderLeaderboardRows(hard || []);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function drawGame() {
  const g = state.game;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#f8fbff';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = '#cddcff';
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 12);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 12);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#3767d4';
  ctx.fillRect(26, g.leftY, PADDLE_W, PADDLE_H);
  ctx.fillRect(CANVAS_W - 26 - PADDLE_W, g.rightY, PADDLE_W, PADDLE_H);

  ctx.fillStyle = '#ff6f91';
  ctx.fillRect(g.ballX, g.ballY, BALL_SIZE, BALL_SIZE);

  $('score-left').textContent = String(g.leftScore);
  $('score-right').textContent = String(g.rightScore);
}

function updateLocalPlayer(dt) {
  const speed = 460;
  if (state.pointerY !== null) {
    state.game.leftY += clamp(state.pointerY - (state.game.leftY + PADDLE_H / 2), -speed * dt, speed * dt);
  } else {
    if (state.keyUp) state.game.leftY -= speed * dt;
    if (state.keyDown) state.game.leftY += speed * dt;
  }
  state.game.leftY = clamp(state.game.leftY, 0, CANVAS_H - PADDLE_H);
}

function updateAi(dt) {
  // KI denkt in Intervallen, damit "Einfach" und "Mittel" menschlicher wirken
  const cfg = DIFFICULTIES[state.difficulty];
  if (performance.now() >= state.aiThinkAt) {
    state.aiThinkAt = performance.now() + cfg.reaction * 1000;
    const jitter = (Math.random() * 2 - 1) * cfg.error;
    state.aiTarget = clamp(state.game.ballY + BALL_SIZE / 2 + jitter, PADDLE_H / 2, CANVAS_H - PADDLE_H / 2);
  }
  const rightCenter = state.game.rightY + PADDLE_H / 2;
  const delta = state.aiTarget - rightCenter;
  state.game.rightY += clamp(delta, -cfg.botSpeed * dt, cfg.botSpeed * dt);
  state.game.rightY = clamp(state.game.rightY, 0, CANVAS_H - PADDLE_H);
}

function bounceFromPaddle(isLeft) {
  // Je näher am Paddle-Rand getroffen wird, desto steiler der Winkel
  const g = state.game;
  const paddleY = isLeft ? g.leftY : g.rightY;
  const paddleX = isLeft ? 26 : CANVAS_W - 26 - PADDLE_W;
  const ballCenterY = g.ballY + BALL_SIZE / 2;
  const paddleCenterY = paddleY + PADDLE_H / 2;
  const rel = clamp((ballCenterY - paddleCenterY) / (PADDLE_H / 2), -1, 1);
  const diffCfg = DIFFICULTIES[state.difficulty];
  const maxAngle = diffCfg.maxAngle;
  const speed = clamp(Math.hypot(g.ballVx, g.ballVy) * 1.03, 260, 720);
  const angle = rel * maxAngle;
  const dir = isLeft ? 1 : -1;

  g.ballVx = Math.cos(angle) * speed * dir;
  g.ballVy = Math.sin(angle) * speed;
  g.ballX = isLeft ? paddleX + PADDLE_W + 1 : paddleX - BALL_SIZE - 1;
}

function simulateBall(dt) {
  const g = state.game;
  g.ballX += g.ballVx * dt;
  g.ballY += g.ballVy * dt;

  if (g.ballY <= 0) {
    g.ballY = 0;
    g.ballVy *= -1;
  } else if (g.ballY + BALL_SIZE >= CANVAS_H) {
    g.ballY = CANVAS_H - BALL_SIZE;
    g.ballVy *= -1;
  }

  const leftX = 26;
  const rightX = CANVAS_W - 26 - PADDLE_W;
  const hitLeft = g.ballX <= leftX + PADDLE_W && g.ballX >= leftX && g.ballY + BALL_SIZE >= g.leftY && g.ballY <= g.leftY + PADDLE_H && g.ballVx < 0;
  const hitRight = g.ballX + BALL_SIZE >= rightX && g.ballX + BALL_SIZE <= rightX + PADDLE_W && g.ballY + BALL_SIZE >= g.rightY && g.ballY <= g.rightY + PADDLE_H && g.ballVx > 0;
  if (hitLeft) bounceFromPaddle(true);
  if (hitRight) bounceFromPaddle(false);

  if (g.ballX + BALL_SIZE < 0) {
    g.rightScore += 1;
    if (g.rightScore >= TARGET_SCORE) {
      finishRound('right');
      if (state.mode === 'multi' && state.isHost) hostFinishMatch('right');
      return;
    }
    resetBall(true);
  } else if (g.ballX > CANVAS_W) {
    g.leftScore += 1;
    if (g.leftScore >= TARGET_SCORE) {
      finishRound('left');
      if (state.mode === 'single') saveSingleScore();
      if (state.mode === 'multi' && state.isHost) hostFinishMatch('left');
      return;
    }
    resetBall(false);
  }
}

async function createRoom() {
  $('multi-home-msg').textContent = '';
  if (!state.userId) return;
  const code = generateCode();
  const { data, error } = await PZ.db.from('pong_rooms').insert({
    code,
    host_user_id: state.userId,
    status: 'lobby',
  }).select().single();
  if (error || !data) {
    $('multi-home-msg').textContent = error?.message || 'Raum konnte nicht erstellt werden.';
    return;
  }
  state.roomId = data.id;
  state.roomCode = data.code;
  state.isHost = true;
  state.currentRoom = data;
  await subscribeRoom();
  await syncRoomAndLobby();
  showScreen('screen-lobby');
}

async function joinRoom() {
  const rawCode = $('join-code-input').value.replace(/\D/g, '').slice(0, 6);
  $('multi-home-msg').textContent = '';
  if (rawCode.length !== 6) {
    $('multi-home-msg').textContent = 'Bitte 6 Ziffern eingeben.';
    return;
  }
  const { data: room, error } = await PZ.db.from('pong_rooms').select('*').eq('code', rawCode).maybeSingle();
  if (error || !room) {
    $('multi-home-msg').textContent = 'Raum nicht gefunden.';
    return;
  }
  if (room.guest_user_id && room.guest_user_id !== state.userId) {
    $('multi-home-msg').textContent = 'Raum ist bereits voll.';
    return;
  }
  if (room.host_user_id === state.userId) {
    state.isHost = true;
  } else {
    const { error: joinError } = await PZ.db.from('pong_rooms').update({
      guest_user_id: state.userId,
      guest_ready: false,
      status: 'lobby',
    }).eq('id', room.id).is('guest_user_id', null).eq('status', 'lobby');
    if (joinError) {
      $('multi-home-msg').textContent = joinError.message;
      return;
    }
    state.isHost = false;
  }
  state.roomId = room.id;
  state.roomCode = room.code;
  await subscribeRoom();
  await syncRoomAndLobby();
  showScreen('screen-lobby');
}

function generateCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) code += String(Math.floor(Math.random() * 10));
  return code;
}

async function fetchRoom() {
  if (!state.roomId) return null;
  const { data } = await PZ.db.from('pong_rooms').select('*').eq('id', state.roomId).maybeSingle();
  return data || null;
}

async function syncRoomAndLobby(roomSnapshot = null) {
  const room = roomSnapshot || await fetchRoom();
  if (!room) {
    leaveRoomLocal();
    return;
  }
  state.currentRoom = room;
  state.isHost = room.host_user_id === state.userId;
  $('room-code-display').textContent = room.code || '------';

  if (room.status === 'lobby') {
    await renderLobbyPlayers(room);
    showScreen('screen-lobby');
    $('lobby-hint').textContent = room.guest_user_id ? 'Beide Spieler da. Host kann starten.' : 'Warte auf zweiten Spieler ...';
    $('btn-start-multi').classList.toggle('hidden', !state.isHost);
  } else if (room.status === 'playing') {
    // Während der Runde bleiben beide Spieler im gleichen Raum
    startMultiplayerFromRoom(room);
  } else if (room.status === 'finished') {
    onMultiplayerFinished(room);
  }
}

async function renderLobbyPlayers(room) {
  const ids = [room.host_user_id, room.guest_user_id].filter(Boolean);
  const names = {};
  for (const userId of ids) {
    names[userId] = await PZ.getUsername(userId) || 'Spieler';
  }
  const html = ids.map((userId, idx) => {
    const tag = idx === 0 ? '<span class="host-tag">Host</span>' : '<span class="host-tag">Gast</span>';
    return `<div class="player-item"><span>${escapeHtml(names[userId])}</span>${tag}</div>`;
  }).join('');
  $('lobby-player-list').innerHTML = html || '<p class="hint">Noch keine Spieler im Raum.</p>';
}

async function startMultiplayerByHost() {
  const room = await fetchRoom();
  if (!room || !state.isHost) return;
  if (!room.guest_user_id) {
    $('lobby-hint').textContent = 'Du brauchst einen zweiten Spieler.';
    return;
  }
  const base = createBaseGameState();
  const { error } = await PZ.db.from('pong_rooms').update({
    status: 'playing',
    host_score: 0,
    guest_score: 0,
    host_paddle_y: base.leftY,
    guest_paddle_y: base.rightY,
    ball_x: base.ballX,
    ball_y: base.ballY,
    ball_vx: 300,
    ball_vy: 120,
    winner_side: null,
    host_ready: false,
    guest_ready: false,
  }).eq('id', room.id).eq('host_user_id', state.userId);
  if (error) $('lobby-hint').textContent = error.message;
}

function applyRoomToLocal(room) {
  if (!room) return;
  const g = state.game;
  g.leftY = room.host_paddle_y ?? g.leftY;
  g.rightY = room.guest_paddle_y ?? g.rightY;
  g.ballX = room.ball_x ?? g.ballX;
  g.ballY = room.ball_y ?? g.ballY;
  g.ballVx = room.ball_vx ?? g.ballVx;
  g.ballVy = room.ball_vy ?? g.ballVy;
  g.leftScore = room.host_score ?? g.leftScore;
  g.rightScore = room.guest_score ?? g.rightScore;
}

function startMultiplayerFromRoom(room) {
  state.mode = 'multi';
  state.running = true;
  state.finished = false;
  state.winner = null;
  if (!$('screen-game').classList.contains('hidden')) {
    applyRoomToLocal(room);
  } else {
    state.game = createBaseGameState();
    applyRoomToLocal(room);
    showScreen('screen-game');
  }
  $('game-mode-label').textContent = `Multiplayer · ${state.isHost ? 'Host (links)' : 'Gast (rechts)'}`;
  $('target-score').textContent = String(TARGET_SCORE);
  $('multi-status').classList.remove('hidden');
  $('multi-status').textContent = state.isHost ? 'Du bist Host und synchronisierst Ball + Score.' : 'Du bist Gast. Host synchronisiert den Ball.';
}

function onMultiplayerFinished(room) {
  state.running = false;
  state.finished = true;
  applyRoomToLocal(room);
  const winner = room.winner_side;
  const leftWins = winner === 'left';
  const playerWon = (state.isHost && leftWins) || (!state.isHost && !leftWins);
  $('finish-title').textContent = playerWon ? 'Du hast gewonnen! 🎉' : 'Du hast verloren';
  $('finish-sub').textContent = `${state.game.leftScore} : ${state.game.rightScore}`;
  $('rematch-state').textContent = waitingRematchText(room);
  showScreen('screen-finish');
}

function waitingRematchText(room) {
  const meReady = state.isHost ? room.host_ready : room.guest_ready;
  const otherReady = state.isHost ? room.guest_ready : room.host_ready;
  if (meReady && otherReady) return 'Rematch startet ...';
  if (meReady) return 'Warte auf den anderen Spieler für Rematch ...';
  return 'Klicke auf "Nochmal spielen", um im Raum zu bleiben.';
}

async function requestRematch() {
  if (!state.currentRoom || state.currentRoom.status !== 'finished') return;
  const patch = state.isHost ? { host_ready: true } : { guest_ready: true };
  await PZ.db.from('pong_rooms').update(patch).eq('id', state.roomId);
  const room = await fetchRoom();
  if (room && room.host_ready && room.guest_ready && state.isHost) {
    // Host setzt dieselbe Lobby direkt wieder auf "playing" (beide bleiben im Raum)
    const base = createBaseGameState();
    await PZ.db.from('pong_rooms').update({
      status: 'playing',
      host_score: 0,
      guest_score: 0,
      host_paddle_y: base.leftY,
      guest_paddle_y: base.rightY,
      ball_x: base.ballX,
      ball_y: base.ballY,
      ball_vx: 300,
      ball_vy: -120,
      winner_side: null,
      host_ready: false,
      guest_ready: false,
    }).eq('id', state.roomId).eq('host_user_id', state.userId);
  } else if (room) {
    $('rematch-state').textContent = waitingRematchText(room);
  }
}

async function hostFinishMatch(winnerSide) {
  await PZ.db.from('pong_rooms').update({
    status: 'finished',
    host_score: state.game.leftScore,
    guest_score: state.game.rightScore,
    winner_side: winnerSide,
    host_ready: false,
    guest_ready: false,
    ball_x: state.game.ballX,
    ball_y: state.game.ballY,
    ball_vx: state.game.ballVx,
    ball_vy: state.game.ballVy,
    host_paddle_y: state.game.leftY,
    guest_paddle_y: state.game.rightY,
  }).eq('id', state.roomId).eq('host_user_id', state.userId);
}

async function leaveRoom() {
  if (!state.roomId) return;
  if (state.isHost) {
    await PZ.db.from('pong_rooms').update({ status: 'closed' }).eq('id', state.roomId).eq('host_user_id', state.userId);
  } else {
    await PZ.db.from('pong_rooms').update({
      guest_user_id: null,
      guest_ready: false,
      status: state.currentRoom?.status === 'playing' ? 'finished' : 'lobby',
      winner_side: state.currentRoom?.status === 'playing' ? 'left' : state.currentRoom?.winner_side,
    }).eq('id', state.roomId).eq('guest_user_id', state.userId);
  }
  leaveRoomLocal();
}

function leaveRoomLocal() {
  if (state.channel) {
    state.channel.unsubscribe();
    state.channel = null;
  }
  state.roomId = null;
  state.roomCode = null;
  state.currentRoom = null;
  state.isHost = false;
  state.running = false;
  state.finished = false;
  state.mode = null;
  state.game = createBaseGameState();
  showScreen('screen-home');
}

async function subscribeRoom() {
  if (state.channel) state.channel.unsubscribe();
  state.channel = PZ.db.channel(`pong-${state.roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pong_rooms', filter: `id=eq.${state.roomId}` }, async (payload) => {
      // Realtime-Payload direkt nutzen, um zusätzliche Fetch-Roundtrips zu vermeiden
      const room = payload?.new || null;
      await syncRoomAndLobby(room);
    })
    .subscribe();
}

function updateMultiplayerPaddle(dt) {
  const speed = 460;
  if (state.pointerY !== null) {
    const target = state.pointerY - PADDLE_H / 2;
    if (state.isHost) {
      state.game.leftY += clamp(target - state.game.leftY, -speed * dt, speed * dt);
      state.game.leftY = clamp(state.game.leftY, 0, CANVAS_H - PADDLE_H);
    } else {
      state.game.rightY += clamp(target - state.game.rightY, -speed * dt, speed * dt);
      state.game.rightY = clamp(state.game.rightY, 0, CANVAS_H - PADDLE_H);
    }
  } else if (state.isHost) {
    if (state.keyUp) state.game.leftY -= speed * dt;
    if (state.keyDown) state.game.leftY += speed * dt;
    state.game.leftY = clamp(state.game.leftY, 0, CANVAS_H - PADDLE_H);
  } else {
    if (state.keyUp) state.game.rightY -= speed * dt;
    if (state.keyDown) state.game.rightY += speed * dt;
    state.game.rightY = clamp(state.game.rightY, 0, CANVAS_H - PADDLE_H);
  }
}

async function syncMultiplayerToDb() {
  // Host ist autoritativ für Ball + Score, Gast sendet nur eigenes Paddle
  if (!state.currentRoom || state.currentRoom.status !== 'playing') return;
  const now = performance.now();
  if (state.isHost && !state.hostSyncInFlight && now - state.hostSyncAt > 90) {
    state.hostSyncAt = now;
    state.hostSyncInFlight = true;
    try {
      await PZ.db.from('pong_rooms').update({
        host_score: state.game.leftScore,
        guest_score: state.game.rightScore,
        host_paddle_y: state.game.leftY,
        // Wichtig: guest_paddle_y wird nur vom Gast geschrieben, sonst überschreibt Host dessen Input
        ball_x: state.game.ballX,
        ball_y: state.game.ballY,
        ball_vx: state.game.ballVx,
        ball_vy: state.game.ballVy,
      }).eq('id', state.roomId).eq('host_user_id', state.userId);
    } finally {
      state.hostSyncInFlight = false;
    }
  } else if (!state.isHost && !state.guestSyncInFlight && now - state.guestPaddleSyncAt > 75) {
    state.guestPaddleSyncAt = now;
    state.guestSyncInFlight = true;
    try {
      await PZ.db.from('pong_rooms').update({
        guest_paddle_y: state.game.rightY,
      }).eq('id', state.roomId).eq('guest_user_id', state.userId);
    } finally {
      state.guestSyncInFlight = false;
    }
  }
}

function gameLoop(ts) {
  if (!state.lastTs) state.lastTs = ts;
  const dt = Math.min((ts - state.lastTs) / 1000, 0.033);
  state.lastTs = ts;

  if (state.running) {
    if (state.mode === 'single') {
      updateLocalPlayer(dt);
      updateAi(dt);
      simulateBall(dt);
    } else if (state.mode === 'multi') {
      updateMultiplayerPaddle(dt);
      if (state.isHost) simulateBall(dt);
      syncMultiplayerToDb().catch(() => {});
    }
  }

  drawGame();
  requestAnimationFrame(gameLoop);
}

function bindEvents() {
  $('btn-mode-single').addEventListener('click', async () => {
    showScreen('screen-single');
  });
  $('btn-mode-board').addEventListener('click', async () => {
    showScreen('screen-leaderboard');
    await loadDifficultyBoards();
  });
  $('btn-mode-multi').addEventListener('click', () => showScreen('screen-multi'));
  $('btn-back-single').addEventListener('click', () => showScreen('screen-home'));
  $('btn-back-multi').addEventListener('click', () => showScreen('screen-home'));
  $('btn-back-board').addEventListener('click', () => showScreen('screen-home'));
  $('btn-refresh-board').addEventListener('click', loadDifficultyBoards);

  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      setDifficulty(btn.dataset.diff);
    });
  });
  $('btn-start-single').addEventListener('click', startSingleplayer);

  $('btn-toggle-join').addEventListener('click', () => $('join-row').classList.toggle('hidden'));
  $('btn-create-room').addEventListener('click', createRoom);
  $('btn-join-room').addEventListener('click', joinRoom);
  $('btn-start-multi').addEventListener('click', startMultiplayerByHost);
  $('btn-leave-room').addEventListener('click', leaveRoom);

  $('btn-restart').addEventListener('click', async () => {
    if (state.mode === 'single') {
      startSingleplayer();
    } else if (state.mode === 'multi') {
      await requestRematch();
    }
  });

  $('btn-finish-home').addEventListener('click', async () => {
    if (state.mode === 'multi') await leaveRoom();
    showScreen('screen-home');
    state.mode = null;
    state.running = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'w' || event.key === 'ArrowUp') state.keyUp = true;
    if (event.key === 's' || event.key === 'ArrowDown') state.keyDown = true;
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'ArrowUp') state.keyUp = false;
    if (event.key === 's' || event.key === 'ArrowDown') state.keyDown = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_H;
    state.pointerY = clamp(y, 0, CANVAS_H);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_H;
    state.pointerY = clamp(y, 0, CANVAS_H);
  });
  canvas.addEventListener('pointerleave', () => {
    state.pointerY = null;
  });
  // iPad/Safari-Fallback: falls Pointer Events nicht sauber feuern, direkt Touch-Events nutzen
  canvas.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_H;
    state.pointerY = clamp(y, 0, CANVAS_H);
    event.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((touch.clientY - rect.top) / rect.height) * CANVAS_H;
    state.pointerY = clamp(y, 0, CANVAS_H);
    event.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    state.pointerY = null;
  });
  canvas.addEventListener('touchcancel', () => {
    state.pointerY = null;
  });
}

async function init() {
  await PZ.updateNavbar();
  const session = await PZ.getSession();
  state.userId = session?.user?.id || null;
  state.username = state.userId ? (await PZ.getUsername(state.userId)) : null;
  if (!state.userId) {
    showScreen('screen-gate');
    const back = encodeURIComponent(location.href);
    $('login-link').href = `../../login.html?back=${back}`;
  } else {
    showScreen('screen-home');
  }

  setDifficulty('easy');
  bindEvents();
  requestAnimationFrame(gameLoop);
}

init();
