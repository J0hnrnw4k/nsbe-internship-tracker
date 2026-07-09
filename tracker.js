// ============================================================
// NSBE UTSA Opportunity Hub — shared application tracker
// No login: anyone with the link can add/update entries.
// Backed by Firestore if firebase-config.js is filled in,
// otherwise falls back to this browser's localStorage (demo mode).
// ============================================================

(function () {
  const board = document.getElementById("kanban-board");
  if (!board) return; // tracker not on this page

  const STATUSES = ["Interested", "Applied", "Interviewing", "Offer", "Rejected"];
  const LOCAL_KEY = "nsbe_tracker_demo_v1";
  let entries = [];
  let db = null;
  let useFirestore = false;

  const banner = document.getElementById("tracker-banner");

  function initBackend() {
    if (window.FIREBASE_READY && window.firebase) {
      try {
        firebase.initializeApp(window.FIREBASE_CONFIG);
        db = firebase.firestore();
        useFirestore = true;
        db.collection("applications").orderBy("createdAt", "desc")
          .onSnapshot(
            snap => {
              entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
              render();
            },
            err => {
              console.error("Firestore error", err);
              showBanner("Couldn't reach the shared database. Check Firestore security rules — see README.");
            }
          );
        return;
      } catch (e) {
        console.error("Firebase init failed", e);
      }
    }
    // fallback: localStorage, this browser only
    useFirestore = false;
    showBanner('Demo mode — entries are only saved in this browser. Add your Firebase config (see README) to make the tracker shared across all members.');
    entries = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    render();
  }

  function showBanner(msg) {
    if (banner) banner.innerHTML = `<div class="banner"><i class="fa fa-triangle-exclamation"></i> ${NSBE.escape(msg)}</div>`;
  }

  function saveLocal() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  }

  async function addEntry({ name, company, role, link, status }) {
    const entry = {
      name: name || "Anonymous", company, role, link: link || "",
      status: status || "Applied",
      createdAt: useFirestore ? firebase.firestore.FieldValue.serverTimestamp() : Date.now(),
    };
    if (useFirestore) {
      await db.collection("applications").add(entry);
    } else {
      entries.unshift({ id: "local-" + Date.now(), ...entry, createdAt: Date.now() });
      saveLocal();
      render();
    }
  }

  async function updateStatus(id, status) {
    if (useFirestore) {
      await db.collection("applications").doc(id).update({ status });
    } else {
      const e = entries.find(x => x.id === id);
      if (e) { e.status = status; saveLocal(); render(); }
    }
  }

  async function removeEntry(id) {
    if (useFirestore) {
      await db.collection("applications").doc(id).delete();
    } else {
      entries = entries.filter(x => x.id !== id);
      saveLocal();
      render();
    }
  }

  function render() {
    board.innerHTML = STATUSES.map(status => {
      const items = entries.filter(e => e.status === status);
      return `
        <div class="kanban-col">
          <h3><span>${status}</span><span>${items.length}</span></h3>
          ${items.map(cardHtml).join("") || `<div class="empty" style="padding:14px 8px;">Nothing here yet</div>`}
        </div>`;
    }).join("");

    board.querySelectorAll("[data-status-select]").forEach(sel => {
      sel.addEventListener("change", (e) => updateStatus(sel.dataset.statusSelect, e.target.value));
    });
    board.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => removeEntry(btn.dataset.remove));
    });

    NSBE.updatePulseTracker?.(entries);
  }

  function cardHtml(e) {
    const linkHtml = e.link ? `<div><a href="${NSBE.escape(e.link)}" target="_blank" rel="noopener">link</a></div>` : "";
    return `
      <div class="kanban-card">
        <div><strong>${NSBE.escape(e.company)}</strong></div>
        <div>${NSBE.escape(e.role)}</div>
        ${linkHtml}
        <div class="who"><i class="fa fa-user"></i> ${NSBE.escape(e.name)}</div>
        <select data-status-select="${e.id}">
          ${STATUSES.map(s => `<option ${s === e.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <div class="row-actions">
          <button data-remove="${e.id}"><i class="fa fa-trash"></i> Remove</button>
        </div>
      </div>`;
  }

  NSBE.addTrackerEntry = addEntry;
  initBackend();
})();
