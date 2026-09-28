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
const TEST_WIDTHS = [320, 390, 560, 561, 760, 768, 1024, 1440];
const LINKS_STACK_MAX_WIDTH = 760;
const PROFILE_STACK_MAX_WIDTH = 560;
const FIRST_ROW_LINK_COUNT = 3;
const MIN_TOUCH_TARGET = 44;
const MIN_DESKTOP_AVATAR = 240;
const PIXEL_TOLERANCE = 1;
const HIGHLIGHT = 'rgb(245, 243, 239)';
const ON_HIGHLIGHT = 'rgb(30, 31, 33)';
const RETIRED_ORANGE = 'rgb(255, 150, 59)';
const FRAME_SELECTORS = ['.main-shell', '.profile', '.site-nav'];
const TILE_SELECTORS = ['.tile-avatar', '.tile-identity', '.site-link'];
const OPAQUE_RGB = /^rgb\(\d+, \d+, \d+\)$/;
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

function readSurface(element) {
    const css = getComputedStyle(element);
    return {
        border: css.borderLeftWidth,
        background: css.backgroundColor,
        blur: css.backdropFilter,
        filter: css.filter,
        shadow: css.boxShadow,
        opacity: css.opacity
    };
}

async function assertFlatSurfaces(page) {
    for (const selector of FRAME_SELECTORS) {
        const style = await page.locator(selector).evaluate(readSurface);
        assert.equal(style.border, '0px', `${selector} must not draw a frame`);
        assert.equal(style.blur, 'none');
    }
    for (const selector of TILE_SELECTORS) {
        for (const tile of await page.locator(selector).all()) {
            const style = await tile.evaluate(readSurface);
            assert.equal(style.border, '0px', `${selector} must be borderless`);
            assert.match(style.background, OPAQUE_RGB, `${selector} must be opaque`);
            assert.notEqual(style.background, RETIRED_ORANGE);
            assert.deepEqual([style.blur, style.filter, style.shadow, style.opacity], ['none', 'none', 'none', '1']);
        }
    }
    assert.equal(await page.locator('.panel-label, .nav-heading').count(), 0, 'Embedded labels are retired');
}

async function assertBleedAvatar(page) {
    const avatar = await page.locator('.profile-avatar').evaluate(image => ({
        loaded: image.complete && image.naturalWidth > 0,
        fit: getComputedStyle(image).objectFit,
        image: image.getBoundingClientRect().toJSON(),
        tile: image.parentElement.getBoundingClientRect().toJSON()
    }));
    assert.ok(avatar.loaded);
    assert.equal(avatar.fit, 'cover');
    for (const side of ['x', 'y', 'width', 'height']) {
        assert.ok(Math.abs(avatar.image[side] - avatar.tile[side]) <= PIXEL_TOLERANCE, `Avatar must fill its tile (${side})`);
    }
    assert.ok(avatar.tile.width >= MIN_DESKTOP_AVATAR);
    assert.ok(Math.abs(avatar.tile.width - avatar.tile.height) <= PIXEL_TOLERANCE, 'Avatar tile must be square');
}

function readHighlight(link) {
    const css = getComputedStyle(link);
    return {
        focused: link === document.activeElement,
        background: css.backgroundColor,
        title: getComputedStyle(link.querySelector('.link-title')).color,
        outline: css.outlineStyle,
        outlineColor: css.outlineColor
    };
}

test('main tiles are flat, opaque and borderless with a full-bleed avatar', async () => {
    const { context, page } = await openPage();
    try {
        await enterPage(page);
        const textHeight = await page.locator('#profile-name').evaluate(heading => {
            const range = document.createRange();
            range.selectNodeContents(heading);
            return range.getBoundingClientRect().height;
        });
        assert.ok(textHeight > 0, 'Browser runtime must have fonts to validate the layout');
        await assertFlatSurfaces(page);
        await assertBleedAvatar(page);
    } finally {
        await context.close();
    }
});

test('keyboard entry, destinations and monochrome highlights work', async () => {
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
        const focused = await page.locator('.site-link').first().evaluate(readHighlight);
        assert.deepEqual(focused, {
            focused: true, background: HIGHLIGHT, title: ON_HIGHLIGHT,
            outline: 'solid', outlineColor: HIGHLIGHT
        });
        await page.keyboard.press('Tab');
        assert.equal(await page.locator('.site-link').nth(1).evaluate(link => link === document.activeElement), true);
        const lastLink = page.locator('.site-link').last();
        await lastLink.hover();
        const hovered = await lastLink.evaluate(readHighlight);
        assert.equal(hovered.background, HIGHLIGHT);
        assert.equal(hovered.title, ON_HIGHLIGHT);
    } finally {
        await context.close();
    }
});

async function readLayoutBoxes(page) {
    return {
        avatar: await page.locator('.tile-avatar').boundingBox(),
        identity: await page.locator('.tile-identity').boundingBox(),
        name: await page.locator('#profile-name').boundingBox(),
        profile: await page.locator('.profile').boundingBox(),
        nav: await page.locator('.site-nav').boundingBox(),
        links: await Promise.all((await page.locator('.site-link').all()).map(link => link.boundingBox()))
    };
}

function assertProfileLayout(width, boxes) {
    const { avatar, identity, name, profile, nav } = boxes;
    assert.ok(nav.y >= profile.y + profile.height - PIXEL_TOLERANCE, 'Links sit below the profile');
    if (width <= PROFILE_STACK_MAX_WIDTH) {
        assert.ok(identity.y >= avatar.y + avatar.height - PIXEL_TOLERANCE, 'Identity stacks under the avatar');
        return;
    }
    assert.ok(identity.x >= avatar.x + avatar.width - PIXEL_TOLERANCE, 'Identity sits beside the avatar');
    assert.ok(name.x >= avatar.x + avatar.width, 'Name must not overlap the avatar');
}

function assertLinkLayout(width, links) {
    if (width <= LINKS_STACK_MAX_WIDTH) {
        links.slice(1).forEach((link, index) => {
            const previous = links[index];
            assert.ok(Math.abs(link.x - previous.x) <= PIXEL_TOLERANCE, 'Stacked links share a column');
            assert.ok(link.y >= previous.y + previous.height, 'Stacked links do not overlap');
        });
        return;
    }
    const firstRow = links.slice(0, FIRST_ROW_LINK_COUNT);
    firstRow.slice(1).forEach((link, index) => {
        assert.ok(Math.abs(link.y - firstRow[index].y) <= PIXEL_TOLERANCE, 'First row tiles align');
        assert.ok(link.x >= firstRow[index].x + firstRow[index].width, 'First row tiles do not overlap');
    });
    const secondRow = links.slice(FIRST_ROW_LINK_COUNT);
    assert.ok(secondRow.every(link => link.y >= firstRow[0].y + firstRow[0].height), 'Remaining tiles form a second row');
}

for (const width of TEST_WIDTHS) {
    test(`tiles fit and links remain reachable at ${width}px`, async () => {
        const { context, page } = await openPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
        try {
            await enterPage(page);
            await assertNoOverflow(page);
            const boxes = await readLayoutBoxes(page);
            assertProfileLayout(width, boxes);
            assertLinkLayout(width, boxes.links);
            assert.ok(boxes.links.every(link => link.height >= MIN_TOUCH_TARGET));
            await page.locator('.source-link').scrollIntoViewIfNeeded();
            assert.ok(await page.locator('.site-link').last().isVisible());
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
        assert.equal(await page.locator('.site-link').count(), EXPECTED_LINKS.length);
        await assertNoOverflow(page);
    } finally {
        await context.close();
    }
});
