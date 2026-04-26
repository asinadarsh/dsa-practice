import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_MD = path.join(__dirname, 'step-1-2.md');
const OUTPUT_HTML = path.join(__dirname, 'step-1-2.html');
const OUTPUT_PDF = path.join(__dirname, 'step-1-2.pdf');

const md = fs.readFileSync(INPUT_MD, 'utf8');
const bodyHtml = marked.parse(md, { breaks: false, gfm: true });

const template = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>DSA Notes — Step 1 & 2</title>
<style>
  @page { size: A4; margin: 14mm 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Inter, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1e2b;
    max-width: 180mm;
    margin: 0 auto;
  }
  h1 { color: #1a1e2b; font-size: 24pt; margin: 0 0 6pt; border-bottom: 2px solid #2b3146; padding-bottom: 6pt; page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { color: #2b3146; font-size: 17pt; margin: 18pt 0 6pt; border-bottom: 1px solid #d5dae3; padding-bottom: 4pt; page-break-after: avoid; }
  h3 { color: #3c4763; font-size: 13pt; margin: 14pt 0 4pt; page-break-after: avoid; }
  h4 { color: #3c4763; font-size: 11.5pt; margin: 10pt 0 3pt; page-break-after: avoid; }
  p { margin: 4pt 0 8pt; }
  strong { color: #1a1e2b; }
  em { color: #4a5273; }
  blockquote {
    border-left: 3px solid #7c9cff;
    background: #f3f5fa;
    margin: 8pt 0;
    padding: 6pt 12pt;
    color: #414a68;
    font-style: italic;
  }
  ul, ol { margin: 4pt 0 8pt; padding-left: 22pt; }
  li { margin: 2pt 0; }
  code {
    background: #eef1f6;
    color: #1a1e2b;
    padding: 1pt 4pt;
    border-radius: 3px;
    font-family: "Fira Code", ui-monospace, Menlo, Consolas, monospace;
    font-size: 10pt;
  }
  pre {
    background: #1b1f2e;
    color: #e6e8ef;
    padding: 10pt 12pt;
    border-radius: 6px;
    overflow-x: auto;
    font-family: "Fira Code", ui-monospace, Menlo, Consolas, monospace;
    font-size: 9.5pt;
    line-height: 1.45;
    page-break-inside: avoid;
    margin: 6pt 0 10pt;
  }
  pre code { background: transparent; color: inherit; padding: 0; font-size: 9.5pt; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 8pt 0 12pt;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid #c9d0dc;
    padding: 4pt 7pt;
    text-align: left;
    vertical-align: top;
  }
  th { background: #eef1f6; font-weight: 600; }
  tr:nth-child(even) td { background: #f8f9fc; }
  hr { border: 0; border-top: 1px solid #d5dae3; margin: 16pt 0; }
  a { color: #3456c9; text-decoration: none; }
  .front {
    text-align: center;
    padding: 60pt 20pt 40pt;
    border-bottom: 2px solid #2b3146;
    margin-bottom: 16pt;
  }
  .front h1 {
    border: 0;
    font-size: 32pt;
    margin: 0 0 8pt;
    page-break-before: avoid;
  }
  .front .subtitle {
    font-size: 13pt;
    color: #4a5273;
  }
  .front .meta {
    margin-top: 20pt;
    font-size: 10pt;
    color: #6a7289;
  }
</style>
</head>
<body>
<div class="front">
  <h1>Striver's A2Z — Notes</h1>
  <div class="subtitle">Step 1 · Learn the Basics<br/>Step 2 · Sorting Techniques</div>
  <div class="meta">Java reference · Problem statement · Approach · Code · Complexity</div>
</div>
${bodyHtml}
</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, template, 'utf8');
console.log(`HTML written: ${OUTPUT_HTML} (${(template.length / 1024).toFixed(1)} KB)`);

// Render to PDF via headless Edge (no extra downloads)
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fileUrl = 'file:///' + OUTPUT_HTML.replace(/\\/g, '/');
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${OUTPUT_PDF}`,
  fileUrl,
];

console.log('Rendering PDF via headless Edge…');
execFile(EDGE, args, { timeout: 60000 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Edge failed:', err.message);
    console.error('STDERR:', (stderr || '').slice(0, 400));
    console.log('\nFallback: open the HTML in your browser and Print → Save as PDF.');
    console.log('  ' + OUTPUT_HTML);
    process.exit(1);
  }
  try {
    const size = fs.statSync(OUTPUT_PDF).size;
    console.log(`PDF written: ${OUTPUT_PDF} (${(size / 1024).toFixed(1)} KB)`);
  } catch {
    console.error('PDF was not produced. Use the HTML fallback:', OUTPUT_HTML);
    process.exit(1);
  }
});
