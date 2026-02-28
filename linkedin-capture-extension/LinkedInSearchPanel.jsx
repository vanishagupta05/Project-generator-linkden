// LinkedInSearchPanel.jsx
// ─────────────────────────────────────────────────────────────
// Drop this component inside your RoadmapView, after the roadmap content.
// It shows search pack cards so users can open LinkedIn with one click.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { openLinkedInSearch, generateSearchPacks } from "./linkedin-integration";

export function LinkedInSearchPanel({ project, profile }) {
  const packs = generateSearchPacks(project, profile);
  const [opened, setOpened] = useState({});

  const handleOpen = (pack, i) => {
    openLinkedInSearch(pack);
    setOpened(o => ({ ...o, [i]: true }));
  };

  return (
    <div className="section-gap">
      <div className="slabel" style={{ marginBottom: 16 }}>
        Find LinkedIn Connections
      </div>

      {/* Extension install notice */}
      <div style={{
        background: "rgba(124,106,255,0.06)",
        border: "1px solid rgba(124,106,255,0.14)",
        borderRadius: 10,
        padding: "12px 14px",
        fontSize: 13,
        color: "rgba(240,238,255,0.55)",
        lineHeight: 1.65,
        marginBottom: 16,
      }}>
        💡 Install the <strong style={{ color: "#f0eeff" }}>LinkedIn Career Capture</strong> Chrome extension to automatically save matching connections. Without it, LinkedIn will open in a new tab for manual browsing.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {packs.map((pack, i) => (
          <div key={i} style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 4,
              }}>
                {i === 0 ? "Project Skills" : i === 1 ? "Target Role" : "Your Skills"} Search
              </div>
              <div style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", lineHeight: 1.5 }}>
                🔍 {pack.keywords}
              </div>
              {pack.skills?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {pack.skills.slice(0, 5).map((s, si) => (
                    <span key={si} style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 100,
                      background: "rgba(124,106,255,0.1)",
                      color: "var(--accent)",
                      border: "1px solid rgba(124,106,255,0.2)",
                    }}>{s}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleOpen(pack, i)}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: opened[i]
                  ? "rgba(106,255,202,0.1)"
                  : "linear-gradient(135deg, #0a66c2, #0077b5)",
                color: opened[i] ? "#6affca" : "#fff",
                border: opened[i] ? "1px solid rgba(106,255,202,0.2)" : "none",
                borderRadius: 8,
                padding: "9px 14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                boxShadow: opened[i] ? "none" : "0 2px 10px rgba(10,102,194,0.3)",
                transition: "all 0.15s",
              }}
            >
              {opened[i] ? "✓ Opened" : "↗ Open LinkedIn"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
