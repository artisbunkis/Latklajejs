import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // CRITICAL for GitHub Pages: 'base: "./"' ensures relative asset paths,
    // preventing blank pages when deployed to a subpath (e.g., https://user.github.io/repo-name/).
    // This allows the browser to correctly find your bundled JS/CSS files.
    base: './', 
    define: {
      // This allows 'process.env.API_KEY' to work in the browser after build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY)
    }
  };
});