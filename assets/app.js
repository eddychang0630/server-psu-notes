/* ==========================================================
   伺服器電源電路自學講義 — 共用腳本
   1. 章節導覽 / 上下頁 / 本頁目錄
   2. 深淺色切換
   3. KaTeX 公式渲染
   4. 圖片放大檢視
   5. 波形圖產生器 (data-wave)
   6. 互動計算器 (data-calc)
   ========================================================== */
(function () {
  'use strict';

  var CHAPTERS = [
    { id: 'index', file: 'index.html', n: '00', t: '首頁與學習地圖' },
    { id: 'ch01', file: 'ch01-overview.html', n: '01', t: '伺服器電源總覽與架構' },
    { id: 'ch02', file: 'ch02-basics.html', n: '02', t: '基礎拓樸：Buck 與 Boost' },
    { id: 'ch03', file: 'ch03-ac-input.html', n: '03', t: 'AC 輸入、保護與突波電流' },
    { id: 'ch04', file: 'ch04-emi.html', n: '04', t: 'EMI 濾波器' },
    { id: 'ch05', file: 'ch05-pfc.html', n: '05', t: '整流與功率因數校正 PFC' },
    { id: 'ch06', file: 'ch06-bulk.html', n: '06', t: 'Bulk 電容與 Hold-up' },
    { id: 'ch07', file: 'ch07-llc.html', n: '07', t: 'LLC 諧振轉換器 (主 DC-DC)' },
    { id: 'ch08', file: 'ch08-secondary.html', n: '08', t: '同步整流、輸出、ORing 與均流' },
    { id: 'ch09', file: 'ch09-standby.html', n: '09', t: '待機電源 (Flyback)' },
    { id: 'ch10', file: 'ch10-control.html', n: '10', t: '控制迴路與回授補償' },
    { id: 'ch11', file: 'ch11-digital.html', n: '11', t: '數位控制、PMBus 與風扇' },
    { id: 'ch12', file: 'ch12-protection.html', n: '12', t: '保護、感測與上電時序' },
    { id: 'ch13', file: 'ch13-components.html', n: '13', t: '元件百科' },
    { id: 'ch14', file: 'ch14-layout.html', n: '14', t: '佈局、散熱、EMC 與安規' },
    { id: 'ch15', file: 'ch15-design.html', n: '15', t: '2000 W 設計實例總整理' },
    { id: 'ref', file: 'references.html', n: '★', t: '參考資源與名詞表' }
  ];

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------- theme ---------- */
  var savedTheme = store.get('psu-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.setAttribute('data-theme', savedTheme);

  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* ---------- 電路符號 sprite（所有兩端元件：端點在 (0,0) 與 (60,0)）---------- */
    var G = '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';
    var sprite = '<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true"><defs>' +
      '<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--fg)"/></marker>' +
      '<marker id="ahc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--ctl)"/></marker>' +
      '<symbol id="r" overflow="visible">' + G + '<path d="M0 0H15l3-7 6 14 6-14 6 14 6-14 3 7H60"/></g></symbol>' +
      '<symbol id="c" overflow="visible">' + G + '<path d="M0 0H27M33 0H60M27-11V11M33-11V11"/></g></symbol>' +
      '<symbol id="ce" overflow="visible">' + G + '<path d="M0 0H27M27-11V11M36-11Q30 0 36 11M33 0H60M17-10h6M20-13v6"/></g></symbol>' +
      '<symbol id="l" overflow="visible">' + G + '<path d="M0 0H10a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0H60"/></g></symbol>' +
      '<symbol id="d" overflow="visible">' + G + '<path d="M0 0H22M38 0H60M38-9V9"/><path d="M22-9L38 0L22 9Z" fill="currentColor"/></g></symbol>' +
      '<symbol id="f" overflow="visible">' + G + '<rect x="14" y="-6" width="32" height="12" rx="2"/><path d="M0 0H60"/></g></symbol>' +
      '<symbol id="ntc" overflow="visible">' + G + '<rect x="15" y="-7" width="30" height="14" rx="1"/><path d="M0 0H15M45 0H60M16 13L44-13H50"/></g><text x="38" y="20" style="font-size:10px;fill:currentColor">−t°</text></symbol>' +
      '<symbol id="mov" overflow="visible">' + G + '<rect x="15" y="-7" width="30" height="14" rx="1"/><path d="M0 0H15M45 0H60M10 13H18L42-13H50"/></g></symbol>' +
      '<symbol id="sw" overflow="visible">' + G + '<path d="M0 0H18M42 0H60M20-1L40-13"/><circle cx="18" cy="0" r="2.5"/><circle cx="42" cy="0" r="2.5"/></g></symbol>' +
      '<symbol id="q" overflow="visible">' + G + '<path d="M-30 0H-12M-12-12V12M-7-15V-7M-7-3V3M-7 7V15M-7-11H0V-30M-7 11H0V30M-7 0H0V11M0-22H13V22H0M8-5H18"/><path d="M-6 0l6-4v8z" fill="currentColor"/><path d="M8 5L18 5L13-5Z" fill="currentColor"/></g></symbol>' +
      '<symbol id="gnd" overflow="visible">' + G + '<path d="M0 0V8M-10 8H10M-6 12H6M-2 16H2"/></g></symbol>' +
      '<symbol id="src" overflow="visible">' + G + '<circle cx="0" cy="0" r="16"/><path d="M-9 0q4.5-9 9 0t9 0"/></g></symbol>' +
      '<symbol id="vdc" overflow="visible">' + G + '<circle cx="0" cy="0" r="16"/><path d="M-4-8h8M0-12v8M-4 8h8"/></g></symbol>' +
      '</defs></svg>';
    document.body.insertAdjacentHTML('afterbegin', sprite);

    var pageId = document.body.getAttribute('data-page') || 'index';
    var idx = 0;
    CHAPTERS.forEach(function (c, i) { if (c.id === pageId) idx = i; });

    /* ---------- top bar ---------- */
    var top = el('header', { class: 'topbar' });
    top.innerHTML =
      '<button class="icon-btn" id="menuBtn" aria-label="開啟章節選單">☰</button>' +
      '<a class="brand" href="index.html">Server PSU 電路講義<small>' + (pageId === 'index' ? '' : CHAPTERS[idx].n + ' ' + CHAPTERS[idx].t) + '</small></a>' +
      '<button class="icon-btn" id="themeBtn" aria-label="切換深淺色">◐</button>' +
      '<div class="progress" id="progress"></div>';
    document.body.insertBefore(top, document.body.firstChild);

    var scrim = el('div', { class: 'scrim' });
    document.body.appendChild(scrim);

    /* ---------- sidebar ---------- */
    var side = document.getElementById('sidebar');
    if (side) {
      var h = '<div class="nav-title">章節目錄</div>';
      CHAPTERS.forEach(function (c) {
        h += '<a href="' + c.file + '"' + (c.id === pageId ? ' class="active"' : '') + '><span class="num">' + c.n + '</span><span>' + c.t + '</span></a>';
        if (c.id === pageId && c.id !== 'index') h += '<div class="sub" id="subToc"></div>';
      });
      side.innerHTML = h;
    }
    function closeNav() { document.body.classList.remove('nav-open'); }
    document.getElementById('menuBtn').addEventListener('click', function () { document.body.classList.toggle('nav-open'); });
    scrim.addEventListener('click', closeNav);
    if (side) side.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });

    document.getElementById('themeBtn').addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('psu-theme', next);
      document.querySelectorAll('[data-calc]').forEach(function (c) { if (c._update) c._update(); });
    });

    /* ---------- in-page TOC ---------- */
    var article = document.querySelector('article');
    var h2s = article ? article.querySelectorAll('h2') : [];
    var subToc = document.getElementById('subToc');
    var tocBox = document.getElementById('toc');
    var list = '';
    h2s.forEach(function (hh, i) {
      if (!hh.id) hh.id = 's' + (i + 1);
      list += '<li><a href="#' + hh.id + '">' + hh.textContent + '</a></li>';
      if (subToc) subToc.appendChild(el('a', { href: '#' + hh.id }, hh.textContent));
    });
    if (tocBox && h2s.length) tocBox.innerHTML = '<details open><summary>本章內容</summary><ol>' + list + '</ol></details>';

    /* ---------- pager ---------- */
    if (article && pageId !== 'index') {
      var pg = el('nav', { class: 'pager' });
      var prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
      if (prev) pg.appendChild(el('a', { href: prev.file, class: 'prev' }, '<small>← 上一章</small>' + prev.n + ' ' + prev.t));
      if (next) pg.appendChild(el('a', { href: next.file, class: 'next' }, '<small>下一章 →</small>' + next.n + ' ' + next.t));
      article.appendChild(pg);
    }
    if (article) article.appendChild(el('div', { class: 'footer' }, '伺服器電源電路自學講義 · 圖示為本講義原創示意圖（CC BY 4.0），照片引用自 Wikimedia Commons 並標註作者與授權。內容供學習用途，實際設計請以最新規範與元件規格書為準。'));

    /* ---------- reading progress ---------- */
    var bar = document.getElementById('progress');
    function onScroll() {
      var d = document.documentElement;
      var p = d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight);
      bar.style.width = (p * 100).toFixed(1) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- waves, calculators ---------- */
    document.querySelectorAll('[data-wave]').forEach(function (n) {
      var f = WAVES[n.getAttribute('data-wave')];
      if (f) n.innerHTML = f();
    });
    document.querySelectorAll('[data-calc]').forEach(function (n) {
      var f = CALCS[n.getAttribute('data-calc')];
      if (f) f(n);
    });

    /* ---------- figure zoom ---------- */
    var ov = el('div', { class: 'zoom-overlay', role: 'dialog', 'aria-label': '放大檢視圖片' });
    ov.innerHTML = '<div class="zbar"><span>雙指可縮放、拖曳</span><button class="icon-btn" data-z="-">−</button><button class="icon-btn" data-z="+">＋</button><button class="icon-btn" data-z="x" aria-label="關閉">✕</button></div><div class="zbody"></div>';
    document.body.appendChild(ov);
    var zw = 1100;
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var z = b.getAttribute('data-z');
      if (z === 'x') { ov.classList.remove('open'); document.body.style.overflow = ''; return; }
      zw = Math.max(500, Math.min(3200, zw * (z === '+' ? 1.25 : 0.8)));
      ov.style.setProperty('--zw', zw + 'px');
    });
    document.querySelectorAll('.fig').forEach(function (f) {
      if (!f.querySelector('svg')) return;
      var b = el('button', { class: 'icon-btn zoom-btn', 'aria-label': '放大檢視' }, '⤢');
      f.insertBefore(b, f.firstChild);
      b.addEventListener('click', function () {
        var body = ov.querySelector('.zbody');
        body.innerHTML = '';
        body.appendChild(f.querySelector('svg').cloneNode(true));
        zw = Math.max(1000, window.innerWidth * 1.6);
        ov.style.setProperty('--zw', zw + 'px');
        ov.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    /* ---------- KaTeX ---------- */
    function renderMath() {
      if (window.renderMathInElement) {
        window.renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false
        });
      }
    }
    if (window.renderMathInElement) renderMath();
    else window.addEventListener('load', renderMath);
  });

  /* ==========================================================
     Plot helper: returns SVG string
     opts: {w,h,x:[min,max],y:[min,max],xl,yl,traces:[{f|pts, cls, label, color}], xt:[ticks], yt:[ticks], marks}
     ========================================================== */
  function plot(o) {
    var W = o.w || 640, H = o.h || 260, L = o.left || 52, R = 16, T = 18, B = 40;
    var pw = W - L - R, ph = H - T - B;
    var x0 = o.x[0], x1 = o.x[1], y0 = o.y[0], y1 = o.y[1];
    function X(v) { return L + (o.logx ? (Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) : (v - x0) / (x1 - x0)) * pw; }
    function Y(v) { return T + (1 - (v - y0) / (y1 - y0)) * ph; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img">';
    (o.xt || []).forEach(function (t) {
      var v = typeof t === 'object' ? t[0] : t, lab = typeof t === 'object' ? t[1] : t;
      s += '<line class="grid" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (T + ph) + '"/>';
      s += '<text class="t-s" x="' + X(v) + '" y="' + (T + ph + 16) + '" text-anchor="middle">' + lab + '</text>';
    });
    (o.yt || []).forEach(function (t) {
      var v = typeof t === 'object' ? t[0] : t, lab = typeof t === 'object' ? t[1] : t;
      s += '<line class="grid" x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/>';
      s += '<text class="t-s" x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + lab + '</text>';
    });
    s += '<path class="axis" d="M' + L + ' ' + T + 'V' + (T + ph) + 'H' + (L + pw) + '"/>';
    if (o.y0line != null) s += '<line class="axis" x1="' + L + '" x2="' + (L + pw) + '" y1="' + Y(o.y0line) + '" y2="' + Y(o.y0line) + '"/>';
    if (o.xl) s += '<text class="t-s" x="' + (L + pw) + '" y="' + (H - 4) + '" text-anchor="end">' + o.xl + '</text>';
    if (o.yl) s += '<text class="t-s" x="' + 4 + '" y="' + 12 + '">' + o.yl + '</text>';
    (o.bands || []).forEach(function (b) {
      s += '<rect x="' + X(b[0]) + '" y="' + T + '" width="' + (X(b[1]) - X(b[0])) + '" height="' + ph + '" fill="' + b[2] + '" opacity="' + (b[3] || 0.12) + '"/>';
    });
    (o.traces || []).forEach(function (tr) {
      var pts = tr.pts;
      if (!pts) {
        pts = []; var N = tr.n || 600;
        for (var i = 0; i <= N; i++) {
          var xv = o.logx ? Math.pow(10, Math.log10(x0) + (Math.log10(x1) - Math.log10(x0)) * i / N) : x0 + (x1 - x0) * i / N;
          pts.push([xv, tr.f(xv)]);
        }
      }
      var d = '';
      pts.forEach(function (p, i) {
        var yy = Math.max(y0 - (y1 - y0) * 0.02, Math.min(y1 + (y1 - y0) * 0.02, p[1]));
        d += (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(yy).toFixed(1);
      });
      s += '<path d="' + d + '" fill="none" stroke="' + (tr.color || 'var(--accent)') + '" stroke-width="' + (tr.sw || 2) + '"' + (tr.dash ? ' stroke-dasharray="' + tr.dash + '"' : '') + ' stroke-linejoin="round"/>';
    });
    var ly = T + 6;
    var nLab = (o.traces || []).filter(function (tr) { return tr.label; }).length;
    if (nLab) s += '<rect x="' + (L + pw - 156) + '" y="' + (T + 1) + '" width="154" height="' + (nLab * 17 + 8) + '" rx="4" style="fill:var(--bg-elev);opacity:.88"/>';
    (o.traces || []).forEach(function (tr) {
      if (!tr.label) return;
      s += '<line x1="' + (L + pw - 150) + '" x2="' + (L + pw - 128) + '" y1="' + (ly + 5) + '" y2="' + (ly + 5) + '" stroke="' + (tr.color || 'var(--accent)') + '" stroke-width="2.5"' + (tr.dash ? ' stroke-dasharray="' + tr.dash + '"' : '') + '/>';
      s += '<text class="t-s" x="' + (L + pw - 122) + '" y="' + (ly + 9) + '">' + tr.label + '</text>';
      ly += 17;
    });
    (o.marks || []).forEach(function (m) {
      s += '<circle cx="' + X(m[0]) + '" cy="' + Y(m[1]) + '" r="4" fill="' + (m[3] || 'var(--danger)') + '"/>';
      if (m[2]) s += '<text class="t-s" x="' + (X(m[0]) + 7) + '" y="' + (Y(m[1]) - 7) + '">' + m[2] + '</text>';
    });
    (o.vlines || []).forEach(function (v) {
      s += '<line x1="' + X(v[0]) + '" x2="' + X(v[0]) + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="' + (v[2] || 'var(--fg-mute)') + '" stroke-dasharray="4 4" stroke-width="1.3"/>';
      if (v[1]) s += '<text class="t-s" x="' + (X(v[0]) + 4) + '" y="' + (T + 12) + '">' + v[1] + '</text>';
    });
    (o.texts || []).forEach(function (t) {
      s += '<text class="t-s" x="' + X(t[0]) + '" y="' + Y(t[1]) + '"' + (t[3] ? ' style="fill:' + t[3] + '"' : '') + '>' + t[2] + '</text>';
    });
    return s + '</svg>';
  }
  window.PSUPlot = plot;

  var C = { ac: 'var(--ac)', dc: 'var(--dc)', sec: 'var(--sec)', ctl: 'var(--ctl)', fg: 'var(--fg)', mute: 'var(--fg-mute)', danger: 'var(--danger)', warn: 'var(--warn)' };
  var PI = Math.PI;
  function tri(x) { var f = x - Math.floor(x); return f < 0.5 ? 4 * f - 1 : 3 - 4 * f; } // -1..1 triangle

  /* ==========================================================
     Waveforms
     ========================================================== */
  var WAVES = {
    /* 無 PFC 的電容輸入整流：電流尖峰 */
    'no-pfc': function () {
      var Vp = 1, ripple = 0.12;
      // 簡化：電容電壓在峰值附近被充電，電流為窄脈衝
      function vin(t) { return Math.sin(2 * PI * t); }
      function iin(t) {
        var ph = ((t % 0.5) + 0.5) % 0.5; // half period 0..0.5
        var c = 0.25, w = 0.055;
        var s = Math.sign(Math.sin(2 * PI * t));
        var d = (ph - (c - w * 0.6)) / w;
        if (d < 0 || d > 1) return 0;
        return s * 2.6 * Math.sin(PI * Math.pow(d, 0.8));
      }
      return plot({ w: 640, h: 250, x: [0, 2], y: [-2.8, 2.8], xt: [[0, '0'], [0.5, 'T/2'], [1, 'T'], [1.5, '3T/2'], [2, '2T']], yt: [], y0line: 0, xl: '時間', yl: '電壓 / 電流 (標么)',
        traces: [{ f: vin, color: C.ac, label: '輸入電壓 v_in' }, { f: iin, color: C.dc, label: '輸入電流 i_in', n: 1600 }] });
    },
    /* PFC 後：電流跟隨電壓 */
    'with-pfc': function () {
      return plot({ w: 640, h: 250, x: [0, 2], y: [-1.6, 1.6], xt: [[0, '0'], [0.5, 'T/2'], [1, 'T'], [1.5, '3T/2'], [2, '2T']], y0line: 0, xl: '時間', yl: '標么',
        traces: [{ f: function (t) { return 1.35 * Math.sin(2 * PI * t); }, color: C.ac, label: '輸入電壓' },
          { f: function (t) { return Math.sin(2 * PI * t) + 0.06 * tri(t * 40); }, color: C.dc, label: '輸入電流(含高頻漣波)', n: 3000 }] });
    },
    /* CCM boost PFC 電感電流（整流後） */
    'pfc-ccm': function () {
      var fs = 26; // 每半週期的開關數（示意）
      return plot({ w: 640, h: 260, x: [0, 1], y: [0, 1.25], xt: [[0, '0'], [0.25, 'T/4'], [0.5, 'T/2'], [0.75, '3T/4'], [1, 'T']], yt: [[0, '0'], [1, 'I_pk']], xl: '時間（整流後兩個半週期）', yl: '電感電流 i_L',
        traces: [
          { f: function (t) { var e = Math.abs(Math.sin(2 * PI * t)); var dI = 0.18 * (1 - 0.55 * e) * (e > 0.02 ? 1 : 0.2); return Math.max(0, e + dI * tri(t * fs * 2)); }, color: C.dc, label: '電感電流 (CCM)', n: 4000, sw: 1.4 },
          { f: function (t) { return Math.abs(Math.sin(2 * PI * t)); }, color: C.ac, label: '平均值 = 參考', dash: '5 4' }
        ] });
    },
    /* CRM / DCM 比較 */
    'pfc-modes': function () {
      var fs = 14;
      function env(t) { return Math.abs(Math.sin(2 * PI * t)); }
      function crm(t) { var ph = (t * fs * 2) % 1; var e = env(Math.floor(t * fs * 2) / (fs * 2) + 0.5 / (fs * 2)); return ph < 0.5 ? 2 * e * ph * 2 : 2 * e * (1 - ph) * 2; }
      return plot({ w: 640, h: 240, x: [0, 0.5], y: [0, 2.2], xt: [[0, '0'], [0.25, 'T/4'], [0.5, 'T/2']], yt: [[0, '0']], xl: '時間（半個市電週期）', yl: 'i_L',
        traces: [{ f: crm, color: C.dc, label: 'CRM/BCM 三角波 (峰值=2×平均)', n: 3000, sw: 1.4 }, { f: function (t) { return env(t); }, color: C.ac, label: '平均電流', dash: '5 4' }, { f: function (t) { return 2 * env(t); }, color: C.mute, label: '峰值包絡', dash: '2 3' }] });
    },
    /* bulk 電容雙倍頻漣波 */
    'bulk-ripple': function () {
      return plot({ w: 640, h: 230, x: [0, 40], y: [370, 410], xt: [0, 10, 20, 30, 40], yt: [[380, '380'], [390, '390'], [400, '400']], xl: '時間 (ms)', yl: 'V_bulk (V)',
        traces: [{ f: function (t) { return 391 + 8.9 * Math.sin(2 * PI * t / 10); }, color: C.dc, label: '100 Hz 漣波 (50 Hz 市電)' }] });
    },
    /* hold-up 放電 */
    'holdup': function () {
      // P = 2100 W, C = 940uF, V0 = 390 → V(t) = sqrt(V0^2 - 2Pt/C)
      var P = 2100, Cb = 940e-6, V0 = 390;
      function v(tms) { var x = V0 * V0 - 2 * P * (tms / 1000) / Cb; return x > 0 ? Math.sqrt(x) : 0; }
      var tEnd = (V0 * V0 - 300 * 300) * Cb / (2 * P) * 1000;
      return plot({ w: 640, h: 250, x: [-4, 22], y: [250, 420], xt: [[-4, '-4'], [0, '0'], [5, '5'], [10, '10'], [15, '15'], [20, '20']], yt: [[300, '300'], [350, '350'], [390, '390']], xl: '時間 (ms)，t=0 時 AC 中斷', yl: 'V_bulk (V)',
        traces: [{ f: function (t) { return t < 0 ? 390 : v(t); }, color: C.dc, label: 'Bulk 電壓' }, { f: function () { return 300; }, color: C.danger, label: 'LLC 最低工作電壓', dash: '5 4' }],
        vlines: [[0, 'AC 掉電'], [tEnd, 't≈' + tEnd.toFixed(1) + ' ms']], marks: [[tEnd, 300, '']] });
    },
    /* LLC 波形：開關頻率 = fr */
    'llc-wave': function () {
      // 一個週期 0..1 ; 諧振電流 = 負載正弦 + 磁化三角
      var Im = 0.55;
      function im(t) { var f = t % 1; return f < 0.5 ? -Im + 4 * Im * f : 3 * Im - 4 * Im * f; }
      function ir(t) { return Math.sin(2 * PI * (t % 1)) + im(t); }
      function vsw(t) { var f = t % 1; return f < 0.5 ? 1.7 : -1.7; }
      return plot({ w: 640, h: 270, x: [0, 2], y: [-2, 2], xt: [[0, '0'], [0.5, 'Ts/2'], [1, 'Ts'], [1.5, '3Ts/2'], [2, '2Ts']], y0line: 0, xl: 'fs = fr 時', yl: '標么',
        traces: [{ f: vsw, color: C.mute, label: '橋臂電壓 v_ab', sw: 1.4 }, { f: ir, color: C.dc, label: '諧振電流 i_Lr' }, { f: im, color: C.ac, label: '磁化電流 i_Lm', dash: '5 4' }, { f: function (t) { return Math.abs(Math.sin(2 * PI * t)) * 0.9; }, color: C.sec, label: '二次側整流電流(縮放)', sw: 1.5 }] });
    },
    /* flyback 波形 */
    'flyback-wave': function () {
      // DCM：0~D 一次側電流上升，D~D+D2 二次側電流下降，之後振鈴
      var D = 0.38, D2 = 0.42;
      function ip(t) { var f = t % 1; return f < D ? f / D : 0; }
      function is(t) { var f = t % 1; return f >= D && f < D + D2 ? 1.3 * (1 - (f - D) / D2) : 0; }
      function vds(t) {
        var f = t % 1;
        if (f < D) return 0.05;
        if (f < D + 0.03) return 1.0 + 0.6 * Math.sin(PI * (f - D) / 0.03) * 0.9 + 0.55; // spike
        if (f < D + D2) return 1.55;
        return 1.0 + 0.55 * Math.cos(2 * PI * (f - D - D2) / 0.12) * Math.exp(-(f - D - D2) * 8);
      }
      return plot({ w: 640, h: 280, x: [0, 2], y: [-0.1, 2.4], xt: [[0, '0'], [1, 'Ts'], [2, '2Ts']], yt: [], xl: '時間 (DCM)', yl: '標么',
        traces: [{ f: vds, color: C.ac, label: 'V_DS', n: 3000, sw: 1.5 }, { f: ip, color: C.dc, label: '一次側 i_p', n: 2000 }, { f: is, color: C.sec, label: '二次側 i_s', n: 2000 }],
        texts: [[0.395, 2.28, 'V_in+V_OR+尖峰', C.ac], [0.85, 0.9, '諧振振鈴', C.ac]] });
    },
    /* 突波電流比較 */
    'inrush': function () {
      return plot({ w: 640, h: 240, x: [0, 30], y: [0, 160], xt: [0, 5, 10, 15, 20, 25, 30], yt: [0, 50, 100, 150], xl: '時間 (ms)', yl: '電流 (A)',
        traces: [{ f: function (t) { return 150 * Math.exp(-t / 0.6); }, color: C.danger, label: '無限流（僅線路阻抗）' },
          { f: function (t) { var k = Math.floor(t / 10), ph = t - 10 * k; var pk = 70 * Math.pow(0.45, k); return ph < 3 ? pk * Math.sin(PI * ph / 3) : 0; }, color: C.dc, label: '串 NTC / 限流電阻' }] });
    },
    /* PFC Type II 補償 bode */
    'bode-type2': function () {
      var fz = 300, fp = 15000, K = 1;
      function g(f) { var w = f; return 20 * Math.log10(K * 2e5 / w * Math.sqrt(1 + Math.pow(w / fz, 2)) / Math.sqrt(1 + Math.pow(w / fp, 2))); }
      function ph(f) { return -90 + Math.atan(f / fz) * 180 / PI - Math.atan(f / fp) * 180 / PI; }
      var a = plot({ w: 640, h: 220, logx: true, x: [10, 1e6], y: [-20, 100], xt: [[10, '10'], [100, '100'], [1e3, '1k'], [1e4, '10k'], [1e5, '100k'], [1e6, '1M']], yt: [0, 20, 40, 60, 80], xl: '頻率 (Hz)', yl: '增益 (dB)',
        traces: [{ f: g, color: C.dc, label: 'Type II 增益' }], vlines: [[fz, 'f_z'], [fp, 'f_p']] });
      var b = plot({ w: 640, h: 200, logx: true, x: [10, 1e6], y: [-100, 0], xt: [[10, '10'], [100, '100'], [1e3, '1k'], [1e4, '10k'], [1e5, '100k'], [1e6, '1M']], yt: [-90, -60, -30, 0], xl: '頻率 (Hz)', yl: '相位 (°)',
        traces: [{ f: ph, color: C.ac, label: 'Type II 相位 (相位提升)' }], vlines: [[Math.sqrt(fz * fp), '最大相位提升']] });
      return a + b;
    },
    /* 電容 ESR 頻率 / 溫度示意 */
    'mosfet-sw': function () {
      // 硬切換損失示意：Vds 與 Id 重疊
      function vds(t) { if (t < 1) return 1; if (t < 2) return 1 - (t - 1); if (t < 6) return 0.02; if (t < 7) return 0.02 + (t - 6); return 1; }
      function id(t) { if (t < 0.6) return 0; if (t < 1) return (t - 0.6) / 0.4; if (t < 6) return 1; if (t < 6.4) return 1; if (t < 7) return 1 - (t - 6.4) / 0.6 * 0; if (t < 7.4) return 1 - (t - 7) / 0.4; return 0; }
      function p(t) { return vds(t) * id(t) * 1.5; }
      return plot({ w: 640, h: 240, x: [0, 8], y: [-0.05, 1.6], xt: [], yt: [], xl: '時間', yl: '標么',
        traces: [{ f: vds, color: C.ac, label: 'V_DS', n: 1600 }, { f: id, color: C.dc, label: 'I_D', n: 1600 }, { f: p, color: C.danger, label: '瞬時損失 V·I', n: 1600, sw: 1.5 }],
        texts: [[0.7, 1.45, '導通損失', C.danger], [6.4, 1.45, '關斷損失', C.danger], [3.2, 0.2, '導通期：I²·R_DS(on)', 'var(--fg-soft)']] });
    },
    /* 鋁電解電容壽命 */
    'cap-life': function () {
      return plot({ w: 640, h: 240, x: [40, 105], y: [0, 70], xt: [40, 50, 60, 70, 80, 90, 105], yt: [[0, '0'], [20, '20 年'], [40, '40'], [60, '60']], xl: '電容核心溫度 (°C)', yl: '預估壽命 (年，連續運轉)', left: 60,
        traces: [{ f: function (T) { return 3000 * Math.pow(2, (105 - T) / 10) / 8760; }, color: C.dc, label: '3000 h @105°C 等級' },
          { f: function (T) { return 10000 * Math.pow(2, (105 - T) / 10) / 8760; }, color: C.sec, label: '10000 h @105°C 等級' }] });
    },
    /* LLC 三種工作區 (時域模擬) */
    'llc-below': function () { return llcSimPlot(0.7, 5, 0.35, 240).svg; },
    'llc-at': function () { return llcSimPlot(1.0, 5, 0.35, 240).svg; },
    'llc-above': function () { return llcSimPlot(1.3, 5, 0.35, 240).svg; },
    /* 轉換比 vs D */
    'ratio': function () {
      return plot({ w: 640, h: 270, x: [0, 1], y: [0, 5], xt: [[0, '0'], [0.25, '0.25'], [0.5, '0.5'], [0.75, '0.75'], [1, '1']], yt: [0, 1, 2, 3, 4, 5], xl: '責任比 D', yl: 'M = Vo/Vin',
        traces: [{ f: function (d) { return d; }, color: C.dc, label: 'Buck: D' }, { f: function (d) { return 1 / (1 - d); }, color: C.ac, label: 'Boost: 1/(1−D)' }, { f: function (d) { return d / (1 - d); }, color: C.sec, label: 'Buck-Boost: D/(1−D)' }] });
    },
    /* Buck 詳細波形 */
    'buck-wave': function () {
      var D = 0.4, I = 1, dI = 0.4;
      function iL(t) { var f = t % 1; return f < D ? I - dI / 2 + dI * f / D : I + dI / 2 - dI * (f - D) / (1 - D); }
      var a = plot({ w: 640, h: 170, x: [0, 2], y: [-0.1, 1.25], xt: [], yt: [], xl: '', yl: 'v_SW', traces: [{ f: function (t) { return (t % 1) < D ? 1 : 0; }, color: C.ac, label: '開關節點電壓 (0 ↔ Vin)', n: 1200 }] });
      var b = plot({ w: 640, h: 200, x: [0, 2], y: [0, 1.5], xt: [], yt: [[1, 'Io']], xl: '', yl: '電流', traces: [{ f: iL, color: C.dc, label: '電感電流 i_L' }] });
      var c = plot({ w: 640, h: 200, x: [0, 2], y: [-0.1, 1.5], xt: [[0, '0'], [D, 'DTs'], [1, 'Ts'], [1 + D, ''], [2, '2Ts']], yt: [], xl: '時間', yl: '電流',
        traces: [{ f: function (t) { return (t % 1) < D ? iL(t) : 0; }, color: C.danger, label: '上開關 Q1 電流', n: 1200 }, { f: function (t) { return (t % 1) >= D ? iL(t) : 0; }, color: C.sec, label: '下開關/二極體電流', n: 1200, dash: '5 3' }] });
      return a + b + c;
    },
    /* Boost 詳細波形 */
    'boost-wave': function () {
      var D = 0.5, I = 1, dI = 0.4;
      function iL(t) { var f = t % 1; return f < D ? I - dI / 2 + dI * f / D : I + dI / 2 - dI * (f - D) / (1 - D); }
      var a = plot({ w: 640, h: 170, x: [0, 2], y: [-0.1, 1.25], xt: [], yt: [], xl: '', yl: 'V_DS', traces: [{ f: function (t) { return (t % 1) < D ? 0 : 1; }, color: C.ac, label: '開關 V_DS (0 ↔ Vo)', n: 1200 }] });
      var b = plot({ w: 640, h: 200, x: [0, 2], y: [0, 1.5], xt: [], yt: [[1, 'Iin']], xl: '', yl: '電流', traces: [{ f: iL, color: C.dc, label: '電感(=輸入)電流 i_L' }] });
      var c = plot({ w: 640, h: 200, x: [0, 2], y: [-0.1, 1.5], xt: [[0, '0'], [D, 'DTs'], [1, 'Ts'], [2, '2Ts']], yt: [], xl: '時間', yl: '電流',
        traces: [{ f: function (t) { return (t % 1) < D ? iL(t) : 0; }, color: C.danger, label: '開關 Q 電流', n: 1200 }, { f: function (t) { return (t % 1) >= D ? iL(t) : 0; }, color: C.sec, label: '二極體電流 (=送到輸出)', n: 1200, dash: '5 3' }] });
      return a + b + c;
    },
    /* SR 時序 */
    'sr-timing': function () {
      var t1 = 0.05, t2 = 0.42; // 閘極開啟/關閉（半週期 0~0.5）
      function isr(t) { var f = t % 1; return f < 0.5 ? Math.sin(2 * PI * f) : 0; }
      function gate(t) { var f = t % 1; return f >= t1 && f < t2 ? 1 : 0; }
      function vds(t) { var f = t % 1; if (f < 0.5) return (f >= t1 && f < t2) ? -0.12 * Math.sin(2 * PI * f) : -0.55 * (Math.sin(2 * PI * f) > 0.02 ? 1 : Math.sin(2 * PI * f) / 0.02); return 1.6; }
      var a = plot({ w: 640, h: 190, x: [0, 2], y: [-0.1, 1.2], xt: [], yt: [], xl: '', yl: '',
        traces: [{ f: isr, color: C.sec, label: 'SR 電流 (半正弦)', n: 1500 }, { f: function (t) { return gate(t) * 0.85 + 0.0; }, color: C.ctl, label: 'SR 閘極訊號', n: 1500, sw: 1.5 }] });
      var b = plot({ w: 640, h: 190, x: [0, 2], y: [-0.8, 1.8], xt: [[0, '0'], [0.5, 'Ts/2'], [1, 'Ts'], [2, '2Ts']], yt: [[0, '0']], y0line: 0, xl: '時間', yl: 'V_DS',
        traces: [{ f: vds, color: C.ac, label: 'SR 的 V_DS', n: 2000 }],
        texts: [[0.0, -0.68, '體二極體 −0.7 V', C.danger], [0.4, -0.68, '體二極體', C.danger], [0.12, 0.35, '通道導通：−I·R_DS(on)', 'var(--fg-soft)'], [0.55, 1.45, '關閉：承受 2Vo', 'var(--fg-soft)']] });
      return a + b;
    },
    /* 效率曲線 */
    'eff-curve': function () {
      function eff(x) { return 100 * (x / (x + 0.0085 + 0.012 * x * x + 0.004 * x)); }
      return plot({ w: 640, h: 250, x: [0.02, 1], y: [80, 100], xt: [[0.1, '10%'], [0.2, '20%'], [0.5, '50%'], [1, '100%']], yt: [80, 85, 90, 95, 100], xl: '負載率', yl: '效率 (%)',
        traces: [{ f: eff, color: C.dc, label: '典型 Titanium 級 PSU 效率曲線' }],
        marks: [[0.1, 90, '90%', C.danger], [0.2, 94, '94%', C.danger], [0.5, 96, '96%', C.danger], [1, 91, '91%', C.danger]] });
    }
  };

  /* ==========================================================
     Calculators
     ========================================================== */
  function fmt(v, d) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (d == null) d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
    return v.toFixed(d);
  }
  function eng(v, unit) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v), p = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
    for (var i = 0; i < p.length; i++) if (a >= p[i][0] * 0.9999) return fmt(v / p[i][0]) + ' ' + p[i][1] + unit;
    return v.toExponential(2) + ' ' + unit;
  }
  function build(node, title, fields, compute, note) {
    var h = '<h4>' + title + '</h4><div class="inputs">';
    fields.forEach(function (f) {
      if (f.range) h += '<label>' + f.l + ' <span data-v="' + f.k + '"></span><input type="range" data-k="' + f.k + '" min="' + f.range[0] + '" max="' + f.range[1] + '" step="' + f.range[2] + '" value="' + f.v + '"></label>';
      else if (f.opts) h += '<label>' + f.l + '<select data-k="' + f.k + '">' + f.opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] == f.v ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
      else h += '<label>' + f.l + '<input type="' + (f.text ? 'text' : 'number') + '" inputmode="' + (f.text ? 'text' : 'decimal') + '" step="any" data-k="' + f.k + '" value="' + f.v + '"></label>';
    });
    h += '</div><div class="out"></div><div class="plot"></div>' + (note ? '<div class="note">' + note + '</div>' : '');
    node.classList.add('calc');
    node.innerHTML = h;
    function upd() {
      var v = {};
      node.querySelectorAll('[data-k]').forEach(function (i) { v[i.getAttribute('data-k')] = i.type === 'text' ? i.value : parseFloat(i.value); });
      node.querySelectorAll('[data-v]').forEach(function (s) { s.textContent = '= ' + v[s.getAttribute('data-v')]; });
      var r = compute(v);
      node.querySelector('.out').innerHTML = (r.out || []).map(function (o) { return '<div>' + o[0] + '<b>' + o[1] + '</b></div>'; }).join('');
      node.querySelector('.plot').innerHTML = r.plot || '';
    }
    node.addEventListener('input', upd);
    node.addEventListener('change', upd);
    node._update = upd;
    upd();
  }

  function llcGain(fn, Ln, Q) {
    var fn2 = fn * fn;
    var re = (Ln + 1) * fn2 - 1;
    var im = (fn2 - 1) * fn * Q * Ln;
    return Ln * fn2 / Math.sqrt(re * re + im * im);
  }

  /* ==========================================================
     LLC 全橋時域模擬（理想開關、輸出以固定電壓箝位）
     標么化：Lr = 1, Cr = 1 → ωr = 1, Zr = 1, Vin = 1
     回傳最後兩個開關週期的波形
     ========================================================== */
  function llcSim(fn, Ln, Q) {
    // 輸出端為「電容 + 電阻負載」，輸出電壓由電路自己決定（不是代入 FHA 結果）
    var Tr = 2 * PI, Ts = Tr / fn, N = 1600, dt = Ts / N;
    var Ro = (PI * PI / 8) / Q;          // 反射到一次側的直流負載 (Rac = 8Ro/π² = Zr/Q)
    var Co = 20;                          // 反射後的輸出電容（標么，夠大 → 漣波小）
    var vo = llcGain(fn, Ln, Q);          // 以 FHA 值當初始值，加快收斂
    var im = -vo * Ts / (4 * Ln), i = im, vc = 0, mode = 0;
    var cycles = 90, rec = [], vsum = 0, vcnt = 0;
    for (var c = 0; c < cycles; c++) {
      var R = c < cycles * 0.4 ? 0.02 : 0.002;
      for (var k = 0; k < N; k++) {
        var vab = k < N / 2 ? 1 : -1, vp, di, dim;
        if (mode === 0) {
          var vpf = Ln / (1 + Ln) * (vab - vc - R * i);
          if (vpf > vo) mode = 1; else if (vpf < -vo) mode = -1;
        }
        if (mode !== 0) { vp = mode * vo; di = (vab - vc - vp - R * i); dim = vp / Ln; }
        else { di = (vab - vc - R * i) / (1 + Ln); dim = di; vp = Ln * di; }
        i += di * dt; im += dim * dt; vc += i * dt;
        var irect = mode !== 0 ? mode * (i - im) : 0;
        vo += (irect - vo / Ro) / Co * dt;
        if (mode === 1 && i - im <= 0) { mode = 0; im = i; }
        else if (mode === -1 && i - im >= 0) { mode = 0; im = i; }
        if (c >= cycles - 2) {
          vsum += vo; vcnt++;
          if (k % 4 === 0) rec.push({ t: (c - cycles + 2) + k / N, vab: vab, i: i, im: im, vc: vc, is: i - im, vp: vp });
        }
      }
    }
    return { rec: rec, M: vsum / vcnt, Mfha: llcGain(fn, Ln, Q) };
  }

  function llcSimPlot(fn, Ln, Q, h) {
    var s = llcSim(fn, Ln, Q), r = s.rec;
    var imax = 0, vmax = 0;
    r.forEach(function (p) { imax = Math.max(imax, Math.abs(p.i), Math.abs(p.im)); vmax = Math.max(vmax, Math.abs(p.vc)); });
    var ysc = Math.max(imax, 1) * 1.15;
    var p1 = plot({ w: 640, h: h || 260, x: [0, 2], y: [-ysc, ysc], xt: [[0, '0'], [0.5, 'Ts/2'], [1, 'Ts'], [1.5, '3Ts/2'], [2, '2Ts']], yt: [], y0line: 0, xl: 'fs/fr = ' + fn, yl: '電流 (標么, Vin/Zr)',
      traces: [
        { pts: r.map(function (p) { return [p.t, p.vab * ysc * 0.85]; }), color: 'var(--fg-mute)', label: '橋臂電壓 v_ab(示意)', sw: 1.2 },
        { pts: r.map(function (p) { return [p.t, p.i]; }), color: 'var(--dc)', label: '諧振電流 i_Lr', sw: 2.4 },
        { pts: r.map(function (p) { return [p.t, p.im]; }), color: 'var(--ac)', label: '磁化電流 i_Lm', dash: '6 4' },
        { pts: r.map(function (p) { return [p.t, p.is]; }), color: 'var(--sec)', label: '傳到二次側 i_Lr−i_Lm', sw: 1.6 }
      ] });
    var vs = Math.max(vmax, 1.2) * 1.15;
    var p2 = plot({ w: 640, h: 190, x: [0, 2], y: [-vs, vs], xt: [[0, '0'], [1, 'Ts'], [2, '2Ts']], yt: [], y0line: 0, xl: '', yl: '電壓 (標么, Vin)',
      traces: [
        { pts: r.map(function (p) { return [p.t, p.vc]; }), color: 'var(--ctl)', label: '諧振電容 v_Cr' },
        { pts: r.map(function (p) { return [p.t, p.vp]; }), color: 'var(--warn)', label: '變壓器一次側 v_p', sw: 1.4 }
      ] });
    // ZVS check: current at instant vab turns positive (t = 1.0)
    var at = r.reduce(function (b, p) { return Math.abs(p.t - 1) < Math.abs(b.t - 1) ? p : b; }, r[0]);
    return { svg: p1 + p2, M: s.M, Mfha: s.Mfha, iSw: at.i, imax: imax, vcmax: vmax };
  }

  function convCalc(v) {
    var topo = v.topo, Vin = v.vin, Vo = v.vo, Io = v.io, fs = v.fs * 1e3, L = v.l * 1e-6, Cc = v.c * 1e-6, esr = v.esr * 1e-3;
    var Dccm, IL, dI, D, D2, Ipk, mode, Icrit, dV;
    if (topo === 'buck') { Dccm = Vo / Vin; IL = Io; dI = (Vin - Vo) * Dccm / (L * fs); Icrit = dI / 2; }
    else if (topo === 'boost') { Dccm = 1 - Vin / Vo; IL = Io / (1 - Dccm); dI = Vin * Dccm / (L * fs); Icrit = (1 - Dccm) * dI / 2; }
    else { Dccm = Vo / (Vin + Vo); IL = Io / (1 - Dccm); dI = Vin * Dccm / (L * fs); Icrit = (1 - Dccm) * dI / 2; }
    if (Io >= Icrit) {
      mode = 'CCM'; D = Dccm; D2 = 1 - D; Ipk = IL + dI / 2;
      dV = topo === 'buck' ? dI / (8 * fs * Cc) + dI * esr : Io * D / (fs * Cc) + Ipk * esr;
    } else {
      mode = 'DCM';
      if (topo === 'buck') { D = Math.sqrt(2 * L * fs * Io * Vo / (Vin * (Vin - Vo))); Ipk = (Vin - Vo) * D / (L * fs); D2 = D * (Vin - Vo) / Vo; }
      else if (topo === 'boost') { D = Math.sqrt(2 * L * fs * Io * (Vo - Vin)) / Vin; Ipk = Vin * D / (L * fs); D2 = D * Vin / (Vo - Vin); }
      else { D = Math.sqrt(2 * L * fs * Io * Vo) / Vin; Ipk = Vin * D / (L * fs); D2 = D * Vin / Vo; }
      IL = Ipk * (D + D2) / 2; dI = Ipk;
      dV = topo === 'buck' ? Ipk * esr + Io / (fs * Cc) * 0.25 : Io * (1 - D2) / (fs * Cc) * 0.5 + Ipk * esr;
    }
    var Imin = mode === 'CCM' ? IL - dI / 2 : 0;
    function iL(t) {
      var f = t - Math.floor(t);
      if (mode === 'CCM') return f < D ? Imin + dI * f / D : Imin + dI - dI * (f - D) / (1 - D);
      if (f < D) return Ipk * f / D;
      if (f < D + D2) return Ipk * (1 - (f - D) / D2);
      return 0;
    }
    function vsw(t) {
      var f = t - Math.floor(t);
      var on = f < D, fw = !on && (mode === 'CCM' || f < D + D2);
      if (topo === 'buck') return on ? Vin : fw ? -0.02 * Vin : Vo;               // 開關節點對地
      if (topo === 'boost') return on ? 0 : fw ? Vo : Vin;                         // 開關 V_DS
      return on ? Vin : fw ? -Vo : 0;                                              // 電感電壓
    }
    var ymax = Math.max(Ipk, 0.1) * 1.25;
    var p1 = plot({ w: 640, h: 200, x: [0, 3], y: [0, ymax], xt: [[0, '0'], [1, 'Ts'], [2, '2Ts'], [3, '3Ts']], yt: [[0, '0'], [IL, 'I_L,avg']], xl: '', yl: '電感電流 (A)', left: 64,
      traces: [{ f: iL, color: 'var(--dc)', label: 'i_L (' + mode + ')', n: 1200 }, { f: function () { return IL; }, color: 'var(--fg-mute)', dash: '4 4' }] });
    var vlab = topo === 'buck' ? '開關節點 v_SW' : topo === 'boost' ? '開關 V_DS' : '電感電壓 v_L';
    var vmx = Math.max(Vin, Vo) * 1.2;
    var p2 = plot({ w: 640, h: 170, x: [0, 3], y: [topo === 'buckboost' ? -vmx : -0.05 * vmx, vmx], xt: [[0, '0'], [1, 'Ts'], [2, '2Ts'], [3, '3Ts']], yt: [], y0line: 0, xl: '時間', yl: vlab + ' (V)', left: 64,
      traces: [{ f: vsw, color: 'var(--ac)', label: vlab, n: 1800 }] });
    return { mode: mode, D: D, D2: D2, IL: IL, dI: dI, Ipk: Ipk, Icrit: Icrit, dV: dV, svg: p1 + p2,
      Vsw: topo === 'buck' ? Vin : topo === 'boost' ? Vo : Vin + Vo };
  }

  var CALCS = {
    /* Buck / Boost / Buck-Boost */
    conv: function (n) {
      build(n, '🧮 Buck / Boost / Buck-Boost 互動計算與波形', [
        { k: 'topo', l: '拓樸', v: 'buck', opts: [['buck', 'Buck 降壓'], ['boost', 'Boost 升壓'], ['buckboost', 'Buck-Boost 反相']] },
        { k: 'vin', l: '輸入電壓 Vin (V)', v: 12 }, { k: 'vo', l: '輸出電壓 Vo (V，取絕對值)', v: 3.3 }, { k: 'io', l: '輸出電流 Io (A)', v: 10 },
        { k: 'fs', l: '開關頻率 (kHz)', v: 500 }, { k: 'l', l: '電感 L (µH)', v: 1.5 }, { k: 'c', l: '輸出電容 (µF)', v: 400 }, { k: 'esr', l: '電容 ESR (mΩ)', v: 1 }
      ], function (v) {
        v.topo = n.querySelector('[data-k=topo]').value;
        if (v.topo === 'buck' && v.vo >= v.vin) return { out: [['錯誤', 'Buck 需 Vo < Vin']] };
        if (v.topo === 'boost' && v.vo <= v.vin) return { out: [['錯誤', 'Boost 需 Vo > Vin']] };
        var r = convCalc(v);
        return { out: [['工作模式', r.mode], ['責任比 D', fmt(r.D, 3)], ['電感平均電流', fmt(r.IL) + ' A'], ['電感漣波 ΔI', fmt(r.dI) + ' A'], ['電感峰值電流', fmt(r.Ipk) + ' A'], ['CCM/DCM 臨界負載', fmt(r.Icrit) + ' A'], ['輸出漣波電壓 (估)', eng(r.dV, 'V')], ['開關/二極體電壓應力', fmt(r.Vsw) + ' V']], plot: r.svg };
      }, '把負載電流 Io 調到低於「臨界負載」就會看到電感電流掉到 0 → 進入 DCM，責任比 D 不再只由 Vin/Vo 決定。預設值是典型的伺服器主機板 12 V→3.3 V Buck (POL)。');
    },
    /* LLC 時域模擬 */
    llcSim: function (n) {
      build(n, '🔬 LLC 時域模擬器（看真實波形）', [
        { k: 'fn', l: 'fs / fr', v: 1, range: [0.5, 1.8, 0.05] }, { k: 'ln', l: 'Ln = Lm/Lr', v: 5, range: [2, 10, 0.5] }, { k: 'q', l: 'Q（負載輕→重）', v: 0.35, range: [0.1, 1, 0.05] }
      ], function (v) {
        var r = llcSimPlot(v.fn, v.ln, v.q);
        var region = v.fn < 0.97 ? '低於諧振 (fs &lt; fr)：二次側電流提早歸零 → SR 零電流關斷，但磁化電流較大' : v.fn > 1.03 ? '高於諧振 (fs &gt; fr)：二次側電流被硬切斷，增益 &lt; 1' : '剛好在諧振點：i_Lr 近似正弦，效率最高';
        return { out: [['模擬增益 M (時域)', fmt(r.M, 3)], ['FHA 預估增益', fmt(r.Mfha, 3)], ['切換瞬間 i_Lr', fmt(r.iSw, 3) + (r.iSw < -0.01 ? ' ✅ ZVS' : ' ❌ 失去 ZVS')], ['i_Lr 峰值 (標么)', fmt(r.imax, 2)], ['v_Cr 峰值 (標么)', fmt(r.vcmax, 2)], ['工作區', region]], plot: r.svg };
      }, '理想元件的數值模擬：Lr = Cr = 1（標么）、全橋 ±1 方波輸入，輸出為「電容 + 電阻負載」（電阻由 Q 換算），輸出電壓由電路自行決定。比較「時域增益」與「FHA 增益」可看出 FHA 在遠離 fr 時的誤差。ZVS 判斷：橋臂電壓由負轉正的瞬間，i_Lr 必須為負。');
    },
    /* 突波 / NTC */
    inrush: function (n) {
      build(n, '🧮 NTC 突波限流計算', [
        { k: 'vac', l: '最高輸入電壓 (Vac)', v: 264 }, { k: 'c', l: 'Bulk 電容 (µF)', v: 940 }, { k: 'r', l: 'NTC 冷態電阻 R25 (Ω)', v: 5 }, { k: 'rl', l: '其他線路電阻 (Ω)', v: 0.5 }
      ], function (v) {
        var Vp = v.vac * Math.SQRT2, R = v.r + v.rl;
        var E = 0.5 * v.c * 1e-6 * Vp * Vp;
        return { out: [['峰值電壓', fmt(Vp) + ' V'], ['最壞突波峰值', fmt(Vp / R) + ' A'], ['無 NTC 時 (僅線路)', fmt(Vp / v.rl) + ' A'], ['電容儲能 ½CV²', fmt(E) + ' J'], ['NTC 需承受能量 ≈', fmt(E) + ' J'], ['RC 時間常數', fmt(R * v.c * 1e-3) + ' ms']] };
      }, '充電過程中，串聯電阻所消耗的能量恰等於電容最終儲存的能量 ½CV²（與電阻值無關）。選 NTC 時其「最大容許電容 / 能量」規格必須大於此值，並保留裕量。');
    },
    /* EMI */
    emi: function (n) {
      build(n, '🧮 EMI 濾波器轉折頻率估算', [
        { k: 'f', l: '最難壓的諧波頻率 (kHz)', v: 195 }, { k: 'att', l: '需要的衰減量 (dB)', v: 80 }, { k: 'st', l: '濾波器級數', v: 2, opts: [[1, '1 級 LC (40 dB/dec)'], [2, '2 級 LC (80 dB/dec)'], [3, '3 級 LC (120 dB/dec)']] }, { k: 'cx', l: '每級 X 電容 (µF)', v: 1.0 }
      ], function (v) {
        var slope = 40 * v.st;
        var fc = v.f * 1e3 / Math.pow(10, v.att / slope);
        var L = 1 / (Math.pow(2 * PI * fc, 2) * v.cx * 1e-6);
        return { out: [['最高可用轉折頻率 f_c', eng(fc, 'Hz')], ['每級所需 DM 電感', eng(L, 'H')], ['衰減斜率', slope + ' dB/dec']],
          plot: plot({ w: 640, h: 220, logx: true, x: [1e3, 3e7], y: [-140, 20], xt: [[1e3, '1k'], [1e4, '10k'], [1.5e5, '150k'], [1e6, '1M'], [1e7, '10M']], yt: [-120, -80, -40, 0], xl: '頻率', yl: '衰減 (dB)',
            traces: [{ f: function (f) { var r = f / fc; return r < 1 ? 0 : -slope * Math.log10(r); }, color: 'var(--dc)', label: '理想漸近線' }], bands: [[1.5e5, 3e7, 'var(--warn)', 0.1]], vlines: [[fc, 'f_c'], [v.f * 1e3, '目標諧波']] }) };
      }, '傳導 EMI 量測範圍為 150 kHz–30 MHz（橘色區）。實際元件有寄生參數（電感的並聯電容、電容的 ESL），高頻衰減會比理想值差，需預留 6–10 dB 裕量。');
    },
    /* PFC inductor */
    pfcL: function (n) {
      build(n, '🧮 Boost PFC 電感與電流計算', [
        { k: 'po', l: 'PFC 輸出功率 (W)', v: 2100 }, { k: 'vmin', l: '最低輸入 (Vac)', v: 180 }, { k: 'vo', l: '輸出電壓 Vbus (V)', v: 400 }, { k: 'eff', l: 'PFC 效率 (%)', v: 98.5 },
        { k: 'fs', l: '開關頻率 (kHz)', v: 65 }, { k: 'rip', l: '漣波電流比例 (%)', v: 25 }, { k: 'ph', l: '交錯相數', v: 1, opts: [[1, '單相'], [2, '兩相交錯'], [3, '三相交錯']] }
      ], function (v) {
        var Pin = v.po / (v.eff / 100), Irms = Pin / v.vmin, Ipk = Irms * Math.SQRT2, Vpk = v.vmin * Math.SQRT2;
        var Iph = Ipk / v.ph;
        var D = 1 - Vpk / v.vo, dI = Iph * v.rip / 100;
        var L = Vpk * D / (dI * v.fs * 1e3);
        var Lworst = v.vo / (4 * dI * v.fs * 1e3);
        var IpkL = Iph + dI / 2;
        var Isw = Irms / v.ph * Math.sqrt(1 - 8 * Math.SQRT2 * v.vmin / (3 * PI * v.vo));
        return { out: [['輸入功率', fmt(Pin) + ' W'], ['輸入電流 RMS', fmt(Irms) + ' A'], ['輸入電流峰值', fmt(Ipk) + ' A'], ['峰值處責任比 D', fmt(D, 3)], ['每相電感 L（峰值處）', eng(L, 'H')], ['每相 L（全範圍最壞 Vin=Vo/2）', eng(Lworst, 'H')], ['每相電感峰值電流', fmt(IpkL) + ' A'], ['每相開關 RMS 電流', fmt(Isw) + ' A']] };
      }, '每相電感取兩者中較大值較保守。粉末鐵芯在大電流下電感會下降（DC bias roll-off），需確認滿載峰值時仍保有設計值。');
    },
    /* Hold-up */
    holdup: function (n) {
      build(n, '🧮 Hold-up 電容計算', [
        { k: 'p', l: 'Bulk 端負載功率 (W)', v: 2100 }, { k: 't', l: 'Hold-up 時間 (ms)', v: 10 }, { k: 'v1', l: '掉電瞬間電壓 (V)', v: 390 }, { k: 'v2', l: 'DC-DC 最低工作電壓 (V)', v: 300 }, { k: 'tol', l: '容值公差+老化 (%)', v: 20 }, { k: 'fl', l: '市電頻率 (Hz)', v: 50 }
      ], function (v) {
        var C = 2 * v.p * v.t / 1000 / (v.v1 * v.v1 - v.v2 * v.v2);
        var Cd = C / (1 - v.tol / 100);
        var rip = v.p / (2 * PI * v.fl * Cd * v.v1);
        var E = 0.5 * Cd * (v.v1 * v.v1);
        var Irip = v.p / v.v1 / Math.SQRT2;
        return { out: [['理論最小電容', eng(C, 'F')], ['考慮公差後', eng(Cd, 'F')], ['100/120 Hz 漣波 (pk-pk)', fmt(rip) + ' V'], ['儲能 ½CV²', fmt(E) + ' J'], ['可用能量比例', fmt((1 - v.v2 * v.v2 / (v.v1 * v.v1)) * 100) + ' %'], ['低頻漣波電流 RMS ≈', fmt(Irip) + ' A']] };
      }, '可用能量只有 (V1²−V2²)/V1²。把 DC-DC 的最低工作電壓 V2 壓低（LLC 增益設計更寬），就能大幅減少電容量——這是設計取捨的核心。');
    },
    /* LLC gain plot */
    llcGain: function (n) {
      build(n, '📈 LLC 增益曲線互動圖 (FHA)', [
        { k: 'ln', l: 'Ln = Lm/Lr', v: 5, range: [2, 12, 0.5] }, { k: 'q', l: '目前 Q', v: 0.35, range: [0.1, 1.2, 0.05] }, { k: 'mmax', l: '需要的最大增益', v: 1.31, range: [1, 1.8, 0.01] }
      ], function (v) {
        var qs = [0.1, 0.2, 0.35, 0.5, 0.8, 1.2];
        var tr = qs.map(function (q, i) { return { f: function (fn) { return llcGain(fn, v.ln, q); }, color: 'var(--fg-mute)', sw: 1, n: 500 }; });
        tr.push({ f: function (fn) { return llcGain(fn, v.ln, v.q); }, color: 'var(--dc)', sw: 2.8, label: 'Q=' + v.q, n: 800 });
        tr.push({ f: function () { return v.mmax; }, color: 'var(--danger)', dash: '5 4', label: '需求增益' });
        var pk = 0, fpk = 0;
        for (var f = 0.15; f < 1; f += 0.001) { var g = llcGain(f, v.ln, v.q); if (g > pk) { pk = g; fpk = f; } }
        var fn0 = 1 / Math.sqrt(1 + v.ln);
        return { out: [['峰值增益', fmt(pk, 3)], ['峰值處 fn', fmt(fpk, 3)], ['fm/fr = 1/√(1+Ln)', fmt(fn0, 3)], ['增益裕量', pk >= v.mmax * 1.1 ? '✅ 足夠 (>10%)' : pk >= v.mmax ? '⚠️ 偏緊' : '❌ 不足']],
          plot: plot({ w: 640, h: 300, x: [0.2, 2], y: [0, 2.2], xt: [[0.2, '0.2'], [0.5, '0.5'], [1, '1 (fr)'], [1.5, '1.5'], [2, '2']], yt: [0, 0.5, 1, 1.5, 2], xl: '正規化頻率 fn = fs/fr', yl: '電壓增益 M', traces: tr,
            vlines: [[fn0, 'fm'], [1, '']], marks: [[fpk, pk, '峰值 ' + fmt(pk, 2)]], bands: [[0.2, fpk, 'var(--danger)', 0.08]] }) };
      }, '灰色細線為 Q = 0.1, 0.2, 0.35, 0.5, 0.8, 1.2；藍線是目前 Q。紅色區（峰值左側）為「容性區」，會失去 ZVS，必須避免進入。Q 越大（負載越重）峰值越低。');
    },
    /* LLC tank design */
    llcDesign: function (n) {
      build(n, '🧮 LLC 諧振槽設計器', [
        { k: 'vin', l: '額定輸入 Vin (V)', v: 390 }, { k: 'vmin', l: '最低輸入 (V)', v: 300 }, { k: 'vmax', l: '最高輸入 (V)', v: 410 }, { k: 'vo', l: '輸出 Vo (V)', v: 12.2 }, { k: 'vf', l: 'SR 壓降 (V)', v: 0.1 }, { k: 'po', l: '輸出功率 (W)', v: 2000 },
        { k: 'fr', l: '諧振頻率 fr (kHz)', v: 250 }, { k: 'ln', l: 'Ln = Lm/Lr', v: 5 }, { k: 'q', l: '品質因數 Q', v: 0.35 },
        { k: 'br', l: '橋式架構', v: 1, opts: [[1, '全橋 (Full-bridge)'], [0.5, '半橋 (Half-bridge)']] }, { k: 'td', l: '死區時間 (ns)', v: 80 }
      ], function (v) {
        var Veff = v.vin * v.br;
        var nr = Veff / (v.vo + v.vf);
        var Mmax = nr * (v.vo + v.vf) / (v.vmin * v.br), Mmin = nr * (v.vo + v.vf) / (v.vmax * v.br);
        var Ro = v.vo * v.vo / v.po, Rac = 8 * nr * nr / (PI * PI) * Ro;
        var Zr = v.q * Rac, fr = v.fr * 1e3;
        var Cr = 1 / (2 * PI * fr * Zr), Lr = Zr / (2 * PI * fr), Lm = v.ln * Lr;
        var Io = v.po / v.vo;
        var Im = nr * (v.vo + v.vf) / (4 * Lm * fr);
        var Iload = PI * Io / (2 * Math.SQRT2 * nr);
        var Ip = Math.sqrt(Iload * Iload + Im * Im / 3);
        var pk = 0; for (var f = 0.15; f < 1; f += 0.001) pk = Math.max(pk, llcGain(f, v.ln, v.q));
        var Ceq = Im * v.td * 1e-9 / (2 * v.vin);
        return { out: [['匝比 n = Np/Ns', fmt(nr, 2)], ['所需增益範圍', fmt(Mmin, 3) + ' ~ ' + fmt(Mmax, 3)], ['此 Ln/Q 峰值增益', fmt(pk, 3) + (pk > Mmax * 1.1 ? ' ✅' : ' ⚠️')], ['等效交流電阻 Rac', fmt(Rac) + ' Ω'], ['特性阻抗 Zr', fmt(Zr) + ' Ω'], ['Cr', eng(Cr, 'F')], ['Lr', eng(Lr, 'H')], ['Lm', eng(Lm, 'H')], ['磁化電流峰值', fmt(Im) + ' A'], ['一次側電流 RMS', fmt(Ip) + ' A'], ['ZVS 容許每顆開關 Coss(tr) ≤', eng(Ceq, 'F')], ['輸出電流', fmt(Io) + ' A']] };
      }, 'Rac = 8n²Ro/π² 為 FHA 等效負載；Q = Zr/Rac；「ZVS 容許 Coss」= I_m,pk·t_dead / (2·Vin)：在死區時間內，磁化電流能把橋臂節點（上下兩顆開關的 Coss 並聯）從 0 充到 Vin 的上限（近似把電流視為定值）。選用的開關其能量等效 Coss(tr) 必須小於此值。');
    },
    /* Flyback */
    flyback: function (n) {
      build(n, '🧮 Flyback (待機電源) 設計計算 — DCM', [
        { k: 'vmin', l: '最低 DC 輸入 (V)', v: 100 }, { k: 'vmax', l: '最高 DC 輸入 (V)', v: 410 }, { k: 'vo', l: '輸出 (V)', v: 12 }, { k: 'io', l: '輸出電流 (A)', v: 3 }, { k: 'vf', l: '整流壓降 (V)', v: 0.5 },
        { k: 'eff', l: '效率 (%)', v: 85 }, { k: 'd', l: '最大責任比 Dmax', v: 0.45 }, { k: 'fs', l: '開關頻率 (kHz)', v: 100 }, { k: 'sp', l: '漏感尖峰預估 (V)', v: 100 }
      ], function (v) {
        var Pin = v.vo * v.io / (v.eff / 100);
        var Vor = v.vmin * v.d / (1 - v.d);
        var nr = Vor / (v.vo + v.vf);
        var Lp = Math.pow(v.vmin * v.d, 2) / (2 * Pin * v.fs * 1e3);
        var Ipk = v.vmin * v.d / (Lp * v.fs * 1e3);
        var Iprms = Ipk * Math.sqrt(v.d / 3);
        var Vds = v.vmax + Vor + v.sp;
        var Vr = v.vo + v.vmax / nr;
        var Ispk = Ipk * nr;
        return { out: [['輸入功率', fmt(Pin) + ' W'], ['反射電壓 V_OR', fmt(Vor) + ' V'], ['匝比 Np/Ns', fmt(nr, 2)], ['一次側電感 Lp (≤)', eng(Lp, 'H')], ['一次側峰值電流', fmt(Ipk) + ' A'], ['一次側 RMS', fmt(Iprms) + ' A'], ['MOSFET 最大 V_DS', fmt(Vds) + ' V'], ['二次側峰值電流', fmt(Ispk) + ' A'], ['整流器反向電壓', fmt(Vr) + ' V']] };
      }, '在最低輸入、滿載時剛好處於 DCM/CCM 邊界，Lp 再小就一定是 DCM。MOSFET 耐壓建議 ≥ 1.2× 最大 V_DS（例：選 800 V 等級）。');
    },
    /* PMBus Linear11 */
    linear11: function (n) {
      build(n, '🔢 PMBus LINEAR11 編碼 / 解碼', [
        { k: 'hex', l: '16-bit 十六進位 (例 0xD3A8)', v: '0xD3A8', text: true }, { k: 'val', l: '或輸入實際值 (編碼用)', v: 12.25 }, { k: 'n', l: '編碼用指數 N (-16~15)', v: -6 }
      ], function (v) {
        var x = parseInt(String(v.hex).replace(/^0x/i, ''), 16) & 0xffff;
        var N = (x >> 11) & 0x1f; if (N > 15) N -= 32;
        var Y = x & 0x7ff; if (Y > 1023) Y -= 2048;
        var dec = Y * Math.pow(2, N);
        var Ye = Math.round(v.val / Math.pow(2, v.n));
        var ok = Ye >= -1024 && Ye <= 1023;
        var enc = (((v.n & 0x1f) << 11) | (Ye & 0x7ff)) & 0xffff;
        return { out: [['指數 N (bit15–11)', String(N)], ['尾數 Y (bit10–0)', String(Y)], ['解碼值 Y·2^N', fmt(dec, 4)], ['編碼結果', ok ? '0x' + ('0000' + enc.toString(16).toUpperCase()).slice(-4) : '溢位：換更大的 N'], ['編碼解析度 2^N', String(Math.pow(2, v.n))], ['編碼後實際值', ok ? fmt(Ye * Math.pow(2, v.n), 4) : '—']] };
      }, 'LINEAR11：高 5 位為二補數指數 N，低 11 位為二補數尾數 Y，數值 = Y × 2^N。注意部分廠商對特定命令的格式有差異，以元件手冊為準。');
    },
    /* Electrolytic life */
    capLife: function (n) {
      build(n, '🧮 鋁電解電容壽命估算', [
        { k: 'l0', l: '額定壽命 L0 (h)', v: 3000 }, { k: 't0', l: '額定溫度 T0 (°C)', v: 105 }, { k: 'ta', l: '周圍溫度 Ta (°C)', v: 55 }, { k: 'ir', l: '實際漣波電流 (A rms)', v: 3.5 }, { k: 'i0', l: '額定漣波電流 (A rms)', v: 2.6 }, { k: 'dt0', l: '額定漣波下溫升 ΔT0 (°C)', v: 5 }
      ], function (v) {
        var dT = v.dt0 * Math.pow(v.ir / v.i0, 2);
        var Tc = v.ta + dT;
        var L = v.l0 * Math.pow(2, (v.t0 - Tc) / 10);
        return { out: [['漣波自我溫升', fmt(dT) + ' °C'], ['核心溫度', fmt(Tc) + ' °C'], ['預估壽命', fmt(L) + ' h'], ['≈ 年 (24h 運轉)', fmt(L / 8760, 1)]] };
      }, '「溫度每降 10 °C 壽命加倍」(Arrhenius 簡化)。漣波電流頻率修正係數與廠商公式略有不同，請以規格書為準；伺服器電源通常要求數年以上連續運轉壽命。');
    },
    /* Type II compensator */
    type2: function (n) {
      build(n, '🧮 Type II 補償器元件計算 (OTA/運放)', [
        { k: 'fc', l: '穿越頻率 fc (Hz)', v: 15 }, { k: 'gp', l: 'fc 處功率級增益 (dB)', v: -20 }, { k: 'pm', l: '目標相位提升 (°)', v: 60 }, { k: 'r1', l: '上分壓電阻 R1 (kΩ)', v: 1000 }
      ], function (v) {
        var G = Math.pow(10, -v.gp / 20);
        var K = Math.tan((v.pm / 2 + 45) * PI / 180);
        var fz = v.fc / K, fp = v.fc * K;
        var R1 = v.r1 * 1e3;
        var R2 = G * R1;
        var C1 = 1 / (2 * PI * fz * R2);
        var C2 = 1 / (2 * PI * fp * R2);
        return { out: [['K 因子', fmt(K, 2)], ['零點 fz', eng(fz, 'Hz')], ['極點 fp', eng(fp, 'Hz')], ['R2', eng(R2, 'Ω')], ['C1 (串 R2)', eng(C1, 'F')], ['C2 (並聯)', eng(C2, 'F')]] };
      }, 'K-factor 法 (Venable)：在 fc 處補償器增益抵銷功率級增益，零點放在 fc/K、極點放在 fc·K，得到最大相位提升。PFC 電壓迴路 fc 通常 5–20 Hz，以免 100/120 Hz 漣波扭曲電流參考。');
    }
  };
})();
