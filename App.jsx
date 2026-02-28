import { useState, useRef } from "react";
import { LinkedInSearchPanel } from "./LinkedInSearchPanel";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #08080f;
    --surface: #111119;
    --surface2: #16161f;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.14);
    --accent: #7c6aff;
    --accent2: #ff6a9b;
    --accent3: #6affca;
    --accent4: #ffca6a;
    --text: #f0eeff;
    --muted: rgba(240,238,255,0.45);
  }

  html, body { margin: 0; min-height: 100vh; background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); -webkit-font-smoothing: antialiased; }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 70% 45% at 20% 0%, rgba(124,106,255,0.16) 0%, transparent 60%),
      radial-gradient(ellipse 55% 40% at 80% 100%, rgba(255,106,155,0.1) 0%, transparent 60%);
    padding: 0 20px 80px;
  }

  .hdr { text-align: center; padding: 56px 0 32px; width: 100%; max-width: 600px; }
  .hdr-eye { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.26em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px; }
  .hdr h1 {
    font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3.2rem);
    font-weight: 800; line-height: 1.1; letter-spacing: -0.025em;
    background: linear-gradient(135deg, #f0eeff 20%, #9b8aff 55%, #ff6a9b 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px;
  }
  .hdr p { color: var(--muted); font-size: 15px; font-weight: 300; line-height: 1.7; }
  .hdr-user { margin-top: 14px; font-size: 13px; color: var(--muted); display: flex; align-items: center; justify-content: center; gap: 10px; }

  .dots { display: flex; justify-content: center; gap: 7px; margin-bottom: 28px; }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--border2); transition: all 0.3s; }
  .dot.on { background: var(--accent); width: 22px; border-radius: 4px; box-shadow: 0 0 10px rgba(124,106,255,0.5); }

  .card { width: 100%; max-width: 600px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 36px; text-align: left; }
  .card-wide { max-width: 780px; }

  .slabel { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
  .slabel::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .slabel.green { color: var(--accent3); }
  .slabel.green::after { background: rgba(106,255,202,0.15); }
  .slabel.pink { color: var(--accent2); }
  .slabel.pink::after { background: rgba(255,106,155,0.15); }
  .slabel.yellow { color: var(--accent4); }
  .slabel.yellow::after { background: rgba(255,202,106,0.15); }

  .fstack { display: flex; flex-direction: column; gap: 20px; }
  .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 8px; width: 100%; }
  .field label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .field input, .field select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
    color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px; padding: 13px 15px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field input::placeholder { color: rgba(240,238,255,0.2); }
  .field input:focus, .field select:focus { border-color: rgba(124,106,255,0.5); box-shadow: 0 0 0 3px rgba(124,106,255,0.08); }
  .field select option { background: #16161f; }

  .tags-box { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 10px; display: flex; flex-wrap: wrap; gap: 7px; min-height: 50px; cursor: text; transition: border-color 0.2s, box-shadow 0.2s; }
  .tags-box:focus-within { border-color: rgba(124,106,255,0.5); box-shadow: 0 0 0 3px rgba(124,106,255,0.08); }
  .tchip { background: rgba(124,106,255,0.15); color: var(--accent); border: 1px solid rgba(124,106,255,0.3); border-radius: 100px; font-size: 13px; font-weight: 500; padding: 4px 12px; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .tchip button { background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; padding: 0; opacity: 0.6; line-height: 1; }
  .tchip button:hover { opacity: 1; }
  .tinput { background: none; border: none; outline: none; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 15px; min-width: 140px; flex: 1; padding: 4px; }
  .tinput::placeholder { color: rgba(240,238,255,0.2); }
  .thint { font-size: 11px; color: var(--muted); margin-top: 5px; }

  .pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; padding: 10px 18px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .pill:hover { border-color: var(--border2); color: var(--text); }
  .pill.on-p { background: rgba(124,106,255,0.15); border-color: var(--accent); color: var(--accent); }
  .pill.on-t { background: rgba(106,255,202,0.1); border-color: var(--accent3); color: var(--accent3); }

  .upzone { width: 100%; background: var(--surface2); border: 1.5px dashed var(--border2); border-radius: 12px; padding: 32px 24px; text-align: center; cursor: pointer; transition: all 0.2s; }
  .upzone:hover, .upzone.drag { border-color: var(--accent); background: rgba(124,106,255,0.06); }
  .upzone p { font-size: 14px; color: var(--muted); line-height: 1.65; }
  .upzone strong { color: var(--text); font-weight: 500; }
  .fname { margin-top: 8px; font-size: 13px; color: var(--accent3); font-weight: 500; }

  .btn { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 28px; border: none; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
  .btn-p { background: linear-gradient(135deg, #7c6aff 0%, #9b6aff 100%); color: #fff; width: 100%; margin-top: 24px; box-shadow: 0 4px 20px rgba(124,106,255,0.25); }
  .btn-p:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(124,106,255,0.35); }
  .btn-p:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-g { background: transparent; color: var(--muted); border: 1px solid var(--border); font-size: 11px; padding: 9px 16px; }
  .btn-g:hover { border-color: var(--border2); color: var(--text); }
  .btn-lnk { background: none; border: none; color: var(--accent); font-size: 13px; cursor: pointer; text-decoration: underline; font-family: 'DM Sans', sans-serif; padding: 0; }

  .auth-sw { text-align: center; margin-top: 18px; font-size: 14px; color: var(--muted); }
  .err { background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.2); border-radius: 8px; padding: 11px 15px; font-size: 13px; color: #ff8080; margin-top: 14px; }

  .spin-wrap { text-align: center; padding: 60px 20px; }
  .spinner { width: 42px; height: 42px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 18px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin-wrap strong { display: block; font-family: 'Syne', sans-serif; font-size: 18px; margin-bottom: 8px; }
  .spin-wrap p { color: var(--muted); font-size: 14px; line-height: 1.7; max-width: 360px; margin: 0 auto; }

  .pgrid { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .pcard { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; cursor: pointer; transition: all 0.18s; position: relative; text-align: left; }
  .pcard:hover { border-color: rgba(124,106,255,0.4); background: rgba(124,106,255,0.06); transform: translateX(3px); }
  .pcard.sel { border-color: var(--accent); background: rgba(124,106,255,0.1); }
  .pcard.sel::after { content: '✓'; position: absolute; top: 14px; right: 14px; width: 20px; height: 20px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #fff; font-weight: 700; }
  .pnum { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--accent); letter-spacing: 0.12em; margin-bottom: 6px; }
  .ptitle { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .pdesc { font-size: 13px; color: var(--muted); line-height: 1.65; }
  .pimpact { font-size: 12px; color: rgba(106,255,202,0.75); margin-top: 6px; }
  .trow { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  .tag { font-size: 11px; padding: 3px 10px; border-radius: 100px; border: 1px solid var(--border); color: var(--muted); background: rgba(255,255,255,0.04); }
  .tag.a { background: rgba(124,106,255,0.12); color: var(--accent); border-color: rgba(124,106,255,0.25); }
  .tag.g { background: rgba(106,255,202,0.08); color: var(--accent3); border-color: rgba(106,255,202,0.2); }
  .tag.k { background: rgba(255,106,155,0.08); color: var(--accent2); border-color: rgba(255,106,155,0.2); }
  .arow { display: flex; gap: 10px; margin-top: 20px; }

  /* ─── Roadmap ─── */
  .rmhdr { background: linear-gradient(135deg, rgba(124,106,255,0.12) 0%, rgba(255,106,155,0.06) 100%); border: 1px solid rgba(124,106,255,0.18); border-radius: 12px; padding: 22px; margin-bottom: 22px; }
  .rmtitle { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 6px; }
  .rmov { font-size: 14px; color: var(--muted); line-height: 1.65; }

  /* Timeline */
  .tl { display: flex; flex-direction: column; }
  .tli { display: grid; grid-template-columns: 76px 22px 1fr; gap: 0 14px; }
  .tlw { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--accent); text-align: right; padding-top: 4px; white-space: nowrap; }
  .tll { display: flex; flex-direction: column; align-items: center; }
  .tld { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); border: 2px solid var(--bg); box-shadow: 0 0 0 2px var(--accent); flex-shrink: 0; margin-top: 4px; }
  .tlc { width: 2px; flex: 1; min-height: 36px; background: linear-gradient(to bottom, rgba(124,106,255,0.35), transparent); }
  .tli:last-child .tlc { display: none; }
  .tlcont { padding-bottom: 24px; }
  .tlph { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .tltasks { list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .tltasks li { font-size: 13px; color: var(--muted); line-height: 1.55; padding-left: 16px; position: relative; }
  .tltasks li::before { content: '→'; position: absolute; left: 0; color: var(--accent); font-size: 10px; top: 3px; }

  /* Milestones */
  .ms-grid { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .ms-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
  .ms-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; cursor: pointer; transition: background 0.15s; }
  .ms-head:hover { background: rgba(255,255,255,0.03); }
  .ms-badge { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; white-space: nowrap; flex-shrink: 0; }
  .ms-badge.phase { background: rgba(124,106,255,0.15); color: var(--accent); border: 1px solid rgba(124,106,255,0.25); }
  .ms-badge.done { background: rgba(106,255,202,0.12); color: var(--accent3); border: 1px solid rgba(106,255,202,0.2); }
  .ms-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; flex: 1; }
  .ms-chevron { color: var(--muted); font-size: 12px; transition: transform 0.2s; }
  .ms-chevron.open { transform: rotate(180deg); }
  .ms-body { padding: 0 16px 14px; display: flex; flex-direction: column; gap: 6px; }
  .ms-check { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--muted); line-height: 1.55; padding: 5px 8px; border-radius: 7px; transition: background 0.12s; cursor: pointer; }
  .ms-check:hover { background: rgba(255,255,255,0.03); }
  .ms-check input[type="checkbox"] { margin-top: 2px; accent-color: var(--accent3); flex-shrink: 0; width: 14px; height: 14px; cursor: pointer; }
  .ms-check.checked { color: rgba(240,238,255,0.25); text-decoration: line-through; }

  /* Resources */
  .res-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
  .res-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .res-icon { font-size: 20px; margin-bottom: 8px; }
  .res-type { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--accent3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
  .res-content { font-size: 13px; color: var(--muted); line-height: 1.65; }
  .res-links { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
  .res-link { font-size: 12px; color: var(--accent); background: rgba(124,106,255,0.08); border: 1px solid rgba(124,106,255,0.15); border-radius: 6px; padding: 4px 10px; width: fit-content; }

  /* Metrics */
  .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 4px; }
  .metric-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .metric-label { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--accent4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .metric-value { font-size: 13px; color: var(--muted); line-height: 1.65; }
  .metric-target { margin-top: 6px; font-size: 11px; color: rgba(255,202,106,0.6); font-weight: 500; }

  /* Risk Log */
  .risk-list { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .risk-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
  .risk-sev { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .risk-sev.high { background: #ff5050; box-shadow: 0 0 8px rgba(255,80,80,0.4); }
  .risk-sev.medium { background: var(--accent4); box-shadow: 0 0 8px rgba(255,202,106,0.3); }
  .risk-sev.low { background: var(--accent3); box-shadow: 0 0 8px rgba(106,255,202,0.2); }
  .risk-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .risk-desc { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 6px; }
  .risk-mitigation { font-size: 12px; color: rgba(106,255,202,0.7); display: flex; align-items: flex-start; gap: 5px; }
  .risk-mitigation::before { content: '✦'; font-size: 9px; margin-top: 2px; flex-shrink: 0; }
  .risk-sev-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .risk-sev-label.high { color: #ff8080; }
  .risk-sev-label.medium { color: var(--accent4); }
  .risk-sev-label.low { color: var(--accent3); }

  .section-gap { margin-top: 32px; }

  .rgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
  .ritem { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
  .ritem h4 { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; color: var(--accent3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .ritem p { font-size: 13px; color: var(--muted); line-height: 1.6; }

  @media (max-width: 560px) {
    .card { padding: 24px 20px; }
    .frow { grid-template-columns: 1fr; }
    .rgrid { grid-template-columns: 1fr; }
    .res-grid { grid-template-columns: 1fr; }
    .metrics-grid { grid-template-columns: 1fr; }
    .tli { grid-template-columns: 58px 18px 1fr; }
  }
`;

function getUsers() { try { return JSON.parse(localStorage.getItem("pg_users") || "{}"); } catch { return {}; } }
function saveUsers(u) { localStorage.setItem("pg_users", JSON.stringify(u)); }
function getSession() { try { return JSON.parse(localStorage.getItem("pg_session") || "null"); } catch { return null; } }
function saveSession(u) { localStorage.setItem("pg_session", JSON.stringify(u)); }
function clearSession() { localStorage.removeItem("pg_session"); }

function parseProjects(text) {
  const normalizeProjects = (arr) =>
    (Array.isArray(arr) ? arr : [])
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        title: String(p.title || p.name || "").trim(),
        description: String(p.description || p.summary || "").trim(),
        tags: Array.isArray(p.tags) ? p.tags : [],
        difficulty: p.difficulty ? String(p.difficulty) : undefined,
        impact: p.impact ? String(p.impact) : undefined,
      }))
      .filter((p) => p.title && p.description)
      .slice(0, 10);

  const cleanJson = (s) =>
    String(s)
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();

  const candidates = [];
  const fenceMatches = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  fenceMatches.forEach((m) => candidates.push(m[1]));

  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    candidates.push(text.slice(arrStart, arrEnd + 1));
  }

  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    candidates.push(text.slice(objStart, objEnd + 1));
  }

  for (const raw of candidates) {
    try {
      const parsed = JSON.parse(cleanJson(raw));
      if (Array.isArray(parsed)) {
        const projects = normalizeProjects(parsed);
        if (projects.length) return projects;
      }
      if (parsed && typeof parsed === "object") {
        const arr =
          parsed.projects ||
          parsed.ideas ||
          parsed.items ||
          parsed.results ||
          [];
        const projects = normalizeProjects(arr);
        if (projects.length) return projects;
      }
    } catch {}
  }

  const projects = [];
  const lines = String(text).split('\n');
  let cur = null;
  const isTitleLine = (line) =>
    /^\s*(\d+[\.\)\:\-]\s+|[-*]\s+|\*\*project\s*\d+\**\s*:?\s*)/i.test(line);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const titleMatch =
      line.match(/^\s*\d+[\.\)\:\-]\s+\*?\*?(.+?)\*?\*?\s*$/i) ||
      line.match(/^\s*[-*]\s+\*?\*?(.+?)\*?\*?\s*$/i) ||
      line.match(/^\s*\*?\*?project\s*\d+\*?\*?\s*:\s*(.+?)\s*$/i);

    if (titleMatch) {
      if (cur) projects.push(cur);
      cur = { title: titleMatch[1].trim(), description: "", tags: [] };
      continue;
    }

    if (!cur) continue;
    const desc = line
      .replace(/^description\s*:\s*/i, "")
      .replace(/^impact\s*:\s*/i, "");
    if (desc && !isTitleLine(desc)) cur.description += ` ${desc}`;
  }

  if (cur) projects.push(cur);
  const cleaned = projects
    .map((p) => ({
      ...p,
      title: String(p.title || "").replace(/^["'`]|["'`]$/g, "").trim(),
      description: String(p.description || "").trim(),
    }))
    .filter((p) => p.title && p.description)
    .slice(0, 10);

  if (cleaned.length) return cleaned;

  const lineProjects = [];
  let curLine = null;
  for (const line of lines) {
    const nm = line.match(/^\d+[\.\)]\s+\*?\*?(.+?)\*?\*?\s*$/);
    if (nm) {
      if (curLine) lineProjects.push(curLine);
      curLine = { title: nm[1].trim(), description: '', tags: [] };
    } else if (curLine && line.trim()) {
      curLine.description += ' ' + line.trim();
    }
  }
  if (curLine) lineProjects.push(curLine);
  if (lineProjects.length) return lineProjects.slice(0, 10);

  return [];
}

function parseRoadmap(text) {
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch {}
  return null;
}

async function extractResumeText(file) {
  return new Promise((resolve) => {
    if (file.type === 'text/plain') {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result.slice(0, 3000));
      r.onerror = () => resolve(`[Resume: ${file.name}]`);
      r.readAsText(file);
    } else {
      resolve(`[Uploaded resume: ${file.name} (${(file.size / 1024).toFixed(0)}KB). Treat as a professional resume for the stated background and goals.]`);
    }
  });
}

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const TIME_OPTIONS = ["3 Days", "1 Week", "2 Weeks", "1 Month", "2 Months", "3 Months"];
const TAG_COLORS = ['a', 'g', 'k', '', 'a'];

const RESOURCE_ICONS = {
  "Documentation": "📚",
  "Tools": "🛠️",
  "Deployment": "🚀",
  "Resume Tip": "💼",
  "Tutorial": "🎓",
  "Library": "📦",
  "Course": "🎯",
  "Community": "💬",
};

export default function App() {
  const [user, setUser] = useState(() => getSession());
  const [step, setStep] = useState("intake");
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState("");

  const stepIndex = { intake: 0, generating: 1, pick: 1, roadmapping: 2, roadmap: 2 }[step] ?? 0;

  const handleLogin = (u) => { saveSession(u); setUser(u); };
  const handleLogout = () => { clearSession(); setUser(null); setStep("intake"); setProjects([]); setRoadmap(null); };

  async function generateProjects(p) {
    setProfile(p); setStep("generating"); setError("");
    const prompt = `You are a career development expert. Based on this profile, generate exactly 10 unique, impressive portfolio project ideas.

PROFILE:
- Name: ${p.name}
- Academic Standing: ${p.academic}
- Skills: ${p.skills.join(', ')}
- Skill Level: ${p.skillLevel}
- Target Role: ${p.goal}
- Target Company: ${p.targetCompany || 'Not specified'}
- Time Available: ${p.timeTarget}
- Resume Context: ${p.resumeText || 'Not provided'}

Return a JSON array of exactly 10 objects:
[{"title":"...","description":"2-3 sentences describing what it does and why it is impressive","tags":["Tech1","Tech2","Tech3"],"difficulty":"Beginner|Intermediate|Advanced","impact":"One sentence on why this impresses hiring managers"}]

Rules:
- Return ONLY raw JSON (no markdown, no \`\`\` fences, no extra text)
- Use double quotes for all keys/strings
- Do not include trailing commas

Make projects specific, creative, directly relevant to their goal and time constraint. Vary difficulty levels.`;

    try {
      const res = await fetch("http://localhost:3002/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ content: prompt }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const text = data.content?.[0]?.text || "";
      let parsed = parseProjects(text);
      if (!parsed.length) {
        const repairPrompt = `Convert the following model output into ONLY a JSON array of exactly 10 project objects.
Required keys: title, description, tags (array), difficulty, impact.
No markdown, no extra text.

MODEL OUTPUT:
${text}`;
        const repairRes = await fetch("http://localhost:3002/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ content: repairPrompt }] }),
        });
        const repairData = await repairRes.json();
        if (repairRes.ok) {
          const repairedText = repairData.content?.[0]?.text || "";
          parsed = parseProjects(repairedText);
        }
      }
      if (!parsed.length) throw new Error("Parse failed");
      setProjects(parsed); setStep("pick");
    } catch (e) {
      setError(`Failed to generate projects: ${e.message || "Please try again."}`); setStep("intake");
    }
  }

  async function generateRoadmap(project) {
    setSelectedProject(project); setStep("roadmapping"); setError("");
    const prompt = `You are a senior engineering mentor. Create a comprehensive project roadmap that fits within ${profile.timeTarget}.

PROJECT: ${project.title}
DESCRIPTION: ${project.description}
DEVELOPER:
- Skills: ${profile.skills.join(', ')}
- Skill Level: ${profile.skillLevel}
- Target Role: ${profile.goal}
- Time Available: ${profile.timeTarget}

Return ONLY a JSON object with this exact structure:
{
  "projectName": "...",
  "overview": "1-2 sentences",
  "techStack": ["tech1", "tech2", "tech3"],
  "keyFeatures": ["feature1", "feature2", "feature3", "feature4"],
  "phases": [
    {"weeks": "Week 1", "phase": "Phase name", "tasks": ["task1", "task2", "task3", "task4"]}
  ],
  "milestones": [
    {
      "title": "Milestone name",
      "timing": "End of Week X",
      "checklist": ["checkbox item 1", "checkbox item 2", "checkbox item 3", "checkbox item 4"]
    }
  ],
  "resources": [
    {"type": "Documentation", "content": "description of docs to read", "links": ["Resource Name 1", "Resource Name 2"]},
    {"type": "Tools", "content": "description of tools to use", "links": ["Tool 1", "Tool 2"]},
    {"type": "Deployment", "content": "deployment strategy and platform", "links": ["Platform 1"]},
    {"type": "Resume Tip", "content": "how to present this on a resume", "links": []},
    {"type": "Tutorial", "content": "key tutorials or courses", "links": ["Tutorial 1", "Tutorial 2"]},
    {"type": "Community", "content": "communities or forums for help", "links": ["Community 1"]}
  ],
  "metrics": [
    {"label": "Performance", "what": "what to measure", "target": "target value or benchmark"},
    {"label": "Test Coverage", "what": "what to test", "target": "target percentage or count"},
    {"label": "Code Quality", "what": "what to evaluate", "target": "specific quality goal"},
    {"label": "User Impact", "what": "what outcome to track", "target": "measurable success criteria"}
  ],
  "risks": [
    {"title": "Risk title", "description": "what could go wrong", "severity": "high|medium|low", "mitigation": "how to prevent or handle it"},
    {"title": "Risk title", "description": "what could go wrong", "severity": "high|medium|low", "mitigation": "how to prevent or handle it"},
    {"title": "Risk title", "description": "what could go wrong", "severity": "high|medium|low", "mitigation": "how to prevent or handle it"},
    {"title": "Risk title", "description": "what could go wrong", "severity": "medium|low", "mitigation": "how to prevent or handle it"}
  ]
}

Make milestones concrete and verifiable. Resources should reference real tools/docs. Metrics should be measurable. Risks should be common pitfalls for this type of project.`;

    try {
      const res = await fetch("http://localhost:3002/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ content: prompt }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
      const text = data.content?.[0]?.text || "";
      const parsed = parseRoadmap(text);
      if (!parsed) throw new Error("Parse failed");
      setRoadmap(parsed); setStep("roadmap");
    } catch (e) {
      setError(`Failed to generate roadmap: ${e.message || "Please try again."}`); setStep("pick");
    }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="hdr">
        <div className="hdr-eye">AI Career Accelerator</div>
        <h1>Build Projects That<br />Get You Hired</h1>
        <p>Tell us about yourself and get 10 tailored project ideas with a full execution roadmap.</p>
        {user && (
          <div className="hdr-user">
            <span>👤 {user.email}</span>
            <button className="btn-lnk" style={{ fontSize: 12 }} onClick={handleLogout}>Sign out</button>
          </div>
        )}
      </div>

      {!user ? (
        <AuthCard onLogin={handleLogin} />
      ) : (
        <>
          <div className="dots">
            {[0, 1, 2].map(i => <div key={i} className={`dot${stepIndex === i ? ' on' : ''}`} />)}
          </div>
          {step === "intake" && <IntakeForm onSubmit={generateProjects} error={error} />}
          {step === "generating" && <LoadingCard message="Analyzing your profile and crafting personalized project ideas..." />}
          {step === "pick" && <ProjectPicker projects={projects} onSelect={generateRoadmap} onBack={() => setStep("intake")} />}
          {step === "roadmapping" && <LoadingCard message={`Building your full roadmap for "${selectedProject?.title}"...`} />}
          {step === "roadmap" && roadmap && (
            <RoadmapView
              roadmap={roadmap}
              project={selectedProject}
              profile={profile}
              onBack={() => setStep("pick")}
              onRestart={() => { setStep("intake"); setProjects([]); setRoadmap(null); }}
            />
          )}
        </>
      )}
    </>
  );
}

function AuthCard({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    setErr("");
    if (!email || !pass) return setErr("Please fill in all fields.");
    if (pass.length < 6) return setErr("Password must be at least 6 characters.");
    const users = getUsers();
    if (mode === "signup") {
      if (users[email]) return setErr("An account with this email already exists.");
      users[email] = { email, password: pass };
      saveUsers(users);
      onLogin({ email });
    } else {
      if (!users[email] || users[email].password !== pass) return setErr("Invalid email or password.");
      onLogin({ email });
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <div className="slabel">{mode === "login" ? "Welcome Back" : "Create Account"}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label>Email Address</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Your password"} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
      </div>
      {err && <div className="err">{err}</div>}
      <button className="btn btn-p" onClick={submit}>
        {mode === "login" ? "→ Sign In" : "→ Create Account"}
      </button>
      <div className="auth-sw">
        {mode === "login"
          ? <>Don't have an account? <button className="btn-lnk" onClick={() => { setMode("signup"); setErr(""); }}>Sign up</button></>
          : <>Already have an account? <button className="btn-lnk" onClick={() => { setMode("login"); setErr(""); }}>Sign in</button></>
        }
      </div>
    </div>
  );
}

function IntakeForm({ onSubmit, error }) {
  const [form, setForm] = useState({
    name: "", academic: "", goal: "", targetCompany: "",
    skills: [], skillLevel: "", timeTarget: "", resumeText: "", resumeFile: null
  });
  const [tagInput, setTagInput] = useState("");
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addTag = (val) => { const v = val.trim(); if (v && !form.skills.includes(v)) set('skills', [...form.skills, v]); setTagInput(""); };
  const removeTag = (t) => set('skills', form.skills.filter(s => s !== t));
  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    if (e.key === 'Backspace' && !tagInput && form.skills.length) set('skills', form.skills.slice(0, -1));
  };
  const handleFile = async (file) => {
    if (!file) return;
    set('resumeFile', file);
    const text = await extractResumeText(file);
    set('resumeText', text);
  };

  const valid = form.name && form.academic && form.goal && form.skills.length > 0 && form.skillLevel && form.timeTarget;

  return (
    <div className="card">
      <div className="slabel">Your Profile</div>
      <div className="fstack">
        <div className="frow">
          <div className="field">
            <label>Your Name</label>
            <input placeholder="Alex Johnson" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Academic Standing</label>
            <input placeholder="Junior CS Student, Bootcamp Grad..." value={form.academic} onChange={e => set('academic', e.target.value)} />
          </div>
        </div>
        <div className="frow">
          <div className="field">
            <label>Target Role</label>
            <input placeholder="Full Stack Engineer, ML Engineer..." value={form.goal} onChange={e => set('goal', e.target.value)} />
          </div>
          <div className="field">
            <label>Target Company (optional)</label>
            <input placeholder="Google, a startup, any fintech..." value={form.targetCompany} onChange={e => set('targetCompany', e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Your Skills — type and press Enter</label>
          <div className="tags-box" onClick={() => document.querySelector('.tinput')?.focus()}>
            {form.skills.map(s => (
              <span key={s} className="tchip">
                {s}
                <button onClick={e => { e.stopPropagation(); removeTag(s); }}>×</button>
              </span>
            ))}
            <input
              className="tinput"
              placeholder={form.skills.length ? "Add more skills..." : "React, Python, SQL, Figma..."}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              onBlur={() => tagInput && addTag(tagInput)}
            />
          </div>
          <span className="thint">Press Enter or comma after each skill</span>
        </div>
        <div className="field">
          <label>Current Skill Level</label>
          <div className="pills">
            {SKILL_LEVELS.map(l => (
              <button key={l} className={`pill${form.skillLevel === l ? ' on-p' : ''}`} onClick={() => set('skillLevel', l)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Time Available to Complete Project</label>
          <div className="pills">
            {TIME_OPTIONS.map(t => (
              <button key={t} className={`pill${form.timeTarget === t ? ' on-t' : ''}`} onClick={() => set('timeTarget', t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Upload Resume (PDF or Word — optional but recommended)</label>
          <div
            className={`upzone${drag ? ' drag' : ''}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
            {form.resumeFile
              ? <div className="fname">✓ {form.resumeFile.name}</div>
              : <p><strong>Drop your resume here</strong> or click to browse<br />PDF, Word, or plain text</p>
            }
          </div>
        </div>
      </div>
      {error && <div className="err">{error}</div>}
      <button className="btn btn-p" disabled={!valid} onClick={() => onSubmit(form)}>
        ✦ Generate My 10 Project Ideas
      </button>
    </div>
  );
}

function LoadingCard({ message }) {
  return (
    <div className="card">
      <div className="spin-wrap">
        <div className="spinner" />
        <strong>Working on it...</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

function ProjectPicker({ projects, onSelect, onBack }) {
  const [sel, setSel] = useState(null);
  return (
    <div className="card card-wide">
      <div className="slabel">Choose Your Project</div>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18, lineHeight: 1.6 }}>
        10 personalized ideas crafted for your goals. Pick one to get your full roadmap.
      </p>
      <div className="pgrid">
        {projects.map((p, i) => (
          <div key={i} className={`pcard${sel === i ? ' sel' : ''}`} onClick={() => setSel(i)}>
            <div className="pnum">PROJECT {String(i + 1).padStart(2, '0')}{p.difficulty ? ` · ${p.difficulty}` : ''}</div>
            <div className="ptitle">{p.title}</div>
            <div className="pdesc">{p.description}</div>
            {p.impact && <div className="pimpact">💡 {p.impact}</div>}
            {p.tags?.length > 0 && (
              <div className="trow">
                {p.tags.map((t, ti) => <span key={ti} className={`tag ${TAG_COLORS[ti % 5]}`}>{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="arow">
        <button className="btn btn-g" onClick={onBack}>← Back</button>
        <button className="btn btn-p" style={{ flex: 1, marginTop: 0 }} disabled={sel === null} onClick={() => onSelect(projects[sel])}>
          ✦ Build Full Roadmap for This Project
        </button>
      </div>
    </div>
  );
}

// ─── Milestone accordion with interactive checklists ───────────────────────
function MilestoneCard({ milestone }) {
  const [open, setOpen] = useState(true);
  const [checked, setChecked] = useState({});
  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;
  const total = milestone.checklist?.length || 0;

  return (
    <div className="ms-card">
      <div className="ms-head" onClick={() => setOpen(o => !o)}>
        <span className="ms-badge phase">{milestone.timing}</span>
        <span className="ms-title">{milestone.title}</span>
        {total > 0 && (
          <span className="ms-badge done">{doneCount}/{total}</span>
        )}
        <span className={`ms-chevron${open ? ' open' : ''}`}>▼</span>
      </div>
      {open && milestone.checklist?.length > 0 && (
        <div className="ms-body">
          {milestone.checklist.map((item, i) => (
            <label key={i} className={`ms-check${checked[i] ? ' checked' : ''}`}>
              <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} />
              {item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main RoadmapView ───────────────────────────────────────────────────────
function RoadmapView({ roadmap, project, profile, onBack, onRestart }) {
  return (
    <div className="card card-wide">
      <div className="slabel">Your Roadmap</div>

      {/* Header */}
      <div className="rmhdr">
        <div className="rmtitle">{roadmap.projectName}</div>
        <div className="rmov">{roadmap.overview}</div>
        {roadmap.techStack?.length > 0 && (
          <div className="trow" style={{ marginTop: 12 }}>
            {roadmap.techStack.map((t, i) => <span key={i} className="tag a">{t}</span>)}
          </div>
        )}
      </div>

      {/* Key Features */}
      {roadmap.keyFeatures?.length > 0 && (
        <>
          <div className="slabel" style={{ marginBottom: 14 }}>Key Features</div>
          <div className="trow" style={{ marginBottom: 32 }}>
            {roadmap.keyFeatures.map((f, i) => <span key={i} className="tag g">✓ {f}</span>)}
          </div>
        </>
      )}

      {/* Week-by-week timeline */}
      <div className="slabel" style={{ marginBottom: 20 }}>Week-by-Week Plan</div>
      <div className="tl">
        {roadmap.phases?.map((phase, i) => (
          <div key={i} className="tli">
            <div className="tlw">{phase.weeks}</div>
            <div className="tll"><div className="tld" /><div className="tlc" /></div>
            <div className="tlcont">
              <div className="tlph">{phase.phase}</div>
              <ul className="tltasks">{phase.tasks?.map((t, ti) => <li key={ti}>{t}</li>)}</ul>
            </div>
          </div>
        ))}
      </div>

      {/* Milestones + Checklists */}
      {roadmap.milestones?.length > 0 && (
        <div className="section-gap">
          <div className="slabel green" style={{ marginBottom: 16 }}>Milestones &amp; Checklists</div>
          <div className="ms-grid">
            {roadmap.milestones.map((m, i) => <MilestoneCard key={i} milestone={m} />)}
          </div>
        </div>
      )}

      {/* Resources */}
      {roadmap.resources?.length > 0 && (
        <div className="section-gap">
          <div className="slabel" style={{ marginBottom: 16 }}>Recommended Resources</div>
          <div className="res-grid">
            {roadmap.resources.map((r, i) => (
              <div key={i} className="res-card">
                <div className="res-icon">{RESOURCE_ICONS[r.type] || '📌'}</div>
                <div className="res-type">{r.type}</div>
                <div className="res-content">{r.content}</div>
                {r.links?.length > 0 && (
                  <div className="res-links">
                    {r.links.map((l, li) => <span key={li} className="res-link">↗ {l}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics / What to Measure */}
      {roadmap.metrics?.length > 0 && (
        <div className="section-gap">
          <div className="slabel yellow" style={{ marginBottom: 16 }}>What to Measure</div>
          <div className="metrics-grid">
            {roadmap.metrics.map((m, i) => (
              <div key={i} className="metric-card">
                <div className="metric-label">📊 {m.label}</div>
                <div className="metric-value">{m.what}</div>
                {m.target && <div className="metric-target">Target: {m.target}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Log */}
      {roadmap.risks?.length > 0 && (
        <div className="section-gap">
          <div className="slabel pink" style={{ marginBottom: 16 }}>Risk Log</div>
          <div className="risk-list">
            {roadmap.risks.map((r, i) => (
              <div key={i} className="risk-card">
                <div>
                  <div className={`risk-sev ${r.severity}`} style={{ marginTop: 6 }} />
                </div>
                <div>
                  <div className={`risk-sev-label ${r.severity}`}>{r.severity} risk</div>
                  <div className="risk-title">{r.title}</div>
                  <div className="risk-desc">{r.description}</div>
                  <div className="risk-mitigation">{r.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {project && profile && (
        <LinkedInSearchPanel project={project} profile={profile} />
      )}

      <div className="arow" style={{ marginTop: 32 }}>
        <button className="btn btn-g" onClick={onBack}>← Pick Another</button>
        <button className="btn btn-g" onClick={onRestart}>Start Over</button>
      </div>
    </div>
  );
}
