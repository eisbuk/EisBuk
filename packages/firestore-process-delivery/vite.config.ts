import { defineConfig } from "vite";
import path from "path";
import environmentPlugin from "vite-plugin-environment";

export default defineConfig({
  build: {
    lib: {
      name: "@eisbuk/firestore-process-delivery",
      entry: path.join(__dirname, "src", "index.ts"),
      fileName: (fmt) => (fmt === "es" ? "index.es.js" : "index.js"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "firebase",
        "firebase-functions",
        "firebase-admin",
        "uuid",
        "lodash",
        "luxon",
        "@google-cloud/firestore",
      ],
      output: {
        exports: "named",
      },
    },
    outDir: "dist",
  },
  plugins: [environmentPlugin({ LOG_LEVEL: "" })],
});
