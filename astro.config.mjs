// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import node from '@astrojs/node';

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://teamggm.com",
  output: "server",
  adapter: node({ mode: "standalone" }),
  vite: {
    plugins: [tailwindcss()],
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
      // Polyfill mínimo para libs que esperan process.env en browser (pdf-lib, satori) — evita ReferenceError: process is not defined en ChasideTest sin romper process.cwd() en SSR (node/module-runner)
      "process.env": "{}",
    },
    server: {
      allowedHosts: true,
      hmr: {
        overlay: true,
        // Fix ws://localhost:4321/?token=... 504 y Cannot read properties of undefined (reading 'send') en @vite/client
        host: "localhost",
        port: 4321,
        protocol: "ws",
      },
      // permite cualquier host (incluido *.trycloudflare.com para túneles)
      // Alternativa estricta: allowedHosts: ["terrace-writer-dressed-roulette.trycloudflare.com", ".trycloudflare.com"]
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      exclude: ["plotly.js-dist-min"],
      // satori y pdf-lib usan Node APIs que no deben pre-bundlearse para client hidratación
      include: [],
    },
    ssr: {
      noExternal: ["plotly.js-dist-min"],
    },
  },

  integrations: [react(), sitemap()]
});