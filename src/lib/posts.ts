import type { PostModule } from "../md.js";
import { buildPosts, type Post } from "./post-utils.js";

export type { Post };

const modules = import.meta.glob<PostModule>("../content/*.md", { eager: true });

export const posts: Post[] = buildPosts(modules, import.meta.env.PROD);

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}
