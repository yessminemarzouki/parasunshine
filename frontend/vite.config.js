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
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Code splitting avancé
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ─────────────────────────────────────────
          // 1. Code applicatif (src/)
          // ─────────────────────────────────────────
          if (!id.includes("node_modules")) {
            if (id.includes("/admin/")) return "admin";
            if (id.includes("/pages/ProductDetail")) return "page-product";
            if (id.includes("/pages/Blog")) return "page-blog";
            return undefined;
          }

          // ─────────────────────────────────────────
          // 2. Vendors — ordre important :
          //    du plus spécifique au plus général
          // ─────────────────────────────────────────
          if (id.includes("@tiptap")) return "tiptap";
          if (id.includes("xlsx")) return "xlsx";
          if (id.includes("react-router")) return "react-router";
          if (id.includes("react-dom")) return "react-vendor";
          if (id.includes("/react/")) return "react-vendor";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("axios")) return "axios";
          if (id.includes("framer-motion")) return "motion";

          // ─────────────────────────────────────────
          // 3. Pas de catch-all "vendor" pour éviter les cycles.
          //    Les modules non classifiés restent dans le chunk
          //    par défaut de Vite (pas de dépendance circulaire).
          // ─────────────────────────────────────────
          return undefined;
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
        timeout: 600000,
        proxyTimeout: 600000,
      },
      "/storage": {
        target: "http://localhost:80",
        changeOrigin: true,
      },
    },
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "lucide-react"],
  },
});
