/* Pointer-driven tilt, spotlight and avatar parallax for the business card panel. */
(function () {
    'use strict';

    const PANEL_SELECTOR = '.card-panel';
    const HOVER_CLASS = 'is-hovered';
    const TILT_MAX_DEG = 7;
    const PERCENT = 100;
    const MOTION_VARS = ['--tilt-x', '--tilt-y', '--shift-x', '--shift-y'];

    function supportsTilt() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        return !reducedMotion && finePointer;
    }

    function clamp01(value) {
        return Math.min(1, Math.max(0, value));
    }

    // Returns pointer position relative to the panel: x/y in 0..1, nx/ny in -1..1.
    function readPointer(panel, event) {
        const rect = panel.getBoundingClientRect();
        const x = clamp01((event.clientX - rect.left) / rect.width);
        const y = clamp01((event.clientY - rect.top) / rect.height);
        return { x: x, y: y, nx: x * 2 - 1, ny: y * 2 - 1 };
    }

    // The side under the pointer recedes; the avatar drifts toward the pointer.
    function applyPointer(panel, p) {
        const style = panel.style;
        style.setProperty('--mx', (p.x * PERCENT).toFixed(2) + '%');
        style.setProperty('--my', (p.y * PERCENT).toFixed(2) + '%');
        style.setProperty('--tilt-x', (-p.ny * TILT_MAX_DEG).toFixed(2) + 'deg');
        style.setProperty('--tilt-y', (p.nx * TILT_MAX_DEG).toFixed(2) + 'deg');
        style.setProperty('--shift-x', p.nx.toFixed(3));
        style.setProperty('--shift-y', p.ny.toFixed(3));
    }

    function bindTilt(panel) {
        let frame = null;
        let pending = null;

        function onPointerMove(event) {
            pending = readPointer(panel, event);
            if (frame !== null) return;
            frame = requestAnimationFrame(function () {
                frame = null;
                applyPointer(panel, pending);
            });
        }

        function onPointerLeave() {
            if (frame !== null) {
                cancelAnimationFrame(frame);
                frame = null;
            }
            panel.classList.remove(HOVER_CLASS);
            MOTION_VARS.forEach(function (name) { panel.style.removeProperty(name); });
        }

        panel.addEventListener('pointerenter', function () { panel.classList.add(HOVER_CLASS); });
        panel.addEventListener('pointermove', onPointerMove);
        panel.addEventListener('pointerleave', onPointerLeave);
    }

    function init() {
        const panel = document.querySelector(PANEL_SELECTOR);
        if (panel && supportsTilt()) bindTilt(panel);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
