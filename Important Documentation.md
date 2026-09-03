# Important Documentation

## Change: modernized business card (`#card`)

The business card on the main screen was rebuilt as a frosted-glass panel with pointer-driven
interaction. No build step is involved; open `index.html` (or `python3 -m http.server`) to preview.

### Files touched

| File | Change |
| --- | --- |
| `css/card.css` (new) | All `#card` styling: glass panel, ambient orbs, avatar ring, gradient name, link tiles, responsive and reduced-motion rules. |
| `js/card.js` (new) | Pointer tilt, spotlight and avatar parallax. Writes CSS custom properties (`--mx`, `--my`, `--tilt-x`, `--tilt-y`, `--shift-x`, `--shift-y`) and toggles `.is-hovered` on `.card-panel`. Skipped on touch/coarse pointers and when `prefers-reduced-motion` is set. |
| `css/style.css` | Removed the old `#card …` rules (previously lines 533–654) so they no longer conflict with `card.css`. |
| `index.html` | Wrapped the card content in `.card-panel`, wrapped the avatar in `.card-avatar`, gave the list `class="card-links"` and per-item `style="--i:n"` for the staggered reveal, linked `card.css` / `card.js`, added `rel="noopener noreferrer"` to the GitHub link, removed a stray `</html>` that sat between `</head>` and `<body>`, and added the missing closing `</html>`. |
| `sw.js` | Bumped cache to `droit-v2`, added the two new assets, and added an `activate` handler that deletes stale caches (the previous worker never evicted old caches, so a cache-name bump alone would not have refreshed anything). |

### Contracts that must keep holding

- `js/main.js` adds `.in` to `.card-inner` 400 ms after the enter transition. `card.css` relies on that class for the staggered tile reveal (`.card-inner.in .card-links li`). If `main.js` changes that selector, the tiles stay hidden.
- The `.fade` class (in `style.css`) still owns the entrance `translateY`/opacity on `.card-inner`. The tilt transform lives one level deeper on `.card-panel`, so the two transforms do not fight.
- `--i` on each `<li>` must be sequential integers starting at 0; the reveal delay is `350ms + i × 70ms`.

### Items to verify manually (not run here)

1. **Entrance**: after clicking "enter"/scrolling, the panel slides in, then the five tiles fade up left-to-right one after another.
2. **Tilt/spotlight (desktop only)**: moving the mouse over the panel tilts it by up to 7°, the side under the cursor recedes, a soft white spotlight and an orange border glow follow the cursor, and the avatar drifts up to 8 px toward the cursor. Leaving the panel eases everything back within ~0.6 s.
3. **Touch devices**: no tilt or spotlight; tiles still reveal and remain tappable. Check that `(hover: hover) and (pointer: fine)` correctly excludes phones/tablets.
4. **Keyboard**: tabbing through the tiles shows a 2 px orange outline and the same lift/highlight as hover (`:focus-visible`).
5. **Reduced motion**: with the OS "reduce motion" setting on, orbs and avatar ring do not animate, tiles are visible immediately, and `card.js` does not bind listeners.
6. **Narrow viewports (≤ 480 px)**: tiles wrap into a 3 + 2 layout, all the same width and centered; avatar shrinks to 92 px, name to 1.5 rem. Also check 360 px and 320 px widths.
7. **Browser support**:
   - `backdrop-filter` (with `-webkit-` prefix for Safari ≤ 17). Without it the panel falls back to the semi-transparent gradient only.
   - `mask-composite: exclude` / `-webkit-mask-composite: xor` for the border glow. Chrome < 120 uses the WebKit form.
   - `-webkit-text-fill-color: transparent` for the gradient name. Fallback is `color: #fff`.
   - `inset` shorthand and `min()` require 2020+ browsers; IE is not supported (it never was for the WebGL background either).
8. **Performance**: two blurred 34–40 vmax orbs animate continuously behind the panel. Check GPU usage on a low-end laptop; if it is a problem, lower `filter: blur(90px)` or drop the `card-orb-drift` animation.
9. **Service worker**: after deploy, reload twice and confirm `card.css`/`card.js` are served, and that the `droit-v1` cache is gone from DevTools → Application → Cache Storage.
10. **Icon font**: `.card-links .icon` switches the glyph container to `display: flex`. Confirm the iconfont glyphs (`\e603`, `\e625`, `\e610`, `\e885`, `\e66f`) are still centered inside the tiles.

### Known deviations from the code-quality limits

- `css/style.css` is still 531 lines (limit 300). This change only removed lines from it; the remaining excess is pre-existing (38 hand-written `.content-subtitle span:nth-child(n)` delay rules alone take ~150 lines and could be collapsed into a single `--i`-based rule in a follow-up).

## Change: oneko cursor cat (`js/oneko.js`)

