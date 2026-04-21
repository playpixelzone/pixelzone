import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'games',
          dest: '.',
        },
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        admin: resolve(__dirname, 'admin.html'),
        phaserSandbox: resolve(__dirname, 'phaser-sandbox.html'),
        necromancerIdle: resolve(__dirname, 'games/necromancer-idle/index.html'),
      },
    },
    chunkSizeWarningLimit: 1600,
  },
});
