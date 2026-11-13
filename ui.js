/* Общий слой интерфейса: состояния HeroUI (data-selected), всплывающие подсказки, окно «Как пользоваться». */
(function () {
  'use strict';

  // 1. HeroUI стилизует выбранное состояние через data-selected, страницы ведут его в aria-атрибутах
  var ATTRS = ['aria-pressed', 'aria-selected', 'aria-expanded'];
  function sync(el) {
    if (!el.getAttribute) return;
    var on = ATTRS.some(function (a) { return el.getAttribute(a) === 'true'; });
    if (on) el.setAttribute('data-selected', 'true'); else el.removeAttribute('data-selected');
  }
  function syncTree(root) {
    if (root.nodeType !== 1) return;
    if (ATTRS.some(function (a) { return root.hasAttribute(a); })) sync(root);
    Array.prototype.forEach.call(root.querySelectorAll('[aria-pressed],[aria-selected],[aria-expanded]'), sync);
  }
  syncTree(document.body);
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      if (m.type === 'attributes') sync(m.target);
      else Array.prototype.forEach.call(m.addedNodes, syncTree);
    });
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ATTRS });

  // 2. Всплывающие подсказки: любой элемент с data-tip
  var tip = document.createElement('div');
  tip.className = 'tooltip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  var tipFor = null, tipTimer = 0;
  function place(box, anchor, prefer, gap) {
    var r = anchor.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
    var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    var top = prefer === 'bottom' ? r.bottom + gap : r.top - h - gap, pl = prefer;
    if (prefer === 'top' && top < 6) { top = r.bottom + gap; pl = 'bottom'; }
    if (prefer === 'bottom' && top + h > vh - 6 && r.top - h - gap > 6) { top = r.top - h - gap; pl = 'top'; }
    var left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    box.style.left = Math.round(left) + 'px'; box.style.top = Math.round(top) + 'px';
    box.setAttribute('data-placement', pl);
  }
  function showTip(el) {
    var text = el.getAttribute('data-tip'); if (!text) return;
    tipFor = el; tip.textContent = text; tip.hidden = false;
    place(tip, el, el.getAttribute('data-tip-side') || 'top', 8);
    tip.setAttribute('data-entering', 'true');
    setTimeout(function () { tip.removeAttribute('data-entering'); }, 160);
  }
  function hideTip() { clearTimeout(tipTimer); tipFor = null; tip.hidden = true; }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el === tipFor) return;
    hideTip(); if (!el) return;
    tipTimer = setTimeout(function () { showTip(el); }, 350);
  });
  document.addEventListener('pointerout', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) hideTip();
  });
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el && e.target.matches(':focus-visible')) { hideTip(); showTip(el); }
  });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('pointerdown', hideTip, true);
  window.addEventListener('scroll', hideTip, true);

  // Тёмный фон сцены на странице разворотов (на странице обложек им управляет сама сцена)
  var sb = document.getElementById('studioB');
  if (sb) sb.addEventListener('click', function () {
    var dark = document.body.getAttribute('data-studio') !== 'dark';
    document.body.setAttribute('data-studio', dark ? 'dark' : 'light');
    sb.setAttribute('aria-pressed', String(dark));
  });

  // Адаптив: элементы с data-move="m:#куда l:#куда" переезжают в другое место на телефоне и возвращаются обратно
  var MQ = { m: window.matchMedia('(max-width: 760px)'), l: window.matchMedia('(max-height: 520px) and (orientation: landscape)'), d: window.matchMedia('(min-width: 901px)') };
  var movers = Array.prototype.map.call(document.querySelectorAll('[data-move]'), function (el) {
    var ph = document.createComment('slot'); el.parentNode.insertBefore(ph, el);
    var rules = {}; el.getAttribute('data-move').split(/\s+/).forEach(function (r) { var k = r.split(':'); rules[k[0]] = k[1]; });
    return { el: el, ph: ph, rules: rules };
  });
  function isPhone() { return MQ.m.matches || MQ.l.matches; }
  function relayout() {
    movers.forEach(function (m) {
      var sel = (MQ.l.matches && m.rules.l) || (MQ.m.matches && m.rules.m) || (MQ.d.matches && !MQ.l.matches && m.rules.d) || null, to = sel && document.querySelector(sel);
      if (to) to.appendChild(m.el); else if (m.el.previousSibling !== m.ph) m.ph.parentNode.insertBefore(m.el, m.ph.nextSibling);
    });
    if (!isPhone()) closeMore();
    keepSpec();
  }
  // на десктопе характеристики всегда раскрыты в правой колонке
  var specP = document.getElementById('panelSpec');
  function keepSpec() {
    if (!specP) return;
    var desk = MQ.d.matches && !MQ.l.matches, sel = document.getElementById('tabSpec').getAttribute('aria-selected') === 'true';
    if (desk ? specP.hidden : (specP.hidden === sel)) specP.hidden = desk ? false : !sel;
  }
  if (specP) new MutationObserver(keepSpec).observe(specP, { attributes: true, attributeFilter: ['hidden'] });
  var more = document.getElementById('more'), moreBtn = document.getElementById('moreBtn'), scrim = document.getElementById('scrim');
  function closeMore() { if (!more || more.hidden) return; more.hidden = true; scrim.hidden = true; moreBtn.setAttribute('aria-expanded', 'false'); }
  if (more) {
    moreBtn.addEventListener('click', function () { var open = more.hidden; more.hidden = !open; scrim.hidden = !open; moreBtn.setAttribute('aria-expanded', String(open)); });
    scrim.addEventListener('click', closeMore);
    more.addEventListener('click', function (e) { if (e.target.closest('button, a')) setTimeout(closeMore, 0); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMore(); });
  }
  relayout();
  Object.keys(MQ).forEach(function (k) { var q = MQ[k]; if (q.addEventListener) q.addEventListener('change', relayout); else q.addListener(relayout); });

  // Шторки: свайп вниз закрывает
  function closeSheet(el) {
    if (el.id === 'more') return closeMore();
    if (el.id === 'helpPop') return document.getElementById('helpOk').click();
    if (el.id === 'panel') return document.getElementById('closePanel').click();
    var t = document.querySelector('[aria-controls="' + el.id + '"]'); if (t && t.getAttribute('aria-selected') === 'true') t.click();
  }
  var drag = null;
  document.addEventListener('touchstart', function (e) {
    if (!isPhone()) return;
    var el = e.target.closest && e.target.closest('#more, #helpPop, #panel, .tabpanel'); if (!el) return;
    var sc = e.target.closest('.popover__dialog, #panel, .tabpanel, #more') || el;
    if (sc.scrollTop > 0) return;
    drag = { el: el, y: e.touches[0].clientY };
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!drag) return; var d = drag; drag = null;
    if (e.changedTouches[0].clientY - d.y > 64) closeSheet(d.el);
  }, { passive: true });

  // Свайп по подписи листает обложки; выбранная миниатюра сама выезжает в центр ленты
  var cap = document.getElementById('cap');
  if (cap) {
    var sx = null;
    cap.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    cap.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) { var b = document.getElementById(dx < 0 ? 'next' : 'prev'); if (b && !b.hidden && !b.disabled) b.click(); }
    }, { passive: true });
    var strip = document.getElementById('variants');
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        var el = m.target;
        if (el.classList && el.classList.contains('variant') && el.getAttribute('aria-pressed') === 'true' && strip.scrollWidth > strip.clientWidth)
          strip.scrollTo({ left: el.offsetLeft - strip.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
      });
    }).observe(strip, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  }
  var tl = document.getElementById('tipline');
  if (tl) {
    try { if (localStorage.getItem('palazzo-tipline') === '1') tl.hidden = true; } catch (e) {}
    tl.querySelector('button').addEventListener('click', function () { tl.hidden = true; try { localStorage.setItem('palazzo-tipline', '1'); } catch (e) {} });
  }

  function say(text) {
    var t = document.getElementById('toast'); if (!t) return;
    if (!t.dataset.base) t.dataset.base = t.textContent;
    t.textContent = text; t.hidden = false; t.classList.add('center');
    clearTimeout(say.tm); say.tm = setTimeout(function () { t.hidden = true; t.textContent = t.dataset.base; }, 2200);
  }

  // Показ во весь экран
  var fsBtn = document.getElementById('fsBtn'), fsExit = document.getElementById('fsExit');
  function present(on) {
    document.body.classList.toggle('present', on); if (fsExit) fsExit.hidden = !on;
    if (on) { var p = document.getElementById('closePanel'); if (p && !document.getElementById('panel').hidden) p.click(); }
    window.dispatchEvent(new Event('resize'));
  }
  if (fsBtn) {
    fsBtn.addEventListener('click', function () {
      present(true);
      var el = document.documentElement; try { var r = el.requestFullscreen && el.requestFullscreen(); if (r && r.catch) r.catch(function () {}); } catch (e) {}
    });
    fsExit.addEventListener('click', function () { if (document.fullscreenElement) document.exitFullscreen(); present(false); });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) present(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('present') && !document.fullscreenElement) present(false); });
  }

  // ── Обложки: ссылка на обложку, «в буклете», сравнение во весь экран ──
  var C = window.__cover;
  if (C && document.getElementById('variants')) {
    var vlist = document.getElementById('variants'), pc = document.getElementById('presentCap'), toBook = document.getElementById('toBook');
    function activeId() { var a = vlist.querySelector('.variant[aria-pressed="true"]'); return a ? a.getAttribute('data-id') : null; }
    function idx(id) { for (var i = 0; i < C.list.length; i++) if (C.list[i].id === id) return i; return -1; }
    function onActive() {
      var id = activeId(); if (!id) return;
      var n = idx(id) + 1;
      try { history.replaceState(null, '', '#' + n); } catch (e) {}
      if (toBook) toBook.href = '/?cover=' + id;
      if (pc) pc.textContent = (n < 10 ? '0' + n : n) + ' · ' + document.getElementById('nowName').textContent;
    }
    var h = parseInt((location.hash || '').slice(1), 10);
    if (h >= 1 && h <= C.list.length) C.show(C.list[h - 1].id);
    window.addEventListener('hashchange', function () { var k = parseInt(location.hash.slice(1), 10); if (k >= 1 && k <= C.list.length) C.show(C.list[k - 1].id); });
    new MutationObserver(onActive).observe(vlist, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'], childList: true });
    onActive();
    var cl = document.getElementById('copyLink');
    if (cl) cl.addEventListener('click', function () {
      var url = location.href, done = function () { say('Ссылка на обложку скопирована'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt('Ссылка на обложку', url); });
      else window.prompt('Ссылка на обложку', url);
    });

    var pick = document.getElementById('cmpPick'), grid = document.getElementById('cmpGrid'), tabCmp = document.getElementById('tabCmp');
    C.list.forEach(function (v) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-id', v.id); b.setAttribute('aria-pressed', 'false');
      var im = document.createElement('img'); im.src = v.thumb; im.alt = ''; var s = document.createElement('span'); s.textContent = v.name;
      b.appendChild(im); b.appendChild(s); b.addEventListener('click', function () { C.toggle(v.id); }); pick.appendChild(b);
    });
    function syncPick() {
      Array.prototype.forEach.call(pick.children, function (b) {
        var on = C.has(b.getAttribute('data-id')); b.setAttribute('aria-pressed', String(on)); b.disabled = !on && C.count() >= 3;
      });
    }
    new MutationObserver(syncPick).observe(grid, { childList: true });
    document.getElementById('cmpOpen').addEventListener('click', function () {
      if (tabCmp.getAttribute('aria-selected') !== 'true') tabCmp.click();
      if (!C.count() && activeId()) C.toggle(activeId());
      syncPick();
    });
    document.getElementById('cmpClose').addEventListener('click', function () { if (tabCmp.getAttribute('aria-selected') === 'true') tabCmp.click(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cv]'), function (b) {
      b.addEventListener('click', function () {
        var name = b.getAttribute('data-cv'), sb = document.querySelector('[data-view="' + name + '"]'); if (sb) sb.click();
        Array.prototype.forEach.call(document.querySelectorAll('[data-cv]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (C.count()) setTimeout(function () { C.sync(); }, 1700);
      });
    });
  }

  // ── Развороты: лента разворотов под сценой ──
  var B = window.__bk, bstrip = document.getElementById('strip');
  if (B && bstrip) {
    var lis = document.querySelectorAll('#list li.pg'), N = B.n(), items = [];
    function pageImg(i) { var el = lis[i] && lis[i].querySelector('img'); if (!el) return document.createElement('i'); var im = document.createElement('img'); im.src = el.src; im.alt = ''; im.loading = 'lazy'; return im; }
    for (var s = 0; s <= N; s++) (function (s) {
      var b = document.createElement('button'); b.type = 'button';
      var sp = document.createElement('span'); sp.className = 'sp';
      if (s === 0) { var c = document.createElement('img'); c.src = window.__bkCover || 'cover-front.jpg'; c.alt = ''; sp.appendChild(c); }
      else { sp.appendChild(pageImg(2 * s - 3)); sp.appendChild(pageImg(2 * s - 2)); }
      var t = document.createElement('span'); t.textContent = s === 0 ? 'Обложка' : (2 * s) + '–' + (2 * s + 1);
      b.setAttribute('aria-label', s === 0 ? 'Обложка' : 'Разворот ' + (2 * s) + '–' + (2 * s + 1));
      b.appendChild(sp); b.appendChild(t); b.addEventListener('click', function () { B.go(s); }); bstrip.appendChild(b); items.push(b);
    })(s);
    var last = -1;
    setInterval(function () {
      var k = Math.max(0, Math.min(N, Math.round(B.cur()))); if (k === last) return; last = k;
      items.forEach(function (b, i) { if (i === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      var el = items[k]; if (bstrip.scrollWidth > bstrip.clientWidth) bstrip.scrollTo({ left: el.offsetLeft - bstrip.offsetLeft - (bstrip.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
    }, 250);
  }

  // 3. Окно «Как пользоваться»: открывается кнопкой и само при первом визите
  var btn = document.getElementById('helpBtn'), pop = document.getElementById('helpPop');
  if (btn && pop) {
    var KEY = 'palazzo-help-' + (document.body.className.match(/p-\w+/) || ['x'])[0];
    function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
    function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    function openHelp() {
      pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
      var anchor = btn.offsetParent ? btn : (moreBtn || btn);
      place(pop, anchor, 'bottom', 10);
      var r = anchor.getBoundingClientRect(), vw = document.documentElement.clientWidth;
      pop.style.left = Math.round(Math.max(12, Math.min(r.right - pop.offsetWidth, vw - pop.offsetWidth - 12))) + 'px';
      pop.setAttribute('data-entering', 'true');
      setTimeout(function () { pop.removeAttribute('data-entering'); }, 160);
    }
    function closeHelp() { if (pop.hidden) return; pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); mark(); }
    btn.addEventListener('click', function () { if (pop.hidden) openHelp(); else closeHelp(); });
    document.getElementById('helpOk').addEventListener('click', closeHelp);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeHelp(); });
    document.addEventListener('pointerdown', function (e) { if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) closeHelp(); });
    window.addEventListener('resize', function () { if (!pop.hidden) openHelp(); });
    var rot = document.getElementById('rotate');
    var toast = document.getElementById('toast');
    if (!seen()) {
      if (isPhone() && toast) { mark(); setTimeout(function () { toast.hidden = false; setTimeout(function () { toast.hidden = true; }, 5500); }, 900); toast.addEventListener('click', function () { toast.hidden = true; }); }
      else setTimeout(openHelp, 900);
    }
  }
})();
