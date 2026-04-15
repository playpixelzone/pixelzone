import Head from "next/head";
import Script from "next/script";

const SITE_URL = "https://playpixelzone.github.io/pixelzone/";

export async function getServerSideProps() {
  const games = [
    {
      slug: "pixel-jump",
      title: "Pixel Jump",
      description: "Spring hoch, weiche Feinden aus, klettere auf die Rangliste.",
      category: "Arcade",
      tagClass: "tag-arcade",
      thumbClass: "t-pixel",
      emoji: "🐸"
    },
    {
      slug: "space-blaster",
      title: "Space Blaster",
      description: "Verteidige die Galaxis in diesem Weltraum-Shoot'em'up.",
      category: "Action",
      tagClass: "tag-action",
      thumbClass: "t-space",
      emoji: "🚀"
    },
    {
      slug: "memory-match",
      title: "Memory Match",
      description: "Finde alle Paare bevor die Zeit ablaeuft.",
      category: "Memory",
      tagClass: "tag-memory",
      thumbClass: "t-memory",
      emoji: "🃏"
    },
    {
      slug: "wordle",
      title: "Wordle",
      description: "Errate das deutsche 5-Buchstaben-Wort in 6 Versuchen.",
      category: "Woerter",
      tagClass: "tag-puzzle",
      thumbClass: "t-wordle",
      emoji: "🔤"
    },
    {
      slug: "minesweeper",
      title: "Minesweeper",
      description: "Decke alle sicheren Felder auf ohne eine Mine zu treffen.",
      category: "Puzzle",
      tagClass: "tag-puzzle",
      thumbClass: "t-minesweeper",
      emoji: "💣"
    },
    {
      slug: "pixel-drop",
      title: "Pixel Drop",
      description: "Block-Physik-Puzzle mit Farb-Verbindungen.",
      category: "Puzzle",
      tagClass: "tag-puzzle",
      thumbClass: "t-pixeldrop",
      emoji: "🧩"
    },
    {
      slug: "pixel-factory",
      title: "Pixel Factory",
      description: "Klicke Pixel, baue Fabriken, erforsche Prestige-Upgrades.",
      category: "Idle",
      tagClass: "tag-idle",
      thumbClass: "t-factory",
      emoji: "🏭"
    },
    {
      slug: "block-blast",
      title: "Block Blast",
      description: "Fuelle Reihen und Spalten mit bunten Bloecken fuer Combo-Punkte.",
      category: "Puzzle",
      tagClass: "tag-puzzle",
      thumbClass: "t-blockblast",
      emoji: "🟪"
    },
    {
      slug: "pixel-phone",
      title: "Pixel Phone",
      description: "Stille Post mit Zeichnen und Schreiben - 2 bis 12 Spieler, Echtzeit.",
      category: "Multiplayer",
      tagClass: "tag-puzzle",
      thumbClass: "t-pixelphone",
      emoji: "📞"
    },
    {
      slug: "pong",
      title: "Pong",
      description: "Klassisches Pong mit KI-Stufen, Ranglisten und Online-Multiplayer per Raum-Code.",
      category: "Arcade",
      tagClass: "tag-arcade",
      thumbClass: "t-pong",
      emoji: "🏓"
    }
  ];

  return {
    props: {
      games,
      gameCount: games.length,
      year: 2026
    }
  };
}

