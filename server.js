import express from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, 'data');
const PORT = process.env.PORT || 3101;
const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
const JAVA_LANG_ID = 62;
const REVIEW_DAYS = [1, 3, 7, 14, 30];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PROGRESS_ROW_ID = process.env.PROGRESS_ROW_ID || 'main';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

const app = express();
app.use(express.json({ limit: '512kb' }));

// ----- HTTP Basic Auth (skip /ping and static asset roots when public) -----
if (AUTH_PASSWORD) {
  app.use((req, res, next) => {
    if (req.path === '/ping' || req.path === '/health') return next();
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="DSA"');
      return res.status(401).send('Auth required');
    }
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const pass = decoded.includes(':') ? decoded.split(':').slice(1).join(':') : decoded;
    if (pass === AUTH_PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="DSA"');
    return res.status(401).send('Invalid password');
  });
}

app.use(express.static(join(__dirname, 'public')));

// ----- Health endpoints (always public, used by external pingers) -----
app.get('/ping', (_req, res) => res.send('pong'));
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString(), supabase: USE_SUPABASE }));

async function loadJson(name) {
  const raw = await readFile(join(DATA, name), 'utf8');
  return JSON.parse(raw);
}

let steps, problems, concepts, flashcards, tricks;
async function loadAll() {
  [steps, problems, concepts, flashcards, tricks] = await Promise.all([
    loadJson('steps.json'),
    loadJson('problems.json'),
    loadJson('concepts.json'),
    loadJson('flashcards.json'),
    loadJson('tricks.json'),
  ]);
}

const EMPTY_PROGRESS = () => ({
  attempts: {}, solved: {}, revealed: {},
  streak: { lastActive: null, count: 0 },
  currentCode: {}, reviewSchedule: {},
});

async function loadProgress() {
  if (USE_SUPABASE) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/dsa_progress?id=eq.${PROGRESS_ROW_ID}&select=data`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) throw new Error(`Supabase load ${r.status}: ${await r.text()}`);
    const rows = await r.json();
    return rows[0]?.data || EMPTY_PROGRESS();
  }
  try { return await loadJson('progress.json'); } catch { return EMPTY_PROGRESS(); }
}

async function saveProgress(p) {
  if (USE_SUPABASE) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/dsa_progress?id=eq.${PROGRESS_ROW_ID}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify({ data: p, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) throw new Error(`Supabase save ${r.status}: ${await r.text()}`);
    return;
  }
  const { writeFile } = await import('node:fs/promises');
  await writeFile(join(DATA, 'progress.json'), JSON.stringify(p, null, 2));
}

function todayIso() { return new Date().toISOString().slice(0, 10); }
function addDaysIso(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function normalize(s) {
  return String(s ?? '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/, '');
}

async function runJava(code, stdin = '') {
  const res = await fetch(JUDGE0_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: code, stdin, language_id: JAVA_LANG_ID,
      cpu_time_limit: 5, wall_time_limit: 10,
    }),
  });
  if (!res.ok) throw new Error(`Judge0 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return {
    status: j.status?.description,
    compileError: j.compile_output || '',
    runtimeError: j.stderr || '',
    stdout: j.stdout || '',
    statusId: j.status?.id,
  };
}

function stripHidden(problem) {
  const { tests, ...safe } = problem;
  return { ...safe, sampleCount: (problem.samples || []).length, hiddenCount: (problem.tests || []).length - (problem.samples || []).length };
}

// ---- routes ----
app.get('/api/steps', (_req, res) => {
  const seededSet = new Set(Object.keys(problems));
  const decorated = steps.map(step => ({
    ...step,
    sections: (step.sections || []).map(sec => ({
      ...sec,
      problems: (sec.problems || []).map(p => ({ ...p, seeded: seededSet.has(p.id) })),
    })),
  }));
  res.json(decorated);
});

