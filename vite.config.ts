import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: [
      "@react-pdf/renderer",
      "fontkit",
      "unicode-trie",
      "unicode-properties",
      "base64-js",
      "brotli",
      "clone",
      "restructure",
      "tiny-inflate",
      "dfa",
      "png-js",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "firebase/storage",
      "firebase/analytics",
    ],
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
  },
});
