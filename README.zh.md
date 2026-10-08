<div align="right">
  <a href="README.md">English</a>
</div>

# Stoa

一个安静的 Jekyll 主题，为公开思考的人而作。
温暖纸色、衬线字体、一抹陶土色点缀。深色模式。⌘K 搜索。别无其他。

📖 **文档 / 教程**：[English](docs/en/README.md) · [中文](docs/zh-CN/README.md)  


## 运行

    bundle install
    bundle exec jekyll serve

打开 http://localhost:4000

## 把它变成你的

- `_config.yml` — 名称、标语、导航、社交链接
- `index.md` — 主页上的关于文本
- `_posts/` — 文章，命名为 `YYYY-MM-DD-title.md`
- `_data/news.yml` — 主页上的短记
- `_reading/` — 阅读，每篇一个 Markdown 文件（英文在 `_reading/en/`）；front matter：title、author、date、description、source、ref
- `_data/social.yml` — 社交页面；可添加任何平台（Instagram、小红书、Bilibili……），使用来自 simpleicons.org 的图标 slug
- `life/index.md` — Life 页面
- `assets/img/avatar.svg` — 替换为你的照片，然后更新 `_config.yml` 中的 `avatar`
- `_sass/_variables.scss` — 颜色和字体

##  双语

- 默认语言位于 `/`，其他语言位于 `/<code>/`。在 `_config.yml` 中设置 `lang`（默认语言）和 `languages`。语言代码中使用连字符：`zh-CN`，而不是 `zh_CN`。
- UI 文本、导航和日期格式都在 `_data/i18n.yml` 中配置。
- 中文文章放在 `_posts/`，英文文章放在 `_posts/en/`。英文文章会自动设为 `lang: en`，其链接为 `/en/blog/...`。
- 对于同一篇文章或页面在两种语言中的版本，写入相同的 `ref:`，导航栏中的语言切换器会直接跳转到对应版本。如果找不到匹配项，则跳转到另一语言的主页。
- 主页短记位于 `_data/news.yml`，按语言分组。“Worth Reading”像文章一样编写：中文放在 `_reading/`，英文放在 `_reading/en/`，同一篇使用相同的 `ref:`。
- 社交链接位于 `_data/social.yml`，不区分语言；`note` 可以按语言分别编写，`hidden: true` 会将其隐藏。

## 部署

将 **Settings → Pages → Source** 设为 **GitHub Actions**，然后推送。`.github/workflows/pages.yml` 使用 Jekyll 4 构建并部署。
或者在本地构建，然后把 `_site/` 上传到任何地方。

## 光标与猫

- 全局光标：将 `default.cur` 和 `pointer.cur` 放入 `assets/css/`；样式在 `_sass/_cursor.scss` 中。如果文件缺失，会自动回退到系统光标。
- oneko 猫：在页面的 front matter 中设置 `oneko: true` 让它出现；目前仅在 “Life” 页面。精灵图是 `assets/img/oneko.png`（256×128）。在启用了“减少动态效果”的系统上会自动隐藏。脚本来自 [adryd325/oneko.js](https://github.com/adryd325/oneko.js)。

## 人生周历

可插拔模块：生活页 blockquote 下方那一行，左边是今天的日期，右边点进周历。周历有格子和横向时间轴两种视图，带季节刻度和私密事件（只显示一个实心点），事件也能用 ⌘K 搜到。全部在构建时生成，不用任何库。开关和数据都在 `_data/weeks.yml`，详见教程。移植自 [Gina Trapani 的 My Life in Weeks](https://weeks.ginatrapani.org)。

## 致谢

没有一座房子是从虚无中建起的。这里的每一块砖，都曾属于别人。
谢谢你们把门敞开。

- [al-folio](https://github.com/alshedivat/al-folio)：学术主页的典范。About、Posts 和 News 部分的骨架都是从它这里学来的。
- [ifuryst.com](https://www.ifuryst.com/)：让我看到，个人博客既可以是作品集，也可以是一种生活。
- [Jekyll](https://jekyllrb.com/)：让文字只是文字。
- [Simple Icons](https://simpleicons.org/)、[Newsreader](https://fonts.google.com/specimen/Newsreader)、[Inter](https://rsms.me/inter/)、[JetBrains Mono](https://www.jetbrains.com/lp/mono/)、[Unsplash](https://unsplash.com/)：支撑起一切的隐形之物。

## 许可证
 MIT 许可证。Say less, mean more.