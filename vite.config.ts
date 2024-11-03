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
        background_color: "#121212" 
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: '../BackEnd/dist',
  },
})
