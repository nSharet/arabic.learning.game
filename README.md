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

## Deploy & verify

Build and deploy (GitHub Pages example):

```bash
npm run build
npm run deploy
```

Quick verification (locally, before or after deploy):

- Inspect the built `dist/index.html` to see how assets are referenced:

```bash
sed -n '1,120p' dist/index.html
ls -la dist/assets
```

- You can use the included helper script to verify the deployed URL serves the `index.html` and the two built assets with HTTP 200 responses. Usage:

```bash
# Make sure you've built at least once: npm run build
scripts/check-deploy.sh <deployed_base_url>
# Example for GitHub Pages:
scripts/check-deploy.sh https://<your-user>.github.io/<your-repo>
```

The script will parse `dist/index.html` to find the JS/CSS asset filenames and then check the deployed URLs.
