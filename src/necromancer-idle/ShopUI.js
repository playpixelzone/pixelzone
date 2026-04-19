import {
  GameState,
  addBones,
  buyUpgrade,
  canAffordUpgrade,
  formatGameNumber,
  formatRate,
  getBonesPerClick,
  getBonesPerSecond,
  getUpgradeCurrentPrice,
  getUpgradeLevel,
} from './GameState.js';
import { UPGRADE_DEFINITIONS } from './upgrades.js';

/** Shop-Definitionen (Re-Export, Daten liegen in upgrades.js). */
export { UPGRADE_DEFINITIONS };

/**
 * Shop-DOM: dynamische Buttons, Preis 1.15^level, Sync via Events.
 */
export function initShopUI() {
  const ppsHost = document.getElementById('shop-pps');
  const ppcHost = document.getElementById('shop-ppc');
  if (!ppsHost || !ppcHost) {
    console.warn('#shop-pps / #shop-ppc fehlt');
    return;
  }

  /** @type {Map<string, HTMLButtonElement>} */
  const buttons = new Map();

  function buildShop() {
    ppsHost.innerHTML = '';
    ppcHost.innerHTML = '';

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

      btn.addEventListener('click', () => {
        buyUpgrade(def.id);
      });
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

  function refreshAll() {
    refreshStats();
    refreshShopButtons();
  }

  buildShop();

  document.addEventListener('necro-state-changed', refreshAll);
  setInterval(refreshAll, 1000);

  initAltar();
  refreshAll();
}

function initAltar() {
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
    const bpc = getBonesPerClick();
    addBones(bpc);
    fireFx(e.clientX, e.clientY, `+${formatGameNumber(bpc)}`);
  };

  altar?.addEventListener('click', onActivate);
  altar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const bpc = getBonesPerClick();
      addBones(bpc);
      const r = altar.getBoundingClientRect();
      fireFx(r.left + r.width / 2, r.top + r.height / 2, `+${formatGameNumber(bpc)}`);
    }
  });
}
