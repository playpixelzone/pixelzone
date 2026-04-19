import Phaser from 'phaser';
import { GameScene } from './GameScene.js';
import { GameState, loadGame, saveGame, startPassiveLoop } from './GameState.js';
import { initShopUI } from './ShopUI.js';
import { initExpeditionSystem } from './ExpeditionSystem.js';
import { AudioManager } from './AudioManager.js';

const mount = document.getElementById('phaser-mount');
if (!mount) {
  throw new Error('#phaser-mount fehlt in necromancer-idle.html');
}

loadGame();

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

window.setInterval(() => {
  saveGame();
}, 30000);

export { GameState };
