import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/proxy': {
        target: 'http://207.180.203.9:5000',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract the target URL from query parameter
          const url = new URL(path, 'http://localhost');
          const targetUrl = url.searchParams.get('url');
          if (targetUrl) {
            // Remove the base URL and return just the path
            return targetUrl.replace('http://207.180.203.9:5000', '');
          }
          return path;
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // تحسين حجم البندل
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI Components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-select',
          ],
          // Charts - فصل Chart.js عن Recharts
          'vendor-charts-main': ['chart.js', 'chartjs-chart-treemap', 'react-chartjs-2'],
          'vendor-charts-detail': ['recharts'],
          // Utils
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', '@tanstack/react-query'],
          // Icons
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // حجم التحذير
    chunkSizeWarningLimit: 600,
    // تصغير الكود
    minify: 'esbuild',
    // تحسين الصور
    assetsInlineLimit: 4096, // 4KB - الصور الأصغر تصبح inline
    cssCodeSplit: true,
  },
  // تحسين الأداء
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
    ],
    exclude: ['@lovable-tagger'],
  },
}));
