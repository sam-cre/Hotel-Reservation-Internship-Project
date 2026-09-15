import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const env = loadEnv(mode, root, '');
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.js'],
      include: ['test/**/*.test.{js,jsx}'],
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.PORT || 3001}`,
          changeOrigin: true,
        },
      },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  };
});
