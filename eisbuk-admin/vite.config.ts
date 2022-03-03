import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'
const path = require('path')

// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
    alias:{
      '@' : path.resolve(__dirname, './src')
    },
  },
  plugins: [
    react(),
    EnvironmentPlugin({
      "FIRESTORE_EMULATOR_HOST": "",
      "NODE_ENV": "test",
      "REACT_APP_DATABASE_URL": "",
      "REACT_APP_EISBUK_SITE": "",
      "REACT_APP_FIREBASE_API_KEY": "fake-key",
      "REACT_APP_FIREBASE_APP_ID": "",
      "REACT_APP_FIREBASE_AUTH_DOMAIN": "localhost",
      "REACT_APP_FIREBASE_MEASUREMENT_ID": "",
      "REACT_APP_FIREBASE_PROJECT_ID": "eisbuk",
      "REACT_APP_FIREBASE_STORAGE_BUCKET": "",
      "REACT_APP_SENTRY_DSN": "",
      "REACT_APP_SENTRY_ENVIRONMENT": "",
      "REACT_APP_SENTRY_RELEASE": "",
      "STORYBOOK_IS_STORYBOOK": "true"
    })
  ]
})
