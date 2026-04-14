# NOTES.md — Fortschrittsprotokoll

## Heutiger Stand (2026-04-14) — Block Blast Neuaufbau

### Block Blast – Canvas, Engine, smarter Generator ✅
- **8×8**, drei Steine, **Canvas**-Raster, DOM-Tray; **BlockGenerator** mit gewichteter Zufallsauswahl, Verwerfen unsolvabler Triple, Merit nach Clear-Potenzial, Notfall drei 1er.
- **Trennung**: `Board`-Klasse, `BlockGenerator`-Klasse, Rendering `boardZeichnen`; **Debug**: `?debug=1` oder Taste **D** (gültige Felder, Generator-Text).
- **Fix (Apr. 14)**: Rettungs-Regeneration wenn keine der restlichen Formen passt; Tray-`pointerdown`-Delegation; Snap an Form-Schwerpunkt; dunkles Mobile-Design (Prompt-Optik, nicht Startseiten-CLAUDE-Look).

## Heutiger Stand (2026-04-14) — Pixel Factory Voll-Optimierung

### Pixel Factory – Talentbaum, Quantum, Pipeline, Migration ✅
- **Zielmetriken**: Kommentarblock `BALANCING – Zielmetriken` in `game.js` (früh/mittel/spät).
- **Talentbaum v2**: Vier Pfade (`pf_k_*`, `pf_p_*`, `pf_q_*`, `pf_u_*`) + `pf_root`; weichere Stufen-Boni.
- **Quantum/Prestige**: Additive `qp_global_add` / `qp_klick_add` mit Softcap in `spielModifikatoren()`; Meilensteine ohne ×1000-Sprünge; Prestige-Schwelle `4200×1,44^n` + Talent + Lifetime-Glättung; QP aus Lifetime + aktuellen Pixeln + Talent.
- **Pipeline**: `spielModifikatoren()` zentral für PPS/PPK-Quantum-Boni, goldene Pixel, Ehrgeiz (über `pf_u_t4`).
- **Save-Migration**: `schemaVersion: 2`, `LEGACY_*`-Maps für alte Talent- und Quantum-Upgrade-IDs, Ausführung in `spielstandLaden()`.
- **Technik**: `node --check` auf `games/pixel-factory/game.js` OK.

### Ranglisten-Bugs, Space Blaster, Balancing, EXP-System ✅

#### 1. Ranglisten-Bug – Block Blast
- **Root Cause**: `PZ.supabase.auth.getUser()` → `PZ.supabase` existiert nicht (auth.js nutzt `PZ.db`). TypeError wurde still von `catch (_) {}` verschluckt.
- **Fix**: ersetzt durch `PZ.getUser()` + `PZ.getUsername()`. Korrekte Feldnamen (`e.punkte` statt `e.score`).
- **Zusatz**: `console.error` in allen catch-Blöcken ergänzt.

#### 1. Ranglisten-Bug – Pixel Drop (Sand-Tetris)
- **Root Cause**: `ranglisteHTML()` nutzte `e.username` + `e.score`, aber Supabase RPC `get_leaderboard` gibt `benutzername` + `punkte` zurück.
- **Fix**: Feldnamen korrigiert auf `e.benutzername` + `e.punkte`. `console.error` ergänzt.

#### 2. Block Blast – Blöcke-Generierung
- `aktuelleFormen()` schloss `FORMEN_LEICHT` nach 30 Punkten komplett aus → nur große/mittlere Blöcke → schnell unspielbar.
- **Fix**: FORMEN_LEICHT ist jetzt immer Teil des Pools. Neue Schwellwerte: <50 nur LEICHT, <150 2×LEICHT+MITTEL, <400 LEICHT+2×MITTEL, ≥400 alle Gruppen.

#### 3. Space Blaster – Bug 1: Ecken-Schaden
- Gegnerschüsse flogen gerade nach unten (`dx:0`) → Spieler in Ecken nie getroffen.
- **Fix**: Schüsse zielen jetzt auf aktuelle Spieler-Position (`Math.hypot` + Normierung).

#### 3. Space Blaster – Bug 2: Punkte nur per Boss
- `gegnerTod()` addierte nie Score. `e.points` war definiert aber nie genutzt.
- **Fix**: `score += e.points; hudAktualisieren();` in `gegnerTod()` ergänzt.

#### 3. Space Blaster – Bug 3: Pausemenü
- Neu implementiert: P/Escape-Taste + mobiler Pause-Button im HUD
- `paused`-Variable stoppt `requestAnimationFrame`-Loop
- Pausemenü: helle weiße Karte, "Pausiert", Weiterspielen, Neustart
- Dateien: `game.js`, `index.html`, `style.css`

