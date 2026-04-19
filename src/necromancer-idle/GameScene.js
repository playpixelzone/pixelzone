import Phaser from 'phaser';

/**
 * Hintergrund-Szene: Glow, Floating Combat Text am Altar-Klick, Pulse-Tween.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    /** @type {Phaser.GameObjects.Graphics | undefined} */
    this.bgGlow = undefined;
    /** @type {Phaser.GameObjects.Text | undefined} */
    this.hint = undefined;
    /** @type {(e: CustomEvent) => void} */
    this._onAltarFx = (e) => this.#handleAltarFx(e);
  }

  create() {
    this.#layout();
    this.scale.on('resize', this.#layout, this);
    window.addEventListener('necro-altar-fx', this._onAltarFx);
    this.events.once('shutdown', () => {
      window.removeEventListener('necro-altar-fx', this._onAltarFx);
    });
  }

  /**
   * @param {CustomEvent} e
   */
  #handleAltarFx(e) {
    const detail = /** @type {{ clientX: number; clientY: number; label: string }} */ (e.detail);
    if (!detail || typeof detail.clientX !== 'number') return;
    const { x, y } = this.#screenToGame(detail.clientX, detail.clientY);
    this.#spawnFloatingLabel(x, y, detail.label ?? '+1');
    this.#spawnAltarPulse(x, y);
  }

  /**
   * @param {number} screenX
   * @param {number} screenY
   */
  #screenToGame(screenX, screenY) {
    const canvas = this.sys.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const w = this.scale.width;
    const h = this.scale.height;
    const x = ((screenX - rect.left) / rect.width) * w;
    const y = ((screenY - rect.top) / rect.height) * h;
    return { x, y };
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} text
   */
  #spawnFloatingLabel(x, y, text) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        color: '#39ff14',
        stroke: '#0d0d12',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(120);

    this.tweens.add({
      targets: t,
      y: y - 72,
      alpha: 0,
      duration: 780,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  #spawnAltarPulse(x, y) {
    const container = this.add.container(x, y).setDepth(100);

    const ring = this.add.graphics();
    ring.fillStyle(0x8b0000, 0.35);
    ring.fillCircle(0, 0, 36);
    ring.lineStyle(2, 0x39ff14, 0.5);
    ring.strokeCircle(0, 0, 38);
    container.add(ring);

    const rune = this.add
      .text(0, 0, '⛧', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#8b0000',
      })
      .setOrigin(0.5);

    container.add(rune);
    container.setScale(0.92, 1.08);

    this.tweens.add({
      targets: container,
      scaleX: 1.12,
      scaleY: 0.88,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 70,
          ease: 'Quad.easeInOut',
          onComplete: () => container.destroy(),
        });
      },
    });
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
