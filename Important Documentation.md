# Important Documentation

## Main page redesign: solid block grid (monochrome)

The previous main page (fine 1px frames, labels cut into the frame lines, a small
framed avatar, solid orange hover/focus fills) has been replaced by a flat grid of
opaque, borderless tiles. No glass, blur, shadows or semi-transparent surfaces.

### Files

| File | Purpose |
| --- | --- |
| `css/style.css` | Shared tokens, base rules, `whiteShadow` keyframe, reduced motion. Also loaded by `404.html`. |
| `css/intro.css` | Intro screen (title, subtitle, enter link, arrows, SVG reveal). |
| `css/main.css` | Tile grid, avatar tile, identity tile, link tiles, footer. |
| `css/responsive.css` | Breakpoints for the tile grid. |
| `index.html` | Main markup restructured into `.tile-avatar`, `.tile-identity` and link tiles; loads all four stylesheets. |
| `sw.js` | Cache bumped to `droit-v4`; new stylesheets added to the precache list. |
| `js/mouse-trail.js` | Particle colour changed from orange to the monochrome highlight. |

`style.css` was split because the old file (763 lines) exceeded the 300-line limit.

### Layout

- **≥ 1024px**: 6-column grid. Avatar tile spans 2 columns (square, image fills it
  with `object-fit: cover`), identity tile spans 4. Links: three tiles, then two.
- **761–1023px**: profile becomes two equal columns; links stay 3 + 2.
- **≤ 760px**: links stack into one column of compact rows (≥ 88px tall).
- **≤ 560px**: avatar and identity tiles stack; the avatar becomes a full-width square.

Tiles use solid greys `#26272b`, `#303136`, `#393a3f` on the `#1e1f21` page.
Hover and keyboard focus invert a link tile to `#f5f3ef` with `#1e1f21` text; focus
adds a 2px solid `#f5f3ef` outline offset 3px into the tile gap. Orange is removed
from the site (selection, focus rings, enter link, source link, cursor trail).

## Items that need testing / verification

These were not run (per project rules). Verify in a browser:

1. **Automated suite** — `tests/layout.test.cjs` was rewritten for the new design.
   Run it as described in `tests/README.md`. It checks: borderless opaque tiles,
   no embedded labels, full-bleed square avatar at 1440px, monochrome focus/hover,
   link destinations, stacking at 320/390/560/561/760/768/1024/1440px, no-JS access.
2. **Avatar squareness at mid widths** — the avatar tile is square only while the
   identity tile's content is no taller than the avatar is wide. If the fallback font
   renders much larger than expected (e.g. near 561px or 1024px), the row grows and the
   avatar is cropped slightly (`object-position: 50% 30%` keeps the face). Check visually.
3. **Contrast** — muted text `#a4a5a7` on the lightest tile `#393a3f` is ~4.6:1
   (calculated, not measured). Confirm with a contrast checker.
4. **Focus ring visibility** — the outline sits in the 8–12px gap between tiles;
   confirm it isn't clipped at the page edges on mobile.
5. **Service worker** — on a browser that already has `droit-v3`, reload and confirm
   the new CSS is served (cache-first strategy; the version bump should evict v3).
6. **404 page** — still loads `css/style.css`; confirm the title glow still animates
   and nothing else changed visually.
7. **Intro → main transition** — the anime.js reveal and `.fade` entry on `.main-shell`
   are unchanged but should be checked with the CDN available.

## Dependencies (not installed)

Only needed for the optional test suite: `playwright` and its Chromium build
(see `tests/README.md`). The site itself has no build step or dependencies.
