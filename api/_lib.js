/* Общая серверная часть админки: хранилище (Vercel Blob), шифрование, сессии, учётные записи.
   Файлы с «_» в начале Vercel не превращает в отдельные функции. */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MOCK = process.env.BLOB_MOCK_DIR || '';           // локальная разработка: файлы на диске вместо Blob
const NS = (process.env.PDA_NS || '').replace(/[^a-z0-9-]/gi, '');
const SYS = '_sys' + (NS ? '-' + NS : '') + '/';       // служебные данные: каталог и учётные записи
const MEDIA = 'media' + (NS ? '-' + NS : '') + '/';    // загруженные макеты и файлы для печати
const LIMIT_BYTES = 1024 * 1024 * 1024;                 // место под файлы на тарифе Hobby

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 24) throw httpError(500, 'Не задан SESSION_SECRET');
  return s;
}
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

/* ───── хранилище ───── */
function token() { return process.env.BLOB_READ_WRITE_TOKEN || ''; }
function baseUrl() {
  if (MOCK) return '/dev-blob/';
  if (process.env.BLOB_BASE_URL) return process.env.BLOB_BASE_URL.replace(/\/?$/, '/');
  const m = /^vercel_blob_rw_([a-z0-9]+)_/i.exec(token());
  if (!m) throw httpError(500, 'Хранилище Blob не подключено к проекту');
  return 'https://' + m[1].toLowerCase() + '.public.blob.vercel-storage.com/';
}
const warm = new Map(); // то, что эта же функция только что записала: CDN отдаёт новое не сразу
const blob = {
  async get(name, fresh) {
    const w = warm.get(name);
    if (w && Date.now() - w.at < 90000) return { body: w.body, etag: w.etag };
    if (MOCK) {
      const f = path.join(MOCK, name);
      if (!fs.existsSync(f)) return null;
      const body = fs.readFileSync(f);
      return { body, etag: '"' + crypto.createHash('md5').update(body).digest('hex') + '"' };
    }
    const r = await fetch(baseUrl() + name + (fresh ? '?v=' + Date.now() : ''), { cache: 'no-store' });
    if (r.status === 404) return null;
    if (!r.ok) throw httpError(502, 'Хранилище не отвечает (' + r.status + ')');
    return { body: Buffer.from(await r.arrayBuffer()), etag: r.headers.get('etag') || '' };
  },
  async put(name, body, opts) {
    opts = opts || {};
    body = Buffer.isBuffer(body) ? body : Buffer.from(body);
    let etag, url;
    if (MOCK) {
      const f = path.join(MOCK, name);
      if (opts.ifMatch) {
        const cur = await blob.get(name);
        if (!cur || cur.etag !== opts.ifMatch) throw httpError(409, 'conflict');
      }
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, body);
      etag = '"' + crypto.createHash('md5').update(body).digest('hex') + '"'; url = baseUrl() + name;
    } else {
      const { put, BlobPreconditionFailedError } = require('@vercel/blob');
      try {
        const r = await put(name, body, {
          access: 'public', addRandomSuffix: false, allowOverwrite: true,
          contentType: opts.contentType || 'application/octet-stream', cacheControlMaxAge: 60,
          ...(opts.ifMatch ? { ifMatch: opts.ifMatch } : {})
        });
        etag = r.etag; url = r.url;
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError) throw httpError(409, 'conflict');
        throw e;
      }
    }
    if (opts.remember !== false) warm.set(name, { body, etag, at: Date.now() });
    return { etag, url };
  },
  async del(urls) {
    urls = [].concat(urls).filter(Boolean);
    if (!urls.length) return;
    if (MOCK) { urls.forEach(u => { try { fs.unlinkSync(path.join(MOCK, decodeURIComponent(u.replace(baseUrl(), '')))); } catch (e) {} }); return; }
    await require('@vercel/blob').del(urls);
  },
  async usage() {
    let bytes = 0, count = 0;
    if (MOCK) {
      (function walk(d) { if (!fs.existsSync(d)) return; fs.readdirSync(d).forEach(n => { const f = path.join(d, n), s = fs.statSync(f); if (s.isDirectory()) walk(f); else { bytes += s.size; count++; } }); })(MOCK);
    } else {
      const { list } = require('@vercel/blob');
      let cursor;
      do { const r = await list({ cursor, limit: 1000 }); r.blobs.forEach(b => { bytes += b.size; count++; }); cursor = r.hasMore ? r.cursor : null; } while (cursor);
    }
    return { bytes, count, limit: LIMIT_BYTES };
  }
};

/* ───── шифрование и подписи ───── */
function key(purpose) { return crypto.createHash('sha256').update(secret() + '|' + purpose).digest(); }
function seal(obj) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key('users'), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]);
}
function unseal(buf) {
  const d = crypto.createDecipheriv('aes-256-gcm', key('users'), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8'));
}
function sign(text) { return crypto.createHmac('sha256', key('session')).update(text).digest('base64url'); }
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return 'scrypt$' + salt.toString('base64url') + '$' + crypto.scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 }).toString('base64url');
}
function checkPassword(pw, stored) {
  const p = String(stored || '').split('$');
  if (p.length !== 3 || p[0] !== 'scrypt') return false;
  return same(crypto.scryptSync(pw, Buffer.from(p[1], 'base64url'), 32, { N: 16384, r: 8, p: 1 }).toString('base64url'), p[2]);
}

/* ───── учётные записи ───── */
const USERS = SYS + 'users.bin', CATALOG = SYS + 'catalog.json';
async function readUsers(fresh) {
  const r = await blob.get(USERS, fresh);
  if (!r) return { users: [], etag: null };
  return { users: unseal(r.body).users || [], etag: r.etag };
}
async function writeUsers(users, etag) {
  return blob.put(USERS, seal({ users }), { ifMatch: etag || undefined });
}
function publicUser(u) { return { id: u.id, login: u.login, name: u.name, role: u.role, created: u.created }; }

/* ───── сессии ───── */
const COOKIE = 'pda_s', WEEK = 7 * 24 * 3600;
function cookieHeader(value, maxAge) {
  return COOKIE + '=' + value + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + maxAge + (MOCK ? '' : '; Secure');
}
function issue(user) {
  const body = Buffer.from(JSON.stringify({ u: user.id, v: user.pv || 0, e: Math.floor(Date.now() / 1000) + WEEK })).toString('base64url');
  return cookieHeader(body + '.' + sign(body), WEEK);
}
function clear() { return cookieHeader('', 0); }
async function currentUser(req) {
  const m = new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)').exec(req.headers.cookie || '');
  if (!m) return null;
  const parts = m[1].split('.');
  if (parts.length !== 2 || !same(sign(parts[0]), parts[1])) return null;
  let s; try { s = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!s || s.e < Date.now() / 1000) return null;
  const { users } = await readUsers();
  const u = users.find(x => x.id === s.u);
  return u && (u.pv || 0) === s.v ? u : null;
}

module.exports = { MOCK, SYS, MEDIA, USERS, CATALOG, LIMIT_BYTES, blob, baseUrl, httpError, same, hashPassword, checkPassword,
  readUsers, writeUsers, publicUser, issue, clear, currentUser };
