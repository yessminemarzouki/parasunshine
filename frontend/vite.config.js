import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Optimisations de build
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Supprime les console.log en prod
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Sépare les vendors (bibliothèques)
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          icons: ["lucide-react"],
        },
      },
    },

    // Augmente la limite de warning
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    warmup: {
      clientFiles: ["./src/pages/*.jsx", "./src/components/*.jsx"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:80",
        changeOrigin: true,
        timeout: 600000, // 10 min — nécessaire pour les imports volumineux (ZIP images)
        proxyTimeout: 600000,
      },
      "/storage": {
        target: "http://localhost:80",
        changeOrigin: true,
      },
    },
  },

  // Optimise les dépendances
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "lucide-react"],
  },
});
