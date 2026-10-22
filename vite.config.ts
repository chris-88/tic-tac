import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// tic.chrisquinn.ie serves from the root. VITE_BASE_PATH lets a project-page preview build at
// /tic-tac/ before DNS is pointed at Pages.
const base = process.env.VITE_BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: base,
        name: 'Tic Tac',
        short_name: 'Tic Tac',
        description: 'A quiet, well-made game of noughts and crosses.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        lang: 'en-IE',
        theme_color: '#0b0c10',
        background_color: '#0b0c10',
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `${base}icons/icon-512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
