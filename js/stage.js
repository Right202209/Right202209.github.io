/* Stage behind the business card: dot-grid spotlights that follow the pointer and the cat,
 * plus the HUD copyright year.
 */
(function () {
    'use strict';

    const GRID_SELECTOR = '.stage-grid';
    const YEAR_ID = 'hud-year';
    const OFFSCREEN_PX = -999;

    const grid = document.querySelector(GRID_SELECTOR);

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

    function bindCatSpot() {
        document.addEventListener('oneko:ready', function (e) { setSpot('c', e.detail.x, e.detail.y); });
        document.addEventListener('oneko:step', function (e) { setSpot('c', e.detail.x, e.detail.y); });
    }

    function setYear() {
        const year = document.getElementById(YEAR_ID);
        if (year) year.textContent = String(new Date().getFullYear());
    }

    function init() {
        setYear();
        if (!grid) return;
        bindPointerSpot();
        bindCatSpot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
