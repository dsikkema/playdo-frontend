/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/test.{ts,tsx}', '**/*.test.{ts,tsx}']
  },
  server: {
    allowedHosts: ["playdo.sikkema.duckdns.org", "localhost", "127.0.0.1", "0.0.0.0"]
  }
})
