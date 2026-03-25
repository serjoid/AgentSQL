import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TAURI_DEV_HOST is set by `tauri dev` when the app runs on a physical device.
// For desktop development it is undefined and we bind to localhost only.
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development and only apply in `tauri dev` or `tauri build`.
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,

  server: {
    port: 3000,
    strictPort: true,
    // Listen on the Tauri dev host when provided (mobile), otherwise localhost.
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 3001 }
      : undefined,
    watch: {
      // Tell Vite to ignore watching `src-tauri` to prevent Tauri from
      // restarting the Rust build on frontend file changes.
      ignored: ['**/src-tauri/**'],
    },
  },

  // Expose TAURI_ENV_* and VITE_* env variables to the frontend.
  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  build: {
    // Tauri supports es2021
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
