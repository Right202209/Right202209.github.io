"use strict";

window.hiddenProperty = "hidden" in document ? "hidden" :
    "webkitHidden" in document ? "webkitHidden" : "mozHidden";
window.visibilityChangeEvent = hiddenProperty.replace(/hidden/i, "visibilitychange");

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const introSection = document.querySelector(".content-intro");
const mainSection = document.querySelector(".content-main");
mainSection.inert = true;

function loadIntro() {
    if (document[hiddenProperty] || loadIntro.loaded) return;
    loadIntro.loaded = true;
    document.querySelector(".wrap").classList.add("in");

    const subtitleElement = document.querySelector(".content-subtitle");
    if (motionPreference.matches) {
        requestAnimationFrame(() => {
            if (typeof window.animationID === "number") cancelAnimationFrame(window.animationID);
        });
        return;
    }

    subtitleElement.replaceChildren(...Array.from(window.subtitle, (letter, index) => {
        const span = document.createElement("span");
        span.textContent = letter;
        span.style.setProperty("--letter-index", index);
        return span;
    }));
}

function finishIntro(focusMain) {
    if (typeof window.animationID === "number") {
        cancelAnimationFrame(window.animationID);
    }
    if (window.canvas) {
        window.canvas.remove();
        window.canvas = null;
    }

    introSection.hidden = true;
    introSection.setAttribute("aria-hidden", "true");
    mainSection.inert = false;
    document.documentElement.classList.add("intro-complete");

    if (focusMain) mainSection.focus({ preventScroll: true });
}

function switchPage(focusMain = false) {
    if (switchPage.switched) return;
    switchPage.switched = true;
    introSection.inert = true;
    document.documentElement.classList.add("main-active");

    const shape = document.querySelector("svg.shape");
    const path = document.querySelector(".shape-wrap path");

    // The page remains usable if the animation CDN is unavailable.
    if (motionPreference.matches || typeof window.anime !== "function") {
        finishIntro(focusMain);
        return;
    }

    shape.style.transformOrigin = "50% 0%";
    anime({
        targets: introSection,
        duration: 1100,
        easing: "easeInOutSine",
        translateY: -introSection.offsetHeight,
        complete: () => finishIntro(focusMain)
    });
    anime({
        targets: shape,
        scaleY: [
            { value: [.8, 1.8], duration: 550, easing: "easeInQuad" },
            { value: 1, duration: 550, easing: "easeOutQuad" }
        ]
    });
    anime({
        targets: path,
        duration: 1100,
        easing: "easeOutQuad",
        d: path.getAttribute("pathdata:id")
    });
}

function loadMain() {
    if (loadMain.loaded) return;
    loadMain.loaded = true;
    const delay = motionPreference.matches || typeof window.anime !== "function" ? 0 : 350;
    setTimeout(() => document.querySelector(".main-shell").classList.add("in"), delay);
}

function loadAll(focusMain = false) {
    if (loadAll.loaded) return;
    loadAll.loaded = true;
    switchPage(focusMain);
    loadMain();
}

document.addEventListener(visibilityChangeEvent, loadIntro);
document.addEventListener("DOMContentLoaded", loadIntro);

document.querySelectorAll(".enter, .skip-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        if (switchPage.switched) {
            mainSection.focus({ preventScroll: true });
            mainSection.scrollIntoView({ behavior: motionPreference.matches ? "auto" : "smooth" });
            return;
        }
        loadAll(true);
    });
});

window.addEventListener("wheel", event => {
    if (!event.ctrlKey && event.deltaY > 0) loadAll();
}, { passive: true });

document.querySelectorAll(".arrow").forEach(arrow => {
    arrow.addEventListener("mouseenter", () => loadAll());
});

document.addEventListener("keydown", event => {
    if (switchPage.switched || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest("a, button, input, textarea, select, [contenteditable]")) return;
    if (["ArrowDown", "PageDown", " ", "End"].includes(event.key)) {
        event.preventDefault();
        loadAll(true);
    }
});

let touchStart = null;
document.addEventListener("touchstart", event => {
    touchStart = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
}, { passive: true });
document.addEventListener("touchend", event => {
    if (!touchStart || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;
    if (deltaY < -30 && Math.abs(deltaY) > Math.abs(deltaX)) loadAll();
}, { passive: true });
document.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });

// Preserve the existing tab-title interaction.
const originalTitle = document.title;
let titleTimer;
document.addEventListener(visibilityChangeEvent, () => {
    clearTimeout(titleTimer);
    if (document[hiddenProperty]) {
        document.title = "(つェ⊂) 记得回来看看~";
    } else {
        document.title = "(*´∇｀*) 欢迎回来！";
        titleTimer = setTimeout(() => { document.title = originalTitle; }, 2000);
    }
});

motionPreference.addEventListener("change", () => {
    if (switchPage.switched || !window.canvas || typeof window.update !== "function") return;
    cancelAnimationFrame(window.animationID);
    if (!motionPreference.matches) window.update();
});

if (location.hash === "#main-content") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(() => loadAll(true), 0));
}
