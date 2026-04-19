import Phaser from 'phaser';

/**
 * Hintergrund-Szene: Canvas füllt den Viewport, dezente Gothic-Vibe-Optik.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.#layout();
    this.scale.on('resize', this.#layout, this);
  }

  #layout = () => {
    const { width, height } = this.scale;

    if (this.bgGlow) this.bgGlow.destroy();
    this.bgGlow = this.add.graphics();
    const cx = width * 0.5;
    const cy = height * 0.45;
    this.bgGlow.fillStyle(0x8b0000, 0.06);
    this.bgGlow.fillCircle(cx, cy, Math.min(width, height) * 0.55);
    this.bgGlow.fillStyle(0x39ff14, 0.03);
    this.bgGlow.fillCircle(cx * 1.1, cy * 1.05, Math.min(width, height) * 0.35);
    this.bgGlow.setDepth(0);

    if (this.hint) this.hint.destroy();
    this.hint = this.add
      .text(cx, height - 28, '◆ Phaser 3 · Hintergrund-Canvas ◆', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '13px',
        color: '#39ff14',
      })
      .setOrigin(0.5)
      .setAlpha(0.35)
      .setDepth(1);
  };
}
