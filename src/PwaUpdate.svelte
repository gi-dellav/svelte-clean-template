<script lang="ts">
  import { registerSW } from "virtual:pwa-register";
  import { fly } from "svelte/transition";

  let needRefresh = $state(false);
  let offlineReady = $state(false);

  const updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true;
    },
    onOfflineReady() {
      offlineReady = true;
      setTimeout(() => (offlineReady = false), 4000);
    },
  });
</script>

{#if needRefresh || offlineReady}
  <div
    class="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(92%,28rem)] items-center justify-between gap-4 rounded-card border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5"
    transition:fly={{ y: 24, duration: 200 }}
  >
    <p class="text-sm text-slate-600">
      {needRefresh ? "A new version is available." : "Ready to work offline."}
    </p>
    {#if needRefresh}
      <button
        type="button"
        class="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
        onclick={() => updateSW(true)}
      >
        Reload
      </button>
    {:else}
      <button
        type="button"
        class="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        onclick={() => (offlineReady = false)}
      >
        Dismiss
      </button>
    {/if}
  </div>
{/if}
