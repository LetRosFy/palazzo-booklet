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
  var MQ = { m: window.matchMedia('(max-width: 760px)'), l: window.matchMedia('(max-height: 520px) and (orientation: landscape)') };
  var movers = Array.prototype.map.call(document.querySelectorAll('[data-move]'), function (el) {
    var ph = document.createComment('slot'); el.parentNode.insertBefore(ph, el);
    var rules = {}; el.getAttribute('data-move').split(/\s+/).forEach(function (r) { var k = r.split(':'); rules[k[0]] = k[1]; });
    return { el: el, ph: ph, rules: rules };
  });
  function isPhone() { return MQ.m.matches || MQ.l.matches; }
  function relayout() {
    movers.forEach(function (m) {
      var sel = (MQ.l.matches && m.rules.l) || (MQ.m.matches && m.rules.m) || null, to = sel && document.querySelector(sel);
      if (to) to.appendChild(m.el); else if (m.el.previousSibling !== m.ph) m.ph.parentNode.insertBefore(m.el, m.ph.nextSibling);
    });
    if (!isPhone()) closeMore();
  }
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
