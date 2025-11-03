# Arabic Learning Game (Vite + React)

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy to GitHub Pages
1. Commit & push this project to a GitHub repository (e.g., `arabic-game`).
2. Make sure the repository's **Settings → Pages** is set to serve from the `gh-pages` branch (it will be created on first deploy).
3. Build & deploy:
```bash
npm run deploy
```
This will publish the `dist/` folder to the `gh-pages` branch.

### IMPORTANT (base path)
This project sets `base: './'` in `vite.config.js` so it works well on GitHub Pages project sites.
If you publish to a user site (e.g., `username.github.io`), you can set `base: '/'` instead.
If you publish under a repository (e.g., `/arabic-game/`), `./` will still work in most cases.
