# Stoa

A quiet Jekyll theme for people who think in public.
Warm paper, serif type, a single clay accent. Dark mode. ⌘K search. Nothing else.

## Run

    bundle install
    bundle exec jekyll serve

Open http://localhost:4000

## Make it yours

- `_config.yml` — name, tagline, nav, social links
- `index.md` — the about text on the home page
- `_posts/` — writing, as `YYYY-MM-DD-title.md`
- `_data/news.yml` — short notes on the home page
- `_data/reading.yml` — the Reading page
- `life/index.md` — the Life page
- `assets/img/avatar.svg` — replace with your photo, then update `avatar` in `_config.yml`
- `_sass/_variables.scss` — colors and fonts

## 双语 / Bilingual

- 默认语言在 `/`，其他语言在 `/<code>/`。在 `_config.yml` 里设置 `lang`（默认语言）和 `languages`。语言代码用连字符：`zh-CN`，不要写 `zh_CN`。
- 界面文字、导航和日期格式都在 `_data/i18n.yml` 里配置。
- 中文文章放在 `_posts/`，英文文章放在 `_posts/en/`。英文文章会自动设为 `lang: en`，链接是 `/en/blog/...`。
- 两种语言的同一篇文章或页面，写上相同的 `ref:`，导航栏的切换按钮就会直接跳到对应的那一篇。找不到对应时，跳到另一种语言的首页。
- 首页随记和"值得一读"的数据，都放在 `_data/news.yml` 和 `_data/reading.yml` 里，按语言分组。

## Deploy

Push to GitHub and use a GitHub Actions Jekyll workflow (the theme uses Jekyll 4),
or build locally and upload `_site/` anywhere.

MIT licensed. Say less, mean more.