#### 4. Pixel Factory – Balancing
- Prestige-Schwelle: 1000 → **5000** Pixel (5× höher, ersten Prestige dauert viel länger)
- QP-Berechnung: `lifetimePixel / 1e8` → `/ 5e8` (5× mehr Pixel nötig für gleiche QP-Ausbeute)
- QP-Upgrade-Preise: ca. **2× erhöht** (Quanten-Fabrik I: 1→2 QP, II: 3→6 QP, etc.)

#### 5. Pixel Drop – EXP/Level-System
- **Farbthemen**: 5 Themen (Standard immer, Pastell Lv.5, Neon Lv.10, Erde Lv.20, Glitter Lv.35)
- Thema-Wechsel: 🎨-Button im HUD (früher: Einstellungen-Platzhalter)
- **EXP**: Stein platziert +5 EXP; 1 Farbe verbunden +100, 2 Farben +250, 3+ Farben +500
- **Level 1–50**: Level N braucht N×200 EXP
- Level-Up: weißer Toast "Level X erreicht! ⭐" für 2,2 s + Leiste blinkt lila
- **EXP-Leiste**: am unteren Bildschirmrand, zeigt Lv.X + Fortschrittsbalken + EXP-Zähler
- Gespeichert in `extra_daten` (kein Schema-Change nötig, `level`-Spalte schon vorhanden)
- Dateien: `game.js`, `index.html`, `style.css`

### Was als nächstes zu tun ist
- Spieltests aller geänderten Spiele im Browser

### Veränderte Dateien (2026-04-14)
- `games/block-blast/index.html` — Ranglisten-Bug fix, Block-Generierung
- `games/pixel-drop/game.js` — Ranglisten-Bug fix, EXP/Level-System
- `games/pixel-drop/index.html` — EXP-Leiste HTML
- `games/pixel-drop/style.css` — EXP-Leiste + Level-Up Toast CSS
- `games/space-blaster/game.js` — Punkte, Ecken-Schaden, Pause-Logik
- `games/space-blaster/index.html` — Pause-Button + Pausemenü HTML
- `games/space-blaster/style.css` — Pause-Button + Pausemenü CSS
- `games/pixel-factory/game.js` — Voll-Optimierung (Talent v2, Quantum additiv, Migration, Pipeline) + früheres Balancing

## Heutiger Stand (2026-04-13)

### Bug-Fixes & Login-Hint Redesign ✅
- **Pixel Factory Rangliste**: `e.username` → `e.benutzername` (zeigt jetzt echte Namen statt 'Anonym')
- **Pixel Drop Scoring**: Formel `totalPixel * 10` → `(totalPixel / BLOCK_SCALE²) * 10` (1 Block = 49 Sub-Pixel zählten je als 10 Punkte → viel zu schnell)
- **Pixel Drop Progress-Bar**: Wenn Score > letzter Meilenstein, zeigt die Leiste jetzt "MAX" statt einzufrieren
- **Pixel Jump Highscore-Banner**: `bestScore`-Variable beim Start aus Supabase laden, Banner nur wenn `score > bestScore` (kein False-Positive mehr beim ersten Spiel oder bei niedrigerem Score)
- **Login-Hint Redesign** (alle 6 Spiele): Aus kleinem Textlink → gelbe Warn-Box mit Headline und Button „Anmelden / Registrieren"
  - Space Blaster, Pixel Drop, Pixel Jump, Minesweeper, Wordle, Memory Match

## Heutiger Stand (2026-04-12)

### Neon Runner & Arkanoid X entfernt ✅
- `games/neon-runner/` Ordner gelöscht
- `games/arkanoid/` Ordner gelöscht
- `index.html`: Spielkarten für Neon Runner und Arkanoid X entfernt
- `index.html`: Feedback-Dropdown-Optionen für beide Spiele entfernt
- `index.html`: Spielzähler 9 → 7 Spiele (Pill, Footer, Meta-Description, OG-Description)
- `style.css`: `.t-arkanoid`, `.t-arkanoid::before`, `.t-arkanoid::after`, `.t-runner::before`, `.tag-runner` entfernt

## Heutiger Stand (2026-04-10) – Update 3

