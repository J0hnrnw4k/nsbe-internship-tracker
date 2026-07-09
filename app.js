// ============================================================
// NSBE UTSA Opportunity Hub — shared utils + Opportunities board
// ============================================================

window.NSBE = window.NSBE || {};

// ---------- shared CSV utils (used by app.js, alumni.js, partners.js) ----------
NSBE.fetchCsv = async function fetchCsv(path) {
  const url = `${path}?t=${Date.now()}`; // cache-bust so we always get the latest
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const text = await res.text();
  return NSBE.parseCsv(text);
};

NSBE.parseCsv = function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).filter(Boolean).map(line => {
    const cells = splitCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = (cells[i] || "").replace(/^"(.*)"$/, "$1"));
    return obj;
  });

  function splitCsvLine(line) {
    const out = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (c === '"') { q = !q; continue; }
      if (c === ',' && !q) { out.push(cur); cur = ""; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
};

NSBE.parseDate = function (s) {
  if (!s || String(s).toLowerCase() === "rolling" || String(s).toLowerCase() === "varies") return NaN;
  const d = new Date(s);
  return isNaN(d) ? NaN : new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
NSBE.startOfDay = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
NSBE.fmtDate = function (d) { return isNaN(d) ? "Rolling / Check link" : d.toISOString().slice(0, 10); };
NSBE.escape = function (s) {
  return String(s || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
};

// ---------- Opportunities board ----------
(function () {
  const els = {
    newGrid: document.getElementById("new-grid"),
    openRows: document.getElementById("open-rows"),
    closedGrid: document.getElementById("closed-grid"),
    btnRefresh: document.getElementById("btn-refresh"),
    btnExport: document.getElementById("btn-export"),
    q: document.getElementById("q"),
    category: document.getElementById("category"),
    type: document.getElementById("type"),
    window: document.getElementById("window"),
  };
  if (!els.newGrid) return; // section not on this page

  const GRACE_DAYS = 14;
  const NEW_DAYS = 7;

  let current = [];
  let previous = [];

  els.btnRefresh?.addEventListener("click", loadData);
  els.btnExport?.addEventListener("click", exportView);
  ["input", "change"].forEach(ev => {
    els.q?.addEventListener(ev, render);
    els.category?.addEventListener(ev, render);
    els.type?.addEventListener(ev, render);
    els.window?.addEventListener(ev, render);
  });

  async function loadData() {
    try {
      [previous, current] = await Promise.all([
        NSBE.fetchCsv("data/prev_opportunities.csv").catch(() => []),
        NSBE.fetchCsv("data/opportunities.csv").catch(() => []),
      ]);
      computeFields();
      render();
      const tsEl = document.getElementById("last-updated");
      if (tsEl) tsEl.textContent = "Last updated: " + new Date().toLocaleString();
    } catch (e) {
      console.error(e);
      const tsEl = document.getElementById("last-updated");
      if (tsEl) tsEl.textContent = "Could not load opportunities data.";
    }
  }

  function computeFields() {
    const today = NSBE.startOfDay(new Date());
    const prevIds = new Set(previous.map(r => r.id));
    current = current.map(row => {
      const d = NSBE.parseDate(row.deadline);
      const daysLeft = isNaN(d) ? null : Math.floor((d - today) / 86400000);
      const closed = daysLeft !== null && daysLeft < 0;
      const withinGrace = closed && daysLeft >= -GRACE_DAYS;
      const closingSoon = !closed && daysLeft !== null && daysLeft <= 7;
      const added = NSBE.parseDate(row.date_added);
      const isNewByDate = !isNaN(added) && Math.floor((today - added) / 86400000) <= NEW_DAYS;
      const isNewByPrev = !prevIds.has(row.id);
      return {
        ...row,
        _deadlineDate: d, _daysLeft: daysLeft, _closed: closed,
        _withinGrace: withinGrace, _closingSoon: closingSoon,
        _isNew: isNewByDate || isNewByPrev,
      };
    });
  }

  function render() {
    const q = (els.q?.value || "").toLowerCase().trim();
    const cat = els.category?.value || "";
    const t = els.type?.value || "";
    const win = els.window?.value || "all";

    const matches = (r) => {
      const textHit = !q || [r.company, r.role, r.location, r.amount].some(v => String(v || "").toLowerCase().includes(q));
      const catHit = !cat || r.category === cat;
      const typeHit = !t || String(r.type || "").toLowerCase() === t.toLowerCase();
      let winHit = true;
      if (win === "open") winHit = !r._closed;
      else if (win === "7") winHit = !r._closed && (r._daysLeft ?? 9999) <= 7;
      else if (win === "30") winHit = !r._closed && (r._daysLeft ?? 9999) <= 30;
      else if (win === "closed") winHit = r._closed && r._withinGrace;
      return textHit && catHit && typeHit && winHit;
    };

    const newItems = current.filter(r => r._isNew && !r._closed).filter(r => matches({ ...r, _closed: false }))
      .sort((a, b) => (a._daysLeft ?? 9999) - (b._daysLeft ?? 9999));
    els.newGrid.innerHTML = newItems.map(card).join("") || `<div class="empty">No new items this week.</div>`;

    const open = current.filter(r => !r._closed).filter(matches).sort((a, b) => (a._daysLeft ?? 9999) - (b._daysLeft ?? 9999));
    els.openRows.innerHTML = open.length
      ? open.map(rowLine).join("")
      : `<div class="empty">No open opportunities match your search.</div>`;

    const closed = current.filter(r => r._closed && r._withinGrace).filter(matches).sort((a, b) => (a._deadlineDate - b._deadlineDate));
    els.closedGrid.innerHTML = closed.map(cardClosed).join("") || `<div class="empty">Nothing recently closed.</div>`;

    NSBE.updatePulse?.(current);
  }

  function catBadge(r) { return `<span class="badge cat-${r.category}">${NSBE.escape(r.category || "Internship")}</span>`; }

  function card(r) {
    const newBadge = r._isNew ? `<span class="badge new">New</span>` : "";
    const soon = r._closingSoon ? `<span class="badge soon">Closing Soon</span>` : `<span class="badge">Open</span>`;
    return `
      <div class="card">
        <div class="title">${NSBE.escape(r.role)} @ ${NSBE.escape(r.company)} ${catBadge(r)} ${newBadge} ${soon}</div>
        <div class="meta">Deadline: ${NSBE.fmtDate(r._deadlineDate)} • Amount: ${NSBE.escape(r.amount || "—")} • ${NSBE.escape(r.location || "")}</div>
        <div style="margin-top:6px"><a href="${r.link}" target="_blank" rel="noopener">Apply / Details</a></div>
      </div>`;
  }

  function rowLine(r) {
    const status = r._closingSoon ? `<span class="badge soon">Soon</span>` : `<span class="badge">Open</span>`;
    return `
      <div class="table-row">
        <div>${catBadge(r)} ${NSBE.escape(r.role)} @ ${NSBE.escape(r.company)} — <a href="${r.link}" target="_blank">link</a></div>
        <div>${NSBE.fmtDate(r._deadlineDate)}</div>
        <div>${NSBE.escape(r.amount || "—")}</div>
        <div>${NSBE.escape(r.type || "—")}</div>
        <div>${status}</div>
      </div>`;
  }

  function cardClosed(r) {
    return `
      <div class="card">
        <div class="title">${NSBE.escape(r.role)} @ ${NSBE.escape(r.company)} ${catBadge(r)} <span class="badge closed">Closed</span></div>
        <div class="meta">Deadline: ${NSBE.fmtDate(r._deadlineDate)} • Amount: ${NSBE.escape(r.amount || "—")} • ${NSBE.escape(r.location || "")}</div>
        <div class="meta">Will disappear after ${GRACE_DAYS} days.</div>
      </div>`;
  }

  function exportView() {
    const rows = [
      ['id', 'category', 'company', 'role', 'link', 'deadline', 'amount', 'location', 'type', 'status', 'days_left', 'new_this_week'],
      ...current.map(r => [
        r.id, r.category, r.company, r.role, r.link, NSBE.fmtDate(r._deadlineDate), r.amount, r.location, r.type,
        r._closed ? 'Closed' : (r._closingSoon ? 'Closing Soon' : 'Open'),
        r._daysLeft ?? '', r._isNew ? 'Yes' : 'No'
      ])
    ];
    const csv = rows.map(r => r.map(v => String(v ?? '').includes(',') ? `"${String(v).replace(/"/g, '""')}"` : v).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'opportunities_view.csv';
    a.click();
  }

  NSBE.loadOpportunities = loadData;
  loadData();
})();
