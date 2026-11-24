// Typewriter notes.
// Receives a typed sheet from the typewriter page and emails it to the site owner (via Resend).
// A note sent with "pin it up" is also stored as pending. The email carries a private link where the owner
// pins it, keeps it private or deletes it. Only pinned notes are served to the public board.
//
//   POST /notes    from the typewriter page
//   GET  /board    pinned notes, newest first, for board.html
//   GET  /manage   the owner's page for one note (id + secret token in the link); its buttons POST back to it

const MAX_BODY = 8 * 1024 * 1024;   // the whole JSON, PDF included
const MAX_PDF = 6 * 1024 * 1024;    // base64 characters
const MAX_LINES = 300;
const PER_HOUR = 5;                 // notes from one visitor per hour
const PER_DAY = 90;                 // notes in all per day: Resend's free plan stops at 100 emails a day
const BOARD_MAX = 200;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsFor(req, env);
    try {
      if (req.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
      if (url.pathname === '/notes') {
        if (req.method !== 'POST') return json({ error: 'method' }, 405, cors);
        if (!cors) return json({ error: 'origin' }, 403);
        return await receive(req, env, url, cors);
      }
      if (url.pathname === '/board' && req.method === 'GET') return await board(env, cors);
      if (url.pathname === '/manage' && (req.method === 'GET' || req.method === 'POST')) return await manage(req, env, url);
      return new Response(url.pathname === '/' ? 'Typewriter notes.\n' : 'Not found.\n',
        { status: url.pathname === '/' ? 200 : 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    } catch (e) {
      console.error(e);
      return json({ error: 'server' }, 500, cors);
    }
  },
};

/* ---------------- receiving a note ---------------- */

async function receive(req, env, url, cors) {
  if ((+req.headers.get('content-length') || 0) > MAX_BODY) return json({ error: 'too big' }, 413, cors);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'too big' }, 413, cors);
  let p;
  try { p = JSON.parse(raw); } catch { return json({ error: 'json' }, 400, cors); }
  const note = clean(p);
  if (!note) return json({ error: 'invalid' }, 400, cors);

  // rate limit
  const now = Date.now(), who = await visitor(req, env);
  await env.DB.prepare('DELETE FROM hits WHERE at < ?').bind(now - 86400e3).run();
  const c = await env.DB.prepare('SELECT SUM(who = ?1 AND at > ?2) AS mine, COUNT(*) AS day FROM hits').bind(who, now - 3600e3).first();
  if ((c?.mine || 0) >= PER_HOUR || (c?.day || 0) >= PER_DAY) return json({ error: 'slow down' }, 429, cors);
  await env.DB.prepare('INSERT INTO hits (who, at) VALUES (?, ?)').bind(who, now).run();

  let manageUrl = null, id = null;
  if (note.mode === 'pin') {
    id = randomHex(8);
    const token = randomHex(24);
    await env.DB.prepare("INSERT INTO notes (id, token, status, name, text, sheet, created_at) VALUES (?, ?, 'pending', ?, ?, ?, ?)")
      .bind(id, token, note.name, note.text, JSON.stringify(note.sheet), new Date(now).toISOString()).run();
    manageUrl = `${url.origin}/manage?id=${id}&t=${token}`;
  }
  if (!(await sendEmail(env, note, manageUrl, new Date(now)))) {
    if (id) await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
    return json({ error: 'email' }, 502, cors);
  }
  return json({ ok: true }, 200, cors);
}

// Checks and normalises everything the page sent. The plain text is rebuilt from the sheet rather than trusted.
function clean(p) {
  if (!p || typeof p !== 'object') return null;
  const mode = p.mode === 'pin' || p.mode === 'email' ? p.mode : null;
  if (!mode) return null;
  const name = str(p.name).replace(/\s+/g, ' ').trim().slice(0, 80);
  let email = str(p.email).trim().slice(0, 200);
  if (email && !/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(email)) email = '';
  const sheet = cleanSheet(p.sheet);
  if (!sheet) return null;
  const text = sheetText(sheet);
  if (!text.trim()) return null;
  const pdf = typeof p.pdf === 'string' && p.pdf.length <= MAX_PDF && /^[A-Za-z0-9+/]+=*$/.test(p.pdf) ? p.pdf : null;
  return { mode, name, email, sheet, text, pdf };
}
const str = v => (typeof v === 'string' ? v : '');