### Pixel Factory – Echte Screenshot-Bilder als Skin-Hintergründe ✅
- Alle 14 Screenshots als PNG-Dateien in `games/pixel-factory/assets/` kopiert
- Alle bgAnim-Funktionen verwenden jetzt `background-image: url(assets/...)` mit `cover`
- Partikel-Animationen werden auf die Bilder gelegt (kein CSS-Nachbau mehr)
- Animationen pro Skin:
  - **Weltraum** → funkelnde Sterne + Sternschnuppen über weltraum.png
  - **Kirschblüte** → 38 fallende Blütenblätter über kirschbluete.png
  - **Winter** → 50 Schneeflocken über winter.png
  - **Wald** → 25 schwebende Pollen-Punkte über wald.png
  - **Ozean** → 22 aufsteigende Blasen über ozean.png
  - **Märchen** → 45 Funken über maerchen.png
  - **Glitter-Gold** → 70 Gold-Glitzer-Partikel über glitzergold.png
  - **Wüste** → Hitzeflimmern über wueste.png
  - **Sonnenschein** → pulsierender Licht-Overlay über sonnenschein.png
  - **Herbst** → 40 rote/orange Blätter über herbst.png
  - **Retro** → 16 Neon-Pixel-Blöcke über retro.png
  - **Midnight Drive** → 45 Regenstreifen über midnight.png
  - **Dark City** → 60 dichte Regenstreifen über darkcity.png
  - **Chrome** → 30 silberne Glitzer-Partikel über chrome.png
- `bgAnimStoppen()` cleared jetzt auch `c.style.backgroundImage`
- 3 neue Skins: Midnight Drive (55), Dark City (60), Chrome (65)
- Geänderte Dateien: game.js, style.css, assets/ (neu)

## Heutiger Stand (2026-04-10)

### Pixel Factory – Animierte Skin-Hintergründe ✅
- Skins haben jetzt echte animierte Szenen-Hintergründe im Mittelbereich
- `#bgAnimContainer` liegt korrekt in `.spiel-mitte` (nicht full-page)
- CSS: `position: absolute; inset: 0; z-index: 0`, `.spiel-mitte { position: relative }`
- Alle bgAnim-Funktionen neu geschrieben (kein schlechtes SVG-Art mehr):
  - **Weltraum**: Nebel-Gradienten, leuchtender Planet mit Ring + Mond, 130 Sterne, Sternschnuppen
  - **Kirschblüte**: Rosa Himmel, Wiese, Stamm/Äste (CSS), 7 verschwommene Blüten-Wolken, fallende Blütenblätter
  - **Winter**: Blauer Himmel, 3 Schneehügel, CSS-Tannenbäume mit Schnee, 50 Schneeflocken
  - **Wald**: Grüner Wald, Licht-Gradient, Waldboden, einfache Baumellipsen, fallende Blätter
  - **Ozean**: Ozean-Gradient, Sonne, Lichtreflexion, Meeresboden, 28 Blasen
  - **Märchen**: Lila Fantasy, Mond, Wiese, vereinfachtes Schloss-SVG (0.35 Opacity), 55 Funken
  - **Glitzer-Gold**: Goldener Gradient, große Sonne, Hügel-Silhouetten, 65 leuchtende Gold-Partikel
- Geänderte Dateien: game.js, style.css, index.html

## Heutiger Stand (2026-04-06)

### Pixel Factory – Layout & Features (2026-04-06) ✅
- 3-Spalten-Layout: Stats links | Canvas Mitte | Shop rechts
- Tutorial (4 Schritte), nur beim ersten Start
- Bulk-Kauf: ×1/×10/×50/Max für Gebäude
- Prestige Custom-Modal statt browser confirm()
- Prestige Partikel-Animation
- Klick-Ring Puls-Effekt
- Gebäude-Shop: leistbar Highlight (blau), korrektes HTML-Grid
- Upgrades-Tab: abwechselnd Klick/Produktion, leistbar/pps-/ppk-Klassen
- Quantum-Upgrades-Tab: leistbar Klasse

### Task 7: JS – Prestige-Modal (Pixel Factory) ✅
**Status:** DONE
- `prestigeDurchfuehren()` ersetzt:
  - Zeigt Modal statt browser `confirm()` zu nutzen
  - Berechnet `qpGewinn`, schreibt in `#pcQP` Element
  - Setzt `data-qp` auf Modal-Element mit Gewinn
  - Entfernt `versteckt`-Klasse um Modal zu zeigen
- `prestigeAusfuehren(qpGewinn)` neue Funktion:
  - Führt Prestige-Logik aus (pixel/gebäude zurücksetzen, prestige+1, etc.)
  - Skins-Check, Stats-Neuberechnung, Hauf-Init, Shop-Render
  - Toast-Benachrichtigung + Spielstand-Speicherung
