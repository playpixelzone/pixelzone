// Pixel Factory Rework v3.3
// Fokus: Stabilität, klare UX, echte Entscheidungen, funktionierende Interaktionen.

const GAME_ID = "pixel-factory";
const SAVE_SCHEMA_VERSION = 4;
const AUTOSAVE_MS = 10000;
const BASE_EVENT_INTERVAL_MS = 210000;
const COMBO_WINDOW_MS = 1400;
/** @deprecated Nur noch für Fallback; echte Erneuerung über Halbstunden-Grenze (siehe msBisNaechsteHalbeStunde). */
const MISSION_ROTATE_MS = 30 * 60 * 1000;
const PRESTIGE_BASE = 9000;
const PRESTIGE_GROWTH = 1.5;

const BUILDINGS = [
  { id: "worker", name: "Pixel-Arbeiter", icon: "🧑‍🏭", baseCost: 15, growth: 1.128, pps: 0.4, unlockAt: 0 },
  { id: "intern", name: "Praktikant", icon: "🧢", baseCost: 70, growth: 1.136, pps: 1.4, unlockAt: 50 },
  { id: "printer", name: "Nano-Drucker", icon: "🖨️", baseCost: 260, growth: 1.145, pps: 5.6, unlockAt: 170 },
  { id: "assembler", name: "Assembler", icon: "⚙️", baseCost: 980, growth: 1.154, pps: 16, unlockAt: 650 },
  { id: "robot", name: "Roboterarm", icon: "🤖", baseCost: 3900, growth: 1.162, pps: 49, unlockAt: 2200 },
  { id: "reactor", name: "Fusion-Reaktor", icon: "⚡", baseCost: 15000, growth: 1.171, pps: 170, unlockAt: 8800 },
  { id: "cluster", name: "Chip-Cluster", icon: "🧠", baseCost: 54000, growth: 1.18, pps: 610, unlockAt: 30000 },
  { id: "satellite", name: "Satelliten-Linie", icon: "🛰️", baseCost: 190000, growth: 1.188, pps: 2100, unlockAt: 110000 },
  { id: "laserFab", name: "Laser-Fabrik", icon: "🔴", baseCost: 680000, growth: 1.197, pps: 7000, unlockAt: 420000 },
  { id: "quantumCore", name: "Line-Core", icon: "🌀", baseCost: 2400000, growth: 1.206, pps: 21000, unlockAt: 1500000 },
  { id: "matrix", name: "Matrix-Fabrik", icon: "🏭", baseCost: 8500000, growth: 1.215, pps: 68000, unlockAt: 5000000 },
  { id: "arcology", name: "Pixel-Arcology", icon: "🏙️", baseCost: 31000000, growth: 1.224, pps: 210000, unlockAt: 18000000 },
  { id: "orbitalDock", name: "Orbital-Dock", icon: "🛸", baseCost: 115000000, growth: 1.232, pps: 690000, unlockAt: 70000000 },
];

/** Kosten: PPS etwas teurer; Klick-Pfad hält Midgame-PPC bei ~10–20 % der Gesamtfeel-Production bei aktivem Spielen. */
const UPGRADES = [
  { id: "u_click_1", name: "Präzisions-Klick", desc: "+3 Klickkraft", cost: 52, unlockAt: 32, apply: (s) => { s.economy.clickBase += 3; } },
  { id: "u_click_2", name: "Servo-Hand", desc: "Klickkraft ×1.94", cost: 420, unlockAt: 200, apply: (s) => { s.economy.clickMult *= 1.94; } },
  { id: "u_click_3", name: "Impuls-Handschuh", desc: "Klickkraft ×2.32", cost: 3200, unlockAt: 1500, apply: (s) => { s.economy.clickMult *= 2.32; } },
  { id: "u_click_4", name: "Hyperfinger", desc: "Klickkraft ×2.75", cost: 22000, unlockAt: 10000, apply: (s) => { s.economy.clickMult *= 2.75; } },
  { id: "u_click_5", name: "Neural-Link", desc: "Klickkraft ×3.48", cost: 195000, unlockAt: 120000, apply: (s) => { s.economy.clickMult *= 3.48; } },
  { id: "u_prod_1", name: "Schichtplan", desc: "Produktion ×1.28", cost: 580, unlockAt: 280, apply: (s) => { s.economy.prodMult *= 1.28; } },
  { id: "u_prod_2", name: "Qualitätskette", desc: "Produktion ×1.45", cost: 4800, unlockAt: 2600, apply: (s) => { s.economy.prodMult *= 1.45; } },
  { id: "u_prod_3", name: "Fließband-KI", desc: "Produktion ×1.95", cost: 39500, unlockAt: 20000, apply: (s) => { s.economy.prodMult *= 1.95; } },
  { id: "u_prod_4", name: "Takt-Optimierung", desc: "Produktion ×2.35", cost: 365000, unlockAt: 180000, apply: (s) => { s.economy.prodMult *= 2.35; } },
  { id: "u_prod_5", name: "Parallel-Layer", desc: "Produktion ×2.75", cost: 2950000, unlockAt: 1900000, apply: (s) => { s.economy.prodMult *= 2.75; } },
  { id: "u_combo_1", name: "Flow-Training", desc: "Kombo stärker (+0.1)", cost: 2100, unlockAt: 1000, apply: (s) => { s.economy.comboBonus += 0.1; } },
  { id: "u_combo_2", name: "Flow-Reflex", desc: "Kombo-Fenster +420ms", cost: 11000, unlockAt: 6000, apply: (s) => { s.economy.comboWindowBonus += 420; } },
  { id: "u_combo_3", name: "Burst-Kontrolle", desc: "Kombo stärker (+0.16)", cost: 88000, unlockAt: 48000, apply: (s) => { s.economy.comboBonus += 0.16; } },
  { id: "u_offline_1", name: "Nachtprotokoll", desc: "Offline-Effizienz +24%", cost: 15000, unlockAt: 8000, apply: (s) => { s.economy.offlineEff += 0.24; } },
  { id: "u_offline_2", name: "Auto-Schicht", desc: "Offline-Effizienz +40%", cost: 135000, unlockAt: 85000, apply: (s) => { s.economy.offlineEff += 0.4; } },
  { id: "u_event_1", name: "Notfallplan", desc: "Events seltener", cost: 32000, unlockAt: 20000, apply: (s) => { s.meta.eventRateMult *= 0.9; } },
  { id: "u_event_2", name: "Puffer-Netz", desc: "Events seltener", cost: 340000, unlockAt: 210000, apply: (s) => { s.meta.eventRateMult *= 0.86; } },
  { id: "u_hybrid_1", name: "Lean-Core", desc: "Klick + Produktion ×1.22", cost: 62000, unlockAt: 34000, apply: (s) => { s.economy.clickMult *= 1.22; s.economy.prodMult *= 1.22; } },
  { id: "u_hybrid_2", name: "Dual-Stack", desc: "Klick + Produktion ×1.38", cost: 420000, unlockAt: 260000, apply: (s) => { s.economy.clickMult *= 1.38; s.economy.prodMult *= 1.38; } },
];

/** Erweiterte Bäume inkl. Synergy: pf-line-trees.js → PF_LINE_TREES */
const LINE_TREES =
  typeof PF_LINE_TREES !== "undefined"
    ? PF_LINE_TREES
    : { speed: [], efficiency: [], automation: [], synergy: [] };

