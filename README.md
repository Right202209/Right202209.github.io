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

## Deploy

Push to GitHub and use a GitHub Actions Jekyll workflow (the theme uses Jekyll 4),
or build locally and upload `_site/` anywhere.

MIT licensed. Say less, mean more.
