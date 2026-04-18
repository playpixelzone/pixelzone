import * as Phaser from "phaser";
import { gameState } from "../core/GameState";
import { fmtNumber, fmtPps } from "../core/format";

/** Dunkler Spieltisch, zentrales Kartendeck als Einsatz-Klick; Touch-first Hitarea. */
export class MainScene extends Phaser.Scene {
  private deck!: Phaser.GameObjects.Image;
  private goldBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private softSparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private spotlight!: Phaser.GameObjects.Graphics;
  private tableBg!: Phaser.GameObjects.Graphics;
  private feltLayer!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    this.createTextures();

    this.tableBg = this.add.graphics();
    this.feltLayer = this.add.graphics();
    this.spotlight = this.add.graphics();
    this.vignette = this.add.graphics();

    const { width, height } = this.scale;
    this.redrawStaticTable(width, height);

    const cx = width / 2;
    const cy = height * 0.52;

    this.deck = this.add.image(cx, cy, "cardDeck");

    this.softSparks = this.add.particles(0, 0, "chipParticle", {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.45, end: 0 },
      lifespan: 420,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0x5eead4, 0x38bdf8],
      emitting: false,
    });

    this.goldBurst = this.add.particles(0, 0, "chipParticle", {
      speed: { min: 180, max: 420 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xfacc15, 0xf59e0b, 0xfbbf24],
      emitting: false,
    });

    this.bindDeckInteraction();

    this.scale.on("resize", this.handleResize, this);
    this.handleResize(this.scale.gameSize);

    this.syncDomHud();
  }

  update(_time: number, delta: number): void {
    gameState.tick(delta / 1000);
    this.syncDomHud();
    this.pulseSpotlight(delta);
  }

  private handleResize(size: Phaser.Structs.Size): void {
    this.redrawStaticTable(size.width, size.height);
    const cx = size.width / 2;
    const cy = size.height * 0.52;
    this.deck.setPosition(cx, cy);
    this.bindDeckInteraction();
  }

  private redrawStaticTable(width: number, height: number): void {
    this.tableBg.clear();
    this.tableBg.fillGradientStyle(0x0a1210, 0x0a1210, 0x152a20, 0x152a20, 1);
    this.tableBg.fillRect(0, 0, width, height);

    this.feltLayer.clear();
    this.feltLayer.fillStyle(0x143028, 0.92);
    this.feltLayer.fillRoundedRect(width * 0.04, height * 0.08, width * 0.92, height * 0.84, 36);
    this.feltLayer.lineStyle(2, 0x2d5a45, 0.35);
    this.feltLayer.strokeRoundedRect(width * 0.04, height * 0.08, width * 0.92, height * 0.84, 36);

    this.vignette.clear();
    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < 8; i += 1) {
      const t = i / 8;
      this.vignette.lineStyle(24 - i * 2, 0x000000, 0.06 + t * 0.05);
      this.vignette.strokeEllipse(cx, cy, width * (0.95 + i * 0.02), height * (0.98 + i * 0.015));
    }
  }

  private pulseSpotlight(_delta: number): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const t = this.time.now / 1000;
    const flicker = 0.04 + Math.sin(t * 1.7) * 0.015 + Math.sin(t * 3.1) * 0.008;
    this.drawSpotlight(w, h, flicker);
  }

  private drawSpotlight(width: number, height: number, intensity: number): void {
    this.spotlight.clear();
    const cx = width / 2;
    const cy = height * 0.42;
    const rx = width * 0.42;
    const ry = height * 0.36;
    this.spotlight.fillStyle(0xa7f3d0, 0.07 + intensity);
    this.spotlight.fillEllipse(cx, cy, rx, ry);
    this.spotlight.fillStyle(0x38bdf8, 0.04 + intensity * 0.5);
    this.spotlight.fillEllipse(cx, cy + 20, rx * 0.75, ry * 0.55);
  }

  private createTextures(): void {
    if (this.textures.exists("cardDeck")) return;

    const g = this.add.graphics();
    const stackDepth = 4;
    for (let i = 0; i < stackDepth; i += 1) {
      const o = i * 3;
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(16 + o, 16 + o, 112 - o * 2, 160 - o * 2, 12);
      g.lineStyle(2, 0x334155, 0.9);
      g.strokeRoundedRect(16 + o, 16 + o, 112 - o * 2, 160 - o * 2, 12);
    }
    g.fillStyle(0xc4a574, 0.55);
    g.fillRoundedRect(44, 120, 56, 8, 3);
    g.lineStyle(3, 0xe2c08d, 0.85);
    g.strokeRoundedRect(24, 24, 96, 144, 10);
    g.generateTexture("cardDeck", 144, 192);
    g.destroy();

    const p = this.add.graphics();
    p.fillStyle(0xffffff, 1);
    p.fillRoundedRect(0, 0, 10, 10, 2);
    p.generateTexture("chipParticle", 10, 10);
    p.destroy();
  }

  private bindDeckInteraction(): void {
    this.deck.removeInteractive();
    const r = Math.max(this.deck.displayWidth, this.deck.displayHeight) * 0.45;
    this.deck.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
    if (this.deck.input) this.deck.input.cursor = "pointer";

    this.deck.off("pointerdown");
    this.deck.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const { ppk, crit } = gameState.registerClick(0.12);
      this.playDealTween();
      const wx = pointer.worldX;
      const wy = pointer.worldY;
      if (crit) {
        this.goldBurst.explode(48, wx, wy);
      } else {
        this.softSparks.explode(14, wx, wy);
      }
      this.spawnFloatText(wx, wy - 28, `+${fmtPps(ppk)}`, crit);
      this.syncDomHud();
    });
  }

  private playDealTween(): void {
    this.tweens.add({
      targets: this.deck,
      angle: { from: -6, to: 6 },
      y: this.deck.y - 10,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.deck.setAngle(0);
      },
    });
  }

  private spawnFloatText(x: number, y: number, text: string, crit: boolean): void {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: crit ? "24px" : "19px",
        color: crit ? "#fcd34d" : "#a7f3d0",
        fontStyle: crit ? "700" : "600",
        stroke: "#0f172a",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: t,
      y: y - 72,
      alpha: 0,
      duration: crit ? 1000 : 820,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  private syncDomHud(): void {
    const chips = document.getElementById("statChips");
    const cps = document.getElementById("statCps");
    const ppk = document.getElementById("statPpk");
    if (chips) chips.textContent = fmtNumber(gameState.economy.chips);
    if (cps) cps.textContent = fmtPps(gameState.currentPps());
    if (ppk) ppk.textContent = fmtPps(gameState.currentPpk());
  }
}
