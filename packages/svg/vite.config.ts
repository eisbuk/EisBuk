import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "src", "assets"),
    },
  },
  build: {
    lib: {
      name: "@eisbuk/svg",
      entry: path.join(__dirname, "src", "index.ts"),

      // Using this to build both the 'cjs' ans 'es' modules
      // The appropriate entry points are defined in 'package.json'
      fileName: (fmt) => (fmt === "es" ? "index.es.js" : "index.js"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // React should be used in the main app, and not bundled in
      // as multiple instances of React can cause a bunch of problems
      external: ["react"],
      output: {
        exports: "named",

        // Global vars to use in UMD build for externalized deps
        globals: {
          react: "React",
        },
      },
    },
    outDir: "dist",
  },
  plugins: [
    react(),
    svgr({
      // This way we're able to use default imports for SVGs
      // Like so:
      //
      // import Icon from "./icon.svg"
      exportAsDefault: true,
      svgrOptions: {
        // Remove width and height from and SVG
        dimensions: false,
        // Set width and height of each SVG to "100%"
        // That way actual dimensions of SVGs are controlled by container element
        svgProps: { width: "100%", height: "100%" },
      },
    }),
  ],
});
