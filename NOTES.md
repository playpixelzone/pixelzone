# NOTES.md — Fortschrittsprotokoll

## Heutiger Stand (2026-04-02)

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

### Was als nächstes zu tun ist
- Neues Spiel hinzufügen (nach Bedarf)

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
