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
  var TBD = 'Будет указано с макетом';
  function stubFiles() {
    return [
      { name: 'Печатный PDF', kind: 'PDF/X-4 · вылеты · метки' },
      { name: 'Исходник макета', kind: 'AI / INDD' },
      { name: 'Слои отделки', kind: 'Фольга · конгрев · высечка' },
      { name: 'Превью', kind: 'PNG' }
    ];
  }
  function stub(id, group, name, size, model, extra) {
    var it = {
      id: id, group: group, name: name, size: size, model: model, stub: true,
      desc: 'Макет-заглушка: форма и размеры настоящие, оформление условное. Заменится, когда появится утверждённый макет.',
      spec: [['Формат', size], ['Материал', TBD], ['Печать', TBD], ['Отделка', TBD], ['Тираж', TBD]],
      variants: STUB_VARIANTS, files: stubFiles()
    };
    for (var k in extra || {}) it[k] = extra[k];
    return it;
  }

  var ITEMS = [
    { id: 'booklet', group: 'editions', name: 'Буклет', size: '270 × 245 мм', href: '/booklet/', count: 'Развороты',
      model: { type: 'book', w: 270, h: 245, t: 7, front: '/cover-front.jpg', back: '/cover-back.jpg', spine: '/spine.jpg' },
      desc: 'Имиджевый буклет: листается в 3D, с выбором материала обложки.' },
    { id: 'covers', group: 'editions', name: 'Обложки буклета', size: '270 × 245 мм', href: '/cover/', count: 'Варианты обложек',
      model: { type: 'book', w: 270, h: 245, t: 15, front: '/cv/n01.art.jpg', back: null, spine: null, tint: '#EFE6D3' },
      desc: 'Варианты обложки с примеркой фольги, ламинации и обреза.' },
    stub('card', 'office', 'Визитка', '90 × 50 мм', { type: 'slab', w: 90, h: 50, t: 0.7, face: 'card' }),
    stub('letterhead', 'office', 'Фирменный бланк', 'A4 · 210 × 297 мм', { type: 'slab', w: 210, h: 297, t: 0.35, face: 'letter' }, { fixedBase: 'ivory', variants: [
      { name: 'Логотип золотом', note: 'Шапка фольгой', base: 'ivory', logo: 'gold', coat: 'matte' },
      { name: 'Логотип печатью', note: 'Шапка в бордо, для офисной печати', base: 'ivory', logo: 'print', coat: 'matte' },
      { name: 'Логотип блинтом', note: 'Слепое тиснение', base: 'ivory', logo: 'blind', coat: 'matte' }] }),
    stub('envelope', 'office', 'Конверт', 'E65 · 220 × 110 мм', { type: 'slab', w: 220, h: 110, t: 1.4, face: 'envelope' }),
    stub('folder', 'office', 'Папка', 'под A4 · 220 × 310 мм', { type: 'slab', w: 220, h: 310, t: 3.2, face: 'center' }),
    stub('notebook', 'office', 'Блокнот', 'A5 · 148 × 210 мм', { type: 'pad', w: 148, h: 210, t: 13 }),
    stub('keycard', 'guest', 'Ключ-карта', '86 × 54 мм', { type: 'slab', w: 86, h: 54, t: 0.9, r: 3.2, face: 'card' }),
    stub('postcard', 'guest', 'Открытка', 'A6 · 148 × 105 мм', { type: 'slab', w: 148, h: 105, t: 0.6, face: 'postcard' }),
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
      if (back) {
        k.sub(); c.globalAlpha = 0.28; c.lineWidth = H * 0.006; c.beginPath(); c.moveTo(0, 0); c.lineTo(W / 2, H * 0.56); c.lineTo(W, 0); c.stroke(); c.globalAlpha = 1;
        k.ink(); wordmark(c, W / 2, H * 0.78, W * 0.2); return;
      }
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
    wrap: function (c, W, H, k) { k.ink(); wordmark(c, W / 2, H / 2, W * 0.17); }
  };

  function st(opts) {
    var base = hexOf(opts.base), dark = lum(base) < 0.45, logo = opts.logo || 'gold';
    return { base: base, dark: dark, logo: logo, coat: opts.coat || 'matte',
      sub: dark ? '#FEEEDA' : '#401216',
      print: dark ? '#FEEEDA' : '#401216' };
  }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h); return c; }
  function tex(cv, srgb) {
    var t = new T.CanvasTexture(cv); if (srgb) t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }
  /* Материал грани: цвет + (для фольги) карта металла/шероховатости, + (для блинта) рельеф */
  function faceMaterial(wmm, hmm, face, s, back, label) {
    var k = 1024 / Math.max(wmm, hmm), W = Math.round(wmm * k), H = Math.round(hmm * k);
    var paint = typeof face === 'function' ? face : FACES[face] || FACES.center;
    var cv = canvas(W, H), c = cv.getContext('2d');
    c.fillStyle = s.base; c.fillRect(0, 0, W, H);
    var inkStyle;
    if (s.logo === 'print') inkStyle = s.print;
    else if (s.logo === 'blind') inkStyle = mix(s.base, s.dark ? '#ffffff' : '#000000', s.dark ? 0.1 : 0.09);
    else { var f = FOIL[s.logo], g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, f[0]); g.addColorStop(0.45, f[1]); g.addColorStop(1, f[2]); inkStyle = g; }
    paint(c, W, H, {
      ink: function () { c.fillStyle = inkStyle; c.strokeStyle = inkStyle; c.globalAlpha = 1; },
      sub: function () { c.fillStyle = s.sub; c.strokeStyle = s.sub; }
    }, back);
    if (label && !back) { c.globalAlpha = 0.32; c.fillStyle = s.sub; spaced(c, 'МАКЕТ-ЗАГЛУШКА', W / 2, H - Math.max(14, H * 0.035), Math.max(10, Math.min(W, H) * 0.022), 0.22, SANS, 500); c.globalAlpha = 1; }
    var rough = s.coat === 'gloss' ? 0.36 : 0.9;
    var m = new T.MeshStandardMaterial({ map: tex(cv, true), roughness: rough, metalness: 0 });
    if (s.logo === 'gold' || s.logo === 'silver' || s.logo === 'blind') {
      var mv = canvas(W, H), mc = mv.getContext('2d'), foil = s.logo !== 'blind';
      mc.fillStyle = foil ? 'rgb(0,' + Math.round(rough * 255) + ',0)' : '#000'; mc.fillRect(0, 0, W, H);
      var ms = foil ? 'rgb(0,70,255)' : '#fff';
      paint(mc, W, H, { ink: function () { mc.fillStyle = ms; mc.strokeStyle = ms; mc.globalAlpha = 1; }, sub: function () { mc.fillStyle = 'rgba(0,0,0,0)'; mc.strokeStyle = 'rgba(0,0,0,0)'; } }, back);
      var mt = tex(mv, false);
      if (foil) { m.metalnessMap = mt; m.roughnessMap = mt; m.metalness = 1; m.roughness = 1; }
      else { m.bumpMap = mt; m.bumpScale = -0.012; }
    }
    return m;
  }
  function plain(color, rough) { return new T.MeshStandardMaterial({ color: new T.Color(color), roughness: rough == null ? 0.9 : rough, metalness: 0 }); }

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
    var g = new T.ShapeGeometry(shape, 8), uv = g.attributes.uv, p = g.attributes.position;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return new T.Mesh(g, mat);
  }
  /* Плоский носитель с лицом и оборотом */
  function slab(w, h, t, r, front, back, edge) {
    w *= U; h *= U; t *= U; r = (r || 0) * U;
    var shape = rrect(w, h, r), grp = new T.Group();
    var body = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 8 }), edge);
    body.position.z = -t / 2; grp.add(body);
    var f = facePlane(shape, w, h, front); f.position.z = t / 2 + 0.0006; grp.add(f);
    var b = facePlane(shape, w, h, back); b.rotation.y = Math.PI; b.position.z = -t / 2 - 0.0006; grp.add(b);
    return grp;
  }
  function loadTex(url, onload) { var t = new T.TextureLoader().load(url, onload); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; }

  var BUILD = {
    slab: function (m, s, it, redraw) {
      var edge = plain(mix(s.base, '#ffffff', s.dark ? 0.12 : 0.4));
      return slab(m.w, m.h, m.t, m.r, faceMaterial(m.w, m.h, m.face, s, false, it.stub), faceMaterial(m.w, m.h, m.face, s, true), edge);
    },
    pad: function (m, s, it) {
      var w = m.w * U, h = m.h * U, t = m.t * U, pages = plain('#F4EEE2'), cover = plain(s.base, s.coat === 'gloss' ? 0.36 : 0.9);
      var mesh = new T.Mesh(new T.BoxGeometry(w, h, t), [pages, cover, pages, pages, faceMaterial(m.w, m.h, 'center', s, false, it.stub), faceMaterial(m.w, m.h, 'card', s, true)]);
      var g = new T.Group(); g.add(mesh); return g;
    },
    book: function (m, s, it, redraw) {
      var w = m.w * U, h = m.h * U, t = m.t * U, pages = plain('#F1EADB'), tint = plain(m.tint || '#E9E2D2');
      var img = function (u) { return u ? new T.MeshStandardMaterial({ map: loadTex(u, redraw), roughness: 0.6 }) : tint; };
      var g = new T.Group(); g.add(new T.Mesh(new T.BoxGeometry(w, h, t), [pages, img(m.spine), pages, pages, img(m.front), img(m.back)])); return g;
    },
    tent: function (m, s, it) {
      var g = new T.Group(), a = 0.33, hh = m.h * U, edge = plain(mix(s.base, '#ffffff', 0.2));
      var f = slab(m.w, m.h, 1.2, 0, faceMaterial(m.w, m.h, 'calendar', s, false, it.stub), plain(s.base), edge);
      var b = slab(m.w, m.h, 1.2, 0, faceMaterial(m.w, m.h, 'center', s, true), plain(s.base), edge);
      var dz = Math.sin(a) * hh / 2;
      f.rotation.x = -a; f.position.z = dz; b.rotation.y = Math.PI; b.rotation.x = a; b.position.z = -dz;
      var base = new T.Mesh(new T.BoxGeometry(m.w * U, 0.012, dz * 4), edge); base.position.y = -Math.cos(a) * hh / 2;
      g.add(f, b, base); return g;
    },
    bag: function (m, s, it) {
      var w = m.w * U, h = m.h * U, d = m.d * U, side = plain(mix(s.base, '#000000', 0.06), s.coat === 'gloss' ? 0.36 : 0.9), top = plain(mix(s.base, '#000000', 0.45));
      var paint = function (c, W, H, k) { k.ink(); wordmark(c, W / 2, H * 0.52, W * 0.5); };
      var g = new T.Group();
      g.add(new T.Mesh(new T.BoxGeometry(w, h, d), [side, side, top, side, faceMaterial(m.w, m.h, paint, s, false, it.stub), faceMaterial(m.w, m.h, paint, s, true)]));
      var rope = plain(s.logo === 'silver' ? '#a4a8b0' : s.dark ? '#A67C3C' : '#401216', 0.7);
      [d / 2 - 0.02, -d / 2 + 0.02].forEach(function (z) {
        var cv = new T.CatmullRomCurve3([new T.Vector3(-w * 0.2, h / 2 - 0.02, z), new T.Vector3(-w * 0.17, h / 2 + 0.55, z), new T.Vector3(0, h / 2 + 0.78, z), new T.Vector3(w * 0.17, h / 2 + 0.55, z), new T.Vector3(w * 0.2, h / 2 - 0.02, z)]);
        g.add(new T.Mesh(new T.TubeGeometry(cv, 40, 0.022, 10), rope));
      });
      g.userData.cy = 0.3; return g;
    },
    mug: function (m, s, it) {
      var r = m.r * U, h = m.h * U, g = new T.Group(), inner = plain('#FBF6EC', 0.3);
      var s2 = { base: s.base, dark: s.dark, logo: s.logo, coat: 'gloss', sub: s.sub, print: s.print };
      var wm = faceMaterial(m.r * 2 * Math.PI, m.h, 'wrap', s2, false, false);
      var out = new T.Mesh(new T.CylinderGeometry(r, r, h, 72, 1, true), wm); out.rotation.y = Math.PI; g.add(out);
      var glaze = plain(s.base, 0.36);
      var inn = new T.Mesh(new T.CylinderGeometry(r * 0.93, r * 0.93, h * 0.97, 72, 1, true), inner); inn.material.side = T.BackSide; inn.position.y = h * 0.015; g.add(inn);
      var rim = new T.Mesh(new T.RingGeometry(r * 0.93, r, 72), glaze); rim.rotation.x = -Math.PI / 2; rim.position.y = h / 2; g.add(rim);
      var bot = new T.Mesh(new T.CircleGeometry(r, 72), glaze); bot.rotation.x = Math.PI / 2; bot.position.y = -h / 2; g.add(bot);
      var floor = new T.Mesh(new T.CircleGeometry(r * 0.93, 72), inner.clone()); floor.material.side = T.FrontSide; floor.rotation.x = -Math.PI / 2; floor.position.y = -h / 2 + h * 0.03; g.add(floor);
      var hd = new T.Mesh(new T.TorusGeometry(h * 0.27, r * 0.14, 16, 40, Math.PI), glaze); hd.rotation.z = -Math.PI / 2; hd.position.x = r * 0.97; g.add(hd);
      return g;
    }
  };

  /* Собирает модель носителя. opts: { base, logo, coat } */
  function build(item, opts, redraw) {
    var s = st(opts || {}), g = BUILD[item.model.type](item.model, s, item, redraw);
    var box = new T.Box3().setFromObject(g), sph = box.getBoundingSphere(new T.Sphere());
    var holder = new T.Group(); g.position.sub(sph.center); holder.add(g);
    holder.userData = { radius: sph.radius, minY: box.min.y - sph.center.y, w: box.max.x - box.min.x, d: box.max.z - box.min.z };
    return holder;
  }
  function dispose(obj) {
    obj.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      [].concat(o.material || []).forEach(function (m) { ['map', 'metalnessMap', 'bumpMap'].forEach(function (k) { if (m[k]) m[k].dispose(); }); m.dispose(); });
    });
  }

  /* ───── сцена ───── */
  function makeRenderer(cv, w, h) {
    var r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: false });
    r.setPixelRatio(1); r.setSize(w, h, false);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.NoToneMapping; // без тон-маппинга: фирменные цвета не уходят в сторону
    return r;
  }
  /* Мягкая студия для отражений фольги: тёплый купол и три световые панели */
  function makeEnv(renderer) {
    var sc = new T.Scene(), basic = function (v) { var m = new T.MeshBasicMaterial({ side: T.DoubleSide }); m.color.setRGB(v, v * 0.96, v * 0.9); return m; };
    sc.add(new T.Mesh(new T.SphereGeometry(20, 24, 12), basic(0.6)));
    var p1 = new T.Mesh(new T.PlaneGeometry(14, 8), basic(5)); p1.position.set(-6, 9, 8); p1.lookAt(0, 0, 0); sc.add(p1);
    var p2 = new T.Mesh(new T.PlaneGeometry(6, 12), basic(3)); p2.position.set(12, 2, 4); p2.lookAt(0, 0, 0); sc.add(p2);
    var p3 = new T.Mesh(new T.PlaneGeometry(10, 4), basic(1.4)); p3.position.set(0, -2, -12); p3.lookAt(0, 0, 0); sc.add(p3);
    var pm = new T.PMREMGenerator(renderer), rt = pm.fromScene(sc, 0.03); pm.dispose();
    return rt.texture;
  }
  function makeScene(renderer) {
    var scene = new T.Scene(); scene.environment = makeEnv(renderer);
    var key = new T.DirectionalLight(0xfff4e2, 0.22); key.position.set(-3, 5, 6); scene.add(key);
        // контактная тень
    var cv = canvas(256, 256), c = cv.getContext('2d'), g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(30,20,10,0.5)'); g.addColorStop(0.5, 'rgba(30,20,10,0.16)'); g.addColorStop(1, 'rgba(30,20,10,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    var shadow = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
    var cam = new T.PerspectiveCamera(26, 1, 0.1, 100);
    return { scene: scene, cam: cam, shadow: shadow };
  }
  /* Ставит модель в кадр. zoom 1 = вписать целиком */
  function frameIt(stage, holder, aspect, zoom, yaw, pitch) {
    var R = holder.userData.radius, fov = stage.cam.fov * Math.PI / 180;
    var fit = R / Math.sin(Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2);
    stage.cam.aspect = aspect; var dist = fit * 1.16 / (zoom || 1); stage.cam.position.set(0, dist * 0.2, dist * 0.98); stage.cam.lookAt(0, 0, 0); stage.cam.updateProjectionMatrix();
    holder.rotation.set(pitch || 0, yaw || 0, 0, 'XYZ');
    var u = holder.userData; stage.shadow.position.y = u.minY - R * 0.05; stage.shadow.scale.set(u.w * 1.5 + R * 0.3, u.d * 1.6 + R * 0.8, 1);
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

  window.PDA = {
    PALETTE: PALETTE, LOGO: LOGO, COAT: COAT, GROUPS: GROUPS, ITEMS: ITEMS,
    item: function (id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; },
    group: function (id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i]; return null; },
    hexOf: hexOf, build: build, dispose: dispose, makeRenderer: makeRenderer, makeScene: makeScene, frameIt: frameIt, syncSelected: syncSelected,
    webgl: function () { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  };
})();