function escapeHtmlPf(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Leichter PPC-Bonus auf Tablet/iPad – aktives Tippen soll sich lohnen. */
function ipadTouchPpcBonus() {
  if (typeof window.matchMedia !== "function") return 1;
  const narrow = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (narrow && coarse) return 1.09;
  if (narrow) return 1.05;
  return 1;
}

function findLineNode(line, id) {
  return LINE_TREES[line]?.find((n) => n.id === id) || null;
}

const MUTATIONS = [
  { id: "m1", title: "Hochdruck", text: "+70% Produktion, Events etwas häufiger", detail: "Produktion x1.7, Eventrate x1.2", rarity: "rare", icon: "⚡", mathDetail: "mutationProdMult × 1.7 (alle PPS-Quellen). Zusätzlich eventRateMult × 1.2 (Events häufiger). Multiplikativ mit Linienbaum & Gebäuden.", apply: (s) => { s.meta.mutationProdMult *= 1.7; s.meta.eventRateMult *= 1.2; } },
  { id: "m2", title: "Reflexlauf", text: "+90% Klickkraft, aber -25% Gebäudeproduktion", detail: "Klick x1.9, Produktion x0.75", rarity: "epic", icon: "🏃", mathDetail: "mutationClickMult × 1.9 (PPC). mutationProdMult × 0.75 (Gebäude-PPS). End-PPS = Gebäude × prodMult × lineProdMult × mutationProdMult × …", apply: (s) => { s.meta.mutationClickMult *= 1.9; s.meta.mutationProdMult *= 0.75; } },
  { id: "m3", title: "Ruhemodus", text: "Events seltener, dafür -20% Klickkraft", detail: "Eventrate x0.65, Klick x0.8", rarity: "common", icon: "🌙", mathDetail: "eventRateMult × 0.65 (längere Abstände zwischen Events). mutationClickMult × 0.8.", apply: (s) => { s.meta.eventRateMult *= 0.65; s.meta.mutationClickMult *= 0.8; } },
  { id: "m4", title: "Turbo-Run", text: "Missionen +50% Belohnung, Prestige-Schwelle +18%", detail: "Missionsreward x1.5, Prestigeschwelle x1.18", rarity: "rare", icon: "🎯", mathDetail: "missionRewardMult × 1.5 (Pixel & Saison aus Missionen). prestigeThresholdMult × 1.18 (mehr Lifetime-Pixel für nächstes Prestige).", apply: (s) => { s.meta.missionRewardMult *= 1.5; s.meta.prestigeThresholdMult *= 1.18; } },
  { id: "m5", title: "Kettenreaktion", text: "Kombo stark, aber Event-Strafen härter", detail: "Kombo +0.35, Event-Strafe x1.4", rarity: "epic", icon: "⛓️", mathDetail: "comboBonus +0.35 (stärkere Kombo-Multiplikation beim Klicken). eventPenaltyMult × 1.4 (härtere negative Event-Effekte, falls genutzt).", apply: (s) => { s.economy.comboBonus += 0.35; s.meta.eventPenaltyMult *= 1.4; } },
  { id: "m6", title: "Langschicht", text: "Offline massiv stärker, aktive Klicks schwächer", detail: "Offline x2.2, Klick x0.75", rarity: "rare", icon: "🌆", mathDetail: "offlineEff +1.2 (zusätzliche Offline-Effizienz). mutationClickMult × 0.75.", apply: (s) => { s.economy.offlineEff += 1.2; s.meta.mutationClickMult *= 0.75; } },
];

/** risk: 1–10, höher = besserer Erwartungswert (Timeout wählt Minimum). */
const EVENT_POOL = [
  {
    id: "power",
    title: "Stromabfall",
    text: "Das Netz bricht kurz ein. Du musst entscheiden:",
    visualTheme: "amber",
    choices: [
      {
        id: "repair",
        icon: "🔧",
        risk: 5,
        label: "Sofort reparieren",
        detail: "Risiko: niedrig · 20s Produktion −15%, danach stabil",
        mathTooltip: "timedMult prod auf 0.85 für 20s (nur Gebäude-PPS). Efficiency-Pfad mildert den Abfall.",
        apply: (s) => addTimed(s, "prod", 0.85, 20, "Reparatur aktiv"),
      },
      {
        id: "risk",
        icon: "⚡",
        risk: 8,
        label: "Weiter auf Risiko",
        detail: "Belohnung: hoch · 30s +35% PPS, danach 25s −20%",
        mathTooltip: "Erst prod ×1.35 (30s), nach 30s prod ×0.8 (25s). Speed-Pfad verstärkt den Boost.",
        apply: (s) => {
          addTimed(s, "prod", 1.35, 30, "Risikofahrt");
          applyDelayedEffectSafe(30000, () => addTimed(state, "prod", 0.8, 25, "Überhitzung"));
        },
      },
      {
        id: "backup",
        icon: "🔋",
        risk: 7,
        label: "Backup-Generator",
        detail: "Sofortbonus: Pixel = aktuelle PPS × Sekunden (siehe Text)",
        mathTooltip: "Einmalige Pixel = currentPps() × Sekunden. Automation-Pfad verlängert die Sekunden.",
        apply: () => addPixels(currentPps() * 18, "Backup-Generator"),
      },
    ],
  },
  {
    id: "quality",
    title: "Qualitätsfenster",
    text: "Eine seltene Charge ist eingetroffen.",
    visualTheme: "gold",
    choices: [
      { id: "mass", icon: "📦", risk: 7, label: "Massenlauf", detail: "45s Produktion +28%", mathTooltip: "addTimed prod ×1.28 für 45s.", apply: (s) => addTimed(s, "prod", 1.28, 45, "Massenlauf") },
      { id: "premium", icon: "✨", risk: 8, label: "Premium-Serie", detail: "35s Klick +60%", mathTooltip: "addTimed click ×1.6 für 35s (PPC).", apply: (s) => addTimed(s, "click", 1.6, 35, "Premium-Serie") },
      { id: "store", icon: "📥", risk: 6, label: "Einlagern", detail: "+22 Saisonpunkte", mathTooltip: "Direkt seasonPoints +22 (skaliert durch Mission-Boni).", apply: (s) => addSeasonPoints(s, 22, "Charge eingelagert") },
    ],
  },
  {
    id: "security",
    title: "Sicherheitsalarm",
    text: "Anomalie in den Sensorlogs erkannt.",
    visualTheme: "blue",
    choices: [
      { id: "scan", icon: "📡", risk: 7, label: "Vollscan fahren", detail: "Events 90s lang seltener", mathTooltip: "eventRate timed ×0.72 für 90s.", apply: (s) => addTimed(s, "eventRate", 0.72, 90, "Vollscan läuft") },
      { id: "ignore", icon: "👀", risk: 5, label: "Ignorieren", detail: "Sofort Pixel, dann 40s instabilere Sensoren", mathTooltip: "Pixel + PPS×12s, dann eventRate ×1.2 (40s). Efficiency reduziert die Strafe.", apply: (s) => { addPixels(currentPps() * 12, "Unsichere Ausbeute"); addTimed(s, "eventRate", 1.2, 40, "Instabile Sensoren"); } },
      { id: "counter", icon: "🛡️", risk: 7, label: "Gegenmaßnahme", detail: "Missionen +20% Belohnung für 50s", mathTooltip: "missionReward timed ×1.2.", apply: (s) => addTimed(s, "missionReward", 1.2, 50, "Missionsbonus aktiv") },
    ],
  },
  {
    id: "market",
    title: "Marktfenster",
    text: "Ein Händlernetz bietet kurzfristige Deals.",
    visualTheme: "emerald",
    choices: [
      { id: "buy", icon: "🛒", risk: 6, label: "Material einkaufen", detail: "Nächste 3 Gebäude-Käufe −25%", mathTooltip: "discountBuys = 3 (nur Kosten, nicht PPS).", apply: (s) => { s.economy.discountBuys = 3; showBanner("Nächste 3 Käufe -25%"); } },
      { id: "sell", icon: "💸", risk: 8, label: "Schnellverkauf", detail: "35s Klick-Bonus", mathTooltip: "click ×1.45 für 35s. Speed-Pfad verstärkt.", apply: (s) => addTimed(s, "click", 1.45, 35, "Verkaufspush") },
      { id: "hold", icon: "⏳", risk: 5, label: "Abwarten", detail: "+15 Saisonpunkte", mathTooltip: "seasonPoints +15.", apply: (s) => addSeasonPoints(s, 15, "Marktbeobachtung") },
    ],
  },
  {
    id: "heat",
    title: "Hitzewelle",
    text: "Die Anlage läuft an der Grenze – Hitze steigt!",
    visualTheme: "heat",
    choices: [
      {
        id: "cool",
        icon: "❄️",
        risk: 5,
        label: "Kühlen",
        detail: "Sicher: kurz weniger PPS, danach ruhigere Events",
        mathTooltip: "30s prod reduziert, danach 70s eventRate reduziert. Efficiency-Pfad mildert stark.",
        apply: (s) => {
          addTimed(s, "prod", 0.9, 30, "Kühlung aktiv");
          applyDelayedEffectSafe(30000, () => addTimed(state, "eventRate", 0.8, 70, "Thermisch stabil"));
        },
      },
      {
        id: "push",
        icon: "🔥",
        risk: 9,
        label: "Pushen",
        detail: "Hoher Gewinn: 25s stark erhöhte Produktion",
        mathTooltip: "25s prod ×1.45+. Speed-Pfad erhöht den Boost, Efficiency nicht.",
        apply: (s) => addTimed(s, "prod", 1.45, 25, "Overheat-Boost"),
      },
      {
        id: "split",
        icon: "🔀",
        risk: 7,
        label: "Linie teilen",
        detail: "Ausgewogen: Klick und PPS kurz erhöht",
        mathTooltip: "30s click ×1.4 und prod ×1.15. Synergy-Pfad stärkt beides etwas.",
        apply: (s) => {
          addTimed(s, "click", 1.4, 30, "Split-Modus");
          addTimed(s, "prod", 1.15, 30, "Split-Modus");
        },
      },
    ],
  },
];

const EVENT_CHOICE_MS = 20000;

/** Anteil der investierten Prestige-Punkte pro Pfad (0–1), für Event-Anpassungen. */
function lineInfluenceNorm() {
  const ll = state.meta.lineLevels || {};
  const sum = (k) => Object.values(ll[k] || {}).reduce((a, b) => a + b, 0);
  const sp = sum("speed");
  const ef = sum("efficiency");
  const au = sum("automation");
  const sy = sum("synergy");
  const t = sp + ef + au + sy + 0.001;
  return { speed: sp / t, efficiency: ef / t, automation: au / t, synergy: sy / t };
}

function buildResolvedEvent(raw) {
  const inv = lineInfluenceNorm();
  const choices = raw.choices.map((c) => applyLineTreeToChoice(raw.id, { ...c }, inv));
  return {
    id: raw.id,
    title: raw.title,
    text: raw.text,
    visualTheme: raw.visualTheme || "default",
    lineHint: buildLineHint(inv),
    choices,
  };
}

function buildLineHint(inv) {
  const max = Math.max(inv.speed, inv.efficiency, inv.automation, inv.synergy);
  if (max < 0.08) return "Linienbaum: noch wenig investiert – alle Pfade wirken schwach.";
  if (inv.efficiency === max) return "Linienbaum: Efficiency dominiert → stabilere / mildere Optionen.";
  if (inv.speed === max) return "Linienbaum: Speed dominiert → aggressivere Boosts möglich.";
  if (inv.automation === max) return "Linienbaum: Automation dominiert → bessere Passiv-/Offline-lastige Boni.";
  return "Linienbaum: Synergy dominiert → ausgewogenere Kreuz-Boni.";
}

function applyLineTreeToChoice(eventId, c, inv) {
  const key = `${eventId}:${c.id}`;
  const eff = inv.efficiency;
  const spd = inv.speed;
  const aut = inv.automation;
  const syn = inv.synergy;

  if (key === "heat:cool") {
    const prodM = Math.min(0.97, 0.9 + eff * 0.14);
    const evAfter = Math.min(0.92, 0.8 + eff * 0.18);
    const extra = eff > 0.12 ? ` Efficiency: Abfall nur ${Math.round(prodM * 100)}%.` : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => {
        addTimed(s, "prod", prodM, 30, "Kühlung aktiv");
        applyDelayedEffectSafe(30000, () => addTimed(state, "eventRate", evAfter, 70, "Thermisch stabil"));
      },
    };
  }
  if (key === "heat:push") {
    const prodBoost = Math.min(1.62, 1.45 + spd * 0.2);
    const extra = spd > 0.12 ? ` Speed: Boost ${(prodBoost * 100 - 100).toFixed(0)}%.` : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => addTimed(s, "prod", prodBoost, 25, "Overheat-Boost"),
    };
  }
  if (key === "heat:split") {
    const ck = Math.min(1.52, 1.4 + syn * 0.15);
    const pr = Math.min(1.26, 1.15 + syn * 0.12);
    const extra = syn > 0.1 ? " Synergy: beide Modifikatoren etwas höher." : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => {
        addTimed(s, "click", ck, 30, "Split-Modus");
        addTimed(s, "prod", pr, 30, "Split-Modus");
      },
    };
  }
  if (key === "power:repair") {
    const prodM = Math.min(0.94, 0.85 + eff * 0.14);
    const extra = eff > 0.12 ? ` Efficiency: nur ${Math.round((1 - prodM) * 100)}% Abfall.` : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => addTimed(s, "prod", prodM, 20, "Reparatur aktiv"),
    };
  }
  if (key === "power:risk") {
    const hi = Math.min(1.5, 1.35 + spd * 0.18);
    const lo = Math.max(0.72, 0.8 - eff * 0.08);
    const extra = spd > 0.12 ? " Speed: höherer Hoch." : eff > 0.12 ? " Efficiency: milderes Nachbeben." : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => {
        addTimed(s, "prod", hi, 30, "Risikofahrt");
        applyDelayedEffectSafe(30000, () => addTimed(state, "prod", lo, 25, "Überhitzung"));
      },
    };
  }
  if (key === "power:backup") {
    const sec = 18 + aut * 14;
    const extra = aut > 0.12 ? ` Automation: +${sec.toFixed(0)}s Äquivalent.` : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: () => addPixels(currentPps() * sec, "Backup-Generator"),
    };
  }
  if (key === "security:ignore") {
    const evPen = Math.max(1.05, 1.2 - eff * 0.18);
    const extra = eff > 0.12 ? ` Efficiency: Sensoren nur ×${evPen.toFixed(2)}.` : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => {
        addPixels(currentPps() * 12, "Unsichere Ausbeute");
        addTimed(s, "eventRate", evPen, 40, "Instabile Sensoren");
      },
    };
  }
  if (key === "market:sell") {
    const mult = Math.min(1.58, 1.45 + spd * 0.16);
    const extra = spd > 0.12 ? " Speed: stärkerer Klick-Boost." : "";
    return {
      ...c,
      detail: `${c.detail}${extra}`,
      apply: (s) => addTimed(s, "click", mult, 35, "Verkaufspush"),
    };
  }
  return c;
}

const MISSIONS = [
  { id: "m_prod_short", type: "produce", name: "Schichtziel", desc: "Produziere {target} Pixel", baseTarget: 24000, reward: { pixel: 9000, season: 18 } },
  { id: "m_prod_long", type: "produce", name: "Fokuslauf", desc: "Produziere {target} Pixel", baseTarget: 140000, reward: { pixel: 65000, season: 32 } },
  { id: "m_click", type: "clicks", name: "Handarbeit", desc: "Mache {target} Klicks", baseTarget: 380, reward: { pixel: 18000, season: 24, timedClick: 1.55 } },
  { id: "m_event", type: "events", name: "Krisenmanager", desc: "Löse {target} Events", baseTarget: 4, reward: { season: 46, pixel: 24000 } },
  { id: "m_combo", type: "combo", name: "Flow-Kette", desc: "Erreiche eine Kombo von {target}", baseTarget: 20, reward: { season: 28, timedProd: 1.45 } },
];

/** Millisekunden bis zur nächsten vollen oder halben Stunde (echte Uhr). */
function msBisNaechsteHalbeStunde() {
  const jetzt = new Date();
  const minuten = jetzt.getMinutes();
  const sekunden = jetzt.getSeconds();
  const ms = jetzt.getMilliseconds();
  const sekBis = (minuten < 30 ? 30 - minuten : 60 - minuten) * 60 - sekunden;
  return sekBis * 1000 - ms;
}

/** Zeitpunkt (ms) des nächsten Wechsels an Halbstunden-Grenze. */
function naechsterMissionenWechselZeitpunkt() {
  return Date.now() + msBisNaechsteHalbeStunde();
}

const state = makeDefaultState();
const runtime = {
  running: false,
  lastTs: 0,
  autosave: 0,
  tab: "shop",
  forceShopRender: true,
  nextShopRenderAt: 0,
  recentEvents: [],
  lineTreeModalWired: false,
  lineTreeCenterNext: false,
  eventUiRaf: 0,
  eventDeadline: 0,
  prestigeMutationChoices: [],
  mutationSlotRunning: false,
  mutationSlotRaf: 0,
  pendingPrestigeMutationId: null,
  skillTreePan: { x: 0, y: 0 },
  skillTreePanWired: false,
};

const ui = {};
const canStructuredClone = typeof globalThis.structuredClone === "function";

function deepClone(value) {
  if (canStructuredClone) return globalThis.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function makeDefaultState() {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    economy: {
      pixel: 0,
      lifetimePixel: 0,
      clickBase: 1,
      clickMult: 1,
      prodMult: 1,
      comboBonus: 0,
      comboWindowBonus: 0,
      offlineEff: 0.3,
      buildings: Object.fromEntries(BUILDINGS.map((b) => [b.id, 0])),
      boughtUpgrades: [],
      bulk: 1,
      discountBuys: 0,
    },
    meta: {
      prestige: 0,
      prestigePoints: 0,
      selectedLine: null,
      lineLocked: false,
      lineLevels: { speed: {}, efficiency: {}, automation: {}, synergy: {} },
      mutationIds: [],
      seasonPoints: 0,
      claimedSeasonTiers: [],
      eventRateMult: 1,
      lineProdMult: 1,
      lineClickMult: 1,
      mutationProdMult: 1,
      mutationClickMult: 1,
      missionRewardMult: 1,
      prestigeThresholdMult: 1,
      eventPenaltyMult: 1,
    },
    session: {
      runToken: Date.now(),
      producedRun: 0,
      clicksRun: 0,
      eventsSolved: 0,
      maxCombo: 0,
      missions: [],
      activeEffects: [],
      activeEvent: null,
      nextEventAt: Date.now() + BASE_EVENT_INTERVAL_MS,
      nextMissionRefreshAt: naechsterMissionenWechselZeitpunkt(),
      comboCount: 0,
      comboUntil: 0,
      discoveredBuildings: { worker: true },
      discoveredUpgrades: {},
      lastSaveAt: 0,
    },
    cosmetics: {
      skin: "default",
    },
  };
}

