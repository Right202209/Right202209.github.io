<div align="right">
  <a href="README.zh.md">中文</a>
</div>

# Stoa

A quiet Jekyll theme for people who think in public.
Warm paper, serif type, a single clay accent. Dark mode. ⌘K search. Nothing else.

📖 **Docs / Tutorial**：[English](docs/en/README.md) · [中文](docs/zh-CN/README.md)  


## Run

    bundle install
    bundle exec jekyll serve

Open http://localhost:4000

## Make it yours

- `_config.yml` — name, tagline, nav, social links
- `index.md` — the about text on the home page
- `_posts/` — writing, as `YYYY-MM-DD-title.md`
- `_data/news.yml` — short notes on the home page
- `_reading/` — Reading, one Markdown file per piece (English in `_reading/en/`); front matter: title, author, date, description, source, ref
- `_data/social.yml` — the Social page; add any platform (Instagram, 小红书, Bilibili…) with an icon slug from simpleicons.org
- `life/index.md` — the Life page
- `assets/img/avatar.svg` — replace with your photo, then update `avatar` in `_config.yml`
- `_sass/_variables.scss` — colors and fonts

##  Bilingual

- The default language is at `/`, and other languages are at `/<code>/`. Set `lang` (the default language) and `languages` in `_config.yml`. Use hyphens in language codes: `zh-CN`, not `zh_CN`.
- UI text, navigation, and date formats are all configured in `_data/i18n.yml`.
- Chinese posts go in `_posts/`, and English posts go in `_posts/en/`. English posts are automatically set to `lang: en`, and their links are `/en/blog/...`.
- For the same post or page in both languages, write the same `ref:`, and the language switcher in the navigation bar will jump directly to the corresponding one. If no match is found, it jumps to the homepage of the other language.
- Homepage notes are in `_data/news.yml`, grouped by language. "Worth Reading" is written like posts: Chinese goes in `_reading/`, English goes in `_reading/en/`, and the same piece uses the same `ref:`.
- Social links are in `_data/social.yml` and are not language-specific; `note` can be written per language, and `hidden: true` hides them.

## Deploy

Set **Settings → Pages → Source** to **GitHub Actions**, then push. `.github/workflows/pages.yml` builds with Jekyll 4 and deploys.
Or build locally and upload `_site/` anywhere.

## Cursors and the Cat

- Global cursors: Put `default.cur` and `pointer.cur` in `assets/css/`; the styles are in `_sass/_cursor.scss`. If the files are missing, it automatically falls back to the system cursor.
- oneko cat: Set `oneko: true` in the page's front matter to make it appear; currently only on the "Life" page. The sprite sheet is `assets/img/oneko.png` (256×128). It is automatically hidden on systems with "Reduce Motion" enabled. The script is from [adryd325/oneko.js](https://github.com/adryd325/oneko.js).

## Life in Weeks

A pluggable module. Under the quote on the Life page is one row: today's date on the left, and on the right a link to your life in weeks. The weeks page has two views, a grid and a horizontal timeline, with season ticks, private events (just a solid dot) and events you can find with ⌘K. All of it is built at compile time, with no libraries. The switches and the data live in `_data/weeks.yml`; see the tutorial. Ported from [Gina Trapani's My Life in Weeks](https://weeks.ginatrapani.org).

## Acknowledgements

No house is built from nothing. Every brick here once belonged to someone else.
Thank you for leaving the door open.

- [al-folio](https://github.com/alshedivat/al-folio): A model for academic homepages. The skeleton for the About, Posts, and News sections was all learned from here.
- [ifuryst.com](https://www.ifuryst.com/): Showed me that a personal blog can be both a body of work and a life.
- [Jekyll](https://jekyllrb.com/): Lets words just be words.
- [Simple Icons](https://simpleicons.org/)、[Newsreader](https://fonts.google.com/specimen/Newsreader)、[Inter](https://rsms.me/inter/)、[JetBrains Mono](https://www.jetbrains.com/lp/mono/)、[Unsplash](https://unsplash.com/)：The invisible things that hold everything up.

## LICENSE
 MIT licensed. Say less, mean more.

