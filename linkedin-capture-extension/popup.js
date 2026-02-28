// popup.js

(function () {
  let captureMode = false;
  let captureContext = null;
  let allProfiles = [];
  let activeFilter = "all";
  let rescoring = false;

  function activateTab(tabName) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    const pane = document.getElementById(`tab-${tabName}`);
    if (!tab || !pane) return;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".pane").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    pane.classList.add("active");
    if (tabName === "saved") loadProfiles();
    if (tabName === "search") loadSearchPack();
  }

  // ── Tab switching ──────────────────────────────────────────────────
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.tab);
    });
  });

  // ── Load state ─────────────────────────────────────────────────────
  function loadState() {
    chrome.runtime.sendMessage({ type: "GET_CAPTURE_MODE" }, (res) => {
      captureMode = res?.captureMode || false;
      captureContext = res?.captureContext || null;
      updateModeUI();
    });
    chrome.runtime.sendMessage({ type: "GET_SAVED_PROFILES" }, (profiles) => {
      allProfiles = profiles || [];
      updateStats();
    });

    chrome.storage.local.get(["popupOpenTab"], (res) => {
      const targetTab = res?.popupOpenTab;
      if (targetTab === "saved" || targetTab === "search" || targetTab === "capture") {
        activateTab(targetTab);
      }
      if (targetTab) chrome.storage.local.remove(["popupOpenTab"]);
    });
  }

  function updateStats() {
    document.getElementById("stat-saved").textContent = allProfiles.length;
    const searches = new Set(allProfiles.map(p => p.captureContext?.searchUrl).filter(Boolean)).size;
    document.getElementById("stat-searches").textContent = searches;
  }

  // ── Mode UI ────────────────────────────────────────────────────────
  function updateModeUI() {
    // Header dot
    const hdrDot = document.getElementById("hdr-dot");
    const hdrText = document.getElementById("hdr-mode-text");
    hdrDot.className = `hdr-dot${captureMode ? " on" : ""}`;
    hdrText.textContent = captureMode ? "ON" : "OFF";

    // Main dot
    const dot = document.getElementById("mode-dot");
    dot.className = `mode-dot${captureMode ? " active" : ""}`;
    document.getElementById("mode-status-text").textContent = `Capture Mode: ${captureMode ? "ON" : "OFF"}`;

    // Context
    const ctxArea = document.getElementById("mode-context-area");
    if (captureMode && captureContext) {
      ctxArea.innerHTML = `
        <div class="mode-ctx" style="margin-bottom:10px;">
          <div class="mode-ctx-label">Active Context</div>
          <div class="mode-ctx-val">${esc(captureContext.keywords || "LinkedIn Search")}${captureContext.projectTitle ? ` · <em>${esc(captureContext.projectTitle)}</em>` : ""}</div>
        </div>
      `;
    } else {
      ctxArea.innerHTML = "";
    }

    // Toggle button
    const btn = document.getElementById("main-toggle-btn");
    if (captureMode) {
      btn.className = "btn";
      btn.style.cssText = "background:rgba(255,80,80,0.1);color:#ff8080;border:1px solid rgba(255,80,80,0.2);width:100%;justify-content:center;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;border-radius:8px;cursor:pointer;padding:9px 14px;display:inline-flex;align-items:center;gap:5px;transition:all 0.15s;";
      btn.textContent = "⏹ Stop Capture Mode";
    } else {
      btn.className = "btn btn-primary";
      btn.style.cssText = "";
      btn.textContent = "▶ Start Capture Mode";
    }
  }

  // ── Toggle capture ─────────────────────────────────────────────────
  function toggleCapture() {
    captureMode = !captureMode;
    if (!captureMode) captureContext = null;
    else {
      captureContext = {
        keywords: "",
        searchUrl: "",
        startedAt: new Date().toISOString(),
      };
    }
    chrome.runtime.sendMessage({ type: "SET_CAPTURE_MODE", active: captureMode, context: captureContext }, () => {
      updateModeUI();
      if (captureMode) {
        // Open LinkedIn
        chrome.tabs.create({ url: "https://www.linkedin.com/search/results/people/" });
      }
    });
  }

  document.getElementById("main-toggle-btn").addEventListener("click", toggleCapture);
  document.getElementById("mode-toggle-hdr").addEventListener("click", toggleCapture);

  // ── Open LinkedIn search ───────────────────────────────────────────
  document.getElementById("open-li-search").addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.linkedin.com/search/results/people/" });
  });

  // ── Manual search ──────────────────────────────────────────────────
  document.getElementById("manual-search-btn").addEventListener("click", () => {
    const kw = document.getElementById("manual-keywords").value.trim();
    const url = kw
      ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(kw)}`
      : "https://www.linkedin.com/search/results/people/";

    const pack = { keywords: kw, url, skills: [] };
    chrome.runtime.sendMessage({ type: "SET_SEARCH_PACK", data: pack }, () => {
      chrome.tabs.create({ url });
    });
  });

  // ── Load profiles ──────────────────────────────────────────────────
  function loadProfiles() {
    chrome.runtime.sendMessage({ type: "GET_SAVED_PROFILES" }, (profiles) => {
      allProfiles = (profiles || []).sort((a, b) => (b.aiMatch?.score || 0) - (a.aiMatch?.score || 0));
      updateStats();
      renderProfiles();
      buildFilters();
    });
  }

  function buildFilters() {
    const row = document.getElementById("filter-row");
    const keywords = [...new Set(allProfiles.map(p => p.captureContext?.keywords).filter(Boolean))];
    let html = `<span class="filter-chip${activeFilter === "all" ? " active" : ""}" data-filter="all">All (${allProfiles.length})</span>`;
    keywords.forEach(kw => {
      const count = allProfiles.filter(p => p.captureContext?.keywords === kw).length;
      html += `<span class="filter-chip${activeFilter === kw ? " active" : ""}" data-filter="${esc(kw)}">${esc(kw.slice(0, 18))} (${count})</span>`;
    });
    row.innerHTML = html;
    row.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        activeFilter = chip.dataset.filter;
        row.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderProfiles();
      });
    });
  }

  function renderProfiles() {
    const container = document.getElementById("profile-list");
    const filtered = (activeFilter === "all"
      ? allProfiles
      : allProfiles.filter(p => p.captureContext?.keywords === activeFilter))
      .sort((a, b) => (b.aiMatch?.score || 0) - (a.aiMatch?.score || 0));

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          ${allProfiles.length === 0
            ? "No profiles saved yet.<br/>Start Capture Mode and browse LinkedIn."
            : "No profiles match this filter."
          }
        </div>
      `;
      return;
    }

    const bestScore = filtered[0]?.aiMatch?.score || 0;
    container.innerHTML = filtered.map((p, idx) => `
      <div class="profile-card" data-idx="${idx}">
        <div class="profile-avatar">
          ${p.avatar ? `<img src="${esc(p.avatar)}" alt="" onerror="this.style.display='none'" />` : "👤"}
        </div>
        <div class="profile-info">
          <div class="profile-name">${esc(p.name || "Unknown")}</div>
          <div class="profile-title">${esc(p.title || "")}</div>
          ${p.captureContext?.keywords ? `<div class="profile-ctx">🔍 ${esc(p.captureContext.keywords)}</div>` : ""}
          ${typeof p.aiMatch?.score === "number" ? `
            <div class="profile-ctx" style="display:flex;gap:6px;align-items:center;margin-top:4px;">
              <span style="color:${p.aiMatch.score >= 85 ? "#6affca" : p.aiMatch.score >= 70 ? "#ffca6a" : "rgba(240,238,255,0.55)"};font-weight:700;">Match ${p.aiMatch.score}/100</span>
              <span style="font-size:10px;border:1px solid rgba(124,106,255,0.22);padding:1px 6px;border-radius:999px;color:rgba(240,238,255,0.65);">${esc(p.aiMatch.verdict || "Scored")}</span>
              ${idx === 0 && bestScore >= 80 ? `<span style="font-size:10px;background:rgba(106,255,202,0.12);border:1px solid rgba(106,255,202,0.25);padding:1px 6px;border-radius:999px;color:#6affca;">Best Match</span>` : ""}
            </div>
            ${p.aiMatch.outreach ? `<div class="profile-ctx" style="margin-top:4px;color:rgba(106,255,202,0.72);">✉ ${esc(p.aiMatch.outreach)}</div>` : ""}
          ` : `<div class="profile-ctx" style="margin-top:4px;">AI match: not scored yet</div>`}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
          <a href="${esc(p.profileUrl)}" target="_blank" style="font-size:9px;color:rgba(124,106,255,0.65);text-decoration:none;font-weight:600;letter-spacing:0.05em;background:rgba(124,106,255,0.08);border:1px solid rgba(124,106,255,0.14);border-radius:5px;padding:3px 7px;transition:all 0.12s;" onmouseover="this.style.color='#9b8aff'" onmouseout="this.style.color='rgba(124,106,255,0.65)'">↗ View</a>
          <button class="profile-del" data-url="${esc(p.profileUrl)}" title="Remove">×</button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".profile-del").forEach(btn => {
      btn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "DELETE_PROFILE", profileUrl: btn.dataset.url }, () => loadProfiles());
      });
    });
  }

  // ── Export ─────────────────────────────────────────────────────────
  document.getElementById("export-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "EXPORT_PROFILES" }, (profiles) => {
      if (!profiles.length) return;
      const csv = [
        ["Name", "Title", "Profile URL", "Search Keywords", "AI Score", "AI Verdict", "Captured At"].join(","),
        ...profiles.map(p => [
          csvEsc(p.name),
          csvEsc(p.title),
          csvEsc(p.profileUrl),
          csvEsc(p.captureContext?.keywords || ""),
          csvEsc(p.aiMatch?.score ?? ""),
          csvEsc(p.aiMatch?.verdict || ""),
          csvEsc(p.savedAt || ""),
        ].join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `linkedin-captures-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  document.getElementById("rescore-btn").addEventListener("click", () => {
    if (rescoring) return;
    rescoring = true;
    const btn = document.getElementById("rescore-btn");
    btn.textContent = "Scoring...";
    btn.disabled = true;
    chrome.runtime.sendMessage({ type: "RESCORE_PROFILES" }, () => {
      rescoring = false;
      btn.textContent = "✦ Re-score";
      btn.disabled = false;
      loadProfiles();
    });
  });

  // ── Clear all ──────────────────────────────────────────────────────
  document.getElementById("clear-btn").addEventListener("click", () => {
    if (!confirm("Delete all saved profiles?")) return;
    chrome.runtime.sendMessage({ type: "CLEAR_ALL" }, () => {
      allProfiles = [];
      captureMode = false;
      captureContext = null;
      updateModeUI();
      loadProfiles();
    });
  });

  // ── Search pack ────────────────────────────────────────────────────
  function loadSearchPack() {
    chrome.runtime.sendMessage({ type: "GET_SEARCH_PACK" }, (pack) => {
      const area = document.getElementById("search-pack-area");
      if (!pack) {
        area.innerHTML = `<div class="notice">No search pack loaded. Search packs are generated by your Career Accelerator app and automatically appear here when you open a LinkedIn search from the app.</div>`;
        return;
      }
      area.innerHTML = `
        <div class="pack-card">
          <div class="pack-kw">${esc(pack.keywords || "Custom Search")}</div>
          <div class="pack-meta">${pack.projectTitle ? `Project: ${esc(pack.projectTitle)}` : "From Career Accelerator"}</div>
          ${pack.skills?.length ? `<div class="pack-tags">${pack.skills.map(s => `<span class="pack-tag">${esc(s)}</span>`).join("")}</div>` : ""}
          <div class="pack-actions">
            <button class="btn btn-primary" id="use-pack-btn">Open This Search</button>
          </div>
        </div>
      `;
      document.getElementById("use-pack-btn")?.addEventListener("click", () => {
        chrome.tabs.create({ url: pack.url });
      });
    });
  }

  // ── Utils ──────────────────────────────────────────────────────────
  function esc(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function csvEsc(str) {
    const s = String(str || "").replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  }

  // ── Start ──────────────────────────────────────────────────────────
  loadState();
})();
