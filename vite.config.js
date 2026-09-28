import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  base: '/Solar-System/',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        recit: fileURLToPath(new URL('./recit.html', import.meta.url)),
      },
    },
  },
})
