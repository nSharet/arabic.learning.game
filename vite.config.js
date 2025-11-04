import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use a relative base so built assets are referenced relative to index.html.
  // This avoids 404s when the site is served from a custom domain or the root.
  base: './',
})
