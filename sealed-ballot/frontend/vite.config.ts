import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Removed strict CORS headers to allow RainbowKit and other third-party services
    // The relayer-sdk is loaded from CDN and doesn't require these strict policies
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  optimizeDeps: {
    exclude: ["fhevmjs"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  worker: {
    format: "es",
  },
});

