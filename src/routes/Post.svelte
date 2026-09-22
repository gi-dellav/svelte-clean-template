<script lang="ts">
  import { withBase } from "../lib/router";
  import type { Post } from "../lib/posts";

  let { post }: { post: Post } = $props();
</script>

<main class="page">
  <a href={withBase("/")} class="link-inline">← Back</a>

  <p class="eyebrow">{post.metadata.date ?? post.slug}</p>
  <h1 class="title">{post.metadata.title}</h1>
  {#if post.metadata.description}
    <p class="lede">{post.metadata.description}</p>
  {/if}

  <article class="prose max-w-none pt-8">
    {@html post.html}
  </article>
</main>
