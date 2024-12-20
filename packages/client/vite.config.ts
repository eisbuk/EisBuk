import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import environmentPlugin from "vite-plugin-environment";
import svgr from "vite-plugin-svgr";
import path from "path";

// replace /src with /instrumented files for code coverage
const src = !process.env.USE_INSTRUMENTED ? "./src" : "./instrumented";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, src),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    react(),
    environmentPlugin({
      FIRESTORE_EMULATOR_HOST: "",
      BUILD_ENV: "development",
      REACT_APP_DATABASE_URL: "",
      REACT_APP_EISBUK_SITE: "",
      REACT_APP_FIREBASE_API_KEY: "fake-key",
      REACT_APP_FIREBASE_APP_ID: "",
      REACT_APP_FIREBASE_AUTH_DOMAIN: "localhost",
      REACT_APP_FIREBASE_MEASUREMENT_ID: "",
      REACT_APP_FIREBASE_PROJECT_ID: "eisbuk",
      REACT_APP_FIREBASE_STORAGE_BUCKET: "",
      REACT_APP_SENTRY_DSN: "",
      REACT_APP_SENTRY_ENVIRONMENT: "",
      REACT_APP_SENTRY_RELEASE: "",
      REACT_APP_FIRESTORE_EMULATOR_HOST: "127.0.0.1",
      REACT_APP_FIRESTORE_EMULATOR_PORT: "8080",
      REACT_APP_AUTH_EMULATOR_HOST: "127.0.0.1",
      REACT_APP_AUTH_EMULATOR_PORT: "9099",
      REACT_APP_FUNCTIONS_EMULATOR_HOST: "127.0.0.1",
      REACT_APP_FUNCTIONS_EMULATOR_PORT: "5001",
    }),
    svgr(),
  ],
});
