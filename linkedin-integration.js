// linkedin-integration.js
// Replace this with your extension id from chrome://extensions.
const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";

export function openLinkedInSearch(searchPack) {
  const keywords = searchPack?.keywords || "";
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&network=[\"F\"]`;
  const pack = { ...searchPack, url };

  if (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    EXTENSION_ID !== "bgeamgbaadfhbeaodhgppchejlgdmkfd"
  ) {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "OPEN_LINKEDIN_SEARCH", searchPack: pack },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) {
            window.open(url, "_blank");
          }
        }
      );
      return;
    } catch {
      // Extension unavailable; fallback below.
    }
  }

  window.open(url, "_blank");
}

export function generateSearchPacks(project, profile) {
  const packs = [];

  if (project?.tags?.length) {
    const keywords = project.tags.slice(0, 3).join(" ");
    packs.push({
      keywords,
      skills: project.tags,
      projectTitle: project.title,
      targetRole: profile?.goal || "",
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&network=[\"F\"]`,
    });
  }

  if (profile?.goal) {
    packs.push({
      keywords: profile.goal,
      skills: profile.skills || [],
      projectTitle: project?.title || "",
      targetRole: profile.goal,
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(profile.goal)}&network=[\"F\"]`,
    });
  }

  if (profile?.skills?.length) {
    const keywords = profile.skills.slice(0, 4).join(" ");
    packs.push({
      keywords,
      skills: profile.skills,
      projectTitle: project?.title || "",
      targetRole: profile?.goal || "",
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}&network=[\"F\"]`,
    });
  }

  return packs;
}
