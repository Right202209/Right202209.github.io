// Projects page: web projects open in an in-page "peek" that grows out of their card
// (after oooo.so), and GitHub repositories fill in their pins from the GitHub API.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Live thumbnails: a scaled-down iframe of the page itself ---------- */
  var LIVE_W = 1280, LIVE_H = 800;
  function mountLive(slot) {
    if (slot.firstChild) return;
    var f = document.createElement('iframe');
    f.src = slot.dataset.src;
    f.tabIndex = -1;
    f.title = '';
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('loading', 'lazy');
    f.setAttribute('scrolling', 'no');
    f.width = LIVE_W; f.height = LIVE_H;
    f.addEventListener('load', function () { slot.classList.add('is-on'); });
    slot.appendChild(f);
    fitLive(slot);
  }
  function fitLive(slot) {
    var box = slot.parentNode.getBoundingClientRect();
    if (!box.width) return;
    // cover: fill the thumb, crop the rest
    var s = Math.max(box.width / LIVE_W, box.height / LIVE_H);
    slot.style.setProperty('--live-s', s);
  }
  var lives = [].slice.call(document.querySelectorAll('.pj-live'));
  if (lives.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { mountLive(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '200px' });
      lives.forEach(function (l) { io.observe(l); });
    } else lives.forEach(mountLive);
    window.addEventListener('resize', function () { lives.forEach(fitLive); });
  }

  /* ---------- Peek ---------- */
  var peek = document.getElementById('pj-peek');
  if (peek) {
    var clip = peek.querySelector('.pj-clip');
    var frames = peek.querySelector('.pj-frames');
    var titleEl = peek.querySelector('.pj-peek-title');
    var openTab = peek.querySelector('.pj-peek-open');
    var closeBtn = peek.querySelector('.pj-peek-x');
    var cache = {};          // url -> iframe, kept so a reopened project doesn't reload
    var active = null;       // { url, card }
    var busy = false;

    var frameFor = function (url) {
      if (cache[url]) return cache[url];
      var f = document.createElement('iframe');
      f.src = url;
      f.setAttribute('allow', 'fullscreen; clipboard-write; autoplay');
      f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      f.hidden = true;
      frames.appendChild(f);
      return (cache[url] = f);
    };

    var target = function () {
      var W = peek.clientWidth || innerWidth, H = peek.clientHeight || innerHeight, mobile = W < 768;
      var w = mobile ? W - 24 : Math.min(1400, W * 0.8);
      var h = mobile ? H * 0.78 : Math.min(H * 0.8, w * 9 / 16 + 40);
      w = Math.round(w); h = Math.round(h);
      return { left: Math.round((W - w) / 2), top: Math.round((H - h) / 2) - (mobile ? 18 : 12), width: w, height: h };
    };
    var place = function (r) {
      clip.style.left = r.left + 'px'; clip.style.top = r.top + 'px';
      clip.style.width = r.width + 'px'; clip.style.height = r.height + 'px';
    };
    var sizeFrames = function () {
      var t = target();
      frames.style.width = t.width + 'px';
      frames.style.height = (t.height - 40) + 'px';
      return t;
    };
    var fromRect = function (card) {
      var th = card.querySelector('.pj-thumb') || card;
      return th.getBoundingClientRect();
    };
    var animate = function (from, to, dir, ms, done) {
      clip.style.transition = 'none';
      place(from);
      clip.style.opacity = dir === 'in' ? '0' : '1';
      clip.style.borderRadius = dir === 'in' ? '18px' : '14px';
      void clip.offsetWidth;
      if (reduce.matches) ms = 0;
      clip.style.transition = ms ? 'all ' + ms + 'ms cubic-bezier(.35,.38,.09,.99)' : 'none';
      place(to);
      clip.style.opacity = dir === 'in' ? '1' : '.2';
      clip.style.borderRadius = dir === 'in' ? '14px' : '18px';
      var fin = false, end = function () { if (fin) return; fin = true; clip.style.transition = 'none'; done && done(); };
      if (!ms) { end(); return; }
      clip.addEventListener('transitionend', function h(e) { if (e.target === clip) { clip.removeEventListener('transitionend', h); end(); } });
      setTimeout(end, ms + 80);
    };

    var open = function (card) {
      if (busy || active) return;
      var url = card.dataset.peek;
      busy = true;
      active = { url: url, card: card };
      Object.keys(cache).forEach(function (k) { cache[k].hidden = true; });
      var f = frameFor(url); f.hidden = false;
      titleEl.textContent = card.dataset.title || url;
      openTab.href = url;
      peek.hidden = false;
      root.classList.add('pj-lock');
      card.classList.add('is-peeking');
      void peek.offsetWidth;
      peek.classList.add('is-open');
      var to = sizeFrames();
      animate(fromRect(card), to, 'in', 320, function () { busy = false; closeBtn.focus({ preventScroll: true }); });
    };
    var close = function () {
      if (!active || busy) return;
      busy = true;
      var card = active.card;
      peek.classList.remove('is-open');
      animate(target(), fromRect(card), 'out', 180, function () {
        peek.hidden = true;
        root.classList.remove('pj-lock');
        card.classList.remove('is-peeking');
        active = null; busy = false;
        card.focus({ preventScroll: true });
      });
    };

    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('.pj-card[data-peek]');
      if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      open(card);
    });
    // Warm the frame up while the pointer hovers, like the reference does.
    document.addEventListener('pointerover', function (e) {
      var card = e.target.closest && e.target.closest('.pj-card[data-peek]');
      if (card && e.pointerType === 'mouse') frameFor(card.dataset.peek);
    });
    peek.addEventListener('click', function (e) { if (e.target === peek) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (!active) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {   // keep focus on the peek's own controls
        var els = [closeBtn, cache[active.url], openTab];
        var i = els.indexOf(document.activeElement);
        e.preventDefault();
        els[(i + (e.shiftKey ? els.length - 1 : 1)) % els.length].focus();
      }
    });
    window.addEventListener('resize', function () { if (active && !busy) place(sizeFrames()); });
  }

  /* ---------- GitHub pins ---------- */
  var COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Java: '#b07219', Go: '#00ADD8',
    Rust: '#dea584', 'C++': '#f34b7d', C: '#555555', 'C#': '#178600', Ruby: '#701516', PHP: '#4F5D95',
    Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB', Shell: '#89e051', HTML: '#e34c26', CSS: '#663399',
    SCSS: '#c6538c', Vue: '#41b883', Svelte: '#ff3e00', Lua: '#000080', 'Jupyter Notebook': '#DA5B0B',
    'Vim Script': '#199f4b', Dockerfile: '#384d54', Astro: '#ff5a03', Zig: '#ec915c', Elixir: '#6e4a7e',
    Haskell: '#5e5086', Scala: '#c22d40', R: '#198CE7', MDX: '#fcb32c', Nix: '#7e7eff', Makefile: '#427819'
  };
  var TTL = 6 * 3600 * 1000;
  var fmt = function (n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n); };
  var fill = function (pin, d) {
    var desc = pin.querySelector('.pj-pin-desc');
    if (!pin.hasAttribute('data-own-desc') && d.description) desc.textContent = d.description;
    if (d.archived) pin.querySelector('.pj-pin-vis').textContent = 'Public archive';
    if (d.language) {
      var l = pin.querySelector('.pj-lang');
      l.querySelector('span').textContent = d.language;
      l.querySelector('.pj-dot').style.background = COLORS[d.language] || '#8b949e';
      l.hidden = false;
    }
    [['.pj-stars', d.stargazers_count], ['.pj-forks', d.forks_count]].forEach(function (x) {
      if (!x[1]) return;
      var a = pin.querySelector(x[0]);
      a.querySelector('span').textContent = fmt(x[1]);
      a.hidden = false;
    });
  };
  [].forEach.call(document.querySelectorAll('.pj-pin[data-repo]'), function (pin) {
    var l0 = pin.querySelector('.pj-lang');   // language written in _data/projects.yml
    if (!l0.hidden) l0.querySelector('.pj-dot').style.background = COLORS[l0.textContent.trim()] || '#8b949e';
    var repo = pin.dataset.repo, key = 'gh-repo:' + repo, hit = null;
    try { hit = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (hit && Date.now() - hit.t < TTL) { fill(pin, hit.d); return; }
    fetch('https://api.github.com/repos/' + repo, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (d) {
        var keep = { description: d.description, language: d.language, stargazers_count: d.stargazers_count, forks_count: d.forks_count, archived: d.archived };
        try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: keep })); } catch (e) {}
        fill(pin, keep);
      })
      .catch(function () { if (hit) fill(pin, hit.d); });   // rate-limited: an old answer beats none
  });
})();