// a cell is 0 (blank), one strike [char, dx, dy, rot, opacity], or a list of strikes (an overstrike), oldest first
function cleanSheet(s) {
  if (!s || !Array.isArray(s.lines) || !s.lines.length || s.lines.length > MAX_LINES) return null;
  const cols = Number.isInteger(s.cols) && s.cols >= 10 && s.cols <= 200 ? s.cols : 60;
  const lines = [];
  for (const l of s.lines) {
    if (!Array.isArray(l) || l.length > cols + 1) return null;
    const cells = l.map(cleanCell);
    while (cells.length && !cells[cells.length - 1]) cells.pop();
    lines.push(cells);
  }
  while (lines.length > 1 && !lines[lines.length - 1].length) lines.pop();
  return { cols, lines };
}
function cleanCell(c) {
  if (!Array.isArray(c)) return 0;
  if (Array.isArray(c[0])) {
    const s = c.slice(0, 8).map(cleanStrike).filter(Boolean);
    return s.length > 1 ? s : s[0] || 0;
  }
  return cleanStrike(c) || 0;
}
function cleanStrike(k) {
  if (!Array.isArray(k) || typeof k[0] !== 'string') return null;
  const ch = [...k[0]][0];
  if (!ch || !ch.trim() || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(ch)) return null;
  const n = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v * 1000) / 1000)) : d; };
  return [ch, n(k[1], -.2, .2, 0), n(k[2], -.2, .2, 0), n(k[3], -5, 5, 0), n(k[4], .3, 1, 1)];
}
const strikesOf = c => (!c ? [] : Array.isArray(c[0]) ? c : [c]);
const sheetText = s => s.lines.map(l => l.map(c => { const k = strikesOf(c); return k.length ? k[k.length - 1][0] : ' '; }).join('').replace(/\s+$/, '')).join('\n');

// The IP is never stored: only a keyed hash of it, and only for a day.
async function visitor(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode('hits:' + (env.RESEND_API_KEY || 'dev')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(ip))).slice(0, 12));
}

/* ---------------- the email ---------------- */

async function sendEmail(env, note, manageUrl, when) {
  const fromLine = note.name || note.email
    ? `From: ${note.name || '(no name)'}${note.email ? ` <${note.email}>` : ''}`
    : 'From: no name or email given';
  const sent = when.toUTCString();
  const text = [
    note.text, '', '--', fromLine, `Sent: ${sent}`,
    ...(note.pdf ? ['The page as typed is attached as a PDF.'] : []),
    ...(manageUrl ? ['', 'They asked for this to be pinned to the board. It stays hidden until you choose.', `Pin it or keep it private: ${manageUrl}`] : []),
    ...(note.email ? ['', 'Reply to this email to write back to them.'] : []),
  ].join('\n');
  const msg = {
    from: env.FROM_EMAIL || 'Typewriter <onboarding@resend.dev>',
    to: [env.TO_EMAIL],
    subject: `A typed note from ${note.name || 'someone'}${note.mode === 'pin' ? ', to pin up' : ''}`,
    text,
    html: emailHtml(note, manageUrl, fromLine, sent),
  };
  if (note.email) msg.reply_to = note.email;
  if (note.pdf) msg.attachments = [{ filename: `typed-note-${when.toISOString().slice(0, 10)}.pdf`, content: note.pdf }];

  if (env.DRY_RUN === '1') {   // local testing: `wrangler dev --var DRY_RUN:1`
    console.log('[dry run] would email:', JSON.stringify({ ...msg, html: '(html)', attachments: msg.attachments ? '(pdf)' : undefined }, null, 1));
    return true;
  }
  if (!env.RESEND_API_KEY || !env.TO_EMAIL) { console.error('RESEND_API_KEY or TO_EMAIL is not set'); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(msg),
  });
  if (!r.ok) { console.error('Resend refused:', r.status, await r.text()); return false; }
  return true;
}

