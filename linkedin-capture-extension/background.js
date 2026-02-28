// background.js — service worker

async function scoreProfileWithAI(profile) {
  const context = profile?.captureContext || {};
  try {
    const res = await fetch("http://localhost:3002/api/profile-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, context }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    if (typeof data?.score !== "number") throw new Error("Invalid score response");
    return data;
  } catch {
    // Local fallback when backend is down.
    const title = String(profile?.title || "").toLowerCase();
    const keywords = String(context?.keywords || "").toLowerCase();
    const skills = Array.isArray(context?.skills) ? context.skills : [];
    let hits = 0;
    skills.forEach((s) => {
      if (s && title.includes(String(s).toLowerCase())) hits += 1;
    });
    if (keywords && title.includes(keywords)) hits += 1;
    const score = Math.min(95, 45 + hits * 15);
    return {
      score,
      verdict: score >= 85 ? "Best Match" : score >= 70 ? "Strong Match" : score >= 55 ? "Possible Match" : "Weak Match",
      reasons: [
        skills.length ? `Skill overlap hits: ${hits}` : "Limited skill context",
      ],
      outreach: "",
      fallback: true,
    };
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SEARCH_PACK") {
    chrome.storage.local.get(["searchPack"], (res) => {
      sendResponse(res.searchPack || null);
    });
    return true;
  }

  if (msg.type === "SET_SEARCH_PACK") {
    chrome.storage.local.set({ searchPack: msg.data }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "GET_CAPTURE_MODE") {
    chrome.storage.local.get(["captureMode", "captureContext"], (res) => {
      sendResponse({ captureMode: res.captureMode || false, captureContext: res.captureContext || null });
    });
    return true;
  }

  if (msg.type === "SET_CAPTURE_MODE") {
    chrome.storage.local.set({ captureMode: msg.active, captureContext: msg.context || null }, () => {
      // Notify all LinkedIn tabs of mode change
      chrome.tabs.query({ url: "https://www.linkedin.com/*" }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: "CAPTURE_MODE_CHANGED", active: msg.active, context: msg.context });
        });
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "SAVE_PROFILE") {
    chrome.storage.local.get(["savedProfiles"], async (res) => {
      const profiles = res.savedProfiles || [];
      const exists = profiles.find(p => p.profileUrl === msg.profile.profileUrl);
      if (!exists) {
        const aiMatch = await scoreProfileWithAI(msg.profile);
        const saved = { ...msg.profile, aiMatch, savedAt: new Date().toISOString() };
        profiles.unshift(saved);
        chrome.storage.local.set({ savedProfiles: profiles }, () => sendResponse({ ok: true, count: profiles.length, aiMatch }));
      } else {
        sendResponse({ ok: false, reason: "already_saved", count: profiles.length, aiMatch: exists.aiMatch || null });
      }
    });
    return true;
  }

  if (msg.type === "RESCORE_PROFILES") {
    chrome.storage.local.get(["savedProfiles"], async (res) => {
      const profiles = res.savedProfiles || [];
      const rescored = [];
      for (const p of profiles) {
        const aiMatch = await scoreProfileWithAI(p);
        rescored.push({ ...p, aiMatch });
      }
      rescored.sort((a, b) => (b.aiMatch?.score || 0) - (a.aiMatch?.score || 0));
      chrome.storage.local.set({ savedProfiles: rescored }, () => {
        sendResponse({ ok: true, count: rescored.length });
      });
    });
    return true;
  }

  if (msg.type === "GET_SAVED_PROFILES") {
    chrome.storage.local.get(["savedProfiles"], (res) => {
      sendResponse(res.savedProfiles || []);
    });
    return true;
  }

  if (msg.type === "DELETE_PROFILE") {
    chrome.storage.local.get(["savedProfiles"], (res) => {
      const profiles = (res.savedProfiles || []).filter(p => p.profileUrl !== msg.profileUrl);
      chrome.storage.local.set({ savedProfiles: profiles }, () => sendResponse({ ok: true }));
    });
    return true;
  }

  if (msg.type === "EXPORT_PROFILES") {
    chrome.storage.local.get(["savedProfiles"], (res) => {
      sendResponse(res.savedProfiles || []);
    });
    return true;
  }

  if (msg.type === "CLEAR_ALL") {
    chrome.storage.local.remove(["savedProfiles", "captureMode", "captureContext", "searchPack"], () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "OPEN_SAVED_TAB") {
    chrome.storage.local.set({ popupOpenTab: "saved" }, async () => {
      try {
        if (chrome.action?.openPopup) {
          await chrome.action.openPopup();
        }
      } catch {
        // Ignore; popup can still be opened manually and will land on Saved tab.
      }
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Open LinkedIn search URL when triggered from external app
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.type === "OPEN_LINKEDIN_SEARCH" && msg.searchPack) {
    // Store the search pack
    chrome.storage.local.set({ searchPack: msg.searchPack }, () => {
      chrome.tabs.create({ url: msg.searchPack.url }, () => sendResponse({ ok: true }));
    });
    return true;
  }
});
