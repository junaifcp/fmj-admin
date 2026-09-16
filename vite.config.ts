// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "https://recruiter-phi.vercel.app", // 👈 your Cloudflare tunnel host
    ],
    // --- START: ADD THIS ---
    // Increase the max header size to handle the long Clerk handshake URL
    maxHttpHeaderSize: 16 * 1024, // 16kb
    historyApiFallback: true,
    // --- END: ADD THIS ---
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
  },
}));
