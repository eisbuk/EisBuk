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
        "@firebase/app",
        "@firebase/auth",
        "@firebase/firestore",
        "firebase",
        "firebase-tools",
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
