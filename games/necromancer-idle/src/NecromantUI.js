import {
  GameState,
  formatGameNumber,
  getNecroStatValue,
  upgradeStat,
} from './GameState.js';

const BASE_STAT_DEFS = [
  { id: 'atk', icon: '⚔️', label: 'Angriffskraft', unit: 'ATK', decimals: 0 },
  { id: 'hp', icon: '❤️', label: 'Lebenspunkte', unit: 'HP', decimals: 0 },
  { id: 'hpRegen', icon: '💚', label: 'Leben pro Sekunde', unit: 'HP/s', decimals: 1 },
];

function formatStatValue(value, decimals = 0) {
  if (!Number.isFinite(value)) return '0';
  if (decimals > 0) return Number(value).toFixed(decimals);
  return formatGameNumber(Math.floor(value));
}

function setupTabs() {
  const tabButtons = [...document.querySelectorAll('.tab-btn[data-tab]')];
  const panels = [...document.querySelectorAll('.tab-panel[data-panel]')];
  const activate = (tabId) => {
    for (const btn of tabButtons) {
      const on = btn.dataset.tab === tabId;
      btn.classList.toggle('tab-btn--active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.panel !== tabId;
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => activate(btn.dataset.tab || 'nekromant'));
  });
  activate('nekromant');
}

function buildStatRow(def) {
  const row = document.createElement('div');
  row.className = 'necro-stat-row';
  row.dataset.statId = def.id;

  const icon = document.createElement('div');
  icon.className = 'necro-stat-icon';
  icon.textContent = def.icon;

  const meta = document.createElement('div');
  meta.className = 'necro-stat-meta';
  const title = document.createElement('div');
  title.className = 'necro-stat-title';
  const value = document.createElement('div');
  value.className = 'necro-stat-value';
  meta.appendChild(title);
  meta.appendChild(value);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'necro-upgrade-btn';
  btn.addEventListener('click', () => {
    if (upgradeStat(def.id)) {
      refreshCurrency();
      refreshStats();
    }
  });

  row.appendChild(icon);
  row.appendChild(meta);
  row.appendChild(btn);
  return row;
}

function refreshCurrency() {
  const bonesEl = document.getElementById('stat-bones');
  const soulEl = document.getElementById('stat-soulstones');
  if (bonesEl) bonesEl.textContent = formatGameNumber(GameState.bones);
  if (soulEl) soulEl.textContent = formatGameNumber(GameState.soulstones);
}

function refreshStats() {
  for (const def of BASE_STAT_DEFS) {
    const row = document.querySelector(`.necro-stat-row[data-stat-id="${def.id}"]`);
    const stat = GameState.necroBaseStats[def.id];
    if (!row || !stat) continue;
    const title = row.querySelector('.necro-stat-title');
    const value = row.querySelector('.necro-stat-value');
    const btn = row.querySelector('.necro-upgrade-btn');
    if (!(title instanceof HTMLElement) || !(value instanceof HTMLElement) || !(btn instanceof HTMLButtonElement)) {
      continue;
    }
    const bonus = getNecroStatValue(def.id);
    title.textContent = `${def.label} · Lv. ${stat.level}`;
    value.textContent = `${formatStatValue(bonus, def.decimals)} ${def.unit}`;
    btn.textContent = `${formatGameNumber(stat.cost)} 🦴`;
    btn.disabled = GameState.bones < stat.cost;
  }
}

export function initNecromantUI() {
  setupTabs();
  const host = document.getElementById('necro-stats-list');
  if (!host) return;
  host.innerHTML = '';
  for (const def of BASE_STAT_DEFS) {
    host.appendChild(buildStatRow(def));
  }
  refreshCurrency();
  refreshStats();
  document.addEventListener('necro-state-changed', () => {
    refreshCurrency();
    refreshStats();
  });
}
