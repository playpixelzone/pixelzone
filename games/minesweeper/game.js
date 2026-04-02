'use strict';

// ── Schwierigkeitsgrade ────────────────────────────────────────────────────────
const SCHWIERIGKEIT = {
  einfach:  { spalten: 9,  reihen: 9,  minen: 10 },
  mittel:   { spalten: 16, reihen: 16, minen: 40 },
  schwierig:{ spalten: 30, reihen: 16, minen: 99 },
};

// ── Spielzustand ───────────────────────────────────────────────────────────────
let brett          = [];        // flaches Array [reihe * spalten + spalte]
let config         = null;      // aktuelles SCHWIERIGKEIT-Objekt
let schwierigkeitKey = 'einfach';
let ersterKlick    = true;
let spielLaeuft    = false;
let beendet        = false;
let timerInterval  = null;
let sekunden       = 0;
let flaggenGesetzt = 0;

// ── Init ───────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  PZ.updateNavbar();
  document.getElementById('schwierigkeit-select')
    .addEventListener('change', schwierigkeitWechseln);
  document.getElementById('neustart-btn')
    .addEventListener('click', neuesSpiel);
  document.getElementById('modal-neustart')
    .addEventListener('click', neuesSpiel);
  document.getElementById('modal-neustart-sieg')
    .addEventListener('click', neuesSpiel);
  neuesSpiel();
});

// ── Schwierigkeit wechseln ─────────────────────────────────────────────────────
function schwierigkeitWechseln() {
  schwierigkeitKey = document.getElementById('schwierigkeit-select').value;
  neuesSpiel();
}

// ── Neues Spiel ────────────────────────────────────────────────────────────────
function neuesSpiel() {
  config         = SCHWIERIGKEIT[schwierigkeitKey];
  ersterKlick    = true;
  spielLaeuft    = false;
  beendet        = false;
  sekunden       = 0;
  flaggenGesetzt = 0;

  timerStoppen();

  // Brett mit leeren Zellen initialisieren
  brett = Array.from({ length: config.reihen * config.spalten }, () => ({
    mine:      false,
    aufgedeckt: false,
    flagge:    false,
    nachbarn:  0,
  }));

  document.getElementById('modal-gameover').classList.add('versteckt');
  document.getElementById('modal-sieg').classList.add('versteckt');

  hudAktualisieren();
  spielfeldRendern();
}

// ── Brett-Hilfsfunktionen ──────────────────────────────────────────────────────
function idx(r, s)       { return r * config.spalten + s; }
function gueltig(r, s)   { return r >= 0 && r < config.reihen && s >= 0 && s < config.spalten; }

function nachbarPositionen(r, s) {
  const pos = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let ds = -1; ds <= 1; ds++)
      if ((dr !== 0 || ds !== 0) && gueltig(r + dr, s + ds))
        pos.push([r + dr, s + ds]);
  return pos;
}

// ── Spielfeld komplett rendern ─────────────────────────────────────────────────
function spielfeldRendern() {
  const feld = document.getElementById('spielfeld');
  feld.style.gridTemplateColumns = `repeat(${config.spalten}, var(--zell-groesse))`;
  feld.innerHTML = '';

  for (let r = 0; r < config.reihen; r++) {
    for (let s = 0; s < config.spalten; s++) {
      const zelle = document.createElement('div');
      zelle.className = 'zelle verdeckt ' + ((r + s) % 2 === 0 ? 'hell' : 'dunkel');
      zelle.dataset.r = r;
      zelle.dataset.s = s;

      // Long Press für Mobile (Flagge)
      let longPressTimer = null;
      let longPressFired = false;

      zelle.addEventListener('touchstart', () => {
        longPressFired = false;
        longPressTimer = setTimeout(() => {
          longPressFired = true;
          flaggeToggle(r, s);
        }, 500);
      }, { passive: true });
      zelle.addEventListener('touchend',  () => clearTimeout(longPressTimer));
      zelle.addEventListener('touchmove', () => clearTimeout(longPressTimer));

      // Klick und Rechtsklick
      zelle.addEventListener('click', () => {
        if (longPressFired) { longPressFired = false; return; }
        zelleKlick(r, s);
      });
      zelle.addEventListener('contextmenu', (e) => { e.preventDefault(); flaggeToggle(r, s); });

      feld.appendChild(zelle);
    }
  }
}

