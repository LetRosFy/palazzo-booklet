/* Палаццо де Агой · платформа фирменных носителей.
   Каталог (ITEMS), параметрические 3D-модели и текстуры-заглушки. Общий файл для главной (/) и страницы носителя (/item/).
   Чтобы добавить носитель — допишите объект в ITEMS. Когда появится макет, замените заглушку: art: { front: '/media/…jpg', back: … }. */
(function () {
  'use strict';
  var T = window.THREE;

  /* Палитра из брендбука */
  var PALETTE = [
    { id: 'ivory', name: 'Soft Ivory', hex: '#FEEEDA' },
    { id: 'bordeaux', name: 'Bordeaux', hex: '#401216' },
    { id: 'sand', name: 'Sand Beige', hex: '#D8CBB3' },
    { id: 'greyblue', name: 'Cool Grey Blue', hex: '#B7C1CF' },
    { id: 'graphite', name: 'Graphite Black', hex: '#131313' },
    { id: 'petrol', name: 'Deep Petrol', hex: '#002F31', print: true },
    { id: 'navy', name: 'Midnight Navy', hex: '#00142F', print: true }
  ];
  var FOIL = { gold: ['#8a6424', '#e9cf8f', '#a67c3c'], silver: ['#7d8087', '#eef0f3', '#a4a8b0'] };
  var LOGO = [
    { id: 'gold', name: 'Золото' }, { id: 'silver', name: 'Серебро' },
    { id: 'blind', name: 'Блинт' }, { id: 'print', name: 'Печать' }
  ];
  var COAT = [{ id: 'matte', name: 'Матовое' }, { id: 'gloss', name: 'Глянец' }];

  var GROUPS = [
    { id: 'editions', name: 'Издания' },
    { id: 'office', name: 'Деловая документация' },
    { id: 'guest', name: 'Для гостей' },
    { id: 'gifts', name: 'Сувениры и упаковка' }
  ];

  /* Варианты-заглушки: одинаковый набор для всех носителей, пока нет макетов */
  var STUB_VARIANTS = [
    { name: 'Айвори · золото', note: 'Светлая основа, логотип фольгой', base: 'ivory', logo: 'gold', coat: 'matte' },
    { name: 'Бордо · золото', note: 'Тёмная основа, логотип фольгой', base: 'bordeaux', logo: 'gold', coat: 'matte' },
    { name: 'Песок · печать', note: 'Логотип печатью в бордо', base: 'sand', logo: 'print', coat: 'matte' }
  ];
  /* Статус носителя: draft → approved → print. Меняется одним полем status у носителя. */
  var STATUS = { draft: 'Макет в работе', approved: 'Утверждён', print: 'Готов к печати' };
  var TBD = 'Будет указано с макетом';
  function stubFiles() {
    return [
      /* когда файл готов: добавьте url: '/files/…' и date: 'ДД.ММ.ГГГГ' */
      { name: 'Печатный PDF', kind: 'PDF/X-4 · вылеты · метки' },
      { name: 'Исходник макета', kind: 'AI / INDD' },
      { name: 'Слои отделки', kind: 'Фольга · конгрев · высечка' },
      { name: 'Превью', kind: 'PNG' }
    ];
  }
  function stub(id, group, name, size, model, extra) {
    var it = {
      id: id, group: group, name: name, size: size, model: model, stub: true, status: 'draft',
      desc: 'Макет-заглушка: форма и размеры настоящие, оформление условное. Заменится, когда появится утверждённый макет.',
      spec: [['Формат', size], ['Материал', TBD], ['Печать', TBD], ['Отделка', TBD], ['Тираж', TBD]],
      variants: STUB_VARIANTS, files: stubFiles()
    };
    for (var k in extra || {}) it[k] = extra[k];
    return it;
  }

  var ITEMS = [
    { id: 'booklet', group: 'editions', name: 'Буклет', size: '270 × 245 мм', href: '/booklet/', count: 'Развороты', status: 'draft',
      model: { type: 'book', w: 270, h: 245, t: 7, front: '/cover-front.jpg', back: '/cover-back.jpg', spine: '/spine.jpg' },
      desc: 'Имиджевый буклет: листается в 3D, с выбором материала обложки.' },
    { id: 'covers', group: 'editions', name: 'Обложки буклета', size: '270 × 245 мм', href: '/cover/', count: 'Варианты обложек', status: 'draft',
      model: { type: 'book', w: 270, h: 245, t: 15, front: '/cv/n01.art.jpg', back: null, spine: null, tint: '#EFE6D3' },
      desc: 'Варианты обложки с примеркой фольги, ламинации и обреза.' },
    stub('card', 'office', 'Визитка', '90 × 50 мм', { type: 'cards', w: 90, h: 50 }),
    stub('letterhead', 'office', 'Фирменный бланк', 'A4 · 210 × 297 мм', { type: 'sheets', w: 210, h: 297, face: 'letter' }, { fixedBase: 'ivory', variants: [
      { name: 'Логотип золотом', note: 'Шапка фольгой', base: 'ivory', logo: 'gold', coat: 'matte' },
      { name: 'Логотип печатью', note: 'Шапка в бордо, для офисной печати', base: 'ivory', logo: 'print', coat: 'matte' },
      { name: 'Логотип блинтом', note: 'Слепое тиснение', base: 'ivory', logo: 'blind', coat: 'matte' }] }),
    stub('envelope', 'office', 'Конверт', 'E65 · 220 × 110 мм', { type: 'envelope', w: 220, h: 110 }),
    stub('folder', 'office', 'Папка', 'под A4 · 220 × 310 мм', { type: 'folder', w: 220, h: 310 }),
    stub('notebook', 'office', 'Блокнот', 'A5 · 148 × 210 мм', { type: 'notebook', w: 148, h: 210, t: 15 }),
    stub('keycard', 'guest', 'Ключ-карта', '86 × 54 мм', { type: 'keycard', w: 86, h: 54 }),
    stub('postcard', 'guest', 'Открытка', 'A6 · 148 × 105 мм', { type: 'postcards', w: 148, h: 105 }),
    stub('calendar', 'guest', 'Настольный календарь', '210 × 148 мм', { type: 'tent', w: 210, h: 148 }),
    stub('bag', 'gifts', 'Бумажный пакет', '240 × 320 × 100 мм', { type: 'bag', w: 240, h: 320, d: 100 }),
    stub('mug', 'gifts', 'Кружка', '330 мл · ⌀ 82 мм', { type: 'mug', r: 41, h: 95 })
  ];

  /* ───── цвет ───── */
  function hexOf(id) { for (var i = 0; i < PALETTE.length; i++) if (PALETTE[i].id === id) return PALETTE[i].hex; return id && id[0] === '#' ? id : '#FEEEDA'; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(hex) { var c = rgb(hex); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function mix(a, b, k) { var x = rgb(a), y = rgb(b); return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * k); }).join(',') + ')'; }

  /* ───── рисование граней ───── */
  var SERIF = 'Georgia, "Times New Roman", serif', SANS = 'Inter, system-ui, sans-serif';
  function spaced(ctx, text, cx, y, size, track, font, weight) {
    ctx.font = (weight || 400) + ' ' + size + 'px ' + (font || SERIF);
    var w = 0, i, ws = [];
    for (i = 0; i < text.length; i++) { ws[i] = ctx.measureText(text[i]).width; w += ws[i] + (i < text.length - 1 ? track * size : 0); }
    var x = cx - w / 2;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (i = 0; i < text.length; i++) { ctx.fillText(text[i], x, y); x += ws[i] + track * size; }
    return w;
  }
  /* Условный логотип: словесный знак в две строки с линейкой. Настоящий логотип придёт с макетами. */
  function wordmark(ctx, cx, cy, width) {
    var s = width / 7.4;
    spaced(ctx, 'ПАЛАЦЦО', cx, cy - s * 0.42, s, 0.26);
    ctx.fillRect(cx - width * 0.19, cy + s * 0.2, width * 0.38, Math.max(1, s * 0.035));
    spaced(ctx, 'ДЕ АГОЙ', cx, cy + s * 0.78, s * 0.46, 0.5);
  }
  function lines(ctx, x, y, w, n, gap, th) { for (var i = 0; i < n; i++) ctx.fillRect(x, y + i * gap, w * (i === n - 1 ? 0.6 : 1), th); }
  function frame(ctx, W, H, m, th) { ctx.lineWidth = th; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m); }

  /* painter(ctx, W, H, k): k.ink() включает «логотипный» слой (фольга/блинт/печать), k.sub() — обычную печать. В проходах маски sub ничего не рисует. */
  var FACES = {
    center: function (c, W, H, k) { k.ink(); wordmark(c, W / 2, H / 2, Math.min(W * 0.52, H * 0.9)); },
    card: function (c, W, H, k, back) {
      if (back) { k.ink(); wordmark(c, W / 2, H / 2, W * 0.5); return; }
      k.ink(); wordmark(c, W * 0.32, H * 0.33, W * 0.44);
      k.sub(); c.globalAlpha = 0.5; lines(c, W * 0.1, H * 0.68, W * 0.3, 3, H * 0.07, H * 0.016); c.globalAlpha = 1;
    },
    letter: function (c, W, H, k, back) {
      if (back) return;
      k.ink(); wordmark(c, W / 2, H * 0.085, W * 0.26);
      k.sub(); c.globalAlpha = 0.16; lines(c, W * 0.14, H * 0.24, W * 0.72, 16, H * 0.03, H * 0.0035);
      c.globalAlpha = 0.5; lines(c, W * 0.14, H * 0.92, W * 0.2, 2, H * 0.014, H * 0.004); lines(c, W * 0.66, H * 0.92, W * 0.2, 2, H * 0.014, H * 0.004); c.globalAlpha = 1;
    },
    envelope: function (c, W, H, k, back) {
      k.ink(); wordmark(c, W * 0.17, H * 0.2, W * 0.2);
      k.sub(); c.globalAlpha = 0.3; c.lineWidth = H * 0.006; c.strokeRect(W * 0.57, H * 0.5, W * 0.34, H * 0.3); c.globalAlpha = 1;
    },
    postcard: function (c, W, H, k, back) {
      if (back) {
        k.sub(); c.globalAlpha = 0.3; c.fillRect(W / 2, H * 0.14, W * 0.003, H * 0.72); lines(c, W * 0.58, H * 0.5, W * 0.32, 4, H * 0.09, H * 0.006); c.strokeRect(W * 0.8, H * 0.12, W * 0.1, H * 0.2); c.globalAlpha = 1;
        k.ink(); wordmark(c, W * 0.25, H * 0.82, W * 0.2); return;
      }
      k.ink(); frame(c, W, H, H * 0.07, H * 0.006); wordmark(c, W / 2, H / 2, W * 0.46);
    },
    calendar: function (c, W, H, k) {
      k.ink(); wordmark(c, W * 0.25, H * 0.5, W * 0.3);
      k.sub(); c.globalAlpha = 0.5;
      var x0 = W * 0.52, y0 = H * 0.26, cw = W * 0.058, ch = H * 0.1, i;
      spaced(c, 'ЯНВАРЬ 2027', x0 + cw * 3.4, H * 0.15, H * 0.05, 0.3, SANS, 500);
      for (i = 0; i < 31; i++) { var col = (i + 4) % 7, row = Math.floor((i + 4) / 7); c.font = '400 ' + H * 0.045 + 'px ' + SANS; c.textAlign = 'center'; c.fillText(String(i + 1), x0 + col * cw + cw / 2, y0 + row * ch + ch / 2); }
      c.globalAlpha = 1;
    },
    mark: function (c, W, H, k) { k.ink(); wordmark(c, W / 2, H * 0.9, Math.min(W, H) * 0.22); },
    keyback: function (c, W, H, k) {
      k.sub(); c.globalAlpha = 0.85; c.fillStyle = '#1b1715'; c.fillRect(0, H * 0.12, W, H * 0.2); c.globalAlpha = 0.45; k.sub(); lines(c, W * 0.08, H * 0.5, W * 0.5, 3, H * 0.075, H * 0.014); c.globalAlpha = 1;
      k.ink(); wordmark(c, W * 0.8, H * 0.8, W * 0.2);
    },
    envback: function (c, W, H, k) {
      k.sub(); c.globalAlpha = 0.16; c.lineWidth = H * 0.006; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.5, H * 0.42); c.lineTo(W, H); c.stroke(); c.globalAlpha = 1;
      k.ink(); wordmark(c, W / 2, H * 0.84, W * 0.16);
    },
    wrap: function (c, W, H, k) { k.ink(); wordmark(c, W / 2, H / 2, W * 0.17); }
  };

  function st(opts) {
    var base = hexOf(opts.base), dark = lum(base) < 0.45, logo = opts.logo || 'gold';
    return { base: base, dark: dark, logo: logo, coat: opts.coat || 'matte',
      sub: dark ? '#FEEEDA' : '#401216',
      print: dark ? '#FEEEDA' : '#401216' };
  }
  /* цвета заданы в sRGB, а свет считается в линейном пространстве */
  function lin(c) { return new T.Color(c).convertSRGBToLinear(); }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; }
  function tex(cv, srgb) {
    var t = new T.CanvasTexture(cv); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }
  /* Зерно бумаги: один тайл шума, им заливаются карты цвета и рельефа */
  var GRAIN = null;
  function grain() {
    if (GRAIN) return GRAIN;
    var n = 256, c = canvas(n, n), x = c.getContext('2d'), d = x.createImageData(n, n), seed = 7, i, v;
    for (i = 0; i < n * n; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; v = 118 + (seed >>> 24) / 255 * 20; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
    // лёгкие волокна
    x.globalAlpha = 0.5;
    for (i = 0; i < 260; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; var px = (seed >>> 8) % n, py = (seed >>> 16) % n, a = (seed & 255) / 255 * 6.28; x.strokeStyle = (seed & 1) ? '#8c8c8c' : '#747474'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9); x.stroke(); }
    return (GRAIN = c);
  }
  var GRAIN_TEX = {};
  function grainTex(rep) { var k = rep.toFixed(1); if (!GRAIN_TEX[k]) { var t = new T.CanvasTexture(grain()); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); GRAIN_TEX[k] = t; t.userData = { shared: true }; } return GRAIN_TEX[k]; }

  /* Материал грани: цвет с зерном бумаги + рельеф (зерно и вдавленный логотип) + карта металла для фольги.
     o: { back, label, rough, clearcoat } */
  function faceMaterial(wmm, hmm, face, s, o) {
    o = o || {};
    var k = 1024 / Math.max(wmm, hmm), W = Math.round(wmm * k), H = Math.round(hmm * k), back = !!o.back;
    var paint = typeof face === 'function' ? face : FACES[face] || FACES.center;
    var cv = canvas(W, H), c = cv.getContext('2d');
    c.fillStyle = s.base; c.fillRect(0, 0, W, H);
    var gp = c.createPattern(grain(), 'repeat');
    if (!o.clearcoat) { c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.5; c.fillStyle = gp; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    var inkStyle;
    if (s.logo === 'print') inkStyle = s.print;
    else if (s.logo === 'blind') inkStyle = mix(s.base, s.dark ? '#ffffff' : '#000000', s.dark ? 0.07 : 0.06);
    else { var f = FOIL[s.logo], g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, f[0]); g.addColorStop(0.45, f[1]); g.addColorStop(1, f[2]); inkStyle = g; }
    paint(c, W, H, {
      ink: function () { c.fillStyle = inkStyle; c.strokeStyle = inkStyle; c.globalAlpha = 1; },
      sub: function () { c.fillStyle = s.sub; c.strokeStyle = s.sub; }
    }, back);
    if (o.label && !back) { c.globalAlpha = 0.3; c.fillStyle = s.sub; spaced(c, 'МАКЕТ-ЗАГЛУШКА', W / 2, H - Math.max(14, H * 0.035), Math.max(10, Math.min(W, H) * 0.022), 0.22, SANS, 500); c.globalAlpha = 1; }
    var rough = o.rough != null ? o.rough : s.coat === 'gloss' ? 0.34 : 0.88, foil = s.logo === 'gold' || s.logo === 'silver';
    var m = o.clearcoat ? new T.MeshPhysicalMaterial({ clearcoat: 1, clearcoatRoughness: 0.06 }) : new T.MeshStandardMaterial();
    var flip = o.flipY !== false, tx = function (cvs, srgb) { var t = tex(cvs, srgb); t.flipY = flip; return t; };
    m.map = tx(cv, true); m.roughness = rough; m.metalness = 0;
    // рельеф: зерно бумаги, логотип вдавлен (фольга и блинт — тиснение)
    var bv = canvas(W, H), bc = bv.getContext('2d');
    bc.fillStyle = o.clearcoat || s.coat === 'gloss' ? '#808080' : bc.createPattern(grain(), 'repeat'); bc.fillRect(0, 0, W, H);
    if (s.logo !== 'print') { var bs = s.logo === 'blind' ? '#1e1e1e' : '#5a5a5a'; paint(bc, W, H, { ink: function () { bc.fillStyle = bs; bc.strokeStyle = bs; bc.globalAlpha = 1; }, sub: function () { bc.fillStyle = bc.strokeStyle = 'rgba(0,0,0,0)'; } }, back); }
    m.bumpMap = tx(bv, false); m.bumpScale = 0.0035;
    if (foil) {
      var mv = canvas(W, H), mc = mv.getContext('2d');
      mc.fillStyle = 'rgb(0,' + Math.round(rough * 255) + ',0)'; mc.fillRect(0, 0, W, H);
      paint(mc, W, H, { ink: function () { mc.fillStyle = 'rgb(0,62,255)'; mc.strokeStyle = 'rgb(0,62,255)'; mc.globalAlpha = 1; }, sub: function () { mc.fillStyle = mc.strokeStyle = 'rgba(0,0,0,0)'; } }, back);
      var mt = tx(mv, false); m.metalnessMap = mt; m.roughnessMap = mt; m.metalness = 1; m.roughness = 1;
    }
    return m;
  }
  /* Однотонная бумага / картон с зерном */
  function paper(color, rough, rep) { var m = new T.MeshStandardMaterial({ color: lin(color), roughness: rough == null ? 0.88 : rough, metalness: 0 }); if (rep !== 0) { m.bumpMap = grainTex(rep || 3); m.bumpScale = 0.0025; } return m; }
  function plain(color, rough, metal) { return new T.MeshStandardMaterial({ color: lin(color), roughness: rough == null ? 0.9 : rough, metalness: metal || 0 }); }
  function glaze(color) { return new T.MeshPhysicalMaterial({ color: lin(color), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, side: T.DoubleSide }); }
  /* Срез блока листов: полоски страниц. dir 'h' — горизонтальные, 'v' — вертикальные */
  function edgeMat(color, n, dir) {
    var c = canvas(dir === 'v' ? 256 : 8, dir === 'v' ? 8 : 256), x = c.getContext('2d'), i, L = 256;
    x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    for (i = 0; i < n; i++) { x.fillStyle = i % 2 ? 'rgba(0,0,0,0.11)' : 'rgba(255,255,255,0.10)'; var p = Math.round(i * L / n), w = Math.max(1, Math.round(L / n / 2)); if (dir === 'v') x.fillRect(p, 0, w, 8); else x.fillRect(0, p, 8, w); }
    return new T.MeshStandardMaterial({ map: tex(c, true), roughness: 0.95 });
  }
  /* Стопка листов: Box, у которого срезы в полоску. front/back — материалы крайних листов */
  function stack(w, h, t, n, front, back, color) {
    var v = edgeMat(color, n, 'v'), hz = edgeMat(color, n, 'h');
    // грани Box: +x, -x (u вдоль z), +y, -y (v вдоль z), +z, -z
    return new T.Mesh(new T.BoxGeometry(w * U, h * U, t * U), [v, v, hz, hz, front, back]);
  }

  /* ───── геометрия ───── */
  var U = 0.01; // мм → единицы сцены
  function rrect(w, h, r) {
    var s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r || 0, w / 2, h / 2);
    if (!r) { s.moveTo(x, y); s.lineTo(x + w, y); s.lineTo(x + w, y + h); s.lineTo(x, y + h); s.closePath(); return s; }
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
  }
  function facePlane(shape, w, h, mat) {
    var g = new T.ShapeGeometry(shape, 10), uv = g.attributes.uv, p = g.attributes.position;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return new T.Mesh(g, mat);
  }
  /* Плоский носитель с лицом и оборотом (всё в мм). bevel — скруглённая кромка для картона и пластика */
  function slab(w, h, t, r, front, back, edge, bevel) {
    w *= U; h *= U; t *= U; r = (r || 0) * U; bevel = Math.min((bevel || 0) * U, t / 2.2);
    var shape = rrect(w, h, r), inner = bevel ? rrect(w - 2 * bevel, h - 2 * bevel, Math.max(0, r - bevel)) : shape, grp = new T.Group();
    var body = new T.Mesh(new T.ExtrudeGeometry(inner, bevel ? { depth: t - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10 } : { depth: t, bevelEnabled: false, curveSegments: 10 }), edge);
    body.position.z = -t / 2 + bevel; grp.add(body);
    var f = facePlane(inner, w, h, front); f.position.z = t / 2 + 0.0004; grp.add(f);
    var b = facePlane(inner, w, h, back); b.rotation.y = Math.PI; b.position.z = -t / 2 - 0.0004; grp.add(b);
    return grp;
  }
  /* Лист бумаги с лёгким изгибом: настоящая бумага не бывает идеально плоской */
  function sheet(w, h, bend, front, back) {
    w *= U; h *= U;
    function geo(flip) {
      var g = new T.PlaneGeometry(w, h, 24, 32), p = g.attributes.position, uv = g.attributes.uv, i, x, y;
      for (i = 0; i < p.count; i++) { x = p.getX(i) / w; y = p.getY(i) / h; p.setZ(i, (-(y + 0.5) * (y + 0.5) * 0.9 - x * x * 0.5 + (x + 0.5) * (y + 0.5) * 0.35) * bend * U); if (flip) uv.setX(i, 1 - uv.getX(i)); }
      g.computeVertexNormals(); return g;
    }
    var grp = new T.Group(); grp.add(new T.Mesh(geo(false), front));
    back.side = T.BackSide; var b = new T.Mesh(geo(true), back); b.position.z = -0.0006; grp.add(b);
    return grp;
  }
  function loadTex(url, onload) { var t = new T.TextureLoader().load(url, onload); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; }
  function at(o, x, y, z) { o.position.set(x * U, y * U, z * U); return o; }
  function metal(s) { return plain(s.logo === 'silver' ? '#c9ccd2' : '#c9a55c', 0.28, 1); }
  function accent(s) { return s.dark ? '#A67C3C' : '#401216'; }
  function edgeColor(s) { return mix(s.base, '#ffffff', s.dark ? 0.1 : 0.35); }

  var BUILD = {
    /* Визитки: стопка с верхней карточкой, сдвинутой и чуть повёрнутой */
    cards: function (m, s, it) {
      var g = new T.Group(), n = 16, t = 0.42, f = faceMaterial(m.w, m.h, 'card', s, { label: it.stub }), b = faceMaterial(m.w, m.h, 'card', s, { back: true });
      g.add(stack(m.w, m.h, n * t, n, f, b, edgeColor(s)));
      var mid = slab(m.w, m.h, t, 0, f, b, paper(edgeColor(s), 0.95, 0)); at(mid, -2.2, 1.6, n * t / 2 + t / 2 + 0.05); mid.rotation.z = 0.045; g.add(mid);
      var top = slab(m.w, m.h, t, 0, f, b, paper(edgeColor(s), 0.95, 0)); at(top, 3.5, -2.6, n * t / 2 + t * 1.5 + 0.12); top.rotation.z = -0.1; g.add(top);
      return g;
    },
    /* Ключ-карта: глянцевый пластик со скруглёнными углами + бумажный конверт-кармашек */
    keycard: function (m, s, it) {
      var g = new T.Group(), body = plain(mix(s.base, '#000000', 0.08), 0.3);
      var card = slab(m.w, m.h, 0.8, 3.2, faceMaterial(m.w, m.h, 'card', s, { label: it.stub, rough: 0.28, clearcoat: true }), faceMaterial(m.w, m.h, 'keyback', s, { back: true, rough: 0.28, clearcoat: true }), body, 0.25);
      at(card, 6, -5, 2.2); card.rotation.z = -0.07; g.add(card);
      // кармашек: задняя стенка и передняя с вырезом под палец
      var sw = m.w + 8, sh = m.h + 10, s2 = { base: s.base, dark: s.dark, logo: s.logo, coat: 'matte', sub: s.sub, print: s.print };
      var pocket = slab(sw, sh, 0.5, 1, paper(mix(s.base, '#000000', 0.03)), faceMaterial(sw, sh, 'center', s2, { back: true }), paper(edgeColor(s), 0.95, 0));
      at(pocket, -7, 7, -0.6); pocket.rotation.z = 0.06; g.add(pocket);
      var sh2 = new T.Shape(), hw = sw / 2 * U, hh = sh * 0.36 * U; sh2.moveTo(-hw, -hh); sh2.lineTo(hw, -hh); sh2.lineTo(hw, hh); sh2.lineTo(hw * 0.32, hh); sh2.absarc(0, hh, hw * 0.32, 0, Math.PI, true); sh2.lineTo(-hw, hh); sh2.closePath();
      var lip = new T.Mesh(new T.ExtrudeGeometry(sh2, { depth: 0.5 * U, bevelEnabled: false, curveSegments: 16 }), paper(s.base));
      lip.position.set(0, -sh * 0.32 * U, 0.3 * U); pocket.add(lip);
      return g;
    },
    /* Бланк: три листа с изгибом, слегка развёрнутые веером */
    sheets: function (m, s, it) {
      var g = new T.Group(), f = faceMaterial(m.w, m.h, m.face, s, { label: it.stub }), b = paper(s.base);
      [[0, 0, 0, 0, 7], [-5, 3, -0.7, 0.028, 5], [-10, 6, -1.4, 0.06, 4]].forEach(function (p, i) { var sh = sheet(m.w, m.h, p[4], i ? f.clone() : f, b.clone()); at(sh, p[0], p[1], p[2]); sh.rotation.z = p[3]; g.add(sh); });
      return g;
    },
    /* Конверт: корпус с клапаном, клапан приоткрыт и виден цветной внутренний слой */
    envelope: function (m, s, it) {
      var g = new T.Group(), w = m.w * U, h = m.h * U, t = 1.3;
      g.add(slab(m.w, m.h, t, 0.6, faceMaterial(m.w, m.h, 'envelope', s, { label: it.stub }), faceMaterial(m.w, m.h, 'envback', s, { back: true }), paper(edgeColor(s), 0.95, 0)));
      var fl = new T.Shape(), fh = h * 0.58, rr = h * 0.1; fl.moveTo(-w / 2, 0); fl.lineTo(w / 2, 0); fl.lineTo(rr * 1.6, -fh + rr * 0.9); fl.quadraticCurveTo(0, -fh, -rr * 1.6, -fh + rr * 0.9); fl.closePath();
      var fg = new T.ShapeGeometry(fl, 12), uv = fg.attributes.uv, p = fg.attributes.position, i; for (i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / fh + 1);
      var hinge = new T.Group(); hinge.position.set(0, h / 2, -(t / 2 + 0.25) * U); hinge.rotation.x = 0.34;
      var lining = paper(accent(s), 0.8), outer = paper(s.base); outer.side = T.BackSide;
      hinge.add(new T.Mesh(fg, lining)); var o = new T.Mesh(fg, outer); o.position.z = -0.0005; hinge.add(o); g.add(hinge);
      return g;
    },
    /* Папка: две сторонки из картона, приоткрыта, внутри карман с листами */
    folder: function (m, s, it) {
      var g = new T.Group(), board = paper(edgeColor(s), 0.95, 0), ins = paper(mix(s.base, '#ffffff', s.dark ? 0.04 : 0.25));
      g.add(at(slab(m.w, m.h, 0.7, 1.5, ins, faceMaterial(m.w, m.h, 'mark', s, { back: true }), board), 0, 0, -2.6));
      var white = paper('#FBF8F1', 0.92);
      [[-1.9, 0.01], [-1.5, -0.012]].forEach(function (p) { var sh = slab(210, 297, 0.12, 0, white, white, plain('#F2EEE4')); at(sh, 3, 4, p[0]); sh.rotation.z = p[1]; g.add(sh); });
      var pk = new T.Shape(), pw = m.w / 2 * U, ph = m.h * 0.3 * U; pk.moveTo(-pw, 0); pk.lineTo(pw, 0); pk.lineTo(pw, ph * 0.55); pk.lineTo(-pw, ph); pk.closePath();
      var pocket = new T.Mesh(new T.ExtrudeGeometry(pk, { depth: 0.6 * U, bevelEnabled: false }), ins); at(pocket, 0, -m.h / 2, -1.0); g.add(pocket);
      var hinge = new T.Group(); at(hinge, -m.w / 2, 0, 0.4); hinge.rotation.y = -0.2;
      hinge.add(at(slab(m.w, m.h, 0.7, 1.5, faceMaterial(m.w, m.h, 'center', s, { label: it.stub }), ins, board), m.w / 2, 0, 0)); g.add(hinge);
      var spine = new T.Mesh(new T.CylinderGeometry(1.7 * U, 1.7 * U, m.h * U, 12, 1, false, Math.PI / 2, Math.PI), paper(s.base)); at(spine, -m.w / 2, 0, -1.1); g.add(spine);
      return g;
    },
    /* Блокнот: твёрдые сторонки со скруглёнными углами, блок страниц, резинка и ляссе */
    notebook: function (m, s, it) {
      var g = new T.Group(), bt = 2, board = paper(mix(s.base, '#000000', 0.05), 0.8, 0), page = '#F3EDE0';
      var block = stack(m.w - 5, m.h - 7, m.t - 2 * bt, 60, plain(page), plain(page), page); at(block, 0.5, 0, 0); g.add(block);
      g.add(at(slab(m.w, m.h, bt, 5, faceMaterial(m.w, m.h, 'center', s, { label: it.stub }), paper(page), board, 0.5), 0, 0, m.t / 2 - bt / 2));
      g.add(at(slab(m.w, m.h, bt, 5, paper(page), faceMaterial(m.w, m.h, 'mark', s, { back: true }), board, 0.5), 0, 0, -m.t / 2 + bt / 2));
      var sp = new T.Mesh(new T.CylinderGeometry(m.t / 2 * U, m.t / 2 * U, (m.h - 1) * U, 20, 1, false, Math.PI, Math.PI), paper(s.base, 0.85)); sp.scale.x = 0.45; at(sp, -m.w / 2 + 2.2, 0, 0); g.add(sp);
      var band = plain(accent(s), 0.75), bx = m.w / 2 - 16, bw = 7;
      [[bx, 0, m.t / 2 + 0.25, bw, m.h + 1, 0.5], [bx, 0, -m.t / 2 - 0.25, bw, m.h + 1, 0.5], [bx, m.h / 2 + 0.25, 0, bw, 0.5, m.t + 1], [bx, -m.h / 2 - 0.25, 0, bw, 0.5, m.t + 1]].forEach(function (b) { g.add(at(new T.Mesh(new T.BoxGeometry(b[3] * U, b[4] * U, b[5] * U), band), b[0], b[1], b[2])); });
      var rib = new T.Mesh(new T.PlaneGeometry(5 * U, 34 * U), new T.MeshStandardMaterial({ color: lin(s.logo === 'silver' ? '#a4a8b0' : '#A67C3C'), roughness: 0.5, side: T.DoubleSide })); at(rib, -m.w * 0.18, -m.h / 2 - 12, -1); rib.rotation.z = 0.08; g.add(rib);
      return g;
    },
    /* Открытки: лицевая впереди, вторая за ней показывает оборот с полем для адреса */
    postcards: function (m, s, it) {
      var g = new T.Group(), e = paper(edgeColor(s), 0.95, 0), f = faceMaterial(m.w, m.h, 'postcard', s, { label: it.stub }), b = faceMaterial(m.w, m.h, 'postcard', s, { back: true });
      var a = slab(m.w, m.h, 0.5, 0, f, b, e); at(a, -8, -6, 1.2); a.rotation.z = 0.035; g.add(a);
      var c = slab(m.w, m.h, 0.5, 0, b.clone(), f.clone(), e); at(c, 14, 12, -1.2); c.rotation.z = -0.075; g.add(c);
      return g;
    },
    /* Книга в твёрдом переплёте: сторонки с кантом, блок, корешок */
    book: function (m, s, it, redraw) {
      var g = new T.Group(), bt = 2.4, tint = m.tint || '#E9E2D2', board = paper(tint, 0.85, 0), page = '#F1EADB';
      var img = function (u) { return u ? new T.MeshStandardMaterial({ map: loadTex(u, redraw), roughness: 0.62, bumpMap: grainTex(5), bumpScale: 0.002 }) : paper(tint); };
      g.add(at(stack(m.w - 6, m.h - 6, m.t - 2 * bt, 50, plain(page), plain(page), page), 1.5, 0, 0));
      g.add(at(slab(m.w, m.h, bt, 1.2, img(m.front), paper(page), board, 0.6), 0, 0, m.t / 2 - bt / 2));
      g.add(at(slab(m.w, m.h, bt, 1.2, paper(page), img(m.back), board, 0.6), 0, 0, -m.t / 2 + bt / 2));
      var sm = img(m.spine), sp = new T.Mesh(new T.BoxGeometry(bt * U, m.h * U, (m.t - 2 * bt + 0.2) * U), [board, sm, board, board, board, board]); at(sp, -m.w / 2 + bt / 2, 0, 0); g.add(sp);
      return g;
    },
    /* Настольный календарь: картонный домик, блок листов на пружине */
    tent: function (m, s, it) {
      var g = new T.Group(), a = 0.36, hh = m.h * U, board = paper(mix(s.base, '#000000', 0.05), 0.9, 0), bt = 1.6, dz = Math.sin(a) * hh / 2, cy = Math.cos(a) * hh / 2;
      var f = new T.Group(), b = new T.Group();
      f.add(slab(m.w, m.h, bt, 0.5, paper(s.base), paper(s.base), board));
      f.add(at(stack(m.w - 4, m.h - 12, 2.4, 13, faceMaterial(m.w - 4, m.h - 12, 'calendar', s, { label: it.stub }), paper('#fff'), '#F6F1E6'), 0, -5, bt / 2 + 1.25));
      b.add(slab(m.w, m.h, bt, 0.5, faceMaterial(m.w, m.h, 'center', s, {}), paper(s.base), board));
      f.rotation.x = -a; f.position.z = dz; b.rotation.y = Math.PI; b.rotation.x = a; b.position.z = -dz; g.add(f, b);
      g.add(at(slab(m.w, dz * 2 / U + 2, bt, 0.5, paper(s.base), paper(s.base), board), 0, 0, 0)); g.children[2].rotation.x = Math.PI / 2; g.children[2].position.y = -cy;
      var wire = metal(s), ring = new T.TorusGeometry(4.2 * U, 0.45 * U, 8, 24), n = 24, i;
      for (i = 0; i < n; i++) { var r = new T.Mesh(ring, wire); r.rotation.y = Math.PI / 2; r.position.set((-m.w / 2 + 14 + i * (m.w - 28) / (n - 1)) * U, cy - 1.2 * U, 0); g.add(r); }
      return g;
    },
    /* Бумажный пакет: боковые складки, открытый верх, верёвочные ручки в люверсах */
    bag: function (m, s, it) {
      var g = new T.Group(), w = m.w * U, h = m.h * U, d = m.d * U, c = 16 * U;
      var rough = s.coat === 'gloss' ? 0.34 : 0.88, inner = paper(mix(s.base, '#ffffff', s.dark ? 0.12 : 0.3), 0.92), sideM = paper(mix(s.base, '#000000', 0.03), rough); sideM.side = T.DoubleSide; sideM.flatShading = true;
      var face = function (c2, W, H, k) { k.ink(); wordmark(c2, W / 2, H * 0.54, W * 0.5); k.sub(); c2.globalAlpha = 0.1; c2.fillRect(0, H * 0.115, W, H * 0.004); c2.globalAlpha = 1; };
      [1, -1].forEach(function (sg) {
        var p = new T.Mesh(new T.PlaneGeometry(w, h), faceMaterial(m.w, m.h, face, s, sg > 0 ? { label: it.stub } : { back: true })); p.position.z = sg * d / 2; if (sg < 0) p.rotation.y = Math.PI; g.add(p);
        var q = new T.Mesh(new T.PlaneGeometry(w, h), inner); q.position.z = sg * (d / 2 - 0.004); if (sg > 0) q.rotation.y = Math.PI; g.add(q);
        // боковина со складкой внутрь: вверху глубже, к дну сходит на нет
        var x = sg * w / 2, v = [x, h / 2, d / 2, x - sg * c, h / 2, 0, x, h / 2, -d / 2, x, -h / 2, d / 2, x - sg * c * 0.15, -h / 2, 0, x, -h / 2, -d / 2];
        var idx = [0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2], pos = []; idx.forEach(function (i) { pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]); });
        var sg2 = new T.BufferGeometry(); sg2.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); sg2.computeVertexNormals(); g.add(new T.Mesh(sg2, sideM));
      });
      var bot = new T.Mesh(new T.PlaneGeometry(w, d), sideM); bot.rotation.x = Math.PI / 2; bot.position.y = -h / 2 + 0.002; g.add(bot);
      var rope = new T.MeshStandardMaterial({ color: lin(s.logo === 'silver' ? '#8d9199' : accent(s)), roughness: 0.85, bumpMap: grainTex(14), bumpScale: 0.004 }), eye = metal(s), ring = new T.TorusGeometry(4.2 * U, 1.1 * U, 10, 24);
      [1, -1].forEach(function (sg) {
        var z = sg * (d / 2 + 0.012), x0 = w * 0.19, y0 = h / 2 - 26 * U;
        var cv = new T.CatmullRomCurve3([new T.Vector3(-x0, y0, z - sg * 0.03), new T.Vector3(-x0, y0 + 0.2, z + sg * 0.02), new T.Vector3(-x0 * 0.82, h / 2 + 0.62, z + sg * 0.05), new T.Vector3(0, h / 2 + 0.9, z + sg * 0.06), new T.Vector3(x0 * 0.82, h / 2 + 0.62, z + sg * 0.05), new T.Vector3(x0, y0 + 0.2, z + sg * 0.02), new T.Vector3(x0, y0, z - sg * 0.03)]);
        g.add(new T.Mesh(new T.TubeGeometry(cv, 64, 2.6 * U, 10), rope));
        [-x0, x0].forEach(function (x) { var r = new T.Mesh(ring, eye); r.position.set(x, y0, z - sg * 0.004); g.add(r); });
      });
      return g;
    },
    /* Кружка: тело вращения со стенкой, скруглённым краем и донцем; глазурь */
    mug: function (m, s, it) {
      var g = new T.Group(), R = m.r * U, h = m.h * U, wl = 3.6 * U, V = function (r, y) { return new T.Vector2(r, y); }, i, a, pts;
      var white = glaze('#FAF6EC'), body = glaze(s.base), seg = 96;
      var s2 = { base: s.base, dark: s.dark, logo: s.logo, coat: 'gloss', sub: s.sub, print: s.print };
      var wm = faceMaterial(m.r * 2 * Math.PI, m.h - 9, 'wrap', s2, { rough: 0.3, clearcoat: true }); wm.side = T.DoubleSide;
      var wall = new T.Mesh(new T.LatheGeometry([V(R, 6 * U), V(R, h - 3 * U)], seg), wm); wall.rotation.y = Math.PI; g.add(wall);
      pts = [V(0, 1.2 * U), V(R - 9 * U, 1.2 * U), V(R - 8 * U, 0), V(R - 6 * U, 0)];                       // донце с ножкой
      for (i = 0; i <= 8; i++) { a = -Math.PI / 2 + i / 8 * Math.PI / 2; pts.push(V(R - 6 * U + Math.cos(a) * 6 * U, 6 * U + Math.sin(a) * 6 * U)); }
      g.add(new T.Mesh(new T.LatheGeometry(pts, seg), body));
      pts = []; for (i = 0; i <= 10; i++) { a = i / 10 * Math.PI; pts.push(V(R - wl / 2 + Math.cos(a) * wl / 2, h - 3 * U + Math.sin(a) * 3 * U)); }   // скруглённый край
      g.add(new T.Mesh(new T.LatheGeometry(pts, seg), body));
      pts = [V(R - wl, h - 3 * U), V(R - wl, 12 * U)]; for (i = 1; i <= 8; i++) { a = i / 8 * Math.PI / 2; pts.push(V(R - wl - 7 * U + Math.cos(a) * 7 * U, 12 * U - Math.sin(a) * 7 * U)); } pts.push(V(0, 5 * U));
      g.add(new T.Mesh(new T.LatheGeometry(pts, seg), white));                                               // внутренняя чаша
      var hc = new T.CatmullRomCurve3([new T.Vector3(R - 2 * U, h * 0.8, 0), new T.Vector3(R + 14 * U, h * 0.86, 0), new T.Vector3(R + 30 * U, h * 0.7, 0), new T.Vector3(R + 31 * U, h * 0.44, 0), new T.Vector3(R + 20 * U, h * 0.24, 0), new T.Vector3(R - 2 * U, h * 0.2, 0)]);
      var hd = new T.Mesh(new T.TubeGeometry(hc, 48, 5.6 * U, 16), body); hd.scale.z = 1.5; g.add(hd);
      g.children.forEach(function (o) { o.position.y -= h / 2; });
      return g;
    }
  };
  BUILD.slab = function (m, s, it) { return slab(m.w, m.h, m.t, m.r, faceMaterial(m.w, m.h, m.face, s, { label: it.stub }), faceMaterial(m.w, m.h, m.face, s, { back: true }), paper(edgeColor(s), 0.95, 0)); };

  /* ───── модели из Blender (GLB) ─────
     Геометрия лежит в /models/<id>.glb, материалы названы по ролям и подменяются здесь:
     face_* — грани под макет (UV 0..1 на весь формат), остальные — бумага, картон, металл, глазурь. */
  var bagFace = function (c2, W, H, k) { k.ink(); wordmark(c2, W / 2, H * 0.54, W * 0.5); };
  var GLB_FACES = {
    card: { face_front: ['card', 90, 50], face_back: ['card', 90, 50, { back: true }] },
    keycard: { face_front: ['card', 85.6, 54, { rough: 0.28, clearcoat: true }], face_back: ['keyback', 85.6, 54, { back: true, rough: 0.28, clearcoat: true, label: false }], face_sleeve: ['center', 94, 64, { label: false }] },
    postcard: { face_front: ['postcard', 148, 105], face_back: ['postcard', 148, 105, { back: true }] },
    envelope: { face_front: ['envelope', 220, 110], face_back: ['envback', 220, 110, { back: true }] },
    letterhead: { face_front: ['letter', 210, 297] },
    folder: { face_front: ['center', 220, 310], face_back: ['mark', 220, 310, { back: true }] },
    notebook: { face_front: ['center', 148, 210], face_back: ['mark', 148, 210, { back: true }] },
    calendar: { face_cal: ['calendar', 204, 135], face_back: ['center', 210, 148, { label: false }] },
    bag: { face_front: [bagFace, 240, 320], face_back: [bagFace, 240, 320, { back: true }] },
    mug: { face_wrap: ['wrap', 257.6, 86.7, { rough: 0.3, clearcoat: true, label: false, coat: 'gloss' }] }
  };
  var GLB = {};
  function preload(ids) {
    if (!T.GLTFLoader) return Promise.resolve();
    return Promise.all((ids || ITEMS.map(function (x) { return x.id; })).map(function (id) {
      var it = id && GLB_FACES[id] ? id : null; if (!it) return null;
      if (!GLB[id]) GLB[id] = new Promise(function (ok) {
        new T.GLTFLoader().load('/models/' + id + '.glb?v=1', function (g) {
          g.scene.traverse(function (o) { if (o.isMesh) { o.userData.mat = o.material.name; o.geometry.userData.shared = true; o.material.dispose(); } });
          GLB[id].scene = g.scene; ok();
        }, undefined, function () { ok(); });
      });
      return GLB[id];
    }));
  }
  function roleMaterial(name, s) {
    var gloss = s.coat === 'gloss' ? 0.34 : 0.88;
    switch (name) {
      case 'base': return paper(s.base, gloss);
      case 'board': return paper(mix(s.base, '#000000', 0.06), 0.9, 0);
      case 'inner': return paper(mix(s.base, '#ffffff', s.dark ? 0.1 : 0.3), 0.92);
      case 'edge': return paper(edgeColor(s), 0.95, 0);
      case 'white': return paper('#FBF8F1', 0.92);
      case 'page': return plain('#F3EDE0');
      case 'page_edge': return edgeMat('#F3EDE0', 70, 'h');
      case 'accent': return paper(accent(s), 0.8);
      case 'ribbon': return plain(s.logo === 'silver' ? '#a4a8b0' : '#A67C3C', 0.5);
      case 'rope': return new T.MeshStandardMaterial({ color: lin(s.logo === 'silver' ? '#a4a8b0' : accent(s)), roughness: 0.46 });   // ручки пакета — атласная лента
      case 'metal': return metal(s);
      case 'glaze': return glaze(s.base);
      case 'glaze_inner': return glaze('#FAF6EC');
    }
    return paper(s.base);
  }
  function fromGLB(item, s) {
    var src = GLB[item.id] && GLB[item.id].scene, faces = GLB_FACES[item.id]; if (!src) return null;
    var root = src.clone(true), cache = {};
    root.traverse(function (o) {
      if (!o.isMesh) return; var n = o.userData.mat;
      if (!cache[n]) {
        var f = faces[n];
        if (f) { var fo = { flipY: false, label: item.stub && n !== 'face_back' }, k, s2 = s; for (k in f[3] || {}) fo[k] = f[3][k]; if (fo.coat) { s2 = {}; for (k in s) s2[k] = s[k]; s2.coat = fo.coat; } cache[n] = faceMaterial(f[1], f[2], f[0], s2, fo); }
        else cache[n] = roleMaterial(n, s);
      }
      o.material = cache[n];
    });
    var g = new T.Group(); root.scale.setScalar(10); g.add(root); g.updateMatrixWorld(true); return g;   // метры Blender → единицы сцены (1 мм = 0.01)
  }

  /* Собирает модель носителя. opts: { base, logo, coat } */
  function build(item, opts, redraw) {
    var s = st(opts || {}), g = fromGLB(item, s) || BUILD[item.model.type](item.model, s, item, redraw);
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    var box = new T.Box3().setFromObject(g), sph = box.getBoundingSphere(new T.Sphere());
    var holder = new T.Group(); g.position.sub(sph.center); holder.add(g);
    holder.userData = { radius: sph.radius, minY: box.min.y - sph.center.y, w: box.max.x - box.min.x, d: box.max.z - box.min.z };
    return holder;
  }
  function dispose(obj) {
    obj.traverse(function (o) {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      [].concat(o.material || []).forEach(function (m) { ['map', 'metalnessMap', 'bumpMap'].forEach(function (k) { if (m[k] && !(m[k].userData && m[k].userData.shared)) m[k].dispose(); }); m.dispose(); });
    });
  }

  /* ───── сцена ───── */
  function makeRenderer(cv, w, h) {
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: false });
    r.setPixelRatio(1); r.setSize(w, h, false);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.NoToneMapping; // без тон-маппинга: фирменные цвета не уходят в сторону
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    return r;
  }
  /* Мягкая студия для отражений фольги и глазури: тёплый купол и световые панели */
  function makeEnv(renderer) {
    var sc = new T.Scene(), basic = function (v) { var m = new T.MeshBasicMaterial({ side: T.DoubleSide }); m.color.setRGB(v, v * 0.96, v * 0.9); return m; };
    sc.add(new T.Mesh(new T.SphereGeometry(20, 24, 12), basic(0.1)));
    var p1 = new T.Mesh(new T.PlaneGeometry(14, 8), basic(2.4)); p1.position.set(-6, 9, 8); p1.lookAt(0, 0, 0); sc.add(p1);
    var p2 = new T.Mesh(new T.PlaneGeometry(5, 12), basic(1.5)); p2.position.set(12, 2, 4); p2.lookAt(0, 0, 0); sc.add(p2);
    var p3 = new T.Mesh(new T.PlaneGeometry(10, 4), basic(0.7)); p3.position.set(0, -2, -12); p3.lookAt(0, 0, 0); sc.add(p3);
    var p4 = new T.Mesh(new T.PlaneGeometry(3, 10), basic(1.1)); p4.position.set(-13, 1, -3); p4.lookAt(0, 0, 0); sc.add(p4);
    var pm = new T.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.03); pm.dispose();
    return rt.texture;
  }
  /* Студийный свет: ключевой с настоящей тенью, заполняющий, контровой + отражения студии */
  function makeScene(renderer, shadowSize) {
    var scene = new T.Scene(); scene.environment = makeEnv(renderer);
    var hemi = new T.HemisphereLight(0xffffff, 0xb9b0a2, 0.47); scene.add(hemi);
    var key = new T.DirectionalLight(0xfff6e8, 0.34); key.castShadow = true; key.shadow.mapSize.set(shadowSize || 1024, shadowSize || 1024); key.shadow.bias = -0.0005; key.shadow.normalBias = 0.006; key.shadow.radius = 4; scene.add(key); scene.add(key.target);
    var fill = new T.DirectionalLight(0xe6ecff, 0.1); fill.position.set(6, -1, 5); scene.add(fill);
    var rim = new T.DirectionalLight(0xffffff, 0.14); rim.position.set(4, 4, -7); scene.add(rim);
    var ground = new T.Mesh(new T.PlaneGeometry(1, 1), new T.ShadowMaterial({ opacity: 0.2 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    // мягкая контактная тень под носителем
    var cv = canvas(256, 256), c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(30,20,10,0.34)'); g.addColorStop(0.5, 'rgba(30,20,10,0.1)'); g.addColorStop(1, 'rgba(30,20,10,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    var shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
    var cam = new T.PerspectiveCamera(26, 1, 0.1, 100);
    return { scene: scene, cam: cam, shadow: shadow, ground: ground, key: key, hemi: hemi };
  }
  /* Настраивает ключевой свет и пол под сцену радиуса R с полом на высоте y */
  function lightFor(stage, R, y) {
    var k = stage.key, c = k.shadow.camera; k.position.set(-R * 2.2, R * 4.2, R * 3.4); k.target.position.set(0, 0, 0);
    c.left = c.bottom = -R * 1.7; c.right = c.top = R * 1.7; c.near = R * 2; c.far = R * 10; c.updateProjectionMatrix();
    stage.ground.position.y = y; stage.ground.scale.set(R * 14, R * 14, 1);
  }
  /* Ставит модель в кадр. zoom 1 = вписать целиком; yaw вращает носитель, pitch поднимает камеру */
  function frameIt(stage, holder, aspect, zoom, yaw, pitch) {
    var u = holder.userData, R = u.radius, fov = stage.cam.fov * Math.PI / 180;
    var fit = R / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2);
    var dist = fit * 1.14 / (zoom || 1), el = Math.max(-0.05, Math.min(1.25, 0.1 + (pitch || 0)));
    stage.cam.aspect = aspect; stage.cam.position.set(0, Math.sin(el) * dist, Math.cos(el) * dist); stage.cam.lookAt(0, 0, 0); stage.cam.updateProjectionMatrix();
    holder.rotation.set(0, yaw || 0, 0);
    lightFor(stage, R, u.minY - R * 0.012);
    stage.shadow.position.y = u.minY - R * 0.01; stage.shadow.scale.set(u.w * 1.3 + R * 0.5, u.d * 1.5 + R * 0.7, 1);
  }

  /* HeroUI красит выбранное через data-selected — ведём его от aria-атрибутов */
  function syncSelected() {
    var A = ['aria-pressed', 'aria-selected'];
    function one(el) { if (!el.getAttribute) return; if (A.some(function (a) { return el.getAttribute(a) === 'true'; })) el.setAttribute('data-selected', 'true'); else el.removeAttribute('data-selected'); }
    function tree(root) { if (root.nodeType !== 1) return; one(root); Array.prototype.forEach.call(root.querySelectorAll('[aria-pressed],[aria-selected]'), one); }
    tree(document.body);
    new MutationObserver(function (l) { l.forEach(function (m) { if (m.type === 'attributes') one(m.target); else Array.prototype.forEach.call(m.addedNodes, tree); }); })
      .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: A });
  }

  function href(it) { return it.href || '/item/?id=' + it.id; }
  function filesState(it) {
    var f = it.files || [], n = f.filter(function (x) { return x.url; }).length;
    return { ready: n, total: f.length, text: !f.length ? '' : n ? 'Шаблоны: ' + n + ' из ' + f.length : 'Шаблоны ожидаются' };
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('pda-' + k); localStorage.setItem('pda-' + k, v); } catch (e) { return null; } }
  var CH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{d}"/></svg>';
  /* Переключатель носителей в шапке: список всех носителей и стрелки «предыдущий / следующий». Один и тот же на всех страницах. */
  function mountNav(host, curId, before) {
    var i = ITEMS.map(function (x) { return x.id; }).indexOf(curId), cur = ITEMS[i]; if (!host) return;
    var wrap = document.createElement('div'); wrap.className = 'inav';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'button button--sm button--secondary inav__btn';
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Выбрать носитель');
    btn.innerHTML = '<span>' + (cur ? cur.name : 'Носители') + '</span>' + CH.replace('{d}', 'm4 6 4 4 4-4');
    var menu = document.createElement('div'); menu.className = 'inav__menu card'; menu.hidden = true;
    GROUPS.forEach(function (g) {
      var list = ITEMS.filter(function (x) { return x.group === g.id; }); if (!list.length) return;
      var h = document.createElement('p'); h.className = 'eyebrow'; h.textContent = g.name; menu.appendChild(h);
      list.forEach(function (x) {
        var a = document.createElement('a'); a.href = href(x); a.textContent = x.name;
        var sm = document.createElement('small'); sm.textContent = x.size; a.appendChild(sm);
        if (x.id === curId) a.setAttribute('aria-current', 'page'); menu.appendChild(a);
      });
    });
    var kit = document.createElement('a'); kit.href = '/kit/'; kit.className = 'inav__kit'; kit.textContent = 'Комплект: все носители на столе'; menu.appendChild(kit);
    function open(on) { menu.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(menu.hidden); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
    wrap.appendChild(btn); wrap.appendChild(menu);
    if (i >= 0) [[-1, 'M10 3 5 8l5 5', 'Предыдущий носитель'], [1, 'm6 3 5 5-5 5', 'Следующий носитель']].forEach(function (d) {
      var t = ITEMS[(i + d[0] + ITEMS.length) % ITEMS.length], a = document.createElement('a');
      a.className = 'button button--icon-only button--sm button--tertiary inav__step'; a.href = href(t); a.title = d[2] + ': ' + t.name; a.setAttribute('aria-label', d[2] + ': ' + t.name);
      a.innerHTML = CH.replace('{d}', d[1]); wrap.appendChild(a);
    });
    if (before) host.insertBefore(wrap, before); else host.appendChild(wrap);
  }

  window.PDA = {
    STATUS: STATUS, href: href, filesState: filesState, store: store, mountNav: mountNav,
    PALETTE: PALETTE, LOGO: LOGO, COAT: COAT, GROUPS: GROUPS, ITEMS: ITEMS,
    item: function (id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; },
    group: function (id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i]; return null; },
    hexOf: hexOf, lightFor: lightFor, preload: preload, build: build, dispose: dispose, makeRenderer: makeRenderer, makeScene: makeScene, frameIt: frameIt, syncSelected: syncSelected,
    webgl: function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  };
})();
