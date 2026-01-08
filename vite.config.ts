import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      outputDir: './dist',
      external: [],
      emptyOutDir: false,
      entry: 'src/index.tsx',
      // 静的ファイルをWorkerから除外
      additionalExclude: [
        '/static/*',
        '/images/*',
        '/*.ico',
        '/*.png',
        '/*.jpg',
        '/*.json',
        '/*.xml',
        '/*.txt',
        '/*.html'
      ]
    }),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  publicDir: 'public',
  build: {
    copyPublicDir: true
  }
})
