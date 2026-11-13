/* Данные каталога для публичных страниц: подключается как <script src="/api/catalog"> перед media.js.
   Если админкой ещё не пользовались или хранилище недоступно — сайт работает на встроенном каталоге. */
'use strict';
const L = require('./_lib.js');
module.exports = async function handler(req, res) {
  let data = null;
  try {
    const c = await L.blob.get(L.CATALOG);
    if (c) { const j = JSON.parse(c.body.toString('utf8')); data = { rev: j.rev, items: j.items, order: j.order }; }
  } catch (e) { console.error('catalog', e); }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=120');
  res.end('window.PDA_DATA=' + JSON.stringify(data).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '') + ';');
};
