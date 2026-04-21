import {
  BUILDING_MILESTONE_LEVELS,
  GameState,
  addBones,
  buyUpgrade,
  getUpgradeBpsMultiplier,
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
  isUpgradeDiscovered,
  tryRegisterClick,
  getNextRasereiPayoutMult,
} from './GameState.js';
import { UPGRADE_DEFINITIONS } from './upgrades.js';
import { SHOP_ASSET_BASE, UPGRADE_ICON_PATHS } from './shopIcons.js';

/** Shop-Definitionen (Re-Export, Daten liegen in upgrades.js). */
export { UPGRADE_DEFINITIONS };

const MYSTERY_SHOP_TOOLTIP =
  'Klicke ein anderes Gebäude, um dieses Geheimnis zu lüften.';

function getNextMilestone(level) {
  for (const threshold of BUILDING_MILESTONE_LEVELS) {
    if (level < threshold) return threshold;
  }
  return null;
}

function getCurrentMilestoneFloor(level) {
  let floor = 0;
  for (const threshold of BUILDING_MILESTONE_LEVELS) {
    if (level >= threshold) floor = threshold;
  }
  return floor;
}

/**
 * Statischer Basiswert aus den Daten (ohne Dimensionen, Skills, Artefakte).
 * @param {import('./upgrades.js').UpgradeDef} def
 */
function basePerLevelLine(def) {
  if (def.type === 'PPS') {
    return `+${formatRate(def.perLevel)} BpS pro Stufe (Basis)`;
  }
  return `+${formatRate(def.perLevel)} Knochen pro Klick pro Stufe (Basis)`;
}

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
  /** @type {Map<string, HTMLElement>} */
  const titleEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const baseEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const priceEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const iconEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const milestoneTextEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const milestoneFillEls = new Map();

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

  function flashMilestoneRow(id) {
    const row = rows.get(id);
    if (!row) return;
    row.classList.remove('shop-item--milestone-glow');
    void row.offsetWidth;
    row.classList.add('shop-item--milestone-glow');
    const done = () => row.classList.remove('shop-item--milestone-glow');
    row.addEventListener('animationend', done, { once: true });
  }

  function buildShop() {
    ppsHost.innerHTML = '';
    ppcHost.innerHTML = '';
    rows.clear();
    buttons.clear();
    badges.clear();
    titleEls.clear();
    baseEls.clear();
    priceEls.clear();
    iconEls.clear();
    milestoneTextEls.clear();
    milestoneFillEls.clear();

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

      const icon = document.createElement('span');
      icon.className = 'shop-item-icon';
      icon.setAttribute('aria-hidden', 'true');

      const iconImg = document.createElement('img');
      iconImg.className = 'shop-item-icon-img';
      iconImg.alt = '';
      iconImg.decoding = 'async';
      iconImg.width = 32;
      iconImg.height = 32;
      iconImg.src = new URL(UPGRADE_ICON_PATHS[def.id], SHOP_ASSET_BASE).href;

      const iconMystery = document.createElement('span');
      iconMystery.className = 'shop-item-icon-mystery';
      iconMystery.textContent = '?';

      icon.appendChild(iconImg);
      icon.appendChild(iconMystery);

      const col = document.createElement('div');
      col.className = 'shop-buy-btn__col';

      const title = document.createElement('span');
      title.className = 'shop-item-title';
      title.textContent = def.name;

      const meta = document.createElement('span');
      meta.className = 'shop-item-meta';

      const base = document.createElement('span');
      base.className = 'shop-item-base';
      base.textContent = basePerLevelLine(def);

      const price = document.createElement('span');
      price.className = 'shop-item-price';

      const milestone = document.createElement('div');
      milestone.className = 'shop-item-milestone';

      const milestoneText = document.createElement('span');
      milestoneText.className = 'shop-item-milestone-text';

      const milestoneTrack = document.createElement('span');
      milestoneTrack.className = 'shop-item-milestone-track';
      const milestoneFill = document.createElement('span');
      milestoneFill.className = 'shop-item-milestone-fill';
      milestoneTrack.appendChild(milestoneFill);

      milestone.appendChild(milestoneText);
      milestone.appendChild(milestoneTrack);

      meta.appendChild(base);
      meta.appendChild(price);
      meta.appendChild(milestone);
      col.appendChild(title);
      col.appendChild(meta);
      btn.appendChild(icon);
      btn.appendChild(col);
      row.appendChild(badge);
      row.appendChild(btn);
      host.appendChild(row);

      buttons.set(def.id, btn);
      rows.set(def.id, row);
      badges.set(def.id, badge);
      titleEls.set(def.id, title);
      baseEls.set(def.id, base);
      priceEls.set(def.id, price);
      iconEls.set(def.id, icon);
      milestoneTextEls.set(def.id, milestoneText);
      milestoneFillEls.set(def.id, milestoneFill);

      btn.addEventListener('click', () => {
        if (buyUpgrade(def.id)) {
          audio.playBuySound();
          flashRow(def.id);
        }
      });

      row.addEventListener('mouseenter', (e) => {
        if (!tooltipEl) return;
        const discovered = isUpgradeDiscovered(def.id);
        if (!discovered) {
          tooltipEl.hidden = false;
          tooltipEl.textContent = MYSTERY_SHOP_TOOLTIP;
          positionTooltip(e);
          return;
        }
        const lore = def.lore ?? '';
        if (!lore) {
          tooltipEl.hidden = true;
          return;
        }
        tooltipEl.hidden = false;
        tooltipEl.textContent = lore;
        positionTooltip(e);
      });
      row.addEventListener('mousemove', positionTooltip);
      row.addEventListener('mouseleave', () => {
        if (tooltipEl) tooltipEl.hidden = true;
      });
    }
  }

  function refreshShopButtons() {
    for (const def of UPGRADE_DEFINITIONS) {
      const btn = buttons.get(def.id);
      const badge = badges.get(def.id);
      const row = rows.get(def.id);
      const titleEl = titleEls.get(def.id);
      const baseEl = baseEls.get(def.id);
      const priceEl = priceEls.get(def.id);
      const iconWrap = iconEls.get(def.id);
      const iconImg = iconWrap?.querySelector('.shop-item-icon-img');
      const iconMystery = iconWrap?.querySelector('.shop-item-icon-mystery');
      if (!btn) continue;

      const discovered = isUpgradeDiscovered(def.id);
      const lv = getUpgradeLevel(def.id);
      const price = getUpgradeCurrentPrice(def.id);
      const afford = canAffordUpgrade(def.id);

      if (row) row.classList.toggle('shop-item--undiscovered', !discovered);
      if (badge) badge.textContent = `Lv ${lv}`;

      if (titleEl) titleEl.textContent = discovered ? def.name : '???';
      if (baseEl) baseEl.textContent = discovered ? basePerLevelLine(def) : '???';
      if (priceEl) {
        priceEl.textContent = discovered ? `${formatGameNumber(price)} 🦴` : '???';
      }
      if (iconImg) iconImg.hidden = !discovered;
      if (iconMystery) iconMystery.hidden = discovered;

      const milestoneTextEl = milestoneTextEls.get(def.id);
      const milestoneFillEl = milestoneFillEls.get(def.id);
      if (milestoneTextEl && milestoneFillEl) {
        if (!discovered) {
          milestoneTextEl.textContent = 'Nächster Bonus bei ???';
          milestoneFillEl.style.width = '0%';
        } else {
          const nextMilestone = getNextMilestone(lv);
          if (nextMilestone === null) {
            milestoneTextEl.textContent = `Alle Meilensteine erreicht (${formatGameNumber(getUpgradeBpsMultiplier(def.id))}x)`;
            milestoneFillEl.style.width = '100%';
          } else {
            milestoneTextEl.textContent = `Nächster Bonus bei Lv. ${nextMilestone}`;
            const floor = getCurrentMilestoneFloor(lv);
            const range = Math.max(1, nextMilestone - floor);
            const progress = Math.max(0, Math.min(1, (lv - floor) / range));
            milestoneFillEl.style.width = `${(progress * 100).toFixed(2)}%`;
          }
        }
      }

      btn.classList.toggle('disabled', !afford);
      btn.disabled = !afford;
    }
  }

  function refreshStats() {
    const bonesEl = document.getElementById('stat-bones');
    const bpsEl = document.getElementById('stat-bps');
    const bpcEl = document.getElementById('stat-bpc');
    const essEl = document.getElementById('stat-essence');
    if (bonesEl) bonesEl.textContent = formatGameNumber(GameState.bones);
    if (bpsEl) bpsEl.textContent = formatRate(getBonesPerSecond());
    if (bpcEl) bpcEl.textContent = formatGameNumber(getBonesPerClick());
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

  try {
    buildShop();
  } catch (err) {
    console.error('[Necro] buildShop fehlgeschlagen', err);
  }

  document.addEventListener('necro-state-changed', refreshAll);
  document.addEventListener('necro-milestone-reached', (e) => {
    const detail = /** @type {{ id?: string }} */ (e.detail ?? {});
    if (!detail.id) return;
    flashMilestoneRow(detail.id);
    if (typeof audio.playMilestoneSound === 'function') {
      audio.playMilestoneSound();
    }
  });
  setInterval(refreshAll, 1000);

  initAltar(audio);
  initPrestigeButton();
  refreshAll();
}

