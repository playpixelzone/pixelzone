import {
  GameState,
  addBones,
  buyUpgrade,
  canAffordUpgrade,
  formatGameNumber,
  formatRate,
  getBonesPerClick,
  getBonesPerSecond,
  getPrestigeBoneTarget,
  getPrestigeProgressPercent,
  getUpgradeCurrentPrice,
  getUpgradeLevel,
} from './GameState.js';
import { UPGRADE_DEFINITIONS } from './upgrades.js';

/** Shop-Definitionen (Re-Export, Daten liegen in upgrades.js). */
export { UPGRADE_DEFINITIONS };

/**
 * @param {import('./AudioManager.js').AudioManager} audio
 */
export function initShopUI(audio) {
  const ppsHost = document.getElementById('shop-pps');
  const ppcHost = document.getElementById('shop-ppc');
  const tooltipEl = document.getElementById('shop-tooltip');

  if (!ppsHost || !ppcHost) {
    console.warn('#shop-pps / #shop-ppc fehlt');
    return;
  }

  /** @type {Map<string, HTMLButtonElement>} */
  const buttons = new Map();
  /** @type {Map<string, HTMLElement>} */
  const rows = new Map();

  function positionTooltip(/** @type {MouseEvent} */ e) {
    if (!tooltipEl || tooltipEl.hidden) return;
    const pad = 14;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - pad;
    tooltipEl.style.left = `${Math.max(8, x)}px`;
    tooltipEl.style.top = `${Math.max(8, y)}px`;
  }

  function flashRow(id) {
    const row = rows.get(id);
    if (!row) return;
    row.classList.remove('shop-item--flash');
    void row.offsetWidth;
    row.classList.add('shop-item--flash');
    const done = () => row.classList.remove('shop-item--flash');
    row.addEventListener('animationend', done, { once: true });
  }

  function buildShop() {
    ppsHost.innerHTML = '';
    ppcHost.innerHTML = '';
    rows.clear();
    buttons.clear();

    for (const def of UPGRADE_DEFINITIONS) {
      const host = def.type === 'PPS' ? ppsHost : ppcHost;
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.dataset.upgradeId = def.id;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-buy-btn';
      btn.dataset.upgradeId = def.id;

      const title = document.createElement('span');
      title.className = 'shop-item-title';
      title.textContent = def.name;

      const meta = document.createElement('span');
      meta.className = 'shop-item-meta';

      const price = document.createElement('span');
      price.className = 'shop-item-price';

      meta.appendChild(price);
      btn.appendChild(title);
      btn.appendChild(meta);
      row.appendChild(btn);
      host.appendChild(row);

      buttons.set(def.id, btn);
      rows.set(def.id, row);

      btn.addEventListener('click', () => {
        if (buyUpgrade(def.id)) {
          audio.playBuySound();
          flashRow(def.id);
        }
      });

      const lore = def.lore ?? '';
      if (tooltipEl && lore) {
        row.addEventListener('mouseenter', (e) => {
          tooltipEl.hidden = false;
          tooltipEl.textContent = lore;
          positionTooltip(e);
        });
        row.addEventListener('mousemove', positionTooltip);
        row.addEventListener('mouseleave', () => {
          tooltipEl.hidden = true;
        });
      }
    }
  }

  function refreshShopButtons() {
    for (const def of UPGRADE_DEFINITIONS) {
      const btn = buttons.get(def.id);
      if (!btn) continue;
      const lv = getUpgradeLevel(def.id);
      const price = getUpgradeCurrentPrice(def.id);
      const afford = canAffordUpgrade(def.id);

      const priceEl = btn.querySelector('.shop-item-price');
      if (priceEl) {
        priceEl.textContent = `Lv ${lv} · ${formatGameNumber(price)} 🦴`;
      }

      btn.classList.toggle('disabled', !afford);
      btn.disabled = !afford;
    }
  }

  function refreshStats() {
    const bonesEl = document.getElementById('stat-bones');
    const bpsEl = document.getElementById('stat-bps');
    if (bonesEl) bonesEl.textContent = formatGameNumber(GameState.bones);
    if (bpsEl) bpsEl.textContent = formatRate(getBonesPerSecond());
  }

  function refreshPrestigeBar() {
    const fill = document.getElementById('prestige-bar-fill');
    const text = document.getElementById('prestige-bar-text');
    const pct = getPrestigeProgressPercent();
    if (fill) fill.style.width = `${pct}%`;
    if (text) {
      text.textContent = `${formatGameNumber(GameState.bones)} / ${formatGameNumber(
        getPrestigeBoneTarget(),
      )} 🦴 · nächste Dimension`;
    }
  }

  function refreshAll() {
    refreshStats();
    refreshShopButtons();
    refreshPrestigeBar();
  }

  buildShop();

  document.addEventListener('necro-state-changed', refreshAll);
  setInterval(refreshAll, 1000);

  initAltar(audio);
  refreshAll();
}

/**
 * @param {import('./AudioManager.js').AudioManager} audio
 */
function initAltar(audio) {
  const altar = document.getElementById('altar-click');
  const hint = altar?.querySelector('.hint');
  if (hint) {
    hint.textContent = 'Klicke, um Knochen zu sammeln';
  }

  const fireFx = (clientX, clientY, label) => {
    document.dispatchEvent(
      new CustomEvent('necro-altar-fx', {
        detail: { clientX, clientY, label },
      }),
    );
  };

  const onActivate = (e) => {
    if (e.button != null && e.button !== 0) return;
    audio.playClickSound();
    const bpc = getBonesPerClick();
    addBones(bpc);
    fireFx(e.clientX, e.clientY, `+${formatGameNumber(bpc)}`);
  };

  altar?.addEventListener('click', onActivate);
  altar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      audio.playClickSound();
      const bpc = getBonesPerClick();
      addBones(bpc);
      const r = altar.getBoundingClientRect();
      fireFx(r.left + r.width / 2, r.top + r.height / 2, `+${formatGameNumber(bpc)}`);
    }
  });
}
