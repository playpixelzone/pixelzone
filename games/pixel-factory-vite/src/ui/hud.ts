import { fmtNumber, fmtPps } from "../core/format";
import { gameState } from "../core/GameState";

const lastText = new Map<string, string>();

function setText(id: string, value: string): void {
  if (lastText.get(id) === value) return;
  lastText.set(id, value);
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * HUD aus dem GameState – vergleicht Strings, schreibt das DOM nur bei Änderung (kein „every-frame full rerender“).
 */
export function syncHud(): void {
  const s = gameState.snapshot;
  setText("statPixel", `${fmtNumber(s.economy.pixel)} Pixel`);
  setText("statPPS", fmtPps(gameState.currentPps()));
  setText("statPPK", fmtPps(gameState.currentPpk()));
  setText("statPrestige", String(s.meta.prestige));
  setText("statQP", String(s.meta.prestigePoints));

  const need = gameState.prestigeThreshold() - s.economy.lifetimePixel;
  const ready = need <= 0;
  const btn = document.getElementById("prestigeBtn") as HTMLButtonElement | null;
  if (btn) btn.disabled = !ready;
  setText(
    "prestigeInfo",
    ready ? "Prestige bereit" : `${fmtNumber(need)} Pixel bis Prestige`,
  );

  const now = Date.now();
  const comboActive = now <= s.session.comboUntil;
  const win = gameState.effectiveComboWindowMs();
  const fill = comboActive ? Math.max(0, (s.session.comboUntil - now) / win) : 0;
  const fillEl = document.getElementById("komboFill");
  if (fillEl) fillEl.style.width = `${Math.floor(fill * 100)}%`;
  setText(
    "komboLabel",
    comboActive
      ? `Kombo x${gameState.getComboMult().toFixed(2)} (${s.session.comboCount})`
      : "Kombo",
  );

  const mutLine = gameState.getMutationStatusLine();
  setText("mutationHudLine", mutLine);
  const mutEl = document.getElementById("mutationHudLine");
  if (mutEl) {
    mutEl.classList.toggle("pf-mutation-hud--active", mutLine.length > 0);
    mutEl.setAttribute("aria-hidden", mutLine.length > 0 ? "false" : "true");
  }

  setText("klickInfo", `+${fmtPps(gameState.currentPpk())} pro Klick`);
}
