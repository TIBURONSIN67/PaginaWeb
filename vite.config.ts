import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mi Aplicación React',
        short_name: 'MiApp',
        start_url: '/',
        display: 'standalone',
        orientation: 'landscape', // Configuración para orientación horizontal
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Esto permite exponer la app en la red local
    port: 5173, // Opcionalmente, puedes cambiar el puerto si lo deseas
  },
    build: {
    outDir: 'dist', // Asegúrate de que esta ruta sea correcta
  },
})
