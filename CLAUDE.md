# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a static website with no build system. Development is done by editing files and previewing them in a web browser.

- **Local Preview**: Open `index.html` in a web browser or use a simple static server (e.g., `python3 -m http.server`).
- **Check Status**: `git status`
- **View Changes**: `git diff`

## Code Architecture

The repository is a single-page personal website featuring a two-phase experience: an introduction phase and a main content phase.

### Core Structure

- **`index.html`**: The primary entry point. It contains the structure for both the `.content-intro` (landing screen) and `.content-main` (the business card/links section).
- **`js/`**:
  - **`main.js`**: Orchestrates the transition between the introduction and main content. It uses `anime.js` for SVG morphing and section transitions. It also handles event listeners for entry (click, scroll, touch).
  - **`background.js`**: Implements a high-performance WebGL fluid simulation for the background. It reads configuration from `window.config` defined in `index.html`.
  - **`log.min.js`**: Third-party minified logging or utility script.
- **`css/style.css`**: Defines the visual style, including keyframe animations (`whiteShadow`, `arrow-movement`, `letter-glow`) and responsive layouts.
- **`assets/`**: Contains static images (`avatar.jpg`, `droit.jpg`, `wechat.jpg`) and textures (`background.png`).

### Key Implementation Details

- **Transitions**: The site transitions from intro to main state via the `switchPage()` and `loadAll()` functions in `main.js`.
- **Background Effects**: The fluid simulation in `background.js` is highly configurable via the `window.config` object in `index.html`.
- **Responsive Design**: Mobile-specific logic is present in `main.js` (detecting touches and move directions) and `css/style.css` (media queries).
- **External Dependencies**: Uses CDNs for `anime.js`, icon fonts (`iconfont`), and standard fonts.
