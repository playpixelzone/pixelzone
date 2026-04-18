import * as Phaser from "phaser";
import "./style.css";
import "./ui/shop/shop.css";
import "./ui/skillTree/skillTree.css";
import "./ui/events/events.css";
import { gameState } from "./core/GameState";
import { MainScene } from "./scenes/MainScene";
import { initEventsView } from "./ui/events/EventsView";
import { initShopView } from "./ui/shop/ShopView";
import { initSkillTreeView } from "./ui/skillTree/SkillTreeView";

gameState.loadFromLocalStorage();

initShopView();
initSkillTreeView();
initEventsView();

document.getElementById("prestigeBtn")?.addEventListener("click", () => {
  if (gameState.snapshot.economy.lifetimePixel < gameState.prestigeThreshold()) return;
  if (!window.confirm("Prestige ausführen? Pixel & Gebäude werden zurückgesetzt.")) return;
  gameState.doPrestige();
  gameState.saveToLocalStorage();
});

window.addEventListener("beforeunload", () => {
  gameState.saveToLocalStorage();
});

const parent = document.getElementById("gameMount");
if (!parent) {
  throw new Error("#gameMount fehlt");
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: "#f6f9ff",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: parent.clientWidth || 800,
    height: parent.clientHeight || 600,
  },
  scene: [MainScene],
});

function syncPhaserSize(): void {
  const el = document.getElementById("gameMount");
  if (!el) return;
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (w > 0 && h > 0) {
    game.scale.resize(w, h);
  }
}

syncPhaserSize();
const resizeObserver = new ResizeObserver(() => syncPhaserSize());
resizeObserver.observe(parent);
window.addEventListener("orientationchange", () => {
  window.setTimeout(syncPhaserSize, 400);
});
