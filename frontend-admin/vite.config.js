import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 1. Apagamos la consola y el debugger
  esbuild: {
    drop: ['console', 'debugger'],
  },
  // 2. Apagamos los mapas de código fuente (Nadie verá tu código original)
  build: {
    sourcemap: false, 
  }
})
