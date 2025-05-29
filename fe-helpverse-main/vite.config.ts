import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const apiUrl = env.BASE_URL_API || 'http://localhost:5000';

  return {
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    define: {
      'import.meta.env.BASE_URL_API': JSON.stringify(env.BASE_URL_API)
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl.replace('/api', ''),
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              // Handle proxy errors
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Handle proxy requests
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              // Handle proxy responses
            });
          },
        }
      },
      cors: true
    }
  };
});
