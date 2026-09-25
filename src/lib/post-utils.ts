import type { PostMetadata, PostModule } from "../md.js";

export interface Post {
  slug: string;
  metadata: PostMetadata;
  html: string;
}

export function compareDateDesc(a: Post, b: Post): number {
  return (b.metadata.date ?? "").localeCompare(a.metadata.date ?? "");
}

/** Pure builder: sort date-desc, filter drafts when `isProd`. No env/glob access. */
export function buildPosts(modules: Record<string, PostModule> | Post[], isProd: boolean): Post[] {
  const list: Post[] = Array.isArray(modules)
    ? modules
    : Object.values(modules).map((mod) => ({ slug: mod.slug, metadata: mod.metadata, html: mod.html }));
  return list
    .filter((post) => (isProd ? !post.metadata.draft : true))
    .sort(compareDateDesc);
}

/** Pure lookup over an explicit list. No module-state access. */
export function getPostFrom(list: readonly Post[], slug: string): Post | undefined {
  return list.find((post) => post.slug === slug);
}