- Modal-Button-Listener in `DOMContentLoaded`:
  - `#prestigeConfirmJa`: Extrahiert `data-qp`, schließt Modal, ruft `prestigeAnimationZeigen()` auf (wird in Task 8 implementiert) mit Callback zu `prestigeAusfuehren(qpGewinn)`
  - `#prestigeConfirmNein`: Schließt Modal ohne Aktion
- Git commit `79ed9a5`: "feat(pixel-factory): prestige custom-modal statt browser confirm"

### Weiterer Stand (2026-04-06)

### Task 5: JS – Bulk-Kauf (Pixel Factory) ✅
**Status:** DONE
- `gebaeudeKaufen()` Funktion ersetzt mit Bulk-Kauf-Logik:
  - `bulkMenge === 0` → `gebaeudeMaxMenge(g)` (Max möglich), sonst `bulkMenge`
  - Schleife über Menge: kaufe so viele wie möglich, bricht bei fehlenden Pixeln ab
- Bulk-Button Event-Listener in `DOMContentLoaded` verdrahtet:
  - `.bulk-btn` Klick: entfernt `aktiv`-Klasse von allen, fügt zu geklicktem Button hinzu
  - Setzt `bulkMenge` aus `btn.dataset.menge`
  - Ruft `shopGebaeudeRendern()` auf für UI-Update
- Bulk-Leiste Sichtbarkeit:
  - Nur im Gebäude-Tab sichtbar
  - Event-Listener auf Shop-Tab-Klicks: `.bulkLeiste.classList.toggle('versteckt', ...)`
- Git commit `51ffe27`: "feat(pixel-factory): bulk-kauf x1/x10/x50/max"
- Git push erfolgreich

## Heutiger Stand (2026-04-04)

### Task 1: Blockfall komplett löschen ✅
**Status:** DONE
- `games/blockfall/` Ordner gelöscht (rekursiv)
- `index.html`:
  - Blockfall-Spielkarte entfernt (Zeilen 72-90)
  - Spielzähler: "9 Spiele" → "8 Spiele"
  - Feedback-Dropdown: blockfall-Option entfernt
- Git commit `0e2437f`: "feat: Blockfall entfernt"
- Git push erfolgreich

## Heutiger Stand (2026-04-02)

### Minesweeper (2026-04-02) ✅
- `games/minesweeper/` angelegt: index.html, game.js, style.css
- Chrome-Minesweeper-Design: grünes Schachbrettmuster, beige aufgedeckt
- 3 Schwierigkeitsgrade: Einfach 9×9/10, Mittel 16×16/40, Schwierig 30×16/99
- First-click-safe: Minen erst nach erstem Klick platziert
- Flood-Fill bei leeren Feldern (rekursiver DFS)
- Long Press Mobile = Flagge setzen
- Explosion-Animation bei Game Over
- Supabase-Rangliste: minesweeper-easy / -medium / -hard
- punkte = -sekunden (schnellste Zeit steht oben)
- Startseite: 8. Spielekarte hinzugefügt

### Task 3: game.js – Wörterliste + Init ✅
**Status:** DONE
- `games/wordle/game.js` erstellt mit:
  - 660 deutsche 5-Buchstaben-Wörter (WOERTER-Array)
  - Alle Wörter korrekt 5 Zeichen lang
  - Spielzustand-Variablen (zielwort, versuche, eingabe, beendet, animiert, tastaturMap)
  - Statistiken-Struktur (gespielt, gewonnen, aktSerie, maxSerie, verteilung)
  - DOMContentLoaded-Init mit PZ.updateNavbar(), statsLaden(), neuesSpiel(), Tastatur-Listener
- Commit `bafee7c` gepusht
- Funktionen `neuesSpiel()`, `tastaturHandler()`, `statsLaden()` werden in Task 4/5 ergänzt

### Task 6: Wordle-Spiel (2026-04-02) ✅
**Status:** DONE
- `games/wordle/` angelegt: index.html, game.js, style.css
- 631 eindeutige deutsche 5-Buchstaben-Wörter (dedupliciert)
- QWERTZ-Tastatur mit Ä/Ö/Ü, Flip/Bounce/Shake-Animationen
- Supabase-Statistiken: gespielt, gewonnen, Serien, Versuchsverteilung
- Rangliste: Top 10 nach Siegen
- Startseite: Wordle-Karte + Zähler 6→7 Spiele, Feedback-Dropdown aktualisiert

### Was heute gemacht wurde
- `doodle-jump` überall in `pixel-jump` umbenannt:
  - Ordner `games/doodle-jump/` → `games/pixel-jump/`
  - `index.html`: Kommentar, onclick-Pfad, Kartentitel
  - `style.css`: `.t-doodle` → `.t-pixel`
  - `games/pixel-jump/index.html`: `<title>`, Anzeige-Titel, alle 4 Spiel-Namen in PZ-Aufrufen
