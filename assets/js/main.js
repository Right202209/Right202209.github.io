(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var canVT = function () { return !!document.startViewTransition && !reduce.matches; };
  // Run fn inside a same-document View Transition; cls on <html> picks its motion in _motion.scss.
  var withVT = function (cls, fn) {
    if (!canVT()) { fn(); return null; }
    root.classList.add(cls);
    var t = document.startViewTransition(fn);
    t.finished.finally(function () { root.classList.remove(cls); });
    return t;
  };

  // Theme: the new colours open as a circle from the toggle.
  var toggle = document.getElementById('theme-toggle');
  var applyTheme = function (next) { root.setAttribute('data-theme', next); localStorage.setItem('theme', next); };
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    var r = toggle.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var t = withVT('vt-theme', function () { applyTheme(next); });
    if (!t) return;
    var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    t.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + end + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 520, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  });

  // Small screens: the two-row header slides away while reading down and returns on the way up.
  var small = matchMedia('(max-width: 720px)'), lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY, dy = y - lastY;
      if (!small.matches || y < 80 || dy < -6) root.classList.remove('hdr-hidden');
      else if (dy > 6) root.classList.add('hdr-hidden');
      if (Math.abs(dy) > 6) lastY = y;
      ticking = false;
    });
  }, { passive: true });
  // (The active tab is centred in the nav row by an inline script in header.html, before first paint.)

  var modal = document.getElementById('search');
  var input = document.getElementById('search-input');
  var list = document.getElementById('search-results');
  var index = null, sel = 0;

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(window.SEARCH_INDEX).then(function (r) { return r.json(); })
      .then(function (d) { index = d; return d; });
  }
  function open() { modal.hidden = false; root.classList.add('search-on'); input.value = ''; list.innerHTML = ''; input.focus(); load(); }
  function close() { modal.hidden = true; root.classList.remove('search-on'); }
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
    }).join('') : art('empty', window.SEARCH_EMPTY || 'Nothing yet.');
  }
  // Droit 白狗：搜索无结果 / 加载中的插画（_data/droit.yml 里可关）
  function art(kind, text) {
    var src = (window.SEARCH_ART || {})[kind];
    if (!src) return text ? '<li style="padding:10px 14px;color:var(--muted)">' + text + '</li>' : '';
    return '<li class="search-art"><img src="' + src + '" alt="" width="140" height="140">' + (text || '') + '</li>';
  }

  document.getElementById('search-open').addEventListener('click', open);
  document.querySelectorAll('[data-search-open]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });
  var closeBtn = document.getElementById('search-close');
  if (closeBtn) closeBtn.addEventListener('click', close);
  list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  input.addEventListener('input', function () {
    if (!index && input.value.trim()) list.innerHTML = art('loading', '');
    load().then(function () { render(input.value); });
  });
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

  // ── Timeline layout. The Liquid build draws a plain linear axis; here it is re-scaled:
  //    · the lived part is stretched over most of the width and the future folds into a short
  //      dashed tail that only shows its end point (life expectancy);
  //    · once more has been lived than is left, the early years fold into a narrow stretch at the
  //      start (click it to unfold) and only the recent years are stretched;
  //    · captions are stacked into lanes above and below the axis so no two overlap.
  //    Phones get the vertical list from CSS, so nothing is done below 721px.
  function layoutTimeline(tl, born, end) {
    var YEAR = 365.2425 * DAY, TAIL = 8, FOLD = 11, GAP = 10, MIN_RECENT = 10;
    var tr = function (s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k]; }); };
    var nodes = Array.prototype.slice.call(tl.querySelectorAll('.wk-node'));
    var axis = tl.querySelector('.wk-axis');
    var mq = window.matchMedia('(max-width: 720px)');
    var unfolded = false;

    var tail = document.createElement('li'); tail.className = 'wk-tail'; tail.setAttribute('aria-hidden', 'true');
    tail.innerHTML = '<span></span>';
    var fold = document.createElement('li'); fold.className = 'wk-fold';
    fold.innerHTML = '<button type="button"></button>';
    tl.appendChild(tail); tl.appendChild(fold);
    fold.querySelector('button').addEventListener('click', function () { unfolded = !unfolded; run(); });

    var timeOf = function (n) {
      if (n.classList.contains('is-start')) return born;
      if (n.classList.contains('is-end')) return end;
      if (n.classList.contains('wk-today') || (!n.dataset.d && n.classList.contains('is-now'))) return today;
      return n.dataset.d ? ymd(n.dataset.d) : today;
    };

    var clear = function () {
      tl.classList.remove('tl-js', 'tl-folded');
      tl.style.height = '';
      nodes.forEach(function (n) { n.style.removeProperty('--off'); n.style.removeProperty('--lead'); n.style.removeProperty('--sx'); n.classList.remove('is-folded', 'lvl'); });
      each('.wk-tick.js', function (k) { k.remove(); }, tl);
    };

    function run() {
      if (mq.matches || !tl.clientWidth) { clear(); return; }
      var W = tl.clientWidth, now = Math.min(Math.max(today, born), end);
      var lived = now - born, left = end - now, NOWP = 100 - TAIL;
      var canFold = lived > left && lived > MIN_RECENT * YEAR * 1.5;
      var folded = canFold && !unfolded;
      var cut = folded ? now - Math.max(left, MIN_RECENT * YEAR) : born;
      var start = folded ? FOLD : 0;
      var pos = function (t) {
        if (t >= end) return 100;
        if (t > now) return NOWP + Math.min(.85, (t - now) / left) * TAIL;   // future events sit in the tail
        if (t < cut) return (t - born) / (cut - born) * FOLD;
        return start + (t - cut) / Math.max(1, now - cut) * (NOWP - start);
      };

      tl.classList.add('tl-js'); tl.classList.toggle('tl-folded', folded);
      tl.style.setProperty('--now', NOWP);
      tl.style.setProperty('--tail', TAIL);
      tail.querySelector('span').textContent = tr(tl.dataset.left || '', { n: Math.round(left / YEAR) });
      tail.style.display = left > 0 ? '' : 'none';

      // Fold control: a narrow stretch at the start when folded, a small "fold" link when opened.
      fold.style.display = canFold ? '' : 'none';
      var cutAge = Math.floor((cut - born) / YEAR);
      fold.style.setProperty('--fw', folded ? FOLD : 0);
      fold.querySelector('button').textContent = folded ? tr(tl.dataset.fold || '', { a: 0, b: cutAge }) : (tl.dataset.unfold || '');

      // Ticks: ages along the stretched part only, spaced so labels never crowd.
      each('.wk-tick', function (k) { if (k.classList.contains('js')) k.remove(); else k.style.display = 'none'; }, tl);
      var pxYear = W * (NOWP - start) / 100 / Math.max(1e-9, (now - cut) / YEAR);
      var step = [1, 2, 5, 10, 20].filter(function (s) { return s * pxYear >= 46; })[0] || 20;
      for (var a = Math.ceil((cut - born) / YEAR / step) * step; a * YEAR < lived; a += step) {
        if (a === 0) continue;
        var tk = document.createElement('li'); tk.className = 'wk-tick js'; tk.setAttribute('aria-hidden', 'true');
        tk.style.setProperty('--p', pos(born + a * YEAR).toFixed(2)); tk.innerHTML = '<span>' + a + '</span>';
        tl.insertBefore(tk, axis.nextSibling);
      }

      // Place every node, then gather the captions that need room.
      var items = [];
      nodes.forEach(function (n) {
        var t = timeOf(n), pp = pos(t);
        n.style.setProperty('--p', pp.toFixed(3));
        var isFold = folded && t < cut && !n.classList.contains('is-start');
        n.classList.toggle('is-folded', isFold);
        var cap = n.querySelector('.wk-cap');
        if (isFold) { var tm = cap && cap.textContent.replace(/\s+/g, ' ').trim(); var dot = n.querySelector('.wk-dot'); if (dot && tm) dot.title = tm; }
        n.style.removeProperty('--sx');
        if (!cap || isFold) return;
        var w = cap.offsetWidth, h = cap.offsetHeight, x = pp / 100 * W, l, r;
        if (n.classList.contains('is-start')) { l = x - 12; r = l + w; }
        else if (n.classList.contains('is-end')) { r = x + 12; l = r - w; }
        else {
          l = x - w / 2; r = x + w / 2;
          var sx = l < -12 ? -12 - l : r > W + 12 ? W + 12 - r : 0;   // keep it inside the box
          if (sx) { l += sx; r += sx; n.style.setProperty('--sx', sx.toFixed(1) + 'px'); }
        }
        items.push({ n: n, l: l, r: r, h: h, x: x, pin: n.classList.contains('is-end') ? 'down' : n.classList.contains('is-start') ? 'up' : '' });
      });
      // The fold button and the tail label take room on the axis too.
      var blocks = { up: [[]], down: [[]] };
      var put = function (side, lv, l, r) { while (blocks[side].length <= lv) blocks[side].push([]); blocks[side][lv].push([l, r]); };
      var free = function (side, lv, l, r) { return !(blocks[side][lv] || []).some(function (s) { return l < s[1] + GAP && r + GAP > s[0]; }); };
      if (canFold && folded) put('down', 0, 0, FOLD / 100 * W + 4);
      if (left > 0) put('up', 0, NOWP / 100 * W + 8, W - 4);

      // Greedy lanes, left to right: the first free slot nearest the axis, alternating sides
      // so neighbours fall on opposite sides when both are free.
      items.sort(function (a, c) { return a.x - c.x; });
      var last = 'down', sides = { up: [], down: [] };
      items.forEach(function (it) {
        var order = it.pin ? [it.pin] : (last === 'up' ? ['down', 'up'] : ['up', 'down']);
        for (var lv = 0; ; lv++) {
          var s = order.filter(function (sd) { return free(sd, lv, it.l, it.r); })[0];
          if (s) { it.side = s; it.lv = lv; put(s, lv, it.l, it.r); break; }
          if (lv > 12) { it.side = order[0]; it.lv = lv; break; }
        }
        last = it.side;
        (sides[it.side][it.lv] = sides[it.side][it.lv] || []).push(it);
      });

      // Each lane is as tall as its tallest caption; lanes stack outward from the axis.
      var BASE = { up: 18, down: 26 }, ext = { up: 0, down: 0 };
      ['up', 'down'].forEach(function (sd) {
        var off = BASE[sd];
        for (var lv = 0; lv < sides[sd].length; lv++) {
          var lane = sides[sd][lv] || [], hmax = 0;
          lane.forEach(function (it) {
            hmax = Math.max(hmax, it.h);
            it.n.classList.remove('up', 'down', 'far'); it.n.classList.add(sd);
            it.n.classList.toggle('lvl', lv > 0);
            it.n.style.setProperty('--off', off + 'px');
            it.n.style.setProperty('--lead', Math.max(0, off - 12) + 'px');
          });
          if (lane.length) { ext[sd] = off + hmax; off += hmax + 10; }
        }
      });
      var half = Math.max(ext.up, ext.down, 90) + 28;
      tl.style.height = half * 2 + 'px'; tl.style.setProperty('--h', half * 2 + 'px');
    }

    var raf = 0, sched = function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
    if (window.ResizeObserver) new ResizeObserver(sched).observe(tl); else window.addEventListener('resize', sched);
    if (mq.addEventListener) mq.addEventListener('change', sched);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sched);
    sched();
  }

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
      var b = ymd(tl.dataset.born), tEnd = ymd(tl.dataset.end), p = Math.max(0, Math.min(100, (today - b) / (tEnd - b) * 100)).toFixed(2);
      tl.style.setProperty('--now', p);
      each('.wk-today', function (n) { n.style.setProperty('--p', p); var t = n.querySelector('time'); t.textContent = fmt(today, zh); t.dateTime = fmt(today, true); }, tl);
      each('.wk-node[data-d]', function (n) { var f = ymd(n.dataset.d) > today; n.classList.toggle('is-future', f); n.classList.toggle('is-past', !f); }, tl);
      layoutTimeline(tl, b, tEnd);
    }

    // Hover: a light tooltip. Click: the same facts pinned as a card that stays until closed,
    // with the week's note, pictures and link (from the <template>s in weeks/notes.html).
    // Weeks whose event has a url are link cells: a click follows the link, unless the week also
    // has a note, in which case the card opens and carries the link as a button.
    var SEASON_ZH = ['冬', '春', '夏', '秋'], SEASON_EN = ['Winter', 'Spring', 'Summer', 'Autumn'];
    var SOLAR_ZH = ['立冬', '立春', '立夏', '立秋'], SOLAR_EN = ['Start of Winter', 'Start of Spring', 'Start of Summer', 'Start of Autumn'];
    var card = wk.querySelector('.wk-card'), cardMeta = card && card.querySelector('.wk-card-meta'), cardBody = card && card.querySelector('.wk-card-body');
    var pinned = null;
    var cellOf = function (t) { var c = t && t.closest ? t.closest('.wk-cells > i') : null; return c && wk.contains(c) ? c : null; };
    var live = function (c) { return c && !(c.classList.contains('f') && !c.dataset.ev); };
    var facts = function (c) {
      var row = c.closest('.wk-yr'), i = Array.prototype.indexOf.call(c.parentNode.children, c);
      // Weeks start on January 1; age still follows the actual birthday (Feb 28 in non-leap years).
      var d = ymd(row.dataset.from) + i * WEEK, y = new Date(d).getUTCFullYear();
      var bd = Date.UTC(y, bm, Math.min(bdd, new Date(Date.UTC(y, bm + 1, 0)).getUTCDate()));
      var age = y - by - (d < bd && !c.classList.contains('bd') ? 1 : 0);
      var wn = Math.floor((d - Date.UTC(y, 0, 1)) / WEEK) + 1;
      var ageText = age < 0 ? (zh ? '出生前' : 'Before birth') : (zh ? age + ' 岁' : 'age ' + age);
      var era = name('era', c.className), place = name('place', c.className);
      var where = [era, place && (zh ? '在' + place : 'in ' + place)].filter(Boolean).join(zh ? '，' : ', ');
      // Season (split at 立春 立夏 立秋 立冬); the week a season begins names its solar term.
      var q = /(?:^| )q(\d)/.exec(c.className), st = (c.dataset.st || '').split(' ');
      var season = c.dataset.st ? (zh ? SOLAR_ZH : SOLAR_EN)[st[0]] + ' ' + fmt(ymd(st[1]), zh).replace(/^\d{4}-/, '')
                 : q ? (zh ? SEASON_ZH : SEASON_EN)[q[1]] : '';
      return [fmt(d, zh), zh ? y + ' 年第 ' + wn + ' 周' : 'week ' + wn + ' of ' + y, ageText, season, where];
    };
    var priv = function (c) { return c.classList.contains('pv') ? (zh ? '🔒 私密' : '🔒 Private') : ''; };
    // Keep a floating box inside the viewport, under the cell (or above it when there's no room).
    var place = function (box, c, gap) {
      var r = c.getBoundingClientRect(), o = wk.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
      var lo = Math.max(8, o.left), hi = Math.min(document.documentElement.clientWidth - 8, o.right);
      var x = Math.max(lo, Math.min(r.left + r.width / 2 - w / 2, hi - w));
      var below = r.bottom + gap + h <= window.innerHeight - 8 || r.top - gap - h < 8;
      box.style.left = x - o.left + 'px';
      box.style.top = (below ? r.bottom + gap : r.top - gap - h) - o.top + 'px';
      box.dataset.side = below ? 'below' : 'above';
    };
    var show = function (c) {
      if (!live(c) || c === pinned) { tip.hidden = true; return; }
      var hint = c.classList.contains('nt') ? card && card.dataset.open : c.classList.contains('ln') ? card && card.dataset.go : '';
      tip.textContent = facts(c).concat([c.dataset.ev || priv(c)]).filter(Boolean).join(' · ') + (hint ? ' — ' + hint + (c.classList.contains('nt') ? '' : ' ↗') : '');
      tip.hidden = false;
      place(tip, c, 8);
    };
    var unpin = function (keepFocus) {
      if (!pinned) return;
      var c = pinned; pinned = null;
      c.classList.remove('pin'); c.removeAttribute('aria-expanded');
      card.hidden = true; cardBody.textContent = '';
      if (location.hash.indexOf('#ev-') === 0) history.replaceState(null, '', location.pathname + location.search);
      if (keepFocus) (c.querySelector('a') || c).focus({ preventScroll: true });
    };
    var pin = function (c, focus) {
      if (!card || !live(c)) return;
      if (pinned === c) { unpin(focus); return; }
      unpin();
      pinned = c; tip.hidden = true;
      c.classList.add('pin'); c.setAttribute('aria-expanded', 'true');
      var meta = facts(c);
      if (!c.dataset.k && c.classList.contains('pv')) meta.push(priv(c));
      cardMeta.textContent = meta.filter(Boolean).join(' · ');
      cardBody.textContent = '';
      (c.dataset.k || '').split(' ').forEach(function (k) {
        if (!k) return;
        each('template[data-note="' + k + '"]', function (tp) { cardBody.appendChild(document.importNode(tp.content, true)); }, wk);
      });
      // A birthday or a week with no note still gets its own line.
      if (!cardBody.firstChild && c.textContent.trim() && !c.classList.contains('pv')) {
        var h = document.createElement('h3'); h.className = 'wk-note-title'; h.textContent = c.textContent.trim();
        var a = document.createElement('article'); a.className = 'wk-note'; a.appendChild(h); cardBody.appendChild(a);
      }
      card.classList.toggle('bare', !cardBody.firstChild);
      card.setAttribute('aria-label', cardMeta.textContent);
      card.hidden = false;
      card.scrollTop = 0;
      place(card, c, 12);
      each('img', function (im) { if (!im.complete) im.addEventListener('load', function () { if (pinned === c) place(card, c, 12); }); }, cardBody);
      if (c.id) history.replaceState(null, '', '#' + c.id);
      if (focus) card.focus({ preventScroll: true });
    };
    var grid = wk.querySelector('.wk-grid');
    // Event weeks take keyboard focus (link cells already do, through their link).
    each('.wk-cells > i[data-ev]:not(.ln)', function (c) { c.tabIndex = 0; c.setAttribute('role', 'button'); }, grid);
    grid.addEventListener('mouseover', function (e) { if (matchMedia('(hover: hover)').matches) show(cellOf(e.target)); });
    grid.addEventListener('mouseleave', function () { tip.hidden = true; });
    grid.addEventListener('click', function (e) {
      var c = cellOf(e.target); if (!c) return;
      var link = e.target.closest('a.wk-a');
      if (link) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // new tab etc.: let the browser do it
        if (!c.classList.contains('nt')) { tip.hidden = true; return; }  // a plain link cell is just a link
        e.preventDefault();
      }
      pin(c, e.detail === 0);
    });
    grid.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.wk-cells > i[data-ev]')) { e.preventDefault(); pin(e.target, true); }
    });
    if (card) {
      card.querySelector('.wk-card-x').addEventListener('click', function () { unpin(true); });
      document.addEventListener('click', function (e) { if (pinned && !card.contains(e.target) && !cellOf(e.target)) unpin(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pinned) unpin(true); });
      window.addEventListener('resize', function () { if (pinned) place(card, pinned, 12); });
    }
    document.addEventListener('click', function (e) { if (!grid.contains(e.target)) tip.hidden = true; });

    // Grid / timeline switch, remembered per browser
    var setView = function (v) {
      if (v !== 'grid') unpin();
      wk.dataset.view = v;
      each('.wk-switch button', function (btn) { btn.setAttribute('aria-pressed', btn.dataset.v === v); }, wk);
    };
    setView(localStorage.getItem('weeks-view') || wk.dataset.view);
    each('.wk-switch button', function (btn) {
      btn.addEventListener('click', function () {
        if (wk.dataset.view !== btn.dataset.v) withVT('vt-swap', function () { setView(btn.dataset.v); });
        localStorage.setItem('weeks-view', btn.dataset.v);
      });
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
      setTimeout(function () { cell.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (pinned !== cell) pin(cell);
        setTimeout(function () { if (pinned === cell) place(card, cell, 12); }, 700); }, 60);
    };
    window.addEventListener('hashchange', jump); jump();
  }
})();


