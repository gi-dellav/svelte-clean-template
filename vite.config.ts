import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { mdPlugin } from "./plugins/md.js";

export default defineConfig(() => {
  // GitHub Pages serves project sites under https://<owner>.github.io/<repo>/,
  // so the production base must include the repo name. Derive it automatically
  // from GITHUB_REPOSITORY so forks work without code changes.
  // Override with BASE_PATH (e.g. BASE_PATH=/ for a custom domain or
  // <owner>.github.io user site).
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
  const isUserSite = repo.endsWith(".github.io");
  // Treat an empty BASE_PATH (e.g. an unset GitHub `vars.BASE_PATH`) as "not set"
  // so the automatic Pages sub-path detection below still applies.
  const baseOverride = process.env.BASE_PATH?.trim() || undefined;
  const base =
    baseOverride ??
    (process.env.GITHUB_ACTIONS && repo && !isUserSite ? `/${repo}/` : "/");

  return {
    base,
    plugins: [
      mdPlugin(),
      svelte(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "Svelte Clean Template",
          short_name: "Clean",
          description: "A clean static Svelte + Tailwind PWA template.",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          start_url: base,
          scope: base,
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
