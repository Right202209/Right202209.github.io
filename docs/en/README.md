# Stoa Guide

> A quiet study. Here are the keys.

[中文](../zh-CN/README.md) · [Back to README](../../README.md)

This guide covers everything the theme does: running it locally, writing your first post, the bilingual setup, the Social page, the cursors and the cat, and deploying to GitHub Pages. One pass takes about fifteen minutes. After that, keep it around as a reference.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Project layout](#2-project-layout)
3. [Site settings: `_config.yml`](#3-site-settings-_configyml)
4. [Bilingual: Chinese and English](#4-bilingual-chinese-and-english)
5. [Writing posts](#5-writing-posts)
6. [Reading](#6-reading)
7. [Home: About and Notes](#7-home-about-and-notes)
8. [Life and custom pages](#8-life-and-custom-pages)
9. [Social page](#9-social-page)
10. [Look and feel: colors, fonts, avatar, icons](#10-look-and-feel-colors-fonts-avatar-icons)
11. [Custom cursors](#11-custom-cursors)
12. [The oneko cat](#12-the-oneko-cat)
13. [Search (⌘K)](#13-search-k)
14. [RSS, SEO and sitemap](#14-rss-seo-and-sitemap)
15. [Deploying to GitHub Pages](#15-deploying-to-github-pages)
16. [FAQ](#16-faq)
17. [Automation: publish from issues, translate automatically](#17-automation-publish-from-issues-translate-automatically)

---

## 1. Quick start

### Requirements

- Ruby 3.x (3.2 or newer recommended)
- Bundler: `gem install bundler`
- Git

On macOS, install Ruby with [rbenv](https://github.com/rbenv/rbenv) or Homebrew rather than using the system Ruby. On Windows, use [RubyInstaller](https://rubyinstaller.org/) (the build with DevKit).

### Run locally

```bash
git clone https://github.com/Right202209/Right202209.github.io.git
cd Right202209.github.io
bundle install
bundle exec jekyll serve --livereload
```

Open <http://localhost:4000>. The page reloads whenever you save a file.

> Changes to `_config.yml` need a restart of `jekyll serve`. Jekyll does not reload its config.

### Build without serving

```bash
bundle exec jekyll build      # output goes to _site/
```

---

## 2. Project layout

```text
.
├── _config.yml          site settings: name, languages, collections, plugins
├── _data/
│   ├── i18n.yml         UI strings, navigation and date formats per language
│   ├── news.yml         home page Notes, grouped by language
│   └── social.yml       links on the Social page
├── _includes/           partials (header, footer, search, language logic, social cards)
├── _layouts/            default / home / page / post / reading
├── _posts/              Chinese posts
│   └── en/              English posts
├── _reading/            Reading entries in Chinese
│   └── en/              Reading entries in English
├── _sass/               styles (variables, base, layout, syntax, cursor)
├── assets/
│   ├── css/             main.scss, plus default.cur / pointer.cur
│   ├── img/             avatar, favicon, oneko sprite sheet
│   └── js/              main.js (theme + search), oneko.js
├── index.md             Chinese home page (About)
├── blog/ reading/ life/ social/      Chinese pages
├── en/                  English pages (mirrors the Chinese structure)
├── search.json          search index
└── docs/                this guide (never published to the site)
```

`_data/reading.yml` is left over from the old Reading list. Reading now uses the `_reading/` collection, nothing reads that file any more, and you can delete it.

---

## 3. Site settings: `_config.yml`

The fields you will touch most:

| Field | What it does | Example |
| --- | --- | --- |
| `title` | Site name, shown at the left of the nav and as the home page heading | `Droit` |
| `author` | Author name, used in the footer and SEO | `Droit` |
| `email` | Contact email | `right202601@gmail.com` |
| `description` | Site summary for SEO and RSS | `"A small place to think slowly."` |
| `url` | Full site origin. **Fill it in before deploying** | `https://right202209.github.io` |
| `baseurl` | Sub-path. Leave empty for a user site | `""` |
| `lang` | Default language, served at `/` | `zh-CN` |
| `languages` | All languages; the first is the default | `[zh-CN, en]` |
| `timezone` | Time zone for post dates | `Asia/Shanghai` |
| `avatar` | Home page avatar | `/assets/img/avatar.svg` |
| `home.news_limit` | How many Notes the home page shows | `3` |
| `home.posts_limit` | How many recent posts the home page shows | `5` |

### Filling in `url` and `baseurl`

- Repo named `username.github.io` (like this one): `url: https://right202209.github.io`, `baseurl: ""`
- Repo with any other name, say `blog`: `url: https://username.github.io`, `baseurl: /blog`
- Custom domain: `url: https://example.com`, `baseurl: ""`

Every link in the theme goes through the `relative_url` filter, so a correct `baseurl` is all a sub-path deployment needs.

### `defaults`

This block gives files properties based on their folder. You rarely need to change it:

- Every page defaults to `lang: zh-CN`.
- Posts in `_posts/en/` get `lang: en` and live at `/en/blog/year/title/`.
- Entries in `_reading/` use the `reading` layout.
- Entries in `_reading/en/` get `lang: en` and live at `/en/reading/filename/`.
- Pages under `en/` get `lang: en`.

---

## 4. Bilingual: Chinese and English

### Rule 1: Chinese at `/`, English at `/en/`

| Content | Chinese | English |
| --- | --- | --- |
| Home | `index.md` | `en/index.md` |
| Post list | `blog/index.html` | `en/blog/index.html` |
| Posts | `_posts/*.md` | `_posts/en/*.md` |
| Reading | `_reading/*.md` | `_reading/en/*.md` |
| Life | `life/index.md` | `en/life/index.md` |
| Social | `social/index.html` | `en/social/index.html` |

### Rule 2: same content, same `ref`

The language button at the right of the nav looks for a page with the same `ref` in the other language and jumps straight to it. If it finds none, it goes to the other language's home page.

```yaml
# _posts/2026-10-01-on-beginning-again.md
ref: beginning

# _posts/en/2026-10-01-on-beginning-again.md
ref: beginning
```

A `ref` can be any short word. It only has to match across the two languages and be unique on the site.

### Rule 3: every UI string lives in `_data/i18n.yml`

One block per language:

| Field | What it does |
| --- | --- |
| `label` / `switch_label` | Text on the language button |
| `home` | That language's home URL |
| `nav` | Navigation items, in order |
| `alias` | The alias under your name on the home page |
| `tagline` | The epigraph at the bottom of the home page |
| `avatar_caption` | Caption under the avatar |
| `notes` / `latest` | Headings of the two home page sections |
| `minutes` | Reading-time unit |
| `search_placeholder` / `search_empty` | Search placeholder and empty-result text |
| `footer` | The line in the footer |
| `date_long` / `date_short` / `date_month` | Date formats ([strftime syntax](https://strftime.org/)) |
| `read_original` | The "Read the original" link on Reading entries |

> Use a hyphen in language codes: `zh-CN`, never `zh_CN`.

### English only (or Chinese only)?

Set `languages` in `_config.yml` to a single language, delete the other language's folders (`en/`, `_posts/en/`, `_reading/en/`), and remove the `lang-switch` line from `_includes/header.html`. To make English the default at `/`, set `lang: en` and swap the content of the Chinese and English files.

---

## 5. Writing posts

### Create one

Add a file to `_posts/`. The filename **must** follow `YYYY-MM-DD-short-title.md`:

```text
_posts/2026-10-08-a-quiet-morning.md
```

The date in the filename is the publish date, and the short title becomes part of the URL (`/blog/2026/a-quiet-morning/`). Keep it in plain ASCII so the URL stays readable.

### Front matter

```yaml
---
title: A Quiet Morning
description: A one-line summary, shown under the title and in the post list.
tags: [essay, life]
ref: quiet-morning
---

The post starts here.
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | Yes | Post title |
| `description` | No | Summary under the title, in the list, and for SEO |
| `tags` | No | Shown next to the date |
| `ref` | No | Links the post to its translation |
| `date` | No | For an exact time, e.g. `2026-10-08 09:30:00 +0800` |

You don't need `layout`; posts use `post` by default.

### English posts

Put them in `_posts/en/`, written exactly the same way, with the same `ref` as the Chinese version:

```text
_posts/en/2026-10-08-a-quiet-morning.md
```

### Drafts

Create a `_drafts/` folder. Drafts there need no date in the filename. Preview them with:

```bash
bundle exec jekyll serve --drafts
```

A normal build never publishes `_drafts/`.

### Images

Keep them in `assets/img/posts/` and reference them like this:

```markdown
![Alt text]({{ '/assets/img/posts/morning.jpg' | relative_url }})
```

External images (Unsplash, say) can use their full URL.

### Code

Use fenced code blocks with a language:

````markdown
```python
print("hello")
```
````

Colors live in `_sass/_syntax.scss` and switch with dark mode.

### Added to every post automatically

- The date, in the `date_long` format from `i18n.yml`
- Reading time (words ÷ 220 + 1 minutes)
- Previous / next links, within the same language only

---

## 6. Reading

Reading works like posts: one Markdown file per piece.

### Create one

```text
_reading/walden.md          Chinese
_reading/en/walden.md       English
```

The filename is the URL: `/reading/walden/` and `/en/reading/walden/`.

### Front matter

```yaml
---
title: Walden
author: Henry David Thoreau
date: 2026-05-20
description: A man walks into the woods to see what it means to have lived.
source: https://en.wikipedia.org/wiki/Walden
ref: walden
---

Your notes, a quote, or a single sentence.
```

| Field | Notes |
| --- | --- |
| `title` | Book or article title |
| `author` | Author |
| `date` | When you read it; used to sort and group by year |
| `description` | One-line take, shown in the list |
| `source` | Link to the original; adds "Read the original →" at the bottom |
| `ref` | Links it to its translation |

The list is sorted newest first and grouped by year. Entries are included in search.

---

## 7. Home: About and Notes

### About

The home page is `index.md` (English: `en/index.md`) with the `home` layout. The body under the front matter is your About text, in Markdown.

From top to bottom the home page shows: site name → alias → About → avatar → Notes → latest posts → epigraph.

### Notes

Edit `_data/news.yml`, grouped by language, newest first:

```yaml
zh-CN:
  - date: 2026-10-08
    text: "今天学会了等待。"
en:
  - date: 2026-10-08
    text: "Learned to wait today. [First post](/en/blog/2026/on-beginning-again/) is up."
```

`text` accepts inline Markdown (links, bold, italics). `home.news_limit` in `_config.yml` sets how many show.

---

## 8. Life and custom pages

### Life

`life/index.md` and `en/life/index.md` use the `page` layout. Put anything there: photos, lists, a paragraph.

```yaml
---
oneko: true            # summons the cat, see section 12
ref: life
layout: page
title: Life
description: What remains when the screen is off.
---
```

### Add a page

Say you want a Projects page:

1. Create `projects/index.md`:

   ```yaml
   ---
   layout: page
   title: 项目
   ref: projects
   description: 亲手做过的小东西。
   ---
   ```

2. Create `en/projects/index.md` with `ref: projects` and `title: Projects`.
3. Add one line to each `nav` in `_data/i18n.yml`:

   ```yaml
   - { title: 项目, url: /projects/ }        # zh-CN
   - { title: Projects, url: /en/projects/ } # en
   ```

The active nav item is worked out from the current URL; nothing else to set.

---

### Life in Weeks

A pluggable module ported from [weeks.ginatrapani.org](https://weeks.ginatrapani.org). It uses no Bootstrap and no jQuery, just CSS Grid, and its few dozen lines of script live in `assets/js/main.js`. Week numbers, ages, decades, phases, places, seasons and events are all worked out in Liquid at build time, so the page has no runtime library dependencies.

**Switches and plugging in.** Everything lives in `_data/weeks.yml`.

| Setting | Effect |
| --- | --- |
| `enabled: false` | Turns the whole module off: the entry row, the weeks page and the search entries disappear (the weeks page redirects to Life) |
| `entry: false` | Hides only the entry row on the Life page |
| `view: grid` / `timeline` | The default view. A visitor's own choice is remembered in their browser |
| `hemisphere: north` / `south` | Which hemisphere the season ticks follow |

Two includes work on any page:

- `{% include weeks/entry.html %}`: an entry card. On the left is a miniature of the whole life, one square per year: lived years in ink, this year in clay with a slow pulse, years to come in light grey. On the right it reads "This is week N of my life", with "of about M · x% lived" below. On hover the card lifts and the lived years turn clay one after another. The numbers are corrected to the visitor's date.
- The weeks page opens with three large numbers (weeks lived, % of a life, weeks left) and a life bar notched by decade.
- The boxes reflow with the window. Each decade is one wrapping stream of boxes; every box has a minimum width and grows to fill its row. That gives about 26 a row on wide screens, 21 on tablets and 13 on phones. Each decade is labelled: "The first decade", "Teens", "20s", and so on.
- `{% include weeks/view.html %}`: the full module, with the grid, the timeline and the switch

To remove it completely, delete `_data/weeks.yml`, `_includes/weeks/`, `_layouts/weeks.html`, `_sass/_weeks.scss`, `life/weeks.md` and `en/life/weeks.md`, then drop `@import "weeks"` from `main.scss`.

**Grid view.** One row per year of age, one cell per week (53 columns).

- The fill shows the phase of life (`eras`); the border shows where you lived (`places`)
- Season bands and boundary posts, split at the four "start of season" solar terms (see Season borders below)
- This week is highlighted; future weeks are empty
- Hover or tap a cell for "date · age, week · phase, in place · event"
- That year's events are listed at the end of the row

**Timeline view.** A horizontal axis of a life, with nodes for birth, each event, now and life expectancy.

- Every node has a dot and a date label; labels alternate above and below, near and far, so they don't crowd each other
- The "Now" node is highlighted automatically; if an event falls this week, that event is highlighted instead
- Dots grow and glow on hover; clicking an event's dot switches to the grid and jumps to its week
- Add `line: true` to an event for a vertical marker
- Nodes fade in one after another; on phones the timeline turns vertical

**Season borders.** Seasons are split at the four Chinese "start of season" solar terms (立春, 立夏, 立秋, 立冬), not by month. Every box has a 2px season band along its bottom, so each row reads as a ribbon of the year: spring green, summer wheat, autumn clay, winter frost blue. The week a season begins gets a post of the same color on its left, and its tooltip names the term and its date, for example "Start of Autumn Aug 07". The dates come from `_data/solar_terms.yml`, computed from the sun's apparent ecliptic longitude (315°, 45°, 135°, 225°, Beijing time) for 1900 to 2150; there is no need to edit it. Set `hemisphere: south` to shift the seasons by half a year.

**Private events.** A week with `private: true` is drawn sealed: fine hatching like a redacted line, and one solid dot inside a seal ring. Its tooltip only says "🔒 Private"; it shows no text and stays out of search. On the timeline it is just a ringed dot.

**Events**

```yaml
events:
  - { date: 2017-06-30, emoji: "🎓", zh: 大学毕业, en: Graduated, line: true }
  - { date: 2021-04-02, private: true }   # a solid dot only: no text, not searchable
```

`zh` is used on the Chinese pages and `en` on `/en/`; if one is missing, the other is used.

**Search.** Every public event is written into `search.json`. Press ⌘K, search "Graduated", and you land on that week, which flashes three times.

`eras` and `places` can start at an `age:` (years) or a `start:` (date).

> Your birthday and every non-private event are public. The events in `_data/weeks.yml` are only examples; replace them with your own.

## 9. Social page

Edit `_data/social.yml`. Links are shared by both languages; only `note` can differ per language.

```yaml
- name: GitHub
  icon: github
  handle: Right202209
  url: https://github.com/Right202209
  note: { zh-CN: 写给机器的那部分。, en: The part written for machines. }
```

| Field | Notes |
| --- | --- |
| `name` | Display name |
| `icon` | A [Simple Icons](https://simpleicons.org/) slug: `github`, `x`, `instagram`, `xiaohongshu`, `bilibili`, `zhihu`, `weibo`, `telegram`, `douban`, `spotify`… |
| `handle` | Account name; shown when there is no `note` |
| `url` | Full link; starting with `/` stays on the site; `mailto:` works too |
| `note` | One short line per language (optional) |
| `hidden` | `true` hides the entry |

External links open in a new tab and carry `rel="me"`, which platforms such as Mastodon use for identity verification.

> X and Instagram still point at placeholder accounts (`your-x`, `your-ins`). Replace them or set `hidden: true`.

### Can't find an icon?

Search for the platform on [simpleicons.org](https://simpleicons.org/) and open its icon; the slug on that page is the value to use. Icons load from jsDelivr (`cdn.jsdelivr.net/npm/simple-icons@13`) and take the theme's ink color, so they stay legible in dark mode.

---

## 10. Look and feel: colors, fonts, avatar, icons

### Colors and fonts

All in `_sass/_variables.scss`:

| Variable | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `#faf9f5` | `#1a1916` | Background (paper) |
| `--surface` | `#f0eee6` | `#24231f` | Cards, code blocks |
| `--ink` | `#141413` | `#ece9e0` | Body text (ink) |
| `--muted` | `#6b6a64` | `#9a978d` | Secondary text |
| `--line` | `#e3dfd3` | `#34322c` | Rules and borders |
| `--accent` | `#d97757` | `#e08a6b` | Accent (clay) |

Headings use `--serif` (Newsreader), body text `--sans` (Inter), code `--mono` (JetBrains Mono). Chinese falls back to Songti / PingFang. If you change fonts, update the Google Fonts link in `_includes/head.html` too.

### Dark mode

- The first visit follows the system setting.
- The sun icon in the nav toggles it, and the choice is remembered in the browser.

### Avatar

Replace `assets/img/avatar.svg`. For a photo such as `avatar.jpg`, also update `_config.yml`:

```yaml
avatar: /assets/img/avatar.jpg
```

Delete the `avatar` line to hide it.

### Favicon and logo

- Browser tab icon: `assets/img/favicon.svg` (dark-mode aware)
- The D mark at the left of the nav: inline `<svg class="mark">` in `_includes/header.html`

They share one design; change one, change the other.

---

## 11. Custom cursors

The whole site uses custom cursors:

```text
assets/css/default.cur    regular cursor
assets/css/pointer.cur    hand cursor on links and buttons
```

Styles live in `_sass/_cursor.scss`:

- The page uses `default.cur`.
- Links, buttons, checkboxes, selects and other clickable elements use `pointer.cur`.
- Inputs and text areas keep the system text cursor, so typing still feels right.

### Use your own

Overwrite the two files with the same names. PNG works too; change the paths in `_cursor.scss`:

```scss
:root {
  --cursor-default: url("my-cursor.png") 4 4, auto;   /* 4 4 is the hotspot */
  --cursor-pointer: url("my-pointer.png") 8 2, pointer;
}
```

Keep them around 32×32 and never larger than 128×128, or browsers ignore them.

### Turn them off

Remove `@import "cursor";` from `assets/css/main.scss`. If a file is missing, the browser simply falls back to the system cursor.

---

## 12. The oneko cat

A pixel cat that chases your mouse, and scratches or naps when you stop.

### Enable it on a page

Add one line to the page's front matter:

```yaml
oneko: true
```

It's currently on the Chinese and English Life pages. For the whole site, change the first entry under `defaults` in `_config.yml` to:

```yaml
  - scope: { path: "" }
    values: { lang: zh-CN, oneko: true }
```

### Files

- Script: `assets/js/oneko.js` (from [adryd325/oneko.js](https://github.com/adryd325/oneko.js))
- Sprite sheet: `assets/img/oneko.png`, **256×128**, 8 columns × 4 rows of 32×32 frames

To swap cats, overwrite `oneko.png` with a sheet in the same layout. The original sheet (`oneko.gif`) is in the oneko.js repo.

### Behavior

- Hidden when the system has Reduce Motion turned on.
- Never blocks clicks (`pointer-events: none`).
- Starts from the top-left corner on every page load (`data-persist-position="false"`). To have it remember where it was, set that attribute to `"true"` in `_layouts/default.html`.
- Touch devices send no mouse movement, so the cat just sits quietly.

---

## 13. Search (⌘K)

- Press `⌘K` (`Ctrl+K` on Windows / Linux) or click the `⌘K` button in the nav.
- Results appear as you type. `↑` `↓` to move, `Enter` to open, `Esc` to close.
- Searches the current language only, across all posts and Reading entries.
- The index is `search.json`, generated at build time from titles and the first 60 words of each body.

Pure front end, no third-party service.

---

## 14. RSS, SEO and sitemap

Three plugins handle these with no setup:

| Plugin | Produces |
| --- | --- |
| `jekyll-feed` | `/feed.xml` |
| `jekyll-seo-tag` | `<title>`, description, Open Graph, Twitter Card |
| `jekyll-sitemap` | `/sitemap.xml` |

They need `url` set in `_config.yml`; otherwise their links stay relative.

To give one post a share image:

```yaml
image: /assets/img/posts/cover.jpg
```

---

## 15. Deploying to GitHub Pages

The `Gemfile` pins Jekyll 4.3, while GitHub Pages' classic build always uses Jekyll 3.x and ignores your `Gemfile`. Build with **GitHub Actions** instead, so production matches your local build exactly.

### Step 1: repo settings

Repo → **Settings** → **Pages** → **Build and deployment** → set **Source** to **GitHub Actions**.

### Step 2: the workflow

The repo already ships `.github/workflows/pages.yml`. For reference (copy it into a new project as is):

```yaml
name: Deploy Jekyll site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.3"
          bundler-cache: true
      - id: pages
        uses: actions/configure-pages@v5
      - run: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}"
        env:
          JEKYLL_ENV: production
      - uses: actions/upload-pages-artifact@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

If your default branch isn't `main`, change the `branches` line.

### Step 3: push

```bash
git add .
git commit -m "Deploy"
git push
```

Watch progress in the repo's **Actions** tab. When it finishes, visit `https://right202209.github.io`.

### Custom domain

1. Add a `CNAME` file at the root containing just the domain, e.g. `blog.example.com`.
2. At your DNS provider, add a CNAME record pointing to `right202209.github.io`.
3. Set `url` in `_config.yml` to `https://blog.example.com`.
4. In **Settings → Pages**, tick **Enforce HTTPS**.

---

## 16. FAQ

**I changed `_config.yml` and nothing happened.**
Restart `bundle exec jekyll serve`.

**The language button always goes to the home page.**
Check that both versions have exactly the same `ref`, and that the translation sits in the right folder (`_posts/en/`, `en/`).

**Chinese posts always show "1 min".**
Jekyll counts words by spaces. In `_layouts/post.html`, change `number_of_words` to `number_of_words: "auto"` (Jekyll 4.2+) so CJK text is counted per character. Chinese reads at roughly 300 to 500 characters a minute, so you may also want a bigger divisor than `220`.

**A social icon doesn't show.**
Check the slug's spelling and that it exists on simpleicons.org. Some brands (WeChat, for one) may have been removed from the set for trademark reasons.

**After deploying, styles are missing or links 404.**
Almost always `url` / `baseurl`. See [section 3](#3-site-settings-_configyml).

**The custom cursor doesn't show in some browser.**
`.cur` works in Chrome, Edge and Firefox. If a browser won't take it, add a PNG copy and point to it as in [section 11](#11-custom-cursors).

**The cat doesn't appear.**
Check that the page has `oneko: true`, that Reduce Motion is off, and that `assets/img/oneko.png` exists.

**Will `docs/` be published?**
No. It's listed under `exclude` in `_config.yml`.

---

## 17. Automation: publish from issues, translate automatically

Write in Chinese only. Publish posts or Reading entries by opening an issue; GitHub Actions turns it into Markdown, translates an English version and deploys.

### How it works

```text
New issue (Post / Reading form)
   └─ issue-publish.yml
        ├─ scripts/issue_publish.py   issue → Chinese Markdown in _posts/ or _reading/
        ├─ scripts/translate.py       translation API → _posts/en/ or _reading/en/
        ├─ commit and push
        ├─ trigger pages.yml to deploy
        └─ reply with the link and close the issue

Push Chinese Markdown directly
   └─ translate.yml → create or update the English version → trigger deploy
```

Files involved:

| File | Purpose |
| --- | --- |
| `.github/ISSUE_TEMPLATE/post.yml` | "Publish a post" form |
| `.github/ISSUE_TEMPLATE/reading.yml` | "Reading" form |
| `.github/workflows/issue-publish.yml` | issue → publish |
| `.github/workflows/translate.yml` | translate after you push Chinese files |
| `scripts/` | Python used by both workflows (never published) |

### One-time setup

1. **API key**: repo → Settings → Secrets and variables → Actions → **Secrets** → New repository secret named `TRANSLATE_API_KEY`.
2. **Provider (optional)**: on the **Variables** tab of the same page:

   | Variable | Default | Notes |
   | --- | --- | --- |
   | `TRANSLATE_BASE_URL` | `https://api.openai.com/v1` | Any OpenAI Chat Completions–compatible endpoint |
   | `TRANSLATE_MODEL` | `gpt-4o-mini` | Model name |

   DeepSeek, for example: `TRANSLATE_BASE_URL=https://api.deepseek.com`, `TRANSLATE_MODEL=deepseek-chat`. Other OpenAI-compatible services work the same way.

3. **Labels**: Issues → Labels → New label; create `post` and `reading`. The forms apply them, and the workflow uses them to tell the two apart. Or from the command line:

   ```bash
   gh label create post && gh label create reading
   ```

4. **Deploy source**: Settings → Pages → Source must be **GitHub Actions** (see section 15).

### Publishing from an issue

1. Issues → New issue → choose **✍️ 发布文章** (post) or **📚 值得一读** (Reading).
2. The issue title is the post title; the `[文章]` / `[值得一读]` prefix is stripped.
3. Fill in the form. The body takes Markdown, and you can drag images in.
4. Submit. In a minute or two the Action replies with the link and closes the issue; the deploy finishes a few minutes later.

**Editing**: edit the issue (closed ones too) and both the post and its English version update. The filename and date stay the same.

**Slug**: if left empty, the translation API suggests an English slug from the title; without an API key it falls back to `post-<number>` or `reading-<number>`.

**Safety**: only issues opened by the repo owner publish anything. Everyone else's issues are ignored.

### Translation rules

- Chinese files live in `_posts/` and `_reading/`; English versions go to `_posts/en/` and `_reading/en/` under the same filename.
- If a Chinese file has no `ref`, one is added from its filename, so the pair links up automatically.
- English files carry `translated: auto` and a `source_hash`. When the Chinese changes, the hash no longer matches and the English is retranslated.
- **Hand-written English is never overwritten**: English files without `translated: auto` are skipped. To polish a machine translation yourself, edit it and delete the `translated: auto` line; it's locked from then on.
- Markdown structure is kept; code blocks, links and Liquid tags are not translated.
- To backfill everything: Actions → **Translate** → Run workflow.
- Without `TRANSLATE_API_KEY`, translation is skipped and the Chinese still publishes.

### Translate locally

```bash
pip install pyyaml
export TRANSLATE_API_KEY=your-key
python scripts/translate.py                       # scan everything
python scripts/translate.py _posts/2026-10-08-a-quiet-morning.md   # just this one
```

### FAQ

**Nothing happened after I opened the issue.**
Check whether **Publish from issue** ran on the Actions tab. Usually the `post` / `reading` labels don't exist yet, so the issue was never labeled, or the issue wasn't opened by the repo owner.

**The push failed with a permission error.**
Settings → Actions → General → Workflow permissions → **Read and write permissions**.

**I don't like the translation style.**
Edit `SYSTEM_PROMPT` in `scripts/common.py`.

---

> The tools are ready. All that's left is to sit down and write.


## Mobile

The whole site has been checked on phones first. At widths of 360, 390, 768 and 1280 nothing scrolls sideways.

- **Header**: at 720px wide or less it becomes two rows.
  - The first row holds the brand and the tools (search, theme, language), each with a 40×40 tap target.
  - The second row is the nav, as tabs you can swipe sideways, with a clay underline on the current page.
  - The header slides away while you read down and returns as soon as you scroll up.
- **Search** opens as a sheet from the top with a Cancel button, and the page behind it stops scrolling.
- **Reading**: text and headings are slightly smaller. Code blocks run edge to edge, tables scroll sideways, and the previous/next links stack.
- **Elsewhere**:
  - The avatar is smaller and the social links sit in one column.
  - Notch safe areas are respected, and the browser bar colour follows light and dark mode.
  - Hover lifts are off on touch screens, and the oneko cat only appears on devices with a mouse.
- The breakpoints are at the end of `_sass/_layout.scss`, under `@media (max-width: 720px)`. `--header-h` holds the header height, and the sticky bar on the weeks page follows it.


## Illustrations (Droit the white dog)

Words come first, and each page shows exactly one illustration: a closing vignette placed after the text. The home hero is the one exception. It sits beside the intro on wide screens and below it on phones. The rules and the list of keys are in the header comment of `_data/droit.yml`.


## Feeds, reading time, 404, tags and archive

- **Feeds (Atom):** there is one feed per language. The Chinese one is `/feed.xml` and the English one is `/en/feed.xml`. Each holds only its own language's posts, up to `feed_limit` (default 20). The template is `_includes/feed.xml`. The `<head>` link and the RSS link on the Social page point to the current language's feed. jekyll-feed is no longer used.
- **Reading time:** `reading_speed` in `_config.yml` is set per language.
  - Chinese counts characters, 400 a minute by default (`number_of_words: "cjk"`).
  - English counts words, 220 a minute by default.
  - The result rounds up, with a minimum of 1 minute. The logic is in `_includes/reading-time.html`.
- **404:** `404.html` is Chinese and `en/404.html` is English.
  - GitHub Pages serves the root `404.html` for every missing URL, so missing URLs under `/en/` jump to the English version.
  - Each version has a one-line note in the other language and a "try a search" link that opens search.
- **Tags and archive pages:** both are switched on and off in `_config.yml` with `tags_page` and `archive_page`, and both default to on.
  - When on, the post list shows small "Archive · Tags" links, and the tags on a post link to their group on the tags page.
  - When off (`false`), those links go away. `/tags/` and `/archive/` send visitors back to the post list and are marked `noindex`.
  - The page files are `tags/index.html` and `archive/index.html`, with English copies under `en/`.


## Friends and back links

- **Friends:** a module you can switch off as a whole. The data is in `_data/friends.yml`.
  - With `enabled: false`, the friends card on the Social page disappears and `/social/friends/` sends visitors back to Social.
  - Each friend needs a `name` and a `url`, plus either an `avatar` (an image URL) or a `github` username (which uses the GitHub avatar).
  - `desc` is one line per language. `hidden: true` hides an entry for now.
  - When there is no avatar, or it fails to load, the first letter of the name is shown.
  - `me` holds this site's own details, shown under "Swap links".
  - The page files are `social/friends.html` and `en/social/friends.html`. The includes are in `_includes/friends/`.
- **Back links:** add `back: <ref>` to any page's front matter to show "← <that page's title>" above the title. Weeks uses `back: life`, Friends uses `back: social`, and Tags and Archive use `back: blog`.


## Album

- On the Life page, an album card sits under the weeks card, with three stacked thumbnails. It opens `/life/photos/` (`/en/life/photos/` for English).
- Settings live in `_data/photos.yml`:
  - `enabled: false` turns the whole module off. `entry: false` hides only the card on the Life page.
  - Photos come from two sources, and you can use both:
    1. **The `list`:** `src` is a full URL, a site path, or just a file name inside `assets/img/photos/`. Optional fields are `thumb`, `title`, `place`, `date`, and `hidden`.
    2. **The `assets/img/photos/` folder** (`folder: true`): every jpg, png, webp, gif, and avif in it is picked up. A name like `2026-05-01-west-lake.jpg` gives the date and the title. Photos are sorted by file name, newest first with `folder_order: desc`. Files already named in the list are not repeated.
- The grid is a masonry layout that keeps each photo's shape. Clicking a photo opens a lightbox: use the arrow keys or swipe to move, and Esc or tap outside to close.
- Keep photos under about 2000px on the long side, or give each a small `thumb`, so the grid loads fast.
- The page is `life/photos.html`, the includes are in `_includes/photos/`, and the styles are in `_sass/_photos.scss`.

## Storybook

- Under the album card on the Life page there is a Storybook card: a little red book that tilts toward the pointer, whose dog watches the cursor, and whose cover swings open on hover. It links to `/en/life/story/` (`/life/story/` in Chinese).
- The book, *Droit and the Missing Page*, has ten pages. Turn them by tapping or dragging the outer corner (the leaf follows the pointer), with arrow keys / Home / End, the chapter tabs on top, or the arrows below. Phones get one page at a time; swiping the words also turns.
- Every page plays: tilting cover with sparkles; sign the endpaper (your name appears on the cover) and poke the rippling paw prints; drop the apple on sleeping Droit, shake the tree, tap the sun; chase a page that dodges, plant flowers; move the umbrella, thunder from the cloud, splash puddles; raise the ink sea, release fish, change the moon; join the stars; draw the missing page and bind it (it gets taped to the cover); stamp paw prints on The End; scan the barcode. Letters rise in one by one and jump when touched; dust around the book drifts away from the pointer.
- Sound is off by default; the ♪ button turns it on. Every sound is synthesized in the browser.
- A reader's name, drawing and stamps stay in their own localStorage.
- Words live in `_data/story.yml` (`enabled: false` removes the module, `entry: false` hides only the Life card). Drawings and games: `assets/js/story.js`; styles: `_sass/_story.scss`. Reduced-motion turns the motion off.


## Transitions

Page navigation, theme switching, ⌘K search, the life calendar week view, and the gallery lightbox now all have transitions. Unsupported browsers stay as they are, and everything is disabled when the system has “Reduce Motion” enabled.

- Styles are centralized in `_sass/_motion.scss`. To disable them entirely, remove `@import "motion";` from `assets/css/main.scss`.
- Scripts: There is an inline script in `head.html` that distinguishes between the two kinds of page navigation, “back” and “switch language”; an inline script at the bottom of `header.html` centers the active item in the mobile navigation; `main.js` handles the circular theme reveal, week calendar switching, and the lightbox.
- Titles in post lists fly into the large title on the post page. If the same post appears twice in a list you wrote yourself, don’t add `vt-title` to it, otherwise the names will be duplicated and the full-page transition will fail.
