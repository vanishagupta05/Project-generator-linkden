// content.js — injected into LinkedIn search + profile pages

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────
  let captureMode = false;
  let captureContext = null;
  let savedCount = 0;
  let bannerEl = null;
  let profileBarEl = null;
  let isSearchPage = false;
  let isProfilePage = false;
  let saveButtonsInjected = new Set();
  let observerActive = false;

  // ── Init ───────────────────────────────────────────────────────────
  function init() {
    const url = window.location.href;
    isSearchPage = url.includes("/search/results/people");
    isProfilePage = url.includes("/in/") && !url.includes("/search/");

    // Load current state
    chrome.runtime.sendMessage({ type: "GET_CAPTURE_MODE" }, (res) => {
      if (res) {
        captureMode = res.captureMode;
        captureContext = res.captureContext;
      }
      chrome.runtime.sendMessage({ type: "GET_SAVED_PROFILES" }, (profiles) => {
        savedCount = (profiles || []).length;
        if (isSearchPage) {
          renderBanner();
          startObserver();
          // Check for search pack from app
          chrome.runtime.sendMessage({ type: "GET_SEARCH_PACK" }, (pack) => {
            if (pack && !captureContext) {
              autoSetContext(pack);
            }
          });
        }
        if (isProfilePage && captureMode) {
          renderProfileBar();
        }
      });
    });
  }

  // ── Grab keywords from URL ─────────────────────────────────────────
  function getKeywordsFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("keywords") || "";
    } catch { return ""; }
  }

  function autoSetContext(pack) {
    captureContext = {
      keywords: pack.keywords || getKeywordsFromURL(),
      searchUrl: window.location.href,
      projectTitle: pack.projectTitle || "",
      skills: pack.skills || [],
      targetRole: pack.targetRole || "",
    };
  }

  // ── Banner (search page) ───────────────────────────────────────────
  function renderBanner() {
    if (bannerEl) bannerEl.remove();

    bannerEl = document.createElement("div");
    bannerEl.id = "lcc-banner";
    bannerEl.innerHTML = buildBannerHTML();
    document.body.appendChild(bannerEl);

    // Events
    bannerEl.querySelector("#lcc-close-btn").addEventListener("click", () => bannerEl.remove());
    bannerEl.querySelector("#lcc-toggle-btn").addEventListener("click", toggleCapture);
    bannerEl.querySelector("#lcc-view-btn")?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
    });
  }

  function buildBannerHTML() {
    const kw = captureContext?.keywords || getKeywordsFromURL() || "LinkedIn Search";
    return `
      <div id="lcc-banner-inner">
        <div class="lcc-header">
          <span class="lcc-logo">✦ LCC</span>
          <button id="lcc-close-btn" class="lcc-close" title="Dismiss">×</button>
        </div>
        <div class="lcc-status">
          <div class="lcc-dot${captureMode ? " active" : ""}"></div>
          <span class="lcc-status-text">Capture Mode: <strong>${captureMode ? "ON" : "OFF"}</strong></span>
        </div>
        ${captureMode && captureContext ? `
          <div class="lcc-context">
            <div class="lcc-context-label">Search Context</div>
            <div class="lcc-context-value">${escHtml(kw)}${captureContext.projectTitle ? ` · <em>${escHtml(captureContext.projectTitle)}</em>` : ""}</div>
          </div>
        ` : ""}
        <div class="lcc-count-row">
          <span class="lcc-count-badge">${savedCount}</span>
          <span class="lcc-count-label">profiles captured</span>
        </div>
        <button id="lcc-toggle-btn" class="lcc-btn ${captureMode ? "lcc-btn-off" : "lcc-btn-on"}">
          ${captureMode ? "⏹ Stop Capture Mode" : "▶ Start Capture Mode"}
        </button>
        <button id="lcc-view-btn" class="lcc-btn lcc-btn-mini">⬡ Open Saved Profiles</button>
      </div>
    `;
  }

  function toggleCapture() {
    captureMode = !captureMode;
    if (captureMode) {
      captureContext = {
        keywords: getKeywordsFromURL(),
        searchUrl: window.location.href,
        startedAt: new Date().toISOString(),
      };
    } else {
      captureContext = null;
    }
    chrome.runtime.sendMessage({
      type: "SET_CAPTURE_MODE",
      active: captureMode,
      context: captureContext
    }, () => {
      renderBanner();
      if (captureMode) injectSaveButtons();
      else removeAllSaveButtons();
    });
  }

  // ── Save buttons on search results ────────────────────────────────
  function startObserver() {
    if (observerActive) return;
    observerActive = true;
    const mo = new MutationObserver(() => {
      if (captureMode) injectSaveButtons();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    if (captureMode) injectSaveButtons();
  }

  function injectSaveButtons() {
    // LinkedIn search result cards
    const cards = document.querySelectorAll(".entity-result__item, .reusable-search__result-container li");
    cards.forEach(card => {
      const anchor = card.querySelector("a[href*='/in/']");
      if (!anchor) return;
      const profileUrl = normalizeProfileUrl(anchor.href);
      if (!profileUrl || saveButtonsInjected.has(profileUrl)) return;
      saveButtonsInjected.add(profileUrl);

      const nameEl = card.querySelector(".entity-result__title-text, .app-aware-link span[aria-hidden='true']");
      const titleEl = card.querySelector(".entity-result__primary-subtitle, .entity-result__secondary-subtitle");
      const imgEl = card.querySelector("img.evi-image, img.presence-entity__image");
      const name = nameEl?.innerText?.trim() || "Unknown";
      const title = titleEl?.innerText?.trim() || "";
      const avatar = imgEl?.src || "";

      const btn = document.createElement("button");
      btn.className = "lcc-save-btn";
      btn.innerHTML = "⊕ Save";
      btn.dataset.profileUrl = profileUrl;

      // Check if already saved
      chrome.runtime.sendMessage({ type: "GET_SAVED_PROFILES" }, (profiles) => {
        const already = (profiles || []).some(p => p.profileUrl === profileUrl);
        if (already) { btn.classList.add("saved"); btn.innerHTML = "✓ Saved"; }
      });

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveProfile({ name, title, profileUrl, avatar });
        btn.classList.add("saved");
        btn.innerHTML = "✓ Saved";
      });

      // Find a good spot to inject
      const actionArea = card.querySelector(".entity-result__actions, .entity-result__title-line");
      if (actionArea) actionArea.appendChild(btn);
      else anchor.parentElement?.appendChild(btn);
    });
  }

  function removeAllSaveButtons() {
    document.querySelectorAll(".lcc-save-btn").forEach(b => b.remove());
    saveButtonsInjected.clear();
  }

  // ── Profile page bar ───────────────────────────────────────────────
  function renderProfileBar() {
    if (profileBarEl) profileBarEl.remove();

    const profileUrl = normalizeProfileUrl(window.location.href);
    const nameEl = document.querySelector("h1.text-heading-xlarge, .pv-text-details__left-panel h1");
    const titleEl = document.querySelector(".text-body-medium.break-words, .pv-text-details__left-panel .text-body-medium");
    const imgEl = document.querySelector(".pv-top-card-profile-picture__image, .profile-photo-edit__preview");
    const name = nameEl?.innerText?.trim() || "This Profile";
    const personTitle = titleEl?.innerText?.trim() || "";
    const avatar = imgEl?.src || "";

    profileBarEl = document.createElement("div");
    profileBarEl.id = "lcc-profile-bar";
    profileBarEl.innerHTML = `
      <div id="lcc-profile-bar-inner">
        <div class="lcc-bar-info">
          <div class="lcc-bar-dot"></div>
          <div class="lcc-bar-label">Capture Mode ON · <strong>${escHtml(captureContext?.keywords || "LinkedIn Capture")}</strong></div>
        </div>
        <div class="lcc-bar-actions">
          <button id="lcc-bar-save" class="lcc-bar-save">⊕ Save ${escHtml(name)}</button>
          <button id="lcc-bar-skip" class="lcc-bar-skip">Skip</button>
        </div>
      </div>
    `;
    document.body.appendChild(profileBarEl);

    // Check if already saved
    chrome.runtime.sendMessage({ type: "GET_SAVED_PROFILES" }, (profiles) => {
      const already = (profiles || []).some(p => p.profileUrl === profileUrl);
      const saveBtn = document.getElementById("lcc-bar-save");
      if (saveBtn && already) {
        saveBtn.classList.add("saved-state");
        saveBtn.textContent = "✓ Already Saved";
      }
    });

    document.getElementById("lcc-bar-save")?.addEventListener("click", () => {
      saveProfile({ name, title: personTitle, profileUrl, avatar });
      const saveBtn = document.getElementById("lcc-bar-save");
      if (saveBtn) { saveBtn.classList.add("saved-state"); saveBtn.textContent = "✓ Saved!"; }
    });

    document.getElementById("lcc-bar-skip")?.addEventListener("click", () => {
      profileBarEl?.remove();
      profileBarEl = null;
    });
  }

  // ── Save profile ───────────────────────────────────────────────────
  function saveProfile({ name, title, profileUrl, avatar }) {
    const profile = {
      name, title, profileUrl, avatar,
      captureContext: captureContext ? { ...captureContext } : null,
    };
    chrome.runtime.sendMessage({ type: "SAVE_PROFILE", profile }, (res) => {
      savedCount = res.count || savedCount;
      if (res.ok) {
        const score = res.aiMatch?.score;
        const verdict = res.aiMatch?.verdict;
        showToast(
          typeof score === "number"
            ? `✓ Saved ${name} · Match ${score}/100 (${verdict || "Scored"})`
            : `✓ Saved ${name}`,
          false
        );
      } else if (res.reason === "already_saved") {
        showToast(`Already saved`, true);
      }
      // Update banner count
      const badge = bannerEl?.querySelector(".lcc-count-badge");
      if (badge) badge.textContent = savedCount;
    });
  }

  // ── Toast ──────────────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    const existing = document.querySelector(".lcc-toast");
    if (existing) existing.remove();
    const t = document.createElement("div");
    t.className = `lcc-toast${isError ? " error" : ""}`;
    t.innerHTML = `<span class="lcc-toast-icon">${isError ? "⚠" : "✓"}</span><span>${escHtml(msg)}</span>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  // ── Utils ──────────────────────────────────────────────────────────
  function normalizeProfileUrl(url) {
    try {
      const u = new URL(url);
      return `https://www.linkedin.com${u.pathname}`.replace(/\/$/, "");
    } catch { return url; }
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Listen for background messages ────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "CAPTURE_MODE_CHANGED") {
      captureMode = msg.active;
      captureContext = msg.context;
      if (isSearchPage) renderBanner();
    }
  });

  // ── Handle SPA navigation (LinkedIn is a SPA) ─────────────────────
  let lastUrl = window.location.href;
  const navObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      saveButtonsInjected.clear();
      isSearchPage = window.location.href.includes("/search/results/people");
      isProfilePage = window.location.href.includes("/in/") && !window.location.href.includes("/search/");

      if (isSearchPage) {
        setTimeout(() => { renderBanner(); if (captureMode) injectSaveButtons(); }, 800);
      }
      if (isProfilePage && captureMode) {
        setTimeout(renderProfileBar, 800);
      }
    }
  });
  navObserver.observe(document, { subtree: true, childList: true });

  // Start
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
