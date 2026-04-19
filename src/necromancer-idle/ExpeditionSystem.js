import {
  GameState,
  formatGameNumber,
  getExpeditionDurationSeconds,
  recruitEliteUnit,
  startExpedition,
} from './GameState.js';
import { ARTIFACT_DEFS, ELITE_UNITS } from './expeditionData.js';

/** @param {number} secondsLeft */
function formatCountdownMMSS(secondsLeft) {
  const s = Math.max(0, Math.ceil(secondsLeft));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function renderArtifacts(listEl) {
  if (!listEl) return;
  listEl.replaceChildren();
  const owned = GameState.artifactsOwned;
  let any = false;
  for (const def of ARTIFACT_DEFS) {
    const n = Math.max(0, Math.floor(owned[def.id] ?? 0));
    if (n <= 0) continue;
    any = true;
    const li = document.createElement('li');
    li.className = 'artifact-row';
    li.innerHTML = `<span class="artifact-name">${def.name}</span><span class="artifact-meta">×${n}</span><span class="artifact-desc">${def.description}</span>`;
    listEl.appendChild(li);
  }
  if (!any) {
    const li = document.createElement('li');
    li.className = 'artifact-empty';
    li.textContent = 'Noch keine Artefakte.';
    listEl.appendChild(li);
  }
}

/**
 * Expedition: HTML/CSS (Darkest-Dungeon-Anmutung), kein Phaser.
 */
export function initExpeditionSystem() {
  const armyEl = document.getElementById('expedition-army-count');
  const btnRecruit = document.getElementById('btn-recruit-elite');
  const btnStart = document.getElementById('btn-expedition-start');
  const barFill = document.getElementById('expedition-bar-fill');
  const barWrap = document.getElementById('expedition-bar-wrap');
  const statusEl = document.getElementById('expedition-raid-status');
  const logEl = document.getElementById('expedition-log');
  const listEl = document.getElementById('artifact-list');

  /** @type {number | undefined} */
  let rafId;

  function appendLog(line) {
    if (!logEl) return;
    const row = document.createElement('div');
    row.className = 'expedition-log-line';
    row.textContent = line;
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function appendLogLootHtml(innerHtml) {
    if (!logEl) return;
    const row = document.createElement('div');
    row.className = 'expedition-log-line expedition-log-line--loot';
    row.innerHTML = innerHtml;
    logEl.appendChild(row);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function syncBar() {
    const es = GameState.expeditionState;
    const p = Math.max(0, Math.min(100, es.explorationProgress));
    const durSec = getExpeditionDurationSeconds();
    if (barFill) barFill.style.width = `${p}%`;
    if (barWrap) barWrap.setAttribute('aria-valuenow', String(Math.round(p)));
    if (statusEl) {
      if (es.running) {
        const remainingSec = (durSec * (100 - p)) / 100;
        const mmss = formatCountdownMMSS(remainingSec);
        statusEl.textContent = `Plünderung… ${mmss} verbleibend`;
      } else {
        statusEl.textContent = `Bereit zum Zug. (Dauer pro Plünderung ${formatCountdownMMSS(durSec)})`;
      }
    }
  }

  function loopBar() {
    syncBar();
    if (GameState.expeditionState.running) {
      rafId = requestAnimationFrame(loopBar);
    }
  }

  function refresh() {
    const u = ELITE_UNITS[0];
    const count = Math.max(0, Math.floor(GameState.expeditionState.activeUnits[u.id] ?? 0));
    const running = GameState.expeditionState.running;

    if (armyEl) armyEl.textContent = String(count);

    if (btnRecruit) {
      const afford = GameState.bones >= u.boneCost && !running;
      btnRecruit.disabled = !afford;
      btnRecruit.textContent = `Skelett-Krieger rekrutieren (Kosten: ${formatGameNumber(u.boneCost)} Knochen)`;
    }

    if (btnStart) {
      btnStart.disabled = running || count <= 0;
      btnStart.textContent = running ? 'Plünderung läuft…' : 'Plünderung starten';
    }

    syncBar();
    if (running && rafId == null) {
      rafId = requestAnimationFrame(() => {
        rafId = undefined;
        loopBar();
      });
    }
    if (!running && rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = undefined;
    }

    renderArtifacts(listEl);
  }

  refresh();

  document.addEventListener('necro-state-changed', refresh);

  document.addEventListener('necro-expedition-complete', (e) => {
    const d = /** @type {CustomEvent} */ (e).detail;
    if (!d) return;
    const { lost, survived, loot } = d;
    if (loot && loot.itemName) {
      appendLogLootHtml(
        `Beute: <span class="loot-tag" style="color:${loot.color}">[${loot.label}]</span> <span class="loot-name" style="color:${loot.color}">${loot.itemName}</span>`,
      );
    }
    if (lost > 0) {
      appendLog(`Die Plünderung endet. ${lost} Skelette sind zu Staub zerfallen, ${survived} kehren ins Lager zurück.`);
    } else {
      appendLog(`Die Plünderung endet. ${survived} Skelette kehren wohlbehalten zurück.`);
    }
  });

  btnRecruit?.addEventListener('click', () => {
    const u = ELITE_UNITS[0];
    if (u) recruitEliteUnit(u.id);
  });

  btnStart?.addEventListener('click', () => {
    if (!startExpedition()) return;
    appendLog('> Skelette betreten das Dorf…');
    window.setTimeout(() => appendLog('> Kampf beginnt!'), 450);
  });
}
