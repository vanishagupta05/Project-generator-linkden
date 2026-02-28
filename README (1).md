# LinkedIn Career Capture — Chrome Extension

A Chrome extension that works alongside your **Career Accelerator** app to capture LinkedIn connections with matching skillsets.

---

## 📦 Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `linkedin-capture-extension` folder
5. The extension icon will appear in your toolbar

### Get your Extension ID
After loading, copy the Extension ID shown on the card in `chrome://extensions`. You'll need it to connect the app.

---

## 🔗 Connecting to Your App

Open `linkedin-integration.js` and replace:
```js
const EXTENSION_ID = "YOUR_EXTENSION_ID_HERE";
```
with your actual Extension ID (looks like `abcdefghijklmnopqrstuvwxyz123456`).

Then in your `App.jsx` `RoadmapView`, import and add the panel:
```jsx
import { LinkedInSearchPanel } from "./LinkedInSearchPanel";

// Inside RoadmapView, after the Risk Log section:
<LinkedInSearchPanel project={selectedProject} profile={profile} />
```

---

## 🎯 How It Works

### Flow 1 — App-initiated search
1. In your app, user selects a project and gets a roadmap
2. User clicks **"Open LinkedIn Search"** from the `LinkedInSearchPanel`
3. App sends a search pack to the extension (keywords + skills)
4. LinkedIn opens with pre-filled keywords
5. Extension shows **Capture Mode banner** on the search results page
6. User clicks **"Start Capture Mode"**
7. **Save buttons** appear next to every result card
8. User clicks **Save** on matching profiles
9. Profiles stored with search context (keywords, timestamp, project)

### Flow 2 — Manual search from popup
1. Click extension icon → go to **Search tab**
2. Type keywords → click "Open LinkedIn Search"
3. Same capture flow as above

### Flow 3 — Profile page capture
- When capture mode is ON and user opens a profile from search results
- A **top bar** appears: "Save [Name]" / "Skip"
- Works even on full profile pages for thorough review

---

## 📁 File Structure

```
linkedin-capture-extension/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker — storage + message routing
├── content.js             # Injected into LinkedIn — UI + capture logic
├── content.css            # Styles for injected UI
├── popup.html             # Extension popup
├── popup.js               # Popup logic
├── icons/                 # Extension icons (16, 48, 128px)
│
# App integration files (add to your React project):
├── linkedin-integration.js    # openLinkedInSearch() + generateSearchPacks()
└── LinkedInSearchPanel.jsx    # React component to embed in RoadmapView
```

---

## 💾 Data Storage

All data is stored in Chrome's local extension storage:

| Key | Contents |
|-----|----------|
| `savedProfiles` | Array of captured profile objects |
| `captureMode` | Boolean — is capture active? |
| `captureContext` | Current search keywords + URL |
| `searchPack` | Latest search pack from the app |

### Saved Profile Shape
```json
{
  "name": "Jane Smith",
  "title": "Senior ML Engineer at Google",
  "profileUrl": "https://www.linkedin.com/in/janesmith",
  "avatar": "https://...",
  "savedAt": "2026-02-27T10:00:00.000Z",
  "captureContext": {
    "keywords": "machine learning evaluation",
    "searchUrl": "https://www.linkedin.com/search/results/people/?keywords=...",
    "projectTitle": "ML Model Evaluation Dashboard",
    "startedAt": "2026-02-27T09:55:00.000Z"
  }
}
```

---

## ⬇️ Export

In the popup **Saved tab**, click **Export** to download all captured profiles as a `.csv` file with columns:
- Name, Title, Profile URL, Search Keywords, Captured At

---

## ⚠️ Notes

- LinkedIn frequently changes its HTML structure. If Save buttons stop appearing, the selectors in `content.js` may need updating (`entity-result__item`, etc.)
- The extension only reads public page content and stores it locally — no data is sent anywhere
- LinkedIn's filter encoding in URLs changes often; the extension reads the `keywords` param which is stable
- For best results, use **1st connections filter** in LinkedIn's UI after opening the search
