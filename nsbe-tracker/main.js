// ============================================================
// NSBE UTSA Opportunity Hub — tabs, theme, pulse strip, modal
// ============================================================

(function () {
  // ---------- tabs ----------
  const tabBtns = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".page-section");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = "section-" + btn.dataset.tab;
      sections.forEach(s => s.classList.toggle("active", s.id === target));
    });
  });

  // ---------- theme ----------
  document.getElementById("btn-theme")?.addEventListener("click", () => {
    document.body.dataset.theme = document.body.dataset.theme === "light" ? "dark" : "light";
  });

  // ---------- pulse strip ----------
  NSBE.updatePulse = function (opportunities) {
    const open = opportunities.filter(r => !r._closed).length;
    const newCount = opportunities.filter(r => r._isNew && !r._closed).length;
    setText("pulse-open", open);
    setText("pulse-new", newCount);
  };
  NSBE.updatePulseTracker = function (entries) {
    setText("pulse-applied", entries.length);
    setText("pulse-offers", entries.filter(e => e.status === "Offer").length);
  };
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ---------- log application modal ----------
  const overlay = document.getElementById("modal-overlay");
  const openBtn = document.getElementById("btn-add-application");
  const cancelBtn = document.getElementById("modal-cancel");
  const saveBtn = document.getElementById("modal-save");

  function openModal() {
    overlay.classList.add("open");
    document.getElementById("f-company").focus();
  }
  function closeModal() {
    overlay.classList.remove("open");
    ["f-company", "f-role", "f-link"].forEach(id => document.getElementById(id).value = "");
  }

  openBtn?.addEventListener("click", () => {
    // remember the person's name across sessions in this browser only
    const savedName = localStorage.getItem("nsbe_member_name") || "";
    document.getElementById("f-name").value = savedName;
    openModal();
  });
  cancelBtn?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

  saveBtn?.addEventListener("click", async () => {
    const name = document.getElementById("f-name").value.trim();
    const company = document.getElementById("f-company").value.trim();
    const role = document.getElementById("f-role").value.trim();
    const link = document.getElementById("f-link").value.trim();
    const status = document.getElementById("f-status").value;
    if (!company || !role) {
      alert("Company and role are required.");
      return;
    }
    localStorage.setItem("nsbe_member_name", name);
    await NSBE.addTrackerEntry({ name, company, role, link, status });
    closeModal();
  });
})();
