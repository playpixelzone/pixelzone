import { gameState } from "../../core/GameState";
import { fmtNumber } from "../../core/format";

const SLOT_SYMBOLS = ["✦", "⚡", "◆", "🎰", "★", "⬡", "◎", "◇"];

function fmtCountdown(ms: number): string {
  const leftMs = Math.max(0, ms);
  const leftMin = Math.floor(leftMs / 60000);
  const leftSec = Math.floor((leftMs % 60000) / 1000);
  return `${leftMin}:${String(leftSec).padStart(2, "0")}`;
}

function missionRewardLabel(m: {
  reward: { pixel?: number; timedProd?: number; timedClick?: number };
}): string {
  const parts: string[] = [];
  if (m.reward.pixel) parts.push(`${gameState.missionRewardScaled(m.reward.pixel)} Pixel`);
  if (m.reward.timedProd) parts.push("Prod-Boost");
  if (m.reward.timedClick) parts.push("Klick-Boost");
  return parts.join(" · ");
}

function renderMutationLine(el: HTMLElement | null): void {
  if (!el) return;
  const line = gameState.getMutationStatusLine();
  el.textContent = line;
  el.classList.toggle("pf-mutation-active--on", line.length > 0);
}

function renderMissions(listEl: HTMLElement, refreshEl: HTMLElement | null): void {
  const s = gameState.snapshot;
  const leftMs = Math.max(0, (s.session.nextMissionRefreshAt || 0) - Date.now());
  if (refreshEl) refreshEl.textContent = `Neue Missionen in ${fmtCountdown(leftMs)}`;

  listEl.innerHTML = s.session.missions
    .map((m) => {
      const ratio = m.target > 0 ? Math.min(1, (m.progress || 0) / m.target) : 0;
      const desc = m.desc.replace("{target}", fmtNumber(m.target));
      return `
      <article class="pf-action-card ${m.done ? "pf-action-card--done" : ""}">
        <div class="pf-action-card__top">
          <strong>${m.name}</strong>
          <span class="pf-action-card__pct">${Math.floor(ratio * 100)}%</span>
        </div>
        <p class="pf-action-card__desc">${desc}</p>
        <div class="pf-action-card__bar"><div style="width:${ratio * 100}%"></div></div>
        <div class="pf-action-card__reward">${missionRewardLabel(m)}</div>
      </article>`;
    })
    .join("");
}

export function initEventsView(): void {
  const overlay = document.getElementById("eventsOverlay");
  const openBtn = document.getElementById("btnOpenEvents");
  const listEl = document.getElementById("eventsMissionList");
  const refreshEl = document.getElementById("eventsMissionRefresh");
  const spinBtn = document.getElementById("slotSpinBtn") as HTMLButtonElement | null;
  const resultEl = document.getElementById("slotResult");
  const mutationLineEl = document.getElementById("mutationActiveLine");
  const reelEls = [
    document.getElementById("slotReel1"),
    document.getElementById("slotReel2"),
    document.getElementById("slotReel3"),
  ].filter(Boolean) as HTMLElement[];

  if (!overlay || !openBtn || !listEl) return;

  let eventsTimer: number | null = null;

  const close = () => {
    overlay.classList.add("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pf-modal-open");
    if (eventsTimer !== null) {
      window.clearInterval(eventsTimer);
      eventsTimer = null;
    }
  };

  const open = () => {
    overlay.classList.remove("pf-overlay--hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("pf-modal-open");
    renderMissions(listEl, refreshEl);
    renderMutationLine(mutationLineEl);
    if (eventsTimer !== null) window.clearInterval(eventsTimer);
    eventsTimer = window.setInterval(() => {
      if (!overlay.classList.contains("pf-overlay--hidden")) {
        renderMissions(listEl, refreshEl);
        renderMutationLine(mutationLineEl);
      }
    }, 1000);
  };

  openBtn.addEventListener("click", open);
  overlay.querySelectorAll("[data-close-overlay]").forEach((el) => {
    el.addEventListener("click", close);
  });

  spinBtn?.addEventListener("click", () => {
    if (!reelEls.length || !spinBtn) return;
    spinBtn.disabled = true;
    if (resultEl) resultEl.textContent = "…";
    const spinClass = "pf-slot-reel__strip--spin";
    reelEls.forEach((reel) => {
      const strip = reel.querySelector<HTMLElement>(".pf-slot-reel__strip");
      if (!strip) return;
      strip.classList.remove(spinClass);
      void strip.offsetWidth;
      strip.classList.add(spinClass);
    });
    window.setTimeout(() => {
      const triple: string[] = [];
      reelEls.forEach((reel) => {
        const strip = reel.querySelector(".pf-slot-reel__strip");
        strip?.classList.remove(spinClass);
        const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]!;
        triple.push(sym);
        const cells = strip?.querySelectorAll(".pf-slot-cell");
        const mid = cells?.[2];
        if (mid) mid.textContent = sym;
      });
      spinBtn.disabled = false;
      const summary = gameState.applySlotMutation(triple);
      if (resultEl) {
        resultEl.textContent = `${summary} · ${triple.join(" ")}`;
      }
      renderMutationLine(mutationLineEl);
    }, 1100);
  });
}
