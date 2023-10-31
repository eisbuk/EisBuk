import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const __isCI__ = Boolean(process.env.CI);

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "c8",
      reporter: ["lcov"],
    },
    // We're testing with firebase emulators, which, can be a bit slow
    // (either when emulators are just being started, as well as when multiple test threads make requests against them),
    // while our tests are fast.
    // We could reduce the number of testing threads, to reduce the load on the emulators,
    // but that would slow down the whole suite significantly (and still leave room for flakiness).
    // However, we can keep the tests fast, and simply allow for longer timeouts, where the quick and easy tests will finish quickly,
    // and the tests requiring the emulators to respond will wait a bit longer,
    // giving us (kinda) zero overhead assurance that the tests won't be flaky:
    // We pay the performance toll when that's needed to remove flakieness (waiting for emulators to respont),
    // but there's no toll for tests that don't need it.
    testTimeout: __isCI__ ? 15000 : 10000,
    setupFiles: ["./vitest.setup.ts"],
    maxConcurrency: 3,
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
});
