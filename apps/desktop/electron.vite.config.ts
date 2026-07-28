import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// These workspace packages ship raw uncompiled .ts source, so they must never be
// externalized (left as bare `require`/`import`) in either the main or preload
// bundle — Node/Electron would then choke on the .ts extension at runtime with
// ERR_UNKNOWN_FILE_EXTENSION. Keep this list shared so main and preload can't drift.
const MOOLY_WORKSPACE_PACKAGES = [
  '@mooly/shared-types',
  '@mooly/capture',
  '@mooly/context',
  '@mooly/providers',
  '@mooly/personalization',
  '@mooly/storage'
];

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: MOOLY_WORKSPACE_PACKAGES
      })
    ],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: MOOLY_WORKSPACE_PACKAGES
      })
    ],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
        // Electron's preload loader only supports CommonJS, regardless of file
        // extension — without this, Vite emits ESM (`import ...`) here because
        // apps/desktop's package.json has "type": "module", and Electron then
        // fails with "Cannot use import statement outside a module".
        output: {
          format: 'cjs',
          entryFileNames: '[name].js'
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          settings: resolve(__dirname, 'src/renderer/settings/index.html')
        }
      }
    },
    plugins: [react()]
  }
});