- Login-Design (`login.html`) auf helles Theme umgestellt:
  - Hintergrund `#f0f7ff`, weiße Card, dunkler Text — passend zur Hauptseite
  - Kein dunkles `#0d0d12` mehr
  - Input-Fokus jetzt blau statt orange
- Alle 6 Spieldateien aufgeteilt in `index.html` + `game.js` + `style.css`

### Früherer Stand (2026-04-01)

#### Was damals gemacht wurde
- CLAUDE.md aktualisiert mit Design-Richtlinien und Ordnerstruktur-Standard
- Alle 6 Spieldateien in `games/[name]/index.html` verschoben
- Back-Links in den Spielen auf `../../index.html` angepasst
- Startseite komplett neu gestaltet: Hellblau-Theme statt Dark-Theme
- CSS in externe `style.css` ausgelagert
- `.gitignore` angelegt
- **Task 6: Alte flache .html-Dateien gelöscht** (doodle-jump.html, blockfall.html, arkanoid.html, space-blaster.html, neon-runner.html, memory-match.html)
- Commit `152c4dc` gepusht

#### Startseiten-Redesign (2026-04-01, zweite Runde)
- Hero-Bereich, Suchleiste, Kategorie-Filter und Statistik-Leiste entfernt
- Header zeigt nur noch Logo + orangener „Anmelden"-Button
- Spielegrid folgt direkt nach dem Header
- Thumbnail-Hintergründe: dunkel → helle Pastellfarben
- style.css: alle ungenutzten Sektionen bereinigt (~340 Zeilen entfernt)
- Commit `1d6d59a` gepusht

#### Supabase-Datensynchronisation (2026-04-01)
- auth.js: neue `saveGameData()` Funktion — Highscore nur bei Verbesserung, extra_daten immer
- Alle 6 Spiele: JSONBin entfernt, Supabase eingebunden
- Alle 6 Spiele: `initPlayer()` lädt Coins/Skins/Upgrades aus Supabase beim Start
- Alle 6 Spiele: `endGame()` speichert via `PZ.saveGameData()` (asynchron, nicht-blockierend)
- Alle 6 Spiele: Rangliste aus `PZ.getLeaderboard()`
- Alle 6 Spiele: Namenseingabe entfernt — Benutzername kommt vom Login
- Alle 6 Spiele: Login-Hinweis bei Game Over wenn nicht angemeldet
- Pixel Jump (ehem. Doodle Jump): Upgrades in extra_daten, direkter Spielstart ohne Name-Screen
- Neon Runner: bestDist in extra_daten
- Commit `5901f9f` gepusht

**Supabase `get_leaderboard` RPC:** Bereits in `supabase/migrations/20260101000000_initial.sql` definiert und deployed. Kein weiterer Handlungsbedarf.

- Modal-Leiste (schwarze Leiste mit PIXELZONE + Schließen) entfernt
- Spiele öffnen jetzt direkt per `window.location.href` statt im iframe-Modal
- Browser-Zurück-Button funktioniert wieder normal
- ESC-Handler für Modal entfernt
- Pixel Jump: Touch-Steuerungs-Buttons unsichtbar gemacht (aber weiterhin funktional)
- **Feedback-Button** zur Startseite hinzugefügt:
  - Fester Button unten rechts mit Sprechblasen-Icon
  - Modal mit Kategorie, Nachricht, Spiel-Dropdown (bei Bug), Screenshot-Upload (Drag & Drop, JPG/PNG)
  - Benutzername/User-ID automatisch aus Login
  - Screenshots in Supabase Storage (`feedback-screenshots`)
  - Feedback in neuer Supabase-Tabelle `feedback`
  - Erfolgsbestätigung + Auto-Close nach 2 Sekunden

- Screenshot-Upload im Feedback-Modal für alle Kategorien verfügbar gemacht (nicht mehr nur Bug/Verbesserung)
- Supabase-Migration `20260402000001_feedback.sql` erfolgreich im Dashboard ausgeführt ✅

### Task 8: Space Blaster Game Over + Rangliste (2026-04-02) ✅
**Status:** DONE
- `spielEnde()` implementiert:
  - Münzen aus dieser Runde permanent addieren (pdata.coins += gameCoins)
  - Score + Münzen in Supabase speichern (spielerDatenSpeichern())
  - Benutzer-Check: loginHint zeigen wenn nicht angemeldet
  - Titel-Münzanzeige aktualisieren
  - Game-Over-Screen mit Punkten, Welle, Münzen befüllen
