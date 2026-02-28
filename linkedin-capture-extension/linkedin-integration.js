// linkedin-integration.js
// ─────────────────────────────────────────────────────────────
// Add this to your Career Accelerator app to enable the
// "Open LinkedIn Search" feature that communicates with the extension.
// 
// The extension's ID is shown in chrome://extensions after you load it.
// Replace EXTENSION_ID with your actual extension ID.
// ─────────────────────────────────────────────────────────────

const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE"; // Replace after loading extension

/**
 * Opens a LinkedIn search via the extension with pre-filled keywords.
 * Falls back to direct URL open if extension is not installed.
 *
 * @param {Object} searchPack
 * @param {string} searchPack.keywords       - Search terms
 * @param {string[]} searchPack.skills       - Skills array from the project
 * @param {string} searchPack.projectTitle   - Project name from roadmap
 * @param {string} searchPack.targetRole     - User's target role
 */
export function openLinkedInSearch(searchPack) {
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchPack.keywords)}&network=["F"]`;
  const pack = { ...searchPack, url };

  // Try to message the Chrome extension
  if (typeof chrome !== "undefined" && chrome.runtime && EXTENSION_ID !== "YOUR_EXTENSION_ID_HERE") {
    try {
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "OPEN_LINKEDIN_SEARCH", searchPack: pack },
        (response) => {
          if (chrome.runtime.lastError || !response?.ok) {
            // Extension not responding, fallback
            window.open(url, "_blank");
          }
        }
      );
      return;
    } catch {
      // Extension not installed
    }
  }

  // Fallback: open directly
  window.open(url, "_blank");
}

/**
 * Generates search packs from a project + profile.
 * Each pack targets a specific skill or the overall project.
 *
 * @param {Object} project  - Selected project from ProjectPicker
 * @param {Object} profile  - User profile from IntakeForm
 * @returns {Object[]}      - Array of search packs
 */
export function generateSearchPacks(project, profile) {
  const packs = [];

  // Pack 1: Project-specific search
  if (project.tags?.length) {
    packs.push({
      keywords: project.tags.slice(0, 3).join(" "),
      skills: project.tags,
      projectTitle: project.title,
      targetRole: profile.goal,
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(project.tags.slice(0, 3).join(" "))}&network=["F"]`,
    });
  }

  // Pack 2: Target role search
  packs.push({
    keywords: profile.goal,
    skills: profile.skills || [],
    projectTitle: project.title,
    targetRole: profile.goal,
    url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(profile.goal)}&network=["F"]`,
  });

  // Pack 3: User's own skills
  if (profile.skills?.length) {
    packs.push({
      keywords: profile.skills.slice(0, 4).join(" "),
      skills: profile.skills,
      projectTitle: project.title,
      targetRole: profile.goal,
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(profile.skills.slice(0, 4).join(" "))}&network=["F"]`,
    });
  }

  return packs;
}
