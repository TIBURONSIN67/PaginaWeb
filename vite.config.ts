import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        display: "standalone",
        display_override: ["window-controls-overlay"],
        lang: "es-ES",
        name: "Super Lambo",
        description: "Super Lambo",
        theme_color: "#000000", 
        background_color: "#121212",
        scope: "/", 
        start_url: "/",
        icons: [
          {
            src: '/icon-128x128.png', // Icono de 128x128
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icon-192x192.png', // Icono de 192x192
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png', // Icono de 512x512
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-384x384.png', // Otras resoluciones si es necesario
            sizes: '384x384',
            type: 'image/png',
          },
        ],
      },
      registerType: 'autoUpdate', // El SW se actualizará automáticamente
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
      }
    })
  ],
  base:"https://tiburonsin67.github.io/PaginaWeb",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
