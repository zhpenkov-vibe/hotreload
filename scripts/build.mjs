// Builds the Hot Reload hub from issues/*.html into dist/.
// Zero dependencies: `node scripts/build.mjs`. Set SITE_URL for absolute feed links.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ISSUES = join(root, 'issues');
const SITE = join(root, 'site');
const OUT = join(root, 'dist');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ZW = /[​-‍﻿]/g;
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(ZW, '').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function parseIssue(file) {
  const date = file.replace(/\.html$/, '');
  const html = readFileSync(join(ISSUES, file), 'utf8');
  const d = new Date(date + 'T12:00:00Z');
  const weekday = WEEKDAYS[d.getUTCDay()];
  const label = `${weekday} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;

  const preheader = text((html.match(/<div style="display:none;[^"]*">([\s\S]*?)<\/div>/) || [])[1] || '');
  const top = [...html.matchAll(/<p style="[^"]*font-size:20px; line-height:1\.25; font-weight:700;[^"]*">([\s\S]*?)<\/p>/g)]
    .slice(0, 3)
    .map((m) => text(m[1]));
  const updates = +((html.match(/compiled 3 headlines, (\d+) updates/) || [])[1] || 0);
  const labels = [...html.matchAll(/<b class="hr-txt"[^>]*>([\s\S]*?)<\/b>/g)].map((m) => text(m[1]));
  // Readable text only: headlines, summaries, rows, tip, side project, quote (no link labels or section chrome)
  const body = [...html.matchAll(/<p [^>]*word-break:break-word[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => text(m[1].replace(/<a [\s\S]*?<\/a>/g, '')))
    .join(' · ');
  const friday = html.includes('deepDive()');

  return { date, weekday, label, year: d.getUTCFullYear(), month: d.getUTCMonth(), preheader, top, updates, labels, body, friday, html };
}

// Opens links in a new tab and loads the fonts the template names, so the
// browser preview matches the intended design. The repo copy stays untouched.
function forHub(html) {
  return html.replace(
    /<head>/,
    `<head>\n<base target="_blank">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap">`
  );
}

const issues = readdirSync(ISSUES)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .sort()
  .reverse()
  .map(parseIssue);

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'issues'), { recursive: true });
cpSync(join(SITE, 'assets'), join(OUT, 'assets'), { recursive: true });

const tpl = (name) => readFileSync(join(SITE, name), 'utf8');
const fill = (t, vars) => t.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
const CANDY = ['pink', 'blue', 'green', 'purple', 'yellow'];

// Raw issues + reader pages
const readerTpl = tpl('reader.html');
issues.forEach((it, i) => {
  writeFileSync(join(OUT, 'issues', `${it.date}.html`), forHub(it.html));
  const newer = issues[i - 1];
  const older = issues[i + 1];
  mkdirSync(join(OUT, it.date), { recursive: true });
  writeFileSync(
    join(OUT, it.date, 'index.html'),
    fill(readerTpl, {
      TITLE: esc(`${it.label} · Hot Reload`),
      DESCRIPTION: esc(it.preheader),
      DATE: it.date,
      LABEL: esc(it.label),
      NEWER: newer ? `<a class="btn" href="../${newer.date}/" rel="prev" data-key="ArrowRight" aria-label="Newer issue: ${esc(newer.label)}">${esc(newer.label.split(' ').slice(1).join(' '))} →</a>` : `<span class="btn" aria-disabled="true">Latest</span>`,
      OLDER: older ? `<a class="btn" href="../${older.date}/" rel="next" data-key="ArrowLeft" aria-label="Older issue: ${esc(older.label)}">← ${esc(older.label.split(' ').slice(1).join(' '))}</a>` : `<span class="btn" aria-disabled="true">First</span>`,
    })
  );
});

// Archive
const card = (it, i) => `
<li class="issue" data-date="${it.date}" data-candy="${CANDY[i % CANDY.length]}">
  <a class="issue-link" href="./${it.date}/">
    <span class="issue-meta"><span class="pill">${esc(it.label.toUpperCase())}</span>${it.friday ? '<span class="tag">deep dive</span>' : ''}<span class="tag">${it.updates} updates</span></span>
    <ol class="issue-top">${it.top.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    <span class="issue-pre">${esc(it.preheader)}</span>
  </a>
</li>`;

let lastMonth = '';
const groups = issues
  .map((it, i) => {
    const m = `${MONTHS_LONG[it.month]} ${it.year}`;
    const head = m !== lastMonth ? `${lastMonth ? '</ul></section>' : ''}<section class="month"><h2 class="month-title">${m}</h2><ul class="issues">` : '';
    lastMonth = m;
    return head + card(it, i);
  })
  .join('') + (issues.length ? '</ul></section>' : '');

const latest = issues[0];
writeFileSync(
  join(OUT, 'index.html'),
  fill(tpl('index.html'), {
    COUNT: issues.length,
    LATEST_HREF: latest ? `./${latest.date}/` : '#',
    LATEST_LABEL: latest ? esc(latest.label) : '—',
    LATEST_TOP: latest ? latest.top.map((t) => `<li>${esc(t)}</li>`).join('') : '',
    LATEST_PRE: latest ? esc(latest.preheader) : 'No issues yet.',
    ISSUES: groups || '<p class="empty">No issues yet. The first one lands tomorrow at 08:00.</p>',
  })
);

// Search index (loaded lazily) and a redirect to the newest issue
writeFileSync(
  join(OUT, 'search.json'),
  JSON.stringify(issues.map(({ date, label, top, labels, preheader, body }) => ({ date, label, top, labels, preheader, body })))
);
mkdirSync(join(OUT, 'latest'), { recursive: true });
writeFileSync(
  join(OUT, 'latest', 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Hot Reload · latest</title><meta http-equiv="refresh" content="0; url=../${latest ? latest.date + '/' : ''}">`
);

// RSS
const abs = (p) => (SITE_URL ? `${SITE_URL}/${p}` : p);
writeFileSync(
  join(OUT, 'feed.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<title>Hot Reload</title><link>${esc(abs(''))}</link>
<description>Fresh frontend, design systems &amp; AI news, every morning.</description>
${issues
  .slice(0, 30)
  .map(
    (it) => `<item><title>${esc(it.label)}</title><link>${esc(abs(it.date + '/'))}</link><guid>${esc(abs(it.date + '/'))}</guid>
<pubDate>${new Date(it.date + 'T06:00:00Z').toUTCString()}</pubDate>
<description>${esc(it.top.map((t, n) => `${n + 1}. ${t}`).join(' · '))}</description></item>`
  )
  .join('\n')}
</channel></rss>
`
);

writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`Built ${issues.length} issue(s) → dist/`);