- `rangliste_zeigen()` + `ranglisteHTML()` implementiert:
  - Lädt Top 10 von Supabase via PZ.getLeaderboard('space-blaster', 10)
  - Medaillentabelle (🥇/🥈/🥉) mit Rang, Name, Punkte, Welle
  - Fehlerbehandlung bei Laden-Fehler
- Commit `004fc59` gepusht

### Space Blaster – Vollständiger Rewrite (2026-04-02) ✅
- Vollbild-Canvas, Raumschiff links/rechts, Auto-Fire
- 5 Shot-Level (stackend), Laser, Fast-Fire, Schild, Herz
- Wellen-System: statisch (1), l/r (2-3), diagonal (4-5), Gegner schießen (6+)
- Boss jede 10. Welle: HP-Balken, Phase 2, Sieg-Animation
- Münzen-System: Gegner/Boss-Drops, permanent in Supabase
- Permanente Upgrades: Power-Up-Dauer (3 Stufen), Max-Leben (3 Stufen)
- Shop nach Game Over, Rangliste mit Platz/Name/Punkte/Welle

### Space Blaster – Integritätsprüfung (2026-04-02) ✅
- Keine doppelten Funktionsdefinitionen gefunden
- Keine leeren Platzhalter-Funktionen gefunden
- Kein `var` gefunden
- `welleSpawnen()` in `spielStarten()` war vorhanden, veralteten Kommentar entfernt
- `vorherigerScreen`-Variable hinzugefügt (nach `loopId`)
- `shop_zeigen()` merkt sich jetzt den vorherigen Screen (game-over oder title)
- `btn-shop-back` navigiert jetzt korrekt zum vorherigen Screen statt immer zum Title

### Space Blaster – Mobile & Balance Fixes (2026-04-03) ✅
1. **Gegner schießen**: Globaler Cooldown – nur 1 Gegner schießt auf einmal (Welle 6: ~0.8s, höhere Wellen: schneller, min 0.25s)
2. **Touch-Steuerung**: Schiff folgt direkt dem Finger (player.x = touchX), kein links/rechts mehr
3. **Blaues Markieren**: user-select:none in style.css, touchstart non-passive + preventDefault, user-scalable=no im Viewport

### Pixel Drop (2026-04-03) ✅
- `games/pixel-drop/` angelegt: index.html, game.js, style.css
- 10×20 Grid, Pixel-Physik (Fallen + Rutschen, 3 Durchläufe/Frame)
- 17 Block-Formen (7 Tetris + 10 Extra), Drag & Drop mit Ghost-Vorschau
- BFS-Verbindungs-Check: Farbe von Rand zu Rand → Pixel verschwinden
- Punkte-Multiplikator: ×1 bis ×3 je nach gleichzeitigen Farben
- Game Over: Gefahrenlinie / kein Platz mehr
- Supabase-Rangliste via PZ.getLeaderboard / PZ.saveGameData
- Startseite: Pixel-Drop-Karte hinzugefügt (9. Spiel)

### Blockfall – Bug-Fixes (2026-04-03) ✅
- `var` → `const`/`let` überall (CLAUDE.md-Standard)
- `setInterval`-Game-Loop → `requestAnimationFrame` mit Delta-Akkumulation
- Shop-Käufe (`buyTheme()`) jetzt in Supabase synchronisiert (vorher nur localStorage → Themes auf anderen Geräten verloren)
- `endGame()`: `cancelAnimationFrame` statt `clearInterval`
- Touch-Steuerung für Mobile hinzugefügt: Wischen links/rechts = bewegen, Tap = rotieren, Wischen runter = Hard Drop
- Keydown-Handler: `if (!running) return` damit Tasten auf anderen Screens nichts tun
- `drawAll()` Guard: prüft `cur` auf null bevor Ghost/Piece gezeichnet wird