app.get('/api/problems/:id', (req, res) => {
  const p = problems[req.params.id];
  if (!p) return res.status(404).json({ error: 'not seeded yet' });
  res.json({ id: req.params.id, ...stripHidden(p) });
});

app.post('/api/run/:id', async (req, res) => {
  const p = problems[req.params.id];
  if (!p) return res.status(404).json({ error: 'not seeded yet' });
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ error: 'code required' });

  const results = [];
  for (const sample of (p.samples || [])) {
    try {
      const r = await runJava(code, sample.stdin);
      results.push({
        stdin: sample.stdin, expected: sample.expected, stdout: r.stdout,
        compileError: r.compileError, runtimeError: r.runtimeError,
        passed: !r.compileError && !r.runtimeError && normalize(r.stdout) === normalize(sample.expected),
      });
      if (r.compileError) break;
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }
  res.json({ results });
});

app.post('/api/check/:id', async (req, res) => {
  const id = req.params.id;
  const p = problems[id];
  if (!p) return res.status(404).json({ error: 'not seeded yet' });
  const { code } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ error: 'code required' });

  const tests = p.tests || [];
  let firstFail = null;
  let compileError = '';
  let passed = 0;

  for (let i = 0; i < tests.length; i++) {
    try {
      const r = await runJava(code, tests[i].stdin);
      if (r.compileError) { compileError = r.compileError; break; }
      const ok = !r.runtimeError && normalize(r.stdout) === normalize(tests[i].expected);
      if (ok) passed++;
      else if (!firstFail) {
        firstFail = { index: i, stdin: tests[i].stdin, expected: tests[i].expected, actual: r.stdout, runtimeError: r.runtimeError };
      }
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  const allPassed = !compileError && passed === tests.length;

  // log attempt — store the full code for later analysis
  const progress = await loadProgress();
  (progress.attempts[id] ||= []).push({
    ts: new Date().toISOString(),
    passed: allPassed,
    pass: passed,
    total: tests.length,
    code,
    firstFail: firstFail ? { index: firstFail.index, expected: firstFail.expected, actual: firstFail.actual } : null,
  });

  // streak
  const today = todayIso();
  if (progress.streak.lastActive !== today) {
    if (progress.streak.lastActive === addDaysIso(today, -1)) progress.streak.count += 1;
    else progress.streak.count = 1;
    progress.streak.lastActive = today;
  }

  // solved + spaced repetition schedule
  if (allPassed) {
    const existing = progress.solved[id];
    if (!existing) {
      progress.solved[id] = { firstSolvedAt: today, lastReviewedAt: today };
      progress.reviewSchedule[id] = { level: 0, nextDue: addDaysIso(today, REVIEW_DAYS[0]) };
    } else {
      const cur = progress.reviewSchedule[id];
      if (cur && cur.nextDue && cur.nextDue <= today) {
        const newLevel = Math.min(cur.level + 1, REVIEW_DAYS.length - 1);
        progress.reviewSchedule[id] = { level: newLevel, nextDue: addDaysIso(today, REVIEW_DAYS[newLevel]) };
      }
      progress.solved[id].lastReviewedAt = today;
    }
  } else if (progress.solved[id]) {
    // failed review → drop back to level 0
    progress.reviewSchedule[id] = { level: 0, nextDue: addDaysIso(today, REVIEW_DAYS[0]) };
  }

  await saveProgress(progress);
  res.json({ passed: allPassed, passCount: passed, total: tests.length, firstFail, compileError });
});

app.post('/api/save-code/:id', async (req, res) => {
  const { code } = req.body || {};
  if (typeof code !== 'string') return res.status(400).json({ error: 'code required' });
  const progress = await loadProgress();
  progress.currentCode[req.params.id] = code;
  await saveProgress(progress);
  res.json({ ok: true });
});

app.post('/api/reveal/:id', async (req, res) => {
  const progress = await loadProgress();
  progress.revealed[req.params.id] = new Date().toISOString();
  await saveProgress(progress);
  res.json({ ok: true });
});

