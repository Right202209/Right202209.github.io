(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  var modal = document.getElementById('search');
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var index = null, sel = 0;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(window.SEARCH_INDEX).then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; });
  }
  function open() { modal.hidden = false; input.value = ''; list.innerHTML = ''; input.focus(); load(); }
  function close() { modal.hidden = true; }
  function render(q) {
    q = q.trim().toLowerCase();
    if (!q || !index) { list.innerHTML = ''; return; }
    var lang = document.documentElement.lang;
    var hits = index.filter(function (p) {
      return p.lang === lang && (p.title + ' ' + p.text).toLowerCase().indexOf(q) > -1;
    }).slice(0, 8);
    sel = 0;
    list.innerHTML = hits.length ? hits.map(function (p, i) {
      return '<li><a href="' + p.url + '"' + (i === 0 ? ' class="sel"' : '') + '>' + p.title + '<small>' + p.date + '</small></a></li>';
    }).join('') : '<li style="padding:10px 14px;color:var(--muted)">' + (window.SEARCH_EMPTY || 'Nothing yet.') + '</li>';
  }

  document.getElementById('search-open').addEventListener('click', open);
  list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  input.addEventListener('input', function () { load().then(function () { render(input.value); }); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modal.hidden ? open() : close(); }
    if (modal.hidden) return;
    var links = list.querySelectorAll('a');
    if (e.key === 'Escape') close();
    if (!links.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      links[sel].classList.remove('sel');
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[sel].classList.add('sel');
    }
    if (e.key === 'Enter') links[sel].click();
  });

  // ── Life in Weeks: everything is pre-rendered; this only refreshes "today",
  //    adds the tooltip, the grid/timeline switch and search jumps.
  var DAY = 864e5, WEEK = 7 * DAY, now = new Date();
  var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  var ymd = function (s) { var a = s.split('-'); return Date.UTC(+a[0], a[1] - 1, +a[2]); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var fmt = function (t, zh) {
    var d = new Date(t);
    return zh ? d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate())
              : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };
  var each = function (sel, fn, ctx) { Array.prototype.forEach.call((ctx || document).querySelectorAll(sel), fn); };

  // Weeks: this week of life, % lived, weeks left, against the visitor's clock (the build may be days old).
  var lifeNow = function (el) {
    var born = ymd(el.dataset.born), end = ymd(el.dataset.end), total = +el.dataset.total;
    var lived = Math.floor((today - born) / WEEK) + 1;
    return { lived: lived, total: total, left: Math.max(0, total - lived),
             pct: Math.max(0, Math.min(100, Math.round((today - born) / (end - born) * 1000) / 10)),
             age: Math.floor((today - born) / (365.2425 * DAY)) };
  };
  var num = function (n, zh) { return (+n).toLocaleString(zh ? 'zh-CN' : 'en-US', { maximumFractionDigits: 1 }); };

  each('[data-weeks-entry]', function (box) {
    var zh = box.dataset.lang.indexOf('zh') === 0, v = lifeNow(box);
    each('[data-k]', function (el) { el.textContent = num(v[el.dataset.k], zh); }, box);
    each('.wk-mini i', function (c, i) { c.className = i < v.age ? 'p' : i === v.age ? 'now' : ''; }, box);
  });

  var wk = document.querySelector('[data-weeks]');
  if (wk) {
    var zh = wk.dataset.lang.indexOf('zh') === 0, tip = wk.querySelector('.wk-tip');
    var bp = (wk.dataset.born || '').split('-'), by = +bp[0], bm = bp[1] - 1, bdd = +bp[2];
    var name = function (attr, cls) { var m = new RegExp('(?:^| )' + attr[0] + '(\\d+)').exec(cls); var k = m && wk.querySelector('[data-' + attr + '="' + m[1] + '"]'); return k ? k.textContent : ''; };
    wk.classList.add('js-weeks');

    // Locale-format the glance numbers (week of life, % lived, weeks left).
    var lv = lifeNow(wk);
    each('[data-weeks-glance] b[data-k]', function (b) { b.textContent = num(lv[b.dataset.k], zh); });
    each('.wk-life', function (bar) { bar.style.setProperty('--p', lv.pct); }, wk);

    // Re-mark this week and the future against the visitor's clock (the build may be days old).
    var rows = wk.querySelectorAll('.wk-yr[data-from]');
    each('.wk-yr[data-from]', function (row, r) {
      var from = ymd(row.dataset.from), next = rows[r + 1] ? ymd(rows[r + 1].dataset.from) : Infinity;
      each('i', function (c, i) {
        var s = from + i * WEEK, e = Math.min(s + WEEK, next);
        c.classList.toggle('f', s > today); c.classList.toggle('now', s <= today && today < e);
      }, row.querySelector('.wk-cells'));
    });
    var tl = wk.querySelector('.wk-tl');
    if (tl) {
      var b = ymd(tl.dataset.born), p = Math.max(0, Math.min(100, (today - b) / (ymd(tl.dataset.end) - b) * 100)).toFixed(2);
      tl.style.setProperty('--now', p);
      each('.wk-today', function (n) { n.style.setProperty('--p', p); var t = n.querySelector('time'); t.textContent = fmt(today, zh); t.dateTime = fmt(today, true); }, tl);
      each('.wk-node[data-d]', function (n) { var f = ymd(n.dataset.d) > today; n.classList.toggle('is-future', f); n.classList.toggle('is-past', !f); }, tl);
    }

    // Tooltip: date · age & week · season · era, place · event
    var SEASON_ZH = ['冬', '春', '夏', '秋'], SEASON_EN = ['Winter', 'Spring', 'Summer', 'Autumn'];
    var SOLAR_ZH = ['立冬', '立春', '立夏', '立秋'], SOLAR_EN = ['Start of Winter', 'Start of Spring', 'Start of Summer', 'Start of Autumn'];
    var show = function (c) {
      if (!c || c.tagName !== 'I' || !c.parentNode.classList.contains('wk-cells') || (c.classList.contains('f') && !c.dataset.ev)) { tip.hidden = true; return; }
      var row = c.closest('.wk-yr'), i = Array.prototype.indexOf.call(c.parentNode.children, c);
      // Rows are ~20-week chunks that cross birthdays, so age and week-of-year come from the cell's own date.
      var d = ymd(row.dataset.from) + i * WEEK, y = new Date(d).getUTCFullYear(), bd = Date.UTC(y, bm, bdd);
      if (d < bd) { y--; bd = Date.UTC(y, bm, bdd); }
      var age = y - by, wn = Math.floor((d - bd) / WEEK) + 1;
      var era = name('era', c.className), place = name('place', c.className);
      var where = [era, place && (zh ? '在' + place : 'in ' + place)].filter(Boolean).join(zh ? '，' : ', ');
      // Season (split at 立春 立夏 立秋 立冬); the week a season begins names its solar term.
      var q = /(?:^| )q(\d)/.exec(c.className), st = (c.dataset.st || '').split(' ');
      var season = c.dataset.st ? (zh ? SOLAR_ZH : SOLAR_EN)[st[0]] + ' ' + fmt(ymd(st[1]), zh).replace(/^\d{4}-/, '')
                 : q ? (zh ? SEASON_ZH : SEASON_EN)[q[1]] : '';
      var priv = c.classList.contains('pv') ? (zh ? '🔒 私密' : '🔒 Private') : '';
      tip.textContent = [fmt(d, zh), zh ? age + ' 岁第 ' + wn + ' 周' : 'age ' + age + ', week ' + wn, season, where, c.dataset.ev || priv]
        .filter(Boolean).join(' · ');
      tip.hidden = false;
      var r = c.getBoundingClientRect(), w = tip.offsetWidth, o = wk.getBoundingClientRect();
      tip.style.left = Math.max(0, Math.min(r.left + r.width / 2 - w / 2, document.documentElement.clientWidth - w - 8) - o.left) + 'px';
      tip.style.top = r.bottom - o.top + 8 + 'px';
    };
    var grid = wk.querySelector('.wk-grid');
    grid.addEventListener('mouseover', function (e) { if (matchMedia('(hover: hover)').matches) show(e.target); });
    grid.addEventListener('mouseleave', function () { tip.hidden = true; });
    grid.addEventListener('click', function (e) { show(e.target); });
    document.addEventListener('click', function (e) { if (!grid.contains(e.target)) tip.hidden = true; });

    // Grid / timeline switch, remembered per browser
    var setView = function (v) {
      wk.dataset.view = v;
      each('.wk-switch button', function (btn) { btn.setAttribute('aria-pressed', btn.dataset.v === v); }, wk);
    };
    setView(localStorage.getItem('weeks-view') || wk.dataset.view);
    each('.wk-switch button', function (btn) {
      btn.addEventListener('click', function () { setView(btn.dataset.v); localStorage.setItem('weeks-view', btn.dataset.v); });
    }, wk);

    // Scroll progress: the thin line under the sticky bar fills as the module scrolls past.
    if (wk.querySelector('.wk-progress')) {
      var ticking = false;
      var paint = function () {
        ticking = false;
        var r = wk.getBoundingClientRect(), span = r.height - window.innerHeight;
        var p = span > 0 ? -r.top / span : (r.top < 0 ? 1 : 0);
        wk.style.setProperty('--wk-p', Math.max(0, Math.min(1, p)).toFixed(4));
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', paint);
      each('.wk-switch button', function (btn) { btn.addEventListener('click', function () { requestAnimationFrame(paint); }); }, wk);
      paint();
    }

    // #ev-YYYY-MM-DD (from search or the timeline) → grid view, flash that week
    var jump = function () {
      var h = decodeURIComponent(location.hash.slice(1));
      if (h.indexOf('ev-') !== 0) return;
      setView('grid');
      var cell = wk.querySelector('[data-k~="' + h + '"]'); if (!cell) return;
      cell.classList.remove('hit'); void cell.offsetWidth; cell.classList.add('hit');
      setTimeout(function () { cell.scrollIntoView({ block: 'center', behavior: 'smooth' }); show(cell); }, 60);
    };
    window.addEventListener('hashchange', jump); jump();
  }
})();

