// Music player (a pluggable widget; markup from _includes/player.html).
// One shared <audio> drives every .mp on the page, so a track keeps playing when the card that
// started it closes: it then moves to a small dock in the corner, which links back to its week.
// Widgets can come and go at any time (the weeks card clones them from <template>s); a
// MutationObserver re-syncs them, so nothing has to "mount" them.
(function () {
  'use strict';
  var zh = (document.documentElement.lang || '').indexOf('zh') === 0;
  var T = zh ? { play: '播放', pause: '暂停', close: '关闭播放器', back: '回到这一周', err: '这段音频暂时放不了' }
             : { play: 'Play', pause: 'Pause', close: 'Close player', back: 'Back to this week', err: 'This audio can’t be played right now' };
  var audio = new Audio();
  audio.preload = 'none';
  var cur = { key: '', list: [], i: 0, ref: '' }, failed = false, dock = null, raf = 0;
  var all = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var mmss = function (s) { if (!isFinite(s) || s < 0) return '--:--'; s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };

  var tracksOf = function (mp) {
    return all('.mp-list [data-src]', mp).map(function (b) {
      return { src: b.dataset.src, title: b.dataset.title || '', artist: b.dataset.artist || '', cover: b.dataset.cover || '' };
    });
  };
  var keyOf = function (mp) { return mp.dataset.key || (mp.dataset.key = tracksOf(mp).map(function (t) { return t.src; }).join('|')); };
  var isCur = function (mp) { return !!cur.key && keyOf(mp) === cur.key; };
  var visibleWidgets = function () { return all('.mp').filter(function (m) { return isCur(m) && m.offsetParent !== null; }); };

  function start(mp, i) {
    cur = { key: keyOf(mp), list: tracksOf(mp), i: i, ref: mp.dataset.ref || '' };
    failed = false;
    audio.src = cur.list[i].src;
    play();
    meta();
    paint();
  }
  function play() {
    if (!audio.src) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') paint(); });
  }
  function toggle() { if (audio.paused) play(); else audio.pause(); }
  function step(d) {
    if (!cur.list.length) return;
    var i = cur.i + d;
    if (i < 0 || i >= cur.list.length) return;
    cur.i = i; failed = false; audio.src = cur.list[i].src; play(); meta(); paint();
  }
  function stop() { audio.pause(); audio.removeAttribute('src'); audio.load(); cur = { key: '', list: [], i: 0, ref: '' }; failed = false; paint(); }

  // Lock screen / media keys
  function meta() {
    var t = cur.list[cur.i];
    if (!t || !('mediaSession' in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, artwork: t.cover ? [{ src: t.cover }] : [] });
    try {
      navigator.mediaSession.setActionHandler('play', play);
      navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', cur.list.length > 1 ? function () { step(-1); } : null);
      navigator.mediaSession.setActionHandler('nexttrack', cur.list.length > 1 ? function () { step(1); } : null);
    } catch (e) {}
  }

  // Draw one widget (or the dock) from the current state.
  function draw(root, track, mine) {
    var playing = mine && !audio.paused && !failed;
    root.classList.toggle('is-cur', mine);
    root.classList.toggle('playing', playing);
    root.classList.toggle('loading', mine && playing && audio.readyState < 3);
    root.classList.toggle('failed', mine && failed);
    var set = function (sel, v) { var el = root.querySelector(sel); if (el && el.textContent !== v) el.textContent = v; };
    set('.mp-title', track.title);
    set('.mp-artist', track.artist);
    var cv = root.querySelector('.mp-cover');
    if (cv) { var bg = track.cover ? 'url("' + track.cover.replace(/"/g, '%22') + '")' : ''; if (cv.style.backgroundImage !== bg) cv.style.backgroundImage = bg; cv.classList.toggle('has', !!track.cover); }
    var btn = root.querySelector('.mp-play');
    if (btn) btn.setAttribute('aria-label', playing ? (btn.dataset.pause || T.pause) : (btn.dataset.play || T.play));
    time(root, mine);
  }
  function time(root, mine) {
    var d = mine ? audio.duration : NaN, c = mine ? audio.currentTime : 0;
    var pct = isFinite(d) && d > 0 ? c / d * 100 : 0;
    var bar = root.querySelector('.mp-bar');
    if (bar) { bar.style.setProperty('--p', pct.toFixed(2) + '%'); bar.setAttribute('aria-valuenow', Math.round(pct)); bar.setAttribute('aria-valuetext', mmss(c) + ' / ' + mmss(d)); }
    var a = root.querySelector('.mp-cur'), b = root.querySelector('.mp-dur');
    if (mine && failed) { var l = root.querySelector('.mp-list'); if (a) a.textContent = (l && l.dataset.err) || T.err; if (b) b.textContent = ''; return; }
    if (a) a.textContent = mmss(c);
    if (b) b.textContent = mine ? mmss(d) : (b.dataset.d || '--:--');
  }

  function paint() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      all('.mp').forEach(function (mp) {
        var mine = isCur(mp), list = tracksOf(mp), i = mine ? cur.i : 0;
        draw(mp, list[i] || { title: '', artist: '' }, mine);
        all('.mp-list li', mp).forEach(function (li, k) { li.classList.toggle('on', mine && k === cur.i); });
        var pv = mp.querySelector('.mp-prev'), nx = mp.querySelector('.mp-next');
        if (pv) pv.disabled = mine ? cur.i === 0 : true;
        if (nx) nx.disabled = mine ? cur.i >= list.length - 1 : list.length < 2;
      });
      // The week that's playing gets a little equaliser in the grid.
      all('.mp-on').forEach(function (el) { el.classList.remove('mp-on'); });
      if (cur.ref && !audio.paused && !failed) { var el = document.getElementById(cur.ref); if (el) el.classList.add('mp-on'); }
      paintDock();
    });
  }

  // The dock: shown while a track is loaded but no widget for it is on screen.
  function paintDock() {
    var want = !!cur.key && !visibleWidgets().length;
    if (!want) { if (dock && !dock.hidden) dock.hidden = true; return; }
    if (!dock) {
      dock = document.createElement('div');
      dock.className = 'mp-dock';
      dock.setAttribute('role', 'region');
      dock.setAttribute('aria-label', T.play);
      dock.innerHTML =
        '<button type="button" class="mp-disc mp-play"><span class="mp-cover"></span>' +
        '<svg class="mp-i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
        '<svg class="mp-i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button>' +
        '<a class="mp-info" href="#"><b class="mp-title"></b><span class="mp-artist"></span><span class="mp-cur"></span></a>' +
        '<button type="button" class="mp-x" aria-label="' + T.close + '">×</button>' +
        '<div class="mp-bar" aria-hidden="true"><i></i></div>';
      document.body.appendChild(dock);
      dock.querySelector('.mp-x').addEventListener('click', stop);
      dock.querySelector('.mp-info').addEventListener('click', function (e) {
        e.preventDefault();
        if (!cur.ref) return;
        var target = '#' + cur.ref;
        if (location.hash === target) history.replaceState(null, '', location.pathname + location.search);
        if (document.getElementById(cur.ref)) location.hash = target;
      });
    }
    var info = dock.querySelector('.mp-info');
    info.title = cur.ref ? T.back : '';
    info.classList.toggle('nolink', !cur.ref || !document.getElementById(cur.ref));
    draw(dock, cur.list[cur.i] || { title: '', artist: '' }, true);
    if (dock.hidden) dock.hidden = false;
  }

  // Clicks anywhere: play/pause, a track in the list, prev/next.
  document.addEventListener('click', function (e) {
    var mp = e.target.closest && e.target.closest('.mp');
    if (!mp) {
      if (dock && dock.contains(e.target) && e.target.closest('.mp-play')) toggle();
      return;
    }
    var li = e.target.closest('.mp-list [data-src]');
    if (li) {
      var k = all('.mp-list [data-src]', mp).indexOf(li);
      if (isCur(mp) && k === cur.i && !failed) toggle(); else start(mp, k);
      return;
    }
    if (e.target.closest('.mp-play')) { if (isCur(mp) && !failed) toggle(); else start(mp, isCur(mp) ? cur.i : 0); return; }
    if (e.target.closest('.mp-prev')) { if (isCur(mp)) step(-1); return; }
    if (e.target.closest('.mp-next')) { if (isCur(mp)) step(1); else start(mp, 1); }
  });

  // Seeking: drag or click the bar (starts the track if it isn't the current one), arrows ±5 s.
  var seekAt = function (bar, x) {
    var r = bar.getBoundingClientRect(), f = Math.max(0, Math.min(1, (x - r.left) / r.width));
    if (isFinite(audio.duration)) { audio.currentTime = f * audio.duration; time(bar.closest('.mp'), true); }
    else audio.addEventListener('loadedmetadata', function once() { audio.removeEventListener('loadedmetadata', once); audio.currentTime = f * audio.duration; });
  };
  document.addEventListener('pointerdown', function (e) {
    var bar = e.target.closest && e.target.closest('.mp .mp-bar');
    if (!bar) return;
    var mp = bar.closest('.mp');
    if (!isCur(mp) || failed) start(mp, isCur(mp) ? cur.i : 0);
    e.preventDefault();
    bar.setPointerCapture && bar.setPointerCapture(e.pointerId);
    bar.classList.add('drag');
    seekAt(bar, e.clientX);
    var move = function (ev) { seekAt(bar, ev.clientX); };
    var up = function () { bar.classList.remove('drag'); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); };
    bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
  });
  document.addEventListener('keydown', function (e) {
    var bar = e.target.closest && e.target.closest('.mp .mp-bar');
    if (!bar || !isCur(bar.closest('.mp')) || !isFinite(audio.duration)) return;
    var d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 }[e.key];
    if (e.key === 'Home') audio.currentTime = 0; else if (e.key === 'End') audio.currentTime = audio.duration - .5;
    else if (d) audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + d)); else return;
    e.preventDefault();
  });

  ['play', 'pause', 'waiting', 'playing', 'canplay', 'loadedmetadata', 'durationchange'].forEach(function (ev) { audio.addEventListener(ev, paint); });
  audio.addEventListener('timeupdate', function () {
    all('.mp').forEach(function (mp) { if (isCur(mp)) time(mp, true); });
    if (dock && !dock.hidden) time(dock, true);
  });
  audio.addEventListener('ended', function () { if (cur.i < cur.list.length - 1) step(1); else { audio.currentTime = 0; paint(); } });
  audio.addEventListener('error', function () { if (!audio.getAttribute('src')) return; failed = true; paint(); });

  // Widgets appear (a card opens) and disappear (it closes): keep them and the dock in sync.
  if (window.MutationObserver) {
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var nodes = Array.prototype.slice.call(ms[i].addedNodes).concat(Array.prototype.slice.call(ms[i].removedNodes));
        for (var j = 0; j < nodes.length; j++) {
          var n = nodes[j];
          if (n.nodeType === 1 && n !== dock && (n.classList.contains('mp') || n.querySelector && n.querySelector('.mp'))) { paint(); return; }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  paint();
})();