// ─── Album lightbox ──────────────────────────────────────────
// Each [data-photo] link opens the full image in the dialog; ← → / swipe to move, Esc to close.
// Where View Transitions exist, the thumbnail zooms into the lightbox and back (motion in _motion.scss).
// Without JS the links still open the image on its own.
(function () {
  var grid = document.querySelector('[data-photos]'), lb = document.querySelector('.ph-lb');
  if (!grid || !lb || typeof lb.showModal !== 'function') return;
  var root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var links = Array.prototype.slice.call(grid.querySelectorAll('[data-photo]'));
  var img = lb.querySelector('img'), tt = lb.querySelector('.ph-title'), mt = lb.querySelector('.ph-meta'), nn = lb.querySelector('.ph-n');
  var cur = 0, busy = false;
  if (links.length < 2) lb.classList.add('single');
  var canVT = function () { return !!document.startViewTransition && !reduce.matches; };
  var thumbOf = function (i) { return links[i].querySelector('img'); };
  var inView = function (el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
  var preload = function (i) { var a = links[(i + links.length) % links.length]; if (a) { var p = new Image(); p.src = a.href; } };
  // Wait until the full image is decoded (at most 300ms) so the zoom never lands on an empty frame.
  var ready = function (src) {
    var p = new Image(); p.src = src;
    return Promise.race([p.decode ? p.decode().catch(function () {}) : Promise.resolve(),
                         new Promise(function (r) { setTimeout(r, 300); })]);
  };
  var show = function (i, dir) {
    cur = (i + links.length) % links.length;
    var a = links[cur];
    img.classList.remove('in-next', 'in-prev');
    img.onload = function () {
      img.classList.remove('loading');
      if (dir && !reduce.matches) { void img.offsetWidth; img.classList.add('in-' + dir); }
    };
    img.classList.add('loading');
    img.src = a.href; img.alt = a.dataset.title || '';
    if (img.complete && img.naturalWidth) img.onload();
    tt.textContent = a.dataset.title || ''; mt.textContent = a.dataset.meta || '';
    nn.textContent = links.length > 1 ? (cur + 1) + ' / ' + links.length : '';
    preload(cur + 1); preload(cur - 1);
  };
  var finish = function (t, el) {
    t.finished.finally(function () { if (el) el.style.viewTransitionName = ''; root.classList.remove('vt-photo'); busy = false; });
  };
  var openAt = function (i) {
    if (busy || lb.open) return;
    var doOpen = function () { show(i); lb.showModal(); root.style.overflow = 'hidden'; };
    if (!canVT()) return doOpen();
    busy = true;
    var th = thumbOf(i);
    ready(links[i].href).then(function () {
      th.style.viewTransitionName = 'ph-zoom';
      root.classList.add('vt-photo');
      var t = document.startViewTransition(function () {
        th.style.viewTransitionName = '';
        img.style.viewTransitionName = 'ph-zoom';
        doOpen();
      });
      finish(t, img);
    });
  };
  var closeLb = function () {
    if (!lb.open || busy) return;
    var th = thumbOf(cur);
    if (!canVT() || !th) return lb.close();
    if (!inView(th)) th.scrollIntoView({ block: 'nearest' });   // never fly back from off-screen
    busy = true;
    img.style.viewTransitionName = 'ph-zoom';
    root.classList.add('vt-photo');
    var t = document.startViewTransition(function () {
      img.style.viewTransitionName = '';
      th.style.viewTransitionName = 'ph-zoom';
      lb.close();
    });
    finish(t, th);
  };
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); openAt(i);
    });
  });
  lb.addEventListener('close', function () { root.style.overflow = ''; links[cur].focus({ preventScroll: true }); });
  lb.addEventListener('cancel', function (e) { e.preventDefault(); closeLb(); });   // Esc closes with the same motion
  lb.querySelector('.ph-prev').addEventListener('click', function () { show(cur - 1, 'prev'); });
  lb.querySelector('.ph-next').addEventListener('click', function () { show(cur + 1, 'next'); });
  lb.querySelector('.ph-close').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });   // tap the dark backdrop
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, 'prev'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, 'next'); }
  });
  // Swipe: the photo follows the finger, then either moves on or springs back.
  var x0 = null;
  var release = function () { img.style.transition = ''; img.style.transform = ''; img.style.opacity = ''; };
  lb.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { x0 = null; return; }
    x0 = e.touches[0].clientX; img.classList.remove('in-next', 'in-prev');
  }, { passive: true });
  lb.addEventListener('touchmove', function (e) {
    if (x0 === null || reduce.matches) return;
    var dx = e.touches[0].clientX - x0;
    img.style.transition = 'none';
    img.style.transform = 'translateX(' + dx + 'px)';
    img.style.opacity = String(1 - Math.min(Math.abs(dx) / 400, .4));
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    release();
    if (Math.abs(dx) > 45) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
  }, { passive: true });
  lb.addEventListener('touchcancel', function () { x0 = null; release(); }, { passive: true });
})();

