import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-wasm-files',
      buildStart() {
        const wasmFiles = [
          'node_modules/web-ifc/web-ifc.wasm',
          'node_modules/web-ifc/web-ifc-mt.wasm',
        ]
        const workerFiles = [
          'node_modules/web-ifc/web-ifc-mt.worker.js',
        ]
        
        const publicDir = 'public'
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true })
        }
        
        [...wasmFiles, ...workerFiles].forEach(file => {
          const fileName = file.split('/').pop()
          const dest = resolve(publicDir, fileName!)
          try {
            if (existsSync(file)) {
              copyFileSync(file, dest)
              console.log(`✓ Copied ${fileName} to public/`)
            }
          } catch (err) {
            console.warn(`⚠ Could not copy ${fileName}:`, err)
          }
        })
      }
    }
  ],
  optimizeDeps: {
    exclude: ['@ifc-viewer/core', 'web-ifc'],
  },
  assetsInclude: ['**/*.wasm', '**/*.ifc'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
