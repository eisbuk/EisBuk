// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
//import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs'


export default defineConfig({
  plugins: [
    svelte(),
    //esbuildCommonjs(['pouchdb-quick-search'])
  ]
});
