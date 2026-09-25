<script lang="ts">
  import { onDestroy } from "svelte";
  import { registerSW } from "virtual:pwa-register";
  import { fly } from "svelte/transition";

  let needRefresh = $state(false);
  let offlineReady = $state(false);
  let readyTimer: ReturnType<typeof setTimeout> | undefined;

  let message = $derived(needRefresh ? "A new version is available." : "Ready to work offline.");

  const updateSW = registerSW({
    onNeedRefresh: () => (needRefresh = true),
    onOfflineReady: () => {
      offlineReady = true;
      clearTimeout(readyTimer);
      readyTimer = setTimeout(dismiss, 4000);
    },
  });

  function dismiss() {
    needRefresh = false;
    offlineReady = false;
  }

  onDestroy(() => {
    clearTimeout(readyTimer);
  });
</script>

{#if needRefresh || offlineReady}
  <div class="toast" transition:fly={{ y: 24, duration: 200 }}>
    <p class="toast-text">{message}</p>
    {#if needRefresh}
      <button type="button" class="toast-btn-solid" onclick={() => updateSW(true)}>
        Reload
      </button>
    {:else}
      <button type="button" class="toast-btn-quiet" onclick={dismiss}>Dismiss</button>
    {/if}
  </div>
{/if}