### Pixel Drop – Design & Gameplay Fixes (2026-04-03) ✅
- Canvas zentriert: `left: 50%; transform: translateX(-50%)` statt `left: 0`
- Spielscreen-Hintergrund dunkel (#101c30) damit kein Weiß neben dem Canvas sichtbar ist
- Board-Farbe: `#1a1a2e` → `#101c30` (konsistent mit Screen-Hintergrund)
- Pixel-Zellgröße: max 40 → 52px (sehen größer/klarer aus auf PC)
- Physik-Geschwindigkeit: 3 Schritte/Frame (~180/s) → zeitbasiert 1 Schritt/50ms (~20/s)
- Physik-Akkumulator auf max 3 Schritte begrenzt (kein Aufholen nach Tab-Wechsel)
- Akkumulator wird nach BFS-Check zurückgesetzt

### Blockfall entfernt + Pixel Drop Sand-Zerfall (2026-04-04) ✅
- Blockfall komplett entfernt: Ordner `games/blockfall/`, Spielkarte, Feedback-Dropdown-Option
- Spielzähler 9 → 8 Spiele
- Pixel Drop: internes Grid von 10×20 auf 70×140 umgestellt (BLOCK_SCALE=7)
- Jede Block-Zelle = 7×7 Sub-Pixel-Cluster; zerfällt beim Aufprall in Sand-Pixel
- `physGitter` (140×70) ersetzt altes `gitter` (20×10)
- `subGr` ersetzt `zellenGr`
- BFS, Physik, Ghost, Rendering, Block-Platzierung vollständig angepasst
- `physikWarRuhig`-Guard: verhindert BFS-Aufrufe 60x/Sekunde im ruhigen Zustand
- BFS queue.shift() → head-pointer für O(n) statt O(n²)

### Pixel Factory – Fertigstellung (2026-04-04) ✅
- `spielstandSpeichern()` + `spielstandLaden()` via PZ.saveGameData/loadScore implementiert
- Offline-Bonus: 50 % der verpassten Produktion, begrenzt auf maxOfflineStunden(), ab 1 Min. Abwesenheit
- Autosave alle 60 Sekunden (kein Toast), manuelle Speichern-Button zeigt Toast
- `ranglisteRendern()`: lädt Top 10, zwei Tabs (Meiste Pixel / Prestige), Prestige-Tab sortiert client-seitig nach level
- `DOMContentLoaded`-Init: alle Buttons und Event-Listener verdrahtet (Canvas-Klick, Touch, Prestige, Speichern, Rangliste, Errungenschaften, Skins, Shop-Tabs, Modal-Backdrop)
- `beforeunload`: letzterBesuch aktualisiert für korrekten Offline-Bonus beim nächsten Start
- Startseite: Pixel-Factory-Karte hinzugefügt (9. Spiel), Zähler 8→9, Footer aktualisiert
- `style.css`: `.t-factory` (gelb), `.tag-idle` (orange) hinzugefügt
- Feedback-Dropdown: pixel-factory Option ergänzt

### Pixel Factory – Großes Update (2026-04-09) ✅

#### Was gemacht wurde
- **Bugfix**: `.shop-kopf` hatte `position: sticky; top: 52px` → auf `position: static` geändert, erstes Shop-Item war auf Mobile verdeckt
- **Gebäude-Verdopplung**: Jedes weitere gekaufte Gebäude verdoppelt seinen PPS-Beitrag (`basisPPS × (2^N - 1)`). Alle `basisPPS`-Werte ×10 skaliert (Einfache Maschine: 0,1 → 1 PPS)
- **Mehr Upgrades**: KLICK_UPGRADES von 14 auf 22 erweitert, PPS_UPGRADES von 10 auf 20. Glattere Preisstaffelung (×4–5 pro Schritt statt ×5–10). Neuer `pps_mult`-Upgrade-Typ.
- **Sortierung**: Upgrades-Tab und Quantum-Tab sortieren jetzt aufsteigend nach Preis
- **Quantum Boosts entfernt**: Die 6 aktivierbaren Boosts (Pixel-Schauer, Goldener Ruf etc.) wurden entfernt
- **Talent-System**: 20 Talente in 5 Kategorien (Klick, Produktion, Prestige, Start, Besonderes). Pro Prestige +1 Talentpunkt. Jedes Talent kostet 1 Punkt, viele Talente haben maxLevel > 1 (mit weiteren Punkten upgradebar). Levels als ◆◆◆◇◇-Dots angezeigt.
- **Errungenschaften-Hinweise**: Gesperrte Errungenschaften zeigen jetzt immer den Bedingungstext (statt "Noch nicht erreicht"). Name bleibt "???".
- **Skin-Themes**: Skins ändern jetzt das komplette UI-Design via CSS Custom Properties. 12 neue Skins hinzugefügt: Wald, Ozean, Wüste, Winter, Sonnenschein, Kirschblüte, Retro, Herbst, Märchen, Weltraum, Glitzer-Gold (20 Skins gesamt)
- **index.html**: Talent-Button mit Badge, Talent-Modal, Prestige-Modal-Text aktualisiert

#### Veränderte Dateien
- `games/pixel-factory/game.js` — Hauptlogik komplett überarbeitet
- `games/pixel-factory/style.css` — Sticky-Fix, Talent-CSS, Skin-Grid erweitert
- `games/pixel-factory/index.html` — Talent-Button, Talent-Modal

### Pixel Factory – Scenic Skin-Hintergründe (2026-04-10) ✅

#### Was gemacht wurde
- `#bgAnimContainer` aus `.spiel-mitte` herausgelöst → jetzt `position:fixed; inset:0; z-index:-1` (Vollbild)
- Alle bgAnim-Funktionen komplett neu geschrieben mit echten Landschafts-Szenen:
  - **Weltraum**: Tiefer Weltraum (dunkel), Planet mit Ring, Mond, Nebel, 180 Sterne, Sternschnuppen
  - **Kirschblüte**: Japanischer Garten – Himmel, Wiese, Kirschblütenbaum (SVG), kleiner Baum, Blütenblätter
  - **Winter**: Verschneite Landschaft – Hügel (3 Ebenen), Tannenbäume mit Schnee, Schneeflocken
  - **Wald**: Sonnendurchfluteter Wald – Himmel, Waldsilhouetten (SVG), Lichtstimmung, fallende Blätter
  - **Ozean**: Unterwasserpanorama – Himmel, Sonne, Meeresboden, Wellenlinie (CSS), Blasen
  - **Märchen**: Schloss-Panorama – Farbverlauf, Mondschein, Regenbogen-Bogen, Wiese, Schloss (SVG), Funkeln
  - **Glitzer-Gold**: Goldener Sonnenuntergang – Sonne, Hügelsilhouetten, Glitzer-Partikel
- Hilfsfunktion `_bgEl()` für kompaktes DOM-Element-Erstellen
- CSS: `position:absolute` → `position:fixed` für bgAnimContainer

#### Veränderte Dateien
- `games/pixel-factory/index.html` — bgAnimContainer direkt in body
- `games/pixel-factory/style.css` — fixed positioning
- `games/pixel-factory/game.js` — alle bgAnim-Funktionen neu

### Pixel Factory – Skin-Animationen aktiviert (2026-04-10) ✅

#### Was gemacht wurde
- Alle bgAnim-Funktionen und bodyClasses in der SKINS-Array verdrahtet (waren bisher nie aufgerufen)
- Weltraum: dunkles Canvas-Hintergrund (`#0f172a → #1a0533`), `bgAnim: bgAnimWeltraum`, `bodyClass: 'skin-weltraum'`
- Winter: `bgAnim: bgAnimWinter`, `bodyClass: 'skin-winter'`; Schneeflocken auf hellem Hintergrund sichtbar gemacht (blau statt weiß)
- Wald: `bgAnim: bgAnimWald` (fallende Blätter)
- Ozean: `bgAnim: bgAnimOzean`, `bodyClass: 'skin-ozean'` (Blasen + Wellenoverlay)
- Kirschblüte: `bgAnim: bgAnimKirschbluete` (fallende Blütenblätter)
- Märchen: `bgAnim: bgAnimMaerchen` (bunte Funkeln)
- Glitzer-Gold: `bgAnim: bgAnimGlitzergold` (goldene Partikel)
- Plasma: `bodyClass: 'skin-plasma'` (pulsierende Kreise via CSS)
- Sonnenschein: `bodyClass: 'skin-sonnenschein'` (rotierende Lichtstrahlen via CSS)
- CSS: `.skin-weltraum .klick-label` und `.offline-bonus`/`.ereignis-banner` für dunklen Hintergrund angepasst

#### Veränderte Dateien
- `games/pixel-factory/game.js` — SKINS-Array: bgAnim + bodyClass für alle animierten Skins
- `games/pixel-factory/style.css` — Winter-Schneeflocken-Farbe, Weltraum-Texte

### Was als nächstes zu tun ist
- Weitere Spiele entwickeln oder Bestehende erweitern

### Veränderte Dateien (2026-04-02)
- `index.html` — Pixel Jump, kein Modal mehr, Feedback-Button + Modal + JS
- `style.css` — `.t-pixel`, kein Modal-CSS, Feedback-CSS hinzugefügt
- `login.html` — helles Design
- `games/pixel-jump/` — umbenannt aus `games/doodle-jump/`
- `games/pixel-jump/style.css` — Touch-Buttons unsichtbar, extrahiert
- `games/pixel-jump/game.js` — extrahiert
- `games/space-blaster/style.css`, `game.js` — extrahiert
- `games/blockfall/style.css`, `game.js` — extrahiert
- `games/memory-match/style.css`, `game.js` — extrahiert
- `games/arkanoid/style.css`, `game.js` — extrahiert
- `games/neon-runner/style.css`, `game.js` — extrahiert
- `supabase/migrations/20260402000001_feedback.sql` — neu (manuell anwenden!)
- `NOTES.md` — aktualisiert
