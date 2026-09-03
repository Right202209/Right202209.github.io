/* oneko: a pixel cat that chases the cursor.
 * Behaviour and sprite-sheet layout adapted from https://github.com/adryd325/oneko.js
 * Sprite sheet: 8x4 grid of 32px cells (assets/oneko.gif).
 */
(function () {
    'use strict';

    const OWN_SCRIPT = document.currentScript;

    const SPRITE_SIZE = 32;
    const SPRITE_HALF = SPRITE_SIZE / 2;
    const LOCAL_SPRITE = 'assets/oneko.gif';
    const CDN_SPRITE = 'https://cdn.jsdelivr.net/gh/adryd325/oneko.js@main/oneko.gif';
    const SAFE_URL = /^[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$/;
    const TOP_LAYER = 2147483647;

    const FRAME_INTERVAL_MS = 100;
    const START_POS = 32;
    const NEKO_SPEED = 10;              // px moved per frame while chasing
    const CHASE_DISTANCE = 48;          // stops chasing once this close to the cursor
    const AXIS_THRESHOLD = 0.5;         // share of the distance needed to add a compass letter

    const IDLE_TICKS_BEFORE_ANIMATION = 10;
    const IDLE_ANIMATION_ODDS = 200;    // 1-in-N chance per frame once idle
    const ALERT_IDLE_CAP = 7;           // frames spent looking alert before giving chase
    const TIRED_FRAMES = 8;             // yawning frames before the sleep loop starts
    const SLEEP_FRAMES_PER_CELL = 4;
    const SLEEP_LAST_FRAME = 192;
    const SCRATCH_LAST_FRAME = 9;

    // [column, row] of each frame in the sprite sheet, as negative background offsets.
    const SPRITE_SETS = {
        idle: [[-3, -3]],
        alert: [[-7, -3]],
        tired: [[-3, -2]],
        sleeping: [[-2, 0], [-2, -1]],
        scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
        scratchWallN: [[0, 0], [0, -1]],
        scratchWallS: [[-7, -1], [-6, -2]],
        scratchWallE: [[-2, -2], [-2, -3]],
        scratchWallW: [[-4, 0], [-4, -1]],
        N: [[-1, -2], [-1, -3]],
        NE: [[0, -2], [0, -3]],
        E: [[-3, 0], [-3, -1]],
        SE: [[-5, -1], [-5, -2]],
        S: [[-6, -3], [-7, -2]],
        SW: [[-5, -3], [-6, -1]],
        W: [[-4, -2], [-4, -3]],
        NW: [[-1, 0], [-1, -1]]
    };

    const nekoEl = document.createElement('div');

    let nekoPosX = START_POS;
    let nekoPosY = START_POS;
    let mousePosX = START_POS;          // starts on the cat, so it sits still until the mouse moves
    let mousePosY = START_POS;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation = null;
    let idleAnimationFrame = 0;
    let lastFrameTimestamp = 0;

    function shouldRun() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        return !reducedMotion && finePointer;
    }

    function setSprite(name, frame) {
        const set = SPRITE_SETS[name] || SPRITE_SETS.idle;
        const cell = set[frame % set.length];
        nekoEl.style.backgroundPosition = (cell[0] * SPRITE_SIZE) + 'px ' + (cell[1] * SPRITE_SIZE) + 'px';
    }

    function moveTo(x, y) {
        nekoPosX = Math.min(Math.max(SPRITE_HALF, x), window.innerWidth - SPRITE_HALF);
        nekoPosY = Math.min(Math.max(SPRITE_HALF, y), window.innerHeight - SPRITE_HALF);
        nekoEl.style.left = (nekoPosX - SPRITE_HALF) + 'px';
        nekoEl.style.top = (nekoPosY - SPRITE_HALF) + 'px';
    }

    function resetIdleAnimation() {
        idleAnimation = null;
        idleAnimationFrame = 0;
    }

    // Wall scratching is only offered when the cat is actually sitting against that edge.
    function chooseIdleAnimation() {
        const options = ['sleeping', 'scratchSelf'];
        if (nekoPosX < SPRITE_SIZE) options.push('scratchWallW');
        if (nekoPosY < SPRITE_SIZE) options.push('scratchWallN');
        if (nekoPosX > window.innerWidth - SPRITE_SIZE) options.push('scratchWallE');
        if (nekoPosY > window.innerHeight - SPRITE_SIZE) options.push('scratchWallS');
        return options[Math.floor(Math.random() * options.length)];
    }

    // tick* helpers return true while the animation still has frames left to play.
    function tickSleeping() {
        if (idleAnimationFrame < TIRED_FRAMES) {
            setSprite('tired', 0);
            return true;
        }
        setSprite('sleeping', Math.floor(idleAnimationFrame / SLEEP_FRAMES_PER_CELL));
        return idleAnimationFrame <= SLEEP_LAST_FRAME;
    }

    function tickScratching(name) {
        setSprite(name, idleAnimationFrame);
        return idleAnimationFrame <= SCRATCH_LAST_FRAME;
    }

    function idle() {
        idleTime += 1;
        const canStart = idleAnimation === null && idleTime > IDLE_TICKS_BEFORE_ANIMATION;
        if (canStart && Math.floor(Math.random() * IDLE_ANIMATION_ODDS) === 0) {
            idleAnimation = chooseIdleAnimation();
        }
        if (idleAnimation === null) {
            setSprite('idle', 0);
            return;
        }
        const playing = idleAnimation === 'sleeping' ? tickSleeping() : tickScratching(idleAnimation);
        idleAnimationFrame += 1;
        if (!playing) resetIdleAnimation();
    }

    // Compass name of the sprite set to use; diffs point from the cursor back to the cat.
    function directionFor(diffX, diffY, distance) {
        const shareX = diffX / distance;
        const shareY = diffY / distance;
        let name = shareY > AXIS_THRESHOLD ? 'N' : '';
        name += shareY < -AXIS_THRESHOLD ? 'S' : '';
        name += shareX > AXIS_THRESHOLD ? 'W' : '';
        name += shareX < -AXIS_THRESHOLD ? 'E' : '';
        return name;
    }

    function frame() {
        frameCount += 1;
        const diffX = nekoPosX - mousePosX;
        const diffY = nekoPosY - mousePosY;
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

        if (distance < CHASE_DISTANCE || distance < NEKO_SPEED) {
            idle();
            return;
        }
        resetIdleAnimation();
        if (idleTime > 1) {
            setSprite('alert', 0);
            idleTime = Math.min(idleTime, ALERT_IDLE_CAP) - 1;
            return;
        }
        setSprite(directionFor(diffX, diffY, distance), frameCount);
        moveTo(nekoPosX - (diffX / distance) * NEKO_SPEED, nekoPosY - (diffY / distance) * NEKO_SPEED);
    }

    function onAnimationFrame(timestamp) {
        if (!nekoEl.isConnected) return;   // stops the loop if the cat is removed from the DOM
        if (timestamp - lastFrameTimestamp > FRAME_INTERVAL_MS) {
            lastFrameTimestamp = timestamp;
            frame();
        }
        window.requestAnimationFrame(onAnimationFrame);
    }

    function applyStyle(spriteUrl) {
        const style = nekoEl.style;
        style.width = SPRITE_SIZE + 'px';
        style.height = SPRITE_SIZE + 'px';
        style.position = 'fixed';
        style.pointerEvents = 'none';
        style.imageRendering = 'pixelated';
        style.backgroundImage = 'url("' + spriteUrl + '")';
        style.zIndex = String(TOP_LAYER);
    }

    function onMouseMove(event) {
        mousePosX = event.clientX;
        mousePosY = event.clientY;
    }

    function start(spriteUrl) {
        nekoEl.id = 'oneko';
        nekoEl.setAttribute('aria-hidden', 'true');
        applyStyle(spriteUrl);
        moveTo(nekoPosX, nekoPosY);
        document.body.appendChild(nekoEl);
        document.addEventListener('mousemove', onMouseMove, { passive: true });
        window.requestAnimationFrame(onAnimationFrame);
    }

    // Only a plain URL is accepted, so nothing can break out of the CSS url("...") wrapper.
    function readSpriteUrl() {
        const custom = OWN_SCRIPT && OWN_SCRIPT.dataset ? OWN_SCRIPT.dataset.cat : '';
        return custom && SAFE_URL.test(custom) ? custom : LOCAL_SPRITE;
    }

    // Falls back to the upstream CDN copy when the self-hosted sprite sheet is missing.
    function resolveSprite(url, onReady) {
        const probe = new Image();
        probe.onload = function () { onReady(url); };
        probe.onerror = function () { onReady(url === CDN_SPRITE ? url : CDN_SPRITE); };
        probe.src = url;
    }

    function init() {
        if (!shouldRun()) return;
        resolveSprite(readSpriteUrl(), start);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
