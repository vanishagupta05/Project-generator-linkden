require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
app.use(cors());
app.use(express.json());

function extractJsonObject(text) {
  if (!text) return null;
  const cleaned = String(text)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : cleaned;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function heuristicMatch(profile, context) {
  const title = String(profile?.title || '').toLowerCase();
  const keywords = String(context?.keywords || '').toLowerCase();
  const skills = Array.isArray(context?.skills) ? context.skills.map((s) => String(s).toLowerCase()) : [];
  let hits = 0;

  for (const s of skills) {
    if (s && title.includes(s)) hits += 1;
  }
  if (keywords && title.includes(keywords)) hits += 1;
  const raw = Math.min(95, 45 + hits * 15);
  const verdict = raw >= 85 ? 'Best Match' : raw >= 70 ? 'Strong Match' : raw >= 55 ? 'Possible Match' : 'Weak Match';
  return {
    score: raw,
    verdict,
    reasons: [
      skills.length ? `Skill overlap hits: ${hits}` : 'Limited skill context',
      profile?.title ? `Title checked: ${profile.title}` : 'No title available'
    ],
    outreach: `Hi ${profile?.name || 'there'}, your background in ${profile?.title || 'this area'} aligns with my project focus.`
  };
}

app.post('/api/claude', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
  }
  const userMessage = req.body.messages[0].content;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: userMessage }],
          max_tokens: 2000
        })
      }
    );

    const data = await response.json();
    console.log("Groq response:", JSON.stringify(data, null, 2));
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ content: [{ text }] });
  } catch (e) {
    console.error("Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/profile-match', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Missing GROQ_API_KEY environment variable' });
  }

  const profile = req.body?.profile || {};
  const context = req.body?.context || {};
  const prompt = `You are evaluating if a LinkedIn profile is the best person to help on a project.

PROJECT CONTEXT:
- Project Title: ${context.projectTitle || 'N/A'}
- Search Keywords: ${context.keywords || 'N/A'}
- Skills Needed: ${Array.isArray(context.skills) ? context.skills.join(', ') : 'N/A'}
- Target Role: ${context.targetRole || 'N/A'}

CANDIDATE:
- Name: ${profile.name || 'Unknown'}
- Headline/Title: ${profile.title || profile.headline || 'N/A'}
- Location: ${profile.location || 'N/A'}
- Company Summary: ${profile.company || 'N/A'}
- Profile URL: ${profile.profileUrl || 'N/A'}

Return ONLY JSON:
{
  "score": 0-100,
  "verdict": "Best Match|Strong Match|Possible Match|Weak Match",
  "reasons": ["short reason 1", "short reason 2", "short reason 3"],
  "outreach": "One short personalized outreach line"
}`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 700
        })
      }
    );

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = extractJsonObject(text);
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'LLM request failed' });
    }

    if (!parsed || typeof parsed.score !== 'number') {
      return res.json(heuristicMatch(profile, context));
    }

    const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
    res.json({
      score,
      verdict: parsed.verdict || (score >= 85 ? 'Best Match' : score >= 70 ? 'Strong Match' : score >= 55 ? 'Possible Match' : 'Weak Match'),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : [],
      outreach: parsed.outreach || ''
    });
  } catch (e) {
    console.error('Match scoring error:', e);
    res.json(heuristicMatch(profile, context));
  }
});

app.listen(3002, () => console.log('Proxy running on port 3002'));
