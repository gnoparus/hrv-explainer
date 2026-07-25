import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'HRV Explainer',
        short_name: 'HRV Explainer',
        description: 'Interactive R-R interval / HRV simulator',
        theme_color: '#05080b',
        background_color: '#05080b',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // App is pure client-side compute with no external calls -- default precache of the
      // build output is all that's needed for full offline use (no runtime caching rules).
    }),
  ],
})
