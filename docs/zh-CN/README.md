# Stoa 使用教程

> 一座安静的书房，钥匙在这里。

[English](../en/README.md) · [返回 README](../../README.md)

这份教程覆盖主题的全部功能：从本地运行、写第一篇文章，到双语、社交页、光标与小猫，最后部署到 GitHub Pages。按顺序读一遍，大约十五分钟；之后当作手册查阅即可。

---

## 目录

1. [快速开始](#1-快速开始)
2. [目录结构](#2-目录结构)
3. [站点配置 `_config.yml`](#3-站点配置-_configyml)
4. [双语：中文与英文](#4-双语中文与英文)
5. [写文章](#5-写文章)
6. [值得一读（Reading）](#6-值得一读reading)
7. [首页：关于与随记](#7-首页关于与随记)
8. [生活页与自定义页面](#8-生活页与自定义页面)
9. [社交页](#9-社交页)
10. [外观：颜色、字体、头像、图标](#10-外观颜色字体头像图标)
11. [光标美化](#11-光标美化)
12. [oneko 小猫](#12-oneko-小猫)
13. [搜索 ⌘K](#13-搜索-k)
14. [RSS、SEO 与 Sitemap](#14-rssseo-与-sitemap)
15. [部署到 GitHub Pages](#15-部署到-github-pages)
16. [常见问题](#16-常见问题)
17. [自动化：Issue 发布与自动翻译](#17-自动化issue-发布与自动翻译)

---

## 1. 快速开始

### 环境要求

- Ruby 3.x（建议 3.2 或更新）
- Bundler：`gem install bundler`
- Git

macOS 推荐用 [rbenv](https://github.com/rbenv/rbenv) 或 Homebrew 安装 Ruby，不要用系统自带的；Windows 用 [RubyInstaller](https://rubyinstaller.org/)（选带 DevKit 的版本）。

### 本地运行

```bash
git clone https://github.com/Right202209/Right202209.github.io.git
cd Right202209.github.io
bundle install
bundle exec jekyll serve --livereload
```

打开 <http://localhost:4000>。保存文件后页面会自动刷新。

> 改了 `_config.yml` 需要重启 `jekyll serve`，它不会热加载配置文件。

### 只构建，不预览

```bash
bundle exec jekyll build      # 输出到 _site/
```

---

## 2. 目录结构

```text
.
├── _config.yml          站点配置：名称、语言、集合、插件
├── _data/
│   ├── i18n.yml         各语言的界面文字、导航、日期格式
│   ├── news.yml         首页「随记」，按语言分组
│   └── social.yml       社交页的链接
├── _includes/           页面片段（头部、页脚、搜索、语言判断、社交卡片）
├── _layouts/            布局：default / home / page / post / reading
├── _posts/              中文文章
│   └── en/              英文文章
├── _reading/            「值得一读」中文条目
│   └── en/              英文条目
├── _sass/               样式（变量、基础、布局、代码高亮、光标）
├── assets/
│   ├── css/             main.scss，以及 default.cur / pointer.cur
│   ├── img/             头像、favicon、oneko 精灵图
│   └── js/              main.js（主题与搜索）、oneko.js
├── index.md             中文首页（关于）
├── blog/ reading/ life/ social/      中文页面
├── en/                  英文页面（结构与中文一一对应）
├── search.json          搜索索引
└── docs/                本教程（不会被发布到网站）
```

`_data/reading.yml` 是旧版「值得一读」的数据文件，现在已经改用 `_reading/` 集合，不再被任何页面读取，可以放心删除。

---

## 3. 站点配置 `_config.yml`

最常改的几项：

| 字段 | 作用 | 示例 |
| --- | --- | --- |
| `title` | 站点名，显示在导航左侧和首页大标题 | `Droit` |
| `author` | 作者名，用于页脚和 SEO | `Droit` |
| `email` | 联系邮箱 | `right202601@gmail.com` |
| `description` | 站点简介，用于 SEO 和 RSS | `"A small place to think slowly."` |
| `url` | 站点完整域名，**部署前务必填写** | `https://right202209.github.io` |
| `baseurl` | 子路径；用户主页仓库留空 | `""` |
| `lang` | 默认语言，位于 `/` | `zh-CN` |
| `languages` | 全部语言，第一个是默认 | `[zh-CN, en]` |
| `timezone` | 时区，影响文章日期 | `Asia/Shanghai` |
| `avatar` | 首页头像路径 | `/assets/img/avatar.svg` |
| `home.news_limit` | 首页显示几条随记 | `3` |
| `home.posts_limit` | 首页显示几篇最近文章 | `5` |

### `url` 和 `baseurl` 怎么填

- 仓库名是 `用户名.github.io`（比如本仓库）：`url: https://right202209.github.io`，`baseurl: ""`
- 仓库名是其他名字，比如 `blog`：`url: https://用户名.github.io`，`baseurl: /blog`
- 绑定了自己的域名：`url: https://example.com`，`baseurl: ""`

主题里所有链接都经过 `relative_url` 过滤器，所以只要 `baseurl` 填对，子路径部署不会出现断链。

### `defaults`

这一段让文件按所在目录自动获得属性，一般不用改：

- 所有页面默认 `lang: zh-CN`
- `_posts/en/` 下的文章自动 `lang: en`，链接是 `/en/blog/年份/标题/`
- `_reading/` 下的条目自动使用 `reading` 布局
- `_reading/en/` 下的条目自动 `lang: en`，链接是 `/en/reading/文件名/`
- `en/` 目录下的页面自动 `lang: en`

---

## 4. 双语：中文与英文

### 规则一：中文在 `/`，英文在 `/en/`

| 内容 | 中文 | 英文 |
| --- | --- | --- |
| 首页 | `index.md` | `en/index.md` |
| 文章列表 | `blog/index.html` | `en/blog/index.html` |
| 文章 | `_posts/*.md` | `_posts/en/*.md` |
| 值得一读 | `_reading/*.md` | `_reading/en/*.md` |
| 生活 | `life/index.md` | `en/life/index.md` |
| 社交 | `social/index.html` | `en/social/index.html` |

### 规则二：同一内容，写同一个 `ref`

导航栏右侧的语言按钮会寻找 `ref` 相同、语言不同的页面，直接跳过去；找不到时，跳到另一种语言的首页。

```yaml
# _posts/2026-10-01-on-beginning-again.md
ref: beginning

# _posts/en/2026-10-01-on-beginning-again.md
ref: beginning
```

`ref` 可以是任意英文短词，只要中英文一致、且全站唯一即可。

### 规则三：界面文字全在 `_data/i18n.yml`

每种语言一个块，字段说明：

| 字段 | 作用 |
| --- | --- |
| `label` / `switch_label` | 语言按钮上显示的文字 |
| `home` | 该语言的首页地址 |
| `nav` | 导航菜单，按顺序显示 |
| `alias` | 首页名字下方的别名 |
| `tagline` | 首页底部的题词 |
| `avatar_caption` | 头像下方的小字 |
| `notes` / `latest` | 首页两个栏目的标题 |
| `minutes` | 阅读时长单位 |
| `search_placeholder` / `search_empty` | 搜索框占位文字与无结果提示 |
| `footer` | 页脚的一句话 |
| `date_long` / `date_short` / `date_month` | 日期格式（[strftime 语法](https://strftime.org/)） |
| `read_original` | 「值得一读」里「读原文」按钮文字 |

> 语言代码请用连字符：`zh-CN`，不要写 `zh_CN`。

### 只想要中文？

把 `_config.yml` 里的 `languages` 改成 `[zh-CN]`，删掉 `en/`、`_posts/en/`、`_reading/en/` 三个目录，再删掉 `_includes/header.html` 里 `lang-switch` 那一行即可。

---

## 5. 写文章

### 新建

在 `_posts/` 新建文件，文件名格式 **必须** 是 `YYYY-MM-DD-英文短标题.md`：

```text
_posts/2026-10-08-a-quiet-morning.md
```

文件名里的日期就是发布日期，短标题会成为链接的一部分（`/blog/2026/a-quiet-morning/`）。建议用英文或拼音，避免中文链接被转义成一长串 `%E4%B8%AD`。

### Front matter

```yaml
---
title: 一个安静的早晨
description: 一句话摘要，会显示在标题下方和文章列表里。
tags: [随笔, 生活]
ref: quiet-morning
---

正文从这里开始。
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 标题 |
| `description` | 否 | 摘要，显示在标题下方、文章列表、SEO |
| `tags` | 否 | 标签，显示在日期旁 |
| `ref` | 否 | 中英文对应时填写 |
| `date` | 否 | 需要精确时间时填写，如 `2026-10-08 09:30:00 +0800` |

不需要写 `layout`，文章默认使用 `post` 布局。

### 英文文章

放在 `_posts/en/`，写法完全一样，`ref` 与中文版一致：

```text
_posts/en/2026-10-08-a-quiet-morning.md
```

### 草稿

新建 `_drafts/` 目录，草稿放进去时文件名不用带日期。本地预览草稿：

```bash
bundle exec jekyll serve --drafts
```

正式构建时 `_drafts/` 不会发布。

### 图片

推荐放在 `assets/img/posts/` 下，在文章里这样引用：

```markdown
![图片说明]({{ '/assets/img/posts/morning.jpg' | relative_url }})
```

外链图片（如 Unsplash）直接写完整地址即可。

### 代码高亮

使用 GFM 代码块并标注语言：

````markdown
```python
print("hello")
```
````

配色在 `_sass/_syntax.scss`，深色模式下自动切换。

### 文章页会自动生成

- 日期（按 `i18n.yml` 的 `date_long` 格式）
- 阅读时长（字数 ÷ 220 + 1 分钟）
- 上一篇 / 下一篇（只在同一种语言内跳转）

---

## 6. 值得一读（Reading）

「值得一读」和文章一样，一篇一个 Markdown 文件。

### 新建

```text
_reading/walden.md          中文
_reading/en/walden.md       英文
```

文件名就是链接：`/reading/walden/`、`/en/reading/walden/`。

### Front matter

```yaml
---
title: 瓦尔登湖
author: Henry David Thoreau
date: 2026-05-20
description: 一个人走进林中，只为看清什么才算活过。
source: https://en.wikipedia.org/wiki/Walden
ref: walden
---

这里写你的读后感、摘抄，或者一句话也行。
```

| 字段 | 说明 |
| --- | --- |
| `title` | 书名或文章名 |
| `author` | 作者 |
| `date` | 你读完它的日期，用于列表按年份分组、排序 |
| `description` | 一句话短评，显示在列表里 |
| `source` | 原文链接，页面底部会出现「读原文 →」 |
| `ref` | 中英文对应 |

列表页按 `date` 倒序、按年份分组；条目同样会进入搜索。

---

## 7. 首页：关于与随记

### 关于

首页就是 `index.md`（英文 `en/index.md`），使用 `home` 布局。front matter 下面的正文就是「关于」的内容，支持 Markdown。

首页依次显示：站点名 → 别名 → 关于正文 → 头像 → 随记 → 最近文章 → 题词。

### 随记

编辑 `_data/news.yml`，按语言分组，最新的写在最上面：

```yaml
zh-CN:
  - date: 2026-10-08
    text: "今天学会了等待。"
  - date: 2026-10-01
    text: "重新开始写。[第一篇](/blog/2026/on-beginning-again/)在这里。"
en:
  - date: 2026-10-08
    text: "Learned to wait today."
```

`text` 支持行内 Markdown（链接、加粗、斜体）。显示条数由 `_config.yml` 的 `home.news_limit` 控制。

---

## 8. 生活页与自定义页面

### 生活页

`life/index.md` 与 `en/life/index.md`，使用 `page` 布局，写什么都可以：照片、清单、一段话。

```yaml
---
oneko: true            # 让小猫出现，见第 12 节
layout: page
title: 生活
ref: life
description: 屏幕熄灭后，留下的那些。
---
```

### 新增一个页面

比如做一个「项目」页：

1. 新建 `projects/index.md`：

   ```yaml
   ---
   layout: page
   title: 项目
   ref: projects
   description: 亲手做过的小东西。
   ---

   正文……
   ```

2. 新建 `en/projects/index.md`，`ref: projects`，`title: Projects`。
3. 在 `_data/i18n.yml` 的两个 `nav` 里各加一行：

   ```yaml
   - { title: 项目, url: /projects/ }      # zh-CN
   - { title: Projects, url: /en/projects/ } # en
   ```

导航的高亮会根据当前地址自动判断，不需要额外设置。

---

### 人生周历（Life in Weeks）

一个可插拔模块，移植自 [weeks.ginatrapani.org](https://weeks.ginatrapani.org)。不用 Bootstrap 和 jQuery，只靠 CSS Grid；脚本几十行，并在 `assets/js/main.js` 里。周序号、年龄、十年分段、阶段、住处、季节和事件都在构建时用 Liquid 算好，页面不依赖任何运行时库。

**开关与插拔**：所有设置和数据都在 `_data/weeks.yml`。

| 设置 | 作用 |
| --- | --- |
| `enabled: false` | 关掉整个模块：入口行、周历页、搜索条目全部消失（周历页会跳回生活页） |
| `entry: false` | 只隐藏生活页的入口卡片 |
| `view: grid` / `timeline` | 默认视图。访客切换后，浏览器会记住他的选择 |
| `hemisphere: north` / `south` | 季节刻度按北半球还是南半球算 |

两个 include 可以放进任何页面：

- `{% include weeks/entry.html %}`：一张入口卡片。左边是整个人生的缩略图，一年一个小方格（走过的是墨色，今年是陶土色、会轻轻呼吸，未来是浅灰）；右边写「这是我人生的第 N 周」，下面是「共约 M 周，已走过 x%」。悬停时卡片微微浮起，走过的年份依次染成陶土色。数字按访客的日期实时校正。
- 周历页顶部有三组大数字（已经走过的周、人生进度、大约还剩的周）和一条按十年分段的进度条。
- 格子随窗口宽度自动换行：每十年是一段连续的格子流，每个格子有最小宽度，并会撑满整行。宽屏大约一行 26 格，平板约 21 格，手机约 13 格。每一段上方标注「最初的十年」「十几岁」「20 岁」……
- `{% include weeks/view.html %}`：完整模块，包括格子、时间轴和切换按钮

想彻底移除，删掉 `_data/weeks.yml`、`_includes/weeks/`、`_layouts/weeks.html`、`_sass/_weeks.scss`、`life/weeks.md`、`en/life/weeks.md`，再去掉 `main.scss` 里的 `@import "weeks"` 即可。

**格子视图**：每年一行，每周一格（53 列）。

- 底色代表人生阶段（`eras`），边框代表住处（`places`）
- 季节色带和界桩（以立春、立夏、立秋、立冬为界），说明见下面的「季节边框」
- 本周高亮，未来的格子留空
- 悬停或点按格子，显示「日期 · 几岁第几周 · 阶段，在某地 · 事件」
- 当年的事件写在行尾

**时间轴视图**：一条横向的人生轴，节点包括出生、各个事件、现在和预期寿命。

- 每个节点有圆点和日期标签，标签上下交错、远近错开，避免互相挤压
- 「现在」节点自动高亮；如果某个事件就在本周，高亮的就是那个事件
- 悬停时圆点放大发光；点击事件圆点会切回格子视图，并跳到那一周
- 给事件加 `line: true`，会多一条竖线标记
- 节点依次淡入；在手机上自动变成竖向时间线

**季节边框**：季节以立春、立夏、立秋、立冬为界（不按月份划分）。每个格子底部有一条 2px 的季节色带：春是新绿，夏是麦黄，秋是陶土，冬是霜蓝，连起来就是每一行里流动的四季。一个季节开始的那一周，左边会立一根同色的界桩；悬停时显示节气名和日期，例如「立秋 08-07」。四立的日期来自 `_data/solar_terms.yml`，按太阳视黄经（315°、45°、135°、225°，北京时间）算出，覆盖 1900–2150 年，不需要手改。南半球设 `hemisphere: south`，季节会整体错开半年。

**私密事件**：设了 `private: true` 的那一周画成「封存」样式：格子铺一层细斜纹，像涂黑的字，中间是一个带印章圈的实心点。悬停时只显示「🔒 私密」，不显示文字，也不进搜索。时间轴上同样只有一个带圈的点。

**事件**：

```yaml
events:
  - { date: 2017-06-30, emoji: "🎓", zh: 大学毕业, en: Graduated, line: true }
  - { date: 2021-04-02, private: true }   # 只显示成一个实心点，没有文字，也不进搜索
```

`zh` 和 `en` 分别给中文页和 `/en/` 使用，缺了哪个就用另一个。

**搜索**：每个公开事件都写进了 `search.json`。按 ⌘K 搜「毕业」，会直接跳到那一周，格子闪三下。

`eras` 和 `places` 可以用 `age:`（岁）开始，也可以用 `start:`（日期）开始：

```yaml
eras:
  - { age: 0, zh: 还很小, en: I was tiny, color: "#f3ece0" }
  - { start: 2017-07-01, zh: 工作, en: Working, color: "#ece3ef" }
places:
  - { age: 0, zh: 家乡, en: Hometown, color: "#b9a68a" }
  - { start: 2017-07-01, zh: 上海, en: Shanghai, color: "#8eb2d6" }
```

> 注意：生日和非私密事件都会公开显示。`_data/weeks.yml` 里的事件只是示例，记得换成你自己的。

## 9. 社交页

编辑 `_data/social.yml`。社交链接不区分语言，只有 `note` 可以分语言写。

```yaml
- name: GitHub
  icon: github
  handle: Right202209
  url: https://github.com/Right202209
  note: { zh-CN: 写给机器的那部分。, en: The part written for machines. }
```

| 字段 | 说明 |
| --- | --- |
| `name` | 显示名称 |
| `icon` | [Simple Icons](https://simpleicons.org/) 的 slug，例如 `github`、`x`、`instagram`、`xiaohongshu`、`bilibili`、`zhihu`、`weibo`、`telegram`、`douban`、`spotify` |
| `handle` | 账号名；没有 `note` 时显示它 |
| `url` | 完整链接；`/` 开头为站内链接；`mailto:` 也可以 |
| `note` | 每种语言一句短话（可选） |
| `hidden` | 设为 `true` 则隐藏 |

外部链接会在新标签页打开，并带上 `rel="me"`（可用于 Mastodon 等平台的身份验证）。

> 当前 X 和 Instagram 还是占位账号（`your-x`、`your-ins`），记得替换或设为 `hidden: true`。

### 找不到图标？

在 [simpleicons.org](https://simpleicons.org/) 搜索平台名，点开图标，页面上显示的 slug 就是要填的值。图标通过 jsDelivr 加载（`cdn.jsdelivr.net/npm/simple-icons@13`），颜色会自动跟随主题，深色模式下同样清晰。

---

## 10. 外观：颜色、字体、头像、图标

### 颜色与字体

全在 `_sass/_variables.scss`：

| 变量 | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--bg` | `#faf9f5` | `#1a1916` | 背景（纸） |
| `--surface` | `#f0eee6` | `#24231f` | 卡片、代码块 |
| `--ink` | `#141413` | `#ece9e0` | 正文（墨） |
| `--muted` | `#6b6a64` | `#9a978d` | 次要文字 |
| `--line` | `#e3dfd3` | `#34322c` | 分隔线 |
| `--accent` | `#d97757` | `#e08a6b` | 强调色（陶土） |

字体：标题用 `--serif`（Newsreader），正文用 `--sans`（Inter），代码用 `--mono`（JetBrains Mono）。中文会自动回退到宋体 / 苹方。更换字体时，记得同时修改 `_includes/head.html` 里的 Google Fonts 链接。

### 深色模式

- 首次访问跟随系统设置
- 点击导航的太阳图标切换，选择会保存在浏览器里

### 头像

替换 `assets/img/avatar.svg`；如果换成照片，比如 `avatar.jpg`，同时修改 `_config.yml`：

```yaml
avatar: /assets/img/avatar.jpg
```

不想显示头像，把 `avatar` 那一行删掉即可。

### Favicon 与 Logo

- 浏览器标签页图标：`assets/img/favicon.svg`（支持深色模式）
- 导航栏左侧的 D 形标记：直接写在 `_includes/header.html` 的 `<svg class="mark">` 里

两者图案相同，修改其中一个时，记得同步另一个。

---

## 11. 光标美化

全站使用自定义光标，文件位于：

```text
assets/css/default.cur    普通光标
assets/css/pointer.cur    链接、按钮上的手型光标
```

样式在 `_sass/_cursor.scss`：

- 页面整体使用 `default.cur`
- 链接、按钮、复选框、下拉框等可点击元素使用 `pointer.cur`
- 输入框、文本框保留系统的文字光标，方便输入

### 换成自己的光标

用同名文件覆盖即可。也可以用 PNG，改 `_cursor.scss` 里的路径：

```scss
:root {
  --cursor-default: url("my-cursor.png") 4 4, auto;   /* 4 4 是热点坐标 */
  --cursor-pointer: url("my-pointer.png") 8 2, pointer;
}
```

建议尺寸 32×32，最大不要超过 128×128，否则浏览器会忽略它。

### 关闭

在 `assets/css/main.scss` 里删掉 `@import "cursor";` 这一行。文件缺失时，浏览器会自动回退到系统光标，不会报错。

---

## 12. oneko 小猫

一只像素小猫，会追着你的鼠标跑，停下时会挠痒、打盹。

### 在某个页面开启

在页面 front matter 里加一行：

```yaml
oneko: true
```

目前只在中英文「生活」页开启。想全站都有，把 `_config.yml` 里 `defaults` 的第一条改成：

```yaml
  - scope: { path: "" }
    values: { lang: zh-CN, oneko: true }
```

### 文件

- 脚本：`assets/js/oneko.js`（来自 [adryd325/oneko.js](https://github.com/adryd325/oneko.js)）
- 精灵图：`assets/img/oneko.png`，尺寸 **256×128**，8 列 × 4 行，每格 32×32

想换一只猫，只要准备同样排布的精灵图覆盖 `oneko.png`。原版精灵图可以在 oneko.js 仓库里找到（`oneko.gif`）。

### 行为

- 系统开启「减少动态效果」时，小猫不会出现
- 小猫不会挡住点击（`pointer-events: none`）
- 每次进入页面都从左上角出发（`data-persist-position="false"`）；想让它记住位置，把 `_layouts/default.html` 中这个属性改成 `"true"`
- 触屏设备没有鼠标移动，小猫只会安静地坐着

---

## 13. 搜索 ⌘K

- 按 `⌘K`（Windows / Linux 为 `Ctrl+K`），或点击导航里的 `⌘K` 按钮打开
- 输入关键词，结果实时出现；`↑` `↓` 选择，`Enter` 打开，`Esc` 关闭
- 只搜索当前语言的内容，范围包括全部文章和「值得一读」
- 索引由 `search.json` 在构建时生成，匹配标题与正文前 60 个词

纯前端实现，无需任何第三方服务。

---

## 14. RSS、SEO 与 Sitemap

由三个插件自动完成，无需配置：

| 插件 | 生成 |
| --- | --- |
| `jekyll-feed` | `/feed.xml`，订阅地址 |
| `jekyll-seo-tag` | `<title>`、描述、Open Graph、Twitter Card |
| `jekyll-sitemap` | `/sitemap.xml` |

前提是 `_config.yml` 里的 `url` 已经填写，否则这些文件里的链接都会是相对地址。

给单篇文章设置分享图：

```yaml
image: /assets/img/posts/cover.jpg
```

---

## 15. 部署到 GitHub Pages

`Gemfile` 指定的是 Jekyll 4.3，而 GitHub Pages 的经典构建方式固定使用 Jekyll 3.x，并且会忽略 `Gemfile`。所以推荐用 **GitHub Actions** 构建，行为与本地完全一致。

### 第一步：仓库设置

仓库 → **Settings** → **Pages** → **Build and deployment** → **Source** 选择 **GitHub Actions**。

### 第二步：工作流

仓库已自带 `.github/workflows/pages.yml`，内容如下（新项目可照抄）：

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

如果默认分支不是 `main`，改掉 `branches` 那一行。

### 第三步：推送

```bash
git add .
git commit -m "Deploy"
git push
```

在仓库的 **Actions** 标签页可以看到构建进度，完成后访问 `https://right202209.github.io`。

### 绑定自己的域名

1. 根目录新建 `CNAME` 文件，内容只有一行域名，如 `blog.example.com`
2. 在域名服务商添加 CNAME 记录，指向 `right202209.github.io`
3. `_config.yml` 里 `url` 改为 `https://blog.example.com`
4. 仓库 **Settings → Pages** 勾选 **Enforce HTTPS**

---

## 16. 常见问题

**改了 `_config.yml` 没生效？**
重启 `bundle exec jekyll serve`。

**语言切换总是跳回首页？**
检查两篇的 `ref` 是否完全一致，另一种语言的那一篇是否放在了正确的目录（`_posts/en/`、`en/`）。

**中文文章的阅读时长总是「1 分钟」？**
Jekyll 默认按空格数词。在 `_layouts/post.html` 里把 `number_of_words` 改成 `number_of_words: "auto"`（Jekyll 4.2+ 支持），中文会按字计数。中文阅读速度大约每分钟 300 到 500 字，可以顺手把 `220` 调大。

**社交图标显示不出来？**
确认 `icon` 的 slug 拼写正确，并在 simpleicons.org 上真的存在；部分品牌（如微信）可能因商标原因被移出了图标库。

**部署后样式丢失、链接 404？**
几乎都是 `url` / `baseurl` 没填对，回到[第 3 节](#3-站点配置-_configyml)对照。

**自定义光标在某些浏览器不显示？**
`.cur` 在 Chrome、Edge、Firefox 中都能正常显示；如果某个浏览器不认，可以另备一份 PNG，按[第 11 节](#11-光标美化)的写法替换。

**小猫没出现？**
检查页面是否写了 `oneko: true`，系统是否开启了「减少动态效果」，以及 `assets/img/oneko.png` 是否存在。

**`docs/` 会被发布到网站上吗？**
不会，它已经写在 `_config.yml` 的 `exclude` 里。

---

## 17. 自动化：Issue 发布与自动翻译

只写中文。用 Issue 发布文章或「值得一读」，GitHub Action 会自动生成 Markdown、翻译出英文版并部署上线。

### 它是怎么工作的

```text
新建 Issue（文章 / 值得一读表单）
   └─ issue-publish.yml
        ├─ scripts/issue_publish.py   Issue → _posts/ 或 _reading/ 下的中文 Markdown
        ├─ scripts/translate.py       调用翻译接口 → _posts/en/ 或 _reading/en/
        ├─ 提交并推送
        ├─ 触发 pages.yml 部署
        └─ 在 Issue 下回复链接，并关闭 Issue

直接 push 中文 Markdown
   └─ translate.yml → 补齐或更新英文版 → 触发部署
```

相关文件：

| 文件 | 作用 |
| --- | --- |
| `.github/ISSUE_TEMPLATE/post.yml` | 「发布文章」表单 |
| `.github/ISSUE_TEMPLATE/reading.yml` | 「值得一读」表单 |
| `.github/workflows/issue-publish.yml` | Issue → 发布 |
| `.github/workflows/translate.yml` | push 中文后自动翻译 |
| `scripts/` | 上面两个工作流用到的 Python 脚本（不会发布到网站） |

### 一次性设置

1. **翻译密钥**：仓库 → Settings → Secrets and variables → Actions → **Secrets** → New repository secret，名称 `TRANSLATE_API_KEY`，值填你的 API Key。
2. **翻译服务（可选）**：同一页面切到 **Variables**，按需添加：

   | 变量 | 默认值 | 说明 |
   | --- | --- | --- |
   | `TRANSLATE_BASE_URL` | `https://api.openai.com/v1` | 任何兼容 OpenAI Chat Completions 的接口 |
   | `TRANSLATE_MODEL` | `gpt-4o-mini` | 模型名 |

   例如用 DeepSeek：`TRANSLATE_BASE_URL=https://api.deepseek.com`，`TRANSLATE_MODEL=deepseek-chat`。其他兼容 OpenAI 格式的服务同理。

3. **标签**：Issues → Labels → New label，建两个标签 `post` 和 `reading`。表单会自动给 Issue 打上它们，工作流靠标签判断类型。也可以用命令行：

   ```bash
   gh label create post && gh label create reading
   ```

4. **部署方式**：确认 Settings → Pages → Source 是 **GitHub Actions**（见第 15 节）。

### 用 Issue 发布

1. Issues → New issue → 选择 **✍️ 发布文章** 或 **📚 值得一读**。
2. Issue 标题就是文章标题，`[文章]`、`[值得一读]` 前缀会自动去掉。
3. 填写表单。正文支持 Markdown，图片可以直接拖进去。
4. 提交。大约一两分钟后，Action 会在 Issue 下回复文章链接并关闭 Issue；再过几分钟部署完成即可访问。

**修改**：直接编辑这个 Issue（已关闭的也可以），文章和英文版会一起更新。文件名和日期保持不变。

**Slug**：留空时，会请翻译接口根据标题生成英文短链接；没有配置密钥时，退回为 `post-<编号>` 或 `reading-<编号>`。

**安全**：只有仓库主人开的 Issue 才会触发发布，别人开的 Issue 会被忽略。

### 自动翻译的规则

- 中文文件在 `_posts/`、`_reading/`；英文版写到 `_posts/en/`、`_reading/en/`，文件名相同。
- 中文没有 `ref` 时，会自动用文件名补上，中英文因此自动对应。
- 英文文件里有 `translated: auto` 和 `source_hash`。中文改动后，`source_hash` 对不上，英文会重新翻译。
- **手写的英文永远不会被覆盖**：没有 `translated: auto` 的英文文件会被跳过。想亲自润色某篇机翻，改完后删掉 `translated: auto` 这一行，它就锁定了。
- 翻译保留 Markdown 结构；代码块、链接、Liquid 标签不翻译。
- 想全部补译一遍：Actions → **Translate** → Run workflow。
- 没有设置 `TRANSLATE_API_KEY` 时，翻译步骤会跳过，中文照常发布。

### 本地手动翻译

```bash
pip install pyyaml
export TRANSLATE_API_KEY=你的密钥
python scripts/translate.py                       # 扫描全部
python scripts/translate.py _posts/2026-10-08-a-quiet-morning.md   # 只翻这一篇
```

### 常见问题

**提交 Issue 后没有反应？**
看 Actions 页里 **Publish from issue** 有没有运行。常见原因：标签 `post` / `reading` 还没建，导致 Issue 没被打上标签；或者 Issue 不是仓库主人开的。

**推送失败，提示没有权限？**
Settings → Actions → General → Workflow permissions，选 **Read and write permissions**。

**翻译风格不满意？**
改 `scripts/common.py` 里的 `SYSTEM_PROMPT`。

---

> 工具已经备好。剩下的，只是坐下来，写。


## 移动端

整站按手机优先检查过（360、390、768、1280 宽度都没有横向溢出）：

- **顶栏**：宽度 ≤ 720px 时变成两行。第一行是站名和工具按钮（搜索、深浅色、语言），按钮的点击区域都是 40×40。第二行是可以左右滑的导航标签，当前页下面有一条陶土色下划线。往下读时顶栏会收起，往上滑一点就回来。
- **搜索**：从顶部滑出一整块面板，带「取消」按钮；打开时页面背后不会跟着滚动。
- **正文**：字号和标题略小一些；代码块铺满屏宽，表格可以横向滑动；上一篇、下一篇改成上下排列。
- **其他**：首页头像缩小；社交卡片变成单列；兼容刘海屏安全区，地址栏颜色跟随深浅色。在触屏上，卡片悬停浮起的效果关闭；oneko 小猫只在有鼠标的设备上出现。
- 断点和间距在 `_sass/_layout.scss` 末尾的 `@media (max-width: 720px)`。顶栏高度变量是 `--header-h`，周历的吸顶栏会跟着它走。


## 插画（Droit 白狗）

文字优先，每个页面只出现一张插画，统一放在文字之后，作为页尾的收尾小图。首页的头图例外：宽屏放在简介右侧，手机上放在简介之后。规则和每张图的 key 见 `_data/droit.yml` 顶部注释和 README.zh.md 的「Droit 白狗插画」一节。


## 订阅、阅读时长、404、标签与归档

- **订阅（RSS / Atom）**：每种语言各一份。中文在 `/feed.xml`，英文在 `/en/feed.xml`，各自只收本语言的文章，最多 `feed_limit` 篇（默认 20）。模板在 `_includes/feed.xml`。页面 `<head>` 和社交页的 RSS 链接会自动指向当前语言的那一份。不再依赖 jekyll-feed 插件。
- **阅读时长**：`_config.yml` 的 `reading_speed` 按语言设置速度。中文按字数算，默认每分钟 400 字（`number_of_words: "cjk"`）；英文按词数算，默认每分钟 220 词。结果向上取整，最少 1 分钟。计算逻辑在 `_includes/reading-time.html`。
- **404**：`404.html` 是中文版，`en/404.html` 是英文版。GitHub Pages 遇到任何不存在的地址都只会返回根目录的 `404.html`；如果访问的地址在 `/en/` 下，页面会自动跳到英文版。两版都附了另一种语言的一行提示，也都有一个“搜一搜”链接，点了会打开搜索。
- **标签页 / 归档页**：`_config.yml` 里的 `tags_page` 和 `archive_page` 是开关，默认都打开。
  - 打开时：文章列表页标题下面会出现「归档 · 标签」两个小链接，文章顶部的标签也会变成链接，点了直接跳到标签页里对应的那一组。
  - 关掉（改成 `false`）时：这些链接会消失；访问 `/tags/` 或 `/archive/` 的人会被送回文章列表，页面带 `noindex`，不会被搜索引擎收录。
  - 页面文件：`tags/index.html`、`archive/index.html`，英文版在 `en/` 下。


## 友链与返回链接

- **友链**：数据在 `_data/friends.yml`，是一个可以整个关掉的模块。
  - `enabled: false` 时，社交页底部的友链入口会消失，访问 `/social/friends/` 的人会被送回社交页。
  - 每位朋友填 `name`、`url`，再加 `avatar`（图片地址）或 `github`（用户名，自动取 GitHub 头像）。`desc` 按语言写一句介绍。`hidden: true` 可以暂时藏起来。
  - 没有头像、或头像加载失败时，显示名字的第一个字。
  - `me` 是页面底部「交换友链」里展示的本站信息。
  - 页面文件：`social/friends.html`，英文版是 `en/social/friends.html`。模板在 `_includes/friends/`。
- **返回链接**：任何页面的 front matter 写 `back: <ref>`，标题上方就会出现「← 那一页的标题」。人生周历写的是 `back: life`，友链写的是 `back: social`，标签和归档写的是 `back: blog`。
