import type { PostMetadata, PostModule } from "../md.js";

export interface Post {
  slug: string;
  metadata: PostMetadata;
  html: string;
}

const modules = import.meta.glob<PostModule>("../content/*.md", { eager: true });

function compareDateDesc(a: Post, b: Post): number {
  return (b.metadata.date ?? "").localeCompare(a.metadata.date ?? "");
}

export const posts: Post[] = Object.values(modules)
  .map((mod) => ({ slug: mod.slug, metadata: mod.metadata, html: mod.html }))
  .filter((post) => (import.meta.env.PROD ? !post.metadata.draft : true))
  .sort(compareDateDesc);

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}
