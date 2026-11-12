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

  // 3. Окно «Как пользоваться»: открывается кнопкой и само при первом визите
  var btn = document.getElementById('helpBtn'), pop = document.getElementById('helpPop');
  if (btn && pop) {
    var KEY = 'palazzo-help-' + (document.body.className.match(/p-\w+/) || ['x'])[0];
    function seen() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } }
    function mark() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    function openHelp() {
      pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
      place(pop, btn, 'bottom', 10);
      var r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth;
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
    if (!seen() && !(rot && getComputedStyle(rot).display !== 'none')) setTimeout(openHelp, 900);
  }
})();
