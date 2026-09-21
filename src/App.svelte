<script lang="ts">
  import PwaUpdate from "./PwaUpdate.svelte";

  let count = $state(0);

  const stack = [
    { name: "Svelte 5", hint: "runes" },
    { name: "Vite", hint: "build" },
    { name: "TailwindCSS 4", hint: "styles" },
    { name: "PWA", hint: "offline" },
  ];
</script>

<main class="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 py-16">
  <div class="w-full rounded-card border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
    <div class="mb-8 flex items-center gap-3">
      <span
        class="flex size-10 items-center justify-center rounded-xl bg-brand-600 font-mono text-lg font-bold text-white"
      >
        S
      </span>
      <span class="font-mono text-sm tracking-tight text-slate-400">svelte-clean-template</span>
    </div>

    <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
      Clean, static, offline-ready.
    </h1>
    <p class="mt-4 max-w-prose text-base leading-relaxed text-slate-500">
      A minimalist starter built with Svelte and TailwindCSS. Ship a fast static webapp with a
      service worker and installable manifest included.
    </p>

    <div class="mt-8 flex flex-wrap gap-2">
      {#each stack as item (item.name)}
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
        >
          {item.name}
          <span class="text-slate-400">· {item.hint}</span>
        </span>
      {/each}
    </div>

    <div class="mt-10 flex items-center gap-4">
      <button
        type="button"
        class="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 active:scale-[0.98]"
        onclick={() => (count += 1)}
      >
        Clicked {count} {count === 1 ? "time" : "times"}
      </button>
      <a
        href="https://svelte.dev/docs/svelte/overview"
        target="_blank"
        rel="noreferrer"
        class="text-sm font-medium text-brand-600 underline-offset-4 transition hover:underline"
      >
        Read the docs →
      </a>
    </div>
  </div>

  <p class="mt-6 font-mono text-xs text-slate-400">
    Edit <span class="text-slate-500">src/App.svelte</span> to get started
  </p>
</main>

<PwaUpdate />
