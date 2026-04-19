import {
  GameState,
  addBones,
  buyUpgrade,
  canAffordUpgrade,
  canPrestigeNow,
  formatGameNumber,
  formatRate,
  getBonesPerClick,
  getBonesPerSecond,
  getPrestigeBoneTarget,
  getPrestigeProgressPercent,
  getUpgradeCurrentPrice,
  getUpgradeLevel,
  tryRegisterClick,
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
  /** @type {Map<string, HTMLElement>} */
  const badges = new Map();

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
    badges.clear();

    for (const def of UPGRADE_DEFINITIONS) {
      const host = def.type === 'PPS' ? ppsHost : ppcHost;
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.dataset.upgradeId = def.id;

      const badge = document.createElement('span');
      badge.className = 'shop-level-badge';
      badge.textContent = 'Lv 0';

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
      row.appendChild(badge);
      row.appendChild(btn);
      host.appendChild(row);

      buttons.set(def.id, btn);
      rows.set(def.id, row);
      badges.set(def.id, badge);

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
      const badge = badges.get(def.id);
      if (!btn) continue;
      const lv = getUpgradeLevel(def.id);
      const price = getUpgradeCurrentPrice(def.id);
      const afford = canAffordUpgrade(def.id);

      if (badge) badge.textContent = `Lv ${lv}`;

      const priceEl = btn.querySelector('.shop-item-price');
      if (priceEl) {
        priceEl.textContent = `${formatGameNumber(price)} 🦴`;
      }

      btn.classList.toggle('disabled', !afford);
      btn.disabled = !afford;
    }
  }

  function refreshStats() {
    const bonesEl = document.getElementById('stat-bones');
    const bpsEl = document.getElementById('stat-bps');
    const essEl = document.getElementById('stat-essence');
    if (bonesEl) bonesEl.textContent = formatGameNumber(GameState.bones);
    if (bpsEl) bpsEl.textContent = formatRate(getBonesPerSecond());
    if (essEl) essEl.textContent = formatGameNumber(GameState.worldEssence);
  }

  function refreshPrestigeBar() {
    const fill = document.getElementById('prestige-bar-fill');
    const text = document.getElementById('prestige-bar-text');
    const pct = getPrestigeProgressPercent();
    if (fill) fill.style.width = `${pct}%`;
    if (text) {
      text.textContent = `Dim ${GameState.dimensionsCompleted + 1}: ${formatGameNumber(GameState.bones)} / ${formatGameNumber(
        getPrestigeBoneTarget(),
      )} 🦴`;
    }

    const btn = document.getElementById('btn-prestige');
    if (btn) {
      const ready = canPrestigeNow();
      btn.disabled = !ready;
      btn.classList.toggle('btn-prestige--ready', ready);
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
  initPrestigeButton();
  refreshAll();
}

function initPrestigeButton() {
  const btn = document.getElementById('btn-prestige');
  btn?.addEventListener('click', () => {
    if (!canPrestigeNow()) return;
    document.dispatchEvent(new CustomEvent('necro-prestige-start'));
  });
}

/**
 * @param {import('./AudioManager.js').AudioManager} audio
 */
function initAltar(audio) {
  const altar = document.getElementById('altar-click');
  const glyph = altar?.querySelector('.glyph');
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

  const warnRateLimit = () => {
    console.warn('[Necro] Klicklimit: höchstens 15 Klicks pro Sekunde.');
    altar?.classList.add('altar--rate-warn');
    glyph?.classList.add('glyph--warn');
    window.setTimeout(() => {
      altar?.classList.remove('altar--rate-warn');
      glyph?.classList.remove('glyph--warn');
    }, 220);
  };

  const onActivate = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (!tryRegisterClick()) {
      warnRateLimit();
      return;
    }
    audio.playClickSound();
    const bpc = getBonesPerClick();
    addBones(bpc);
    fireFx(e.clientX, e.clientY, `+${formatGameNumber(bpc)}`);
  };

  altar?.addEventListener('click', onActivate);
  altar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!tryRegisterClick()) {
        warnRateLimit();
        return;
      }
      audio.playClickSound();
      const bpc = getBonesPerClick();
      addBones(bpc);
      const r = altar.getBoundingClientRect();
      fireFx(r.left + r.width / 2, r.top + r.height / 2, `+${formatGameNumber(bpc)}`);
    }
  });
}
