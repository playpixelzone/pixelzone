(function () {
  const NEWS_ROW_ID = 1;

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]
    ));
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

  function renderNews(data) {
    const badge = document.getElementById("homeNewsBadge");
    const title = document.getElementById("homeNewsTitle");
    const body = document.getElementById("homeNewsBody");
    const meta = document.getElementById("homeNewsMeta");
    const poll = document.getElementById("homeNewsPoll");
    const pollQ = document.getElementById("homeNewsPollQuestion");
    const pollOps = document.getElementById("homeNewsPollOptions");

    badge.textContent = data.kind === "poll" ? "Abstimmung" : "News";
    title.textContent = data.title || "PIXELZONE News";
    body.textContent = data.body || "";
    meta.textContent = data.updated_at ? `Zuletzt aktualisiert: ${fmtDate(data.updated_at)}` : "";

    const isPoll = data.kind === "poll";
    poll.classList.toggle("hidden", !isPoll);
    if (isPoll) {
      pollQ.textContent = data.poll_question || "Abstimmung";
      const options = Array.isArray(data.poll_options) ? data.poll_options : [];
      pollOps.innerHTML = options.map((opt) => `<li>${esc(opt)}</li>`).join("");
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
    const isAdmin = !!user && user.id === PZ_ADMIN_ID;
    const editBtn = document.getElementById("homeNewsEditBtn");
    const panel = document.getElementById("homeNewsEditor");
    const saveBtn = document.getElementById("homeNewsSaveBtn");
    const cancelBtn = document.getElementById("homeNewsCancelBtn");
    const info = document.getElementById("homeNewsEditorInfo");

    const current = await loadNews();
    renderNews(current);
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
          body: document.getElementById("homeNewsBodyInput").value.trim().slice(0, 2500),
          poll_question: document.getElementById("homeNewsPollQuestionInput").value.trim().slice(0, 200),
          poll_options: parseOptions(document.getElementById("homeNewsPollOptionsInput").value),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        };

        const { error } = await PZ.db.from("site_home_news").upsert(payload, { onConflict: "id" });
        if (error) throw error;

        const refreshed = await loadNews();
        renderNews(refreshed);
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
