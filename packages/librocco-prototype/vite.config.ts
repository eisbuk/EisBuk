// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import environmentPlugin from "vite-plugin-environment";


export default defineConfig({
  plugins: [
    svelte(),
    environmentPlugin({}),
  ]
});
