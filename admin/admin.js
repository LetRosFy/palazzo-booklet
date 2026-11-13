/* Палаццо де Агой · админка фирменных носителей.
   Работает с /api/admin: вход, карточки носителей, варианты и макеты, файлы для печати, учётные записи.
   Встроенный каталог берётся из media.js (PDA.DEFAULTS); всё, что меняют здесь, сохраняется поверх него. */
(function () {
  'use strict';
  var P = window.PDA, app = document.getElementById('app');
  var S = { user: null, items: [], etag: null, users: [], usage: null, sel: null, tab: 'items', dirty: false, saving: false, busy: 0, trash: [], conflict: false, baseUrl: '', mediaPrefix: 'media/', maxFile: 0 };
  var DEF = {}; P.DEFAULTS.forEach(function (d) { DEF[d.id] = d; });
  var SHAPES = [['slab', 'Лист или карта'], ['pad', 'Блокнот, книга'], ['tent', 'Настольный домик'], ['bag', 'Пакет'], ['mug', 'Кружка']];
  var ROLES = { owner: 'Владелец', editor: 'Редактор' };
  var FILE_EXT = /\.(pdf|ai|eps|indd|idml|psd|svg|png|jpe?g|webp|tiff?|zip)$/i;
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

  /* ───── мелочи ───── */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in attrs || {}) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v; else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') e[k] = !!v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    [].concat(kids == null ? [] : kids).forEach(function (c) { if (c != null && c !== false) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function toast(t) { var x = document.getElementById('toast'); x.textContent = t; x.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { x.hidden = true; }, 3200); }
  function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(n >= 104857600 ? 0 : 1).replace('.', ',') + ' МБ' : Math.max(1, Math.round(n / 1024)) + ' КБ'; }
  function today() { var d = new Date(), p = function (n) { return n < 10 ? '0' + n : n; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }
  var TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  function slug(s) { return String(s).toLowerCase().replace(/[а-яё]/g, function (c) { return TR[c]; }).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36); }
  function fileSlug(name) { var m = /^(.*?)(\.[a-z0-9]+)?$/i.exec(name); return (slug(m[1]) || 'file') + (m[2] || '').toLowerCase(); }
  function isOurs(u) { return !!u && u.indexOf(S.baseUrl + S.mediaPrefix) === 0; }

  function api(a, body) {
    var opt = body === undefined ? { credentials: 'same-origin' } : { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', 'x-pda': '1' }, body: JSON.stringify(body) };
    return fetch('/api/admin?a=' + a, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok) return j;
        var e = new Error(j.error || 'Не получилось. Попробуйте ещё раз.'); e.status = r.status; e.conflict = j.conflict;
        if (r.status === 401 && S.user && a !== 'login') { S.user = null; gate(false, 'Сессия закончилась. Войдите заново — несохранённые правки на этой странице пропадут.'); }
        throw e;
      });
    });
  }

  /* окно с полями: fields = [{ key, label, type, value, options, hint }] */
  function dialog(title, fields, okLabel, submit, note) {
    var err = h('p', { class: 'err', hidden: true }), inputs = {};
    var ok = h('button', { class: 'button button--primary', type: 'submit', text: okLabel });
    var d = h('dialog', { class: 'dlg' }, h('form', { method: 'dialog', onsubmit: function (e) {
      e.preventDefault(); var v = {}; for (var k in inputs) v[k] = inputs[k].value;
      ok.disabled = true; err.hidden = true;
      Promise.resolve().then(function () { return submit(v); }).then(function () { d.close(); }, function (x) { err.textContent = x.message; err.hidden = false; ok.disabled = false; });
    } }, [h('h3', { text: title }), note ? h('p', { class: 'muted small', text: note }) : null].concat(fields.map(function (f) {
      var el = f.options ? h('select', { class: 'input' }, f.options.map(function (o) { return h('option', { value: o[0], text: o[1], selected: o[0] === f.value }); }))
        : h('input', { class: 'input', type: f.type || 'text', value: f.value == null ? '' : f.value, autocomplete: f.type === 'password' ? 'new-password' : 'off', required: f.optional ? null : true, step: f.type === 'number' ? 'any' : null, min: f.type === 'number' ? '1' : null, placeholder: f.hint || null });
      inputs[f.key] = el; return h('label', { class: 'fld' }, [h('span', { text: f.label }), el]);
    }), [err, h('div', { class: 'acts' }, [h('button', { class: 'button button--tertiary', type: 'button', text: 'Отмена', onclick: function () { d.close(); } }), ok])])));
    d.addEventListener('close', function () { d.remove(); });
    document.body.appendChild(d); d.showModal();
  }
  function confirmBox(title, note, okLabel, fn) { dialog(title, [], okLabel, fn, note); }

  /* ───── вход ───── */
  function gate(setup, note) {
    var err = h('p', { class: 'err', hidden: true }), f = {};
    function inp(key, label, type, ac) { f[key] = h('input', { class: 'input', type: type || 'text', required: true, autocomplete: ac || 'off', name: key }); return h('label', { class: 'fld' }, [h('span', { text: label }), f[key]]); }
    var btn = h('button', { class: 'button button--primary button--full-width', type: 'submit', text: setup ? 'Создать и войти' : 'Войти' });
    var form = h('form', { onsubmit: function (e) {
      e.preventDefault(); btn.disabled = true; err.hidden = true;
      var body = {}; for (var k in f) body[k] = f[k].value;
      api(setup ? 'setup' : 'login', body).then(enter, function (x) { err.textContent = x.message; err.hidden = false; btn.disabled = false; });
    } }, setup
      ? [inp('code', 'Код установки'), inp('name', 'Ваше имя', 'text', 'name'), inp('login', 'Логин', 'text', 'username'), inp('password', 'Пароль, от 8 символов', 'password', 'new-password'), err, btn]
      : [inp('login', 'Логин', 'text', 'username'), inp('password', 'Пароль', 'password', 'current-password'), err, btn]);
    app.replaceChildren(h('div', { class: 'gate' }, h('div', { class: 'card' }, [
      h('div', {}, [h('p', { class: 'eyebrow', text: 'Палаццо де Агой' }), h('h2', { text: setup ? 'Первый запуск админки' : 'Вход в админку' })]),
      h('p', { class: 'muted', text: note || (setup ? 'Создайте учётную запись владельца. Код установки вам передал разработчик; после этого шага он больше не понадобится.' : 'Управление фирменными носителями: макеты, варианты и файлы для печати.') }),
      form, h('a', { href: '/', class: 'small', text: '← На сайт носителей' })])));
    (f.code || f.login).focus();
  }

  /* ───── данные ───── */
  function fromDefault(d) {
    var it = { id: d.id, group: d.group, name: d.name, size: d.size, desc: d.desc, status: d.status || 'draft', hidden: false, front: '', back: '' };
    if (!d.href) { it.spec = clone(d.spec || []); it.variants = clone(d.variants || []); it.files = clone(d.files || []); if (d.fixedBase) it.fixedBase = d.fixedBase; }
    return it;
  }
  function normalize(cat) {
    var saved = {}, out = [];
    ((cat && cat.items) || []).forEach(function (it) { saved[it.id] = it; });
    var order = ((cat && cat.order) || []).concat(P.DEFAULTS.map(function (d) { return d.id; }), Object.keys(saved));
    order.forEach(function (id) {
      if (out.some(function (x) { return x.id === id; })) return;
      var d = DEF[id], it = saved[id] ? clone(saved[id]) : d ? fromDefault(d) : null;
      if (!it || (!d && !it.custom)) return;
      if (!(d && d.href)) { it.spec = it.spec || []; it.variants = it.variants && it.variants.length ? it.variants : clone((d && d.variants) || [{ name: 'Основной', note: '', base: 'ivory', logo: 'gold', coat: 'matte' }]); it.files = it.files || []; }
      out.push(it);
    });
    return out;
  }
  function isSection(it) { return !!(DEF[it.id] && DEF[it.id].href); }
  function modelOf(it) { return it.custom ? it.model : DEF[it.id] && DEF[it.id].model; }
  function aspectOf(it) { var m = modelOf(it); if (!m || m.type === 'book') return null; return m.type === 'mug' ? 2 * Math.PI * m.r / m.h : m.w / m.h; }
  function cur() { for (var i = 0; i < S.items.length; i++) if (S.items[i].id === S.sel) return S.items[i]; return null; }
  function dirty() { if (!S.dirty) { S.dirty = true; } paintBar(); }
  function drop(url) { if (isOurs(url)) S.trash.push(url); }

  function enter(st) {
    S.user = st.user; S.etag = st.etag; S.users = st.users || []; S.baseUrl = st.baseUrl; S.mediaPrefix = st.mediaPrefix; S.maxFile = st.maxFile;
    S.items = normalize(st.catalog); S.dirty = false; S.trash = []; S.conflict = false;
    if (!cur()) S.sel = (S.items.filter(function (i) { return !isSection(i); })[0] || S.items[0]).id;
    render(); loadUsage();
  }
  function loadUsage() { return api('usage').then(function (u) { S.usage = u; paintMeter(); }, function () {}); }

  /* ───── каркас ───── */
  var elMeter, elBar, elList, elMain;
  function render() {
    elMeter = h('div', { class: 'meter', title: 'Место под файлы на тарифе Vercel Hobby' });
    elList = h('nav', { class: 'list', 'aria-label': 'Носители' }); elMain = h('div', { class: 'ed' }); elBar = h('div', { class: 'savebar' });
    var owner = S.user.role === 'owner';
    function tabBtn(id, text) { return h('button', { class: 'toggle-button toggle-button--sm', type: 'button', 'aria-pressed': S.tab === id ? 'true' : 'false', text: text, onclick: function () { S.tab = id; render(); } }); }
    app.replaceChildren.apply(app, [
      h('header', { class: 'adm__top' }, [
        h('div', { class: 'top__l' }, [h('h1', { class: 'brand' }, ['Палаццо де Агой ', h('small', { text: 'админка носителей' })]),
          owner ? h('div', { class: 'adm__nav toggle-button-group toggle-button-group--horizontal', role: 'group' }, [tabBtn('items', 'Носители'), tabBtn('users', 'Доступ')]) : null]),
        h('div', { class: 'r' }, [elMeter,
          h('span', { class: 'chip', text: S.user.name + ' · ' + ROLES[S.user.role].toLowerCase() }),
          h('button', { class: 'button button--sm button--tertiary', type: 'button', text: 'Сменить пароль', onclick: changePassword }),
          h('button', { class: 'button button--sm button--secondary', type: 'button', text: 'Выйти', onclick: function () { if (S.dirty && !window.confirm('Есть несохранённые изменения. Выйти без сохранения?')) return; api('logout', {}).then(function () { S.user = null; S.dirty = false; gate(false); }); } })])
      ]),
      S.conflict ? h('div', { class: 'banner' }, [h('span', { text: 'Каталог изменили в другом окне или другой человек. Обновите страницу, чтобы увидеть свежие данные; ваши несохранённые правки придётся внести заново.' }), h('button', { class: 'button button--sm button--primary', type: 'button', text: 'Обновить', onclick: function () { S.dirty = false; location.reload(); } })]) : null,
      S.tab === 'users' && owner ? usersView() : h('div', { class: 'adm__cols' }, [elList, elMain]),
      elBar].filter(Boolean));
    P.syncSelected && syncPressed();
    paintMeter();
    if (S.tab === 'items') { paintList(); paintEditor(); }
    paintBar();
  }
  function syncPressed() { Array.prototype.forEach.call(app.querySelectorAll('[aria-pressed]'), function (b) { if (b.getAttribute('aria-pressed') === 'true') b.setAttribute('data-selected', 'true'); else b.removeAttribute('data-selected'); }); }
  function paintMeter() {
    if (!elMeter) return; var u = S.usage;
    if (!u) { elMeter.replaceChildren(h('span', { text: 'Место в хранилище…' })); return; }
    var k = Math.min(1, u.bytes / u.limit);
    elMeter.className = 'meter' + (k > 0.9 ? ' full' : k > 0.7 ? ' warn' : '');
    elMeter.replaceChildren(h('span', { text: 'Занято ' + mb(u.bytes) + ' из ' + mb(u.limit) }), h('span', { text: Math.round(k * 100) + '%' }), h('i', {}, h('b', { style: 'width:' + Math.max(1, k * 100) + '%' })));
  }
  function paintBar() {
    if (!elBar) return;
    elBar.className = 'savebar' + (S.dirty ? ' dirty' : ''); elBar.hidden = S.tab !== 'items';
    var it = cur(), wait = S.saving || S.busy > 0;
    elBar.replaceChildren(h('div', {}, [
      h('span', { class: 'state', text: S.busy > 0 ? 'Идёт загрузка файла…' : S.saving ? 'Сохраняю…' : S.dirty ? 'Есть несохранённые изменения' : 'Все изменения сохранены' }),
      it && !it.hidden ? h('a', { class: 'button button--sm button--tertiary', href: (DEF[it.id] && DEF[it.id].href) || '/item/?id=' + it.id, target: '_blank', rel: 'noopener', text: 'Открыть на сайте' }) : null,
      h('button', { class: 'button button--primary', type: 'button', text: 'Сохранить', disabled: !S.dirty || wait || S.conflict, onclick: save })]));
  }
  function paintList() {
    var kids = [];
    P.GROUPS.forEach(function (g) {
      var list = S.items.filter(function (i) { return i.group === g.id; }); if (!list.length) return;
      kids.push(h('p', { class: 'eyebrow', text: g.name }));
      list.forEach(function (it) {
        var n = (it.files || []).filter(function (f) { return f.url; }).length, t = (it.files || []).length;
        kids.push(h('button', { class: 'it' + (it.hidden ? ' off' : ''), type: 'button', 'aria-current': it.id === S.sel ? 'true' : null, onclick: function () { S.sel = it.id; paintList(); paintEditor(); paintBar(); window.scrollTo({ top: 0 }); } }, [
          h('b', { text: it.name }), h('span', { class: 'dot st-' + it.status, title: P.STATUS[it.status] }),
          h('small', { text: it.hidden ? 'Скрыт с сайта' : isSection(it) ? 'Отдельный раздел сайта' : P.STATUS[it.status] + (t ? ' · файлы ' + n + '/' + t : '') })]));
      });
    });
    kids.push(h('button', { class: 'button button--secondary button--sm add', type: 'button', text: '+ Новый носитель', onclick: newItem }));
    elList.replaceChildren.apply(elList, kids);
  }

  /* ───── поля ───── */
  function fld(label, el) { return h('label', { class: 'fld' }, [h('span', { text: label }), el]); }
  function text(obj, key, attrs, after) {
    var a = { class: 'input', type: 'text', value: obj[key] || '', oninput: function () { obj[key] = el.value; dirty(); if (after) after(); } };
    for (var k in attrs || {}) a[k] = attrs[k];
    var el = h(attrs && attrs.rows ? 'textarea' : 'input', a); return el;
  }
  function pick(obj, key, options, after) {
    var el = h('select', { class: 'input', onchange: function () { obj[key] = el.value; dirty(); if (after) after(); } }, options.map(function (o) { return h('option', { value: o[0], text: o[1], selected: o[0] === obj[key] }); }));
    return el;
  }
  function sec(title, note, kids, action) { return h('section', { class: 'sec' }, [h('header', {}, [h('div', {}, [h('h3', { text: title }), note ? h('p', { text: note }) : null]), action || null])].concat(kids)); }

  /* ───── изображения: уменьшаем и подгоняем под формат носителя прямо в браузере ───── */
  var pdfReady = null;
  function loadScript(src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error('Не удалось загрузить модуль чтения PDF')); }; document.head.appendChild(s); }); }
  function pdfLib() {
    if (!pdfReady) pdfReady = loadScript(PDFJS + 'pdf.min.js').then(function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; return window.pdfjsLib; });
    return pdfReady;
  }
  function isPdf(f) { return f.type === 'application/pdf' || /\.pdf$/i.test(f.name); }
  function pdfPage(doc, n) {
    return doc.getPage(n).then(function (pg) {
      var v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(5, 2600 / Math.max(v0.width, v0.height)) });
      var c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return c; });
    });
  }
  function readImage(file) {
    return new Promise(function (ok, bad) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); bad(new Error('Не удалось прочитать изображение. Подойдут JPG, PNG, WebP или PDF.')); }; im.src = u;
    });
  }
  /* → Promise<[{ blob, cropped }]>: для PDF — первая и (если есть) вторая страница */
  function prepare(file, aspect) {
    var srcs = isPdf(file)
      ? pdfLib().then(function (lib) { return file.arrayBuffer().then(function (b) { return lib.getDocument({ data: b }).promise; }); }).then(function (doc) { return Promise.all([pdfPage(doc, 1), doc.numPages > 1 ? pdfPage(doc, 2) : null]); })
      : readImage(file).then(function (im) { return [im, null]; });
    return srcs.then(function (list) {
      return Promise.all(list.filter(Boolean).map(function (src) {
        var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height, cx = 0, cy = 0, cw = sw, ch = sh, cropped = false;
        if (aspect && Math.abs(sw / sh / aspect - 1) > 0.02) { cropped = true; if (sw / sh > aspect) { cw = sh * aspect; cx = (sw - cw) / 2; } else { ch = sw / aspect; cy = (sh - ch) / 2; } }
        var k = Math.min(1, 2048 / Math.max(cw, ch)), c = document.createElement('canvas'); c.width = Math.round(cw * k); c.height = Math.round(ch * k);
        var g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, cx, cy, cw, ch, 0, 0, c.width, c.height);
        return new Promise(function (ok, bad) { c.toBlob(function (b) { b ? ok({ blob: b, cropped: cropped }) : bad(new Error('Не удалось обработать изображение')); }, 'image/jpeg', 0.9); });
      }));
    });
  }
  function upload(blob, itemId, name, progress) {
    if (S.usage && S.usage.bytes + blob.size > S.usage.limit) return Promise.reject(new Error('В хранилище не хватит места: файл ' + mb(blob.size) + ', свободно ' + mb(Math.max(0, S.usage.limit - S.usage.bytes)) + '. Удалите ненужные файлы или дайте ссылку на файл.'));
    if (S.maxFile && blob.size > S.maxFile) return Promise.reject(new Error('Файл больше ' + mb(S.maxFile) + '. Дайте на него ссылку вместо загрузки.'));
    S.busy++; paintBar();
    return window.PDABlob.upload(S.mediaPrefix + itemId + '/' + fileSlug(name), blob, {
      access: 'public', handleUploadUrl: '/api/admin?a=upload', headers: { 'x-pda': '1' }, multipart: blob.size > 8 * 1048576,
      contentType: blob.type || undefined, onUploadProgress: function (e) { if (progress) progress(e.percentage || 0); }
    }).then(function (r) { S.busy--; paintBar(); if (S.usage) { S.usage.bytes += blob.size; paintMeter(); } return r.url; }, function (e) { S.busy--; paintBar(); throw new Error('Загрузка не удалась: ' + (e && e.message || 'ошибка сети')); });
  }

  /* поле макета: лицо или оборот варианта */
  function artBox(it, v, key, label, repaint) {
    var box = h('div', { class: 'art' });
    function paint() {
      var input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,application/pdf,.pdf', 'aria-label': label + ': загрузить макет', onchange: function () { if (input.files[0]) take(input.files[0]); } });
      var dropEl = h('div', { class: 'drop' }, [v[key] ? h('img', { src: v[key], alt: label }) : h('span', { text: 'Перетащите JPG, PNG или PDF либо нажмите' }), input]);
      dropEl.addEventListener('dragover', function (e) { e.preventDefault(); dropEl.classList.add('over'); });
      dropEl.addEventListener('dragleave', function () { dropEl.classList.remove('over'); });
      dropEl.addEventListener('drop', function (e) { e.preventDefault(); dropEl.classList.remove('over'); if (e.dataTransfer.files[0]) take(e.dataTransfer.files[0]); });
      box.replaceChildren(h('span', { text: label }), dropEl, h('div', { class: 'acts' }, v[key] ? [h('button', { type: 'button', text: 'Убрать', onclick: function () { drop(v[key]); v[key] = ''; dirty(); paint(); } })] : []));
      function take(file) {
        var bar = h('i', { class: 'bar', style: 'width:4%' }); dropEl.appendChild(bar);
        prepare(file, aspectOf(it)).then(function (list) {
          var keys = key === 'front' && list.length > 1 && !v.back ? ['front', 'back'] : [key];
          return keys.reduce(function (p, k2, i) {
            return p.then(function () { return upload(list[i].blob, it.id, file.name.replace(/\.[^.]+$/, '') + '-' + (k2 === 'front' ? 'face' : 'back') + '.jpg', function (pc) { bar.style.width = Math.max(4, pc) + '%'; }); })
              .then(function (url) { drop(v[k2]); v[k2] = url; });
          }, Promise.resolve()).then(function () {
            dirty();
            toast(keys.length > 1 ? 'Из PDF взяты лицо и оборот' + (list[0].cropped ? ', подрезаны под формат носителя' : '') : list[0].cropped ? 'Макет подрезан по центру под формат носителя' : 'Макет загружен. Не забудьте сохранить.');
            if (keys.length > 1 && repaint) repaint(); else paint();
          });
        }).catch(function (e) { toast(e.message); paint(); });
      }
    }
    paint(); return box;
  }

  /* ───── карточка носителя ───── */
  function paintEditor() {
    var it = cur(); if (!it) { elMain.replaceChildren(); return; }
    var section = isSection(it), owner = S.user.role === 'owner', kids = [];
    var groupIdx = S.items.filter(function (x) { return x.group === it.group; });
    function move(d) {
      var j = groupIdx.indexOf(it) + d; if (j < 0 || j >= groupIdx.length) return;
      var a = S.items.indexOf(it), b = S.items.indexOf(groupIdx[j]); S.items[a] = groupIdx[j]; S.items[b] = it; dirty(); paintList(); paintEditor();
    }
    kids.push(h('div', { class: 'ed__head' }, [
      h('div', {}, [h('p', { class: 'eyebrow', text: (P.group(it.group) || {}).name || '' }), h('h2', { text: it.name })]),
      h('div', { class: 'acts' }, [
        h('button', { class: 'button button--sm button--tertiary', type: 'button', text: '↑ Выше', disabled: groupIdx.indexOf(it) === 0, onclick: function () { move(-1); } }),
        h('button', { class: 'button button--sm button--tertiary', type: 'button', text: '↓ Ниже', disabled: groupIdx.indexOf(it) === groupIdx.length - 1, onclick: function () { move(1); } }),
        it.custom && owner ? h('button', { class: 'button button--sm button--danger-soft', type: 'button', text: 'Удалить носитель', onclick: function () {
          confirmBox('Удалить «' + it.name + '»?', 'Носитель исчезнет с сайта вместе с макетами и файлами после сохранения.', 'Удалить', function () {
            [it.front, it.back].concat((it.variants || []).reduce(function (a, v) { return a.concat([v.front, v.back]); }, []), (it.files || []).map(function (f) { return f.url; })).forEach(drop);
            S.items.splice(S.items.indexOf(it), 1); S.sel = S.items[0].id; dirty(); paintList(); paintEditor();
          });
        } }) : null])]));

    var head = kids[0].querySelector('h2');
    kids.push(sec('Основное', section ? 'Это отдельный раздел сайта. Здесь меняются подпись, статус и видимость; развороты и обложки обновляет дизайнер.' : null, [
      h('div', { class: 'row' }, [
        fld('Название', text(it, 'name', { maxlength: 80 }, function () { head.textContent = it.name; paintList(); })),
        fld('Группа', pick(it, 'group', P.GROUPS.map(function (g) { return [g.id, g.name]; }), function () { paintList(); paintEditor(); })),
        fld('Формат', text(it, 'size', { maxlength: 80, placeholder: '210 × 297 мм' })),
        fld('Статус', pick(it, 'status', Object.keys(P.STATUS).map(function (k) { return [k, P.STATUS[k]]; }), paintList))]),
      fld('Описание', text(it, 'desc', { rows: 2, maxlength: 600 })),
      h('label', { class: 'check' }, [h('input', { type: 'checkbox', checked: it.hidden, onchange: function (e) { it.hidden = e.target.checked; dirty(); paintList(); } }), 'Скрыть с сайта'])
    ]));
    if (section) { elMain.replaceChildren.apply(elMain, kids); return; }

    /* варианты */
    var vars = h('div', { class: 'vars' });
    function paintVars() {
      vars.replaceChildren.apply(vars, it.variants.map(function (v, i) {
        return h('div', { class: 'var' }, [
          h('div', { class: 'var__h' }, [h('small', { text: (i < 9 ? '0' : '') + (i + 1) }),
            it.variants.length > 1 ? h('button', { class: 'x', type: 'button', title: 'Удалить вариант', 'aria-label': 'Удалить вариант ' + (i + 1), text: '×', onclick: function () { drop(v.front); drop(v.back); it.variants.splice(i, 1); dirty(); paintVars(); } }) : null]),
          fld('Название варианта', text(v, 'name', { maxlength: 80 })),
          fld('Пояснение', text(v, 'note', { maxlength: 160 })),
          h('div', { class: 'arts' }, [artBox(it, v, 'front', 'Лицо', paintVars), artBox(it, v, 'back', 'Оборот', paintVars)]),
          h('div', { class: 'row' }, [
            fld('Основа', pick(v, 'base', P.PALETTE.map(function (c) { return [c.id, c.name]; }))),
            fld('Логотип', pick(v, 'logo', P.LOGO.map(function (c) { return [c.id, c.name]; }))),
            fld('Покрытие', pick(v, 'coat', P.COAT.map(function (c) { return [c.id, c.name]; })))])
        ]);
      }));
    }
    paintVars();
    kids.push(sec('Варианты и макеты', 'Пока макета нет, сайт показывает условное оформление по полям «Основа», «Логотип», «Покрытие». С загруженным макетом лицо и оборот берутся из него.', [vars],
      h('button', { class: 'button button--sm button--secondary', type: 'button', text: '+ Вариант', onclick: function () {
        if (it.variants.length >= 24) return toast('Не больше 24 вариантов');
        it.variants.push({ name: 'Новый вариант', note: '', base: 'ivory', logo: 'gold', coat: 'matte', front: '', back: '' }); dirty(); paintVars();
      } })));

    /* файлы для печати */
    var files = h('div', { class: 'users' });
    function paintFiles() {
      files.replaceChildren.apply(files, it.files.map(function (f, i) {
        var prog = h('progress', { max: 100, value: 0, hidden: true });
        var input = h('input', { type: 'file', 'aria-label': 'Загрузить файл: ' + f.name, onchange: function () {
          var file = input.files[0]; if (!file) return;
          if (!FILE_EXT.test(file.name)) return toast('Такой тип файла не подходит. Можно PDF, AI, EPS, INDD, IDML, PSD, SVG, PNG, JPG, TIFF, ZIP.');
          prog.hidden = false;
          upload(file, it.id, file.name, function (pc) { prog.value = pc; }).then(function (url) { drop(f.url); f.url = url; f.bytes = file.size; f.date = today(); dirty(); paintFiles(); paintList(); toast('Файл загружен. Не забудьте сохранить.'); }, function (e) { toast(e.message); paintFiles(); });
        } });
        var name = f.url ? decodeURIComponent(f.url.split('/').pop().split('?')[0]) : '';
        return h('div', { class: 'frow' }, [
          text(f, 'name', { maxlength: 80, placeholder: 'Название', 'aria-label': 'Название файла' }, paintList),
          text(f, 'kind', { maxlength: 120, placeholder: 'Что внутри', 'aria-label': 'Описание файла' }),
          h('div', { class: 'fstate' }, f.url
            ? [h('a', { href: f.url, target: '_blank', rel: 'noopener', text: isOurs(f.url) ? name : 'Внешняя ссылка', title: f.url }), h('span', { class: 'muted', text: [f.bytes ? mb(f.bytes) : '', f.date].filter(Boolean).join(' · ') }),
              h('span', { class: 'button button--sm button--tertiary up' }, ['Заменить', input]), h('button', { class: 'button button--sm button--tertiary', type: 'button', text: 'Убрать файл', onclick: function () { drop(f.url); f.url = ''; f.bytes = 0; f.date = ''; dirty(); paintFiles(); paintList(); } }), prog]
            : [h('span', { class: 'muted', text: 'Файла пока нет' }), h('span', { class: 'button button--sm button--secondary up' }, ['Загрузить', input]),
              h('button', { class: 'button button--sm button--tertiary', type: 'button', text: 'Дать ссылку', onclick: function () {
                dialog('Ссылка на файл', [{ key: 'url', label: 'Адрес файла (https://…)', type: 'url', hint: 'https://disk.yandex.ru/…' }], 'Добавить', function (v) {
                  if (!/^https:\/\/\S+$/.test(v.url)) throw new Error('Нужна ссылка, которая начинается с https://');
                  f.url = v.url.trim(); f.bytes = 0; f.date = today(); dirty(); paintFiles(); paintList();
                }, 'Удобно для тяжёлых исходников: файл остаётся на Яндекс Диске или в другом облаке и не занимает место здесь.');
              } }), prog]),
          h('button', { class: 'x', type: 'button', title: 'Удалить строку', 'aria-label': 'Удалить строку: ' + f.name, text: '×', onclick: function () { drop(f.url); it.files.splice(i, 1); dirty(); paintFiles(); paintList(); } })]);
      }));
    }
    paintFiles();
    kids.push(sec('Файлы для печати', 'То, что скачивает типография со страницы носителя. Тяжёлые исходники лучше давать ссылкой.', [files],
      h('button', { class: 'button button--sm button--secondary', type: 'button', text: '+ Файл', onclick: function () { if (it.files.length >= 30) return toast('Не больше 30 файлов'); it.files.push({ name: 'Новый файл', kind: '', url: '', date: '', bytes: 0 }); dirty(); paintFiles(); paintList(); } })));

    /* характеристики */
    var spec = h('div', { class: 'users' });
    function paintSpec() {
      spec.replaceChildren.apply(spec, it.spec.map(function (r, i) {
        return h('div', { class: 'kv' }, [text(r, 0, { maxlength: 60, placeholder: 'Параметр', 'aria-label': 'Параметр' }), text(r, 1, { maxlength: 200, placeholder: 'Значение', 'aria-label': 'Значение' }),
          h('button', { class: 'x', type: 'button', title: 'Удалить строку', 'aria-label': 'Удалить строку', text: '×', onclick: function () { it.spec.splice(i, 1); dirty(); paintSpec(); } })]);
      }));
    }
    paintSpec();
    kids.push(sec('Характеристики', 'Таблица на странице носителя и в техкарточке.', [spec],
      h('button', { class: 'button button--sm button--secondary', type: 'button', text: '+ Строка', onclick: function () { if (it.spec.length >= 20) return; it.spec.push(['', '']); dirty(); paintSpec(); } })));

    elMain.replaceChildren.apply(elMain, kids);
  }

  function newItem() {
    dialog('Новый носитель', [
      { key: 'name', label: 'Название', hint: 'Меню ресторана' },
      { key: 'group', label: 'Группа', options: P.GROUPS.map(function (g) { return [g.id, g.name]; }), value: 'guest' },
      { key: 'type', label: 'Форма для 3D', options: SHAPES, value: 'slab' },
      { key: 'w', label: 'Ширина, мм (для кружки — диаметр)', type: 'number', value: 210 },
      { key: 'h', label: 'Высота, мм', type: 'number', value: 297 },
      { key: 't', label: 'Толщина, мм (для пакета — глубина)', type: 'number', value: 1 }
    ], 'Создать', function (v) {
      var name = v.name.trim(), w = +v.w, hh = +v.h, t = +v.t, id = slug(name) || 'item', n = 2;
      if (!name) throw new Error('Укажите название');
      if (!(w > 0 && hh > 0 && t > 0)) throw new Error('Размеры должны быть больше нуля');
      while (S.items.some(function (x) { return x.id === id; }) || DEF[id]) id = (slug(name) || 'item').slice(0, 33) + '-' + n++;
      var m = v.type === 'mug' ? { type: 'mug', r: w / 2, h: hh } : v.type === 'bag' ? { type: 'bag', w: w, h: hh, d: t } : v.type === 'tent' ? { type: 'tent', w: w, h: hh } : { type: v.type, w: w, h: hh, t: t, face: 'center' };
      var size = v.type === 'mug' ? '⌀ ' + w + ' × ' + hh + ' мм' : w + ' × ' + hh + (v.type === 'bag' ? ' × ' + t : '') + ' мм';
      S.items.push({ id: id, custom: true, model: m, group: v.group, name: name, size: size, desc: '', status: 'draft', hidden: false, front: '', back: '',
        spec: [['Формат', size], ['Материал', ''], ['Печать', ''], ['Отделка', ''], ['Тираж', '']],
        variants: [{ name: 'Основной', note: '', base: 'ivory', logo: 'gold', coat: 'matte', front: '', back: '' }],
        files: [{ name: 'Печатный PDF', kind: 'PDF/X-4 · вылеты · метки', url: '', date: '', bytes: 0 }, { name: 'Исходник макета', kind: 'AI / INDD', url: '', date: '', bytes: 0 }] });
      S.sel = id; dirty(); paintList(); paintEditor();
    }, 'Форма и размеры нужны для 3D-модели; после создания их изменить нельзя.');
  }

  /* ───── сохранение ───── */
  function save() {
    if (!S.dirty || S.saving || S.busy) return;
    S.saving = true; paintBar();
    var cat = { items: clone(S.items), order: S.items.map(function (i) { return i.id; }) };
    api('save', { catalog: cat, etag: S.etag }).then(function (r) {
      S.etag = r.etag; S.dirty = false;
      var used = JSON.stringify(r.catalog), dead = S.trash.filter(function (u, i, a) { return used.indexOf(u) < 0 && a.indexOf(u) === i; }); S.trash = [];
      toast('Сохранено. На сайте изменения появятся в течение пары минут.');
      if (dead.length) return api('delete-file', { urls: dead }).then(loadUsage, function () {});
    }, function (e) {
      if (e.conflict) { S.conflict = true; render(); } else toast(e.message);
    }).then(function () { S.saving = false; paintBar(); });
  }
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's' && S.user) { e.preventDefault(); save(); } });

  /* ───── доступ ───── */
  function changePassword() {
    dialog('Сменить пароль', [{ key: 'current', label: 'Текущий пароль', type: 'password' }, { key: 'next', label: 'Новый пароль, от 8 символов', type: 'password' }], 'Сменить', function (v) {
      return api('password', v).then(function () { toast('Пароль изменён'); });
    });
  }
  function usersView() {
    var box = h('div', { class: 'users' });
    function setUsers(r) { S.users = r.users; paint(); }
    function paint() {
      box.replaceChildren.apply(box, S.users.map(function (u) {
        var me = u.id === S.user.id;
        var role = h('select', { class: 'input', 'aria-label': 'Роль: ' + u.name, disabled: me, onchange: function () { api('user-update', { id: u.id, role: role.value }).then(setUsers, function (e) { toast(e.message); paint(); }); } },
          Object.keys(ROLES).map(function (k) { return h('option', { value: k, text: ROLES[k], selected: k === u.role }); }));
        return h('div', { class: 'urow' }, [
          h('div', {}, [h('b', { text: u.name + (me ? ' (вы)' : '') }), h('small', { text: u.login })]),
          h('span', { class: 'muted small', text: 'Создан ' + u.created.split('-').reverse().join('.') }), role,
          h('div', { class: 'acts' }, me ? [] : [
            h('button', { class: 'button button--sm button--tertiary', type: 'button', text: 'Новый пароль', onclick: function () {
              dialog('Новый пароль для «' + u.name + '»', [{ key: 'password', label: 'Пароль, от 8 символов', type: 'text' }], 'Задать', function (v) { return api('user-update', { id: u.id, password: v.password }).then(function (r) { setUsers(r); toast('Пароль изменён. Передайте его человеку лично.'); }); }, 'Старый пароль перестанет работать, человека выкинет из админки.');
            } }),
            h('button', { class: 'button button--sm button--danger-soft', type: 'button', text: 'Удалить', onclick: function () {
              confirmBox('Удалить «' + u.name + '»?', 'Человек потеряет доступ к админке. Всё, что он загрузил, останется.', 'Удалить', function () { return api('user-del', { id: u.id }).then(setUsers); });
            } })])]);
      }));
    }
    paint();
    return h('div', { class: 'ed' }, [sec('Кто имеет доступ', 'Владелец управляет всем, включая этот список. Редактор правит карточки и загружает файлы, но не удаляет носители и не видит этот раздел.', [box],
      h('button', { class: 'button button--sm button--primary', type: 'button', text: '+ Добавить человека', onclick: function () {
        dialog('Новая учётная запись', [{ key: 'name', label: 'Имя', hint: 'Анна, маркетинг' }, { key: 'login', label: 'Логин (латиница)', hint: 'anna' }, { key: 'password', label: 'Пароль, от 8 символов', type: 'text' },
          { key: 'role', label: 'Роль', options: [['editor', ROLES.editor], ['owner', ROLES.owner]], value: 'editor' }], 'Добавить', function (v) {
          return api('user-add', v).then(function (r) { setUsers(r); toast('Готово. Передайте человеку логин и пароль; войти получится через минуту.'); });
        }, 'Пароль человек сможет сменить сам после входа.');
      } }))]);
  }

  /* ───── запуск ───── */
  api('state').then(function (st) { if (st.auth) enter(st); else gate(st.needsSetup); }, function (e) { app.replaceChildren(h('p', { class: 'adm__boot', text: 'Админка сейчас недоступна: ' + e.message })); });
})();
