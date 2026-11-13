/* Локальный запуск без Vercel: статика + /api + файлы на диске вместо Blob.  node dev/server.js  → http://localhost:4173 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
process.env.BLOB_MOCK_DIR = process.env.BLOB_MOCK_DIR || path.join(__dirname, '.data');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'local-dev-secret-local-dev-secret';
process.env.SETUP_CODE = process.env.SETUP_CODE || 'setup';
const L = require('../api/_lib.js');
const TYPES = { html: 'text/html; charset=utf-8', js: 'application/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', jpg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', pdf: 'application/pdf' };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/dev-upload' && req.method === 'POST') { // замена прямой загрузки в Blob
    if (!(await L.currentUser(req))) { res.statusCode = 401; return res.end('{}'); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const name = String(u.searchParams.get('pathname')).replace(/\.\./g, '').replace(/(\.[a-z0-9]+)$/i, '-' + Date.now().toString(36) + '$1');
    const w = await L.blob.put(name, Buffer.concat(chunks), { remember: false });
    res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ url: w.url, pathname: name }));
  }
  if (u.pathname.indexOf('/api/') === 0) {
    const f = path.join(ROOT, 'api', u.pathname.slice(5).replace(/[^a-z0-9-]/gi, '') + '.js');
    if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('no api'); }
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { req.body = {}; }
    req.query = Object.fromEntries(u.searchParams);
    return require(f)(req, res);
  }
  let p = decodeURIComponent(u.pathname);
  let f = p.indexOf('/dev-blob/') === 0 ? path.join(process.env.BLOB_MOCK_DIR, p.slice(10)) : path.join(ROOT, p);
  if (p === '/admin/blob-client.js') f = path.join(__dirname, 'blob-client.mock.js');
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!f.startsWith(ROOT) && !f.startsWith(process.env.BLOB_MOCK_DIR) || !fs.existsSync(f)) { res.statusCode = 404; return res.end('not found'); }
  res.setHeader('Content-Type', TYPES[path.extname(f).slice(1)] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 4173, () => console.log('http://localhost:' + (process.env.PORT || 4173)));
