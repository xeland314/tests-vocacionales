// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: true,
      // permite cualquier host (incluido *.trycloudflare.com para túneles)
      // Alternativa estricta: allowedHosts: ["terrace-writer-dressed-roulette.trycloudflare.com", ".trycloudflare.com"]
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      exclude: ["plotly.js-dist-min"],
    },
    ssr: {
      noExternal: ["plotly.js-dist-min"],
    },
  },

  integrations: [react()]
});