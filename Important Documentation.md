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
