// ---------- utilities ----------
const $ = (sel, root = document) => root.querySelector(sel);
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const api = async (path, opts) => {
  const r = await fetch(path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
};
const main = () => $('#main');
function setActive(route) {
  for (const a of document.querySelectorAll('nav.side a')) {
    a.classList.toggle('active', a.dataset.route === route);
  }
}
function render(html) { main().innerHTML = html; }

// ---------- routes ----------
const routes = {
  dashboard: renderDashboard,
  roadmap: renderRoadmap,
  problem: renderProblem,
  concepts: renderConcepts,
  tricks: renderTricks,
  drill: renderDrill,
};

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/dashboard';
  else router();
  refreshStreak();
});
function router() {
  const hash = location.hash.slice(2) || 'dashboard';
  const [route, ...args] = hash.split('/');
  setActive(route);
  (routes[route] || renderDashboard)(...args);
}

async function refreshStreak() {
  try {
    const p = await api('/api/progress');
    $('#streakCount').textContent = p.streak.count || 0;
    const today = new Date().toISOString().slice(0, 10);
    $('#streakStatus').textContent = p.streak.lastActive === today
      ? 'Active today ✓' : (p.streak.lastActive ? 'Resume to extend' : 'Start today');
  } catch {}
}

// ---------- DASHBOARD ----------
let _dashCharts = [];
function destroyCharts() { for (const c of _dashCharts) try { c.destroy(); } catch {} _dashCharts = []; }

async function renderDashboard() {
  destroyCharts();
  render('<div class="muted">Loading dashboard…</div>');
  const d = await api('/api/dashboard');

  const passPct = (d.kpis.passRate * 100).toFixed(0);
  const kpiHtml = `
    <div class="stat-grid">
      <div class="stat"><div class="num">${d.kpis.solved}</div><div class="label">Solved</div></div>
      <div class="stat"><div class="num">${d.kpis.attempts}</div><div class="label">Total attempts</div></div>
      <div class="stat"><div class="num">${passPct}%</div><div class="label">Pass rate</div></div>
      <div class="stat"><div class="num">${d.kpis.streak}</div><div class="label">Day streak</div></div>
    </div>`;

  // Mistakes
  const mistakesHtml = d.mistakes.length
    ? `<div class="mistakes-card">
        <div class="mistakes-header">
          <h3>🔁 Practice your mistakes</h3>
          <span class="count-badge">${d.mistakes.length}</span>
          <div class="spacer"></div>
          <button id="practiceNextMistakeBtn">Practice next →</button>
        </div>
        ${d.mistakes.slice(0, 8).map(m => `
          <div class="mistake-row" onclick="location.hash='#/problem/${esc(m.id)}'">
            <div>
              <div class="title">${esc(m.title)}</div>
              <div class="meta">${esc(m.sectionTitle)} · last try ${timeAgo(m.lastAttempt)}</div>
            </div>
            <span class="difficulty-tag difficulty-${m.difficulty}">${m.difficulty}</span>
            <span class="meta">best ${m.bestPassCount}/${m.total}</span>
            <span class="fail-count">✗ ${m.failedCount}</span>
          </div>`).join('')}
        ${d.mistakes.length > 8 ? `<div class="meta" style="text-align:center; padding-top:6px;">+${d.mistakes.length - 8} more</div>` : ''}
      </div>`
    : `<div class="mistakes-card">
        <div class="mistakes-header">
          <h3>🔁 Practice your mistakes</h3>
        </div>
        <div class="empty-state">No outstanding mistakes — every problem you've attempted, you've solved. 💪</div>
      </div>`;

  // Reviews
  const reviewHtml = d.reviewDue.length
    ? `<h3>Due for review</h3>${d.reviewDue.map(r => `
        <a class="review-card" href="#/problem/${esc(r.id)}" style="text-decoration:none; color:inherit;">
          <div><b>${esc(r.title || r.id)}</b> <small class="muted" style="margin-left:8px;">review ${r.level + 1} · due today</small></div>
          <span class="badge">REVIEW</span>
        </a>`).join('')}`
    : '';

  render(`
    <h2>Analytics</h2>
    ${kpiHtml}
    ${mistakesHtml}
    <div class="dash-grid full"><div class="chart-card">
      <h4>Activity — last 30 days</h4>
      <div class="chart-wrap"><canvas id="chartActivity"></canvas></div>
    </div></div>
    <div class="dash-grid">
      <div class="chart-card">
        <h4>Solved per step</h4>
        <div class="chart-wrap tall"><canvas id="chartSteps"></canvas></div>
      </div>
      <div class="chart-card">
        <h4>Solved by difficulty</h4>
        <div class="chart-wrap tall"><canvas id="chartDifficulty"></canvas></div>
      </div>
    </div>
    <div class="dash-grid full"><div class="chart-card">
      <h4>Pass rate by topic</h4>
      <div class="chart-wrap tall"><canvas id="chartTopics"></canvas></div>
    </div></div>
    ${reviewHtml}
  `);

  // Wire up "practice next mistake"
  const btn = document.getElementById('practiceNextMistakeBtn');
  if (btn) btn.addEventListener('click', () => {
    if (d.mistakes.length) location.hash = '#/problem/' + d.mistakes[0].id;
  });

  // Render charts
  drawCharts(d);
}

