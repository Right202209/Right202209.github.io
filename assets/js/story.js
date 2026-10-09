/* 故事手书 · Storybook — "Droit 与丢失的那一页"
 * Builds the hand-drawn scenes into each [data-scene], turns the pages (click, drag a corner, swipe,
 * arrow keys, chapter tabs) and runs one small game per page. Words live in _data/story.yml.
 * What a reader makes (their name, their drawing, their paw prints) stays in their own localStorage.
 */
(function () {
  'use strict';
  var root = document.querySelector('[data-story]');
  if (!root) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = {};
  try { T = JSON.parse(root.querySelector('[data-story-i18n]').textContent); } catch (e) {}
  var t = function (k, n) { return String(T[k] || '').replace('{n}', n).replace('{name}', n); };
  var INK = '#1f1d1a', CREAM = '#faf6ee', RED = '#e0532f', CLAY = '#e8bf9a', PAPER = '#f2d9c0';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('sb-' + k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('sb-' + k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('sb-' + k); } catch (e) {} }
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || root).querySelectorAll(s)); };

  // ── Sound: tiny synthesized effects, off until the reader turns them on ──
  var Snd = (function () {
    var ctx = null, on = store.get('sound', '0') === '1', last = {};
    var ac = function () {
      if (!on) return null;
      if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    var gate = function (k, ms) { var n = Date.now(); if (last[k] && n - last[k] < ms) return false; last[k] = n; return true; };
    var noise = function (dur, f0, f1, vol, type) {
      var c = ac(); if (!c) return;
      var len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), n = c.currentTime;
      s.buffer = b; f.type = type || 'bandpass'; f.frequency.setValueAtTime(f0, n); f.frequency.exponentialRampToValueAtTime(f1, n + dur);
      g.gain.value = vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
    };
    var tone = function (fq, dur, vol, type, slide, delay) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (delay || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(fq, n); if (slide) o.frequency.exponentialRampToValueAtTime(slide, n + dur);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol, n + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.05);
    };
    var penta = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    return {
      get on() { return on; },
      set: function (v) { on = v; store.set('sound', v ? '1' : '0'); if (v) ac(); },
      flip: function () { if (gate('flip', 90)) noise(0.32, 2600, 500, 0.35); },
      pop: function () { tone(620, 0.14, 0.18, 'sine', 1240); },
      note: function (i) { if (gate('note', 40)) tone(penta[((i % 8) + 8) % 8], 0.35, 0.09, 'triangle'); },
      thunder: function () { noise(1.8, 500, 40, 1.2, 'lowpass'); },
      splash: function () { noise(0.22, 3000, 6000, 0.15, 'highpass'); },
      thump: function () { tone(150, 0.2, 0.45, 'sine', 55); },
      beep: function () { tone(1250, 0.13, 0.1, 'square'); },
      toot: function () { tone(196, 0.55, 0.16, 'sawtooth', 185); },
      bark: function () { tone(480, 0.08, 0.18, 'square', 300); tone(520, 0.09, 0.18, 'square', 320, 0.13); },
      chime: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.7, 0.1, 'triangle', 0, i * 0.11); }); },
      wrong: function () { tone(180, 0.18, 0.15, 'triangle', 140); },
      scratch: function () { if (gate('scr', 70)) noise(0.06, 2200, 1600, 0.04); }
    };
  })();

  // ── Drawing helpers ──
  var svgWrap = function (w, h, inner, cls) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet" class="' + (cls || '') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  };
  // A pointer event in a scene's own coordinates (the scene box always has the viewBox's shape).
  var toSvg = function (svg, e) {
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return { x: (e.clientX - r.left) / r.width * vb.width, y: (e.clientY - r.top) / r.height * vb.height };
  };
  var mk = function (svg, tag, attrs, parent) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(el);
    return el;
  };
  var anim = function (el, frames, opt) {
    if (!el.animate) return { finished: Promise.resolve(), onfinish: null };
    return el.animate(frames, opt);
  };
  // Droit: a white long-snouted dog, soft-black outline, one orange-red scarf.
  var dog = function (o) {
    var s = o.s || 1, sx = o.flip ? -s : s, lie = o.cls && o.cls.indexOf('lie') > -1;
    var leg = function (d) { return '<path class="leg" d="' + d + '" stroke="' + INK + '" stroke-width="4.6" stroke-linecap="round" fill="none"/>'; };
    return '<g class="dog ' + (o.cls || '') + '" transform="translate(' + o.x + ' ' + o.y + ') scale(' + sx + ' ' + s + ') translate(-60 ' + (lie ? -64 : -88) + ')"' + (o.id ? ' data-dog="' + o.id + '"' : '') + '>' +
      '<g class="body-all">' +
      '<path class="tail" d="M24 50 C 10 44, 8 30, 16 22" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
      (lie ? '' : leg('M33 60 L31 87') + leg('M43 62 L43 87') + leg('M65 62 L65 87') + leg('M74 58 L77 87')) +
      '<path d="M22 48 C 22 36, 40 32, 60 34 C 74 35, 80 40, 80 50 C 80 60, 70 64, 52 64 C 34 64, 22 60, 22 48 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.6"/>' +
      '<g class="head">' +
      '<path d="M73 42 C 78 30, 84 24, 92 24 C 100 24, 112 30, 118 34 C 119.5 36.5, 117 39, 114 39 C 106 39, 98 39, 92 43 C 86 47, 80 51, 77 53 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M88 26 C 83 30, 81 38, 85 43 C 89 39, 91 32, 88 26 Z" fill="' + INK + '"/>' +
      '<circle class="eye-open" cx="99" cy="30.5" r="2.1" fill="' + INK + '"/>' +
      '<path class="eye-shut" d="M96 31 Q 99 33.5 102 31" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="117.5" cy="35.5" r="2.3" fill="' + INK + '"/>' +
      '</g>' +
      '<path d="M73 41 C 77 48, 84 48, 88 43 L 86 52 L 79 58 Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</g></g>';
  };
  var lookAt = function (g, dx, dy) {   // nudge the eye and tilt the head toward a point
    if (!g) return;
    var eye = g.querySelector('.eye-open'), head = g.querySelector('.head');
    var flip = /scale\(-/.test(g.getAttribute('transform')) ? -1 : 1;
    var a = Math.atan2(dy, dx * flip), d = Math.min(1, Math.hypot(dx, dy) / 120);
    if (eye) { eye.setAttribute('cx', 99 + Math.cos(a) * 1.4 * d); eye.setAttribute('cy', 30.5 + Math.sin(a) * 1.4 * d); }
    if (head) head.setAttribute('transform', 'rotate(' + clamp(a * 180 / Math.PI * 0.18, -16, 12) + ' 80 46)');
  };
  var bubble = function (svg, x, y, text, ms) {
    var wide = /[\u3000-\u9fff]/.test(text) ? 15 : 8.4, w = text.length * wide + 22;
    var g = mk(svg, 'g', { 'class': 'pop', 'pointer-events': 'none' });
    g.innerHTML = '<path d="M' + (x - w / 2) + ' ' + (y - 40) + ' h' + w + ' a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h' + (-(w / 2) + 8) +
      ' l-8 9 l-2 -9 h' + (-(w / 2) + 2) + ' a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2"/>' +
      '<text class="sb-bubble" x="' + (x + 4) + '" y="' + (y - 21) + '" text-anchor="middle" fill="' + INK + '">' + text.replace(/</g, '&lt;') + '</text>';
    setTimeout(function () { anim(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = function () { g.remove(); }; }, ms || 1600);
    return g;
  };
  var paw = function (fill) {
    return '<g fill="' + fill + '"><ellipse cx="0" cy="6" rx="9" ry="7.5"/><ellipse cx="-10" cy="-5" rx="3.6" ry="4.6" transform="rotate(-20 -10 -5)"/>' +
      '<ellipse cx="-3.6" cy="-10" rx="3.6" ry="4.8"/><ellipse cx="3.6" cy="-10" rx="3.6" ry="4.8"/><ellipse cx="10" cy="-5" rx="3.6" ry="4.6" transform="rotate(20 10 -5)"/></g>';
  };
  // A rough blob from a few circles, the potato.horse way.
  var blob = function (pts, fill, stroke) {
    return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="2.4"' : '') + '/>'; }).join('');
  };
  var cloud = function (x, y, s, fill) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-34 10 C -46 10, -46 -6, -32 -6 C -30 -20, -10 -22, -4 -12 C 2 -24, 26 -22, 26 -6 C 40 -6, 42 10, 30 10 Z" fill="' + (fill || CREAM) + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/></g>';
  };
  var loop = function (fn) {
    var id = 0, last = 0, on = false;
    var step = function (now) { if (!on) return; var dt = last ? Math.min(50, now - last) : 16; last = now; fn(dt / 16.7, now); id = requestAnimationFrame(step); };
    return {
      start: function () { if (on) return; on = true; last = 0; id = requestAnimationFrame(step); },
      stop: function () { on = false; cancelAnimationFrame(id); },
      once: function () { fn(1, performance.now()); }   // draw a first frame so a page looks right before it is reached
    };
  };
  var complete = function (page) {
    if (page.classList.contains('done')) return;
    page.classList.add('done'); Snd.chime();
  };

  // ── Scenes: each returns { enter, leave } and keeps its own small state ──
  var S = {};

  // Cover: Droit on red cloth, watching the reader; sparkles near the pointer.
  S.cover = function (el, page) {
    el.innerHTML = svgWrap(400, 300,
      '<circle cx="200" cy="140" r="96" fill="' + CREAM + '" opacity=".14"/>' +
      '<g class="wob"><path d="M70 262 C 140 252, 260 254, 330 262" stroke="' + CREAM + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>' +
      dog({ x: 200, y: 262, s: 1.9, id: 'cover' }) + '</g><g data-spark></g><g data-patch></g>');
    var svg = el.querySelector('svg'), d = svg.querySelector('[data-dog]'), sp = svg.querySelector('[data-spark]'), lastSpark = 0;
    var patch = function () {
      var src = store.get('drawing', ''), g = svg.querySelector('[data-patch]');
      g.innerHTML = src ? '<g transform="translate(318 30) rotate(8)"><rect x="-4" y="-4" width="74" height="62" fill="' + CREAM + '"/><image href="' + src + '" width="66" height="54" preserveAspectRatio="xMidYMid slice"/>' +
        '<rect x="20" y="-10" width="26" height="10" fill="' + CLAY + '" opacity=".8" transform="rotate(-6 33 -5)"/></g>' : '';
    };
    patch(); root.addEventListener('sb:drawing', patch);
    var move = function (e) {
      var p = toSvg(svg, e);
      lookAt(d, p.x - 270, p.y - 205);
      var n = Date.now();
      if (n - lastSpark > 90 && !reduce) {
        lastSpark = n;
        var s = mk(svg, 'path', { d: 'M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z', fill: CREAM, transform: 'translate(' + (p.x + rnd(-14, 14)) + ' ' + (p.y + rnd(-14, 14)) + ')' }, sp);
        anim(s, [{ opacity: 1, scale: '1' }, { opacity: 0, scale: '0.2' }], { duration: 700 }).onfinish = function () { s.remove(); };
        setTimeout(function () { s.remove(); }, 800);
      }
    };
    el.addEventListener('pointermove', move);
    d.addEventListener('pointerenter', function () { d.classList.add('happy'); });
    d.addEventListener('pointerleave', function () { d.classList.remove('happy'); });
    return {};
  };

  // Endpaper: a field of paw prints that ripple when poked, and a line to sign your name.
  S.endpaper = function (el, page) {
    var h = '<rect width="400" height="555" fill="' + CLAY + '" opacity=".35"/>', k = 0;
    for (var r = 0; r < 12; r++) for (var c = 0; c < 7; c++) {
      var x = 30 + c * 57 + (r % 2 ? 28 : 0), y = 26 + r * 46;
      h += '<g class="hit pw" data-x="' + x + '" data-y="' + y + '" transform="translate(' + x + ' ' + y + ') rotate(' + (r % 2 ? 18 : -14) + ') scale(.8)" style="--d:' + k++ + '">' + paw('rgba(31,29,26,.16)') + '</g>';
    }
    el.innerHTML = svgWrap(400, 555, h);
    var svg = el.querySelector('svg'), paws = $$('.pw', svg);
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e), i = 0;
      paws.forEach(function (g) {
        var dx = g.dataset.x - p.x, dy = g.dataset.y - p.y, dist = Math.hypot(dx, dy);
        if (dist > 170) return;
        var near = dist < 30, b = g.firstChild;
        if (near) { b.setAttribute('fill', RED); Snd.note(Math.round(p.y / 60)); }
        anim(b, [{ transform: 'scale(1)' }, { transform: 'scale(' + (near ? 1.6 : 1.3) + ')' }, { transform: 'scale(1)' }],
          { duration: 500, delay: dist * 2.2, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        i++;
      });
    });
    var input = $('[data-name]', page), owner = $('[data-owner]');
    var sync = function () {
      var v = input.value.trim();
      store.set('name', v);
      if (owner) { owner.hidden = !v; owner.textContent = v ? '— ' + t('name_of', v) + ' —' : ''; }
      if (v) complete(page);
    };
    input.value = store.get('name', '');
    if (input.value) { page.classList.add('done'); sync(); }
    input.addEventListener('input', function () { Snd.scratch(); sync(); });
    input.addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') input.blur(); });
    return {};
  };

  // Chapter 1: pick the apple, it falls on Droit, Droit wakes up.
  S.tree = function (el, page) {
    var tufts = '';
    for (var i = 0; i < 16; i++) { var x = 14 + i * 25 + rnd(-6, 6), y = 268 + Math.sin(i * 0.9) * 6 + (i > 9 ? -4 : 0);
      tufts += '<path class="tuft" data-x="' + x + '" d="M' + x + ' ' + y + ' l-4 -10 M' + x + ' ' + y + ' l0 -13 M' + x + ' ' + y + ' l5 -10" stroke="' + INK + '" stroke-width="2" stroke-linecap="round" fill="none"/>'; }
    el.innerHTML = svgWrap(400, 330,
      '<g class="hit" data-sun><g data-rays>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
        return '<line x1="335" y1="28" x2="335" y2="18" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" transform="rotate(' + a + ' 335 62)"/>'; }).join('') +
      '</g><circle cx="335" cy="62" r="22" fill="#f0a35e" stroke="' + INK + '" stroke-width="2.4"/><path data-face d="M327 64 q8 6 16 0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round" opacity="0"/></g>' +
      '<g class="wob">' +
      '<path d="M-20 276 C 110 238, 270 236, 400 266 L420 360 L-20 360 Z" fill="' + CLAY + '" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<path d="M146 268 C 150 226, 142 196, 154 150 L 168 150 C 164 196, 174 228, 180 268 Z" fill="' + INK + '"/>' +
      '<g class="hit" data-canopy>' + blob([[124, 128, 40], [168, 100, 48], [214, 124, 42], [162, 148, 40], [196, 150, 30]], INK) + '</g>' +
      tufts + dog({ x: 189, y: 270, s: 0.9, cls: 'sleep lie', id: 'tree' }) +
      '</g>' +
      '<g data-zzz class="hit"><text x="238" y="214" font-size="15" fill="' + INK + '" font-style="italic">z</text><text x="250" y="200" font-size="19" fill="' + INK + '" font-style="italic">z</text><text x="264" y="182" font-size="24" fill="' + INK + '" font-style="italic">Z</text></g>' +
      '<g data-leaves></g>' +
      '<g class="hit" data-apple><g data-apple-in><path d="M225 139 q2 -8 7 -10" stroke="' + INK + '" stroke-width="2.2" fill="none"/><path d="M229 133 q8 -6 12 0 q-6 4 -12 0z" fill="#7b8f4c" stroke="' + INK + '" stroke-width="1.4"/>' +
      '<circle cx="225" cy="150" r="10" fill="' + RED + '" stroke="' + INK + '" stroke-width="2.2"/><circle cx="221" cy="146" r="2.4" fill="' + CREAM + '" opacity=".7"/></g></g>');
    var svg = el.querySelector('svg'), d = svg.querySelector('[data-dog]'), apple = svg.querySelector('[data-apple]'), appleIn = svg.querySelector('[data-apple-in]');
    var zzz = svg.querySelector('[data-zzz]'), canopy = svg.querySelector('[data-canopy]'), leaves = svg.querySelector('[data-leaves]');
    var fallen = false, asleep = true, zs = $$('text', zzz);
    zs.forEach(function (z, i) { anim(z, [{ transform: 'translateY(0)', opacity: 0.2 }, { transform: 'translateY(-8px)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0.2 }], { duration: 2400, delay: i * 400, iterations: Infinity }); });
    var wake = function () {
      asleep = false; d.classList.remove('sleep'); d.classList.add('hop', 'happy'); zzz.style.display = 'none';
      bubble(svg, 230, 214, t('woke')); Snd.bark(); setTimeout(function () { d.classList.remove('hop'); }, 700); complete(page);
    };
    apple.addEventListener('click', function (e) {
      e.stopPropagation();
      if (fallen) { anim(appleIn, [{ transform: 'translate(52px,103px) rotate(0)' }, { transform: 'translate(64px,103px) rotate(90deg)' }, { transform: 'translate(52px,103px) rotate(0)' }], { duration: 600, composite: 'replace' }); Snd.pop(); return; }
      fallen = true; Snd.pop();
      var a = anim(appleIn, [
        { transform: 'translate(0,0)', easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translate(0,72px)', offset: 0.42, easing: 'cubic-bezier(0,.4,.6,1)' },
        { transform: 'translate(26px,38px)', offset: 0.62, easing: 'cubic-bezier(.5,0,1,.6)' },
        { transform: 'translate(52px,103px)', offset: 0.86 },
        { transform: 'translate(52px,96px)', offset: 0.93 },
        { transform: 'translate(52px,103px)' }], { duration: 1100, fill: 'forwards' });
      setTimeout(function () { Snd.thump(); if (asleep) wake(); }, 460);
    });
    var regrow = function () {
      fallen = false;
      appleIn.getAnimations && appleIn.getAnimations().forEach(function (x) { x.cancel(); });
      anim(appleIn, [{ transform: 'scale(0)', transformOrigin: '225px 150px' }, { transform: 'scale(1.2)', transformOrigin: '225px 150px' }, { transform: 'scale(1)', transformOrigin: '225px 150px' }], { duration: 600, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      setTimeout(function () { if (!fallen) { asleep = true; d.classList.add('sleep'); d.classList.remove('happy'); zzz.style.display = ''; } }, 2600);
    };
    canopy.addEventListener('click', function (e) {
      var p = toSvg(svg, e);
      anim(canopy, [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }],
        { duration: 450, transformOrigin: '160px 160px' });
      canopy.style.transformOrigin = '160px 160px';
      Snd.scratch();
      for (var i = 0; i < 3; i++) (function (i) {
        var lf = mk(svg, 'path', { d: 'M0 0 q6 -6 12 0 q-6 6 -12 0z', fill: i ? INK : '#7b8f4c', transform: 'translate(' + (p.x + rnd(-20, 20)) + ' ' + (p.y + 10) + ')' }, leaves);
        var dx = rnd(-40, 40);
        anim(lf, [{ translate: '0 0', rotate: '0deg', opacity: 1 }, { translate: (dx / 2) + 'px 60px', rotate: '160deg', opacity: 1 }, { translate: dx + 'px ' + (262 - p.y) + 'px', rotate: '320deg', opacity: 0 }],
          { duration: 1800 + i * 300, easing: 'ease-in' }).onfinish = function () { lf.remove(); };
        setTimeout(function () { lf.remove(); }, 2400);
      })(i);
      if (fallen) regrow();
    });
    zzz.addEventListener('click', function (e) {
      e.stopPropagation(); bubble(svg, 250, 190, t('zzz')); Snd.pop();
      zs.forEach(function (z, i) { anim(z, [{ scale: '1' }, { scale: '1.8', opacity: 0 }, { scale: '1' }], { duration: 600, delay: i * 80, composite: 'add' }); });
    });
    d.addEventListener('click', function () { if (asleep) { bubble(svg, 230, 214, t('zzz')); d.classList.add('shiver'); setTimeout(function () { d.classList.remove('shiver'); }, 700); } else { Snd.bark(); d.classList.add('hop'); setTimeout(function () { d.classList.remove('hop'); }, 650); } });
    d.classList.add('hit');
    var sun = svg.querySelector('[data-sun]'), rays = svg.querySelector('[data-rays]'), face = svg.querySelector('[data-face]');
    sun.addEventListener('click', function () {
      Snd.note(5); anim(rays, [{ transform: 'rotate(0)' }, { transform: 'rotate(180deg)' }], { duration: 900, easing: 'cubic-bezier(.3,1.4,.5,1)' }); rays.style.transformOrigin = '335px 62px';
      face.setAttribute('opacity', '1'); setTimeout(function () { face.setAttribute('opacity', '0'); }, 1600);
    });
    var tuftEls = $$('.tuft', svg), lastT = 0;
    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(svg, e), n = Date.now();
      if (!asleep) lookAt(d, p.x - 225, p.y - 233);
      if (n - lastT < 60) return; lastT = n;
      tuftEls.forEach(function (tf) {
        var dx = tf.dataset.x - p.x;
        if (Math.abs(dx) < 34 && p.y > 220) {
          tf.style.transformOrigin = tf.dataset.x + 'px 270px';
          anim(tf, [{ transform: 'rotate(0)' }, { transform: 'rotate(' + (dx > 0 ? 18 : -18) + 'deg)' }, { transform: 'rotate(0)' }], { duration: 600, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        }
      });
    });
    return {};
  };

  // Chapter 2: the page flees the pointer; Droit runs after it; tap the grass to plant flowers.
  S.wind = function (el, page) {
    var blades = '';
    for (var i = 0; i < 34; i++) { var x = 6 + i * 11.8 + rnd(-3, 3); blades += '<line class="bl" x1="' + x + '" y1="312" x2="' + x + '" y2="' + rnd(294, 300) + '" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/>'; }
    el.innerHTML = svgWrap(400, 330,
      '<g data-clouds>' + cloud(70, 56, 1) + cloud(230, 36, 0.8) + cloud(350, 74, 1.1) + '</g>' +
      '<g class="wob"><path d="M-20 256 C 80 214, 170 222, 240 246 C 300 226, 360 222, 400 236 L420 360 L-20 360 Z" fill="#e2b58e" stroke="' + INK + '" stroke-width="2.2"/>' +
      '<path d="M-20 294 C 120 270, 280 272, 400 286 L420 360 L-20 360 Z" fill="' + CLAY + '" stroke="' + INK + '" stroke-width="2.4"/></g>' +
      '<g data-blades>' + blades + '</g><g data-flowers></g>' +
      dog({ x: 120, y: 304, s: 0.62, id: 'wind' }) +
      '<g data-paper class="hit"><g data-paper-in><rect x="-13" y="-17" width="26" height="34" rx="1.5" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2"/>' +
      '<path d="M-8 -9 h16 M-8 -3 h16 M-8 3 h12 M-8 9 h14" stroke="' + INK + '" stroke-width="1.3" opacity=".55"/><path d="M5 -17 l8 8 h-8z" fill="' + CLAY + '" stroke="' + INK + '" stroke-width="1.4"/></g></g>');
    var svg = el.querySelector('svg'), d = svg.querySelector('[data-dog]'), paper = svg.querySelector('[data-paper]'), pin = svg.querySelector('[data-paper-in]');
    var clouds = $$('[data-clouds] > g', svg), cx = [70, 230, 350], cy = [56, 36, 74], cs = [1, 0.8, 1.1];
    var bl = $$('.bl', svg), flowers = svg.querySelector('[data-flowers]');
    var P = { x: 260, y: 140, vx: 0, vy: 0, r: 0 }, ptr = { x: -999, y: -999, t: 0 }, wind = 0, dx = 120, near = 0, cool = 0, tm = 0;
    var L = loop(function (k, now) {
      tm += k * 0.016;
      wind *= 0.96;
      // wander + flee
      var tx = 200 + Math.sin(tm * 0.7) * 120, ty = 130 + Math.sin(tm * 1.3) * 50;
      P.vx += (tx - P.x) * 0.0016 * k; P.vy += (ty - P.y) * 0.0016 * k;
      var ddx = P.x - ptr.x, ddy = P.y - ptr.y, dist = Math.hypot(ddx, ddy);
      if (dist < 90 && now - ptr.t < 1500) {
        var f = (90 - dist) / 90 * 0.9;
        P.vx += ddx / (dist || 1) * f * k; P.vy += ddy / (dist || 1) * f * k;
        if (dist < 34 && now > cool) {
          cool = now + 700; near++;
          anim(pin, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(360deg) scale(.8)' }, { transform: 'rotate(360deg) scale(1)' }], { duration: 500 });
          Snd.note(near + 2);
          if (near === 3) { bubble(svg, clamp(dx, 60, 340), 262, t('north'), 2200); complete(page); }
        }
      }
      P.vx += wind * 0.05 * k;
      P.vx *= Math.pow(0.94, k); P.vy *= Math.pow(0.94, k);
      P.x += P.vx * k; P.y += P.vy * k;
      if (P.x < 24) { P.x = 24; P.vx = Math.abs(P.vx); } if (P.x > 376) { P.x = 376; P.vx = -Math.abs(P.vx); }
      if (P.y < 26) { P.y = 26; P.vy = Math.abs(P.vy); } if (P.y > 236) { P.y = 236; P.vy = -Math.abs(P.vy); }
      P.r = P.r * 0.9 + (P.vx * 6 + Math.sin(tm * 3) * 8) * 0.1;
      paper.setAttribute('transform', 'translate(' + P.x.toFixed(1) + ' ' + P.y.toFixed(1) + ') rotate(' + P.r.toFixed(1) + ')');
      // dog follows
      var want = P.x, step = clamp(want - dx, -1.8 * k, 1.8 * k);
      dx += step;
      var running = Math.abs(want - dx) > 6;
      d.classList.toggle('run', running);
      d.setAttribute('transform', 'translate(' + dx.toFixed(1) + ' 304) scale(' + (want < dx - 2 ? -0.62 : 0.62) + ' 0.62) translate(-60 -88)');
      // clouds and grass
      for (var i = 0; i < 3; i++) {
        cx[i] += (0.12 + wind * 0.04) * k * (1 + i * 0.3);
        if (cx[i] > 450) cx[i] = -50; if (cx[i] < -50) cx[i] = 450;
        clouds[i].setAttribute('transform', 'translate(' + (cx[i] - [70, 230, 350][i]).toFixed(1) + ' 0)');
      }
      var sway = Math.sin(tm * 2) * 6 + wind * 3;
      for (var j = 0; j < bl.length; j++) {
        var b = bl[j], x = +b.getAttribute('x1');
        b.setAttribute('transform', 'rotate(' + (sway + Math.sin(tm * 3 + j) * 4).toFixed(1) + ' ' + x + ' 312)');
      }
    });
    var lastP = null;
    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(svg, e), n = performance.now();
      if (lastP) wind = clamp(wind + (p.x - lastP.x) * 0.06, -12, 12);
      lastP = p; ptr.x = p.x; ptr.y = p.y; ptr.t = n;
    });
    svg.addEventListener('pointerleave', function () { ptr.t = 0; lastP = null; });
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e);
      if (p.y < 262) return;
      var fl = mk(svg, 'g', { transform: 'translate(' + p.x + ' ' + Math.min(p.y, 318) + ')' }, flowers);
      var pc = Math.random() < 0.7 ? RED : CREAM, hh = rnd(16, 26);
      fl.innerHTML = '<g class="pop"><path d="M0 0 C 2 -' + (hh / 2) + ', -2 -' + (hh * 0.7) + ', 0 -' + hh + '" stroke="' + INK + '" stroke-width="1.8" fill="none"/>' +
        [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-5" rx="3.4" ry="5" fill="' + pc + '" stroke="' + INK + '" stroke-width="1.2" transform="translate(0 -' + hh + ') rotate(' + a + ')"/>'; }).join('') +
        '<circle cx="0" cy="-' + hh + '" r="2.6" fill="' + INK + '"/></g>';
      if (flowers.children.length > 16) flowers.firstChild.remove();
      Snd.pop();
    });
    L.once();
    return { enter: L.start, leave: L.stop };
  };

  // Chapter 3: the umbrella follows the pointer; rain splashes; tap the cloud for thunder.
  S.rain = function (el, page) {
    el.innerHTML = svgWrap(400, 330,
      '<rect data-flash width="400" height="330" fill="' + CREAM + '" opacity="0"/>' +
      '<path data-bolt d="" stroke="' + CREAM + '" stroke-width="4" fill="none" stroke-linejoin="round" opacity="0" filter="url(#sb-glow)"/>' +
      '<g class="wob"><path d="M-20 302 C 100 296, 300 296, 400 302 L420 360 L-20 360 Z" fill="#b99377" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<ellipse cx="80" cy="312" rx="34" ry="5" fill="#8a6a55" opacity=".7"/><ellipse cx="318" cy="314" rx="40" ry="5" fill="#8a6a55" opacity=".7"/></g>' +
      '<g data-ripples></g>' +
      '<g data-ub><path d="M0 -84 L0 -16 q0 8 -7 8" stroke="' + INK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M-54 -84 A54 50 0 0 1 54 -84 q-9 -7 -18 0 q-9 -7 -18 0 q-9 -7 -18 0 q-9 -7 -18 0 q-9 -7 -18 0 q-9 -7 -18 0 Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<line x1="0" y1="-134" x2="0" y2="-142" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>' +
      dog({ x: -6, y: 0, s: 0.7, id: 'rain' }) + '</g>' +
      '<g class="hit" data-cloud><g class="wob">' + blob([[90, 40, 34], [140, 26, 40], [200, 34, 44], [260, 24, 40], [312, 40, 34], [200, 54, 40]], '#7c7066', INK) +
      blob([[90, 40, 32], [140, 26, 38], [200, 34, 42], [260, 24, 38], [312, 40, 32], [200, 54, 38]], '#7c7066') + '</g></g>');
    var cvs = document.createElement('canvas'); el.appendChild(cvs); cvs.style.pointerEvents = 'none';
    var svg = el.querySelector('svg'), ub = svg.querySelector('[data-ub]'), d = svg.querySelector('[data-dog]'), ctx = cvs.getContext('2d');
    var flash = svg.querySelector('[data-flash]'), bolt = svg.querySelector('[data-bolt]'), rip = svg.querySelector('[data-ripples]'), cl = svg.querySelector('[data-cloud]');
    var ux = 200, want = 200, drops = [], splashes = [], slant = 0, W = 0, H = 0, sc = 1, thunders = 0;
    for (var i = 0; i < 110; i++) drops.push({ x: rnd(0, 400), y: rnd(-330, 300), v: rnd(5, 8), l: rnd(8, 14) });
    var size = function () {
      var r = el.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      if (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1) return;
      W = r.width; H = r.height; cvs.width = W * dpr; cvs.height = H * dpr; sc = W / 400 * dpr;
    };
    var L = loop(function (k) {
      size();
      var dxu = (want - ux) * 0.08 * k; ux += dxu;
      d.classList.toggle('run', Math.abs(want - ux) > 4);
      ub.setAttribute('transform', 'translate(' + ux.toFixed(1) + ' 304) rotate(' + clamp(dxu * 3, -12, 12).toFixed(1) + ' 0 -20)');
      d.setAttribute('transform', 'translate(-6 0) scale(' + (want < ux - 1 ? -0.7 : 0.7) + ' 0.7) translate(-60 -88)');
      slant *= 0.97;
      ctx.setTransform(sc, 0, 0, sc, 0, 0); ctx.clearRect(0, 0, 400, 330);
      ctx.strokeStyle = 'rgba(31,29,26,.42)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
      var top = 220, cy = 220, R = 54;
      for (var i = 0; i < drops.length; i++) {
        var p = drops[i];
        p.y += p.v * k; p.x += slant * k;
        var hit = false, ddx = p.x - ux;
        if (Math.abs(ddx) < R && p.y > 60) {
          var surf = cy - Math.sqrt(R * R - ddx * ddx) * (50 / 54);
          if (p.y > surf && p.y < surf + 12) { hit = true; splashes.push({ x: p.x, y: surf, life: 1, dir: ddx > 0 ? 1 : -1 }); }
        }
        if (p.y > 304) { hit = true; if (Math.random() < 0.35) splashes.push({ x: p.x, y: 304, life: 1, dir: 0 }); }
        if (hit || p.x < -10 || p.x > 410) { p.y = rnd(-40, 40); p.x = rnd(-20, 420); continue; }
        if (p.y > 40) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - slant * 1.5, p.y - p.l); }
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(31,29,26,.5)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (var j = splashes.length - 1; j >= 0; j--) {
        var s = splashes[j]; s.life -= 0.06 * k;
        if (s.life <= 0) { splashes.splice(j, 1); continue; }
        var r = (1 - s.life) * 7;
        ctx.moveTo(s.x - r + s.dir * 4, s.y - r * 0.6); ctx.lineTo(s.x - r * 1.4 + s.dir * 6, s.y - r * 1.4);
        ctx.moveTo(s.x + r + s.dir * 4, s.y - r * 0.6); ctx.lineTo(s.x + r * 1.4 + s.dir * 6, s.y - r * 1.4);
      }
      ctx.stroke();
      if (splashes.length > 200) splashes.splice(0, splashes.length - 200);
    });
    var lastX = null;
    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(svg, e); want = clamp(p.x, 60, 340);
      if (lastX !== null) slant = clamp(slant + (p.x - lastX) * 0.02, -3, 3); lastX = p.x;
    });
    cl.addEventListener('click', function (e) {
      e.stopPropagation();
      var p = toSvg(svg, e), x = p.x, y = 70, path = 'M' + x + ' ' + y;
      while (y < 296) { x += rnd(-22, 22); y += rnd(22, 40); path += ' L' + x.toFixed(0) + ' ' + Math.min(y, 300).toFixed(0); }
      bolt.setAttribute('d', path);
      anim(bolt, [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 500 });
      anim(flash, [{ opacity: 0.85 }, { opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }], { duration: 600 });
      anim(cl, [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(2px)' }, { transform: 'translateY(0)' }], { duration: 400 });
      Snd.thunder(); d.classList.add('shiver'); setTimeout(function () { d.classList.remove('shiver'); }, 700);
      slant = rnd(-3, 3);
      if (++thunders === 1) setTimeout(function () { complete(page); }, 500);
    });
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e); if (p.y < 280) return;
      for (var i = 0; i < 3; i++) {
        var c = mk(svg, 'ellipse', { cx: p.x, cy: 312, rx: 4, ry: 1.2, fill: 'none', stroke: INK, 'stroke-width': 1.6 }, rip);
        (function (c, i) { anim(c, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(9)', opacity: 0 }], { duration: 900, delay: i * 140, easing: 'ease-out' }).onfinish = function () { c.remove(); };
          c.style.transformOrigin = p.x + 'px 312px'; c.style.transformBox = 'view-box'; setTimeout(function () { c.remove(); }, 1400); })(c, i);
      }
      for (var j = 0; j < 8; j++) splashes.push({ x: p.x + rnd(-8, 8), y: 306, life: 1, dir: rnd(-1, 1) });
      Snd.splash();
    });
    d.addEventListener('click', function (e) { e.stopPropagation(); Snd.bark(); d.classList.add('happy'); setTimeout(function () { d.classList.remove('happy'); }, 1200); });
    d.classList.add('hit');
    L.once();
    return { enter: L.start, leave: L.stop };
  };

  // Chapter 4: an ink sea; the pointer's height sets the waves; tap water for fish; words float up.
  S.sea = function (el, page) {
    el.innerHTML = svgWrap(400, 330,
      '<g class="hit" data-moon><circle cx="320" cy="62" r="26" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.4"/><circle data-shadow cx="320" cy="62" r="26" fill="' + PAPER + '"/></g>' +
      cloud(90, 70, 0.8) +
      '<path data-w0 fill="#6a5f55" stroke="' + INK + '" stroke-width="2"/>' +
      '<g data-boat class="hit"><g data-boat-in>' + dog({ x: 0, y: -12, s: 0.5, id: 'sea' }) +
      '<path d="M-46 -14 L46 -14 L30 10 L-30 10 Z" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M-14 -14 L6 -58 L22 -14" fill="' + CREAM + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/><path d="M-30 10 L-12 -14" stroke="' + INK + '" stroke-width="1.2" opacity=".5"/></g></g>' +
      '<path data-w1 fill="#3d3631" stroke="' + INK + '" stroke-width="2"/><g data-fx></g><path data-w2 fill="' + INK + '"/><g data-words></g>');
    var svg = el.querySelector('svg'), ws = [svg.querySelector('[data-w0]'), svg.querySelector('[data-w1]'), svg.querySelector('[data-w2]')];
    var boat = svg.querySelector('[data-boat]'), bin = svg.querySelector('[data-boat-in]'), fx = svg.querySelector('[data-fx]'), words = svg.querySelector('[data-words]');
    var base = [218, 246, 280], amp = 7, wantAmp = 7, tm = 0, bx = 200, wantBx = 200, fish = 0, lastWord = 0, phase = 0;
    var text = ($('.sb-line', page) || {}).textContent || '墨水';
    var chars = text.replace(/[\s，。、,.]/g, '').split('');
    var wy = function (i, x) { return base[i] + amp * (1 - i * 0.18) * Math.sin(x * (0.022 + i * 0.006) + tm * (1.2 + i * 0.35) + i * 1.7) + amp * 0.35 * Math.sin(x * 0.051 + tm * 2.1 + i); };
    var L = loop(function (k, now) {
      tm += 0.016 * k; amp += (wantAmp - amp) * 0.04 * k; bx += (wantBx - bx) * 0.01 * k;
      for (var i = 0; i < 3; i++) {
        var dd = 'M0 330 L0 ' + wy(i, 0).toFixed(1);
        for (var x = 10; x <= 400; x += 10) dd += ' L' + x + ' ' + wy(i, x).toFixed(1);
        ws[i].setAttribute('d', dd + ' L400 330 Z');
      }
      var y = wy(1, bx), slope = (wy(1, bx + 6) - wy(1, bx - 6)) / 12;
      boat.setAttribute('transform', 'translate(' + bx.toFixed(1) + ' ' + (y - 4).toFixed(1) + ') rotate(' + (Math.atan(slope) * 57.3).toFixed(1) + ')');
      if (now - lastWord > 2600 - amp * 110) {
        lastWord = now;
        var x0 = rnd(20, 380), w = mk(svg, 'text', { x: x0, y: wy(2, x0) + 14, 'font-size': rnd(13, 19).toFixed(0), fill: CREAM, 'text-anchor': 'middle', 'font-family': 'Newsreader, Songti SC, serif' }, words);
        w.textContent = chars[Math.floor(Math.random() * chars.length)] || '·';
        anim(w, [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(-26px)', opacity: 0.95, offset: 0.4 }, { transform: 'translateY(-52px)', opacity: 0 }], { duration: 2600, easing: 'ease-out' }).onfinish = function () { w.remove(); };
        setTimeout(function () { w.remove(); }, 2800);
      }
    });
    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(svg, e);
      wantAmp = clamp(24 - p.y / 330 * 22, 3, 22); wantBx = clamp(p.x, 70, 330);
    });
    svg.addEventListener('pointerleave', function () { wantAmp = 7; });
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e);
      if (p.y < wy(1, p.x) - 4) return;
      var f = mk(svg, 'g', {}, fx), dir = Math.random() < 0.5 ? -1 : 1, x0 = p.x, y0 = wy(1, p.x) + 6, span = rnd(40, 70) * dir, hgt = rnd(50, 90) + amp * 2;
      f.innerHTML = '<g><path d="M-12 0 C -6 -8, 8 -8, 12 0 C 8 8, -6 8, -12 0 Z M-12 0 L-20 -7 L-19 7 Z" fill="' + RED + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/><circle cx="6" cy="-1.5" r="1.4" fill="' + INK + '"/></g>';
      var g = f.firstChild, start = performance.now(), dur = 900;
      Snd.splash();
      var tick = function (n) {
        var q = Math.min(1, (n - start) / dur), x = x0 + span * q, y = y0 - hgt * 4 * q * (1 - q), ang = Math.atan2(-hgt * 4 * (1 - 2 * q), span) * 57.3;
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(0) + ') scale(' + (dir < 0 ? '1 -1' : '1 1') + ')');
        if (q < 1) requestAnimationFrame(tick); else { f.remove(); Snd.splash(); }
      };
      requestAnimationFrame(tick);
      if (++fish === 3) complete(page);
    });
    boat.addEventListener('click', function (e) {
      e.stopPropagation(); Snd.toot();
      anim(bin, [{ transform: 'translateY(0)' }, { transform: 'translateY(-18px) rotate(-6deg)' }, { transform: 'translateY(0)' }], { duration: 600, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      var b = boat.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)/);
      if (b) bubble(svg, +b[1] + 10, +b[2] - 56, t('toot'));
    });
    var phases = [0, 14, 30, 60], ph = 0, sh = svg.querySelector('[data-shadow]'), moon = svg.querySelector('[data-moon]');
    sh.setAttribute('cx', 320 + 60);
    moon.addEventListener('click', function (e) { e.stopPropagation(); ph = (ph + 1) % 4; sh.setAttribute('cx', 320 + [60, 16, 30, -14][ph]); Snd.note(6 + ph); });
    L.once();
    return { enter: L.start, leave: L.stop };
  };

  // Chapter 5: join the stars in order; they draw the missing page with its folded corner.
  S.stars = function (el, page) {
    var P = [[140, 62], [234, 62], [270, 98], [270, 206], [140, 206], [234, 98]], seq = [0, 1, 5, 2, 3, 4, 0];
    var bg = '';
    for (var i = 0; i < 60; i++) bg += '<circle class="bs" cx="' + rnd(4, 396).toFixed(0) + '" cy="' + rnd(4, 250).toFixed(0) + '" r="' + rnd(0.6, 1.6).toFixed(1) + '" fill="' + CREAM + '" opacity="' + rnd(0.3, 0.8).toFixed(2) + '"/>';
    var star = function (p, i) { return '<g class="hit st" data-i="' + i + '" transform="translate(' + p[0] + ' ' + p[1] + ')"><circle r="14" fill="transparent"/><path d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4 Z" fill="' + CREAM + '"/></g>'; };
    el.innerHTML = svgWrap(400, 330,
      '<defs><linearGradient id="sb-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1a22"/><stop offset="1" stop-color="#3a2f2c"/></linearGradient></defs>' +
      '<rect width="400" height="330" fill="url(#sb-night)"/>' + bg +
      '<g class="hit" data-moon2><circle cx="350" cy="44" r="18" fill="' + CREAM + '"/><circle cx="358" cy="38" r="16" fill="#1d1b23"/></g>' +
      '<polygon data-fill points="140,62 234,62 270,98 270,206 140,206" fill="' + CREAM + '" opacity="0" filter="url(#sb-glow)"/>' +
      '<g data-lines filter="url(#sb-glow)"></g><path data-shoot d="M0 0 l-40 14" stroke="' + CREAM + '" stroke-width="2" stroke-linecap="round" opacity="0"/>' +
      P.map(star).join('') + '<g data-sparks></g>' +
      '<g class="wob"><path d="M-20 306 C 90 268, 200 274, 260 296 C 320 286, 370 284, 400 290 L420 360 L-20 360 Z" fill="' + INK + '" stroke="#5c4f48" stroke-width="2"/></g>' +
      dog({ x: 86, y: 296, s: 0.66, id: 'stars' }));
    var svg = el.querySelector('svg'), d = svg.querySelector('[data-dog]'), lines = svg.querySelector('[data-lines]'), stars = $$('.st', svg), sparks = svg.querySelector('[data-sparks]');
    var fill = svg.querySelector('[data-fill]'), shoot = svg.querySelector('[data-shoot]'), step = 0, won = false, pulse = [];
    var bgs = $$('.bs', svg);
    var mark = function () {
      pulse.forEach(function (a) { a.cancel(); }); pulse = [];
      if (won) return;
      var nx = stars[seq[step]].lastChild;
      pulse.push(anim(nx, [{ transform: 'scale(1)' }, { transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: 1100, iterations: Infinity }));
    };
    var reset = function () { lines.innerHTML = ''; step = 0; won = false; fill.setAttribute('opacity', '0'); d.classList.remove('happy'); mark(); };
    stars.forEach(function (s) {
      s.addEventListener('click', function (e) {
        e.stopPropagation();
        if (won) return;
        var i = +s.dataset.i;
        if (i !== seq[step]) {
          Snd.wrong();
          anim(s.lastChild, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 300 });
          return;
        }
        if (step > 0) {
          var a = P[seq[step - 1]], b = P[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          var ln = mk(svg, 'line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: CREAM, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': len, 'stroke-dashoffset': len }, lines);
          anim(ln, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 420, fill: 'forwards', easing: 'ease-out' });
        }
        Snd.note(step + 1);
        anim(s.lastChild, [{ transform: 'scale(1)' }, { transform: 'scale(2.1) rotate(45deg)' }, { transform: 'scale(1)' }], { duration: 500 });
        step++;
        if (step === seq.length) {
          won = true;
          setTimeout(function () {
            anim(fill, [{ opacity: 0 }, { opacity: 0.22 }], { duration: 900, fill: 'forwards' }); fill.setAttribute('opacity', '0.22');
            shoot.setAttribute('transform', 'translate(390 20)');
            anim(shoot, [{ transform: 'translate(390px,20px)', opacity: 0 }, { transform: 'translate(260px,66px)', opacity: 1, offset: 0.3 }, { transform: 'translate(30px,150px)', opacity: 0 }], { duration: 1200, easing: 'ease-in' });
            d.classList.add('happy', 'hop'); setTimeout(function () { d.classList.remove('hop'); }, 700);
            complete(page);
          }, 450);
        }
        mark();
      });
    });
    svg.querySelector('[data-moon2]').addEventListener('click', function (e) { e.stopPropagation(); Snd.note(0); reset(); });
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e); if (p.y > 260) return;
      var s = mk(svg, 'path', { d: 'M0 -5 L1.4 -1.4 L5 0 L1.4 1.4 L0 5 L-1.4 1.4 L-5 0 L-1.4 -1.4 Z', fill: CREAM, transform: 'translate(' + p.x + ' ' + p.y + ')' }, sparks);
      anim(s, [{ opacity: 1, transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(.2)' }, { opacity: 1, transform: 'translate(' + p.x + 'px,' + p.y + 'px) scale(1.4)' }, { opacity: 0, transform: 'translate(' + p.x + 'px,' + (p.y + 10) + 'px) scale(.4)' }], { duration: 1000 }).onfinish = function () { s.remove(); };
      setTimeout(function () { s.remove(); }, 1100);
      Snd.note(Math.floor(p.x / 50));
    });
    var lastM = 0;
    svg.addEventListener('pointermove', function (e) {
      var p = toSvg(svg, e), n = Date.now();
      lookAt(d, p.x - 120, p.y - 260);
      if (n - lastM < 50) return; lastM = n;
      bgs.forEach(function (b) {
        var dist = Math.hypot(b.getAttribute('cx') - p.x, b.getAttribute('cy') - p.y);
        b.style.opacity = dist < 60 ? 1 : '';
        b.setAttribute('transform', dist < 60 ? 'translate(' + b.getAttribute('cx') + ' ' + b.getAttribute('cy') + ') scale(2) translate(' + (-b.getAttribute('cx')) + ' ' + (-b.getAttribute('cy')) + ')' : '');
      });
    });
    mark();
    return {};
  };

  // Chapter 6: the reader draws the missing page and binds it into the book.
  S.draw = function (el, page) {
    var cvs = document.createElement('canvas'); el.appendChild(cvs);
    var tools = document.createElement('div'); tools.className = 'sb-tools';
    tools.innerHTML = '<button type="button" class="sb-tool on" data-c="ink">' + t('ink') + '</button><button type="button" class="sb-tool" data-c="red">' + t('red') + '</button>' +
      '<button type="button" class="sb-tool" data-c="erase">' + t('erase') + '</button><button type="button" class="sb-tool" data-c="clear">' + t('clear') + '</button>' +
      '<button type="button" class="sb-tool bind" data-c="bind">' + t('bind') + '</button>';
    el.appendChild(tools);
    var seal = document.createElement('div'); seal.className = 'sb-seal'; seal.textContent = t('bound'); el.appendChild(seal);
    var pup = document.createElement('div');
    pup.style.cssText = 'position:absolute;right:0;bottom:0;width:34%;aspect-ratio:1.4;pointer-events:none;z-index:2';
    pup.innerHTML = svgWrap(140, 100, dog({ x: 70, y: 96, s: 0.62, id: 'draw' }));
    el.appendChild(pup);
    var psvg = pup.querySelector('svg'), d = psvg.querySelector('[data-dog]');
    d.style.pointerEvents = 'auto'; d.classList.add('hit');
    var ctx = cvs.getContext('2d'), W = 0, H = 0, dpr = 1, color = INK, mode = 'ink', drawing = false, last = null, lw = 3, inked = false;
    var size = function () {
      var r = el.getBoundingClientRect();
      if (!r.width || (Math.abs(r.width - W) < 1 && Math.abs(r.height - H) < 1)) return;
      var keep = inked ? cvs.toDataURL() : store.get('drawing', '');
      dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
      cvs.width = W * dpr; cvs.height = H * dpr;
      if (keep) { var im = new Image(); im.onload = function () { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(im, 0, 0, cvs.width, cvs.height); inked = true; }; im.src = keep; }
    };
    var pos = function (e) { var r = cvs.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * cvs.width, y: (e.clientY - r.top) / r.height * cvs.height, t: performance.now() }; };
    cvs.addEventListener('pointerdown', function (e) {
      size(); drawing = true; last = pos(e); lw = 3 * dpr * (W / 300); cvs.setPointerCapture(e.pointerId);
      d.classList.add('happy');
      ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(last.x, last.y, (mode === 'erase' ? 10 : 1.6) * dpr * (W / 300), 0, 7); ctx.fill();
      inked = true;
    });
    cvs.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e), dist = Math.hypot(p.x - last.x, p.y - last.y), v = dist / Math.max(1, p.t - last.t);
      var target = (mode === 'erase' ? 20 : clamp(4.2 - v * 1.6, 1.3, 4.2)) * dpr * (W / 300);
      lw += (target - lw) * 0.35;
      ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(last.x, last.y);
      ctx.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; Snd.scratch();
      var r = cvs.getBoundingClientRect();
      lookAt(d, (e.clientX - r.right) * 0.6 + 40, (e.clientY - r.bottom) * 0.6 + 20);
    });
    var up = function () { drawing = false; d.classList.remove('happy'); };
    cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);
    var blank = function () {
      var data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
      for (var i = 3; i < data.length; i += 64) if (data[i] > 20) return false;
      return true;
    };
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('.sb-tool'); if (!b) return;
      var c = b.dataset.c;
      if (c === 'ink' || c === 'red' || c === 'erase') {
        mode = c; color = c === 'red' ? RED : INK;
        $$('.sb-tool', tools).forEach(function (x) { x.classList.toggle('on', x === b); }); Snd.pop(); return;
      }
      if (c === 'clear') {
        anim(cvs, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(12px) rotate(1deg)' }], { duration: 300 }).onfinish = function () { ctx.clearRect(0, 0, cvs.width, cvs.height); };
        setTimeout(function () { ctx.clearRect(0, 0, cvs.width, cvs.height); }, 320);
        inked = false; Snd.scratch(); return;
      }
      if (c === 'bind') {
        if (blank()) { anim(b, [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }], { duration: 300 }); Snd.wrong(); return; }
        try { store.set('drawing', cvs.toDataURL('image/webp', 0.7)); } catch (err) {}
        seal.classList.remove('on'); void seal.offsetWidth; seal.classList.add('on');
        Snd.thump(); bubble(psvg, 70, 46, t('woof'), 1800);
        root.dispatchEvent(new CustomEvent('sb:drawing'));
        complete(page);
      }
    });
    d.addEventListener('click', function () { Snd.bark(); bubble(psvg, 70, 46, t('woof')); d.classList.add('hop'); setTimeout(function () { d.classList.remove('hop'); }, 650); });
    if (store.get('drawing', '')) { page.classList.add('done'); seal.classList.add('on'); }
    if (window.ResizeObserver) new ResizeObserver(size).observe(el);
    return { enter: size };
  };

  // The end: stamp paw prints anywhere; Droit hops each time.
  S.end = function (el, page) {
    el.innerHTML = svgWrap(400, 555, '<g data-st></g>' +
      '<g class="wob"><path d="M210 520 C 260 512, 340 512, 390 520" stroke="' + INK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
      dog({ x: 300, y: 520, s: 0.62, cls: 'sleep', id: 'end' }));
    var svg = el.querySelector('svg'), g = svg.querySelector('[data-st]'), d = svg.querySelector('[data-dog]'), out = $('[data-stamps]', page);
    var list = []; try { list = JSON.parse(store.get('stamps', '[]')) || []; } catch (e) {}
    var put = function (s, fresh) {
      var p = mk(svg, 'g', { transform: 'translate(' + s[0] + ' ' + s[1] + ') rotate(' + s[2] + ') scale(1.4)', opacity: 0.85 }, g);
      p.innerHTML = paw(RED);
      if (fresh) anim(p.firstChild, [{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(.9)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    };
    var count = function () { out.textContent = list.length ? t('stamps', list.length) : ''; };
    list.forEach(function (s) { put(s); }); count();
    svg.addEventListener('click', function (e) {
      var p = toSvg(svg, e), s = [Math.round(p.x), Math.round(p.y), Math.round(rnd(-35, 35))];
      list.push(s); if (list.length > 40) { list.shift(); g.firstChild && g.firstChild.remove(); }
      store.set('stamps', JSON.stringify(list)); put(s, true); count(); Snd.thump();
      d.classList.remove('sleep'); d.classList.add('hop', 'happy');
      clearTimeout(d._t); d._t = setTimeout(function () { d.classList.remove('hop'); }, 600);
      clearTimeout(d._s); d._s = setTimeout(function () { d.classList.add('sleep'); d.classList.remove('happy'); }, 5000);
      complete(page);
    });
    return {};
  };

  // Back cover: a barcode that beeps and counts the curiosity it scanned.
  S.back = function (el, page) {
    var bars = '', x = 0;
    for (var i = 0; i < 26; i++) { var w = [1.4, 2.6, 4][Math.floor(Math.random() * 3)]; bars += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w + '" height="44" fill="' + INK + '"/>'; x += w + rnd(1.4, 3); }
    el.innerHTML = svgWrap(400, 300,
      '<g class="wob">' + dog({ x: 200, y: 150, s: 1.2, cls: 'sleep lie', id: 'back' }) + '</g>' +
      '<g class="hit" data-bar transform="translate(' + (200 - x / 2).toFixed(1) + ' 210)"><rect x="-10" y="-10" width="' + (x + 20).toFixed(0) + '" height="74" fill="' + CREAM + '"/>' + bars +
      '<text x="' + (x / 2).toFixed(0) + '" y="58" text-anchor="middle" font-size="9" font-family="JetBrains Mono, monospace" fill="' + INK + '">9 787 2026 1009 7</text>' +
      '<rect data-scan x="-10" y="-6" width="3" height="56" fill="' + RED + '" opacity="0"/></g>');
    var svg = el.querySelector('svg'), bar = svg.querySelector('[data-bar]'), scan = svg.querySelector('[data-scan]'), out = $('[data-scanned]', page), d = svg.querySelector('[data-dog]');
    var n = +store.get('scans', '0');
    if (n) out.textContent = t('scanned', n);
    bar.addEventListener('click', function (e) {
      e.stopPropagation();
      anim(scan, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(' + (x + 16) + 'px)', opacity: 1 }, { transform: 'translateX(0)', opacity: 0 }], { duration: 700, easing: 'ease-in-out' });
      setTimeout(function () { Snd.beep(); n++; store.set('scans', String(n)); out.textContent = t('scanned', n); }, 350);
    });
    d.addEventListener('click', function () { bubble(svg, 230, 120, t('zzz')); Snd.pop(); });
    d.classList.add('hit');
    return {};
  };

  // ── Words: split into letters that arrive one by one and jump when touched ──
  $$('[data-chars]').forEach(function (p) {
    var txt = p.textContent.trim(), k = 0, frag = document.createDocumentFragment();
    (txt.match(/[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]|[^\s\u2e80-\u9fff\u3000-\u303f\uff00-\uffef]+|\s+/g) || []).forEach(function (tok) {
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
      var prevW = frag.lastChild && frag.lastChild.className === 'w' ? frag.lastChild : null;
      if (prevW && /^[，。、！？；：」』）》…—,.!?;:)]+$/.test(tok)) {
        tok.split('').forEach(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', k++); s.textContent = ch; prevW.appendChild(s); });
        return;
      }
      var w = document.createElement('span'); w.className = 'w'; w.style.whiteSpace = 'nowrap'; w.style.display = 'inline-block';
      tok.split('').forEach(function (ch) { var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', k++); s.textContent = ch; w.appendChild(s); });
      frag.appendChild(w);
    });
    p.setAttribute('aria-label', txt); p.textContent = ''; p.appendChild(frag);
    $$('.w', p).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });
  root.addEventListener('pointerover', function (e) {
    var c = e.target.closest && e.target.closest('.ch'); if (!c || c.classList.contains('jump')) return;
    c.classList.add('jump'); Snd.note(+c.style.getPropertyValue('--i'));
  });
  root.addEventListener('animationend', function (e) { if (e.animationName === 'sb-jump') e.target.classList.remove('jump'); });

  // ── Build every scene ──
  var book = $('[data-book]'), pages = $$('.sb-page', book), N = pages.length, scenes = [];
  pages.forEach(function (pg, i) {
    var el = $('.sb-scene', pg), fn = el && S[el.dataset.scene];
    scenes[i] = fn ? (fn(el, pg) || {}) : {};
  });
  var owner = $('[data-owner]'), nm = store.get('name', '');
  if (owner && nm) { owner.hidden = false; owner.textContent = '— ' + t('name_of', nm) + ' —'; }

  // Line boil: the drawings wobble a little, like a hand redrawing them.
  var seedEl = $('[data-seed]');
  if (seedEl && !reduce) { var sd = 1; setInterval(function () { if (!document.hidden) { sd = sd % 3 + 1; seedEl.setAttribute('seed', sd); } }, 170); }

  // ── The book: two-page spreads of turning leaves, or one page at a time on a phone ──
  var single = false, leaves = [], cards = [], spread = 0, cur = 0, LV = Math.ceil(N / 2);
  var active = {};
  var visible = function () {
    if (single) return [cur];
    var v = []; if (spread >= 1 && pages[2 * spread - 1]) v.push(2 * spread - 1); if (pages[2 * spread]) v.push(2 * spread);
    return v;
  };
  var activate = function () {
    var v = visible(), on = {};
    v.forEach(function (i) { on[i] = true; });
    Object.keys(active).forEach(function (i) { if (!on[i]) { pages[i].classList.remove('live'); scenes[i].leave && scenes[i].leave(); delete active[i]; } });
    v.forEach(function (i) { if (!active[i]) { active[i] = true; pages[i].classList.add('live'); scenes[i].enter && scenes[i].enter(); } });
    // counter and tabs
    var shown = single ? cur : (v[v.length - 1] || 0);
    var nowEl = $('[data-now]'); nowEl.textContent = shown; nowEl.classList.remove('tick'); void nowEl.offsetWidth; nowEl.classList.add('tick');
    $('[data-total]').textContent = N - 1;
    var tabs = $$('.sb-tab'), best = null;
    tabs.forEach(function (tb) { if (+tb.dataset.go <= shown) best = tb; });
    tabs.forEach(function (tb) { tb.classList.toggle('on', tb === best); });
    $('[data-prev]').disabled = single ? cur === 0 : spread === 0;
    $('[data-next]').disabled = single ? cur === N - 1 : spread === LV;
    book.classList.toggle('closed-front', !single && spread === 0);
    book.classList.toggle('closed-back', !single && spread === LV);
    if (!(single ? cur === 0 : spread === 0)) { book.style.removeProperty('--rx'); book.style.removeProperty('--ry'); }
    if (typeof keepInView === 'function') keepInView();
  };
  var edge = function () { var e = document.createElement('div'); e.className = 'sb-edge'; e.setAttribute('aria-hidden', 'true'); return e; };
  var unwrap = function () {
    pages.forEach(function (p) { book.appendChild(p); });
    leaves.forEach(function (l) { l.remove(); }); cards.forEach(function (c) { c.remove(); });
    leaves = []; cards = [];
  };
  var zLeaf = function (i) { var l = leaves[i]; l.style.zIndex = l.classList.contains('flipped') ? i + 1 : LV - i + 1; };
  var buildSpread = function () {
    unwrap();
    for (var i = 0; i < LV; i++) {
      var l = document.createElement('div'); l.className = 'sb-leaf'; l.dataset.leaf = i;
      var f = document.createElement('div'); f.className = 'sb-face front'; f.appendChild(pages[2 * i]); f.appendChild(edge());
      var b = document.createElement('div'); b.className = 'sb-face back'; if (pages[2 * i + 1]) b.appendChild(pages[2 * i + 1]); b.appendChild(edge());
      l.appendChild(f); l.appendChild(b); book.appendChild(l); leaves.push(l);
      l.classList.toggle('flipped', i < spread); zLeaf(i);
    }
  };
  var buildCards = function () {
    unwrap();
    pages.forEach(function (p, i) {
      var c = document.createElement('div'); c.className = 'sb-card'; c.appendChild(p); c.appendChild(edge());
      c.style.zIndex = N - i; c.classList.toggle('gone', i < cur);
      book.appendChild(c); cards.push(c);
    });
  };
  var spreadOf = function (p) { return p === 0 ? 0 : (p % 2 ? (p + 1) / 2 : p / 2); };
  var setSpread = function (ns) {
    ns = clamp(ns, 0, LV); if (ns === spread) return;
    var fwd = ns > spread, list = [];
    for (var i = 0; i < LV; i++) { var want = i < ns; if (leaves[i].classList.contains('flipped') !== want) list.push(i); }
    if (!fwd) list.reverse();
    list.forEach(function (i, k) {
      setTimeout(function () {
        var l = leaves[i]; l.style.zIndex = 50 + k; l.classList.toggle('flipped', fwd); Snd.flip();
        shade(l, 0.5); setTimeout(function () { shade(l, 0); zLeaf(i); }, 950);
      }, k * (reduce ? 0 : 130));
    });
    spread = ns; cur = ns === 0 ? 0 : Math.min(2 * ns, N - 1);
    activate();
  };
  var shade = function (l, v) { $$('.sb-face', l).forEach(function (f) { f.style.setProperty('--shade', v); }); };
  var setCard = function (nc) {
    nc = clamp(nc, 0, N - 1); if (nc === cur) return;
    cards.forEach(function (c, i) { c.classList.toggle('gone', i < nc); });
    Snd.flip(); cur = nc; spread = spreadOf(nc); activate();
  };
  var touched = false;
  var keepInView = function () {
    if (!touched) return;
    var r = $('[data-stage]').getBoundingClientRect(), hh = 70;
    if (r.top < hh - 30 || r.bottom > innerHeight + 40) window.scrollBy({ top: r.top - hh - Math.max(0, (innerHeight - hh - r.height) / 2), behavior: reduce ? 'auto' : 'smooth' });
  };
  root.addEventListener('pointerdown', function () { touched = true; }, true);
  root.addEventListener('keydown', function () { touched = true; }, true);
  var go = function (p) { if (single) setCard(p); else setSpread(spreadOf(p)); };
  var next = function () { if (single) setCard(cur + 1); else setSpread(spread + 1); };
  var prev = function () { if (single) setCard(cur - 1); else setSpread(spread - 1); };

  var layout = function () {
    var want = root.clientWidth < 760;
    if (want === single && (leaves.length || cards.length)) return;
    single = want; root.classList.toggle('single', single);
    if (single) { cur = spread === 0 ? 0 : Math.min(2 * spread, N - 1); buildCards(); }
    else { spread = spreadOf(cur); buildSpread(); }
    Object.keys(active).forEach(function (i) { pages[i].classList.remove('live'); scenes[i].leave && scenes[i].leave(); });
    active = {}; activate();
  };
  layout();
  if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe(root);
  else addEventListener('resize', layout);

  // ── Turning by hand: drag a page's outer edge (a tap there turns it too) ──
  var drag = null;
  book.addEventListener('pointerdown', function (e) {
    var ed = e.target.closest('.sb-edge');
    if (!ed) return;
    e.preventDefault();
    var host = ed.parentNode, leaf = host.closest('.sb-leaf'), card = host.closest('.sb-card');
    if (leaf) {
      var i = +leaf.dataset.leaf, fwd = host.classList.contains('front');
      if ((fwd && i !== spread) || (!fwd && i !== spread - 1)) return;
      drag = { el: leaf, fwd: fwd, x0: e.clientX, moved: false, i: i };
      leaf.style.zIndex = 60;
    } else if (card) {
      var ci = cards.indexOf(card);
      if (ci !== cur || ci === N - 1) return;
      drag = { el: card, fwd: true, x0: e.clientX, moved: false, card: true };
    } else return;
    ed.setPointerCapture(e.pointerId);
    drag.ed = ed;
  });
  book.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x0) > 6) drag.moved = true;
    if (!drag.moved) return;
    var r = book.getBoundingClientRect(), a;
    if (drag.card) { a = -Math.acos(clamp((e.clientX - r.left) / r.width, -1, 1)) * 57.3; a = Math.max(a, -105); }
    else { var cx = r.left + r.width / 2, pw = r.width / 2; a = -Math.acos(clamp((e.clientX - cx) / pw, -1, 1)) * 57.3; }
    drag.a = a;
    drag.el.classList.add('dragging');
    drag.el.style.transform = 'rotateY(' + a.toFixed(1) + 'deg)';
    shade(drag.el, Math.abs(Math.sin(a / 57.3)) * 0.8);
  });
  var endDrag = function (e) {
    if (!drag) return;
    var g = drag; drag = null;
    g.el.classList.remove('dragging'); g.el.style.transform = ''; shade(g.el, 0);
    if (!g.moved) { if (g.card) next(); else if (g.fwd) next(); else prev(); return; }
    if (g.card) { if (g.a < -40) { g.el.classList.add('gone'); Snd.flip(); cur++; spread = spreadOf(cur); activate(); } return; }
    var commit = g.fwd ? g.a < -80 : g.a > -100;
    if (commit) {
      g.el.classList.toggle('flipped', g.fwd); Snd.flip();
      spread += g.fwd ? 1 : -1; cur = spread === 0 ? 0 : Math.min(2 * spread, N - 1); activate();
    }
    setTimeout(function () { zLeaf(g.i); }, 950);
  };
  book.addEventListener('pointerup', endDrag); book.addEventListener('pointercancel', endDrag);

  // The cover opens with a tap anywhere on it.
  pages[0].addEventListener('click', function (e) { if (!e.target.closest('.sb-edge') && (single ? cur === 0 : spread === 0)) next(); });
  // The back cover: tap the left edge area to reopen.
  // Swipes on the words (or anywhere on a phone page that is not a game) turn pages too.
  var sw = null;
  book.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.sb-text, .sb-hint, .sb-owner, .sb-cover-text') && !e.target.closest('input, button')) sw = { x: e.clientX, y: e.clientY };
  });
  book.addEventListener('pointerup', function (e) {
    if (!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) next(); else prev(); }
  });

  // Edge hint: the corner lifts briefly after a page is reached, to show where to grab.
  var nudge = function () {
    var v = visible(), pg = pages[v[v.length - 1]], ed = pg && pg.parentNode.querySelector('.sb-edge');
    if (!ed) return; ed.classList.add('nudge'); setTimeout(function () { ed.classList.remove('nudge'); }, 900);
  };
  setTimeout(nudge, 1400);

  // Controls.
  $('[data-prev]').addEventListener('click', prev);
  $('[data-next]').addEventListener('click', next);
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); go(+b.dataset.go); }); });
  var sbtn = $('[data-sound]'), slab = $('[data-sound-label]');
  var paintSound = function () { sbtn.setAttribute('aria-pressed', Snd.on ? 'true' : 'false'); slab.textContent = t(Snd.on ? 'sound_on' : 'sound_off'); };
  paintSound();
  sbtn.addEventListener('click', function () { Snd.set(!Snd.on); paintSound(); Snd.chime(); });
  root.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
  });

  // The closed cover leans toward the pointer.
  var stage = $('[data-stage]');
  stage.addEventListener('pointermove', function (e) {
    if (single ? cur !== 0 : spread !== 0) return;
    var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    book.classList.add('tilting');
    book.style.setProperty('--ry', (nx * 14).toFixed(2) + 'deg'); book.style.setProperty('--rx', (-ny * 10).toFixed(2) + 'deg');
  });
  stage.addEventListener('pointerleave', function () { book.classList.remove('tilting'); book.style.removeProperty('--rx'); book.style.removeProperty('--ry'); });

  // Dust in the light around the book; it drifts away from the pointer.
  var dust = $('.sb-dust'), dctx = dust.getContext('2d'), motes = [], mp = { x: -999, y: -999 };
  for (var m = 0; m < 46; m++) motes.push({ x: Math.random(), y: Math.random(), vx: 0, vy: 0, r: rnd(0.8, 2.4), a: rnd(0.15, 0.5), ph: rnd(0, 6) });
  stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); mp.x = e.clientX - r.left; mp.y = e.clientY - r.top; });
  stage.addEventListener('pointerleave', function () { mp.x = mp.y = -999; });
  var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || RED;
  var DL = loop(function (k, now) {
    var W = stage.clientWidth, H = stage.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (dust.width !== Math.round(W * dpr)) { dust.width = Math.round(W * dpr); dust.height = Math.round(H * dpr); }
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.clearRect(0, 0, W, H); dctx.fillStyle = accent;
    for (var i = 0; i < motes.length; i++) {
      var q = motes[i], x = q.x * W, y = q.y * H, dx = x - mp.x, dy = y - mp.y, d2 = dx * dx + dy * dy;
      if (d2 < 9000) { var f = (9000 - d2) / 9000 * 0.6; q.vx += dx / Math.sqrt(d2 + 1) * f; q.vy += dy / Math.sqrt(d2 + 1) * f; }
      q.vx *= 0.92; q.vy *= 0.92;
      x += q.vx * k + Math.sin(now / 1800 + q.ph) * 0.15; y += q.vy * k - 0.12 * k;
      if (y < -5) y = H + 5; if (x < -5) x = W + 5; if (x > W + 5) x = -5; if (y > H + 5) y = -5;
      q.x = x / W; q.y = y / H;
      dctx.globalAlpha = q.a * (0.6 + 0.4 * Math.sin(now / 900 + q.ph)); dctx.beginPath(); dctx.arc(x, y, q.r, 0, 7); dctx.fill();
    }
  });
  if (!reduce) DL.start();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { DL.stop(); Object.keys(active).forEach(function (i) { scenes[i].leave && scenes[i].leave(); }); }
    else { if (!reduce) DL.start(); Object.keys(active).forEach(function (i) { scenes[i].enter && scenes[i].enter(); }); }
  });
})();
