import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      name: "@eisbuk/shared",
      entry: path.join(__dirname, "src", "index.ts"),
      fileName: (fmt) => (fmt === "es" ? "index.es.js" : "index.js"),
      formats: ["es", "cjs"],
    },
    outDir: "dist",
  },
});