function drawCharts(d) {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = '#9aa3b2';
  Chart.defaults.font.family = '-apple-system, "Segoe UI", Roboto, Inter, sans-serif';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

  // 1. Activity line chart
  _dashCharts.push(new Chart(document.getElementById('chartActivity'), {
    type: 'line',
    data: {
      labels: d.activitySeries.map(x => x.date.slice(5)),
      datasets: [
        { label: 'Attempts', data: d.activitySeries.map(x => x.attempts),
          borderColor: '#7c9cff', backgroundColor: 'rgba(124,156,255,.15)', fill: true, tension: .3, pointRadius: 2 },
        { label: 'Passed', data: d.activitySeries.map(x => x.passed),
          borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,.10)', fill: true, tension: .3, pointRadius: 2 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } },
    },
  }));

  // 2. Per-step bar
  _dashCharts.push(new Chart(document.getElementById('chartSteps'), {
    type: 'bar',
    data: {
      labels: d.perStep.map(s => `S${s.id}`),
      datasets: [
        { label: 'Solved', data: d.perStep.map(s => s.solved), backgroundColor: '#4ade80' },
        { label: 'Playable', data: d.perStep.map(s => s.seeded - s.solved), backgroundColor: 'rgba(124,156,255,.5)' },
        { label: 'Coming', data: d.perStep.map(s => s.total - s.seeded), backgroundColor: 'rgba(255,255,255,.06)' },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { title: items => {
        const i = items[0].dataIndex; return d.perStep[i].name; }}}},
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    },
  }));

  // 3. By difficulty donut
  const diffEntries = Object.entries(d.byDifficulty);
  _dashCharts.push(new Chart(document.getElementById('chartDifficulty'), {
    type: 'doughnut',
    data: {
      labels: diffEntries.map(([k]) => k),
      datasets: [{
        data: diffEntries.map(([, v]) => v),
        backgroundColor: ['#4ade80', '#facc15', '#f87171'],
        borderWidth: 0,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { position: 'bottom' } },
    },
  }));

  // 4. Pass rate per topic horizontal bar
  const topics = d.passRateByTopic.slice(0, 10);
  _dashCharts.push(new Chart(document.getElementById('chartTopics'), {
    type: 'bar',
    data: {
      labels: topics.map(t => t.name),
      datasets: [{
        label: 'Pass rate %',
        data: topics.map(t => +(t.rate * 100).toFixed(1)),
        backgroundColor: topics.map(t => {
          const r = t.rate; return r >= 0.7 ? '#4ade80' : r >= 0.4 ? '#facc15' : '#f87171';
        }),
      }],
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: ctx => {
        const t = topics[ctx.dataIndex]; return `${t.passed}/${t.attempts} attempts`; }}}},
      scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } },
    },
  }));
}

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const days = Math.floor(h / 24);
  if (days < 30) return days + 'd ago';
  return new Date(iso).toISOString().slice(0, 10);
}

