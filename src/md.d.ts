export interface PostMetadata {
  title: string;
  date?: string;
  description?: string;
  draft: boolean;
}

export interface PostModule {
  slug: string;
  metadata: PostMetadata;
  html: string;
  default: string;
}

declare module "*.md" {
  export const slug: string;
  export const metadata: PostMetadata;
  export const html: string;
  const def: string;
  export default def;
}
