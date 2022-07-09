import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      name: "@eisbuk/react-redux-firebase-firestore",
      entry: path.join(__dirname, "src", "index.ts"),
      fileName: (fmt) => (fmt === "es" ? "index.es.js" : "index.js"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "@firebase/firestore",
        "@google-cloud/firestore",
        "luxon",
        "react",
        "react-redux",
        "redux",
        "redux-thunk",
        "uuid",
      ],
      output: {
        exports: "named",
      },
    },
    outDir: "dist",
  },
});
