import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// For GitHub Pages: './' works for most project pages.
// If deploying to username.github.io root, you can set base: '/'.
export default defineConfig({
  plugins: [react()],
  base: './',
})