A pixel cat now chases the mouse cursor across the whole page. Behaviour and the sprite-sheet
layout are adapted from [adryd325/oneko.js](https://github.com/adryd325/oneko.js); the code was
re-written in this project's style (IIFE + named constants, like `js/card.js`) instead of vendoring
the upstream file, so the hard code-quality limits still apply to it.

### Files touched

| File | Change |
| --- | --- |
| `js/oneko.js` (new) | The whole feature: a 32×32 `position: fixed` `div#oneko` that steps 10 px per 100 ms frame toward the cursor, picks one of 16 compass sprite sets while walking, and plays idle animations (yawn → sleep, scratch self, scratch whichever wall it is resting against). Skipped entirely on coarse pointers and when `prefers-reduced-motion: reduce` is set. |
| `index.html` | Added `<script src="js/oneko.js" data-cat="assets/oneko.gif"></script>` after `js/mouse-trail.js`. |
| `sw.js` | Bumped cache to `droit-v3`, added `/js/oneko.js` to `ASSETS`, and introduced `OPTIONAL_ASSETS` for `/assets/oneko.gif`. `cache.addAll` is all-or-nothing, so precaching a sprite sheet that may not be committed yet would abort the whole service-worker install; optional entries are added individually with `.catch()`. |

### REQUIRED manual step before deploy: the sprite sheet

**The cat is invisible without `assets/oneko.gif`, and that binary was not downloaded here**
(no dependency downloads in this session). Fetch it once and commit it:

```sh
curl -fsSL https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif -o assets/oneko.gif
```

Expect a 256×128 GIF: an 8 × 4 grid of 32 px cells. `SPRITE_SETS` in `js/oneko.js` indexes that
grid by `[column, row]` as negative `background-position` offsets, so a differently sized sheet
(e.g. one of the alternate cats in the upstream repo) will show wrong frames.

Until that file exists, `resolveSprite()` probes `assets/oneko.gif` with an `Image` and falls back
to `https://cdn.jsdelivr.net/gh/adryd325/oneko.js@main/oneko.gif` on error, so GitHub Pages still
shows a cat on the first deploy. That fallback is a convenience, not the intended end state: it
hotlinks an unpinned branch through a third-party CDN and cannot be served offline by the service
worker. Self-host the gif.

### Licensing — unverified

Upstream's licensing for the code and for `oneko.gif` (which originates from the 1990s Neko
desktop toy) was **not** checked in this session, because no network access was used. Confirm
`https://github.com/adryd325/oneko.js` licence/README terms before committing the sprite, and add
whatever attribution it requires.

### Configuration points

- `data-cat` on the script tag overrides the sprite URL (upstream-compatible). It is validated
  against `SAFE_URL` (`/^[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$/`) and ignored if it fails, so nothing can
  break out of the CSS `url("…")` wrapper; the default `assets/oneko.gif` is used instead.
- Speed / stop distance / idle odds are the `NEKO_SPEED`, `CHASE_DISTANCE` and
  `IDLE_ANIMATION_ODDS` constants at the top of the file.
- `z-index` is `2147483647` (`TOP_LAYER`), i.e. above the `mouse-trail.js` canvas (`9999`).
- The cat is visible on the intro screen as well as the card screen. To restrict it to the card
  screen, gate `start()` on `window.switchPage && window.switchPage.switched`, the same flag
  `js/mouse-trail.js` uses.
- `404.html` does not load the script. Adding the same `<script>` line there works, but its
  relative paths already break when GitHub Pages serves it for a deep URL, so the CDN fallback
  would be doing the work.

### Deviations from upstream behaviour (deliberate)

1. Skipped on `(hover: hover) and (pointer: fine)` failure — upstream only checks reduced motion,
   which leaves a cat parked in the top-left corner of phones, since no `mousemove` ever arrives.
2. The cursor position is initialised to the cat's own start position (32, 32) rather than (0, 0),
   so it sits still until the mouse actually moves instead of dashing to the corner on load.
3. `requestAnimationFrame` with a 100 ms gate (upstream's current approach) rather than
   `setInterval`, so the loop pauses in background tabs.

### Items to verify manually (not run here)

1. **Sprite offsets** — the `SPRITE_SETS` table was reproduced from upstream from memory and has
   not been rendered against the real gif. Walk the cursor slowly in all eight directions and
   confirm the cat faces the way it is moving, and that no frame shows a wrong pose or a half-cell
   offset. A wrong entry here is the most likely defect in this change.
2. **Chase / stop** — the cat pauses with the `alert` sprite for up to ~600 ms after a fast cursor
   move, then follows, then stops ~48 px short of the cursor and sits.
3. **Idle animations** — leave the mouse still for a few minutes: expect the occasional yawn →
   sleep loop and self-scratch. Park the cat against each of the four viewport edges (move the
   cursor into the corner, then away) and confirm the matching `scratchWall*` animation appears.
4. **Viewport clamping** — resize the window while the cat is near an edge; it must stay fully
   on-screen (`moveTo` clamps to 16 px from each edge) and must not add scrollbars.
5. **Reduced motion** — with the OS "reduce motion" setting on, no `div#oneko` is created at all
   (check the DOM, not just the screen).
6. **Touch devices** — no cat on phones/tablets. Verify in DevTools device emulation *and* on a
   real device, since emulation does not always flip `pointer: coarse`.
7. **Sprite fallback** — load the page before committing `assets/oneko.gif`: one 404 for
   `assets/oneko.gif` in the network panel, then the jsDelivr gif loads and the cat appears. After
   committing the gif, confirm there is no CDN request at all.
8. **Service worker** — after deploy, reload twice, then in DevTools → Application → Cache Storage
   confirm the `droit-v3` cache exists, contains `/js/oneko.js`, that `droit-v2` is gone, and that
   the install succeeded even if `/assets/oneko.gif` is missing (the whole point of
   `OPTIONAL_ASSETS`). Then go offline and reload: the cat should still appear if the gif is
   self-hosted.
9. **Interaction with the page transition** — click "enter"; the cat is `position: fixed` on
   `<body>`, so the `translateY(-200vh)` intro animation must not carry it off-screen, and it must
   not sit above/blocking the card links (`pointer-events: none`).
10. **Performance** — the cat's loop is ~10 sprite-offset writes per second, but it now runs
    alongside the WebGL fluid background and the particle trail canvas. Check the frame rate on a
    low-end laptop.
11. **GitHub Pages paths** — this repo is a user page served from the domain root, so the relative
    `assets/oneko.gif` in `data-cat` and the absolute `/js/oneko.js` in `sw.js` both resolve. If
    the site is ever moved to a project page (`/repo/`), the `sw.js` absolute paths break first.
