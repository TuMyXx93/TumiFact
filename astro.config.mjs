// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react()
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@tumifact/schemas': path.resolve(import.meta.dirname, 'packages/schemas/src/index.ts'),
        '@tumifact/types': path.resolve(import.meta.dirname, 'packages/types/src/index.ts')
      }
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
});
