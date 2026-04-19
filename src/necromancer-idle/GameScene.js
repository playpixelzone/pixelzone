import Phaser from 'phaser';
import { getBonesPerSecond } from './GameState.js';

/**
 * Hintergrund-Szene: Partikel, Idle-Glow (BpS), Floating Text, Pulse.
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    /** @type {Phaser.GameObjects.Graphics | undefined} */
    this.bgGlow = undefined;
    /** @type {Phaser.GameObjects.Text | undefined} */
    this.hint = undefined;
    /** @type {Phaser.GameObjects.Arc | undefined} */
    this.idleGlowOrb = undefined;
    /** @type {Phaser.GameObjects.Particles.ParticleEmitter | undefined} */
    this.boneEmitter = undefined;
    /** @type {Phaser.Tweens.Tween | undefined} */
    this.idleGlowTween = undefined;
    /** @type {(e: CustomEvent) => void} */
    this._onAltarFx = (e) => this.#handleAltarFx(e);
    /** @type {(e: CustomEvent) => void} */
    this._onState = () => this.#refreshIdleGlowTween();
  }

  create() {
    this.#createBoneTexture();
    this.#layout();
    this.#createBoneEmitter();
    this.#refreshIdleGlowTween();

    this.scale.on('resize', () => {
      this.#layout();
      this.#refreshIdleGlowTween();
    });

    window.addEventListener('necro-altar-fx', this._onAltarFx);
    window.addEventListener('necro-state-changed', this._onState);

    this.events.once('shutdown', () => {
      window.removeEventListener('necro-altar-fx', this._onAltarFx);
      window.removeEventListener('necro-state-changed', this._onState);
      if (this.idleGlowTween) this.idleGlowTween.stop();
    });
  }

  #createBoneTexture() {
    if (this.textures.exists('bonePixel')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xf5f5f5, 1);
    g.fillRect(0, 0, 5, 5);
    g.generateTexture('bonePixel', 5, 5);
    g.destroy();
  }

  #createBoneEmitter() {
    if (this.boneEmitter) {
      this.boneEmitter.destroy();
      this.boneEmitter = undefined;
    }
    this.boneEmitter = this.add.particles(0, 0, 'bonePixel', {
      lifespan: { min: 650, max: 1000 },
      speed: { min: 90, max: 340 },
      angle: { min: 0, max: 360 },
      gravityY: 540,
      scale: { start: 1, end: 0.12 },
      alpha: { start: 0.95, end: 0.05 },
      rotate: { min: -180, max: 180 },
      emitting: false,
      blendMode: Phaser.BlendModes.ADD,
      quantity: 0,
    });
    this.boneEmitter.setDepth(110);
  }

  /**
   * @param {CustomEvent} e
   */
  #handleAltarFx(e) {
    const detail = /** @type {{ clientX: number; clientY: number; label: string }} */ (e.detail);
    if (!detail || typeof detail.clientX !== 'number') return;
    const { x, y } = this.#screenToGame(detail.clientX, detail.clientY);
    this.#spawnBoneBurst(x, y);
    this.#spawnFloatingLabel(x, y, detail.label ?? '+1');
    this.#spawnAltarPulse(x, y);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  #spawnBoneBurst(x, y) {
    if (!this.boneEmitter) return;
    this.boneEmitter.explode(20, x, y);
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

  #refreshIdleGlowTween() {
    if (this.idleGlowTween) {
      this.idleGlowTween.stop();
      this.idleGlowTween = undefined;
    }
    if (!this.idleGlowOrb) return;

    const bps = getBonesPerSecond();
    const intensity = Math.min(1, bps / 75);
    const alphaHi = 0.07 + intensity * 0.38;
    const alphaLo = Math.max(0.03, alphaHi * 0.35);
    const duration = Math.max(700, 2400 - Math.min(1200, bps * 8));

    this.idleGlowOrb.setAlpha(alphaLo);
    this.idleGlowTween = this.tweens.add({
      targets: this.idleGlowOrb,
      alpha: alphaHi,
      scaleX: 1.06 + intensity * 0.1,
      scaleY: 1.06 + intensity * 0.1,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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

    const ax = width * 0.22;
    const ay = height * 0.48;

    if (this.idleGlowOrb) this.idleGlowOrb.destroy();
    this.idleGlowOrb = this.add.circle(ax, ay, Math.min(width, height) * 0.14, 0x39ff14, 0.1);
    this.idleGlowOrb.setStrokeStyle(2, 0x39ff14, 0.25);
    this.idleGlowOrb.setBlendMode(Phaser.BlendModes.ADD);
    this.idleGlowOrb.setDepth(5);

    if (this.hint) this.hint.destroy();
    this.hint = this.add
      .text(cx, height - 28, '◆ Phaser 3 · Knochen-Partikel & Nekromanten-Glow ◆', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '13px',
        color: '#39ff14',
      })
      .setOrigin(0.5)
      .setAlpha(0.3)
      .setDepth(1);

    if (this.boneEmitter) {
      this.boneEmitter.setDepth(110);
    }
  };
}
