import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' && process.env.VITE_BASE_PATH ? process.env.VITE_BASE_PATH : '/',
  plugins: [react()],
});
