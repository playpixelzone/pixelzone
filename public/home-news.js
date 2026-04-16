(function () {
  const NEWS_ROW_ID = 1;
  let currentUser = null;
  let currentNews = null;

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]
    ));
  }

  /** Sichere Anzeige: HTML escapen, **fett** → <strong>, Zeilenumbrüche erhalten */
  function formatNewsBodyHtml(raw) {
    let s = esc(raw);
    // Fettdruck: **Wort** oder **mehrere Wörter** (kein * innerhalb des fett-Bereichs)
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  }

  function parseOptions(raw) {
    const lines = String(raw || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 8);
    return lines;
  }

  async function loadPollVotes(newsId) {
    const { data, error } = await PZ.db
      .from("site_home_news_votes")
      .select("user_id, option_index")
      .eq("news_id", newsId);
    if (error) throw error;
    return data || [];
  }

  async function upsertVote(newsId, optionIndex, userId) {
    const payload = {
      news_id: newsId,
      user_id: userId,
      option_index: optionIndex,
      updated_at: new Date().toISOString()
    };
    const { error } = await PZ.db
      .from("site_home_news_votes")
      .upsert(payload, { onConflict: "news_id,user_id" });
    if (error) throw error;
  }

  async function loadNews() {
    const { data, error } = await PZ.db
      .from("site_home_news")
      .select("*")
      .eq("id", NEWS_ROW_ID)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return {
        id: NEWS_ROW_ID,
        kind: "news",
        title: "PIXELZONE News",
        body: "Noch keine News vorhanden.",
        poll_question: "",
        poll_options: [],
        updated_at: null
      };
    }
    return data;
  }

  function renderNews(data, votes = []) {
    const badge = document.getElementById("homeNewsBadge");
    const title = document.getElementById("homeNewsTitle");
    const body = document.getElementById("homeNewsBody");
    const meta = document.getElementById("homeNewsMeta");
    const poll = document.getElementById("homeNewsPoll");
    const pollQ = document.getElementById("homeNewsPollQuestion");
    const pollOps = document.getElementById("homeNewsPollOptions");

    badge.textContent = data.kind === "poll" ? "Abstimmung" : "News";
    title.textContent = data.title || "PIXELZONE News";
    body.innerHTML = formatNewsBodyHtml(data.body || "");
    meta.textContent = data.updated_at ? `Zuletzt aktualisiert: ${fmtDate(data.updated_at)}` : "";

    const isPoll = data.kind === "poll";
    poll.classList.toggle("hidden", !isPoll);
    if (isPoll) {
      pollQ.textContent = data.poll_question || "Abstimmung";
      const options = Array.isArray(data.poll_options) ? data.poll_options : [];
      const counts = options.map((_, idx) => votes.filter((v) => v.option_index === idx).length);
      const totalVotes = counts.reduce((a, b) => a + b, 0);
      const myVote = currentUser ? votes.find((v) => v.user_id === currentUser.id) : null;

      pollOps.innerHTML = options.map((opt, idx) => {
        const count = counts[idx] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const mineClass = myVote && myVote.option_index === idx ? "mine" : "";
        const votedClass = currentUser ? "" : "login-required";
        return `
          <li class="news-poll-item ${mineClass}">
            <button class="news-poll-option ${votedClass}" data-poll-option="${idx}" ${currentUser ? "" : "disabled"}>
              <span class="news-poll-label">${esc(opt)}</span>
              <span class="news-poll-stats">${count} · ${pct}%</span>
            </button>
            <div class="news-poll-bar"><div style="width:${pct}%"></div></div>
          </li>
        `;
      }).join("");

      const hint = currentUser
        ? (myVote ? "Deine Stimme ist markiert. Du kannst sie ändern." : "Wähle eine Option und stimme ab.")
        : "Zum Abstimmen bitte einloggen.";
      meta.textContent = `${meta.textContent ? `${meta.textContent} · ` : ""}${totalVotes} Stimmen · ${hint}`;

      pollOps.querySelectorAll("[data-poll-option]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!currentUser || !currentNews) return;
          try {
            btn.disabled = true;
            await upsertVote(currentNews.id, Number(btn.dataset.pollOption), currentUser.id);
            const refreshedVotes = await loadPollVotes(currentNews.id);
            renderNews(currentNews, refreshedVotes);
          } catch (err) {
            alert(`Abstimmen fehlgeschlagen: ${err.message || err}`);
          } finally {
            btn.disabled = false;
          }
        });
      });
    } else {
      pollOps.innerHTML = "";
    }
  }

  function fillEditor(data) {
    document.getElementById("homeNewsKind").value = data.kind || "news";
    document.getElementById("homeNewsTitleInput").value = data.title || "";
    document.getElementById("homeNewsBodyInput").value = data.body || "";
    document.getElementById("homeNewsPollQuestionInput").value = data.poll_question || "";
    const options = Array.isArray(data.poll_options) ? data.poll_options.join("\n") : "";
    document.getElementById("homeNewsPollOptionsInput").value = options;
    togglePollInputs();
  }

  function togglePollInputs() {
    const isPoll = document.getElementById("homeNewsKind").value === "poll";
    document.getElementById("homeNewsPollFields").classList.toggle("hidden", !isPoll);
  }

  async function init() {
    await PZ.updateNavbar();
    const user = await PZ.getUser();
    currentUser = user;
    const isAdmin = !!user && user.id === PZ_ADMIN_ID;
    const editBtn = document.getElementById("homeNewsEditBtn");
    const panel = document.getElementById("homeNewsEditor");
    const saveBtn = document.getElementById("homeNewsSaveBtn");
    const cancelBtn = document.getElementById("homeNewsCancelBtn");
    const info = document.getElementById("homeNewsEditorInfo");

    const current = await loadNews();
    currentNews = current;
    const votes = current.kind === "poll" ? await loadPollVotes(current.id) : [];
    renderNews(current, votes);
    fillEditor(current);

    if (!isAdmin) {
      editBtn.classList.add("hidden");
      panel.classList.add("hidden");
      info.textContent = "";
      return;
    }

    editBtn.classList.remove("hidden");
    info.textContent = "Nur dein Admin-Account kann diesen Bereich bearbeiten.";

    document.getElementById("homeNewsKind").addEventListener("change", togglePollInputs);
    editBtn.addEventListener("click", () => panel.classList.toggle("hidden"));
    cancelBtn.addEventListener("click", () => {
      fillEditor(current);
      panel.classList.add("hidden");
    });

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Speichern...";
      try {
        const payload = {
          id: NEWS_ROW_ID,
          kind: document.getElementById("homeNewsKind").value,
          title: document.getElementById("homeNewsTitleInput").value.trim().slice(0, 120) || "PIXELZONE News",
          // Nur Enden trimmen — Zeilenumbrüche in der Mitte bleiben erhalten
          body: document.getElementById("homeNewsBodyInput").value.replace(/^\s+|\s+$/g, "").slice(0, 2500),
          poll_question: document.getElementById("homeNewsPollQuestionInput").value.trim().slice(0, 200),
          poll_options: parseOptions(document.getElementById("homeNewsPollOptionsInput").value),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        };

        const { error } = await PZ.db.from("site_home_news").upsert(payload, { onConflict: "id" });
        if (error) throw error;

        const refreshed = await loadNews();
        currentNews = refreshed;
        const refreshedVotes = refreshed.kind === "poll" ? await loadPollVotes(refreshed.id) : [];
        renderNews(refreshed, refreshedVotes);
        fillEditor(refreshed);
        panel.classList.add("hidden");
      } catch (err) {
        alert(`Speichern fehlgeschlagen: ${err.message || err}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "News speichern";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      const body = document.getElementById("homeNewsBody");
      if (body) body.textContent = `News konnten nicht geladen werden: ${err.message || err}`;
    });
  });
})();
