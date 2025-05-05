import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/", // เพิ่ม base สำหรับ Netlify
  build: {
    outDir: "dist", // ระบุ output directory ให้ชัดเจน
    sourcemap: true, // เปิด sourcemap เพื่อ debug ง่ายขึ้น
    rollupOptions: {
      // กรณี Rollup มีปัญหาเรื่อง external imports
      external: mode === "production" ? [] : ["/src/main.tsx"],
    },
  },
}));
