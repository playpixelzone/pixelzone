import Phaser from 'phaser';
import { GameScene } from './GameScene.js';
import { GameState } from './GameState.js';
import { initShopUI } from './ShopUI.js';
import { initExpeditionSystem } from './ExpeditionSystem.js';

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

new Phaser.Game(config);

initShopUI();
initExpeditionSystem();

/** Für spätere Module / Konsole */
export { GameState };
