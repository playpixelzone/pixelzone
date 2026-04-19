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

  document.addEventListener('necro-prestige-start', () => {
    const ov = document.getElementById('prestige-overlay');
    ov?.classList.add('prestige-overlay--visible');
  });

  document.addEventListener('necro-prestige-animation-end', async () => {
    if (canPrestigeNow()) {
      performPrestige();
    }
    await saveGame();
    const ov = document.getElementById('prestige-overlay');
    ov?.classList.remove('prestige-overlay--visible');
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
