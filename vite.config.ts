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
}));
