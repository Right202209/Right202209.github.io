const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:8000';
const EXPECTED_LINKS = [
    'blog/', 'Photo/', 'About/index.html',
    'https://github.com/Right202209', 'Contact/'
];
let browser;

before(async () => {
    browser = await chromium.launch({
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    });
});

after(async () => {
    await browser?.close();
});

async function openPage(options = {}) {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
        serviceWorkers: 'block',
        ...options
    });
    // Exercise the built-in CDN fallback without depending on external services.
    await context.route('https://cdn.jsdelivr.net/**', route => route.abort());
    const page = await context.newPage();
    await page.goto(SITE_URL);
    return { context, page };
}

async function enterPage(page) {
    await page.locator('.enter').click();
    await page.waitForSelector('html.intro-complete .main-shell.in');
}

async function assertNoOverflow(page) {
    const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth
    }));
    assert.ok(dimensions.document <= dimensions.viewport, JSON.stringify(dimensions));
}

test('main panels use flat, opaque frames and an uncropped avatar', async () => {
    const { context, page } = await openPage();
    try {
        await enterPage(page);
        const textHeight = await page.locator('#profile-name').evaluate(heading => {
            const range = document.createRange();
            range.selectNodeContents(heading);
            return range.getBoundingClientRect().height;
        });
        assert.ok(textHeight > 0, 'Browser runtime must have fonts to validate the layout');
        for (const selector of ['.main-shell', '.profile', '.site-nav']) {
            const style = await page.locator(selector).evaluate(element => {
                const css = getComputedStyle(element);
                return {
                    border: css.borderLeftWidth,
                    background: css.backgroundColor,
                    blur: css.backdropFilter,
                    shadow: css.boxShadow
                };
            });
            assert.equal(style.border, '1px', `${selector} needs a fine frame`);
            assert.equal(style.background, 'rgb(30, 31, 33)');
            assert.equal(style.blur, 'none');
            assert.equal(style.shadow, 'none');
        }
        const avatar = await page.locator('.profile-avatar').evaluate(image => ({
            loaded: image.complete && image.naturalWidth > 0,
            width: image.clientWidth,
            height: image.clientHeight,
            fit: getComputedStyle(image).objectFit
        }));
        assert.ok(avatar.loaded);
        assert.ok(avatar.width >= 88);
        assert.equal(avatar.width, avatar.height);
        assert.equal(avatar.fit, 'contain');
    } finally {
        await context.close();
    }
});

test('keyboard entry, navigation destinations and solid selection work', async () => {
    const { context, page } = await openPage();
    try {
        assert.equal(await page.locator('#main-content').evaluate(element => element.inert), true);
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.skip-link').evaluate(element => element === document.activeElement), true);
        await page.keyboard.press('Enter');
        await page.waitForSelector('html.intro-complete .main-shell.in');
        assert.equal(await page.locator('#main-content').evaluate(element => element === document.activeElement), true);
        assert.deepEqual(await page.locator('.site-link').evaluateAll(links =>
            links.map(link => link.getAttribute('href'))), EXPECTED_LINKS);
        await page.keyboard.press('Tab');
        const selected = await page.locator('.site-link').first().evaluate(link => {
            const css = getComputedStyle(link);
            return {
                focused: link === document.activeElement,
                background: css.backgroundColor,
                title: getComputedStyle(link.querySelector('.link-title')).color,
                outline: css.outlineStyle
            };
        });
        assert.ok(selected.focused);
        assert.equal(selected.background, 'rgb(255, 150, 59)');
        assert.equal(selected.title, 'rgb(30, 31, 33)');
        assert.equal(selected.outline, 'solid');
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.site-link').nth(1).evaluate(link => link === document.activeElement), true);
    } finally {
        await context.close();
    }
});

for (const width of [320, 390, 760, 768, 1024, 1440]) {
    test(`panels fit and links remain reachable at ${width}px`, async () => {
        const { context, page } = await openPage({ viewport: { width, height: 900 } });
        try {
            await enterPage(page);
            await assertNoOverflow(page);
            const profile = await page.locator('.profile').boundingBox();
            const nav = await page.locator('.site-nav').boundingBox();
            if (width <= 760) {
                assert.ok(nav.y >= profile.y + profile.height);
                const name = await page.locator('#profile-name').boundingBox();
                const avatar = await page.locator('.profile-avatar').boundingBox();
                assert.ok(name.x + name.width <= avatar.x, 'Name must not overlap the avatar');
            } else {
                assert.ok(nav.x >= profile.x + profile.width);
            }
            for (const link of await page.locator('.site-link').all()) {
                await link.scrollIntoViewIfNeeded();
                assert.ok(await link.isVisible());
                assert.ok((await link.boundingBox()).height >= 44);
            }
            await page.locator('.source-link').scrollIntoViewIfNeeded();
            await assertNoOverflow(page);
        } finally {
            await context.close();
        }
    });
}

test('main content remains usable without JavaScript', async () => {
    const { context, page } = await openPage({ javaScriptEnabled: false });
    try {
        await page.locator('.enter').click();
        assert.ok(await page.locator('.profile-avatar').isVisible());
        assert.equal(await page.locator('.site-link').count(), 5);
        await assertNoOverflow(page);
    } finally {
        await context.close();
    }
});
