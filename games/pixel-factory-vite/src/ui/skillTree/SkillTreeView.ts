import { gameState } from "../../core/GameState";
import { fmtNumber } from "../../core/format";
import {
  describeSkillNodeEffects,
  isSkillUnlocked,
  SKILL_NODES,
  SKILL_NODE_BY_ID,
  skillCostAt,
  STABIL_KERN_ID,
} from "../../data/skillTree";

function elbowPath(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`;
}

function flowDurationFromPps(pps: number): string {
  const x = Math.log10(Math.max(1, pps) + 9);
  const sec = Math.max(0.35, Math.min(3.2, 2.2 / x));
  return `${sec}s`;
}

let tooltipEl: HTMLDivElement | null = null;
let tooltipTarget: HTMLElement | null = null;

function ensureTooltip(): HTMLDivElement {
  if (tooltipEl) return tooltipEl;
  const el = document.createElement("div");
  el.className = "pf-skill-tooltip pf-hidden";
  el.id = "pfSkillTooltipGlobal";
  document.body.appendChild(el);
  tooltipEl = el;
  return el;
}

function showTooltip(anchor: HTMLElement, text: string): void {
  const el = ensureTooltip();
  el.textContent = text;
  el.classList.remove("pf-hidden");
  tooltipTarget = anchor;
  const r = anchor.getBoundingClientRect();
  el.style.left = `${Math.min(window.innerWidth - 260, Math.max(8, r.left + r.width / 2 - 120))}px`;
  el.style.top = `${Math.max(8, r.bottom + 8)}px`;
}

function hideTooltip(): void {
  tooltipEl?.classList.add("pf-hidden");
  tooltipTarget = null;
}

function wireTooltipOutsideClose(): void {
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!tooltipEl || tooltipEl.classList.contains("pf-hidden")) return;
      const t = e.target as Node;
      if (tooltipEl.contains(t)) return;
      if (tooltipTarget && (tooltipTarget === t || tooltipTarget.contains(t))) return;
      const help = (e.target as HTMLElement).closest?.(".pf-skill-help");
      if (help) return;
      hideTooltip();
    },
    true,
  );
}

function renderEdges(svg: SVGSVGElement): void {
  const frag = document.createDocumentFragment();
  for (const node of SKILL_NODES) {
    if (!node.parentId) continue;
    const p = SKILL_NODE_BY_ID.get(node.parentId);
    if (!p) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", elbowPath(p.layoutX, p.layoutY, node.layoutX, node.layoutY));
    path.setAttribute("vector-effect", "non-scaling-stroke");
    const levels = gameState.snapshot.meta.skillLevels;
    const parentBought = (levels[node.parentId] ?? 0) > 0;
    path.setAttribute("class", `pf-skill-edge ${parentBought ? "pf-skill-edge--lit pf-skill-edge--flow" : ""}`);
    frag.appendChild(path);
  }
  svg.innerHTML = "";
  svg.appendChild(frag);
}

function renderNodes(container: HTMLElement): void {
  const levels = gameState.snapshot.meta.skillLevels;
  const qp = gameState.snapshot.meta.prestigePoints;

  container.innerHTML = SKILL_NODES.map((node) => {
    const lvl = levels[node.id] ?? 0;
    const unlocked = isSkillUnlocked(levels, node.id);
    const maxed = lvl >= node.maxLevel;
    const cost = skillCostAt(node, lvl);
    const canBuy = unlocked && !maxed && qp >= cost;

    let stateClass = "pf-skill-node--locked";
    if (!unlocked) stateClass = "pf-skill-node--locked";
    else if (maxed) stateClass = "pf-skill-node--done";
    else if (canBuy) stateClass = "pf-skill-node--ready";
    else stateClass = "pf-skill-node--available";

    const branch = node.branch;
    const glyph = branch === "speed" ? "⚡" : branch === "efficiency" ? "◎" : branch === "automation" ? "⎔" : "✦";

    return `
      <div class="pf-skill-node-wrap" style="left:${node.layoutX}%;top:${node.layoutY}%;" data-skill-node="${node.id}">
        <div class="pf-skill-node-card">
          <div class="pf-skill-help-slot">
            <button type="button" class="pf-skill-help" data-skill-help="${node.id}" aria-label="Info">?</button>
          </div>
          <button type="button" class="pf-skill-node ${stateClass}" data-skill-buy="${node.id}" ${!canBuy ? "disabled" : ""}>
            <span class="pf-skill-node__glyph" aria-hidden="true">${glyph}</span>
            <span class="pf-skill-node__name">${node.name}</span>
            <span class="pf-skill-node__lvl">Stufe ${lvl} / ${node.maxLevel}</span>
            <span class="pf-skill-node__cost">${maxed ? "Max" : `${fmtNumber(cost)} PP`}</span>
          </button>
        </div>
      </div>`;
  }).join("");

  container.querySelectorAll<HTMLButtonElement>("[data-skill-buy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.skillBuy!;
      if (gameState.buySkill(id)) {
        gameState.saveToLocalStorage();
        const svg = document.getElementById("skillTreeSvg") as SVGSVGElement | null;
        if (svg) renderEdges(svg);
        renderNodes(container);
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>("[data-skill-help]").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
    });
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.skillHelp!;
      const n = SKILL_NODE_BY_ID.get(id);
      const fx = describeSkillNodeEffects(id);
      const text = [n?.help, fx].filter(Boolean).join("\n\n") || n?.name || "";
      const tip = ensureTooltip();
      if (!tip.classList.contains("pf-hidden") && tooltipTarget === btn) {
        hideTooltip();
        return;
      }
      showTooltip(btn, text);
    });
  });
}

function centerStabil(): void {
  const el = document.querySelector(`[data-skill-node="${STABIL_KERN_ID}"]`) as HTMLElement | null;
  el?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
}

export function initSkillTreeView(): void {
  const overlay = document.getElementById("skillOverlay");
  const openBtn = document.getElementById("btnOpenSkills");
  const svg = document.getElementById("skillTreeSvg") as SVGSVGElement | null;
  const nodesRoot = document.getElementById("skillTreeNodes");
  const qpEl = document.getElementById("skillTreeQp");
  const panInner = document.getElementById("skillPanInner");
  if (!overlay || !openBtn || !svg || !nodesRoot) return;

  wireTooltipOutsideClose();

  let refreshTimer: number | null = null;

  const openAndRefresh = () => {
    overlay.classList.remove("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("pf-modal-open");
    const pps = gameState.currentPps();
    panInner?.style.setProperty("--pf-flow-dur", flowDurationFromPps(pps));
    if (qpEl) qpEl.textContent = String(gameState.snapshot.meta.prestigePoints);
    renderEdges(svg);
    renderNodes(nodesRoot);
    requestAnimationFrame(() => centerStabil());

    if (refreshTimer !== null) window.clearInterval(refreshTimer);
    refreshTimer = window.setInterval(() => {
      if (overlay.classList.contains("pf-overlay--hidden")) {
        if (refreshTimer !== null) window.clearInterval(refreshTimer);
        refreshTimer = null;
        return;
      }
      const nextPps = gameState.currentPps();
      panInner?.style.setProperty("--pf-flow-dur", flowDurationFromPps(nextPps));
      if (qpEl) qpEl.textContent = String(gameState.snapshot.meta.prestigePoints);
    }, 550);
  };

  const closeOverlay = () => {
    overlay.classList.add("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "true");
    hideTooltip();
    document.body.classList.remove("pf-modal-open");
    if (refreshTimer !== null) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  openBtn.addEventListener("click", openAndRefresh);
  overlay.querySelectorAll("[data-close-overlay]").forEach((el) => {
    el.addEventListener("click", closeOverlay);
  });
}
