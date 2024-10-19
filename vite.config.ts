import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true, // Esto permite exponer la app en la red local
    port: 5173, // Opcionalmente, puedes cambiar el puerto si lo deseas
  },
    build: {
    outDir: 'dist', // Asegúrate de que esta ruta sea correcta
  },
}) 