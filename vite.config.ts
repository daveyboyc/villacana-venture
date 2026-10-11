import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: { rollupOptions: { input: ["index.html", "blueprint.html", "slice.html"] } },
  server: { port: 4731, host: "0.0.0.0", strictPort: true },
  preview: { port: 4731, host: "0.0.0.0", strictPort: true },
});
