# Important Documentation

## Main page: letters painted with the intro's fluid

The intro's WebGL fluid is no longer thrown away when the visitor enters. At the
moment of entering, `js/paint.js` freezes the current frame into an image, and the
main page's letters become windows onto it. The image is pinned to the viewport
(`background-attachment: fixed`), so colours sit exactly where the fluid was on
screen. Every visit paints the page differently.

The avatar, name block, signature ("Code & Input & Output") and note ("An Ignorant
Learner") were removed. The intro's "Droit" title carries over as a small painted
wordmark, which is also the page's `<h1>`. No glass, blur, shadows or cards: rows
have no surface until hovered or focused.

### How it works

1. `main.js` → `switchPage()` calls `window.captureIntroPaint()` before the intro
   slides away (the canvas is removed afterwards in `finishIntro()`).
2. `paint.js` calls the fluid sim's global `render(null)` and copies the canvas into
   a 2D canvas in the same task. This is required because the WebGL context uses
   `preserveDrawingBuffer: false`.
3. The copy is drawn over a solid `#8a8b8e` base with `lighten` compositing. Every
   channel is lifted to at least that grey, so letters keep ≥ 4.75:1 contrast on
   `#1e1f21`, however dark the fluid was.
4. The result becomes a blob URL set as `--paint` on `.content-main`, and the footer
   shows "Letters painted with the fluid you stirred · HH:MM".
5. With a fine pointer and no reduced-motion preference, the paint drifts ±12px
   with the cursor (rAF-throttled), echoing the fluid's pointer interaction.

**Fallbacks:** no JS, no WebGL, or a failed read-back all keep the opaque
multi-colour gradient defined in `css/main.css`, and the paint note stays hidden.
Browsers without `background-clip: text` show solid off-white titles.

### Layout

- Five full-width rows: number · giant title · description · arrow.
- **≤ 1023px:** the description moves under the title; the keyboard hint hides.
- **≤ 760px:** smaller gutters; titles scale `clamp(2rem, 11vw, 3.4rem)`.
- Hover: the row becomes a solid `#f5f3ef` band with dark letters (monochrome, as
  decided earlier). Keyboard focus adds a dark 2px ring inset 8px inside the band.
- Rows fade up in a 70ms stagger after the intro sweep (skipped under reduced motion).

### Files

| File | Change |
| --- | --- |
| `index.html` | New main markup; `window.signature` line removed (its element is gone); loads `js/paint.js`. |
| `js/paint.js` | New. Capture, contrast floor, paint application, pointer drift. |
| `js/main.js` | One line: calls `captureIntroPaint()` at the start of `switchPage()`. |
| `css/main.css`, `css/responsive.css` | Rewritten for the painted list. |
| `css/style.css`, `css/intro.css` | Shared base and intro (split earlier from the 763-line `style.css`). |
| `sw.js` | Cache `droit-v4`; precaches the split stylesheets and `js/paint.js`. |
| `js/mouse-trail.js` | Particles are off-white instead of orange. |

## Items that need testing / verification

None of this was run (per project rules). Verify in a browser:

1. **Capture works:** enter the site after stirring the fluid. The titles should show
   those colours in the same screen positions, and the footer note should appear.
   Check Chrome, Firefox and Safari. If the letters are grey only, the read-back
   returned a blank buffer; report the browser.
2. **`background-attachment: fixed` + `background-clip: text`:** iOS Safari ignores
   `fixed`. There, each title shows the whole image scaled to its own box. This is
   acceptable, but check it looks intentional.
3. **Reduced motion:** the fluid stops after its first frame, so the captured paint
   is whatever that frame held. Check it isn't just flat grey.
4. **Titles fit on one line** at 320px ("Contact" and "Github" are the longest).
   The test suite asserts this, but it depends on the installed display font.
5. **Scroll performance:** fixed backgrounds on text repaint on scroll. Check for jank
   on a low-end phone.
6. **Automated suite:** `tests/layout.test.cjs`; see `tests/README.md`.
7. **Service worker:** a browser with the old `droit-v3` cache should receive the new
   files after one reload.
8. **404 page:** unchanged, still loads `css/style.css`. Confirm the title glow.

## Dependencies (not installed)

Only the optional test suite needs `playwright` and its Chromium build. The site
has no build step.
