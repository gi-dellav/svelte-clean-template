<script lang="ts">
  import { withBase } from "./lib/router";

  interface Props {
    title?: string;
    description?: string | undefined;
    path: string;
    noindex?: boolean;
  }

  const {
    title = "Svelte Clean Template",
    description = "A clean static Svelte + Tailwind PWA template.",
    path,
    noindex = false,
  }: Props = $props();

  const fullTitle = $derived(
    title === "Svelte Clean Template" ? title : `${title} · Svelte Clean Template`,
  );
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={withBase(path)} />
  {#if noindex}
    <meta name="robots" content="noindex" />
  {/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Svelte Clean Template" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={withBase(path)} />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
</svelte:head>