export default function Home({ games, gameCount, year }) {
  return (
    <>
      <Head>
        <title>PIXELZONE - Kostenlose Browser-Spiele online spielen</title>
        <meta
          name="description"
          content="PIXELZONE - kostenlose Browser-Spiele direkt online spielen. Pixel Factory, Pixel Jump, Pixel Phone, Space Blaster, Wordle, Minesweeper und mehr. Kein Download, gratis zocken!"
        />
        <meta
          name="keywords"
          content="pixelzone, playpixelzone, pixel zone, browser spiele, kostenlose spiele online, pixel factory, pixel jump, space blaster, wordle, minesweeper, gratis spielen"
        />
        <meta name="author" content="PIXELZONE" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:title" content="PIXELZONE - Kostenlose Browser-Spiele" />
        <meta
          property="og:description"
          content="Kostenlose Browser-Spiele - Pixel Factory, Pixel Jump, Pixel Phone, Space Blaster und mehr. Jetzt auf PIXELZONE spielen!"
        />
        <meta property="og:site_name" content="PIXELZONE" />
        <link rel="canonical" href={SITE_URL} />
      </Head>

      <Script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" strategy="afterInteractive" />
      <Script src="/auth.js" strategy="afterInteractive" />
      <Script src="/home-news.js" strategy="afterInteractive" />

      <header>
        <a href="#" className="logo">
          <div className="logo-mark">🕹</div>
          <span className="logo-name">PIXELZONE</span>
        </a>
        <div id="navAuth">
          <a href="/login.html" className="nav-login-btn">
            Anmelden
          </a>
        </div>
      </header>

      <main>
        <section className="home-news" aria-label="News und Updates">
          <div className="home-news-top">
            <div className="home-news-badge" id="homeNewsBadge">News</div>
            <button className="home-news-edit-btn hidden" id="homeNewsEditBtn" type="button">Bearbeiten</button>
          </div>
          <h2 className="home-news-title" id="homeNewsTitle">PIXELZONE News</h2>
          <p className="home-news-body" id="homeNewsBody">News werden geladen...</p>
          <div className="home-news-meta" id="homeNewsMeta"></div>

          <div className="home-news-poll hidden" id="homeNewsPoll">
            <h3 id="homeNewsPollQuestion"></h3>
            <ul id="homeNewsPollOptions"></ul>
          </div>

          <div className="home-news-editor hidden" id="homeNewsEditor">
            <p className="home-news-editor-info" id="homeNewsEditorInfo"></p>
            <div className="home-news-editor-grid">
              <label>
                Typ
                <select id="homeNewsKind" defaultValue="news">
                  <option value="news">News</option>
                  <option value="poll">Abstimmung</option>
                </select>
              </label>
              <label>
                Titel
                <input id="homeNewsTitleInput" type="text" maxLength={120} />
              </label>
            </div>
            <label>
              Text
              <textarea id="homeNewsBodyInput" rows={4} maxLength={2500}></textarea>
            </label>

            <div className="home-news-poll-fields hidden" id="homeNewsPollFields">
              <label>
                Abstimmungsfrage
                <input id="homeNewsPollQuestionInput" type="text" maxLength={200} />
              </label>
              <label>
                Optionen (eine Zeile = eine Option)
                <textarea id="homeNewsPollOptionsInput" rows={4} maxLength={800}></textarea>
              </label>
            </div>

            <div className="home-news-editor-actions">
              <button className="news-btn secondary" id="homeNewsCancelBtn" type="button">Abbrechen</button>
              <button className="news-btn" id="homeNewsSaveBtn" type="button">News speichern</button>
            </div>
          </div>
        </section>

        <section className="section" id="games">
          <div className="section-head">
            <h1 className="section-title">Alle Spiele</h1>
            <div className="section-pill">{gameCount} Spiele</div>
          </div>

          <div className="games-grid">
            {games.map((game) => (
              <a key={game.slug} className="game-card" href={`/games/${game.slug}/info.html`}>
                <div className={`card-thumb ${game.thumbClass}`}>
                  <div className="card-overlay">
                    <div className="play-circle" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <span className="thumb-art" aria-hidden="true">
                    {game.emoji}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`card-tag ${game.tagClass}`}>{game.category}</span>
                    <span className="card-live">
                      <span className="live-dot"></span>
                      Spielbar
                    </span>
                  </div>
                  <div className="card-title">{game.title}</div>
                  <div className="card-desc">{game.description}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <div className="logo-mark">🕹</div>
          PIXELZONE
        </div>
        <div className="footer-text">
          {gameCount} Spiele - Kostenlos - Im Browser spielbar - {year}
        </div>
      </footer>
    </>
  );
}
