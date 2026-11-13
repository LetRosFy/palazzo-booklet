/* Временная проверка хранилища в настоящем окружении Vercel. Удаляется после проверки. */
'use strict';
const L = require('./_lib.js');
module.exports = async function (req, res) {
  const out = { steps: [] }, step = (k, v) => out.steps.push([k, v]);
  try {
    const code = (req.query && req.query.code) || '';
    if (!process.env.SETUP_CODE || !L.same(code, process.env.SETUP_CODE)) { res.statusCode = 403; return res.end('no'); }
    const name = L.SYS + 'selftest.json', t0 = Date.now();
    const w1 = await L.blob.put(name, JSON.stringify({ n: 1, t0 }), { contentType: 'application/json', remember: false });
    step('put1', w1);
    const g1 = await L.blob.get(name, true); step('get1', { body: g1 && g1.body.toString(), etag: g1 && g1.etag, etagMatchesPut: g1 && g1.etag === w1.etag });
    const w2 = await L.blob.put(name, JSON.stringify({ n: 2, t0 }), { contentType: 'application/json', ifMatch: w1.etag, remember: false });
    step('put2 ifMatch ok', w2);
    const g2 = await L.blob.get(name, true); step('get2 fresh (cache-buster)', { body: g2.body.toString(), etag: g2.etag, fresh: g2.etag === w2.etag });
    const g2b = await L.blob.get(name, false); step('get2 plain url', { body: g2b.body.toString(), fresh: g2b.etag === w2.etag });
    try { await L.blob.put(name, 'x', { ifMatch: w1.etag, remember: false }); step('put3 stale etag', 'ACCEPTED (bad)'); } catch (e) { step('put3 stale etag', 'rejected: ' + e.status + ' ' + e.message); }
    // прямая загрузка из браузера: токен клиента + загрузка им
    const C = require('@vercel/blob/client');
    const token = await C.generateClientTokenFromReadWriteToken({ token: process.env.BLOB_READ_WRITE_TOKEN, pathname: L.MEDIA + 'selftest/pixel.jpg', addRandomSuffix: true, maximumSizeInBytes: 1e6, validUntil: Date.now() + 60000 });
    const up = await C.put(L.MEDIA + 'selftest/pixel.jpg', Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex'), { access: 'public', token });
    step('client upload', { url: up.url, ourPrefix: up.url.indexOf(L.baseUrl() + L.MEDIA) === 0 });
    const f = await fetch(up.url, { headers: { origin: 'https://example.com' } });
    step('media fetch', { status: f.status, cors: f.headers.get('access-control-allow-origin'), type: f.headers.get('content-type'), disp: f.headers.get('content-disposition'), cache: f.headers.get('cache-control') });
    const us = await L.blob.usage(); step('usage', us);
    await L.blob.del([up.url, w2.url]); step('cleanup', 'ok');
    out.baseUrl = L.baseUrl(); out.ms = Date.now() - t0;
  } catch (e) { out.error = String(e && e.stack || e); }
  res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(out, null, 1));
};
