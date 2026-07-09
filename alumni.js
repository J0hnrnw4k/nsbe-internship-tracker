// ============================================================
// NSBE UTSA Opportunity Hub — Wall of Success
// Reads data/alumni_success.csv (e-board maintained, like the
// opportunities list). Add a row per alum you want to feature.
// ============================================================

(function () {
  const grid = document.getElementById("alumni-grid");
  if (!grid) return;

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  }

  async function load() {
    try {
      const rows = await NSBE.fetchCsv("data/alumni_success.csv");
      render(rows.filter(r => r.id !== "example-entry"));
    } catch (e) {
      console.error(e);
      grid.innerHTML = `<div class="empty">Couldn't load the Wall of Success.</div>`;
    }
  }

  function render(rows) {
    if (!rows.length) {
      grid.innerHTML = `<div class="empty">No alumni featured yet. Add a row to data/alumni_success.csv to get started — see the README.</div>`;
      return;
    }
    grid.innerHTML = rows.map(r => `
      <div class="alumni-card">
        <div class="alumni-avatar">${NSBE.escape(initials(r.name))}</div>
        <div class="alumni-name">${NSBE.escape(r.name)}</div>
        <div class="alumni-role">${NSBE.escape(r.role)} @ ${NSBE.escape(r.company)}</div>
        <div class="alumni-meta">${NSBE.escape(r.major || "")}${r.major && r.grad_year ? " • " : ""}${r.grad_year ? "Class of " + NSBE.escape(r.grad_year) : ""}</div>
        ${r.quote ? `<div class="alumni-quote">${NSBE.escape(r.quote)}</div>` : ""}
        ${r.linkedin ? `<div style="margin-top:10px;"><a href="${NSBE.escape(r.linkedin)}" target="_blank" rel="noopener"><i class="fa-brands fa-linkedin"></i> Connect</a></div>` : ""}
      </div>
    `).join("");
  }

  load();
})();
