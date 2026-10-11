import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 4731, host: "0.0.0.0", strictPort: true },
  preview: { port: 4731, host: "0.0.0.0", strictPort: true },
});
