<script lang="ts">
  import { onMount } from "svelte";
  import PwaUpdate from "./PwaUpdate.svelte";
  import Post from "./routes/Post.svelte";
  import { getPost, posts } from "./lib/posts";
  import {
    currentRoute,
    handleLinkClick,
    withBase,
    type Route,
  } from "./lib/router";

  let route = $state<Route>({ name: "home" });
  let activePost = $derived(route.name === "post" ? getPost(route.slug) : undefined);

  onMount(() => {
    route = currentRoute();
    const onPopState = () => {
      route = currentRoute();
      window.scrollTo({ top: 0 });
    };
    const onClick = (event: MouseEvent) => handleLinkClick(event);
    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick);
    };
  });

  let count = $state(0);

  const stack = ["Svelte 5", "Vite", "Tailwind CSS 4", "PWA", "Bun", "GitHub Pages"];
  const commands = `bun install    # install dependencies
bun run dev    # start the dev server
bun run check  # type-check with svelte-check
bun run build  # static production build into dist/
bun run preview # preview the dist/ build locally`;
</script>

{#if route.name === "post"}
  {#if activePost}
    <Post post={activePost} />
  {:else}
    <main class="page">
      <p class="eyebrow">404</p>
      <h1 class="title">Post not found.</h1>
      <div class="actions">
        <a href={withBase("/")} class="btn-primary">Back home</a>
      </div>
    </main>
  {/if}
{:else if route.name === "not-found"}
  {@const missingPath = route.path}
  <main class="page">
    <p class="eyebrow">404</p>
    <h1 class="title">Page not found.</h1>
    <p class="lede">No page at <code class="code">{missingPath}</code>.</p>
    <div class="actions">
      <a href={withBase("/")} class="btn-primary">Back home</a>
    </div>
  </main>
{:else}
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

  <section aria-labelledby="writing-heading" class="section">
    <h2 id="writing-heading" class="h2">Writing</h2>
    <p class="body">
      Posts live in <code class="code">src/content/*.md</code> — compiled to HTML at build time,
      with frontmatter and GFM (tables, task lists).
    </p>
    <ol class="steps">
      {#each posts as post (post.slug)}
        <li>
          <a href={withBase(`/post/${post.slug}`)} class="link-inline">
            {post.metadata.title}
          </a>
          <span class="step-body">
            {post.metadata.description ?? post.slug}
            {#if post.metadata.date} · {post.metadata.date}{/if}
          </span>
        </li>
      {/each}
    </ol>
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

  <footer class="footer">
    <a
      href="https://github.com/gi-dellav/svelte-clean-template"
      target="_blank"
      rel="noreferrer"
      class="github-link"
      aria-label="View source on GitHub"
    >
      <svg
        class="github-icon"
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9 1.09 1.6.42.7 1.23 2.3 2.98 1.95.09-.73.53-1.56.97-1.9-3.39-.38-6.96-1.69-6.96-7.53 0-1.66.59-3.02 1.56-4.08-.16-.38-.68-1.93.15-4.03 0 0 1.27-.4 4.16 1.56a14.5 14.5 0 0 1 7.58 0c2.89-1.96 4.16-1.56 4.16-1.56.83 2.1.31 3.65.15 4.03 1 1.06 1.57 2.42 1.57 4.08 0 5.84-3.58 7.15-6.98 7.53.55.47.85 1.4.85 2.83 0 2.05-.02 3.7-.02 4.2 0 .21.14.46.55.38A7.995 7.995 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
        />
      </svg>
      <span>gi-dellav/svelte-clean-template</span>
    </a>
  </footer>
  </main>
{/if}

<PwaUpdate />
