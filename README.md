# Harlyn

A small, well-finished game of noughts and crosses. Vite + TypeScript, installable PWA,
deployed to GitHub Pages at [tic.chrisquinn.ie](https://tic.chrisquinn.ie).

```sh
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build to dist/
npm run icons     # regenerate public/icons from scripts/icons.mjs
```

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/`
with `actions/deploy-pages`. One-time setup on the GitHub repo:

1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Pages → Custom domain: `tic.chrisquinn.ie` (the `public/CNAME` file keeps it set).
3. DNS: a `CNAME` record for `tic` pointing at `<user>.github.io`.