// Storybook entry (故事手书) on the Life page: the card leans toward the pointer,
// the dog on the little cover watches it, and the eyebrow letters hop on hover.
(function () {
  var card = document.querySelector('[data-sb-entry]');
  if (!card) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hop = card.querySelector('[data-hop]');
  if (hop) {
    var txt = hop.textContent; hop.textContent = '';
    hop.setAttribute('aria-label', txt);
    txt.split('').forEach(function (c, i) {
      var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = c;
      s.setAttribute('aria-hidden', 'true'); hop.appendChild(s);
    });
  }
  var eye = card.querySelector('.sb-mini-eye');
  var move = function (e) {
    var r = card.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    if (!still) { card.style.setProperty('--ry', (nx * 6).toFixed(2) + 'deg'); card.style.setProperty('--rx', (-ny * 6).toFixed(2) + 'deg'); }
    if (eye) {
      var er = eye.getBoundingClientRect(), a = Math.atan2(e.clientY - er.top, e.clientX - er.left);
      eye.style.transform = 'translate(' + (Math.cos(a) * 1.3).toFixed(2) + 'px,' + (Math.sin(a) * 1.3).toFixed(2) + 'px)';
    }
  };
  document.addEventListener('pointermove', function (e) {
    var r = card.getBoundingClientRect();
    if (e.clientY < r.top - 200 || e.clientY > r.bottom + 200) return;
    if (eye) { var er = eye.getBoundingClientRect(), a = Math.atan2(e.clientY - er.top, e.clientX - er.left);
      eye.style.transform = 'translate(' + (Math.cos(a) * 1.3).toFixed(2) + 'px,' + (Math.sin(a) * 1.3).toFixed(2) + 'px)'; }
  }, { passive: true });
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerleave', function () { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); });
  // Once it scrolls into view, the cover lifts a little, as if something inside wants out.
  if ('IntersectionObserver' in window && !still) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      setTimeout(function () { card.classList.add('peek'); setTimeout(function () { card.classList.remove('peek'); }, 700); }, 400);
    }, { threshold: .6 });
    io.observe(card);
  }
})();
