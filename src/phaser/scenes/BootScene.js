import Phaser from 'phaser';

/**
 * Minimale Demo-Szene – Startpunkt für neue Phaser-Spiele unter src/phaser/.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 24, 'PIXELZONE', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '28px',
        color: '#1a1a2e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 22, 'Phaser 3 + Vite — Sandbox', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#3d4f6f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 40, 'Neue Spielszenen hier als eigene Klassen anlegen.', {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#6b7a96',
      })
      .setOrigin(0.5);
  }
}