function emailHtml(note, manageUrl, fromLine, sent) {
  const mono = "font-family:'Courier New',Courier,monospace";
  const btn = (href, label, bg, fg) =>
    `<a href="${esc(href)}" style="display:inline-block;padding:12px 22px;margin:0 8px 8px 0;border-radius:22px;background:${bg};color:${fg};text-decoration:none;${mono};font-size:15px">${label}</a>`;
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#1a1a1a">
<div style="max-width:640px;margin:0 auto">
<div style="background:#d8d1c2;color:#121110;padding:32px 28px;border-radius:6px;${mono};font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(note.text)}</div>
<p style="color:#b8b3a8;${mono};font-size:14px;line-height:1.6;margin:18px 0">${esc(fromLine)}<br>Sent ${esc(sent)}${note.pdf ? '<br>The page as typed is attached as a PDF.' : ''}${note.email ? '<br>Reply to this email to write back to them.' : ''}</p>
${manageUrl ? `<p style="color:#e6e0d2;${mono};font-size:14px;line-height:1.6;margin:24px 0 12px">They asked for this to be pinned to the board. It stays hidden until you choose.</p>
<p style="margin:0">${btn(manageUrl + '&do=pin', 'Pin it to the board', '#f2a03d', '#1b1408')}${btn(manageUrl + '&do=private', 'Keep it private', '#3a3632', '#e6e0d2')}</p>` : ''}
</div></body></html>`;
}

/* ---------------- the board ---------------- */

async function board(env, cors) {
  const { results } = await env.DB.prepare("SELECT id, name, sheet, created_at FROM notes WHERE status = 'pinned' ORDER BY pinned_at DESC LIMIT ?").bind(BOARD_MAX).all();
  const notes = results.map(r => ({ id: r.id, name: r.name, date: r.created_at, sheet: JSON.parse(r.sheet) }));
  return json({ notes }, 200, cors, { 'cache-control': 'public, max-age=60' });
}

/* ---------------- the owner's page for one note ---------------- */

// Opening the link never changes anything (mail scanners open links on their own); only the buttons do.
async function manage(req, env, url) {
  let id, t, action = null, suggest = url.searchParams.get('do');
  if (req.method === 'POST') {
    const f = await req.formData();
    id = f.get('id'); t = f.get('t'); action = f.get('action');
  } else {
    id = url.searchParams.get('id'); t = url.searchParams.get('t');
  }
  id = str(id); t = str(t);
  const note = id && t ? await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first() : null;
  if (!note || !(await same(t, note.token))) return page('Not found', '<p>This link does not match a note. It may have been deleted.</p>', 404);

  let done = '';
  if (action === 'pin') {
    await env.DB.prepare("UPDATE notes SET status = 'pinned', pinned_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    note.status = 'pinned'; done = 'Pinned. It is on the board now.';
  } else if (action === 'private') {
    await env.DB.prepare("UPDATE notes SET status = 'private', pinned_at = NULL WHERE id = ?").bind(id).run();
    note.status = 'private'; done = 'Kept private. It will not appear on the board.';
  } else if (action === 'delete') {
    await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
    return page('Deleted', '<p class="done">Deleted for good. The email in your inbox is now the only copy.</p>');
  } else if (action) {
    return page('Hmm', '<p>That is not something this page can do.</p>', 400);
  }

  const state = { pending: 'Waiting for you. Not on the board.', pinned: 'Pinned on the board.', private: 'Kept private. Not on the board.' }[note.status] || note.status;
  const hidden = `<input type="hidden" name="id" value="${esc(id)}"><input type="hidden" name="t" value="${esc(t)}">`;
  const button = (a, label) => `<button name="action" value="${a}" class="${!done && a === suggest ? 'go' : ''}${a === 'delete' ? ' del' : ''}">${label}</button>`;
  const body = `
${done ? `<p class="done">${esc(done)}</p>` : ''}
<p class="meta">${note.name ? `From ${esc(note.name)}` : 'No name given'} · ${esc(new Date(note.created_at).toUTCString())}<br>Status: ${esc(state)}</p>
<div class="sheet">${esc(note.text)}</div>
<form method="post" action="/manage">${hidden}
${note.status !== 'pinned' ? button('pin', 'Pin it to the board') : ''}
${note.status !== 'private' ? button('private', note.status === 'pinned' ? 'Take it down' : 'Keep it private') : ''}
${button('delete', 'Delete for good')}
</form>
${env.BOARD_URL ? `<p class="meta"><a href="${esc(env.BOARD_URL)}">See the board</a></p>` : ''}`;
  return page('A typed note', body);
}

function page(title, body, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
body{margin:0;padding:32px 16px;background:#1a1a1a;color:#b8b3a8;font:15px/1.6 'Courier New',Courier,monospace}
main{max-width:660px;margin:0 auto}
h1{font-size:18px;font-weight:normal;color:#e6e0d2;margin:0 0 16px}
.sheet{background:#d8d1c2;color:#121110;padding:28px 24px;border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere;margin:16px 0 22px}
.meta{font-size:14px;color:#a9a49b}
.done{color:#f2a03d}
a{color:#f2a03d}
form{display:flex;flex-wrap:wrap;gap:10px}
button{font:inherit;min-height:44px;padding:0 20px;border-radius:22px;border:1px solid #5a544c;background:#2a2724;color:#e6e0d2;cursor:pointer}
button.go{background:#f2a03d;border-color:#f2a03d;color:#1b1408}
button.del{border-color:transparent;background:none;color:#a9a49b;text-decoration:underline}
button:focus-visible{outline:2px solid #f2a03d;outline-offset:2px}
</style></head><body><main><h1>${esc(title)}</h1>${body}</main></body></html>`, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'referrer-policy': 'no-referrer',
      'cache-control': 'no-store',
      'x-frame-options': 'DENY',
      'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
    },
  });
}

/* ---------------- helpers ---------------- */

function corsFor(req, env) {
  const o = req.headers.get('origin');
  const allowed = str(env.ALLOWED_ORIGINS).split(',').map(s => s.trim()).filter(Boolean);
  if (!o || !allowed.includes(o)) return null;
  return {
    'access-control-allow-origin': o,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}
function json(obj, status = 200, cors = null, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...(cors || { vary: 'origin' }), ...extra } });
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const hex = b => [...b].map(x => x.toString(16).padStart(2, '0')).join('');
const randomHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
async function same(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map(s => crypto.subtle.digest('SHA-256', enc.encode(s))));
  return crypto.subtle.timingSafeEqual(x, y);
}