app.get('/api/concepts', (_req, res) => {
  res.json(Object.entries(concepts).map(([id, c]) => ({ id, title: c.title, summary: c.summary })));
});

app.get('/api/concepts/:id', (req, res) => {
  const c = concepts[req.params.id];
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json({ id: req.params.id, ...c });
});

app.get('/api/flashcards', (_req, res) => {
  res.json(flashcards);
});

app.get('/api/tricks', (_req, res) => {
  res.json(Object.entries(tricks).map(([id, t]) => ({
    id, title: t.title, icon: t.icon || '', tagline: t.tagline || '', count: (t.tricks || []).length,
  })));
});

app.get('/api/tricks/:id', (req, res) => {
  const t = tricks[req.params.id];
  if (!t) return res.status(404).json({ error: 'not found' });
  res.json({ id: req.params.id, ...t });
});

app.get('/api/progress', async (_req, res) => {
  const progress = await loadProgress();
  const today = todayIso();
  const reviewDue = Object.entries(progress.reviewSchedule)
    .filter(([, v]) => v.nextDue && v.nextDue <= today)
    .map(([id, v]) => ({ id, ...v, title: problems[id]?.title }));

  // step progress
  const stepStats = steps.map(step => {
    const problemsInStep = (step.sections || []).flatMap(sec => sec.problems || []);
    const seeded = problemsInStep.filter(p => problems[p.id]);
    const solved = seeded.filter(p => progress.solved[p.id]);
    return {
      id: step.id, title: step.title,
      totalProblems: problemsInStep.length,
      seededCount: seeded.length,
      solvedCount: solved.length,
    };
  });

  const totalSolved = Object.keys(progress.solved).length;
  const totalAttempts = Object.values(progress.attempts).reduce((n, arr) => n + arr.length, 0);

  res.json({
    streak: progress.streak,
    solvedCount: totalSolved,
    attemptsCount: totalAttempts,
    reviewDue,
    stepStats,
    solvedIds: Object.keys(progress.solved),
    revealedIds: Object.keys(progress.revealed),
  });
});

app.get('/api/code/:id', async (req, res) => {
  // Disabled: editor no longer pre-fills from saved code (always starts from starter).
  res.json({ code: null });
});

app.get('/api/attempts/:id', async (req, res) => {
  const progress = await loadProgress();
  const list = progress.attempts[req.params.id] || [];
  res.json(list);
});

