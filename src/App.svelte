<script lang="ts">
  import PwaUpdate from "./PwaUpdate.svelte";

  let count = $state(0);

  const stack = ["Svelte 5", "Vite", "Tailwind CSS 4", "PWA"];
</script>

<main class="page">
  <p class="eyebrow">svelte-clean-template</p>

  <h1 class="title">Clean, static, offline-ready.</h1>
  <p class="lede">
    A minimalist starter built with Svelte and Tailwind. Fast static webapp with service worker
    and manifest included.
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
      href="https://svelte.dev/docs/svelte/overview"
      target="_blank"
      rel="noreferrer"
      class="link-quiet"
    >
      Read the docs
    </a>
  </div>

  <p class="footnote">Edit <span class="text-neutral-500">src/App.svelte</span> to get started</p>
</main>

<PwaUpdate />
