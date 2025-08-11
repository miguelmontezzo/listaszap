
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'iconeapp.png'],
      manifest: {
        name: 'ListasZap',
        short_name: 'ListasZap',
        description: 'Listas de compras compartilhadas e cobranças via PIX',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#16a34a',
        icons: [
          { src: '/iconeapp.png', sizes: '192x192', type: 'image/png' },
          { src: '/iconeapp.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})
