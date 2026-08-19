import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  if (command === 'build') {
    if (!env.VITE_SUPABASE_URL?.trim()) {
      throw new Error('Missing VITE_SUPABASE_URL for production build.');
    }
    if (!env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()) {
      throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY for production build.');
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    envDir: '../../',
    server: { port: 5174 },
  };
});
