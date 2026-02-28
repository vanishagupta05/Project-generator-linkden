// content.js — injected into every linkedin.com page
(function () {
  "use strict";

  let captureMode = false;
  let captureContext = null;
  let banner = null;
  let domObserver = null;

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
  bootstrap();

  async function bootstrap() {
    const state = await msg("GET_STATE");
    captureMode = state.active;
    captureContext = state.context;
    onNavigation();

    // LinkedIn is a SPA — re-run on every route change
    interceptHistoryPush();
    window.addEventListener("popstate", () => setTimeout(onNavigation, 700));
  }

  function onNavigation() {
    teardown();
    if (isSearchPage()) {
      injectBanner();
      observeSearchResults();
      if (captureMode) stampExistingCards();
    }
    if (isProfilePage() && captureMode) {
      injectProfileSaveBtn();
    }
  }

  function teardown() {
    banner?.remove();
    banner = null;
    domObserver?.disconnect();
    domObserver = null;
    document.querySelectorAll(".hc-save-btn").forEach((b) => b.remove());
    document.getElementById("hc-profile-save-btn")?.remove();
  }

  // ─── Page detection ─────────────────────────────────────────────────────────
  const isSearchPage = () =>
    window.location.pathname.startsWith("/search/results/people");

  const isProfilePage = () =>
    /^\/in\/[^/]+\/?$/.test(window.location.pathname);

  // ─── Extract context from URL ───────────────────────────────────────────────
  function buildSearchContext(projectId = null) {
    const params = new URL(window.location.href).searchParams;
    return {
      keywords: params.get("keywords") || "",
      searchUrl: window.location.href,
      capturedAt: new Date().toISOString(),
      projectId,
    };
  }

  // ─── Banner ─────────────────────────────────────────────────────────────────
  function injectBanner() {
    if (banner) return;
    banner = document.createElement("div");
    banner.id = "hc-banner";
    banner.innerHTML = `
      <div id="hc-banner-inner">
        <span id="hc-logo">⚡ HelperCapture</span>
        <span id="hc-kw"></span>
        <span id="hc-count-label"></span>
        <button id="hc-toggle-btn"></button>
      </div>
    `;
    document.body.prepend(banner);
    renderBanner();
    document.getElementById("hc-toggle-btn").addEventListener("click", toggleCapture);
    refreshCount();
  }

  function renderBanner() {
    if (!banner) return;
    const btn = document.getElementById("hc-toggle-btn");
    const kw = document.getElementById("hc-kw");
    banner.className = captureMode ? "hc-active" : "";
    btn.textContent = captureMode ? "● Stop Capturing" : "Start Capture Mode";
    btn.className = captureMode ? "hc-btn-on" : "hc-btn-off";
    kw.textContent =
      captureMode && captureContext?.keywords
        ? `🔍 "${captureContext.keywords}"`
        : captureMode
        ? "🔍 Capturing all results"
        : "";
  }

  async function refreshCount() {
    const state = await msg("GET_STATE");
    const el = document.getElementById("hc-count-label");
    if (el) el.textContent = `${state.count} saved`;
  }

  // ─── Toggle capture mode ────────────────────────────────────────────────────
  async function toggleCapture() {
    captureMode = !captureMode;
    captureContext = captureMode ? buildSearchContext() : null;

    await msg({
      type: "SET_CAPTURE_MODE",
      active: captureMode,
      context: captureContext,
    });

    renderBanner();

    if (captureMode) {
      stampExistingCards();
      toast(`Capture ON — searching for: "${captureContext?.keywords || "everyone"}"`);
    } else {
      document.querySelectorAll(".hc-save-btn").forEach((b) => b.remove());
      toast("Capture mode OFF");
    }
  }

  // ─── Search result cards ────────────────────────────────────────────────────
  function observeSearchResults() {
    const root =
      document.querySelector(".search-results-container") ||
      document.querySelector("main");
    if (!root) return;

    domObserver = new MutationObserver(() => {
      if (captureMode) stampExistingCards();
    });
    domObserver.observe(root, { childList: true, subtree: true });
  }

  function stampExistingCards() {
    // LinkedIn's result items — selector may need updating if LinkedIn changes markup
    document
      .querySelectorAll(
        "li.reusable-search__result-container, .entity-result__item"
      )
      .forEach(addSaveBtnToCard);
  }

  function addSaveBtnToCard(card) {
    if (card.querySelector(".hc-save-btn")) return;

    const actions =
      card.querySelector(".entity-result__actions") ||
      card.querySelector(".reusable-search__result-container-action");
    if (!actions) return;

    const btn = document.createElement("button");
    btn.className = "hc-save-btn";
    btn.textContent = "+ Save";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveFromCard(card, btn);
    });
    actions.prepend(btn);
  }

  // ─── Profile page save ──────────────────────────────────────────────────────
  function injectProfileSaveBtn() {
    if (document.getElementById("hc-profile-save-btn")) return;

    const actionsRow = document.querySelector(".pvs-profile-actions");
    if (!actionsRow) {
      setTimeout(injectProfileSaveBtn, 900);
      return;
    }

    const btn = document.createElement("button");
    btn.id = "hc-profile-save-btn";
    btn.className = "hc-save-btn hc-profile-save-btn";
    btn.textContent = "⚡ Save to Project";
    btn.addEventListener("click", () => saveFromProfilePage(btn));
    actionsRow.prepend(btn);
  }

  // ─── Profile extraction ─────────────────────────────────────────────────────
  function extractFromCard(card) {
    const linkEl = card.querySelector("a[href*='/in/']");
    const rawUrl = linkEl?.href || "";
    const profileUrl = rawUrl.split("?")[0].replace(/\/$/, "");

    return {
      profileUrl,
      name: text(card, ".entity-result__title-text, span[aria-hidden='true']"),
      headline: text(card, ".entity-result__primary-subtitle"),
      location: text(card, ".entity-result__secondary-subtitle"),
      company: text(card, ".entity-result__summary"),
      searchContext: captureContext,
    };
  }

  function extractFromProfilePage() {
    return {
      profileUrl: window.location.href.split("?")[0].replace(/\/$/, ""),
      name: text(document, "h1.text-heading-xlarge"),
      headline: text(document, ".text-body-medium.break-words"),
      location: text(
        document,
        ".pb2.pv-text-details__left-panel span:first-child"
      ),
      searchContext: captureContext,
    };
  }

  // ─── Save actions ───────────────────────────────────────────────────────────
  async function saveFromCard(card, btn) {
    const candidate = extractFromCard(card);
    await doSave(candidate, btn);
  }

  async function saveFromProfilePage(btn) {
    const candidate = extractFromProfilePage();
    await doSave(candidate, btn);
  }

  async function doSave(candidate, btn) {
    btn.textContent = "Saving…";
    btn.disabled = true;

    const res = await msg({ type: "SAVE_CANDIDATE", payload: candidate });

    if (res.ok) {
      btn.textContent = "✓ Saved";
      btn.classList.add("hc-saved");
      toast(`Saved: ${candidate.name || "profile"}`);
      refreshCount();
    } else if (res.duplicate) {
      btn.textContent = "Already saved";
      btn.classList.add("hc-saved");
    } else {
      btn.textContent = "Error — retry";
      btn.disabled = false;
      toast("Save failed", true);
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function text(root, selector) {
    return root.querySelector(selector)?.innerText?.trim() || undefined;
  }

  function msg(payload) {
    const message = typeof payload === "string" ? { type: payload } : payload;
    return chrome.runtime.sendMessage(message);
  }

  function toast(message, isError = false) {
    document.getElementById("hc-toast")?.remove();
    const t = document.createElement("div");
    t.id = "hc-toast";
    t.textContent = message;
    if (isError) t.classList.add("hc-toast-error");
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("hc-toast-show"));
    setTimeout(() => {
      t.classList.remove("hc-toast-show");
      setTimeout(() => t.remove(), 300);
    }, 2500);
  }

  function interceptHistoryPush() {
    const orig = history.pushState;
    history.pushState = function (...args) {
      orig.apply(this, args);
      setTimeout(onNavigation, 700);
    };
  }
})();
