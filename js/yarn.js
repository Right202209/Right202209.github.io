/* Yarn toy: click the empty stage to toss a ball of yarn; the oneko cat fetches it.
 * Depends on window.stage (js/stage.js) for drawing and window.oneko (js/oneko.js) for the cat.
 */
(function () {
    'use strict';

    const STAGE_SELECTOR = '#card';
    const IGNORE_SELECTOR = 'a, button, .card-panel, .hud';
    const HINT_ID = 'hud-cat';

    const YARN_RADIUS = 9;
    const YARN_COLOR = '#ff963b';
    const YARN_STRAND = 'rgba(0, 0, 0, .3)';
    const YARN_STRAND_WIDTH = 1.2;
    const YARN_STRAND_ANGLES = [0.3, 1.4, 2.5];
    const POP_IN_MS = 320;
    const WOBBLE_PERIOD_MS = 1400;
    const WOBBLE_RAD = 0.18;
    const BACK_C1 = 1.70158;            // easeOutBack overshoot constants
    const BACK_C3 = BACK_C1 + 1;

    const BURST_COUNT = 16;
    const BURST_LIFE_MS = 700;
    const BURST_SPEED_MIN = 60;         // px per second
    const BURST_SPEED_MAX = 200;
    const BURST_RADIUS = 2.4;
    const BURST_COLORS = ['#ff963b', '#ffffff', '#ffd2a8'];
    const MS_PER_SECOND = 1000;

    const HINT_IDLE = 'click anywhere · toss the cat some yarn';
    const HINT_CHASING = 'the cat is on it…';
    const HINT_CAUGHT = 'yarn caught ×';

    let yarn = null;
    let caught = 0;

    function easeOutBack(t) {
        const u = t - 1;
        return 1 + BACK_C3 * u * u * u + BACK_C1 * u * u;
    }

    function setHint(text) {
        const hint = document.getElementById(HINT_ID);
        if (!hint) return;
        hint.hidden = false;
        hint.textContent = text;
    }

    function drawYarn(c, x, y, scale, rotation) {
        c.save();
        c.translate(x, y);
        c.rotate(rotation);
        c.scale(scale, scale);
        c.fillStyle = YARN_COLOR;
        c.beginPath();
        c.arc(0, 0, YARN_RADIUS, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = YARN_STRAND;
        c.lineWidth = YARN_STRAND_WIDTH;
        YARN_STRAND_ANGLES.forEach(function (a) {
            c.beginPath();
            c.ellipse(0, 0, YARN_RADIUS * 0.9, YARN_RADIUS * 0.35, a, 0, Math.PI * 2);
            c.stroke();
        });
        c.restore();
    }

    function makeYarn(x, y) {
        let age = 0;
        return {
            x: x,
            y: y,
            alive: true,
            update: function (dt) {
                age += dt;
                return this.alive;
            },
            draw: function (c) {
                const scale = easeOutBack(Math.min(1, age / POP_IN_MS));
                const rotation = Math.sin(age / WOBBLE_PERIOD_MS * Math.PI * 2) * WOBBLE_RAD;
                drawYarn(c, x, y, scale, rotation);
            }
        };
    }

    function makeBurst(x, y) {
        let age = 0;
        const bits = [];
        for (let i = 0; i < BURST_COUNT; i += 1) {
            const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.4;
            const speed = BURST_SPEED_MIN + Math.random() * (BURST_SPEED_MAX - BURST_SPEED_MIN);
            bits.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed / MS_PER_SECOND,
                vy: Math.sin(angle) * speed / MS_PER_SECOND,
                color: BURST_COLORS[i % BURST_COLORS.length]
            });
        }
        return {
            update: function (dt) {
                age += dt;
                bits.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
                return age < BURST_LIFE_MS;
            },
            draw: function (c) {
                const fade = 1 - age / BURST_LIFE_MS;
                c.save();
                c.globalAlpha = fade;
                bits.forEach(function (b) {
                    c.fillStyle = b.color;
                    c.beginPath();
                    c.arc(b.x, b.y, BURST_RADIUS * fade, 0, Math.PI * 2);
                    c.fill();
                });
                c.restore();
            }
        };
    }

    function toss(x, y) {
        if (yarn) yarn.alive = false;
        yarn = makeYarn(x, y);
        window.stage.add(yarn);
        window.oneko.chase(x, y);
        setHint(HINT_CHASING);
    }

    function onClick(event) {
        if (!window.oneko || !window.stage) return;
        if (event.target.closest(IGNORE_SELECTOR)) return;
        toss(event.clientX, event.clientY);
    }

    function onArrived() {
        if (!yarn) return;
        yarn.alive = false;
        window.stage.add(makeBurst(yarn.x, yarn.y));
        yarn = null;
        caught += 1;
        setHint(HINT_CAUGHT + caught);
    }

    function init() {
        const stage = document.querySelector(STAGE_SELECTOR);
        if (!stage) return;
        stage.addEventListener('click', onClick);
        document.addEventListener('oneko:arrived', onArrived);
        document.addEventListener('oneko:ready', function () { setHint(HINT_IDLE); });
        if (window.oneko) setHint(HINT_IDLE);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
