import { defineConfig } from "vite";
import path from "path";

const input = {
  // At root (imported using @eisbuk/shared) we have the artefacts built
  // to be shared across the client/server packages in a cross-compatible manner
  index: path.join(__dirname, "src", "index.ts"),
  // At ui (imported using @eisbuk/shared/ui) we have the artefacts built for client
  // environment only (e.g. React components, hooks etc.) as well as some enums/types built
  // for shared usage in UI only (e.g. routes, etc., for usage in client, ui, e2e packages)
  "ui/index": path.join(__dirname, "src", "ui", "index.ts"),
};

const getRollupOutputOptions = (format) => ({
  dir: "dist",
  entryFileNames: `[name].${format === "cjs" ? "js" : "es.js"}`,
  format,
  sourcemap: true,
});

export default defineConfig(() => ({
  build: {
    target: "esnext",
    outDir: "dist",
    lib: {
      entry: input,
    },
    rollupOptions: {
      external: ["react", "luxon"],
      input,
      output: [getRollupOutputOptions("cjs"), getRollupOutputOptions("es")],
    },
  },
}));
