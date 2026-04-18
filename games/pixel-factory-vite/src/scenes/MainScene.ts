import * as Phaser from "phaser";
import { fmtPps } from "../core/format";
import { gameState } from "../core/GameState";
import { syncHud } from "../ui/hud";

export class MainScene extends Phaser.Scene {
  private clickTarget!: Phaser.GameObjects.Image;
  private critEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private normEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createTextures();

    this.add.rectangle(width / 2, height / 2, width, height, 0xf6f9ff);

    const cx = width / 2;
    const cy = height / 2;

    this.clickTarget = this.add.image(cx, cy, "pixelBlob");
    this.clickTarget.setInteractive({ useHandCursor: true });
    this.clickTarget.setScale(1);

    this.normEmitter = this.add.particles(0, 0, "pxParticle", {
      speed: { min: 120, max: 280 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 450,
      blendMode: "ADD",
      emitting: false,
      tint: [0x4f6ef8, 0x93c5fd],
    });

    this.critEmitter = this.add.particles(0, 0, "pxParticle", {
      speed: { min: 200, max: 480 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 650,
      blendMode: "ADD",
      emitting: false,
      tint: [0xfcd34d, 0xf97316, 0xf472b6],
    });

    this.clickTarget.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const { ppk, crit } = gameState.registerClick(0.12);
      this.playBounce();
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      if (crit) {
        this.critEmitter.explode(28, wx, wy);
      } else {
        this.normEmitter.explode(10, wx, wy);
      }
      this.spawnFlyingNumber(wx, wy - 20, `+${fmtPps(ppk)}`, crit);
    });

    this.scale.on("resize", (_gameSize: Phaser.Structs.Size) => {
      this.layout(this.scale.gameSize);
    });
    this.layout(this.scale.gameSize);
  }

  private createTextures(): void {
    const g = this.add.graphics();
    g.fillStyle(0x4f6ef8, 1);
    g.fillRoundedRect(0, 0, 128, 128, 28);
    g.lineStyle(4, 0xffffff, 0.35);
    g.strokeRoundedRect(2, 2, 124, 124, 26);
    g.generateTexture("pixelBlob", 128, 128);
    g.destroy();

    const p = this.add.graphics();
    p.fillStyle(0xffffff, 1);
    p.fillRect(0, 0, 8, 8);
    p.generateTexture("pxParticle", 8, 8);
    p.destroy();
  }

  private layout(size: Phaser.Structs.Size): void {
    const cx = size.width / 2;
    const cy = size.height / 2;
    this.clickTarget.setPosition(cx, cy);
  }

  private playBounce(): void {
    this.tweens.add({
      targets: this.clickTarget,
      scaleX: 0.88,
      scaleY: 0.88,
      duration: 70,
      ease: "Quad.easeOut",
      yoyo: true,
      onComplete: () => {
        this.clickTarget.setScale(1);
      },
    });
  }

  private spawnFlyingNumber(x: number, y: number, text: string, crit: boolean): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "system-ui, Segoe UI, sans-serif",
        fontSize: crit ? "22px" : "18px",
        color: crit ? "#ea580c" : "#3143a8",
        fontStyle: crit ? "700" : "600",
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: t,
      y: y - 90,
      alpha: 0,
      duration: crit ? 1000 : 850,
      ease: "Quad.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  update(_time: number, delta: number): void {
    gameState.tick(delta / 1000);
    syncHud();
  }
}