function initPrestigeButton() {
  const btn = document.getElementById('btn-prestige');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!canPrestigeNow()) return;
    document.dispatchEvent(new CustomEvent('necro-prestige-start'));
  });
}

/**
 * @param {import('./AudioManager.js').AudioManager} audio
 */
function initAltar(audio) {
  const altar = document.getElementById('altar-click');
  if (!altar) {
    console.warn('[Necro] #altar-click fehlt — Klick-Altar deaktiviert');
    return;
  }
  const glyph = altar.querySelector('.glyph');
  const hint = altar.querySelector('.hint');
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
    altar.classList.add('altar--rate-warn');
    glyph?.classList.add('glyph--warn');
    window.setTimeout(() => {
      altar.classList.remove('altar--rate-warn');
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
    const rMult = getNextRasereiPayoutMult();
    const gained = bpc * rMult;
    addBones(gained);
    const label = rMult >= 2 ? `+${formatGameNumber(gained)} (Raserei×2!)` : `+${formatGameNumber(gained)}`;
    fireFx(e.clientX, e.clientY, label);
  };

  altar.addEventListener('click', onActivate);
  altar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!tryRegisterClick()) {
        warnRateLimit();
        return;
      }
      audio.playClickSound();
      const bpc = getBonesPerClick();
      const rMult = getNextRasereiPayoutMult();
      const gained = bpc * rMult;
      addBones(gained);
      const r = altar.getBoundingClientRect();
      const label = rMult >= 2 ? `+${formatGameNumber(gained)} (×2)` : `+${formatGameNumber(gained)}`;
      fireFx(r.left + r.width / 2, r.top + r.height / 2, label);
    }
  });
}