// ---------- ROADMAP ----------
async function renderRoadmap() {
  render('<div class="muted">Loading roadmap…</div>');
  const [steps, progress] = await Promise.all([api('/api/steps'), api('/api/progress')]);
  const solved = new Set(progress.solvedIds || []);

  const html = steps.map(step => {
    const sectionsHtml = (step.sections || []).map(sec => {
      if (!sec.problems?.length) return '';
      const rows = sec.problems.map(p => {
        const cls = solved.has(p.id) ? 'solved' : '';
        const isTutorial = !!p.tutorial;
        const disabled = (p.seeded || isTutorial) ? '' : 'disabled';
        const clickable = p.seeded ? `onclick="location.hash='#/problem/${p.id}'"` : '';
        let statusTag;
        if (p.seeded) statusTag = '<span class="status-tag seeded">Playable</span>';
        else if (isTutorial) statusTag = '<span class="status-tag tutorial">Tutorial</span>';
        else statusTag = '<span class="status-tag">Coming</span>';
        return `
          <div class="problem-row ${cls} ${disabled}" ${clickable}>
            <span class="dot"></span>
            <div>${esc(p.title)}</div>
            <span class="difficulty-tag difficulty-${p.difficulty || 'Easy'}">${p.difficulty || 'Easy'}</span>
            ${statusTag}
          </div>`;
      }).join('');
      return `<div class="section-title">${esc(sec.id)} · ${esc(sec.title)}</div>${rows}`;
    }).join('');

    const total = (step.sections || []).flatMap(s => s.problems || []).length;
    const isOpen = step.id <= 3 ? 'open' : ''; // auto-open first 3 steps
    return `
      <div class="step-block ${isOpen}" data-step="${step.id}">
        <header onclick="this.parentElement.classList.toggle('open')">
          <span class="caret">▸</span>
          <h4>Step ${step.id}. ${esc(step.title)}</h4>
          <span class="count">${total} problems</span>
        </header>
        <div class="body">${sectionsHtml || '<div class="muted" style="padding:12px 20px;">Coming soon — ask Claude to seed this step.</div>'}</div>
      </div>`;
  }).join('');

  render(`<h2>Roadmap — Striver A2Z (18 steps, ~455 problems)</h2>${html}`);
}

// ---------- PROBLEM ----------
let editor = null;

