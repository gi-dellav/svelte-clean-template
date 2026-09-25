import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { mdPlugin } from "./plugins/md.js";
import { resolveSiteRoot, seoPlugin } from "./plugins/seo.js";
import { parseRepo, resolveBase } from "./src/lib/base.js";

export type { BaseOptions } from "./src/lib/base.js";
export { parseRepo, resolveBase } from "./src/lib/base.js";

export default defineConfig(() => {
  // GitHub Pages serves project sites under https://<owner>.github.io/<repo>/,
  // so the production base must include the repo name. Derive it automatically
  // from GITHUB_REPOSITORY so forks work without code changes.
  // Override with BASE_PATH (e.g. BASE_PATH=/ for a custom domain or
  // <owner>.github.io user site).
  const repo = parseRepo(process.env["GITHUB_REPOSITORY"]);
  const isUserSite = repo.endsWith(".github.io");
  // Treat an empty BASE_PATH (e.g. an unset GitHub `vars.BASE_PATH`) as "not set"
  // so the automatic Pages sub-path detection below still applies.
  const baseOverride = process.env["BASE_PATH"]?.trim() || undefined;
  const hasActions = Boolean(process.env["GITHUB_ACTIONS"]);
  const base = resolveBase({
    repo,
    isUserSite,
    baseOverride,
    hasActions,
  });
  // Canonical root for sitemap.xml / rss.xml / canonical links. `SITE_URL`
  // (e.g. `https://example.com/blog/`) wins; otherwise derive the Pages URL
  // on CI, else fall back to the build base. Note: when `base` is path-only
  // (local/non-CI builds), set SITE_URL to emit absolute sitemap URLs.
  const githubRepo = process.env["GITHUB_REPOSITORY"] ?? "";
  const owner = githubRepo.split("/")[0] ?? "";
  const siteRoot = resolveSiteRoot({
    siteUrlOverride: process.env["SITE_URL"]?.trim() || undefined,
    owner,
    repo,
    isUserSite,
    hasActions,
    base,
  });

  return {
    base,
    plugins: [
      mdPlugin(),
      seoPlugin({ siteRoot }),
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
          globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2,xml,txt}"],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