// ── Einzelne Zelle neu zeichnen ────────────────────────────────────────────────
function zelleRendern(r, s) {
  const el = document.querySelector(`#spielfeld [data-r="${r}"][data-s="${s}"]`);
  if (!el) return;
  const z = brett[idx(r, s)];

  el.className = 'zelle';
  el.textContent = '';

  if (!z.aufgedeckt) {
    el.classList.add('verdeckt', (r + s) % 2 === 0 ? 'hell' : 'dunkel');
    if (z.flagge) el.textContent = '🚩';
    return;
  }

  // Aufgedeckt
  el.classList.add('aufgedeckt', (r + s) % 2 === 0 ? 'aufgedeckt-hell' : 'aufgedeckt-dunkel');
  if (z.mine) {
    el.classList.add('mine');
    el.textContent = '💣';
  } else if (z.nachbarn > 0) {
    el.textContent = z.nachbarn;
    el.classList.add(`zahl-${z.nachbarn}`);
  }
}

// ── Minenplatzierung (nach erstem Klick) ───────────────────────────────────────
function minenPlatzieren(erstR, erstS) {
  // Gesperrte Positionen: geklickte Zelle + alle 8 Nachbarn
  const gesperrt = new Set();
  gesperrt.add(idx(erstR, erstS));
  for (const [r, s] of nachbarPositionen(erstR, erstS))
    gesperrt.add(idx(r, s));

  // Alle freien Positionen sammeln
  const frei = [];
  for (let i = 0; i < brett.length; i++)
    if (!gesperrt.has(i)) frei.push(i);

  // Fisher-Yates-Shuffle
  for (let i = frei.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [frei[i], frei[j]] = [frei[j], frei[i]];
  }

  // Erste config.minen Positionen als Minen markieren
  for (let i = 0; i < config.minen; i++)
    brett[frei[i]].mine = true;

  // Nachbarn-Werte berechnen
  for (let r = 0; r < config.reihen; r++) {
    for (let s = 0; s < config.spalten; s++) {
      if (brett[idx(r, s)].mine) continue;
      brett[idx(r, s)].nachbarn = nachbarPositionen(r, s)
        .filter(([nr, ns]) => brett[idx(nr, ns)].mine).length;
    }
  }
}

// ── Klick auf Zelle ────────────────────────────────────────────────────────────
function zelleKlick(r, s) {
  if (beendet) return;
  const z = brett[idx(r, s)];
  if (z.aufgedeckt || z.flagge) return;

  // Erster Klick: Minen platzieren und Timer starten
  if (ersterKlick) {
    ersterKlick = false;
    minenPlatzieren(r, s);
    timerStarten();
    spielLaeuft = true;
  }

  if (z.mine) {
    gameOver(r, s);
    return;
  }

  aufdecken(r, s);

  if (siegPruefen()) sieg();
}

// ── Aufdecken mit Flood-Fill (rekursiver DFS) ──────────────────────────────────
function aufdecken(r, s) {
  const z = brett[idx(r, s)];
  if (z.aufgedeckt || z.flagge) return;
  z.aufgedeckt = true;
  zelleRendern(r, s);

  // Kettenreaktion bei leeren Feldern
  if (z.nachbarn === 0 && !z.mine) {
    for (const [nr, ns] of nachbarPositionen(r, s))
      aufdecken(nr, ns);
  }
}

// ── Siegbedingung ──────────────────────────────────────────────────────────────
function siegPruefen() {
  return brett.every(z => z.mine || z.aufgedeckt);
}

// ── Flagge setzen / entfernen ──────────────────────────────────────────────────
function flaggeToggle(r, s) {
  if (beendet) return;
  const z = brett[idx(r, s)];
  if (z.aufgedeckt) return;

  if (z.flagge) {
    z.flagge = false;
    flaggenGesetzt--;
  } else {
    z.flagge = true;
    flaggenGesetzt++;
  }

  zelleRendern(r, s);
  hudAktualisieren();
}

// ── Timer ──────────────────────────────────────────────────────────────────────
function timerStarten() {
  sekunden = 0;
  document.getElementById('timer').textContent = 0;
  timerInterval = setInterval(() => {
    sekunden++;
    document.getElementById('timer').textContent = sekunden;
  }, 1000);
}

function timerStoppen() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── HUD aktualisieren ──────────────────────────────────────────────────────────
function hudAktualisieren() {
  document.getElementById('flaggen-zaehler').textContent =
    config ? config.minen - flaggenGesetzt : 0;
  document.getElementById('timer').textContent = sekunden;
  document.getElementById('schwierigkeit-select').value = schwierigkeitKey;
}

