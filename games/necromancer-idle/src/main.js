import Phaser from 'phaser';
import { GameScene } from './GameScene.js';
import {
  GameState,
  cheatGrantResources,
  collectPendingOfflineProgress,
  formatGameNumber,
  getPendingOfflineProgress,
  loadGameAsync,
  performPrestige,
  saveGame,
  saveGameLocal,
  saveToSupabase,
  setNecromancerAdminSandbox,
  startPassiveLoop,
  canPrestigeNow,
} from './GameState.js';
import { initShopUI } from './ShopUI.js';
import { initExpeditionSystem } from './ExpeditionSystem.js';
import { initSkillTreeUI } from './SkillTreeUI.js';
import { AudioManager } from './AudioManager.js';

function initOfflineProgressModal() {
  const modal = document.getElementById('offline-modal');
  const bonesEl = document.getElementById('offline-modal-bones');
  if (!modal || !bonesEl) return;

  const pending = getPendingOfflineProgress();
  if (!pending || pending.bones <= 0) return;

  bonesEl.textContent = Intl.NumberFormat('de-DE', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(pending.bones);
  modal.hidden = false;

  const collectBtn = document.getElementById('offline-modal-collect');
  if (!collectBtn) return;

  collectBtn.onclick = () => {
    const offlineBones = getPendingOfflineProgress().bones;
    if (offlineBones <= 0) {
      modal.remove();
      return;
    }
    console.log('Offline Knochen eingesammelt:', offlineBones);
    collectPendingOfflineProgress();

    const statBones = document.getElementById('stat-bones');
    if (statBones) statBones.textContent = formatGameNumber(GameState.bones);

    void (async () => {
      const cloud = await saveToSupabase();
      if (!cloud) {
        saveGameLocal();
      } else {
        document.dispatchEvent(new CustomEvent('necro-game-saved'));
      }
      modal.remove();
    })();
  };
}

function initTabNavigation() {
  const tabs = [
    { btn: document.getElementById('tab-friedhof'), panel: document.getElementById('panel-friedhof') },
    { btn: document.getElementById('tab-expedition'), panel: document.getElementById('panel-expedition') },
    { btn: document.getElementById('tab-unterwelt'), panel: document.getElementById('panel-unterwelt') },
  ];

  const activate = (index) => {
    tabs.forEach((t, i) => {
      const on = i === index;
      if (!t.btn || !t.panel) return;
      t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
      t.btn.classList.toggle('tab-btn--active', on);
      t.btn.tabIndex = on ? 0 : -1;
      t.panel.hidden = !on;
      t.panel.classList.toggle('tab-panel--hidden', !on);
    });
  };

  tabs.forEach((t, i) => {
    t.btn?.addEventListener('click', () => activate(i));
  });
}

const mount = document.getElementById('phaser-mount');
if (!mount) {
  throw new Error('#phaser-mount fehlt in games/necromancer-idle/index.html');
}

const config = {
  type: Phaser.AUTO,
  parent: mount,
  backgroundColor: '#0d0d12',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [GameScene],
};

void (async function bootstrap() {
  const adminTest =
    typeof URLSearchParams !== 'undefined' && new URLSearchParams(window.location.search).has('admin');
  setNecromancerAdminSandbox(adminTest);

  const PZ = globalThis.PZ;
  if (PZ && typeof PZ.pruefeSpielStatus === 'function') {
    await PZ.pruefeSpielStatus('necromancer-idle');
  }

  await loadGameAsync();

  new Phaser.Game(config);

  const audio = new AudioManager();

  startPassiveLoop();
  initShopUI(audio);
  initExpeditionSystem();
  initSkillTreeUI();
  initTabNavigation();
  initOfflineProgressModal();

  let saveToastTimer = 0;
  document.addEventListener('necro-game-saved', () => {
    const el = document.getElementById('save-toast');
    if (!el) return;
    el.textContent = 'Fortschritt gespeichert';
    el.classList.add('visible');
    window.clearTimeout(saveToastTimer);
    saveToastTimer = window.setTimeout(() => {
      el.classList.remove('visible');
    }, 2200);
  });

  let prestigeBusy = false;
  document.addEventListener('necro-prestige-start', () => {
    if (prestigeBusy || !canPrestigeNow()) return;
    prestigeBusy = true;
    const ov = document.getElementById('prestige-overlay');
    document.body.style.transition = 'opacity 0.55s ease, filter 0.55s ease';
    document.body.style.filter = 'brightness(0.08)';
    ov?.classList.add('prestige-overlay--visible');

    window.setTimeout(() => {
      void (async () => {
        try {
          if (canPrestigeNow()) {
            performPrestige();
          }
        } catch (err) {
          console.error('[Necro] performPrestige', err);
        }
        try {
          await saveGame();
        } catch (err) {
          console.error('[Necro] saveGame', err);
        } finally {
          document.body.style.filter = '';
          document.body.style.transition = '';
          ov?.classList.remove('prestige-overlay--visible');
          prestigeBusy = false;
        }
      })();
    }, 780);
  });

  window.setInterval(() => {
    saveGame();
  }, 30000);

  if (PZ && typeof PZ.adminPanelErstellen === 'function') {
    await PZ.adminPanelErstellen([
      {
        label: '+100.000 Knochen',
        onClick: () => {
          cheatGrantResources({ bones: 100000 });
          void saveGame();
        },
      },
      {
        label: '+1 Mio. Knochen',
        onClick: () => {
          cheatGrantResources({ bones: 1_000_000 });
          void saveGame();
        },
      },
      {
        label: '+500 Welten-Essenz',
        onClick: () => {
          cheatGrantResources({ worldEssence: 500 });
          void saveGame();
        },
      },
    ]);
  }
})();

export { GameState };