function fmtNumber(v) {
  if (!Number.isFinite(v)) return "0";
  if (Math.abs(v) < 10) return v.toFixed(2);
  if (v < 1000) return Math.floor(v).toString();
  if (v < 1_000_000) return `${(v / 1000).toFixed(2)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return `${(v / 1_000_000_000).toFixed(2)}B`;
}

function fmtPps(v) {
  if (v < 1) return v.toFixed(2);
  return fmtNumber(v);
}

function getComboMult() {
  if (Date.now() > state.session.comboUntil) return 1;
  const base = 1 + Math.min(1.7, state.session.comboCount * (0.045 + state.economy.comboBonus));
  return base;
}

function activeMult(key) {
  let m = 1;
  for (const e of state.session.activeEffects) {
    if (e.key === key) m *= e.mult;
  }
  return m;
}

function currentPps() {
  let pps = 0;
  for (const b of BUILDINGS) pps += (state.economy.buildings[b.id] || 0) * b.pps;
  return pps
    * state.economy.prodMult
    * state.meta.lineProdMult
    * state.meta.mutationProdMult
    * activeMult("prod");
}

function currentPpk() {
  let progressClickBoost =
    1
    + Math.log10(state.economy.lifetimePixel + 10) * 0.4
    + state.meta.prestige * 0.2;

  // Early/Midgame: Klick soll ~10–20 % der Gesamt-„Feel“-Produktion liefern (bei ~5–8 Klicks/s + Kombo).
  if (state.economy.lifetimePixel < 50_000) progressClickBoost *= 1.85;
  else if (state.economy.lifetimePixel < 2_000_000) progressClickBoost *= 1.5;
  else if (state.economy.lifetimePixel < 80_000_000) progressClickBoost *= 1.22;

  return state.economy.clickBase
    * state.economy.clickMult
    * state.meta.lineClickMult
    * state.meta.mutationClickMult
    * progressClickBoost
    * getComboMult()
    * activeMult("click")
    * ipadTouchPpcBonus();
}

function prestigeThreshold() {
  return Math.floor(PRESTIGE_BASE * Math.pow(PRESTIGE_GROWTH, state.meta.prestige) * state.meta.prestigeThresholdMult);
}

function seasonLevel() {
  return Math.floor(state.meta.seasonPoints / 100);
}

function missionScaledTarget(base) {
  const p = state.meta.prestige;
  return Math.floor(base * (1 + p * 0.7));
}

function missionRewardScaled(v) {
  return Math.floor(v * (1 + state.meta.prestige * 0.3) * state.meta.missionRewardMult * activeMult("missionReward"));
}

function addPixels(amount, reason = "") {
  if (amount <= 0) return;
  state.economy.pixel += amount;
  state.economy.lifetimePixel += amount;
  state.session.producedRun += amount;
  if (reason) toast(`+${fmtNumber(amount)} Pixel · ${reason}`);
}

function addSeasonPoints(amount, reason = "") {
  if (amount <= 0) return;
  state.meta.seasonPoints += amount;
  if (reason) toast(`+${amount} Saisonpunkte · ${reason}`);
}

function addTimed(s, key, mult, seconds, label) {
  s.session.activeEffects.push({ key, mult, until: Date.now() + seconds * 1000, label });
  showBanner(`${label} (${seconds}s)`);
}

function tickEffects() {
  const now = Date.now();
  state.session.activeEffects = state.session.activeEffects.filter((e) => e.until > now);
}

function discoverUnlocks() {
  for (const b of BUILDINGS) {
    if (state.session.discoveredBuildings[b.id]) continue;
    if (state.economy.pixel >= b.unlockAt) state.session.discoveredBuildings[b.id] = true;
  }
  for (const u of UPGRADES) {
    if (state.session.discoveredUpgrades[u.id]) continue;
    if (state.economy.pixel >= u.unlockAt) state.session.discoveredUpgrades[u.id] = true;
  }
}

function buildingCost(b, extraIndex = 0) {
  const count = (state.economy.buildings[b.id] || 0) + extraIndex;
  let cost = Math.floor(b.baseCost * Math.pow(b.growth, count));
  if (state.economy.discountBuys > 0) cost = Math.floor(cost * 0.75);
  return cost;
}

function canBuyBuildingAmount(b, amount) {
  let left = state.economy.pixel;
  let bought = 0;
  for (let i = 0; i < amount; i += 1) {
    const c = buildingCost(b, i);
    if (left < c) break;
    left -= c;
    bought += 1;
  }
  return bought;
}

function buyBuilding(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b || !state.session.discoveredBuildings[id]) return;
  let target = state.economy.bulk;
  if (target === 0) target = 9999;
  const can = canBuyBuildingAmount(b, target);
  if (can <= 0) return;

  let total = 0;
  for (let i = 0; i < can; i += 1) total += buildingCost(b, i);
  state.economy.pixel -= total;
  state.economy.buildings[id] += can;
  if (state.economy.discountBuys > 0) state.economy.discountBuys = Math.max(0, state.economy.discountBuys - 1);
  runtime.forceShopRender = true;
  renderStats();
}

function buyUpgrade(id) {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u || !state.session.discoveredUpgrades[id]) return;
  if (state.economy.boughtUpgrades.includes(id)) return;
  if (state.economy.pixel < u.cost) return;
  state.economy.pixel -= u.cost;
  state.economy.boughtUpgrades.push(id);
  u.apply(state);
  runtime.forceShopRender = true;
  renderStats();
}

function recomputeMetaFromLineAndMutations() {
  state.meta.eventRateMult = 1;
  state.meta.lineProdMult = 1;
  state.meta.lineClickMult = 1;
  state.meta.mutationProdMult = 1;
  state.meta.mutationClickMult = 1;
  state.meta.missionRewardMult = 1;
  state.meta.prestigeThresholdMult = 1;
  state.meta.eventPenaltyMult = 1;

  for (const id of state.meta.mutationIds) {
    const m = MUTATIONS.find((x) => x.id === id);
    if (m) m.apply(state);
  }

  for (const lineKey of Object.keys(LINE_TREES)) {
    const tree = LINE_TREES[lineKey];
    if (!tree || !Array.isArray(tree)) continue;
    const levels = state.meta.lineLevels[lineKey] || {};
    for (const node of tree) {
      const lvl = levels[node.id] || 0;
      if (lvl > 0) node.effect(state, lvl);
    }
  }
}

function levelOfNode(line, nodeId) {
  return (state.meta.lineLevels[line] || {})[nodeId] || 0;
}

function canUpgradeLineNode(line, node) {
  if (state.meta.prestigePoints < node.cost) return false;
  if (levelOfNode(line, node.id) >= node.max) return false;
  if (node.req && levelOfNode(line, node.req) <= 0) return false;
  if (node.reqCross) {
    for (const rc of node.reqCross) {
      const need = rc.min != null ? rc.min : 1;
      if (levelOfNode(rc.line, rc.id) < need) return false;
    }
  }
  return true;
}

function upgradeLineNode(line, nodeId) {
  const tree = LINE_TREES[line];
  if (!tree) return;
  const node = tree.find((n) => n.id === nodeId);
  if (!node || !canUpgradeLineNode(line, node)) return;
  state.meta.prestigePoints -= node.cost;
  if (!state.meta.lineLevels[line]) state.meta.lineLevels[line] = {};
  state.meta.lineLevels[line][node.id] = levelOfNode(line, node.id) + 1;
  recomputeMetaFromLineAndMutations();
  renderLineTree();
  renderStats();
}

function selectLine(line) {
  if (!LINE_TREES[line]) return;
  state.meta.selectedLine = line;
  runtime.forceShopRender = true;
  renderStats();
  toast(`Fokus: ${line.toUpperCase()} (alle Pfade kaufbar im Linienbaum)`);
}

function randomMissionSet() {
  const pool = [...MISSIONS];
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    const m = pool.splice(i, 1)[0];
    const target = missionScaledTarget(m.baseTarget);
    out.push({ ...m, target, progress: 0, done: false });
  }
  state.session.missions = out;
  state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
}

function missionProgress(m) {
  if (m.type === "produce") return state.session.producedRun;
  if (m.type === "clicks") return state.session.clicksRun;
  if (m.type === "events") return state.session.eventsSolved;
  if (m.type === "combo") return state.session.maxCombo;
  return 0;
}

function completeMission(m) {
  m.done = true;
  if (m.reward.pixel) addPixels(missionRewardScaled(m.reward.pixel), "Mission");
  if (m.reward.season) addSeasonPoints(missionRewardScaled(m.reward.season), "Mission");
  if (m.reward.timedProd) addTimed(state, "prod", m.reward.timedProd, 45, "Missions-Boost");
  if (m.reward.timedClick) addTimed(state, "click", m.reward.timedClick, 45, "Missions-Boost");
  toast(`Mission geschafft: ${m.name}`);
}

function updateMissions() {
  if (!state.session.nextMissionRefreshAt) {
    state.session.nextMissionRefreshAt = naechsterMissionenWechselZeitpunkt();
  }
  if (Date.now() >= state.session.nextMissionRefreshAt) {
    randomMissionSet();
    toast("Neue Missionen sind eingetroffen.");
  }
  for (const m of state.session.missions) {
    if (m.done) continue;
    m.progress = Math.min(m.target, missionProgress(m));
    if (m.progress >= m.target) completeMission(m);
  }
}

function pickEvent() {
  const candidates = EVENT_POOL.filter((e) => !runtime.recentEvents.includes(e.id));
  const pool = candidates.length > 0 ? candidates : EVENT_POOL;
  const e = pool[Math.floor(Math.random() * pool.length)];
  runtime.recentEvents.push(e.id);
  if (runtime.recentEvents.length > 3) runtime.recentEvents.shift();
  return e;
}

function eventInterval() {
  return Math.floor(BASE_EVENT_INTERVAL_MS * state.meta.eventRateMult * activeMult("eventRate"));
}

function maybeSpawnEvent() {
  if (state.session.activeEvent) return;
  if (Date.now() < state.session.nextEventAt) return;
  const raw = pickEvent();
  state.session.activeEvent = buildResolvedEvent(raw);
  state.session.nextEventAt = Date.now() + eventInterval();
  renderEventModal();
}

function stopEventUiTimer() {
  if (runtime.eventUiRaf) {
    cancelAnimationFrame(runtime.eventUiRaf);
    runtime.eventUiRaf = 0;
  }
  runtime.eventDeadline = 0;
  const vig = document.getElementById("eventVignette");
  if (vig) vig.className = "pf-event-vignette";
}

function setEventVignetteTheme(theme) {
  const vig = document.getElementById("eventVignette");
  if (!vig) return;
  vig.className = "pf-event-vignette";
  if (!theme || theme === "off" || theme === "default") return;
  if (theme === "heat") vig.classList.add("pf-event-vignette--heat");
  else if (theme === "amber") vig.classList.add("pf-event-vignette--amber");
  else if (theme === "gold") vig.classList.add("pf-event-vignette--gold");
  else if (theme === "blue") vig.classList.add("pf-event-vignette--blue");
  else if (theme === "emerald") vig.classList.add("pf-event-vignette--emerald");
  else vig.classList.add("pf-event-vignette--soft");
}

function closeLineTreeTooltip() {
  if (!ui.lineTreeTooltip) return;
  ui.lineTreeTooltip.classList.add("versteckt");
  ui.lineTreeTooltip.hidden = true;
  const body = document.getElementById("lineTreeTooltipBody");
  if (body) body.textContent = "";
}

function showPfFloatingTooltip(anchor, text) {
  if (!ui.lineTreeTooltip || !text) return;
  const body = document.getElementById("lineTreeTooltipBody");
  if (body) body.textContent = text;
  else ui.lineTreeTooltip.textContent = text;
  ui.lineTreeTooltip.classList.remove("versteckt");
  ui.lineTreeTooltip.hidden = false;
  const r = anchor.getBoundingClientRect();
  const pad = 8;
  const tw = 300;
  ui.lineTreeTooltip.style.left = `${Math.min(window.innerWidth - tw - pad, Math.max(pad, r.left + r.width / 2 - tw / 2))}px`;
  ui.lineTreeTooltip.style.top = `${Math.min(window.innerHeight - 160, r.bottom + pad)}px`;
}

function autoResolveEventWorst() {
  const e = state.session.activeEvent;
  if (!e || !e.choices.length) return;
  let worst = e.choices[0];
  for (const c of e.choices) {
    if ((c.risk ?? 5) < (worst.risk ?? 5)) worst = c;
  }
  toast("Zeit abgelaufen – automatisch gewählt (niedrigster Erwartungswert).");
  resolveEvent(worst.id);
}

function tickEventTimer() {
  const fill = document.getElementById("eventTimerFill");
  const e = state.session.activeEvent;
  if (!e || !runtime.eventDeadline) {
    stopEventUiTimer();
    return;
  }
  const left = Math.max(0, runtime.eventDeadline - Date.now());
  const pct = left / EVENT_CHOICE_MS;
  if (fill) fill.style.width = `${pct * 100}%`;
  if (left <= 0) {
    stopEventUiTimer();
    autoResolveEventWorst();
    return;
  }
  runtime.eventUiRaf = requestAnimationFrame(tickEventTimer);
}

function resolveEvent(choiceId) {
  const e = state.session.activeEvent;
  if (!e) return;
  const choice = e.choices.find((c) => c.id === choiceId);
  if (!choice) return;
  stopEventUiTimer();
  choice.apply(state);
  state.session.eventsSolved += 1;
  state.session.activeEvent = null;
  ui.eventOverlay.classList.add("versteckt");
  updateMissions();
}

// Minigames wurden bewusst entfernt.

function calcPrestigeGain() {
  return 1;
}

function mutationRarityClass(r) {
  if (r === "epic") return "epic";
  if (r === "rare") return "rare";
  return "common";
}

function mutationRarityLabel(r) {
  if (r === "epic") return "Episch";
  if (r === "rare") return "Selten";
  return "Üblich";
}

function spawnPrestigeModalConfetti() {
  const c = document.getElementById("prestigeModalConfetti");
  if (!c || !c.getContext) return;
  const ctx = c.getContext("2d");
  const rect = c.getBoundingClientRect();
  const w = (c.width = Math.max(320, rect.width || 380));
  const h = (c.height = Math.max(200, rect.height || 260));
  const parts = [];
  for (let i = 0; i < 96; i++) {
    parts.push({
      x: w / 2 + (Math.random() - 0.5) * 60,
      y: h * 0.15 + Math.random() * 40,
      vx: (Math.random() - 0.5) * 7,
      vy: -Math.random() * 9 - 1,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      col: ["#c4b5fd", "#fcd34d", "#93c5fd", "#6ee7b7", "#f9a8d4"][i % 5],
      s: 3 + Math.random() * 7,
    });
  }
  let frame = 0;
  function step() {
    frame += 1;
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42;
      p.rot += p.vr;
      if (p.y < h + 24) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.55);
      ctx.restore();
    }
    if (alive && frame < 100) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const TUTORIAL_LS_KEY = "pf_pixel_factory_rework_tutorial_done";

function syncTutorialSkipFromState() {
  try {
    if (state.meta.prestige > 0 || state.meta.prestigePoints > 0) {
      localStorage.setItem(TUTORIAL_LS_KEY, "1");
    }
  } catch (_) {
    /* ignore */
  }
}

function shouldShowTutorial() {
  try {
    if (localStorage.getItem(TUTORIAL_LS_KEY) === "1") return false;
  } catch (_) {
    /* ignore */
  }
  if (state.meta.prestige > 0) return false;
  if (state.meta.prestigePoints > 0) return false;
  return true;
}

function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_LS_KEY, "1");
  } catch (_) {
    /* ignore */
  }
}

function cancelMutationSlotAnimation() {
  if (runtime.mutationSlotRaf) {
    cancelAnimationFrame(runtime.mutationSlotRaf);
    runtime.mutationSlotRaf = 0;
  }
  document.getElementById("prestigeConfirmModal")?.classList.remove("pf-prestige-modal--rolling");
  document.getElementById("mutationSlotPanel")?.classList.remove("pf-slot-panel--rolling");
}

/** Zeigt während des Würfelns eine Karten-Vorschau (Sammelkarten-Look). */
function renderSlotStripPreview(m) {
  const strip = document.getElementById("mutationSlotStrip");
  if (!strip || !m) return;
  strip.innerHTML = `
    <div class="pf-mutation-card pf-mutation-card--${mutationRarityClass(m.rarity)} pf-mutation-card--slot-spin">
      <span class="pf-mutation-card__rarity">${mutationRarityLabel(m.rarity)}</span>
      <span class="pf-mutation-card__icon" aria-hidden="true">${m.icon || "✦"}</span>
      <strong class="pf-mutation-card__title">${escapeHtmlPf(m.title)}</strong>
      <span class="pf-mutation-card__desc">${escapeHtmlPf(m.text)}</span>
    </div>`;
}

function runMutationSlotMachine() {
  const choices = runtime.prestigeMutationChoices;
  if (!choices?.length || runtime.mutationSlotRunning) return;
  cancelMutationSlotAnimation();
  runtime.mutationSlotRunning = true;
  runtime.pendingPrestigeMutationId = null;

  const quickBtn = document.getElementById("prestigeConfirmJa");
  const neinBtn = document.getElementById("prestigeConfirmNein");
  const finalizeBtn = document.getElementById("prestigeFinalizeBtn");
  if (quickBtn) quickBtn.disabled = true;
  if (neinBtn) neinBtn.disabled = false;

  const overlay = document.getElementById("mutationSlotOverlay");
  const panel = document.getElementById("mutationSlotPanel");
  const statusEl = document.getElementById("mutationSlotStatus");
  const resultEl = document.getElementById("mutationSlotResult");
  const modalBg = document.getElementById("prestigeConfirmModal");

  if (resultEl) {
    resultEl.classList.add("versteckt");
    resultEl.innerHTML = "";
  }
  if (finalizeBtn) {
    finalizeBtn.classList.add("versteckt");
    finalizeBtn.disabled = true;
  }

  if (statusEl) statusEl.textContent = "Die Mutation wird gewürfelt …";
  if (overlay) overlay.classList.remove("versteckt");
  if (panel) panel.classList.add("pf-slot-panel--rolling");
  if (modalBg) modalBg.classList.add("pf-prestige-modal--rolling");

  spawnPrestigeModalConfetti();

  const final = choices[Math.floor(Math.random() * choices.length)];
  const rollMs = 2000 + Math.random() * 1000;
  const t0 = performance.now();
  let lastSparkle = t0;

  function finishRoll() {
    runtime.mutationSlotRunning = false;
    if (panel) panel.classList.remove("pf-slot-panel--rolling");
    if (modalBg) modalBg.classList.remove("pf-prestige-modal--rolling");

    const strip = document.getElementById("mutationSlotStrip");
    if (strip) strip.innerHTML = "";

    runtime.pendingPrestigeMutationId = final.id;

    if (statusEl) statusEl.textContent = "Deine Mutation:";
    if (resultEl) {
      resultEl.classList.remove("versteckt");
      resultEl.innerHTML = `
        <div class="pf-mutation-card-wrap pf-mutation-card-wrap--result">
          <button type="button" class="pf-mutation-card__tip" data-math-detail="${escapeHtmlPf(final.mathDetail || final.detail)}" aria-label="Formeln">?</button>
          <div class="pf-mutation-card pf-mutation-card--${mutationRarityClass(final.rarity)} pf-mutation-card--result-reveal">
            <span class="pf-mutation-card__rarity">${mutationRarityLabel(final.rarity)}</span>
            <span class="pf-mutation-card__icon" aria-hidden="true">${final.icon || "✦"}</span>
            <strong class="pf-mutation-card__title">${escapeHtmlPf(final.title)}</strong>
            <span class="pf-mutation-card__desc">${escapeHtmlPf(final.text)}</span>
          </div>
        </div>`;
      const tip = resultEl.querySelector(".pf-mutation-card__tip");
      tip?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        showPfFloatingTooltip(tip, tip.dataset.mathDetail || "");
      });
    }
    if (finalizeBtn) {
      finalizeBtn.classList.remove("versteckt");
      finalizeBtn.disabled = false;
    }
    if (quickBtn) quickBtn.disabled = true;
    if (neinBtn) neinBtn.disabled = false;
  }

  function tick(now) {
    const elapsed = now - t0;
    const i = Math.floor(elapsed / 85) % choices.length;
    renderSlotStripPreview(choices[i]);
    if (now - lastSparkle > 450) {
      lastSparkle = now;
      spawnPrestigeModalConfetti();
    }
    if (elapsed < rollMs) {
      runtime.mutationSlotRaf = requestAnimationFrame(tick);
    } else {
      runtime.mutationSlotRaf = 0;
      finishRoll();
    }
  }

  runtime.mutationSlotRaf = requestAnimationFrame(tick);
}

function openPrestigeModal() {
  if (state.economy.lifetimePixel < prestigeThreshold()) return;
  cancelMutationSlotAnimation();
  runtime.mutationSlotRunning = false;
  runtime.pendingPrestigeMutationId = null;
  document.getElementById("mutationSlotOverlay")?.classList.add("versteckt");
  document.getElementById("mutationSlotResult")?.classList.add("versteckt");
  document.getElementById("prestigeFinalizeBtn")?.classList.add("versteckt");
  const stripReset = document.getElementById("mutationSlotStrip");
  if (stripReset) stripReset.innerHTML = "";
  const statusReset = document.getElementById("mutationSlotStatus");
  if (statusReset) statusReset.textContent = "Die Mutation wird gewürfelt …";

  const choices = [];
  const src = [...MUTATIONS];
  while (choices.length < 3 && src.length > 0) {
    const i = Math.floor(Math.random() * src.length);
    choices.push(src.splice(i, 1)[0]);
  }
  runtime.prestigeMutationChoices = choices;
  const wrap = document.getElementById("mutationChoices");
  if (!wrap) return;
  ui.pcQP.textContent = `+${calcPrestigeGain()} Prestigepunkt`;
  wrap.innerHTML = choices.map((m) => `
    <div class="pf-mutation-card-wrap">
      <button type="button" class="pf-mutation-card__tip" data-math-detail="${escapeHtmlPf(m.mathDetail || m.detail)}" aria-label="Formeln">?</button>
      <button type="button" class="pf-mutation-card pf-mutation-card--${mutationRarityClass(m.rarity)}" data-mut="${m.id}">
        <span class="pf-mutation-card__rarity">${mutationRarityLabel(m.rarity)}</span>
        <span class="pf-mutation-card__icon" aria-hidden="true">${m.icon || "✦"}</span>
        <strong class="pf-mutation-card__title">${escapeHtmlPf(m.title)}</strong>
        <span class="pf-mutation-card__desc">${escapeHtmlPf(m.text)}</span>
      </button>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-mut]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (runtime.mutationSlotRunning) return;
      doPrestige(btn.dataset.mut);
    });
  });
  wrap.querySelectorAll(".pf-mutation-card__tip").forEach((el) => {
    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      showPfFloatingTooltip(el, el.dataset.mathDetail || "");
    });
  });

  const quickBtn = document.getElementById("prestigeConfirmJa");
  const neinBtn = document.getElementById("prestigeConfirmNein");
  if (quickBtn) {
    quickBtn.textContent = "Zufällige Mutation";
    quickBtn.disabled = false;
    quickBtn.onclick = () => runMutationSlotMachine();
  }
  if (neinBtn) neinBtn.disabled = false;
  ui.prestigeModal.classList.remove("versteckt");
  requestAnimationFrame(() => spawnPrestigeModalConfetti());
}

