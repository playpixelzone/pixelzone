/**
 * Pixel Factory – erweiterte Linienbäume (4–5 Ebenen, Synergien).
 * Wird vor game-rework-v2.js geladen → window.PF_LINE_TREES
 * detail = ausführliche Tooltip-Texte für (?)
 * tooltipFlavour = optional: kurzer Flavour-Text im Tooltip (sonst erster Satz aus detail)
 */
(function () {
  "use strict";

  const LINE_TREES = {
    speed: [
      {
        id: "s_core",
        name: "Puls-Kern",
        desc: "+14 % globale Produktion",
        detail: "Zentrum der Speed-Linie. Erhöht alle passive Pixel/s aus Gebäuden und Upgrades multiplikativ.",
        max: 1,
        cost: 1,
        lx: 22,
        ly: 52,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.14 * lvl;
        },
      },
      {
        id: "s_vel1",
        name: "Tempo-Stufe I",
        desc: "+10 % Produktion",
        detail: "Erste Ausbaustufe: Förderbänder und Taktrhythmus werden enger getaktet.",
        max: 2,
        cost: 1,
        req: "s_core",
        lx: 14,
        ly: 44,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.1 * lvl;
        },
      },
      {
        id: "s_vel2",
        name: "Tempo-Stufe II",
        desc: "+14 % Produktion",
        detail: "Zweite Stufe: Parallel-Linien reduzieren Leerlaufzeiten spürbar.",
        max: 2,
        cost: 1,
        req: "s_vel1",
        lx: 8,
        ly: 36,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.14 * lvl;
        },
      },
      {
        id: "s_vel3",
        name: "Overdrive",
        desc: "+22 % Produktion, Events +8 %",
        detail: "Volllast: mehr Durchsatz, Sensoren melden häufiger kleine Vorkommnisse.",
        max: 1,
        cost: 2,
        req: "s_vel2",
        lx: 6,
        ly: 26,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.22 * lvl;
          s.meta.eventRateMult *= 1 + 0.08 * lvl;
        },
      },
      {
        id: "s_clk1",
        name: "Reflex I",
        desc: "+12 % Klickkraft",
        detail: "Trainiert die Klick-Synchronisation mit der Produktionskurve.",
        max: 2,
        cost: 1,
        req: "s_core",
        lx: 14,
        ly: 60,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.12 * lvl;
        },
      },
      {
        id: "s_clk2",
        name: "Reflex II",
        desc: "+18 % Klickkraft",
        detail: "Feinjustierung: jeder Treffer wirkt stärker im Kombo-Fenster.",
        max: 2,
        cost: 1,
        req: "s_clk1",
        lx: 8,
        ly: 68,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.18 * lvl;
        },
      },
      {
        id: "s_clk3",
        name: "Finger-Blitz",
        desc: "+28 % Klickkraft",
        detail: "Höchste Reflex-Stufe vor dem Kronen-Skill dieser Spalte.",
        max: 1,
        cost: 2,
        req: "s_clk2",
        lx: 6,
        ly: 78,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.28 * lvl;
        },
      },
      {
        id: "s_burst1",
        name: "Burst-Kanal I",
        desc: "+16 % Produktion",
        detail: "Kurzzeitige Produktionsspitzen werden kanalisiert.",
        max: 2,
        cost: 1,
        req: "s_core",
        lx: 30,
        ly: 40,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.16 * lvl;
        },
      },
      {
        id: "s_burst2",
        name: "Burst-Kanal II",
        desc: "+22 % Produktion",
        detail: "Verstärkte Burst-Logik – ideal vor Boss-Events.",
        max: 1,
        cost: 2,
        req: "s_burst1",
        lx: 34,
        ly: 30,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.22 * lvl;
        },
      },
      {
        id: "s_risk",
        name: "Risiko-Modus",
        desc: "+35 % Produktion, Events +12 %",
        detail: "Bewusst höhere Varianz: mehr Output, aber öfter Eingriffe nötig.",
        max: 1,
        cost: 2,
        req: "s_core",
        lx: 30,
        ly: 64,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.35 * lvl;
          s.meta.eventRateMult *= 1 + 0.12 * lvl;
        },
      },
      {
        id: "s_cap_l",
        name: "Hyperlinie",
        desc: "+40 % Produktion",
        detail: "Kronung des linken Burst-Pfads: massive PPS-Erhöhung.",
        max: 1,
        cost: 3,
        req: "s_burst2",
        lx: 38,
        ly: 22,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.4 * lvl;
        },
      },
      {
        id: "s_cap_r",
        name: "Klick-Ultimate",
        desc: "+45 % Klickkraft",
        detail: "Endskill des Reflex-Zweigs – PPC skaliert stark mit deinen Shop-Klick-Upgrades.",
        max: 1,
        cost: 3,
        req: "s_clk3",
        lx: 4,
        ly: 88,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.45 * lvl;
        },
      },
      {
        id: "s_depth7",
        name: "Nachbrenner",
        desc: "+10 % PPS, +5 % PPC",
        detail: "Flavour: Siebte Ebene im Speed-Zweig – letzte Feinjustierung nach dem Klick-Ultimate.",
        max: 1,
        cost: 3,
        req: "s_cap_r",
        lx: 2,
        ly: 96,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.1 * lvl;
          s.meta.lineClickMult *= 1 + 0.05 * lvl;
        },
      },
    ],
    efficiency: [
      {
        id: "e_core",
        name: "Stabil-Kern",
        desc: "Events −8 %",
        detail: "Zentrum der Efficiency-Linie: weniger Störungen, ruhigerer Lauf.",
        tooltipFlavour: "Optimiert die Energieleitungen – weniger Störungen, ruhigerer Betrieb.",
        max: 1,
        cost: 1,
        lx: 50,
        ly: 24,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.08 * lvl;
        },
      },
      {
        id: "e_smooth1",
        name: "Glatte Linie I",
        desc: "+9 % Produktion",
        detail: "Erste Qualitätsstufe: weniger Ausschuss, gleichmäßiger Output.",
        max: 2,
        cost: 1,
        req: "e_core",
        lx: 42,
        ly: 16,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.09 * lvl;
        },
      },
      {
        id: "e_smooth2",
        name: "Glatte Linie II",
        desc: "+12 % Produktion",
        detail: "Zweite Stufe: Prozesse werden weiter vereinheitlicht.",
        max: 2,
        cost: 1,
        req: "e_smooth1",
        lx: 36,
        ly: 10,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.12 * lvl;
        },
      },
      {
        id: "e_smooth3",
        name: "Null-Fehler",
        desc: "+18 % Produktion",
        detail: "Höchste Präzision auf diesem Pfad.",
        max: 1,
        cost: 2,
        req: "e_smooth2",
        lx: 30,
        ly: 6,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.18 * lvl;
        },
      },
      {
        id: "e_ctrl1",
        name: "Kontroll-Turm I",
        desc: "Events −10 %",
        detail: "Überwachungssysteme filtern Störquellen früh.",
        max: 2,
        cost: 1,
        req: "e_core",
        lx: 58,
        ly: 16,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.1 * lvl;
        },
      },
      {
        id: "e_ctrl2",
        name: "Kontroll-Turm II",
        desc: "Events −14 %",
        detail: "Redundante Sensoren – noch weniger Überraschungen.",
        max: 2,
        cost: 1,
        req: "e_ctrl1",
        lx: 64,
        ly: 10,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.14 * lvl;
        },
      },
      {
        id: "e_ctrl3",
        name: "Totale Ruhe",
        desc: "Events −18 %",
        detail: "Nahezu stoßfreier Betrieb – Events werden sehr selten.",
        max: 1,
        cost: 2,
        req: "e_ctrl2",
        lx: 70,
        ly: 6,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.18 * lvl;
        },
      },
      {
        id: "e_click1",
        name: "Präzisions-Tipp",
        desc: "+11 % Klickkraft",
        detail: "Fokus auf saubere Klicks statt Schnelligkeit.",
        max: 2,
        cost: 1,
        req: "e_core",
        lx: 50,
        ly: 34,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.11 * lvl;
        },
      },
      {
        id: "e_click2",
        name: "Mikro-Feedback",
        desc: "+16 % Klickkraft",
        detail: "Haptisches Feedback (simuliert) – PPC steigt weiter.",
        max: 2,
        cost: 1,
        req: "e_click1",
        lx: 50,
        ly: 42,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.16 * lvl;
        },
      },
      {
        id: "e_off",
        name: "Schatten-Cache",
        desc: "Offline +35 %",
        detail: "Effiziente Zwischenspeicherung für Offline-Zeiten.",
        max: 1,
        cost: 2,
        req: "e_core",
        lx: 44,
        ly: 32,
        effect: (s, lvl) => {
          s.economy.offlineEff += 0.35 * lvl;
        },
      },
      {
        id: "e_cap",
        name: "Perfekte Schicht",
        desc: "+25 % Produktion, Offline +25 %",
        detail: "Kronung der Efficiency: Ausgewogenheit zwischen PPS und Offline.",
        max: 1,
        cost: 3,
        req: "e_smooth3",
        lx: 24,
        ly: 4,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.25 * lvl;
          s.economy.offlineEff += 0.25 * lvl;
        },
      },
      {
        id: "e_depth7",
        name: "Null-Raum",
        desc: "Events −6 %, +8 % PPS",
        detail: "Flavour: siebte Ebene Efficiency – nahezu störungsfreier Betrieb.",
        max: 1,
        cost: 3,
        req: "e_cap",
        lx: 18,
        ly: 2,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.06 * lvl;
          s.meta.lineProdMult *= 1 + 0.08 * lvl;
        },
      },
    ],
    automation: [
      {
        id: "a_core",
        name: "Auto-Kern",
        desc: "+12 % Produktion",
        detail: "Herzstück der Automation: Grundboost für alle Fabriklinien.",
        max: 1,
        cost: 1,
        lx: 78,
        ly: 52,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.12 * lvl;
        },
      },
      {
        id: "a_rob1",
        name: "Roboter-Welle I",
        desc: "+11 % Produktion",
        detail: "Erste Welle autonomer Hilfsroboter.",
        max: 2,
        cost: 1,
        req: "a_core",
        lx: 86,
        ly: 44,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.11 * lvl;
        },
      },
      {
        id: "a_rob2",
        name: "Roboter-Welle II",
        desc: "+15 % Produktion",
        detail: "Mehr Einheiten, bessere Koordination.",
        max: 2,
        cost: 1,
        req: "a_rob1",
        lx: 92,
        ly: 36,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.15 * lvl;
        },
      },
      {
        id: "a_rob3",
        name: "Vollautomatik",
        desc: "+22 % Produktion",
        detail: "Nahezu menschenfreie Linie auf diesem Zweig.",
        max: 1,
        cost: 2,
        req: "a_rob2",
        lx: 94,
        ly: 26,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.22 * lvl;
        },
      },
      {
        id: "a_off1",
        name: "Nacht-Lauf I",
        desc: "Offline +22 %",
        detail: "Geister-Schichten arbeiten weiter, während du weg bist.",
        max: 3,
        cost: 1,
        req: "a_core",
        lx: 86,
        ly: 60,
        effect: (s, lvl) => {
          s.economy.offlineEff += 0.22 * lvl;
        },
      },
      {
        id: "a_off2",
        name: "Nacht-Lauf II",
        desc: "Offline +35 %",
        detail: "Zusätzliche Reservegeneratoren für lange Pausen.",
        max: 2,
        cost: 1,
        req: "a_off1",
        lx: 92,
        ly: 70,
        effect: (s, lvl) => {
          s.economy.offlineEff += 0.35 * lvl;
        },
      },
      {
        id: "a_off3",
        name: "Ewige Schicht",
        desc: "Offline +50 %",
        detail: "Maximaler Offline-Bonus auf diesem Pfad.",
        max: 1,
        cost: 2,
        req: "a_off2",
        lx: 94,
        ly: 82,
        effect: (s, lvl) => {
          s.economy.offlineEff += 0.5 * lvl;
        },
      },
      {
        id: "a_filter",
        name: "Rausch-Filter",
        desc: "Events −12 %",
        detail: "Automatische Filter unterdrücken kleine Störungen.",
        max: 2,
        cost: 1,
        req: "a_core",
        lx: 70,
        ly: 44,
        effect: (s, lvl) => {
          s.meta.eventRateMult *= 1 - 0.12 * lvl;
        },
      },
      {
        id: "a_syn_bridge",
        name: "Takt-Brücke",
        desc: "+6 % Klick (skaliert mit Speed-Kern)",
        detail: "Synergie: Verbindet Automationsdaten mit Speed-Klickpfad – stärker, wenn du auch den Puls-Kern (Speed) freigeschaltet hast.",
        max: 3,
        cost: 1,
        req: "a_core",
        reqCross: [{ line: "speed", id: "s_core", min: 1 }],
        lx: 72,
        ly: 58,
        effect: (s, lvl) => {
          const bonus = levelOfNodeGlobal(s, "speed", "s_core");
          const factor = 1 + 0.06 * lvl * (bonus > 0 ? 1.35 : 1);
          s.meta.lineClickMult *= factor;
        },
      },
      {
        id: "a_cap",
        name: "Mega-Fabrik",
        desc: "+38 % Produktion, +10 % Klick",
        detail: "Endausbau des Automation-Zweigs.",
        max: 1,
        cost: 3,
        req: "a_rob3",
        lx: 96,
        ly: 18,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.38 * lvl;
          s.meta.lineClickMult *= 1 + 0.1 * lvl;
        },
      },
      {
        id: "a_depth7",
        name: "Singularität",
        desc: "+15 % PPS",
        detail: "Flavour: siebte Ebene Automation – maximale Fabrikdichte.",
        max: 1,
        cost: 3,
        req: "a_cap",
        lx: 98,
        ly: 8,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.15 * lvl;
        },
      },
    ],
    synergy: [
      {
        id: "syn_seed",
        name: "Netzwerk-Start",
        desc: "+4 % Produktion & Klick",
        detail: "Öffnet die Synergie-Ebene. Kleiner Universalschub – danach folgen Spezial-Knoten.",
        max: 1,
        cost: 1,
        lx: 50,
        ly: 88,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.04 * lvl;
          s.meta.lineClickMult *= 1 + 0.04 * lvl;
        },
      },
      {
        id: "syn_sp_eff",
        name: "Gleich-Takt",
        desc: "Wenn Speed + Efficiency: +8 % PPS",
        detail: "Synergie: Erfordert mindestens einen aktiven Kern in Speed UND Efficiency. Belohnt hybrides Spielen.",
        max: 1,
        cost: 2,
        req: "syn_seed",
        reqCross: [
          { line: "speed", id: "s_core", min: 1 },
          { line: "efficiency", id: "e_core", min: 1 },
        ],
        lx: 40,
        ly: 94,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.08 * lvl;
        },
      },
      {
        id: "syn_au_sp",
        name: "Impuls-Servo",
        desc: "Wenn Auto + Speed: +12 % Klickkraft",
        detail: "Synergie: Automation synchronisiert Servos mit deinem Speed-Reflexpfad – PPC steigt spürbar.",
        max: 1,
        cost: 2,
        req: "syn_seed",
        reqCross: [
          { line: "automation", id: "a_core", min: 1 },
          { line: "speed", id: "s_core", min: 1 },
        ],
        lx: 60,
        ly: 94,
        effect: (s, lvl) => {
          s.meta.lineClickMult *= 1 + 0.12 * lvl;
        },
      },
      {
        id: "syn_tri",
        name: "Dreifach-Bindung",
        desc: "Alle drei Kerne: +15 % PPS, +8 % PPC",
        detail: "Synergie: Setzt voraus, dass du Puls-Kern, Stabil-Kern und Auto-Kern freigeschaltet hast. Großer Gesamtbonus.",
        max: 1,
        cost: 4,
        req: "syn_seed",
        reqCross: [
          { line: "speed", id: "s_core", min: 1 },
          { line: "efficiency", id: "e_core", min: 1 },
          { line: "automation", id: "a_core", min: 1 },
        ],
        lx: 50,
        ly: 96,
        effect: (s, lvl) => {
          s.meta.lineProdMult *= 1 + 0.15 * lvl;
          s.meta.lineClickMult *= 1 + 0.08 * lvl;
        },
      },
      {
        id: "syn_echo",
        name: "Echo-Resonanz",
        desc: "+1 % PPS pro gekauftem PPS-Shop-Upgrade",
        detail: "Synergie: Skaliert mit deinen gekauften Produktions-Upgrades im Pixel-Shop (u_prod_*). Ideal im Midgame.",
        max: 1,
        cost: 3,
        req: "syn_tri",
        lx: 46,
        ly: 98,
        effect: (s, lvl) => {
          const n = (s.economy.boughtUpgrades || []).filter((id) => id.startsWith("u_prod")).length;
          s.meta.lineProdMult *= 1 + 0.01 * n * lvl;
        },
      },
    ],
  };

  /** Hilfsfunktion für Effekte – wird in game-rework-v2 überschrieben/ergänzt */
  function levelOfNodeGlobal(st, line, id) {
    return ((st.meta.lineLevels[line] || {})[id] || 0);
  }

  window.PF_LINE_TREES = LINE_TREES;
  window.PF_levelOfNodeStub = levelOfNodeGlobal;
})();
