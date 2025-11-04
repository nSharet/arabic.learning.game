# Arabic Learning Game – Full (GitHub Pages Ready)

## Quick Deploy (GitHub Pages)
```bash
npm install
npm run deploy
```
Then set **Settings → Pages → Source: gh-pages / (root)**.

### Base path
This project uses `base: './'` and usually works on GH Pages. If assets 404, set in `vite.config.js`:
```js
base: '/arabic.learning.game/'
```
and redeploy.

## Local dev
```bash
npm run dev
```
