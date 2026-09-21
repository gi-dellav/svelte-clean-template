<script lang="ts">
  import PwaUpdate from "./PwaUpdate.svelte";

  let count = $state(0);

  const stack = ["Svelte 5", "Vite", "Tailwind CSS 4", "PWA", "Bun", "GitHub Pages"];
  const commands = `bun install    # install dependencies
bun run dev    # start the dev server
bun run check  # type-check with svelte-check
bun run build  # static production build into dist/
bun run preview # preview the dist/ build locally`;
</script>

<main class="page">
  <p class="eyebrow">svelte-clean-template</p>

  <h1 class="title">Clean, static, offline-ready.</h1>
  <p class="lede">
    A minimalist starter built with Svelte and Tailwind. Fast static webapp with service worker
    and manifest included. Push to <span class="font-medium text-neutral-900">main</span> and it
    ships itself to GitHub Pages.
  </p>

  <div class="meta">
    {#each stack as name, i (name)}
      <span>{name}</span>
      {#if i < stack.length - 1}
        <span aria-hidden="true" class="dot"></span>
      {/if}
    {/each}
  </div>

  <div class="actions">
    <button type="button" class="btn-primary" onclick={() => (count += 1)}>
      Clicked {count} {count === 1 ? "time" : "times"}
    </button>
    <a
      href="https://github.com/gi-dellav/svelte-clean-template"
      target="_blank"
      rel="noreferrer"
      class="link-quiet"
    >
      Use this template
    </a>
  </div>

  <section aria-labelledby="start-heading" class="section">
    <h2 id="start-heading" class="h2">Get started</h2>
    <p class="body">
      Everything runs with <a
        href="https://bun.sh"
        target="_blank"
        rel="noreferrer"
        class="link-inline">Bun</a
      > — no Node, no Docker needed:
    </p>
    <pre class="pre"><code>{commands}</code></pre>
    <p class="body">
      Edit <code class="code">src/App.svelte</code> to make it yours. The
      <code class="code">dist/</code> folder is a fully static bundle — preview it with
      <code class="code">bun run preview</code>.
    </p>
  </section>

  <section aria-labelledby="deploy-heading" class="section">
    <h2 id="deploy-heading" class="h2">Deploy to GitHub Pages</h2>
    <p class="body">
      This repo ships with two Bun-powered workflows: <code class="code">CI</code> checks every
      push and PR, and <code class="code">Deploy to GitHub Pages</code> publishes
      <code class="code">dist/</code> on every push to
      <code class="code">main</code>.
    </p>
    <ol class="steps">
      <li>
        <span class="step-title">Use this template.</span>
        <span class="step-body"
          >Click <strong>Use this template</strong> (or fork), keeping the default
          <code class="code">main</code> branch.</span
        >
      </li>
      <li>
        <span class="step-title">Enable Pages.</span>
        <span class="step-body"
          >In your repo go to <code class="code">Settings → Pages → Build and deployment</code>
          and select <strong>GitHub Actions</strong> as the source.</span
        >
      </li>
      <li>
        <span class="step-title">Push to main.</span>
        <span class="step-body"
          >The deploy workflow installs with Bun, runs
          <code class="code">bun run check</code> and <code class="code">bun run build</code>,
          then publishes <code class="code">dist/</code>. Your site lands at
          <code class="code">https://&lt;owner&gt;.github.io/&lt;repo&gt;/</code>.</span
        >
      </li>
    </ol>
    <p class="note">
      Works on forks with zero config: <code class="code">vite.config.ts</code> derives the Pages
      sub-path from <code class="code">GITHUB_REPOSITORY</code> automatically. Deploying a
      <code class="code">&lt;user&gt;.github.io</code> site or a custom domain instead? Set the
      repository variable <code class="code">BASE_PATH=/</code> under
      <code class="code">Settings → Secrets and variables → Actions → Variables</code>.
    </p>
  </section>

  <p class="footnote">Edit <span class="text-neutral-500">src/App.svelte</span> to get started</p>
</main>

<PwaUpdate />
