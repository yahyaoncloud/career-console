import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/db.json', '**/content/**']
      },
      // Pre-transform critical entry files when the dev server starts so they
      // are ready instantly on the first browser request (reduces cold-load blank flash).
      warmup: {
        clientFiles: ['./src/main.tsx', './src/App.tsx', './src/index.css'],
      },
    },
    optimizeDeps: {
      // Pre-bundle these ESM packages so Vite doesn't re-discover & re-optimize
      // them on every cold start — prevents the blank white/dark flash on reload.
      include: [
        'react-markdown',
        'remark-gfm',
        'rehype-raw',
        'rehype-slug',
        'react-syntax-highlighter',
        'react-syntax-highlighter/dist/esm/styles/prism',
        'lucide-react',
        'motion',
      ],
    }
  };
});
