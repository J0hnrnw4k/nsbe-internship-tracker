// ============================================================
// NSBE UTSA Opportunity Hub — Network directory
// Reads data/partners.csv (e-board maintained). Add a row per
// alum, recruiter, faculty member, or corporate partner willing
// to be a point of contact for members.
// ============================================================

(function () {
  const rowsEl = document.getElementById("network-rows");
  if (!rowsEl) return;
  const filterEl = document.getElementById("network-filter");

  let all = [];

  async function load() {
    try {
      all = (await NSBE.fetchCsv("data/partners.csv")).filter(r => r.id !== "example-entry");
      render();
    } catch (e) {
      console.error(e);
      rowsEl.innerHTML = `<div class="empty">Couldn't load the network directory.</div>`;
    }
  }

  function render() {
    const f = filterEl?.value || "";
    const rows = all.filter(r => !f || r.connection_type === f);
    rowsEl.innerHTML = rows.length ? rows.map(rowHtml).join("")
      : `<div class="empty">No connections listed yet. Add a row to data/partners.csv — see the README.</div>`;
  }

  function rowHtml(r) {
    return `
      <div class="partner-row">
        <div><strong>${NSBE.escape(r.name)}</strong></div>
        <div><span class="badge">${NSBE.escape(r.connection_type)}</span></div>
        <div>${NSBE.escape(r.company || "—")}</div>
        <div>${NSBE.escape(r.role || "—")}</div>
        <div>${r.how_to_connect ? `<a href="${NSBE.escape(r.how_to_connect)}" target="_blank" rel="noopener">Connect</a>` : "—"}</div>
      </div>`;
  }

  filterEl?.addEventListener("change", render);
  load();
})();
