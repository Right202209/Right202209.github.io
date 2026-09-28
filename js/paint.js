"use strict";

// Freezes the intro's fluid into the image that paints the main page's letters.
(function () {
    const SNAPSHOT_MAX_EDGE = 1280;
    // Every channel is lifted to at least this grey, keeping ≥ 4.5:1 on #1e1f21.
    const CONTRAST_FLOOR = "#8a8b8e";
    const DRIFT_RANGE_PX = 24;
    const HALF = .5;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mainSection = document.querySelector(".content-main");
    const paintNote = document.querySelector(".paint-note");

    function drawSnapshot(source) {
        const scale = Math.min(1, SNAPSHOT_MAX_EDGE / Math.max(source.width, source.height));
        const snapshot = document.createElement("canvas");
        snapshot.width = Math.max(1, Math.round(source.width * scale));
        snapshot.height = Math.max(1, Math.round(source.height * scale));
        const context = snapshot.getContext("2d");
        if (!context) return null;
        context.fillStyle = CONTRAST_FLOOR;
        context.fillRect(0, 0, snapshot.width, snapshot.height);
        context.globalCompositeOperation = "lighten";
        context.drawImage(source, 0, 0, snapshot.width, snapshot.height);
        return snapshot;
    }

    function applyPaint(blob) {
        const url = URL.createObjectURL(blob);
        mainSection.style.setProperty("--paint", `url("${url}")`);
        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        paintNote.querySelector(".paint-time").textContent = ` · ${time}`;
        paintNote.hidden = false;
    }

    // Called by main.js the moment the visitor leaves the intro.
    window.captureIntroPaint = function () {
        const source = window.canvas;
        if (!source || typeof window.render !== "function") return;
        try {
            // The WebGL buffer is only readable in the task that drew it.
            window.render(null);
            const snapshot = drawSnapshot(source);
            if (snapshot) snapshot.toBlob(blob => blob && applyPaint(blob));
        } catch (error) {
            // The CSS gradient in main.css stays as the paint.
        }
    };

    let pendingDrift = null;
    function drift(event) {
        if (pendingDrift) return;
        pendingDrift = requestAnimationFrame(() => {
            pendingDrift = null;
            const x = (event.clientX / window.innerWidth - HALF) * DRIFT_RANGE_PX;
            const y = (event.clientY / window.innerHeight - HALF) * DRIFT_RANGE_PX;
            mainSection.style.setProperty("--paint-x", `${x.toFixed(1)}px`);
            mainSection.style.setProperty("--paint-y", `${y.toFixed(1)}px`);
        });
    }

    if (!motionPreference.matches && window.matchMedia("(pointer: fine)").matches) {
        mainSection.addEventListener("pointermove", drift, { passive: true });
    }
})();