function doPrestige(mutationId) {
  const mutation = MUTATIONS.find((m) => m.id === mutationId);
  if (!mutation) return;
  runtime.pendingPrestigeMutationId = null;
  state.meta.prestige += 1;
  state.meta.prestigePoints += calcPrestigeGain();
  state.meta.mutationIds.push(mutationId);
  state.meta.lineLocked = false;

  const keepMeta = deepClone(state.meta);
  const keepCos = deepClone(state.cosmetics);
  const fresh = makeDefaultState();
  const nextRunToken = Date.now();
  state.economy = fresh.economy;
  state.session = fresh.session;
  state.session.runToken = nextRunToken;
  state.meta = keepMeta;
  state.cosmetics = keepCos;

  randomMissionSet();
  recomputeMetaFromLineAndMutations();
  ui.prestigeModal.classList.add("versteckt");
  document.getElementById("mutationSlotOverlay")?.classList.add("versteckt");
  runtime.mutationSlotRunning = false;
  runtime.forceShopRender = true;
  renderStats();
  renderMissions();
  renderLineTree();
  toast(`Prestige ${state.meta.prestige} · Mutation: ${mutation.title} · +1 Prestigepunkt`);
}

function applyOfflineBonus(lastTs) {
  if (!lastTs) return;
  const delta = Math.max(0, Date.now() - lastTs);
  if (delta < 60000) return;
  const hours = Math.min(18, delta / 3600000);
  const bonus = currentPps() * hours * 3600 * state.economy.offlineEff;
  addPixels(bonus, "Offline");
}

/** Kurzer sichtbarer Hinweis nach automatischem Supabase-Speichern. */
function zeigeSpeicherHinweis() {
  const el = document.getElementById("autosaveInd");
  if (!el) return;
  el.textContent = "Gespeichert ✓";
  el.classList.add("autosave-sichtbar");
  clearTimeout(zeigeSpeicherHinweis._t);
  zeigeSpeicherHinweis._t = setTimeout(() => {
    el.textContent = "";
    el.classList.remove("autosave-sichtbar");
  }, 1000);
}

async function saveGame(withToast = false, zeigeHinweis = false) {
  if (new URLSearchParams(location.search).has("admin")) return;
  const user = await PZ.getUser();
  if (!user) return;
  state.session.lastSaveAt = Date.now();
  const payload = deepClone(state);
  const res = await PZ.saveGameData(GAME_ID, Math.floor(state.economy.lifetimePixel), state.meta.prestige, payload);
  if (res.error) console.error("[Pixel Factory] Speichern fehlgeschlagen:", res.error);
  if (withToast) toast("Gespeichert");
  if (zeigeHinweis && !res.error) zeigeSpeicherHinweis();
}

