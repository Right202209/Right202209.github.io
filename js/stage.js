/* Stage behind the business card: dot-grid spotlights that follow the pointer and the cat,
 * a 2D canvas for paw prints and toys, and the HUD clock.
 *
 * Toys register through window.stage.add(drawable); a drawable is
 *   { update(dtMs) -> boolean stillAlive, draw(ctx) }.
 * The render loop only runs while something is on the canvas.
 */
(function () {
    'use strict';

    const GRID_SELECTOR = '.stage-grid';
    const CANVAS_ID = 'stage';
    const CLOCK_ID = 'hud-clock';
    const YEAR_ID = 'hud-year';
    const OFFSCREEN_PX = -999;
    const CLOCK_TICK_MS = 1000;
    const MAX_DT_MS = 100;              // clamps the first frame after a background tab

    const PAW_EVERY_N_STEPS = 3;
    const PAW_LIFE_MS = 2600;
    const PAW_FOOT_OFFSET = 10;         // sprite feet sit below the cat's centre
    const PAW_SIDE_OFFSET = 7;          // alternates left/right of the walking line
    const PAW_PAD_RADIUS = 3;
    const PAW_TOE_RADIUS = 1.4;
    const PAW_TOE_SPREAD = 4.6;
    const PAW_TOE_ANGLES = [-0.65, 0, 0.65];
    const PAW_ALPHA = 0.5;
    const PAW_RGB = '255, 255, 255';

    const grid = document.querySelector(GRID_SELECTOR);
    const canvas = document.getElementById(CANVAS_ID);
    const ctx = canvas ? canvas.getContext('2d') : null;
    const drawables = [];
    let width = 0;
    let height = 0;
    let lastTime = 0;
    let loopHandle = null;
    let stepCount = 0;

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function tick(now) {
        const dt = Math.min(now - lastTime, MAX_DT_MS);
        lastTime = now;
        ctx.clearRect(0, 0, width, height);
        for (let i = drawables.length - 1; i >= 0; i -= 1) {
            if (drawables[i].update(dt)) {
                drawables[i].draw(ctx);
            } else {
                drawables.splice(i, 1);
            }
        }
        loopHandle = drawables.length ? window.requestAnimationFrame(tick) : null;
    }

    function add(drawable) {
        drawables.push(drawable);
        if (loopHandle === null) {
            lastTime = performance.now();
            loopHandle = window.requestAnimationFrame(tick);
        }
    }

    // Spotlights are CSS mask positions on .stage-grid: --sx/--sy for the pointer, --cx/--cy for the cat.
    function setSpot(prefix, x, y) {
        grid.style.setProperty('--' + prefix + 'x', x + 'px');
        grid.style.setProperty('--' + prefix + 'y', y + 'px');
    }

    function bindPointerSpot() {
        let frame = null;
        let pending = null;
        document.addEventListener('pointermove', function (event) {
            pending = event;
            if (frame !== null) return;
            frame = window.requestAnimationFrame(function () {
                frame = null;
                setSpot('s', pending.clientX, pending.clientY);
            });
        }, { passive: true });
        document.documentElement.addEventListener('pointerleave', function () {
            setSpot('s', OFFSCREEN_PX, OFFSCREEN_PX);
        });
    }

    function makePaw(x, y, angle) {
        let age = 0;
        return {
            update: function (dt) {
                age += dt;
                return age < PAW_LIFE_MS;
            },
            draw: function (c) {
                c.save();
                c.translate(x, y);
                c.rotate(angle);
                c.fillStyle = 'rgba(' + PAW_RGB + ', ' + (PAW_ALPHA * (1 - age / PAW_LIFE_MS)).toFixed(3) + ')';
                c.beginPath();
                c.ellipse(0, 0, PAW_PAD_RADIUS, PAW_PAD_RADIUS * 0.8, 0, 0, Math.PI * 2);
                PAW_TOE_ANGLES.forEach(function (a) {
                    const tx = Math.cos(a) * PAW_TOE_SPREAD;
                    const ty = Math.sin(a) * PAW_TOE_SPREAD;
                    c.moveTo(tx + PAW_TOE_RADIUS, ty);
                    c.arc(tx, ty, PAW_TOE_RADIUS, 0, Math.PI * 2);
                });
                c.fill();
                c.restore();
            }
        };
    }

    function onCatStep(event) {
        const d = event.detail;
        setSpot('c', d.x, d.y);
        stepCount += 1;
        if (stepCount % PAW_EVERY_N_STEPS !== 0) return;
        const side = (stepCount / PAW_EVERY_N_STEPS) % 2 === 0 ? 1 : -1;
        const px = d.x - d.dy * side * PAW_SIDE_OFFSET;
        const py = d.y + PAW_FOOT_OFFSET + d.dx * side * PAW_SIDE_OFFSET;
        add(makePaw(px, py, Math.atan2(d.dy, d.dx)));
    }

    function startClock() {
        const clock = document.getElementById(CLOCK_ID);
        const year = document.getElementById(YEAR_ID);
        if (year) year.textContent = String(new Date().getFullYear());
        if (!clock) return;
        const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
        const day = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
        function update() {
            const now = new Date();
            clock.textContent = time.format(now) + ' · ' + day.format(now);
            clock.setAttribute('datetime', now.toISOString());
        }
        update();
        window.setInterval(update, CLOCK_TICK_MS);
    }

    function init() {
        startClock();
        if (!grid || !ctx) return;
        resize();
        window.addEventListener('resize', resize);
        bindPointerSpot();
        document.addEventListener('oneko:ready', function (e) { setSpot('c', e.detail.x, e.detail.y); });
        document.addEventListener('oneko:step', onCatStep);
        window.stage = { add: add };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
