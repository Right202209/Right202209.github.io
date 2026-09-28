# Layout checks

The site still has no build step. These optional browser checks use Node's test
runner and Playwright, with test dependencies kept outside the repository.

```sh
npm install --prefix /tmp/droit-preview playwright
/tmp/droit-preview/node_modules/.bin/playwright install chromium
python3 -m http.server 8000 --bind 127.0.0.1
```

In a second terminal, from the repository root:

```sh
NODE_PATH=/tmp/droit-preview/node_modules node --test tests/layout.test.cjs
```

Set `SITE_URL` to test another local port. If using an existing Chromium install,
set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable. The browser needs its
normal OS runtime libraries (see Playwright's `install-deps chromium` command)
and a working font configuration with sans-serif and monospace fonts installed.
The suite checks that text actually renders, so a fontless runtime cannot silently
pass the layout checks.

The checks cover flat, opaque, borderless tiles, the full-bleed avatar tile,
monochrome keyboard-focus and hover highlights, existing link destinations,
tile stacking at 320–1440px (including the 560/561 and 760/768 breakpoints),
and no-JavaScript access. External CDN requests and the service worker are disabled
in these tests so the checks are deterministic and exercise the site's fallback.
The live animation and service-worker update should also be checked manually.
