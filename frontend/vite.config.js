import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:4001';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      open: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/auth': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