async function loadGame() {
  const data = await PZ.loadScore(GAME_ID);
  if (!data || !data.extra_daten) {
    randomMissionSet();
    return;
  }

  let incoming = data.extra_daten;
  if (incoming.schemaVersion === 3) {
    incoming = { ...incoming, schemaVersion: SAVE_SCHEMA_VERSION };
    if (!incoming.meta) incoming.meta = {};
    if (!incoming.meta.lineLevels) incoming.meta.lineLevels = {};
    if (!incoming.meta.lineLevels.synergy) incoming.meta.lineLevels.synergy = {};
  }
  if (incoming.schemaVersion !== SAVE_SCHEMA_VERSION) {
    Object.assign(state, makeDefaultState());
    randomMissionSet();
    await saveGame(false);
    ui.offlineBonus.hidden = false;
    ui.offlineBonus.textContent = "Hard-Reset aktiv: alter Spielstand wurde auf die aktuelle Version gesetzt.";
    setTimeout(() => { ui.offlineBonus.hidden = true; }, 8000);
    return;
  }

  const fresh = makeDefaultState();
  state.economy = {
    ...fresh.economy,
    ...(incoming.economy || {}),
    buildings: {
      ...fresh.economy.buildings,
      ...((incoming.economy && incoming.economy.buildings) || {}),
    },
    boughtUpgrades: Array.isArray(incoming.economy?.boughtUpgrades)
      ? incoming.economy.boughtUpgrades
      : fresh.economy.boughtUpgrades,
  };
  state.meta = {
    ...fresh.meta,
    ...(incoming.meta || {}),
    lineLevels: {
      ...fresh.meta.lineLevels,
      ...(incoming.meta?.lineLevels || {}),
      speed: { ...fresh.meta.lineLevels.speed, ...(incoming.meta?.lineLevels?.speed || {}) },
      efficiency: { ...fresh.meta.lineLevels.efficiency, ...(incoming.meta?.lineLevels?.efficiency || {}) },
      automation: { ...fresh.meta.lineLevels.automation, ...(incoming.meta?.lineLevels?.automation || {}) },
      synergy: { ...fresh.meta.lineLevels.synergy, ...(incoming.meta?.lineLevels?.synergy || {}) },
    },
    mutationIds: Array.isArray(incoming.meta?.mutationIds)
      ? incoming.meta.mutationIds
      : fresh.meta.mutationIds,
    claimedSeasonTiers: Array.isArray(incoming.meta?.claimedSeasonTiers)
      ? incoming.meta.claimedSeasonTiers
      : fresh.meta.claimedSeasonTiers,
  };
  state.session = {
    ...fresh.session,
    ...(incoming.session || {}),
    discoveredBuildings: {
      ...fresh.session.discoveredBuildings,
      ...(incoming.session?.discoveredBuildings || {}),
    },
    discoveredUpgrades: {
      ...fresh.session.discoveredUpgrades,
      ...(incoming.session?.discoveredUpgrades || {}),
    },
    missions: Array.isArray(incoming.session?.missions)
      ? incoming.session.missions
      : fresh.session.missions,
    activeEffects: Array.isArray(incoming.session?.activeEffects)
      ? incoming.session.activeEffects
      : fresh.session.activeEffects,
  };
  state.cosmetics = {
    ...fresh.cosmetics,
    ...(incoming.cosmetics || {}),
  };
  state.schemaVersion = SAVE_SCHEMA_VERSION;

  if (!Array.isArray(state.session.missions) || state.session.missions.length === 0) randomMissionSet();
  if (state.session.nextMissionRefreshAt < Date.now()) randomMissionSet();
  recomputeMetaFromLineAndMutations();
  applyOfflineBonus(state.session.lastSaveAt);
}

function showBanner(txt) {
  ui.banner.hidden = false;
  ui.banner.textContent = txt;
  setTimeout(() => { ui.banner.hidden = true; }, 2500);
}

function toast(txt) {
  const d = document.createElement("div");
  d.className = "toast";
  d.textContent = txt;
  ui.toast.appendChild(d);
  setTimeout(() => d.remove(), 2300);
}

