const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const SITE_URL = process.env.SITE_URL || 'http://127.0.0.1:8000';
const EXPECTED_LINKS = [
    'blog/', 'Photo/', 'About/index.html',
    'https://github.com/Right202209', 'Contact/'
];
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const VIEWPORT_HEIGHT = 900;
const TEST_WIDTHS = [320, 390, 760, 768, 1023, 1024, 1440];
const DESCRIPTION_BELOW_MAX_WIDTH = 1023;
const MIN_TOUCH_TARGET = 44;
const CAPTURE_WAIT_MS = 2000;
const PIXEL_TOLERANCE = 1;
const HIGHLIGHT = 'rgb(245, 243, 239)';
const ON_HIGHLIGHT = 'rgb(30, 31, 33)';
const CLEAR = 'rgba(0, 0, 0, 0)';
const PAINT_SOURCE = /url\("blob:|radial-gradient/;
const PAINTED_SELECTORS = ['.wordmark', '.link-title'];
const RETIRED_SELECTORS = '.profile-avatar, #signature, .profile-note, .panel-label, .tile-identity';
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
        viewport: DESKTOP_VIEWPORT,
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

function readPaint(element) {
    const css = getComputedStyle(element);
    return {
        clip: css.backgroundClip,
        fill: css.webkitTextFillColor,
        image: css.backgroundImage,
        attachment: css.backgroundAttachment
    };
}

function readRow(link) {
    const css = getComputedStyle(link);
    return {
        focused: link === document.activeElement,
        background: css.backgroundColor,
        title: getComputedStyle(link.querySelector('.link-title')).webkitTextFillColor,
        outline: css.outlineStyle,
        outlineColor: css.outlineColor,
        border: css.borderLeftWidth,
        shadow: css.boxShadow,
        blur: css.backdropFilter
    };
}

async function assertPainted(page) {
    for (const selector of PAINTED_SELECTORS) {
        for (const element of await page.locator(selector).all()) {
            const paint = await element.evaluate(readPaint);
            assert.equal(paint.clip, 'text', `${selector} letters must be clipped to the paint`);
            assert.equal(paint.fill, CLEAR);
            assert.equal(paint.attachment, 'fixed', 'Paint is pinned to the viewport like the fluid');
            assert.match(paint.image, PAINT_SOURCE);
        }
    }
}

test('the main page is a painted link list without cards or retired identity blocks', async () => {
    const { context, page } = await openPage();
    try {
        await enterPage(page);
        const textHeight = await page.locator('.link-title').first().evaluate(title => {
            const range = document.createRange();
            range.selectNodeContents(title);
            return range.getBoundingClientRect().height;
        });
        assert.ok(textHeight > 0, 'Browser runtime must have fonts to validate the layout');
        assert.equal(await page.locator(RETIRED_SELECTORS).count(), 0);
        await assertPainted(page);
        for (const link of await page.locator('.site-link').all()) {
            const row = await link.evaluate(readRow);
            assert.deepEqual([row.background, row.border, row.shadow, row.blur], [CLEAR, '0px', 'none', 'none']);
        }
    } finally {
        await context.close();
    }
});

test('the paint note appears only when the intro frame was captured', async () => {
    const { context, page } = await openPage();
    try {
        await enterPage(page);
        // Capture needs WebGL; headless runs may lack it, so either outcome is valid if consistent.
        await page.waitForFunction(() => !document.querySelector('.paint-note').hidden, null,
            { timeout: CAPTURE_WAIT_MS }).catch(() => {});
        const state = await page.evaluate(() => ({
            noteVisible: !document.querySelector('.paint-note').hidden,
            inlinePaint: document.querySelector('.content-main').style.getPropertyValue('--paint'),
            titleImage: getComputedStyle(document.querySelector('.link-title')).backgroundImage
        }));
        if (state.noteVisible) {
            assert.match(state.inlinePaint, /^url\("blob:/);
            assert.match(state.titleImage, /^url\("blob:/);
        } else {
            assert.equal(state.inlinePaint, '');
            assert.match(state.titleImage, /radial-gradient/);
        }
    } finally {
        await context.close();
    }
});

test('keyboard entry, destinations and monochrome row highlights work', async () => {
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
        const focused = await page.locator('.site-link').first().evaluate(readRow);
        assert.deepEqual(
            [focused.focused, focused.background, focused.title, focused.outline, focused.outlineColor],
            [true, HIGHLIGHT, ON_HIGHLIGHT, 'solid', ON_HIGHLIGHT]
        );
        const lastLink = page.locator('.site-link').last();
        await lastLink.hover();
        const hovered = await lastLink.evaluate(readRow);
        assert.equal(hovered.background, HIGHLIGHT);
        assert.equal(hovered.title, ON_HIGHLIGHT);
    } finally {
        await context.close();
    }
});

function readRowGeometry(link) {
    const box = element => element.getBoundingClientRect().toJSON();
    const title = link.querySelector('.link-title');
    const range = document.createRange();
    range.selectNodeContents(title);
    return {
        link: box(link),
        title: box(title),
        description: box(link.querySelector('.link-description')),
        titleLines: new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size
    };
}

function assertRowLayout(width, rows) {
    rows.forEach((row, index) => {
        assert.ok(row.link.height >= MIN_TOUCH_TARGET);
        assert.equal(row.titleLines, 1, 'Titles must stay on one line');
        if (index > 0) assert.ok(row.link.y >= rows[index - 1].link.y + rows[index - 1].link.height - PIXEL_TOLERANCE);
        if (width <= DESCRIPTION_BELOW_MAX_WIDTH) {
            assert.ok(row.description.y >= row.title.y + row.title.height - PIXEL_TOLERANCE, 'Description sits under the title');
        } else {
            assert.ok(row.description.x >= row.title.x + row.title.width, 'Description sits beside the title');
        }
    });
}

for (const width of TEST_WIDTHS) {
    test(`painted rows fit and stay reachable at ${width}px`, async () => {
        const { context, page } = await openPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
        try {
            await enterPage(page);
            await assertNoOverflow(page);
            const rows = [];
            for (const link of await page.locator('.site-link').all()) {
                rows.push(await link.evaluate(readRowGeometry));
            }
            assertRowLayout(width, rows);
            await page.locator('.source-link').scrollIntoViewIfNeeded();
            assert.ok(await page.locator('.site-link').last().isVisible());
            await assertNoOverflow(page);
        } finally {
            await context.close();
        }
    });
}

test('main content remains usable and painted without JavaScript', async () => {
    const { context, page } = await openPage({ javaScriptEnabled: false });
    try {
        await page.locator('.enter').click();
        assert.equal(await page.locator('.site-link').count(), EXPECTED_LINKS.length);
        assert.ok(await page.locator('.site-link').first().isVisible());
        assert.match(await page.locator('.link-title').first().evaluate(title =>
            getComputedStyle(title).backgroundImage), /radial-gradient/);
        assert.equal(await page.locator('.paint-note').isVisible(), false);
        await assertNoOverflow(page);
    } finally {
        await context.close();
    }
});
