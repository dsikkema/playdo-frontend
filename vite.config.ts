/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { Plugin } from 'vite'

// Custom plugin to handle Pyodide files
function pyodidePlugin(): Plugin {
  return {
    name: 'vite-plugin-pyodide',
    configureServer(server) {
      // Set correct MIME types for Pyodide files
      server.middlewares.use((req, res, next) => {
        if (req.url?.includes('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
        } else if (req.url?.includes('.asm.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config https://vitest.dev/config
export default defineConfig({
  plugins: [react(), tsconfigPaths(), pyodidePlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/test.{ts,tsx}', '**/*.test.{ts,tsx}']
  },
  server: {
    allowedHosts: [
      'playdo.sikkema.duckdns.org',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ],
    // Configure proper MIME types for WebAssembly files
    fs: {
      strict: false
    },
    headers: {
      // Set MIME types for WebAssembly files
      'cache-control': 'no-store'
    }
  },
  // Add optimizeDeps configuration to handle Pyodide properly
  optimizeDeps: {
    // Tell Vite not to process Pyodide, we'll handle it ourselves
    exclude: ['pyodide']
  },
  // Configure builds to properly handle WebAssembly
  build: {
    commonjsOptions: {
      // Include WebAssembly files in the bundle
      transformMixedEsModules: true
    },
    // Increase chunk size limit for WebAssembly files
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: {
          pyodide: ['pyodide']
        }
      }
    }
  },
  // Make sure Vite recognizes WebAssembly files as assets
  assetsInclude: ['**/*.wasm'],
  resolve: {
    dedupe: ['pyodide']
  }
})