function drawPile() {
  const c = ui.canvas;
  const ctx = c.getContext("2d");
  const w = c.width;
  const h = c.height;
  ctx.clearRect(0, 0, w, h);

  const stage = Math.min(1, Math.log10(state.economy.pixel + 1) / 7);
  const radius = 44 + stage * 88;
  const skin = SKINS.find((s) => s.id === state.cosmetics.skin) || SKINS[0];
  const time = Date.now() * 0.00045;
  const toneA = skin.pile?.a || "90,140,255";
  const toneB = skin.pile?.b || "60,95,220";
  const glow = 0.22 + stage * 0.5;

  ctx.save();
  ctx.translate(w / 2, h / 2 + 14);
  const g = ctx.createRadialGradient(0, 0, 10, 0, 0, radius + 24);
  g.addColorStop(0, `rgba(${toneA},${0.3 + stage * 0.25})`);
  g.addColorStop(1, `rgba(${toneB},0.08)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 20, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 120; i += 1) {
    const a = (Math.PI * 2 * i) / 120 + time * 0.22;
    const r = ((i * 37) % 97) / 97 * radius;
    const wobble = Math.sin(time + i * 0.35) * (2 + stage * 2);
    const x = Math.cos(a) * (r + wobble);
    const y = Math.sin(a) * (r + wobble) * 0.62;
    const size = 2 + ((i * 13) % 7) * 0.45 + stage * 1.5;
    const light = 52 + ((i * 19) % 28);
    ctx.fillStyle = `hsla(${212 + stage * 68 + (i % 12)},82%,${light}%,${0.72 + glow * 0.2})`;
    ctx.fillRect(x, y, size, size);
  }

  ctx.strokeStyle = `rgba(${toneA},0.55)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 8 + Math.sin(time * 1.4) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function renderStats() {
  ui.statPixel.textContent = `${fmtNumber(state.economy.pixel)} Pixel`;
  ui.statPps.textContent = fmtPps(currentPps());
  ui.statPpk.textContent = fmtPps(currentPpk());
  ui.statQp.textContent = `${state.meta.prestigePoints}`;
  ui.statPrestige.textContent = `${state.meta.prestige}`;

  const needed = prestigeThreshold() - state.economy.lifetimePixel;
  const ready = needed <= 0;
  ui.prestigeBtn.disabled = !ready;
  ui.prestigeInfo.textContent = ready
    ? "Prestige bereit · Mutation wählen"
    : `${fmtNumber(needed)} Pixel bis Prestige`;

  const comboActive = Date.now() <= state.session.comboUntil;
  const fill = comboActive ? Math.max(0, (state.session.comboUntil - Date.now()) / (COMBO_WINDOW_MS + state.economy.comboWindowBonus)) : 0;
  ui.comboFill.style.width = `${Math.floor(fill * 100)}%`;
  ui.comboLabel.textContent = comboActive
    ? `Kombo x${getComboMult().toFixed(2)} (${state.session.comboCount})`
    : "Kombo";
}

function renderMissions() {
  const leftMs = Math.max(0, (state.session.nextMissionRefreshAt || 0) - Date.now());
  const leftMin = Math.floor(leftMs / 60000);
  const leftSec = Math.floor((leftMs % 60000) / 1000);
  const refreshInfo = document.getElementById("missionRefreshInfo");
  if (refreshInfo) refreshInfo.textContent = `Neu in ${leftMin}:${String(leftSec).padStart(2, "0")}`;

  ui.missionList.innerHTML = state.session.missions.map((m) => {
    const ratio = Math.min(1, (m.progress || 0) / m.target);
    const rewards = [];
    if (m.reward.pixel) rewards.push(`${missionRewardScaled(m.reward.pixel)} Pixel`);
    if (m.reward.season) rewards.push(`${missionRewardScaled(m.reward.season)} Saison`);
    return `
      <div class="mission-card ${m.done ? "done" : ""}">
        <div class="mission-top"><strong>${m.name}</strong><span>${Math.floor(ratio * 100)}%</span></div>
        <div class="upgrade-text">${m.desc.replace("{target}", fmtNumber(m.target))}</div>
        <div class="mission-bar"><div style="width:${ratio * 100}%"></div></div>
        <div class="mission-reward">${rewards.join(" · ")}</div>
      </div>
    `;
  }).join("");
}

/** Shop-Upgrade-Karte: Klick (blau) / Produktion (Bernstein) / Sonstiges */
function upgradeCardKind(u) {
  if (u.id.startsWith("u_click")) return "click";
  if (u.id.startsWith("u_prod")) return "prod";
  return "other";
}

function renderShopCards() {
  ui.shopMain.innerHTML = `<div class="pf-card-grid pf-card-grid--shop">${BUILDINGS.map((b) => {
    const discovered = !!state.session.discoveredBuildings[b.id];
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
    const can = canBuyBuildingAmount(b, state.economy.bulk === 0 ? 1 : state.economy.bulk) > 0;
    const cost = buildingCost(b, 0);
    const cnt = state.economy.buildings[b.id] || 0;
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

  ui.shopMain.querySelectorAll("[data-buy-building]").forEach((btn) => {
    btn.addEventListener("click", () => buyBuilding(btn.dataset.buyBuilding));
  });
}

function renderUpgradeCards() {
  const lineButtons = `
    <div class="pf-path-hint" role="note">
      <p class="pf-section-hint"><strong>Linienbaum:</strong> Tab „Linienbaum“ öffnet den Vollbild-Baum mit drei Pfaden (Speed · Efficiency · Automation) und Synergie-Knoten. Du kannst parallel in allen Pfaden investieren – Voraussetzungen siehst du im Baum.</p>
      <div class="pf-path-grid pf-path-grid--compact">
      ${["speed", "efficiency", "automation"].map((line) => `
        <button type="button" class="pf-path-card ${state.meta.selectedLine === line ? "pf-path-card--active" : ""}" data-line-pick="${line}">
          <span class="pf-path-card__tag">${line === "speed" ? "⚡" : line === "efficiency" ? "✓" : "🤖"}</span>
          <strong class="pf-path-card__title">${line.toUpperCase()}</strong>
          <span class="pf-path-card__sub">${line === "speed" ? "Tempo & Klick" : line === "efficiency" ? "Stabilität & Kontrolle" : "Auto & Offline"}</span>
        </button>
      `).join("")}
      </div>
      <p class="pf-section-hint">Kurz-Fokus für die Anzeige – Käufe sind nicht eingeschränkt.</p>
    </div>
  `;

  const byKind = { click: [], prod: [], other: [] };
  for (const u of UPGRADES) {
    const k = upgradeCardKind(u);
    if (k === "click") byKind.click.push(u);
    else if (k === "prod") byKind.prod.push(u);
    else byKind.other.push(u);
  }

  function cardHtml(u) {
    const discovered = !!state.session.discoveredUpgrades[u.id];
    if (!discovered) {
      return `
        <button type="button" class="pf-game-card pf-game-card--upgrade pf-game-card--locked" disabled>
          <div class="pf-card-main">
            <h3 class="pf-card-title">???</h3>
            <p class="pf-card-meta">Noch nicht entdeckt</p>
          </div>
          <span class="pf-card-buy pf-card-buy--disabled">???</span>
        </button>`;
    }
    const bought = state.economy.boughtUpgrades.includes(u.id);
    const can = !bought && state.economy.pixel >= u.cost;
    const kind = upgradeCardKind(u);
    const effClass = kind === "click" ? "pf-card-effect--ppk" : kind === "prod" ? "pf-card-effect--ppsu" : "pf-card-effect--misc";
    const stateClass = bought ? "pf-game-card--bought" : can ? "pf-game-card--afford" : "pf-game-card--expensive";
    return `
      <button type="button" class="pf-game-card pf-game-card--upgrade pf-game-card--${kind} ${stateClass}" data-buy-upgrade="${u.id}" ${bought ? "disabled" : ""}>
        <div class="pf-card-main">
          <h3 class="pf-card-title">${u.name}</h3>
          <p class="pf-card-effect ${effClass}">${u.desc}</p>
        </div>
        <span class="pf-card-buy">${bought ? "Gekauft" : `${fmtNumber(u.cost)} Pixel`}</span>
      </button>`;
  }

  const sec = (title, arr) =>
    arr.length
      ? `<div class="pf-upgrade-section"><h4 class="pf-upgrade-section__title">${title}</h4><div class="pf-card-grid pf-card-grid--upgrades">${arr.map(cardHtml).join("")}</div></div>`
      : "";

  ui.shopUpgrades.innerHTML = `${lineButtons}
    ${sec("Klickkraft (PPC)", byKind.click)}
    ${sec("Produktion (PPS)", byKind.prod)}
    ${sec("Sonstiges", byKind.other)}`;

  ui.shopUpgrades.querySelectorAll("[data-buy-upgrade]").forEach((btn) => {
    btn.addEventListener("click", () => buyUpgrade(btn.dataset.buyUpgrade));
  });
  ui.shopUpgrades.querySelectorAll("[data-line-pick]").forEach((btn) => {
    btn.addEventListener("click", () => selectLine(btn.dataset.linePick));
  });
}

function skillNodeButtonClass(line, n) {
  const lvl = levelOfNode(line, n.id);
  if (lvl >= n.max) return "pf-skill-node pf-skill-node--done";
  if (canUpgradeLineNode(line, n)) return "pf-skill-node pf-skill-node--ready";
  return "pf-skill-node pf-skill-node--locked";
}

function edgeSvgClass(parentLine, parentId, childLine, childId, branchLine) {
  const pLvl = levelOfNode(parentLine, parentId);
  const cLvl = levelOfNode(childLine, childId);
  const lit = pLvl > 0 || cLvl > 0;
  const active = cLvl > 0;
  let cls = `pf-skill-edge pf-skill-edge--${branchLine}`;
  if (lit) cls += " pf-skill-edge--lit pf-skill-edge--flow";
  if (active) cls += " pf-skill-edge--active";
  return cls;
}

/** Hierarchisches Grid-Layout (Speed ←, Efficiency ↑, Automation →, Synergy ↓). */
/** COL/ROW: Abstand der Knotenmittelpunkte ≥ max. Kartenbreite (190px) + 20px Lücke zwischen Rändern. */
const SKILL_TREE = {
  COL: 212,
  ROW: 118,
  DEPTH: 4,
  PAD: 176,
};

let _skillTreeLayoutCache = null;

function buildLineChildrenMap(tree) {
  const ids = new Set(tree.map((n) => n.id));
  const m = new Map();
  for (const n of tree) {
    if (!n.req || !ids.has(n.req)) continue;
    if (!m.has(n.req)) m.set(n.req, []);
    m.get(n.req).push(n.id);
  }
  for (const [, arr] of m) arr.sort((a, b) => a.localeCompare(b));
  return m;
}

function layoutTreeLeftRight(tree, rootId, dir) {
  const cm = buildLineChildrenMap(tree);
  const pos = new Map();
  let nextY = 0;
  const dx = SKILL_TREE.DEPTH * (dir === "left" ? -1 : 1);
  function dfs(nodeId, depth) {
    const kids = cm.get(nodeId) || [];
    if (kids.length === 0) {
      const y = nextY++;
      pos.set(nodeId, { gx: depth * dx, gy: y });
      return y;
    }
    const ys = kids.map((k) => dfs(k, depth + 1));
    const y = ys.reduce((a, b) => a + b, 0) / ys.length;
    pos.set(nodeId, { gx: depth * dx, gy: y });
    return y;
  }
  dfs(rootId, 0);
  const ys = [...pos.values()].map((p) => p.gy);
  const mid = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (const p of pos.values()) p.gy -= mid;
  return pos;
}

function layoutTreeUpDown(tree, rootId, dir) {
  const cm = buildLineChildrenMap(tree);
  const pos = new Map();
  let nextX = 0;
  const dy = SKILL_TREE.DEPTH * (dir === "up" ? -1 : 1);
  function dfs(nodeId, depth) {
    const kids = cm.get(nodeId) || [];
    if (kids.length === 0) {
      const x = nextX++;
      pos.set(nodeId, { gx: x, gy: depth * dy });
      return x;
    }
    const xs = kids.map((k) => dfs(k, depth + 1));
    const x = xs.reduce((a, b) => a + b, 0) / xs.length;
    pos.set(nodeId, { gx: x, gy: depth * dy });
    return x;
  }
  dfs(rootId, 0);
  const xs = [...pos.values()].map((p) => p.gx);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  for (const p of pos.values()) p.gx -= mid;
  return pos;
}

function orthSkillEdgePath(px, py, cx, cy, lineKey) {
  if (lineKey === "efficiency" || lineKey === "synergy") {
    if (Math.abs(px - cx) < 2) return `M ${px} ${py} L ${cx} ${cy}`;
    const my = (py + cy) / 2;
    return `M ${px} ${py} L ${px} ${my} L ${cx} ${my} L ${cx} ${cy}`;
  }
  if (Math.abs(py - cy) < 2) return `M ${px} ${py} L ${cx} ${cy}`;
  const mx = (px + cx) / 2;
  return `M ${px} ${py} L ${mx} ${py} L ${mx} ${cy} L ${cx} ${cy}`;
}

function skillNodeIsRelevant(line, node) {
  if (!node) return false;
  if (levelOfNode(line, node.id) > 0) return true;
  return canUpgradeLineNode(line, node);
}

function getSkillTreeLayout() {
  if (_skillTreeLayoutCache) return _skillTreeLayoutCache;

  const speedT = LINE_TREES.speed || [];
  const effT = LINE_TREES.efficiency || [];
  const autoT = LINE_TREES.automation || [];
  const synT = LINE_TREES.synergy || [];

  const sp = layoutTreeLeftRight(speedT, "s_core", "left");
  const ep = layoutTreeUpDown(effT, "e_core", "up");
  const ap = layoutTreeLeftRight(autoT, "a_core", "right");
  const yp = layoutTreeUpDown(synT, "syn_seed", "down");

  const anchor = {
    speed: { gx: -12, gy: 0 },
    efficiency: { gx: 0, gy: -12 },
    automation: { gx: 12, gy: 0 },
    synergy: { gx: 0, gy: 13 },
  };

  const merged = [];
  for (const [id, p] of sp) merged.push({ line: "speed", id, gx: anchor.speed.gx + p.gx, gy: anchor.speed.gy + p.gy });
  for (const [id, p] of ep) merged.push({ line: "efficiency", id, gx: anchor.efficiency.gx + p.gx, gy: anchor.efficiency.gy + p.gy });
  for (const [id, p] of ap) merged.push({ line: "automation", id, gx: anchor.automation.gx + p.gx, gy: anchor.automation.gy + p.gy });
  for (const [id, p] of yp) merged.push({ line: "synergy", id, gx: anchor.synergy.gx + p.gx, gy: anchor.synergy.gy + p.gy });

  let minGx = Infinity;
  let minGy = Infinity;
  let maxGx = -Infinity;
  let maxGy = -Infinity;
  for (const m of merged) {
    minGx = Math.min(minGx, m.gx);
    minGy = Math.min(minGy, m.gy);
    maxGx = Math.max(maxGx, m.gx);
    maxGy = Math.max(maxGy, m.gy);
  }

  const { COL, ROW, PAD } = SKILL_TREE;
  const pad = PAD;
  const w = (maxGx - minGx) * COL + 2 * pad;
  const h = (maxGy - minGy) * ROW + 2 * pad;
  const offX = pad - minGx * COL;
  const offY = pad - minGy * ROW;

  const nodePixel = new Map();
  for (const m of merged) {
    const cx = offX + m.gx * COL;
    const cy = offY + m.gy * ROW;
    nodePixel.set(`${m.line}:${m.id}`, { cx, cy, line: m.line, id: m.id });
  }

  const edges = [];
  for (const lineKey of Object.keys(LINE_TREES)) {
    const tree = LINE_TREES[lineKey];
    if (!tree) continue;
    for (const n of tree) {
      if (!n.req) continue;
      const p = findLineNode(lineKey, n.req);
      if (!p) continue;
      const pk = `${lineKey}:${n.req}`;
      const ck = `${lineKey}:${n.id}`;
      const P = nodePixel.get(pk);
      const C = nodePixel.get(ck);
      if (!P || !C) continue;
      edges.push({
        lineKey,
        pId: n.req,
        cId: n.id,
        d: orthSkillEdgePath(P.cx, P.cy, C.cx, C.cy, lineKey),
      });
    }
  }

  _skillTreeLayoutCache = { width: w, height: h, nodePixel, edges };
  return _skillTreeLayoutCache;
}

function renderShopPrestigePlaceholder() {
  if (!ui.shopLine) return;
  if (runtime.tab !== "prestige") return;
  ui.shopLine.innerHTML = `
    <div class="pf-line-tab-hint">
      <p class="pf-section-hint">Der <strong>Linienbaum</strong> ist als Vollbild geöffnet. Schließe das Overlay oben rechts oder tippe außerhalb (Tablet).</p>
      <button type="button" class="pf-line-tab-hint__btn" id="lineTreeReopenBtn">Linienbaum erneut öffnen</button>
    </div>`;
  const reopen = document.getElementById("lineTreeReopenBtn");
  if (reopen) reopen.addEventListener("click", () => openLineTreeModal());
}

function openLineTreeModal() {
  if (!ui.lineTreeModal) return;
  runtime.lineTreeCenterNext = true;
  ui.lineTreeModal.classList.remove("versteckt");
  document.body.classList.add("pf-line-tree-open");
  renderLineTree();
}

function closeLineTreeModal() {
  if (!ui.lineTreeModal) return;
  ui.lineTreeModal.classList.add("versteckt");
  document.body.classList.remove("pf-line-tree-open");
  closeLineTreeTooltip();
}

function showLineNodeTooltip(btn) {
  if (!ui.lineTreeTooltip) return;
  const text = btn?.dataset?.detail || "";
  if (!text) return;
  const body = document.getElementById("lineTreeTooltipBody");
  if (body) body.textContent = text;
  else ui.lineTreeTooltip.textContent = text;
  ui.lineTreeTooltip.classList.remove("versteckt");
  ui.lineTreeTooltip.hidden = false;
  const r = btn.getBoundingClientRect();
  const pad = 10;
  const tw = 300;
  ui.lineTreeTooltip.style.left = `${Math.min(window.innerWidth - tw - pad, Math.max(pad, r.left + r.width / 2 - tw / 2))}px`;
  ui.lineTreeTooltip.style.top = `${Math.min(window.innerHeight - 180, r.bottom + pad)}px`;
}

function onDocPointerDownCloseLineTooltip(e) {
  if (!ui.lineTreeTooltip || ui.lineTreeTooltip.classList.contains("versteckt")) return;
  if (e.target.closest("#lineTreeTooltip")) return;
  if (e.target.closest(".pf-skill-help")) return;
  closeLineTreeTooltip();
}

function wireLineTreeModalOnce() {
  if (runtime.lineTreeModalWired) return;
  runtime.lineTreeModalWired = true;
  document.getElementById("lineTreeModalClose")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeLineTreeModal();
  });
  document.getElementById("lineTreeTooltipClose")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeLineTreeTooltip();
  });
  document.addEventListener("pointerdown", onDocPointerDownCloseLineTooltip, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !ui.lineTreeModal || ui.lineTreeModal.classList.contains("versteckt")) return;
    if (ui.lineTreeTooltip && !ui.lineTreeTooltip.classList.contains("versteckt")) {
      closeLineTreeTooltip();
      return;
    }
    closeLineTreeModal();
  });
  const vp = document.getElementById("skillTreePanViewport");
  vp?.addEventListener("click", (e) => {
    const help = e.target.closest?.("[data-line-help]");
    if (!help) return;
    e.preventDefault();
    e.stopPropagation();
    showLineNodeTooltip(help);
  });
  window.addEventListener("resize", () => {
    if (ui.lineTreeModal && !ui.lineTreeModal.classList.contains("versteckt")) clampSkillTreePan();
  });
}

/** Leitungs-Animation: schneller bei höherem PPS (duration in Sekunden). */
function updateSkillTreeFlowSpeed() {
  const svg = document.querySelector("#skillTreePanInner .pf-skill-svg");
  if (!svg) return;
  const pps = Math.max(0.15, currentPps());
  const sec = Math.max(0.55, Math.min(3.4, 2.65 / Math.pow(Math.log10(pps + 12), 0.52)));
  svg.style.setProperty("--pf-flow-dur", `${sec.toFixed(2)}s`);
}

function wireSkillTreePanOnce() {
  if (runtime.skillTreePanWired) return;
  const vp = document.getElementById("skillTreePanViewport");
  if (!vp) return;
  runtime.skillTreePanWired = true;
  let dragging = false;
  let startCX = 0;
  let startCY = 0;
  let originX = 0;
  let originY = 0;

  vp.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".pf-skill-help") || e.target.closest(".pf-skill-node")) return;
    if (e.target.closest("#lineTreeTooltip")) return;
    dragging = true;
    try {
      vp.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    startCX = e.clientX;
    startCY = e.clientY;
    originX = runtime.skillTreePan.x;
    originY = runtime.skillTreePan.y;
    vp.classList.add("pf-skill-pan-viewport--dragging");
  });
  vp.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startCX;
    const dy = e.clientY - startCY;
    const nx = originX + dx;
    const ny = originY + dy;
    runtime.skillTreePan = { x: nx, y: ny };
    const inner = document.getElementById("skillTreePanInner");
    if (inner) inner.style.transform = `translate(${nx}px, ${ny}px)`;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    vp.classList.remove("pf-skill-pan-viewport--dragging");
    clampSkillTreePan();
  };
  vp.addEventListener("pointerup", endDrag);
  vp.addEventListener("pointercancel", endDrag);
}

function edgePathClass(lineKey, pId, cId) {
  const base = edgeSvgClass(lineKey, pId, lineKey, cId, lineKey);
  const pN = findLineNode(lineKey, pId);
  const cN = findLineNode(lineKey, cId);
  const bright = skillNodeIsRelevant(lineKey, pN) || skillNodeIsRelevant(lineKey, cN);
  return `${base}${bright ? "" : " pf-skill-edge--dim"}`;
}

function renderLineTree() {
  const headSlot = document.getElementById("lineTreeHeadSlot");
  const target = document.getElementById("skillTreePanInner");
  if (!target) return;

  const layout = getSkillTreeLayout();

  const edgeLines = layout.edges.map(
    (e) =>
      `<path class="${edgePathClass(e.lineKey, e.pId, e.cId)}" d="${e.d}" />`,
  );

  const nodesHtml = [];
  for (const lineKey of Object.keys(LINE_TREES)) {
    const tree = LINE_TREES[lineKey];
    if (!tree) continue;
    for (const n of tree) {
      const pix = layout.nodePixel.get(`${lineKey}:${n.id}`);
      if (!pix) continue;
      const lvl = levelOfNode(lineKey, n.id);
      const can = canUpgradeLineNode(lineKey, n);
      const reqNode = n.req ? findLineNode(lineKey, n.req) : null;
      let reqTxt = "";
      if (reqNode && lvl === 0 && !can) reqTxt = `Benötigt: ${reqNode.name}`;
      if (n.reqCross && lvl === 0 && !can) {
        const miss = n.reqCross.filter((rc) => levelOfNode(rc.line, rc.id) < (rc.min != null ? rc.min : 1));
        if (miss.length) {
          reqTxt = `Fehlt: ${miss.map((rc) => findLineNode(rc.line, rc.id)?.name || rc.id).join(", ")}`;
        }
      }
      const cls = skillNodeButtonClass(lineKey, n);
      const maxed = lvl >= n.max;
      const tip = `${n.name} (${lvl}/${n.max})${reqTxt ? " · " + reqTxt : ""}`;
      const detail = n.detail || n.desc || "";
      const rel = skillNodeIsRelevant(lineKey, n);
      const dimWrap = rel ? "" : " pf-skill-node-wrap--dimmed";
      nodesHtml.push(`
      <div class="pf-skill-node-wrap pf-skill-node-wrap--${lineKey}${dimWrap}" style="left:${pix.cx}px;top:${pix.cy}px;">
        <div class="pf-skill-node-card">
          <button type="button" class="pf-skill-help" data-line-help="1" data-detail="${escapeHtmlPf(detail)}" aria-label="Beschreibung">
            <span class="pf-skill-help__glyph" aria-hidden="true">?</span>
          </button>
          <button type="button"
            class="${cls}"
            data-line="${lineKey}"
            data-line-node="${n.id}"
            ${maxed || !can ? "disabled" : ""}
            title="${escapeHtmlPf(tip)}">
            <span class="pf-skill-node__glyph pf-skill-node__glyph--${lineKey}" aria-hidden="true"></span>
            <span class="pf-skill-node__tag">${lineKey === "speed" ? "SPD" : lineKey === "efficiency" ? "EFF" : lineKey === "automation" ? "AUTO" : "SYN"}</span>
            <span class="pf-skill-node__name">${escapeHtmlPf(n.name)}</span>
            <span class="pf-skill-node__lvl">${lvl}/${n.max}</span>
            <span class="pf-skill-node__cost">${n.cost} PP</span>
          </button>
        </div>
      </div>`);
    }
  }

  const headHtml = `
    <div class="pf-line-tree-head pf-line-tree-head--modal">
      <div>
        <strong class="pf-line-tree-head__line">Linienbaum</strong>
        <span class="pf-line-tree-head__qp">Prestigepunkte: <b>${state.meta.prestigePoints}</b></span>
      </div>
      <p class="pf-section-hint">Mitte: Speed links · Efficiency oben · Automation rechts · Synergy unten. Rechtwinklige Pfade. Nur freigeschaltete oder kaufbare Knoten leuchten.</p>
    </div>`;
  if (headSlot) headSlot.innerHTML = headHtml;

  target.innerHTML = `
    <div class="pf-skill-tree-board pf-skill-tree-board--modal pf-skill-tree-board--sized" style="width:${layout.width}px;height:${layout.height}px">
      <svg class="pf-skill-svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${edgeLines.join("")}</svg>
      <div class="pf-skill-nodes">${nodesHtml.join("")}</div>
    </div>
  `;

  target.style.width = `${layout.width}px`;
  target.style.height = `${layout.height}px`;

  requestAnimationFrame(() => {
    if (runtime.lineTreeCenterNext) {
      centerSkillTreePan();
      runtime.lineTreeCenterNext = false;
    } else {
      clampSkillTreePan();
    }
    updateSkillTreeFlowSpeed();
  });
  wireSkillTreePanOnce();

  target.querySelectorAll("[data-line-node]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      if (btn.disabled) return;
      ev.stopPropagation();
      upgradeLineNode(btn.dataset.line, btn.dataset.lineNode);
    });
  });
}

function centerSkillTreePan() {
  const vp = document.getElementById("skillTreePanViewport");
  const inner = document.getElementById("skillTreePanInner");
  if (!vp || !inner) return;
  const bw = inner.offsetWidth || 800;
  const bh = inner.offsetHeight || 600;
  const vw = vp.clientWidth;
  const vh = vp.clientHeight;
  const x = (vw - bw) / 2;
  const y = (vh - bh) / 2;
  runtime.skillTreePan = { x, y };
  inner.style.transform = `translate(${x}px, ${y}px)`;
}

function clampSkillTreePan() {
  const vp = document.getElementById("skillTreePanViewport");
  const inner = document.getElementById("skillTreePanInner");
  if (!vp || !inner) return;
  const bw = inner.offsetWidth;
  const bh = inner.offsetHeight;
  if (bw < 8 || bh < 8) return;
  const vw = vp.clientWidth;
  const vh = vp.clientHeight;
  const margin = 32;
  let minX = Math.min(margin, vw - bw - margin);
  let maxX = Math.max(vw - bw - margin, margin);
  let minY = Math.min(margin, vh - bh - margin);
  let maxY = Math.max(vh - bh - margin, margin);
  if (minX > maxX) {
    const t = (minX + maxX) / 2;
    minX = maxX = t;
  }
  if (minY > maxY) {
    const t = (minY + maxY) / 2;
    minY = maxY = t;
  }
  let { x, y } = runtime.skillTreePan || { x: 0, y: 0 };
  x = Math.max(minX, Math.min(maxX, x));
  y = Math.max(minY, Math.min(maxY, y));
  runtime.skillTreePan = { x, y };
  inner.style.transform = `translate(${x}px, ${y}px)`;
}

function maybeRenderShop() {
  const now = Date.now();
  if (!runtime.forceShopRender && now < runtime.nextShopRenderAt) return;
  renderShopCards();
  renderUpgradeCards();
  renderShopPrestigePlaceholder();
  renderLineTree();
  runtime.forceShopRender = false;
  runtime.nextShopRenderAt = now + 900;
}

function renderEventModal() {
  const e = state.session.activeEvent;
  if (!e) return;
  stopEventUiTimer();
  setEventVignetteTheme(e.visualTheme || "default");

  const titleEl = document.getElementById("eventTitle");
  const hintEl = document.getElementById("eventLineHint");
  const textEl = document.getElementById("eventText");
  if (titleEl) titleEl.textContent = e.title;
  if (hintEl) hintEl.textContent = e.lineHint || "";
  if (textEl) textEl.textContent = e.text;

  const wrap = document.getElementById("eventChoices");
  wrap.innerHTML = e.choices.map((c) => `
    <div class="pf-event-action-row">
      <span class="pf-event-card__help" role="button" tabindex="0" data-event-tip="${escapeHtmlPf(c.mathTooltip || "Keine Detailformel hinterlegt.")}" aria-label="Mechanik erklären">?</span>
      <button type="button" class="pf-event-action-card" data-event-choice="${c.id}">
        <span class="pf-event-action-card__icon" aria-hidden="true">${c.icon || "▸"}</span>
        <span class="pf-event-action-card__textblock">
          <strong class="pf-event-action-card__label">${escapeHtmlPf(c.label)}</strong>
          <span class="pf-event-action-card__detail">${escapeHtmlPf(c.detail)}</span>
          <span class="pf-event-action-card__meta">Erwartungswert-Rang <b>${c.risk ?? "–"}</b>/10 · höher = tendenziell besser</span>
        </span>
      </button>
    </div>
  `).join("");

  wrap.querySelectorAll("[data-event-choice]").forEach((btn) => {
    btn.addEventListener("click", () => resolveEvent(btn.dataset.eventChoice));
  });
  wrap.querySelectorAll("[data-event-tip]").forEach((el) => {
    const tip = el.dataset.eventTip || "";
    const open = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      showPfFloatingTooltip(el, tip);
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") open(ev);
    });
  });

  const fill = document.getElementById("eventTimerFill");
  if (fill) fill.style.width = "100%";
  runtime.eventDeadline = Date.now() + EVENT_CHOICE_MS;
  runtime.eventUiRaf = requestAnimationFrame(tickEventTimer);

  ui.eventOverlay.classList.remove("versteckt");
}

async function renderLeaderboard(mode) {
  let rows = [];
  try {
    rows = await PZ.getLeaderboard(GAME_ID, 60);
  } catch (e) {
    console.error("[Pixel Factory] Rangliste getLeaderboard:", e);
    ui.rankContent.innerHTML = `<div class="rang-fehler">Rangliste konnte nicht geladen werden. Details in der Konsole.</div>`;
    return;
  }
  const filteredSchema = rows.filter((r) => {
    const v = r.extra_daten?.schemaVersion;
    return v === SAVE_SCHEMA_VERSION || v === 3;
  });
  if (rows.length > 0 && filteredSchema.length === 0) {
    console.warn("[Pixel Factory] Rangliste: Keine Einträge mit passendem Schema – zeige alle gespeicherten Zeilen.");
  }
  const nutze = filteredSchema.length > 0 ? filteredSchema : rows;
  let sorted = [...nutze];
  if (mode === "prestige") sorted.sort((a, b) => (b.level || 0) - (a.level || 0));
  else if (mode === "season") sorted.sort((a, b) => (b.extra_daten?.meta?.seasonPoints || 0) - (a.extra_daten?.meta?.seasonPoints || 0));
  else sorted.sort((a, b) => (b.punkte || 0) - (a.punkte || 0));

  if (sorted.length === 0) {
    ui.rankContent.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-muted)">Noch keine Einträge. Nach dem Anmelden wird der Spielstand automatisch gespeichert.</div>`;
    return;
  }
  ui.rankContent.innerHTML = `
    <table class="rangliste-tabelle">
      <thead><tr><th>#</th><th>Spieler</th><th>${mode === "pixel" ? "Pixel" : mode === "prestige" ? "Prestige" : "Saison"}</th></tr></thead>
      <tbody>
        ${sorted.slice(0, 20).map((r, i) => {
          const val = mode === "pixel" ? fmtNumber(r.punkte || 0) : mode === "prestige" ? (r.level || 0) : (r.extra_daten?.meta?.seasonPoints || 0);
          return `<tr><td>${i + 1}</td><td>${r.benutzername || "Anonym"}</td><td>${val}</td></tr>`;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderSeasonModal() {
  const lvl = seasonLevel();
  const nextTierPts = (lvl + 1) * 100;
  const nextDiff = nextTierPts - state.meta.seasonPoints;
  const reward = `Nächster Tier-Bonus: +${5 + lvl * 2}% Produktion für diesen Run`;
  const progressPct = Math.max(0, Math.min(100, Math.floor((state.meta.seasonPoints % 100))));
  document.getElementById("errungenschaftenGrid").innerHTML = `
    <div class="season-wrap">
      <div class="season-card">
        <div class="season-top">
          <strong>Level ${lvl}</strong>
          <span>${state.meta.seasonPoints} Punkte</span>
        </div>
        <div class="season-bar"><div style="width:${progressPct}%"></div></div>
        <div class="upgrade-text">${nextDiff <= 0 ? "Tier bereit!" : `${nextDiff} Punkte bis Tier ${lvl + 1}`}</div>
      </div>
      <div class="season-grid">
        <div class="season-card"><strong>Belohnung</strong><div class="upgrade-text">${reward}</div></div>
        <div class="season-card"><strong>Wie bekomme ich Punkte?</strong><div class="upgrade-text">Missionen abschließen und Event-Entscheidungen meistern.</div></div>
        <div class="season-card"><strong>Tipp</strong><div class="upgrade-text">Schwere Missionen bringen deutlich mehr Saisonpunkte als kurze Aufgaben.</div></div>
      </div>
    </div>
  `;
  document.getElementById("errungenschaftenModal").classList.remove("versteckt");
}

const SKINS = [
  { id: "default", name: "Standard", pile: { a: "90,140,255", b: "56,98,222" }, vars: { "--primary": "#4f6ef8", "--bg": "#f6f9ff", "--surface": "#ffffff", "--text": "#162033", "--border": "#d7e3fb" } },
  { id: "sunny", name: "Sonnig", pile: { a: "251,191,36", b: "245,158,11" }, vars: { "--primary": "#ea9b1e", "--bg": "#fff8ea", "--surface": "#ffffff", "--text": "#6e3e0d", "--border": "#f9d59a" } },
  { id: "mint", name: "Mint", pile: { a: "34,197,164", b: "16,185,129" }, vars: { "--primary": "#10b981", "--bg": "#eefdf7", "--surface": "#ffffff", "--text": "#14453a", "--border": "#baeede" } },
  { id: "violet", name: "Violett", pile: { a: "167,139,250", b: "124,58,237" }, vars: { "--primary": "#7c4df3", "--bg": "#f6f2ff", "--surface": "#ffffff", "--text": "#32205e", "--border": "#ded2ff" } },
  { id: "lagoon", name: "Lagune", pile: { a: "56,189,248", b: "14,116,144" }, vars: { "--primary": "#0ea5e9", "--bg": "#eef9ff", "--surface": "#ffffff", "--text": "#12354a", "--border": "#bfe8fb" } },
  { id: "rose", name: "Rose", pile: { a: "251,113,133", b: "225,29,72" }, vars: { "--primary": "#e11d48", "--bg": "#fff1f5", "--surface": "#ffffff", "--text": "#4a1a2f", "--border": "#fec7d7" } },
];

function applySkin(id) {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0];
  state.cosmetics.skin = skin.id;
  Object.entries(skin.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

function renderSkinModal() {
  const grid = document.getElementById("skinGrid");
  grid.innerHTML = SKINS.map((s) => `
    <button class="skin-karte ${state.cosmetics.skin === s.id ? "aktiv" : ""}" data-skin="${s.id}">
      <div class="skin-vorschau" style="background:${s.vars["--bg"]};border-color:${s.vars["--border"]};"></div>
      <div class="skin-name">${s.name}</div>
    </button>
  `).join("");
  grid.querySelectorAll("[data-skin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      applySkin(btn.dataset.skin);
      renderSkinModal();
    });
  });
}

/** HTML-Adminleiste (#adminPanel) – nur mit ?admin oder ?admin=1 in der URL. */
function wireAdminPanel() {
  if (!new URLSearchParams(location.search).has("admin")) return;
  const panel = document.getElementById("adminPanel");
  if (!panel) return;
  panel.style.display = "block";

  document.getElementById("adm-pixel-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-pixel")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.economy.pixel = v;
    state.economy.lifetimePixel = Math.max(state.economy.lifetimePixel, v);
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast(`Pixel: ${fmtNumber(v)}`);
  });

  document.getElementById("adm-prestige-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-prestige")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.meta.prestige = Math.floor(v);
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast(`Prestige: ${state.meta.prestige}`);
  });

  document.getElementById("adm-qp-btn")?.addEventListener("click", () => {
    const v = Number(document.getElementById("adm-qp")?.value);
    if (!Number.isFinite(v) || v < 0) return;
    state.meta.prestigePoints = Math.floor(v);
    renderStats();
    renderLineTree();
    toast(`Prestigepunkte: ${state.meta.prestigePoints}`);
  });

  document.getElementById("adm-vorspulen-btn")?.addEventListener("click", () => {
    const h = Number(document.getElementById("adm-vorspulen")?.value) || 1;
    const bonus = currentPps() * h * 3600;
    addPixels(bonus, "Admin-Zeitsprung");
    toast(`+${fmtNumber(bonus)} Pixel (${h} h)`);
  });

  document.getElementById("adm-alle-upgrades")?.addEventListener("click", () => {
    for (const u of UPGRADES) {
      if (state.economy.boughtUpgrades.includes(u.id)) continue;
      state.economy.boughtUpgrades.push(u.id);
      u.apply(state);
    }
    recomputeMetaFromLineAndMutations();
    renderStats();
    maybeRenderShop();
    drawPile();
    toast("Alle Shop-Upgrades");
  });

  document.getElementById("adm-alle-skins")?.addEventListener("click", () => {
    const last = SKINS[SKINS.length - 1];
    applySkin(last.id);
    toast(`Skin: ${last.name}`);
  });

  document.getElementById("adm-alle-err")?.addEventListener("click", () => {
    state.meta.seasonPoints += 10000;
    renderStats();
    toast("+10000 Saisonpunkte");
  });

  document.getElementById("adm-toggle")?.addEventListener("click", () => {
    const body = panel.querySelector(".adm-body");
    if (!body) return;
    body.style.display = body.style.display === "none" ? "block" : "none";
  });
}

function handleClick() {
  addPixels(currentPpk());
  state.session.clicksRun += 1;
  const now = Date.now();
  const win = COMBO_WINDOW_MS + state.economy.comboWindowBonus;
  if (now <= state.session.comboUntil) state.session.comboCount += 1;
  else state.session.comboCount = 1;
  state.session.comboUntil = now + win;
  state.session.maxCombo = Math.max(state.session.maxCombo || 0, state.session.comboCount);
  ui.klickInfo.textContent = `+${fmtPps(currentPpk())} pro Klick`;
  drawPile();
}

function maybeRenderTutorial() {
  if (!shouldShowTutorial()) return;
  const overlay = document.getElementById("tutorialOverlay");
  const title = document.getElementById("tutorialTitel");
  const text = document.getElementById("tutorialText");
  const icon = document.getElementById("tutorialIcon");
  const nextBtn = document.getElementById("tutWeiter");
  const skipBtn = document.getElementById("tutSkip");

  const steps = [
    { icon: "🏭", title: "Willkommen beim Rework", text: "Hier ist alles auf Entscheidungen gebaut: Missionen, Events und Linienbaum." },
    { icon: "🛒", title: "Shop & Upgrades", text: "Kaufe im Shop Gebäude. Unbekannte Items zeigen ??? und werden automatisch freigeschaltet, sobald du genug Pixel hast." },
    { icon: "🌿", title: "Line-Baum", text: "Mit jedem Prestige bekommst du 1 Prestigepunkt. Investiere ihn in deinen aktiven Linienbaum." },
    { icon: "✦", title: "Prestige-Mutationen", text: "Bei Prestige musst du 1 Mutation wählen. Diese kann den Run stark verändern (stark positiv + klarer Nachteil)." },
    { icon: "📅", title: "Saison & Missionen", text: "Missionen werden automatisch alle 30 Minuten neu gemischt. Saisonpunkte bringen Fortschritt und Rangliste." },
  ];
  let idx = 0;
  function render() {
    const s = steps[idx];
    icon.textContent = s.icon;
    title.textContent = s.title;
    text.textContent = s.text;
    nextBtn.textContent = idx >= steps.length - 1 ? "Fertig" : "Weiter →";
    document.querySelectorAll(".tut-punkt").forEach((p, i) => p.classList.toggle("aktiv", i === idx));
  }
  function close() {
    markTutorialDone();
    overlay.classList.add("versteckt");
  }
  nextBtn.onclick = () => {
    if (idx >= steps.length - 1) close();
    else { idx += 1; render(); }
  };
  skipBtn.onclick = close;
  overlay.classList.remove("versteckt");
  render();
}

function bindDom() {
  ui.statPixel = document.getElementById("statPixel");
  ui.statPps = document.getElementById("statPPS");
  ui.statPpk = document.getElementById("statPPK");
  ui.statQp = document.getElementById("statQP");
  ui.statPrestige = document.getElementById("statPrestige");
  ui.prestigeBtn = document.getElementById("prestigeBtn");
  ui.prestigeInfo = document.getElementById("prestigeInfo");
  ui.canvas = document.getElementById("pixelHaufen");
  ui.klickInfo = document.getElementById("klickInfo");
  ui.comboFill = document.getElementById("komboFill");
  ui.comboLabel = document.getElementById("komboLabel");
  ui.shopMain = document.getElementById("shopGebaeude");
  ui.shopUpgrades = document.getElementById("shopUpgrades");
  ui.shopLine = document.getElementById("shopPrestige");
  ui.offlineBonus = document.getElementById("offlineBonus");
  ui.banner = document.getElementById("ereignisBanner");
  ui.toast = document.getElementById("toastContainer");
  ui.rankContent = document.getElementById("ranglisteInhalt");
  ui.eventOverlay = document.getElementById("eventOverlay");
  ui.prestigeModal = document.getElementById("prestigeConfirmModal");
  ui.pcQP = document.getElementById("pcQP");
  ui.lineTreeModal = document.getElementById("lineTreeModal");
  ui.lineTreeModalBody = document.getElementById("lineTreeModalBody");
  ui.lineTreeTooltip = document.getElementById("lineTreeTooltip");
}

function setupDynamicUi() {
  const actions = document.querySelector(".aktionen");
  const missionPanel = document.createElement("div");
  missionPanel.className = "rework-panel";
  missionPanel.innerHTML = `
    <div class="rework-head">
      <strong>Missionen</strong>
      <span class="upgrade-text" id="missionRefreshInfo">Neu in 30:00</span>
    </div>
    <div id="missionList"></div>
  `;
  actions.appendChild(missionPanel);
  ui.missionList = document.getElementById("missionList");

  const ev = document.createElement("div");
  ev.id = "eventOverlay";
  ev.className = "modal-hintergrund pf-modal-glass versteckt";
  ev.innerHTML = `
    <div class="modal pf-event-modal pf-modal-glass__panel">
      <div class="pf-event-timer-track" aria-hidden="true">
        <div id="eventTimerFill" class="pf-event-timer-fill"></div>
      </div>
      <p id="eventLineHint" class="pf-event-line-hint"></p>
      <h2 id="eventTitle"></h2>
      <p id="eventText" class="pf-event-text"></p>
      <div id="eventChoices" class="pf-event-action-grid"></div>
    </div>`;
  document.body.appendChild(ev);

  if (!document.getElementById("mutationChoices")) {
    const mut = document.createElement("div");
    mut.id = "mutationChoices";
    mut.className = "mutation-grid pf-mutation-grid";
    document.querySelector(".pc-liste")?.appendChild(mut);
  }
}

function bindEvents() {
  document.querySelector(".shop-tab[data-tab='gebaeude']").textContent = "🛒 Shop";
  document.querySelector(".shop-tab[data-tab='prestige']").textContent = "🌿 Linienbaum";

  document.querySelectorAll(".shop-tab").forEach((t) => {
    t.addEventListener("click", () => {
      if (t.dataset.tab === "prestige") {
        runtime.tab = "prestige";
        document.querySelectorAll(".shop-tab").forEach((x) => x.classList.toggle("aktiv", x === t));
        ui.shopMain.classList.add("versteckt");
        ui.shopUpgrades.classList.add("versteckt");
        ui.shopLine.classList.remove("versteckt");
        const bulk = document.getElementById("bulkLeiste");
        if (bulk) bulk.classList.add("versteckt");
        runtime.forceShopRender = true;
        maybeRenderShop();
        openLineTreeModal();
        wireLineTreeModalOnce();
        return;
      }
      closeLineTreeModal();
      runtime.tab = t.dataset.tab;
      document.querySelectorAll(".shop-tab").forEach((x) => x.classList.toggle("aktiv", x === t));
      ui.shopMain.classList.toggle("versteckt", runtime.tab !== "gebaeude");
      ui.shopUpgrades.classList.toggle("versteckt", runtime.tab !== "upgrades");
      ui.shopLine.classList.toggle("versteckt", runtime.tab !== "prestige");
      const bulk = document.getElementById("bulkLeiste");
      if (bulk) bulk.classList.toggle("versteckt", runtime.tab !== "gebaeude");
      runtime.forceShopRender = true;
    });
  });

  document.querySelectorAll(".bulk-btn").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".bulk-btn").forEach((x) => x.classList.toggle("aktiv", x === b));
      state.economy.bulk = Number(b.dataset.menge);
    });
  });

  ui.canvas.addEventListener("click", handleClick);
  ui.prestigeBtn.addEventListener("click", openPrestigeModal);
  document.getElementById("prestigeConfirmNein").addEventListener("click", () => {
    cancelMutationSlotAnimation();
    runtime.mutationSlotRunning = false;
    runtime.pendingPrestigeMutationId = null;
    document.getElementById("mutationSlotResult")?.classList.add("versteckt");
    document.getElementById("prestigeFinalizeBtn")?.classList.add("versteckt");
    ui.prestigeModal.classList.add("versteckt");
    document.getElementById("mutationSlotOverlay")?.classList.add("versteckt");
  });

  document.getElementById("prestigeFinalizeBtn")?.addEventListener("click", () => {
    const id = runtime.pendingPrestigeMutationId;
    if (!id) return;
    doPrestige(id);
  });

  document.getElementById("errungenschaftenBtn").textContent = "📅 Saison";
  document.getElementById("errungenschaftenBtn").addEventListener("click", renderSeasonModal);
  document.getElementById("errungenschaftenSchliessen").addEventListener("click", () => document.getElementById("errungenschaftenModal").classList.add("versteckt"));

  document.getElementById("skinBtn").addEventListener("click", () => {
    renderSkinModal();
    document.getElementById("skinModal").classList.remove("versteckt");
  });
  document.getElementById("skinSchliessen").addEventListener("click", () => document.getElementById("skinModal").classList.add("versteckt"));

  document.getElementById("ranglisteBtn").addEventListener("click", async () => {
    document.getElementById("ranglisteModal").classList.remove("versteckt");
    await renderLeaderboard("pixel");
  });
  document.getElementById("ranglisteSchliessen").addEventListener("click", () => document.getElementById("ranglisteModal").classList.add("versteckt"));
  const tabs = document.querySelector(".rangliste-tabs");
  if (!tabs.querySelector('[data-rl="season"]')) {
    const s = document.createElement("button");
    s.className = "rl-tab";
    s.dataset.rl = "season";
    s.textContent = "Saison";
    tabs.appendChild(s);
  }
  tabs.querySelectorAll(".rl-tab").forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabs.querySelectorAll(".rl-tab").forEach((x) => x.classList.toggle("aktiv", x === tab));
      await renderLeaderboard(tab.dataset.rl);
    });
  });
}

function applyDelayedEffectSafe(delayMs, cb) {
  const token = state.session.runToken;
  setTimeout(() => {
    if (state.session.runToken !== token) return;
    cb();
  }, delayMs);
}

function removeGameLoadingOverlay() {
  const overlay = document.getElementById("pz-game-overlay");
  if (overlay) overlay.remove();
}

function frame(ts) {
  if (!runtime.running) return;
  if (!runtime.lastTs) runtime.lastTs = ts;
  const dt = Math.min(0.05, (ts - runtime.lastTs) / 1000);
  runtime.lastTs = ts;

  discoverUnlocks();
  tickEffects();

  addPixels(currentPps() * dt);
  updateMissions();
  maybeSpawnEvent();

  runtime.autosave += dt * 1000;
  if (runtime.autosave >= AUTOSAVE_MS) {
    runtime.autosave = 0;
    saveGame(false, true);
  }

  drawPile();
  renderStats();
  renderMissions();
  maybeRenderShop();

  if (ui.lineTreeModal && !ui.lineTreeModal.classList.contains("versteckt")) {
    if (!runtime._lastFlowAt || ts - runtime._lastFlowAt > 350) {
      runtime._lastFlowAt = ts;
      updateSkillTreeFlowSpeed();
    }
  }

  requestAnimationFrame(frame);
}

async function init() {
  setupDynamicUi();
  bindDom();
  bindEvents();
  wireLineTreeModalOnce();
  const adminTest = new URLSearchParams(location.search).has("admin");
  if (adminTest) {
    Object.assign(state, makeDefaultState());
    state.economy.pixel = 1e15;
    state.economy.lifetimePixel = 1e18;
    state.meta.prestige = 8;
    state.meta.prestigePoints = 120;
    randomMissionSet();
  } else {
    applySkin(state.cosmetics.skin);
    await loadGame();
  }
  applySkin(state.cosmetics.skin);
  syncTutorialSkipFromState();
  recomputeMetaFromLineAndMutations();
  renderStats();
  renderMissions();
  maybeRenderShop();
  drawPile();
  if (!adminTest) maybeRenderTutorial();
  wireAdminPanel();

  runtime.running = true;
  requestAnimationFrame(frame);
  window.addEventListener("beforeunload", () => { state.session.lastSaveAt = Date.now(); });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof PZ !== "undefined" && typeof PZ.updateNavbar === "function") {
      await PZ.updateNavbar();
    }
    await init();
    removeGameLoadingOverlay();
  } catch (err) {
    console.error("[Pixel Factory] Init-Fehler:", err);
    removeGameLoadingOverlay();
    const label = document.getElementById("klickInfo");
    if (label) label.textContent = "Fehler beim Laden - bitte Seite neu laden.";
  }
});
