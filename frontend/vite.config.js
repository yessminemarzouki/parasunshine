import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import reactSsg from "vite-plugin-react-ssg"; // Désactivé temporairement (conflit CJS/ESM)

export default defineConfig({
  // plugins: [react(), reactSsg()],
  plugins: [react()],

  ssr: {
    noExternal: ["react-router", "react-router-dom"],
  },

  build: {
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@tiptap")) return "tiptap";
            if (id.includes("xlsx")) return "xlsx";
            if (id.includes("react-router")) return "react-router";
            if (id.includes("react-dom")) return "react-vendor";
            if (id.includes("/react/")) return "react-vendor";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("axios")) return "axios";
            if (id.includes("framer-motion")) return "motion";
            return undefined;
          }
          if (id.includes("/admin/")) return "admin";
          if (id.includes("HeroCarousel")) return undefined;
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    warmup: { clientFiles: ["./src/pages/*.jsx", "./src/components/*.jsx"] },
    proxy: {
      "/api": {
        target: "http://localhost:80",
        changeOrigin: true,
        timeout: 600000,
      },
      "/storage": { target: "http://localhost:80", changeOrigin: true },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-router-dom",
      "lucide-react",
    ],
  },
});
