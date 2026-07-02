import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: works at the GitHub Pages project URL now and a custom domain later
  base: './',

  // Server configuration
  server: {
    port: 5173,
    open: true,
  },

  // Build configuration
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        notes: 'notes.html',
      },
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    // CSS and JS minification for production
    minify: 'esbuild',
    cssMinify: true,
  },

  // Asset handling
  assetsInclude: ['**/*.png', '**/*.json'],
});
