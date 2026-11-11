// Theme toggle (remembered per browser), search on the archive, keyboard nav and iframe sizing on the reader.
(() => {
  const root = document.documentElement;
  const KEY = 'hr-theme';
  const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const set = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} };
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const effective = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

  const frame = document.querySelector('.frame');
  const applyTheme = () => {
    const t = effective();
    if (frame) frame.style.colorScheme = t; // the email's own dark styles follow this
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.textContent = t === 'dark' ? '☀ light' : '☾ dark';
  };
  const saved = get();
  if (saved) root.dataset.theme = saved;
  applyTheme();
  systemDark.addEventListener('change', applyTheme);
  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const next = effective() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    set(next);
    applyTheme();
  });

  // Reader: fit the iframe to the email, arrow keys move between issues
  if (frame) {
    const fit = () => {
      try {
        const doc = frame.contentDocument;
        if (doc?.body) frame.style.height = doc.documentElement.scrollHeight + 'px';
      } catch {}
    };
    frame.addEventListener('load', () => {
      fit();
      try {
        new ResizeObserver(fit).observe(frame.contentDocument.body);
        frame.contentDocument.addEventListener('keydown', onKey);
      } catch {}
    });
    addEventListener('resize', fit);
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const a = document.querySelector(`[data-key="${e.key}"]`);
      if (a) location.href = a.href;
    }
    addEventListener('keydown', onKey);
  }

  // Archive: full-text search over every issue
  const input = document.querySelector('#q');
  if (!input) return;
  const status = document.querySelector('.search-status');
  const cards = [...document.querySelectorAll('.issue')];
  let index = null;
  const load = () => (index ??= fetch('./search.json').then((r) => r.json()).catch(() => []));
  input.addEventListener('focus', load, { once: true });
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape' && document.activeElement === input) { input.value = ''; run(); input.blur(); }
  });

  const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const snippet = (body, terms) => {
    const lower = body.toLowerCase();
    const at = lower.indexOf(terms[0]);
    if (at < 0) return '';
    const start = Math.max(0, at - 60);
    let s = (start ? '…' : '') + body.slice(start, at + 120) + '…';
    s = escHtml(s);
    return s.replace(new RegExp(`(${terms.map(escRe).join('|')})`, 'gi'), '<mark>$1</mark>');
  };

  let timer;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  async function run() {
    const q = input.value.trim().toLowerCase();
    cards.forEach((c) => c.querySelector('.hit')?.remove());
    if (!q) {
      cards.forEach((c) => (c.hidden = false));
      document.querySelectorAll('.month').forEach((m) => (m.hidden = false));
      status.textContent = '';
      return;
    }
    const data = await load();
    const terms = q.split(/\s+/).filter(Boolean);
    const byDate = new Map(data.map((d) => [d.date, d]));
    let shown = 0;
    cards.forEach((c) => {
      const d = byDate.get(c.dataset.date);
      const hay = d ? `${d.label} ${d.preheader} ${d.labels.join(' ')} ${d.body}`.toLowerCase() : '';
      const ok = terms.every((t) => hay.includes(t));
      c.hidden = !ok;
      if (ok) {
        shown++;
        const s = snippet(d.body, terms);
        if (s) {
          const p = document.createElement('span');
          p.className = 'hit';
          p.innerHTML = s;
          c.querySelector('.issue-pre').before(p);
        }
      }
    });
    document.querySelectorAll('.month').forEach((m) => (m.hidden = !m.querySelector('.issue:not([hidden])')));
    status.textContent = shown ? `${shown} issue${shown === 1 ? '' : 's'} mention “${input.value.trim()}”` : `Nothing yet about “${input.value.trim()}”`;
  }
})();