// ── Game Over ──────────────────────────────────────────────────────────────────
function gameOver(mineR, mineS) {
  beendet = true;
  timerStoppen();
  spielLaeuft = false;

  // Getroffene Mine aufdecken + Explosion-Animation
  brett[idx(mineR, mineS)].aufgedeckt = true;
  zelleRendern(mineR, mineS);
  const explEl = document.querySelector(
    `#spielfeld [data-r="${mineR}"][data-s="${mineS}"]`
  );
  if (explEl) explEl.classList.add('explodiert');

  // Nach kurzer Pause: alle übrigen Minen aufdecken
  setTimeout(() => {
    for (let r = 0; r < config.reihen; r++) {
      for (let s = 0; s < config.spalten; s++) {
        const z = brett[idx(r, s)];
        // Nicht aufgedeckte Minen zeigen
        if (z.mine && !(r === mineR && s === mineS)) {
          z.aufgedeckt = true;
          zelleRendern(r, s);
        }
        // Falsch gesetzte Flaggen (kein Mine darunter) markieren
        if (z.flagge && !z.mine) {
          const fel = document.querySelector(
            `#spielfeld [data-r="${r}"][data-s="${s}"]`
          );
          if (fel) fel.textContent = '❌';
        }
      }
    }

    // Modal anzeigen
    setTimeout(() => {
      document.getElementById('gameover-zeit').textContent = sekunden;
      document.getElementById('modal-gameover').classList.remove('versteckt');
    }, 400);
  }, 300);
}

// ── Sieg ───────────────────────────────────────────────────────────────────────
async function sieg() {
  beendet = true;
  timerStoppen();
  spielLaeuft = false;

  // Alle noch nicht beflaggten Minen automatisch beflaggen
  for (let r = 0; r < config.reihen; r++) {
    for (let s = 0; s < config.spalten; s++) {
      const z = brett[idx(r, s)];
      if (z.mine && !z.flagge) {
        z.flagge = true;
        flaggenGesetzt++;
        zelleRendern(r, s);
      }
    }
  }
  hudAktualisieren();

  // Flaggen-Blink-Animation auf allen verdeckten (=beflaggten) Zellen
  document.querySelectorAll('.zelle.verdeckt').forEach(el =>
    el.classList.add('sieg-blinken')
  );

  // Score speichern
  await scoreSpeichern();

  // Rangliste laden und Modal zeigen
  document.getElementById('sieg-rangliste').innerHTML = await ranglisteHTML();
  document.getElementById('sieg-zeit').textContent = sekunden;

  setTimeout(() => {
    document.getElementById('modal-sieg').classList.remove('versteckt');
  }, 600);
}

// ── Spielname für Supabase ─────────────────────────────────────────────────────
function spielName() {
  const map = { einfach: 'easy', mittel: 'medium', schwierig: 'hard' };
  return `minesweeper-${map[schwierigkeitKey]}`;
}

// ── Score speichern ────────────────────────────────────────────────────────────
// punkte = -sekunden → get_leaderboard (DESC) zeigt schnellste Zeit zuerst
async function scoreSpeichern() {
  try {
    const user = await PZ.getUser();
    if (!user) {
      document.getElementById('sieg-login').style.display = 'block';
      return;
    }
    document.getElementById('sieg-login').style.display = 'none';
    await PZ.saveGameData(spielName(), -sekunden, 1, { sekunden });
  } catch (err) {
    console.warn('[Minesweeper] Score konnte nicht gespeichert werden:', err);
  }
}

// ── Rangliste HTML ─────────────────────────────────────────────────────────────
async function ranglisteHTML() {
  try {
    const eintraege = await PZ.getLeaderboard(spielName(), 10) || [];
    if (!eintraege.length)
      return '<p class="rl-leer">Noch keine Einträge</p>';

    const schwierigkeitLabel = { einfach: 'Einfach', mittel: 'Mittel', schwierig: 'Schwierig' };
    const zeilen = eintraege.map(e => `
      <div class="rl-eintrag">
        <span class="rl-rang">${Number(e.rang)}</span>
        <span class="rl-name">${esc(e.benutzername)}</span>
        <span class="rl-zeit">${Math.abs(Number(e.punkte))}s</span>
      </div>`).join('');

    return `<div class="rl-titel">Top 10 – ${schwierigkeitLabel[schwierigkeitKey]}</div>
            <div>${zeilen}</div>`;
  } catch (err) {
    console.warn('[Minesweeper] Rangliste konnte nicht geladen werden:', err);
    return '';
  }
}

// ── XSS-Schutz ────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}
