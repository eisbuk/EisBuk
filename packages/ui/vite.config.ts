import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "src", "assets"),
    },
  },
  build: {
    lib: {
      name: "@eisbuk/ui",
      entry: path.join(__dirname, "src", "index.ts"),

      // Using this to build both the 'cjs' ans 'es' modules
      // The appropriate entry points are defined in 'package.json'
      fileName: (fmt) => (fmt === "es" ? "index.es.js" : "index.js"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // React should be used in the main app, and not bundled in
      // as multiple instances of React can cause a bunch of problems
      external: ["formik", "react", "react-dom", "react-router-dom"],
      output: {
        exports: "named",

        // Global vars to use in UMD build for externalized deps
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    outDir: "dist",
  },
  plugins: [react()],
});