async function renderProblem(id) {
  render('<div class="muted">Loading problem…</div>');
  let p;
  try {
    p = await api('/api/problems/' + id);
  } catch (e) {
    render(`<h2>Not available yet</h2><p class="muted">This problem hasn't been seeded with a grader yet. Ask Claude to add <code>${esc(id)}</code>.</p><a href="#/roadmap">← Back to roadmap</a>`);
    return;
  }
  const progress = await api('/api/progress');
  const isSolved = progress.solvedIds?.includes(id);
  const hasRevealed = progress.revealedIds?.includes(id);

  const examplesHtml = (p.examples || []).map(ex => `
    <div class="example">
      <pre><b>Input:</b>\n${esc(ex.input)}\n\n<b>Output:</b>\n${esc(ex.output)}${ex.explanation ? '\n\n<b>Explanation:</b> ' + esc(ex.explanation) : ''}</pre>
    </div>`).join('');

  const hintsHtml = (p.hints || []).map((hint, i) => `
    <div class="hint-item locked" data-hint="${i}" onclick="this.classList.remove('locked'); this.classList.add('open'); this.innerHTML='${esc(hint).replace(/'/g, "\\'")}'.replace(/\\n/g,'<br>')">
      Click to reveal hint #${i + 1}
    </div>`).join('');

  const optimalSection = (isSolved || hasRevealed)
    ? (p.approaches || []).map(a => `
        <div class="approach">
          <header>${esc(a.name)} <span class="tag">${esc(a.time)} time · ${esc(a.space)} space</span></header>
          ${a.explanation ? `<div class="muted" style="margin-bottom:8px;">${esc(a.explanation)}</div>` : ''}
          <pre>${esc(a.code)}</pre>
        </div>`).join('')
    : `<div class="locked-optimal">🔒 Approaches & optimal solutions unlock after you solve it.<br><button class="ghost" id="revealBtn" style="margin-top:10px;">Give up — reveal anyway</button></div>`;

  const tagChips = (p.tags || []).map(t => `<span class="status-tag">${esc(t)}</span>`).join(' ');

  render(`
    <div class="problem-layout">
      <div>
        <div class="prob-header">
          <a href="#/roadmap" style="font-size:13px;">←</a>
          <h2>${esc(p.title)}</h2>
          <span class="difficulty-tag difficulty-${p.difficulty}">${p.difficulty}</span>
          ${isSolved ? '<span class="pass-badge ok">Solved</span>' : ''}
        </div>
        <div class="prob-body">
          <div>${tagChips}</div>
          <h4>Problem</h4>
          <p>${esc(p.statement)}</p>
          ${p.inputFormat ? `<h4>Input</h4><p>${esc(p.inputFormat)}</p>` : ''}
          ${p.outputFormat ? `<h4>Output</h4><p>${esc(p.outputFormat)}</p>` : ''}
          ${p.constraints ? `<h4>Constraints</h4><p>${esc(p.constraints)}</p>` : ''}
          <h4>Examples</h4>
          ${examplesHtml}
          <h4>Hints (click to reveal one at a time)</h4>
          ${hintsHtml || '<div class="muted">No hints for this one.</div>'}
          <h4>Approaches ${isSolved ? '' : '<span class="muted">(locked)</span>'}</h4>
          ${optimalSection}
          ${p.conceptIds?.length ? `<h4>Concepts</h4><div>${p.conceptIds.map(c => `<a href="#/concepts/${c}" class="status-tag seeded" style="margin-right:4px;">${esc(c)}</a>`).join('')}</div>` : ''}
        </div>
      </div>
      <div class="editor-pane">
        <div class="toolbar">
          <span class="muted">Main.java</span>
          <span class="spacer"></span>
          <span id="passBadge"></span>
          <button class="ghost" id="historyBtn">History</button>
          <button class="ghost" id="resetBtn">Reset</button>
          <button class="ghost" id="runBtn">Run samples</button>
          <button id="submitBtn">Submit</button>
        </div>
        <div class="editor-wrap"><textarea id="editor"></textarea></div>
        <div class="results" id="results"><span class="muted">Editor starts fresh every time. Submit to run all hidden tests — your code (pass or fail) is recorded.</span></div>
      </div>
    </div>
  `);

  const ta = document.getElementById('editor');
  ta.value = p.starter;
  editor = CodeMirror.fromTextArea(ta, {
    mode: 'text/x-java', theme: 'dracula', lineNumbers: true, indentUnit: 4, tabSize: 4,
    autoCloseBrackets: true, matchBrackets: true,
  });

  document.getElementById('runBtn').addEventListener('click', async () => {
    setBadge('run', 'Running');
    setResults('<div class="muted">Running samples…</div>');
    try {
      const r = await api('/api/run/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: editor.getValue() }) });
      renderCases(r.results);
      setBadge('');
    } catch (e) { setResults(`<div class="bad">Error: ${esc(e.message)}</div>`); setBadge(''); }
  });

  document.getElementById('submitBtn').addEventListener('click', async () => {
    setBadge('run', 'Checking');
    setResults('<div class="muted">Running all tests…</div>');
    try {
      const r = await api('/api/check/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: editor.getValue() }) });
      renderSubmitResult(r);
      refreshStreak();
      if (r.passed && !isSolved) setTimeout(() => renderProblem(id), 600); // reload to unlock approaches
    } catch (e) { setResults(`<div class="bad">Error: ${esc(e.message)}</div>`); setBadge(''); }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset to starter code?')) editor.setValue(p.starter);
  });

  document.getElementById('historyBtn').addEventListener('click', async () => {
    setResults('<div class="muted">Loading history…</div>');
    try {
      const list = await api('/api/attempts/' + id);
      renderHistory(list);
    } catch (e) {
      setResults(`<div class="bad">Error: ${esc(e.message)}</div>`);
    }
  });

  const rb = document.getElementById('revealBtn');
  if (rb) rb.addEventListener('click', async () => {
    if (!confirm('Reveal approaches without solving? This is logged.')) return;
    await fetch('/api/reveal/' + id, { method: 'POST' });
    renderProblem(id);
  });

  // ctrl/cmd + enter = submit
  editor.setOption('extraKeys', { 'Ctrl-Enter': () => document.getElementById('submitBtn').click(), 'Cmd-Enter': () => document.getElementById('submitBtn').click() });
}

function setBadge(kind, text) {
  const el = $('#passBadge'); if (!el) return;
  if (!kind) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="pass-badge ${kind}">${text || ''}</span>`;
}
function setResults(html) { const el = $('#results'); if (el) el.innerHTML = html; }
function renderCases(results) {
  if (!results?.length) { setResults('<span class="muted">No samples.</span>'); return; }
  const html = results.map((c, i) => {
    if (c.compileError) return `<div class="case fail"><div class="label">Compile error</div><pre>${esc(c.compileError)}</pre></div>`;
    const cls = c.passed ? 'pass' : 'fail';
    const tag = c.passed ? '<span class="ok">PASS</span>' : '<span class="bad">FAIL</span>';
    return `
      <div class="case ${cls}">
        <div class="label">Sample ${i + 1} — ${tag}</div>
        <div class="label">stdin</div><pre>${esc(c.stdin || '(none)')}</pre>
        <div class="label">expected</div><pre>${esc(c.expected)}</pre>
        <div class="label">your output</div><pre>${esc(c.stdout || '(empty)')}</pre>
        ${c.runtimeError ? `<div class="label">runtime error</div><pre>${esc(c.runtimeError)}</pre>` : ''}
      </div>`;
  }).join('');
  setResults(html);
}
function renderSubmitResult(r) {
  if (r.compileError) {
    setBadge('fail', 'Compile error');
    setResults(`<div class="case fail"><div class="label">Compile error</div><pre>${esc(r.compileError)}</pre></div>`);
    return;
  }
  if (r.passed) {
    setBadge('ok', `${r.passCount}/${r.total} passed`);
    setResults(`<div class="case pass"><div class="label"><span class="ok">ALL ${r.total} TESTS PASSED</span></div><p>Nice. Approaches unlocked below.</p></div>`);
  } else {
    setBadge('fail', `${r.passCount}/${r.total} passed`);
    const f = r.firstFail;
    const fHtml = f ? `
      <div class="case fail">
        <div class="label">Failed case #${f.index + 1}</div>
        <div class="label">stdin</div><pre>${esc(f.stdin || '(none)')}</pre>
        <div class="label">expected</div><pre>${esc(f.expected)}</pre>
        <div class="label">your output</div><pre>${esc(f.actual || '(empty)')}</pre>
        ${f.runtimeError ? `<div class="label">runtime error</div><pre>${esc(f.runtimeError)}</pre>` : ''}
      </div>` : '';
    setResults(`<p><b>${r.passCount}/${r.total}</b> tests passed.</p>${fHtml}`);
  }
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function renderHistory(list) {
  if (!list || list.length === 0) {
    setResults('<div class="muted">No attempts yet for this problem. Submit your code to start the history.</div>');
    return;
  }
  const reversed = list.slice().reverse();
  const html = reversed.map((a, i) => {
    const idx = list.length - i;
    const cls = a.passed ? 'pass' : 'fail';
    const tag = a.passed ? '<span class="ok">PASS</span>' : '<span class="bad">FAIL</span>';
    const aid = `att-${idx}`;
    return `
      <div class="case ${cls}">
        <div class="label">
          Attempt #${idx} · ${esc(timeAgo(a.ts))} · ${tag} · ${a.pass}/${a.total}
          <a href="javascript:void(0)" onclick="document.getElementById('${aid}').classList.toggle('hidden')" style="margin-left:8px; color: var(--accent);">show/hide code</a>
          <a href="javascript:void(0)" onclick="window.__loadAttempt(${idx - 1})" style="margin-left:8px; color: var(--accent);">load into editor</a>
        </div>
        <div id="${aid}" class="hidden"><pre>${esc(a.code || '(no code stored)')}</pre>
        ${a.firstFail ? `<div class="label">first failed test (#${a.firstFail.index + 1})</div><div class="label">expected</div><pre>${esc(a.firstFail.expected)}</pre><div class="label">your output</div><pre>${esc(a.firstFail.actual || '(empty)')}</pre>` : ''}</div>
      </div>`;
  }).join('');
  setResults(`<div style="margin-bottom:8px;"><b>${list.length}</b> attempt${list.length === 1 ? '' : 's'} recorded</div>${html}`);

  window.__loadAttempt = (idx) => {
    if (editor && list[idx]?.code) {
      editor.setValue(list[idx].code);
    }
  };
}

// ---------- CONCEPTS ----------
async function renderConcepts(id) {
  const list = await api('/api/concepts');
  const current = id || list[0]?.id;
  let body = '<div class="muted">Select a concept.</div>';
  if (current) {
    const c = await api('/api/concepts/' + current);
    body = conceptHtml(c);
  }
  render(`
    <h2>Concept cards</h2>
    <div class="concept-grid">
      <div class="concept-list">
        ${list.map(c => `<div class="item ${c.id === current ? 'active' : ''}" onclick="location.hash='#/concepts/${c.id}'">${esc(c.title)}</div>`).join('')}
      </div>
      <div class="concept-body">${body}</div>
    </div>
  `);
}
function conceptHtml(c) {
  const sections = [];
  sections.push(`<h3>${esc(c.id)}</h3><h2>${esc(c.title)}</h2>`);
  if (c.summary) sections.push(`<p>${esc(c.summary)}</p>`);
  if (c.whenToUse) sections.push(`<h4>When to use</h4><p>${esc(c.whenToUse)}</p>`);
  if (c.template) sections.push(`<h4>Template</h4><pre>${esc(c.template)}</pre>`);
  if (c.writeScanVariant) sections.push(`<h4>Write / scan variant</h4><pre>${esc(c.writeScanVariant)}</pre>`);
  if (c.keyFormulas) sections.push(`<h4>Key formulas</h4><ul>${c.keyFormulas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.cheatsheet) sections.push(`<h4>Cheatsheet</h4><ul>${c.cheatsheet.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.classics) sections.push(`<h4>Classic problems</h4><ul>${c.classics.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.reverseTrick) sections.push(`<h4>Three-step reverse trick</h4><ul>${c.reverseTrick.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.whyItWorks) sections.push(`<h4>Why it works</h4><p>${esc(c.whyItWorks)}</p>`);
  if (c.rightRotateByK) sections.push(`<h4>Right rotate</h4><p>${esc(c.rightRotateByK)}</p>`);
  if (c.stabilityMatters) sections.push(`<h4>Stability</h4><p>${esc(c.stabilityMatters)}</p>`);
  if (c.niceProperties) sections.push(`<h4>Properties</h4><ul>${c.niceProperties.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.mentalModel) sections.push(`<h4>Mental model</h4><ul>${c.mentalModel.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.recurrence) sections.push(`<h4>Recurrence</h4><p><code>${esc(c.recurrence)}</code></p>`);
  if (c.bottomUp) sections.push(`<h4>Bottom-up version</h4><p>${esc(c.bottomUp)}</p>`);
  if (c.pitfalls) sections.push(`<h4>Pitfalls</h4><ul>${c.pitfalls.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (c.complexity) sections.push(`<h4>Complexity</h4><p>${esc(c.complexity)}</p>`);
  if (c.whyRemember) sections.push(`<h4>Why remember</h4><p>${esc(c.whyRemember)}</p>`);
  if (c.relatedProblems?.length) sections.push(`<h4>Related problems</h4><div>${c.relatedProblems.map(id => `<a href="#/problem/${id}" class="status-tag seeded" style="margin-right:4px;">${esc(id)}</a>`).join('')}</div>`);
  return sections.join('');
}

// ---------- TRICKS ----------
async function renderTricks(id) {
  const list = await api('/api/tricks');
  const current = id || list[0]?.id;
  let body = '<div class="muted">No topics yet.</div>';
  if (current) {
    try {
      const t = await api('/api/tricks/' + current);
      body = trickTopicHtml(t);
    } catch (e) {
      body = `<div class="muted">Topic "${esc(current)}" not found.</div>`;
    }
  }
  render(`
    <h2>Tricks</h2>
    <div class="muted" style="margin-bottom:14px;">Mental shortcuts and memory tricks. More topics will be added as we cover new sections.</div>
    <div class="concept-grid">
      <div class="concept-list">
        ${list.map(c => `<div class="item ${c.id === current ? 'active' : ''}" onclick="location.hash='#/tricks/${c.id}'">${esc(c.icon ? c.icon + ' ' : '')}${esc(c.title)} <span class="muted" style="font-size:11px;">· ${c.count}</span></div>`).join('')}
      </div>
      <div class="concept-body">${body}</div>
    </div>
  `);
}

function trickTopicHtml(t) {
  const out = [];
  out.push(`<h2 style="margin-top:0;">${esc(t.icon ? t.icon + ' ' : '')}${esc(t.title)}</h2>`);
  if (t.tagline) out.push(`<p class="muted" style="font-size:14px; margin-top:-6px; margin-bottom:18px;">${esc(t.tagline)}</p>`);
  for (const trick of (t.tricks || [])) {
    out.push(`
      <div class="trick-card">
        <h3 style="margin:0 0 4px; font-size:16px; color: var(--text); text-transform:none; letter-spacing:0;">${esc(trick.title)}</h3>
        ${trick.summary ? `<div class="muted" style="font-size:13px; margin-bottom:10px;">${esc(trick.summary)}</div>` : ''}
        <div class="trick-body">${trick.html || ''}</div>
      </div>
    `);
  }
  return out.join('');
}

// ---------- DRILL ----------
let drillDeck = null;
let drillIdx = 0;
let drillStats = { correct: 0, seen: 0 };

async function renderDrill() {
  if (!drillDeck) {
    const all = await api('/api/flashcards');
    drillDeck = shuffle(all.slice());
    drillIdx = 0;
    drillStats = { correct: 0, seen: 0 };
  }
  if (!drillDeck.length) { render('<h2>Drill</h2><p class="muted">No flashcards yet.</p>'); return; }
  const card = drillDeck[drillIdx % drillDeck.length];

  let body = '';
  if (card.type === 'mcq') {
    body = `<div class="choices">${card.choices.map((c, i) => `<div class="choice" data-i="${i}">${esc(c)}</div>`).join('')}</div>`;
  } else if (card.type === 'short') {
    body = `<input type="text" id="answerInput" placeholder="Type your answer and press Enter" autocomplete="off" />`;
  } else if (card.type === 'fill') {
    body = `<pre>${esc(card.template || '').replace(/____+/g, '<span style="color:var(--warn);">____</span>')}</pre><input type="text" id="answerInput" placeholder="Fill in the blank" autocomplete="off" />`;
  }

  render(`
    <h2>Drill mode</h2>
    <div class="drill-card">
      <div class="topic">${esc(card.topic)} · card ${drillIdx + 1}</div>
      <div class="q">${esc(card.question)}</div>
      ${body}
      <div id="explanation"></div>
      <div class="drill-controls">
        <button class="ghost" id="skipBtn">Skip</button>
        <button id="nextBtn" style="display:none;">Next →</button>
      </div>
      <div class="drill-stats">
        <span>Correct: <b>${drillStats.correct}</b></span>
        <span>Seen: <b>${drillStats.seen}</b></span>
        <span>Accuracy: <b>${drillStats.seen ? Math.round(100 * drillStats.correct / drillStats.seen) : 0}%</b></span>
      </div>
    </div>
  `);

  if (card.type === 'mcq') {
    document.querySelectorAll('.choice').forEach(el => {
      el.addEventListener('click', () => {
        const i = +el.dataset.i;
        document.querySelectorAll('.choice').forEach(x => x.style.pointerEvents = 'none');
        const correct = i === card.correct;
        el.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) document.querySelector(`.choice[data-i="${card.correct}"]`)?.classList.add('correct');
        finishCard(correct, card.explanation);
      });
    });
  } else {
    const input = document.getElementById('answerInput');
    input?.focus();
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = input.value.trim().toLowerCase();
        const targets = (card.accepted || [card.answer || '']).map(x => String(x).toLowerCase().trim());
        const correct = targets.some(t => val === t || val.replace(/\s+/g, ' ') === t.replace(/\s+/g, ' '));
        input.style.borderColor = correct ? 'var(--ok)' : 'var(--err)';
        input.disabled = true;
        if (!correct) {
          const expected = (card.accepted?.[0] || card.answer);
          document.getElementById('explanation').innerHTML = `<div class="explanation"><b>Expected:</b> <code>${esc(expected)}</code><br>${esc(card.explanation || '')}</div>`;
        } else {
          document.getElementById('explanation').innerHTML = `<div class="explanation"><b>Correct!</b> ${esc(card.explanation || '')}</div>`;
        }
        drillStats.seen++; if (correct) drillStats.correct++;
        document.getElementById('nextBtn').style.display = '';
      }
    });
  }

  document.getElementById('nextBtn')?.addEventListener('click', () => { drillIdx++; renderDrill(); });
  document.getElementById('skipBtn')?.addEventListener('click', () => { drillIdx++; renderDrill(); });
}
function finishCard(correct, explanation) {
  drillStats.seen++; if (correct) drillStats.correct++;
  document.getElementById('explanation').innerHTML = `<div class="explanation">${correct ? '<b>Correct!</b> ' : '<b>Not quite. </b>'}${esc(explanation || '')}</div>`;
  document.getElementById('nextBtn').style.display = '';
}
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
