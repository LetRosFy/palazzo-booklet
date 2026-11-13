/* Админка: одна функция, действие передаётся в ?a=…
   Роли: owner — всё, включая учётные записи; editor — правка карточек и загрузка файлов. */
'use strict';
const crypto = require('crypto');
const L = require('./_lib.js');

const EXT = /\.(pdf|ai|eps|indd|idml|psd|svg|png|jpe?g|webp|tiff?|zip)$/i;
const MAX_FILE = 200 * 1024 * 1024;

function send(res, status, data, cookie) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (cookie) res.setHeader('Set-Cookie', cookie);
  res.end(JSON.stringify(data));
}
const fail = (s, m) => { throw L.httpError(s, m); };

/* ───── проверка данных каталога ───── */
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\x00-\x08\x0b-\x1f]/g, '').trim().slice(0, max) : '');
const link = v => { v = str(v, 600); return /^(https:\/\/|\/)[^\s"'<>\\]*$/.test(v) ? v : ''; };
const num = (v, min, max) => { v = Number(v); return isFinite(v) ? Math.min(max, Math.max(min, v)) : min; };
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
function cleanModel(m) {
  m = m || {};
  const type = ['slab', 'sheets', 'cards', 'postcards', 'envelope', 'folder', 'notebook', 'keycard', 'tent', 'bag', 'mug'].indexOf(m.type) >= 0 ? m.type : 'slab';
  if (type === 'mug') return { type, r: num(m.r, 10, 300), h: num(m.h, 10, 600) };
  const o = { type, w: num(m.w, 10, 2000), h: num(m.h, 10, 2000) };
  if (type === 'bag') o.d = num(m.d, 10, 1000);
  if (type === 'slab' || type === 'notebook') o.t = num(m.t, type === 'slab' ? 0.2 : 4, 200);
  if (type === 'slab') { o.face = ['card', 'letter', 'envelope', 'center', 'postcard'].indexOf(m.face) >= 0 ? m.face : 'center'; if (m.r) o.r = num(m.r, 0, 100); }
  return o;
}
function cleanItem(it) {
  if (!it || !ID.test(it.id || '')) fail(400, 'Некорректный идентификатор носителя');
  const o = {
    id: it.id, hidden: !!it.hidden, group: ID.test(it.group || '') ? it.group : 'office',
    name: str(it.name, 80) || 'Без названия', size: str(it.size, 80), desc: str(it.desc, 600),
    status: ['draft', 'approved', 'print'].indexOf(it.status) >= 0 ? it.status : 'draft',
    front: link(it.front), back: link(it.back)
  };
  if (it.custom) { o.custom = true; o.model = cleanModel(it.model); }
  if (it.fixedBase) o.fixedBase = str(it.fixedBase, 20);
  if (Array.isArray(it.spec)) o.spec = it.spec.slice(0, 20).map(r => [str(r && r[0], 60), str(r && r[1], 200)]).filter(r => r[0] || r[1]);
  if (Array.isArray(it.variants)) o.variants = it.variants.slice(0, 24).map(v => ({
    name: str(v && v.name, 80) || 'Вариант', note: str(v && v.note, 160),
    base: /^([a-z]{2,20}|#[0-9a-f]{6})$/i.test((v && v.base) || '') ? v.base : 'ivory',
    logo: ['gold', 'silver', 'blind', 'print'].indexOf(v && v.logo) >= 0 ? v.logo : 'gold',
    coat: v && v.coat === 'gloss' ? 'gloss' : 'matte', front: link(v && v.front), back: link(v && v.back)
  }));
  if (Array.isArray(it.files)) o.files = it.files.slice(0, 30).map(f => ({
    name: str(f && f.name, 80) || 'Файл', kind: str(f && f.kind, 120), url: link(f && f.url),
    date: str(f && f.date, 10), bytes: Math.round(num(f && f.bytes, 0, 1e10))
  }));
  return o;
}
function cleanCatalog(c) {
  if (!c || !Array.isArray(c.items)) fail(400, 'Некорректные данные каталога');
  const seen = {}, items = c.items.slice(0, 100).map(cleanItem).filter(i => (seen[i.id] ? false : (seen[i.id] = true)));
  return { items, order: (Array.isArray(c.order) ? c.order : []).filter(id => seen[id]).slice(0, 100) };
}

/* ───── вход ───── */
const tries = new Map();
function throttle(req) {
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local', now = Date.now();
  const t = tries.get(ip) || { n: 0, at: now };
  if (now - t.at > 10 * 60000) { t.n = 0; t.at = now; }
  t.n++; tries.set(ip, t);
  if (t.n > 10) fail(429, 'Слишком много попыток. Подождите 10 минут.');
  return () => tries.delete(ip);
}
function newUser(b, role) {
  const login = str(b.login, 40).toLowerCase(), name = str(b.name, 60), pw = typeof b.password === 'string' ? b.password : '';
  if (!/^[a-z0-9._@-]{3,40}$/.test(login)) fail(400, 'Логин: от 3 символов, латиница, цифры, точка, дефис');
  if (pw.length < 8) fail(400, 'Пароль: не короче 8 символов');
  return { id: crypto.randomBytes(6).toString('hex'), login, name: name || login, role, hash: L.hashPassword(pw), pv: 0, created: new Date().toISOString().slice(0, 10) };
}

async function state(user) {
  const c = await L.blob.get(L.CATALOG, true);
  const out = { auth: true, user: L.publicUser(user), catalog: c ? JSON.parse(c.body.toString('utf8')) : null, etag: c ? c.etag : null,
    mediaPrefix: L.MEDIA, baseUrl: L.baseUrl(), maxFile: MAX_FILE };
  if (user.role === 'owner') out.users = (await L.readUsers(true)).users.map(L.publicUser);
  return out;
}

const actions = {
  async state(req, res, user) {
    if (!user) return send(res, 200, { auth: false, needsSetup: !(await L.readUsers(true)).users.length });
    send(res, 200, await state(user));
  },
  async setup(req, res, user, b) {
    const done = throttle(req), code = process.env.SETUP_CODE || '';
    const cur = await L.readUsers(true);
    if (cur.users.length) fail(403, 'Владелец уже создан. Войдите под своей учётной записью.');
    if (!code || !L.same(str(b.code, 80), code)) fail(403, 'Неверный код установки');
    const u = newUser(b, 'owner');
    await L.writeUsers([u], cur.etag); done();
    send(res, 200, await state(u), L.issue(u));
  },
  async login(req, res, user, b) {
    const done = throttle(req);
    const u = (await L.readUsers()).users.find(x => x.login === str(b.login, 40).toLowerCase());
    if (!u || !L.checkPassword(typeof b.password === 'string' ? b.password : '', u.hash)) fail(401, 'Неверный логин или пароль');
    done();
    send(res, 200, await state(u), L.issue(u));
  },
  async logout(req, res) { send(res, 200, { ok: true }, L.clear()); },

  async save(req, res, user, b) {
    const next = cleanCatalog(b.catalog), cur = await L.blob.get(L.CATALOG, true);
    const prev = cur ? JSON.parse(cur.body.toString('utf8')) : null;
    if (prev && !b.etag) fail(409, 'conflict');
    if (prev && user.role !== 'owner') {
      const ids = next.items.map(i => i.id);
      if (prev.items.some(i => ids.indexOf(i.id) < 0)) fail(403, 'Удалять носители может только владелец');
    }
    const today = new Date().toISOString().slice(0, 10);
    next.rev = ((prev && prev.rev) || 0) + 1;
    next.updatedAt = new Date().toISOString(); next.updatedBy = user.name;
    next.log = [{ at: next.updatedAt, by: user.name }].concat((prev && prev.log) || []).slice(0, 20);
    next.backupDay = prev ? prev.backupDay : null;
    if (prev && prev.backupDay !== today) { // одна резервная копия в день — перед первой правкой
      await L.blob.put(L.SYS + 'backup/catalog-' + today + '.json', cur.body, { contentType: 'application/json', remember: false });
      next.backupDay = today;
    }
    const body = JSON.stringify(next);
    if (body.length > 400000) fail(413, 'Каталог слишком большой');
    const w = await L.blob.put(L.CATALOG, body, { contentType: 'application/json', ifMatch: prev ? b.etag : undefined });
    send(res, 200, { ok: true, etag: w.etag, catalog: next });
  },

  async upload(req, res, user, b) {
    if (L.MOCK) fail(400, 'В локальном режиме загрузка идёт через /dev-upload');
    const { handleUpload } = require('@vercel/blob/client');
    const out = await handleUpload({
      body: b, request: req,
      onBeforeGenerateToken: async pathname => {
        if (pathname.indexOf(L.MEDIA) !== 0 || pathname.indexOf('..') >= 0 || !EXT.test(pathname)) throw new Error('Такой файл загрузить нельзя');
        return { addRandomSuffix: true, maximumSizeInBytes: MAX_FILE, cacheControlMaxAge: 31536000 };
      }
    });
    send(res, 200, out);
  },
  async 'delete-file'(req, res, user, b) {
    const base = L.baseUrl() + L.MEDIA;
    const urls = (Array.isArray(b.urls) ? b.urls : []).filter(u => typeof u === 'string' && u.indexOf(base) === 0 && u.indexOf('..') < 0).slice(0, 50);
    await L.blob.del(urls);
    send(res, 200, { ok: true, deleted: urls.length });
  },
  async usage(req, res) { send(res, 200, await L.blob.usage()); },

  async password(req, res, user, b) {
    const next = typeof b.next === 'string' ? b.next : '';
    if (!L.checkPassword(typeof b.current === 'string' ? b.current : '', user.hash)) fail(403, 'Текущий пароль указан неверно');
    if (next.length < 8) fail(400, 'Пароль: не короче 8 символов');
    const cur = await L.readUsers(true), u = cur.users.find(x => x.id === user.id);
    if (!u) fail(409, 'conflict');
    u.hash = L.hashPassword(next); u.pv = (u.pv || 0) + 1;
    await L.writeUsers(cur.users, cur.etag);
    send(res, 200, { ok: true }, L.issue(u));
  },
  async 'user-add'(req, res, user, b) {
    const cur = await L.readUsers(true), u = newUser(b, b.role === 'owner' ? 'owner' : 'editor');
    if (cur.users.length >= 30) fail(400, 'Слишком много учётных записей');
    if (cur.users.some(x => x.login === u.login)) fail(400, 'Такой логин уже есть');
    cur.users.push(u); await L.writeUsers(cur.users, cur.etag);
    send(res, 200, { users: cur.users.map(L.publicUser) });
  },
  async 'user-update'(req, res, user, b) {
    const cur = await L.readUsers(true), u = cur.users.find(x => x.id === b.id);
    if (!u) fail(404, 'Учётная запись не найдена');
    if (b.name != null) u.name = str(b.name, 60) || u.login;
    if (b.role === 'owner' || b.role === 'editor') {
      if (u.role === 'owner' && b.role === 'editor' && cur.users.filter(x => x.role === 'owner').length < 2) fail(400, 'Нужен хотя бы один владелец');
      u.role = b.role;
    }
    if (b.password != null) {
      if (typeof b.password !== 'string' || b.password.length < 8) fail(400, 'Пароль: не короче 8 символов');
      u.hash = L.hashPassword(b.password); u.pv = (u.pv || 0) + 1;
    }
    await L.writeUsers(cur.users, cur.etag);
    send(res, 200, { users: cur.users.map(L.publicUser) }, u.id === user.id ? L.issue(u) : undefined);
  },
  async 'user-del'(req, res, user, b) {
    const cur = await L.readUsers(true), u = cur.users.find(x => x.id === b.id);
    if (!u) fail(404, 'Учётная запись не найдена');
    if (u.id === user.id) fail(400, 'Свою учётную запись удалить нельзя');
    const rest = cur.users.filter(x => x.id !== u.id);
    if (!rest.some(x => x.role === 'owner')) fail(400, 'Нужен хотя бы один владелец');
    await L.writeUsers(rest, cur.etag);
    send(res, 200, { users: rest.map(L.publicUser) });
  }
};
const OPEN = ['state', 'setup', 'login', 'logout'], OWNER = ['user-add', 'user-update', 'user-del'], GET = ['state', 'usage'];

module.exports = async function handler(req, res) {
  try {
    const a = String((req.query && req.query.a) || new URL(req.url, 'http://x').searchParams.get('a') || '');
    const fn = actions[a];
    if (!fn) fail(404, 'Неизвестное действие');
    if (GET.indexOf(a) >= 0 ? req.method !== 'GET' : req.method !== 'POST') fail(405, 'Метод не поддерживается');
    if (req.method === 'POST' && req.headers['x-pda'] !== '1') fail(403, 'Запрос отклонён');
    const user = await L.currentUser(req);
    if (!user && OPEN.indexOf(a) < 0) fail(401, 'Войдите заново');
    if (OWNER.indexOf(a) >= 0 && user.role !== 'owner') fail(403, 'Доступно только владельцу');
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    await fn(req, res, user, b || {});
  } catch (e) {
    const s = e.status || 500;
    if (s >= 500) console.error('admin', e);
    send(res, s, { error: e.message === 'conflict' ? 'Данные изменились в другом окне или у другого человека. Обновите страницу и повторите.' : s >= 500 && !e.status ? 'Ошибка сервера. Попробуйте ещё раз.' : e.message, conflict: e.message === 'conflict' || undefined });
  }
};
