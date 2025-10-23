// NSBE Internship Tracker — minimal data loader + renderer
console.log("NSBE Internship Tracker JS loaded");

const els = {
    
    newGrid:  document.getElementById("new-grid"),
    openRows: document.getElementById("open-rows"),
    closedGrid: document.getElementById("closed-grid"),
    btnRefresh: document.getElementById("btn-refresh"),
    btnTheme:   document.getElementById("btn-theme"),
    btnExport:  document.getElementById("btn-export"),
  };

  els.q      = document.getElementById("q");
  els.type   = document.getElementById("type");
  els.window = document.getElementById("window");
  
  
  let current = [];
  let previous = [];
  
  const GRACE_DAYS = 14;   // keep closed items visible this many days
  const NEW_DAYS = 7;      // or if not in prev file, mark as New
  
  // wire buttons
  els.btnRefresh?.addEventListener("click", loadData);
  els.btnExport?.addEventListener("click", exportView);
  els.btnTheme?.addEventListener("click", () => {
    document.body.dataset.theme =
      document.body.dataset.theme === "light" ? "dark" : "light";
  });

  ["input","change"].forEach(ev=>{
    els.q?.addEventListener(ev, render);
    els.type?.addEventListener(ev, render);
    els.window?.addEventListener(ev, render);
  });
  
  // --- core ---
  async function loadData() {
    try {
      [previous, current] = await Promise.all([
        fetchCsv("prev_internships.csv").catch(() => []),
        fetchCsv("internships.csv").catch(() => []),
      ]);
      computeFields();
      render();
      
      const tsEl = document.getElementById("last-updated");
      if (tsEl) tsEl.textContent = "Last updated: " + new Date().toLocaleString();

      alert("Loaded internships.csv");
    } catch (e) {
      console.error(e);
      alert("Could not load CSV files. Make sure they are next to index.html.");
    }
  }
  
  function computeFields() {
    const today = startOfDay(new Date());
    const prevIds = new Set(previous.map(r => r.id));
    current = current.map(row => {
      const d = parseDate(row.deadline);
      const daysLeft = isNaN(d) ? null : Math.floor((d - today) / 86400000);
      const closed = daysLeft !== null && daysLeft < 0;
      const withinGrace = closed && daysLeft >= -GRACE_DAYS;
      const closingSoon = !closed && daysLeft !== null && daysLeft <= 7;
      const added = parseDate(row.date_added);
      const isNewByDate = !isNaN(added) && Math.floor((today - added) / 86400000) <= NEW_DAYS;
      const isNewByPrev = !prevIds.has(row.id);
      return {
        ...row,
        _deadlineDate: d,
        _daysLeft: daysLeft,
        _closed: closed,
        _withinGrace: withinGrace,
        _closingSoon: closingSoon,
        _isNew: isNewByDate || isNewByPrev,
      };
    });
  }
  
  function render() {
    const q   = (els.q?.value || "").toLowerCase().trim();
    const t   = (els.type?.value || "");
    const win = (els.window?.value || "all");
  
    const matches = (r) => {
      const textHit = !q || [r.company, r.role, r.location, r.amount]
        .some(v => String(v||"").toLowerCase().includes(q));
      const typeHit = !t || (String(r.type||"").toLowerCase() === t.toLowerCase());
  
      let winHit = true;
      if (win === "open") winHit = !r._closed;
      else if (win === "7")  winHit = !r._closed && (r._daysLeft ?? 9999) <= 7;
      else if (win === "30") winHit = !r._closed && (r._daysLeft ?? 9999) <= 30;
      else if (win === "closed") winHit = r._closed && r._withinGrace;
  
      return textHit && typeHit && winHit;
    };
  
    // New (respect text/type filters; always treat as open)
    const newItems = current
      .filter(r => r._isNew && !r._closed)
      .filter(r => matches({...r, _closed:false}))
      .sort((a,b) => (a._daysLeft ?? 9999) - (b._daysLeft ?? 9999));
    els.newGrid.innerHTML = newItems.map(card).join("") || `<div class="meta">No new items this week.</div>`;
  
    // Open & Closing soon
    const open = current
      .filter(r => !r._closed)
      .filter(matches)
      .sort((a,b) => (a._daysLeft ?? 9999) - (b._daysLeft ?? 9999));
      if (open.length === 0) {
        els.openRows.innerHTML = `<div class="meta" style="text-align:center;">⚠️ No open internships match your search.</div>`;
      } else {
        els.openRows.innerHTML = open.map(rowLine).join("");
      }
      
  
    // Recently closed
    const closed = current
      .filter(r => r._closed && r._withinGrace)
      .filter(matches)
      .sort((a,b) => (a._deadlineDate - b._deadlineDate));
    els.closedGrid.innerHTML = closed.map(cardClosed).join("") || `<div class="meta">Nothing recently closed.</div>`;
  }
  
  // --- tiny templates ---
  function card(r) {
    const newBadge = r._isNew ? `<span class="badge new">New</span>` : "";
    const soon = r._closingSoon ? `<span class="badge soon">Closing Soon</span>` : `<span class="badge">Open</span>`;
    return `
      <div class="card">
        <div class="title">${escape(r.role)} @ ${escape(r.company)} ${newBadge} ${soon}</div>
        <div class="meta">Deadline: ${fmtDate(r._deadlineDate)} • Amount: ${escape(r.amount || "—")} • ${escape(r.location || "")}</div>
        <div style="margin-top:6px"><a href="${r.link}" target="_blank" rel="noopener">Apply / Details</a></div>
      </div>
    `;
  }
  
  function rowLine(r) {
    const status = r._closingSoon ? `<span class="badge soon">Soon</span>` : `<span class="badge">Open</span>`;
    return `
      <div class="table-row">
        <div>${escape(r.role)} @ ${escape(r.company)} — <a href="${r.link}" target="_blank">link</a></div>
        <div>${fmtDate(r._deadlineDate)}</div>
        <div>${escape(r.amount || "—")}</div>
        <div>${escape(r.type || "—")}</div>
        <div>${status}</div>
      </div>
    `;
  }
  
  function cardClosed(r) {
    return `
      <div class="card">
        <div class="title">${escape(r.role)} @ ${escape(r.company)} <span class="badge closed">Closed</span></div>
        <div class="meta">Deadline: ${fmtDate(r._deadlineDate)} • Amount: ${escape(r.amount || "—")} • ${escape(r.location || "")}</div>
        <div class="meta">Will disappear after ${GRACE_DAYS} days.</div>
      </div>
    `;
  }
  
  // --- CSV + utils ---
  async function fetchCsv(path) {
    // cache-bust so browsers always fetch the latest CSV
    const url = `${path}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${path}`);
    const text = await res.text();
    return parseCsv(text);
  }
  
  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).filter(Boolean).map(line => {
      const cells = splitCsvLine(line);
      const obj = {};
      headers.forEach((h, i) => obj[h] = (cells[i] || "").replace(/^"(.*)"$/,"$1"));
      return obj;
    });
  }
  
  function splitCsvLine(line){
    const out=[]; let cur=""; let q=false;
    for (let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"' && line[i+1]==='"'){ cur+='"'; i++; continue; }
      if(c==='"'){ q=!q; continue; }
      if(c===',' && !q){ out.push(cur); cur=""; continue; }
      cur+=c;
    }
    out.push(cur);
    return out;
  }
  
  function parseDate(s){ const d = new Date(s); return isNaN(d) ? NaN : new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function startOfDay(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function fmtDate(d){ return isNaN(d) ? "—" : d.toISOString().slice(0,10); }
  // (optional) export the current full list view
function exportView(){
    const rows = [
      ['id','company','role','link','deadline','amount','location','type','status','days_left','new_this_week'],
      ...current.map(r=>[
        r.id, r.company, r.role, r.link, fmtDate(r._deadlineDate), r.amount, r.location, r.type,
        r._closed?'Closed':(r._closingSoon?'Closing Soon':'Open'),
        r._daysLeft ?? '',
        r._isNew?'Yes':'No'
      ])
    ];
    const csv = rows.map(r=>r.map(v=>String(v??'').includes(',')?`"${String(v).replace(/"/g,'""')}"`:v).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'internships_view.csv';
    a.click();
  }  
  function escape(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }
  
  // auto-load on first open
  loadData();