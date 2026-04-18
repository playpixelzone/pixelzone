import { BUILDINGS, PPC_SHOP_UPGRADES, PPS_SHOP_UPGRADES } from "../../data/buildings";
import { gameState } from "../../core/GameState";
import { fmtNumber, fmtPps } from "../../core/format";

let shopTimer: number | null = null;

function renderBuildings(container: HTMLElement): void {
  const s = gameState.snapshot;
  const bulk = s.economy.bulk === 0 ? 9999 : s.economy.bulk;
  container.innerHTML = `<div class="pf-card-grid pf-card-grid--shop">${BUILDINGS.map((b) => {
    const discovered = !!s.session.discoveredBuildings[b.id];
    if (!discovered) {
      return `
        <button type="button" class="pf-game-card pf-game-card--building pf-game-card--locked" disabled>
          <div class="pf-card-icon pf-card-icon--muted">?</div>
          <div class="pf-card-main">
            <h3 class="pf-card-title">???</h3>
            <p class="pf-card-meta">Noch nicht entdeckt</p>
          </div>
          <span class="pf-card-buy pf-card-buy--disabled">???</span>
        </button>`;
    }
    const can = gameState.canBuyBuildingAmount(b, bulk) > 0;
    const cost = gameState.buildingCost(b, 0);
    const cnt = s.economy.buildings[b.id] || 0;
    return `
      <button type="button" class="pf-game-card pf-game-card--building ${can ? "pf-game-card--afford" : "pf-game-card--expensive"}" data-buy-building="${b.id}">
        <div class="pf-card-icon pf-card-icon--building">${b.icon}</div>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${b.name} <span class="pf-card-badge">${cnt}</span></h3>
          <p class="pf-card-effect pf-card-effect--pps">+${fmtPps(b.pps)} <span class="pf-effect-label">PPS</span> <small>pro Stück</small></p>
        </div>
        <span class="pf-card-buy">${fmtNumber(cost)} <span class="pf-pixel-unit">Pixel</span></span>
      </button>`;
  }).join("")}</div>`;

  container.querySelectorAll<HTMLButtonElement>("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.buyBuilding(btn.dataset.buyBuilding!);
      gameState.saveToLocalStorage();
      renderBuildings(container);
      renderUpgrades(document.getElementById("shopUpgradesRoot")!);
    });
  });
}

function renderUpgrades(container: HTMLElement): void {
  const s = gameState.snapshot;

  const cardHtml = (
    u: { id: string; name: string; desc: string; cost: number; unlockAt: number },
    kind: "pps" | "ppc",
  ): string => {
    const discovered = !!s.session.discoveredUpgrades[u.id];
    if (!discovered) {
      return `
        <button type="button" class="pf-game-card pf-game-card--locked" disabled>
          <div class="pf-card-main">
            <h3 class="pf-card-title">???</h3>
            <p class="pf-card-meta">Noch nicht entdeckt</p>
          </div>
          <span class="pf-card-buy pf-card-buy--disabled">???</span>
        </button>`;
    }
    const bought = s.economy.boughtUpgrades.includes(u.id);
    const can = !bought && s.economy.pixel >= u.cost;
    const effClass = kind === "ppc" ? "pf-card-effect--ppk" : "pf-card-effect--ppsu";
    const stateClass = bought ? "pf-game-card--bought" : can ? "pf-game-card--afford" : "pf-game-card--expensive";
    return `
      <button type="button" class="pf-game-card ${stateClass}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${u.name}</h3>
          <p class="pf-card-effect ${effClass}">${u.desc}</p>
        </div>
        <span class="pf-card-buy">${bought ? "Gekauft" : `${fmtNumber(u.cost)} Pixel`}</span>
      </button>`;
  };

  const colPps = PPS_SHOP_UPGRADES.map((u) => cardHtml(u, "pps")).join("");
  const colPpc = PPC_SHOP_UPGRADES.map((u) => cardHtml(u, "ppc")).join("");

  container.innerHTML = `
    <div class="pf-upgrade-two-col">
      <div>
        <h4 class="pf-upgrade-col__title">Pixel pro Sekunde</h4>
        <div class="pf-card-grid pf-card-grid--upgrades-col">${colPps}</div>
      </div>
      <div>
        <h4 class="pf-upgrade-col__title">Pixel pro Klick</h4>
        <div class="pf-card-grid pf-card-grid--upgrades-col">${colPpc}</div>
      </div>
    </div>`;

  container.querySelectorAll<HTMLButtonElement>("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.buyShopUpgrade(btn.dataset.buyUpgrade!);
      gameState.saveToLocalStorage();
      renderUpgrades(container);
      renderBuildings(document.getElementById("shopBuildingsRoot")!);
    });
  });
}

function syncBulkUi(overlay: HTMLElement): void {
  const b = gameState.snapshot.economy.bulk;
  overlay.querySelectorAll<HTMLButtonElement>(".pf-bulk-btn").forEach((btn) => {
    const m = Number(btn.dataset.menge);
    const active = m === 0 ? b === 0 : b === m;
    btn.classList.toggle("pf-bulk-btn--active", active);
  });
}

export function initShopView(): void {
  const overlay = document.getElementById("shopOverlay");
  const openBtn = document.getElementById("btnOpenShop");
  const buildingsRoot = document.getElementById("shopBuildingsRoot");
  const upgradesRoot = document.getElementById("shopUpgradesRoot");
  if (!overlay || !openBtn || !buildingsRoot || !upgradesRoot) return;

  const close = () => {
    overlay.classList.add("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pf-modal-open");
    if (shopTimer !== null) {
      window.clearInterval(shopTimer);
      shopTimer = null;
    }
  };

  const open = () => {
    overlay.classList.remove("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("pf-modal-open");
    syncBulkUi(overlay);
    renderBuildings(buildingsRoot);
    renderUpgrades(upgradesRoot);
    if (shopTimer !== null) window.clearInterval(shopTimer);
    shopTimer = window.setInterval(() => {
      if (!overlay.classList.contains("pf-overlay--hidden")) {
        renderBuildings(buildingsRoot);
        renderUpgrades(upgradesRoot);
      }
    }, 320);
  };

  openBtn.addEventListener("click", open);

  overlay.querySelectorAll("[data-close-overlay]").forEach((el) => {
    el.addEventListener("click", close);
  });

  overlay.querySelectorAll<HTMLButtonElement>(".pf-shop-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      overlay.querySelectorAll(".pf-shop-tab").forEach((t) => t.classList.remove("pf-shop-tab--active"));
      tab.classList.add("pf-shop-tab--active");
      const geo = document.getElementById("shopGebaeudePane");
      const up = document.getElementById("shopUpgradesPane");
      const bulk = document.getElementById("shopBulkRow");
      if (name === "gebaeude") {
        geo?.classList.remove("pf-hidden");
        up?.classList.add("pf-hidden");
        bulk?.classList.remove("pf-hidden");
      } else {
        geo?.classList.add("pf-hidden");
        up?.classList.remove("pf-hidden");
        bulk?.classList.add("pf-hidden");
      }
    });
  });

  overlay.querySelectorAll<HTMLButtonElement>(".pf-bulk-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      gameState.setBulk(Number(btn.dataset.menge));
      gameState.saveToLocalStorage();
      syncBulkUi(overlay);
      renderBuildings(buildingsRoot);
    });
  });
}
