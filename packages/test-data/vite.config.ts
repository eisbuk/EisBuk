import { defineConfig } from "vite";
import path from "path";
import ts from "typescript";

const entries = [
  "attendance",
  "customers",
  "dataTriggers",
  "date",
  "migrations",
  "slots",
  "testIds",
];

const input = entries.reduce((acc, entry) => {
  acc[entry] = `./src/${entry}/index.ts`;
  return acc;
}, {});

const getRollupOutputOptions = (format) => ({
  dir: "dist",
  entryFileNames: `[name]/index.${format === "cjs" ? "js" : "es.js"}`,
  format,
  sourcemap: true,
});

export default defineConfig(() => {
  return {
    build: {
      target: "esnext",
      outDir: "dist",
      lib: {
        entry: input,
      },
      rollupOptions: {
        input,
        output: [getRollupOutputOptions("cjs"), getRollupOutputOptions("es")],
      },
    },
  };
});
