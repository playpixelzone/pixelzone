// ══════════════════════════════════════════════════════════
//  PIXELZONE — Auth & Spielstand System
//  Einbinden: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//             <script src="auth.js"></script>
// ══════════════════════════════════════════════════════════

const PZ_URL = 'https://mgvcxszzhxrvftqnizjm.supabase.co';
const PZ_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndmN4c3p6aHhydmZ0cW5pemptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjYzMjIsImV4cCI6MjA5MDM0MjMyMn0.ccuwZQxMyuJC69i4rzFE2FyxvhcHQdAC5T9w0HhD2bg';
const PZ_ADMIN_ID = '1dcb3181-9132-4cd0-b3ef-550742a5309d';

const PZ = {
  db: null,
  isAdmin: false,

  // ── Init ────────────────────────────────────────────────
  init() {
    this.db = supabase.createClient(PZ_URL, PZ_KEY);
    return this;
  },

  // ── Helpers ─────────────────────────────────────────────
  emailFrom(username) {
    return `${username.trim().toLowerCase()}@pixelzone.gg`;
  },

  // ── Auth ────────────────────────────────────────────────

  /**
   * Neuen Account erstellen.
   * @param {string} username  3-20 Zeichen, a-z A-Z 0-9 _
   * @param {string} password  Min. 6 Zeichen
   * @returns {{ error?: string, username?: string }}
   */
  async register(username, password) {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return { error: 'Benutzername: 3–20 Zeichen, nur Buchstaben, Zahlen und _' };
    }
    if (password.length < 6) {
      return { error: 'Passwort muss mindestens 6 Zeichen haben.' };
    }

    // Extremistische und verfassungsfeindliche Namen blockieren
    const nameUpper = username.toUpperCase();
    const verboteneTerme = [
      '88', 'HH', 'HEIL', 'NAZI', 'NSDAP', 'REICH', 'FUEHRER', 'FÜHRER',
      'ARISCH', 'ARYAN', 'SIEG', 'GOERING', 'HIMMLER', 'GOEBBELS',
      'KKK', 'NOOSE', 'WEWELSBURG',
    ];
    if (verboteneTerme.some(t => nameUpper.includes(t))) {
      return { error: 'Dieser Benutzername ist nicht erlaubt.' };
    }

    const email = this.emailFrom(username);

    // Sign up
    const { data, error } = await this.db.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'Benutzername bereits vergeben.' };
      }
      return { error: error.message };
    }

    // Create profile
    const { error: profErr } = await this.db
      .from('profiles')
      .insert({ user_id: data.user.id, benutzername: username });

    if (profErr) {
      if (profErr.code === '23505') return { error: 'Benutzername bereits vergeben.' };
      return { error: 'Profil konnte nicht erstellt werden.' };
    }

    return { username };
  },

  /**
   * Einloggen.
   * @returns {{ error?: string, session?: object }}
   */
  async login(username, password) {
    const email = this.emailFrom(username);
    const { data, error } = await this.db.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Falscher Benutzername oder Passwort.' };
    return { session: data.session };
  },

  /**
   * Ausloggen.
   */
  async logout() {
    await this.db.auth.signOut();
  },

  /**
   * Aktuelle Session holen.
   * @returns {object|null}
   */
  async getSession() {
    const { data } = await this.db.auth.getSession();
    return data?.session || null;
  },

  /**
   * Eingeloggten User holen.
   * @returns {object|null}
   */
  async getUser() {
    const session = await this.getSession();
    return session?.user || null;
  },

  /**
   * Benutzername aus Profil laden.
   * @param {string} userId
   * @returns {string|null}
   */
  async getUsername(userId) {
    const { data } = await this.db
      .from('profiles')
      .select('benutzername')
      .eq('user_id', userId)
      .single();
    return data?.benutzername || null;
  },

  /**
   * Schnell: Benutzername des aktuellen Users.
   * @returns {string|null}
   */
  async currentUsername() {
    const user = await this.getUser();
    if (!user) return null;
    return this.getUsername(user.id);
  },

  // ── Spielstände ─────────────────────────────────────────

  /**
   * Spielstand + alle Spieldaten speichern.
   * Highscore (punkte) wird nur aktualisiert wenn der neue Wert HÖHER ist.
   * extra_daten (Coins, Skins, Upgrades usw.) wird IMMER gespeichert.
   * @param {string} spielName  z.B. 'space-blaster', 'blockfall'
   * @param {number} punkte     Punktzahl dieser Runde
   * @param {number} level      Level dieser Runde
   * @param {object} extraDaten Coins, Skins, Upgrades etc. als JSON
   * @returns {{ error?: string, isNewRecord?: boolean }}
   */
  async saveGameData(spielName, punkte, level = 1, extraDaten = {}) {
    const user = await this.getUser();
    if (!user) return { error: 'Nicht eingeloggt.' };

    const existing = await this.loadScore(spielName);
    const isNewRecord = !existing || punkte > (existing.punkte || 0);

    // Highscore nur anheben, nie senken
    const finalPunkte = isNewRecord ? punkte : (existing?.punkte || 0);
    const finalLevel  = isNewRecord ? level  : (existing?.level  || level);

    const { error } = await this.db
      .from('spielstaende')
      .upsert(
        {
          user_id:     user.id,
          spiel_name:  spielName,
          punkte:      finalPunkte,
          level:       finalLevel,
          extra_daten: extraDaten,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'user_id,spiel_name' }
      );

    return { error: error?.message, isNewRecord };
  },

  /**
   * Spielstand speichern (Upsert — überschreibt nur wenn punkte HÖHER).
   * @deprecated Bitte saveGameData() verwenden.
   */
  async saveScore(spielName, punkte, level = 1, extraDaten = {}) {
    return this.saveGameData(spielName, punkte, level, extraDaten);
  },

  /**
   * Eigenen Spielstand laden.
   * @param {string} spielName
   * @returns {object|null}
   */
  async loadScore(spielName) {
    const user = await this.getUser();
    if (!user) return null;

    const { data } = await this.db
      .from('spielstaende')
      .select('*')
      .eq('user_id', user.id)
      .eq('spiel_name', spielName)
      .single();

    return data || null;
  },

  /**
   * Rangliste für ein Spiel (Top 10).
   * @param {string} spielName
   * @param {number} limit
   * @returns {Array}
   */
  async getLeaderboard(spielName, limit = 10) {
    const { data } = await this.db.rpc('get_leaderboard', {
      p_spiel: spielName,
      p_limit: limit,
    });
    return data || [];
  },

  // ── Navbar Integration ───────────────────────────────────

  // Gibt '../../' zurück wenn wir uns in games/SPIELNAME/ befinden, sonst ''
  _basePath() {
    return window.location.pathname.includes('/games/') ? '../../' : '';
  },

  /**
   * Navbar-Auth-Bereich aktualisieren.
   * Erwartet ein Element mit id="navAuth" in der Seite.
   */
  async updateNavbar() {
    const el = document.getElementById('navAuth');
    if (!el) return;

    const session = await this.getSession();

    if (session) {
      const username = await this.getUsername(session.user.id);
      this.isAdmin = session.user.id === PZ_ADMIN_ID;
      const adminBtn = this.isAdmin
        ? `<button class="nav-admin-btn" id="pzAdminBtn">⚙ Admin</button>`
        : '';
      el.innerHTML = `
        <div class="nav-user">
          ${adminBtn}
          <span class="nav-avatar">👾</span>
          <span class="nav-username">${this._esc(username || 'Spieler')}</span>
          <button class="nav-logout-btn" id="pzLogoutBtn">Abmelden</button>
        </div>`;
      document.getElementById('pzLogoutBtn').addEventListener('click', () => this._logoutFlow());
      if (this.isAdmin) {
        document.getElementById('pzAdminBtn').addEventListener('click', () => this._adminModalOeffnen());
      }
    } else {
      this.isAdmin = false;
      const back = encodeURIComponent(window.location.href);
      el.innerHTML = `<a href="${this._basePath()}login.html?back=${back}" class="nav-login-btn">Anmelden</a>`;
    }
  },

  _adminModalOeffnen() {
    let overlay = document.getElementById('pzAdminOverlay');
    if (!overlay) {
      const inGame = window.location.pathname.includes('/games/');
      const base = inGame ? '../../' : '';
      overlay = document.createElement('div');
      overlay.id = 'pzAdminOverlay';
      overlay.innerHTML = `
        <div class="pz-admin-modal">
          <h2>⚙ Admin-Panel</h2>
          <p class="pz-admin-hint">Spiel im Test-Modus öffnen (kein echtes Speichern):</p>
          <div class="pz-admin-games">
            <a href="${base}games/pixel-factory/?admin=1" class="pz-admin-btn">🏭 Pixel Factory</a>
            <a href="${base}games/pixel-jump/?admin=1" class="pz-admin-btn">🐸 Pixel Jump</a>
            <a href="${base}games/space-blaster/?admin=1" class="pz-admin-btn">🚀 Space Blaster</a>
            <a href="${base}games/minesweeper/?admin=1" class="pz-admin-btn">💣 Minesweeper</a>
            <a href="${base}games/wordle/?admin=1" class="pz-admin-btn">📝 Wordle</a>
            <a href="${base}games/memory-match/?admin=1" class="pz-admin-btn">🃏 Memory Match</a>
            <a href="${base}games/pixel-drop/?admin=1" class="pz-admin-btn">⬇ Pixel Drop</a>
          </div>
          <button class="pz-admin-schliessen" id="pzAdminSchliessen">Schließen</button>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('pzAdminSchliessen').addEventListener('click', () => { overlay.style.display = 'none'; });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });
      // CSS einmalig injizieren
      if (!document.getElementById('pzAdminCss')) {
        const s = document.createElement('style');
        s.id = 'pzAdminCss';
        s.textContent = `
          #pzAdminOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;}
          .pz-admin-modal{background:#fff;border-radius:16px;padding:28px 24px;max-width:440px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.2);}
          .pz-admin-modal h2{margin:0 0 6px;font-size:1.25rem;}
          .pz-admin-hint{margin:0 0 16px;font-size:.85rem;color:#64748b;}
          .pz-admin-games{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;}
          .pz-admin-btn{display:block;padding:10px 12px;background:#f0f7ff;border:1.5px solid #bfdbfe;border-radius:10px;text-decoration:none;color:#1e293b;font-size:.9rem;font-weight:600;text-align:center;transition:background .15s;}
          .pz-admin-btn:hover{background:#dbeafe;}
          .pz-admin-schliessen{width:100%;padding:10px;border:none;border-radius:10px;background:#e2e8f0;color:#1e293b;font-size:.95rem;font-weight:700;cursor:pointer;}
          .pz-admin-schliessen:hover{background:#cbd5e1;}
          .nav-admin-btn{background:#fef3c7;border:1.5px solid #fbbf24;color:#92400e;padding:5px 12px;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;margin-right:6px;}
          .nav-admin-btn:hover{background:#fde68a;}`;
        document.head.appendChild(s);
      }
    }
    overlay.style.display = 'flex';
  },

  async _logoutFlow() {
    await this.logout();
    window.location.href = this._basePath() + 'index.html';
  },

  _esc(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  },

  /**
   * Admin-Panel für Spiele erstellen (nur für den Site-Admin im Test-Modus).
   * Gibt true zurück wenn Admin-Modus aktiv ist, sonst false.
   * @param {Array<{label:string, onClick:function}>} controls  Spiel-spezifische Buttons
   * @returns {Promise<boolean>}
   */
  async adminPanelErstellen(controls = []) {
    const user = await this.getUser().catch(() => null);
    if (!user || user.id !== PZ_ADMIN_ID) return false;
    if (!new URLSearchParams(location.search).has('admin')) return false;

    // CSS einmalig einbinden
    if (!document.getElementById('pzAdmCss')) {
      const s = document.createElement('style');
      s.id = 'pzAdmCss';
      s.textContent = `
        #pzAdminPanel{position:fixed;bottom:16px;right:16px;background:#1e293b;border:2px solid #f59e0b;border-radius:12px;z-index:9999;min-width:190px;font-family:system-ui,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.5);}
        .pz-adm-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #334155;color:#fbbf24;font-size:.82rem;font-weight:800;gap:8px;}
        .pz-adm-badge{background:#f59e0b;color:#1e293b;font-size:.68rem;padding:1px 7px;border-radius:20px;font-weight:900;}
        .pz-adm-toggle{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:.95rem;line-height:1;padding:0;}
        .pz-adm-body{padding:8px 10px;display:flex;flex-direction:column;gap:5px;}
        .pz-adm-btn{background:#334155;color:#e2e8f0;border:none;border-radius:7px;padding:7px 10px;font-size:.8rem;cursor:pointer;text-align:left;font-weight:600;width:100%;}
        .pz-adm-btn:hover{background:#475569;}
        .pz-adm-info{color:#64748b;font-size:.75rem;padding:2px 2px 4px;}`;
      document.head.appendChild(s);
    }

    // Panel erstellen
    const panel = document.createElement('div');
    panel.id = 'pzAdminPanel';
    const btns = controls.map((c, i) =>
      `<button class="pz-adm-btn" data-idx="${i}">${c.label}</button>`).join('');
    panel.innerHTML = `
      <div class="pz-adm-header">
        <span>⚙ Test-Modus</span>
        <span class="pz-adm-badge">ADMIN</span>
        <button class="pz-adm-toggle" id="pzAdmToggle">▾</button>
      </div>
      <div class="pz-adm-body" id="pzAdmBody">
        <div class="pz-adm-info">Kein Speichern aktiv</div>
        ${btns}
      </div>`;
    document.body.appendChild(panel);

    document.getElementById('pzAdmToggle').addEventListener('click', () => {
      const body = document.getElementById('pzAdmBody');
      const tog = document.getElementById('pzAdmToggle');
      body.style.display = body.style.display === 'none' ? '' : 'none';
      tog.textContent = body.style.display === 'none' ? '▸' : '▾';
    });
    controls.forEach((c, i) => {
      panel.querySelector(`[data-idx="${i}"]`).addEventListener('click', c.onClick);
    });

    return true;
  },

  /**
   * Prüft ob ein Spiel aktiv ist. Zeigt sofort einen Lade-Overlay;
   * bei aktivem Spiel wird er entfernt, bei deaktiviertem bleibt er sichtbar.
   * Aufruf in index.html: <script>PZ.pruefeSpielStatus('pixel-jump');</script>
   * @param {string} gameId  z.B. 'pixel-jump', 'space-blaster'
   */
  async pruefeSpielStatus(gameId) {
    // CSS einmalig injizieren
    if (!document.getElementById('pzStatusCss')) {
      const s = document.createElement('style');
      s.id = 'pzStatusCss';
      s.textContent = `
        @keyframes pz-overlay-in { from { opacity:0 } to { opacity:1 } }
        @keyframes pz-spin { to { transform:rotate(360deg) } }
        #pz-game-overlay { animation: pz-overlay-in .18s ease; }
      `;
      document.head.appendChild(s);
    }

    // Overlay sofort einblenden (Lade-Zustand)
    const overlay = document.createElement('div');
    overlay.id = 'pz-game-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'background:#f0f7ff', 'display:flex',
      'align-items:center', 'justify-content:center',
    ].join(';');
    overlay.innerHTML = `
      <div style="text-align:center;font-family:'Nunito',sans-serif;color:#aaa;">
        <div style="width:32px;height:32px;border:3px solid #d1d5db;border-top-color:#3a86ff;
                    border-radius:50%;animation:pz-spin .7s linear infinite;margin:0 auto 12px;"></div>
        <div style="font-size:.9rem;font-weight:700;">Wird geladen…</div>
      </div>`;
    document.body.appendChild(overlay);

    try {
      const { data, error } = await this.db
        .from('games')
        .select('is_active, disabled_message')
        .eq('id', gameId)
        .single();

      if (!error && data && !data.is_active) {
        // Spiel deaktiviert — Nachricht anzeigen
        const msg  = this._esc(data.disabled_message || 'Dieses Spiel ist vorübergehend nicht verfügbar.');
        const base = this._basePath();
        overlay.innerHTML = `
          <div style="text-align:center;max-width:440px;padding:2.5rem 1.5rem;
                      font-family:'Nunito',sans-serif;">
            <div style="font-size:3.5rem;margin-bottom:1rem;">🚧</div>
            <h2 style="font-size:1.45rem;font-weight:900;color:#1a1a2e;margin-bottom:.7rem;">
              Vorübergehend nicht verfügbar
            </h2>
            <p style="font-size:.95rem;color:#555;line-height:1.65;
                      font-weight:600;margin-bottom:1.75rem;">${msg}</p>
            <a href="${base}index.html"
               style="display:inline-block;padding:.75rem 2rem;background:#3a86ff;
                      color:#fff;border-radius:12px;text-decoration:none;
                      font-weight:800;font-size:.95rem;">
              ← Zurück zur Übersicht
            </a>
          </div>`;
      } else {
        // Spiel aktiv — Overlay entfernen, Spiel startet normal
        overlay.remove();
      }
    } catch (e) {
      // Netzwerkfehler: Spiel trotzdem starten
      overlay.remove();
    }
  },

  /**
   * Weiterleitung zu login.html wenn nicht eingeloggt.
   * In geschützten Seiten aufrufen.
   */
  async requireAuth(redirectTo = 'login.html') {
    const session = await this.getSession();
    if (!session) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },
};

// Auto-Init
(function () {
  if (typeof supabase !== 'undefined') {
    PZ.init();
  } else {
    console.error('[PIXELZONE] Supabase JS nicht geladen. Bitte CDN-Script vor auth.js einbinden.');
  }
})();
