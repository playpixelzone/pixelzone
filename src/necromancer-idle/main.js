import Phaser from 'phaser';
import { GameScene } from './GameScene.js';
import {
  GameState,
  cheatGrantResources,
  loadGameAsync,
  performPrestige,
  saveGame,
  startPassiveLoop,
  canPrestigeNow,
} from './GameState.js';
import { initShopUI } from './ShopUI.js';
import { initExpeditionSystem } from './ExpeditionSystem.js';
import { AudioManager } from './AudioManager.js';

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
  throw new Error('#phaser-mount fehlt in necromancer-idle.html');
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
  initTabNavigation();

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