app.get('/api/dashboard', async (_req, res) => {
  const progress = await loadProgress();
  const today = todayIso();

  // ----- KPIs -----
  const totalAttempts = Object.values(progress.attempts).reduce((n, arr) => n + arr.length, 0);
  const totalPassed = Object.values(progress.attempts).reduce((n, arr) => n + arr.filter(a => a.passed).length, 0);
  const passRate = totalAttempts ? totalPassed / totalAttempts : 0;
  const solvedCount = Object.keys(progress.solved).length;

  // ----- Activity over last 30 days -----
  const activityMap = {};
  for (const arr of Object.values(progress.attempts)) {
    for (const att of arr) {
      const day = att.ts.slice(0, 10);
      if (!activityMap[day]) activityMap[day] = { attempts: 0, passed: 0 };
      activityMap[day].attempts++;
      if (att.passed) activityMap[day].passed++;
    }
  }
  const activitySeries = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysIso(today, -i);
    activitySeries.push({ date: d, ...(activityMap[d] || { attempts: 0, passed: 0 }) });
  }

  // ----- Per step counts -----
  const perStep = steps.map(step => {
    const probs = (step.sections || []).flatMap(sec => sec.problems || []);
    const seeded = probs.filter(p => problems[p.id]);
    const solved = seeded.filter(p => progress.solved[p.id]);
    return {
      id: step.id,
      name: step.title,
      total: probs.length,
      seeded: seeded.length,
      solved: solved.length,
    };
  });

  // ----- By difficulty -----
  const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
  for (const id of Object.keys(progress.solved)) {
    const p = problems[id];
    if (p && p.difficulty && byDifficulty[p.difficulty] !== undefined) {
      byDifficulty[p.difficulty]++;
    }
  }

  // ----- Pass rate per topic -----
  const topicMap = {};
  for (const [id, atts] of Object.entries(progress.attempts)) {
    const p = problems[id];
    if (!p) continue;
    const topic = p.sectionTitle || 'Other';
    if (!topicMap[topic]) topicMap[topic] = { attempts: 0, passed: 0 };
    topicMap[topic].attempts += atts.length;
    topicMap[topic].passed += atts.filter(a => a.passed).length;
  }
  const passRateByTopic = Object.entries(topicMap).map(([name, v]) => ({
    name,
    attempts: v.attempts,
    passed: v.passed,
    rate: v.attempts ? v.passed / v.attempts : 0,
  })).sort((a, b) => b.attempts - a.attempts);

  // ----- Mistakes (any problem with at least one failed attempt) -----
  // Includes problems you've eventually solved — failures are still worth re-practicing.
  // Unsolved-with-fails appear first (higher priority).
  const mistakes = [];
  for (const [id, atts] of Object.entries(progress.attempts)) {
    const failedCount = atts.filter(a => !a.passed).length;
    if (failedCount === 0) continue;
    const last = atts[atts.length - 1];
    const p = problems[id];
    const solved = !!progress.solved[id];
    mistakes.push({
      id,
      title: p?.title || id,
      difficulty: p?.difficulty || 'Easy',
      sectionTitle: p?.sectionTitle || '',
      failedCount,
      totalAttempts: atts.length,
      lastAttempt: last.ts,
      bestPassCount: Math.max(...atts.map(a => a.pass || 0)),
      total: last.total || 0,
      solved,
      status: solved ? 'solved-with-mistakes' : 'unsolved',
    });
  }
  // Unsolved first; within each group, most recent failure first
  mistakes.sort((a, b) => {
    if (a.solved !== b.solved) return a.solved ? 1 : -1;
    return new Date(b.lastAttempt) - new Date(a.lastAttempt);
  });

  // ----- Review queue -----
  const reviewDue = Object.entries(progress.reviewSchedule)
    .filter(([, v]) => v.nextDue && v.nextDue <= today)
    .map(([id, v]) => ({ id, ...v, title: problems[id]?.title }));

  res.json({
    kpis: {
      solved: solvedCount,
      attempts: totalAttempts,
      passRate,
      streak: progress.streak.count || 0,
      lastActive: progress.streak.lastActive,
    },
    activitySeries,
    perStep,
    byDifficulty,
    passRateByTopic,
    mistakes,
    reviewDue,
    solvedIds: Object.keys(progress.solved),
  });
});

// -- start --
await loadAll();

// Self-ping to keep Render free tier warm.
// Render spins services down after 15 min of no inbound traffic. Pinging the public
// URL from inside the process counts as inbound (the request goes out to Render's
// load balancer and back in), so an internal 14-minute interval keeps the instance alive.
const SELF_PING_URL = process.env.SELF_PING_URL;
if (SELF_PING_URL) {
  const intervalMs = 14 * 60 * 1000;
  console.log(`Self-ping: ${SELF_PING_URL} every ${intervalMs / 60000} min`);
  setInterval(async () => {
    try {
      const r = await fetch(SELF_PING_URL, { method: 'GET' });
      console.log(`[${new Date().toISOString()}] self-ping ${r.status}`);
    } catch (e) {
      console.log(`[${new Date().toISOString()}] self-ping failed: ${e.message}`);
    }
  }, intervalMs).unref?.();
}

app.listen(PORT, () => {
  console.log(`DSA Practice running at http://localhost:${PORT}`);
});
