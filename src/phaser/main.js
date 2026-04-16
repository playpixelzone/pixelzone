import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';

const container = document.getElementById('game-container');
if (!container) {
  throw new Error('#game-container fehlt in phaser-sandbox.html');
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 480,
  height: 320,
  backgroundColor: '#e8f0fe',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
};

new Phaser.Game(config);
