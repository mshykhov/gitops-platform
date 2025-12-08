import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load ALL env vars (not just VITE_*) - official Vite approach
  const env = loadEnv(mode, process.cwd(), "");

  // Version priority: APP_VERSION env var (from Docker) > package.json
  const version = env.APP_VERSION || process.env.npm_package_version || "dev";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          cleanupOutdatedCaches: true,
          // Don't precache HTML - let it always fetch from network
          globPatterns: ["**/*.{js,css,ico,png,svg,woff,woff2}"],
          // Navigation requests: NetworkFirst (always try server first)
          navigateFallback: null,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "pages",
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
        manifest: {
          name: "Example UI",
          short_name: "Example",
          theme_color: "#1890ff",
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(version),
      "import.meta.env.API_URL": JSON.stringify(env.API_URL),
      "import.meta.env.AUTH0_DOMAIN": JSON.stringify(env.AUTH0_DOMAIN),
      "import.meta.env.AUTH0_CLIENT_ID": JSON.stringify(env.AUTH0_CLIENT_ID),
      "import.meta.env.AUTH0_AUDIENCE": JSON.stringify(env.AUTH0_AUDIENCE),
    },
  };
});
