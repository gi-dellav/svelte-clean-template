export interface BaseOptions {
  repo: string;
  isUserSite: boolean;
  baseOverride: string | undefined;
  hasActions: boolean;
}

/** Pure core of the Pages `base` derivation. No `process.env` access. */
export function resolveBase({ repo, isUserSite, baseOverride, hasActions }: BaseOptions): string {
  return baseOverride ?? (hasActions && repo !== "" && !isUserSite ? `/${repo}/` : "/");
}

/** Parse the `<owner>/<repo>` slug out of `GITHUB_REPOSITORY`. */
export function parseRepo(githubRepository: string | undefined): string {
  return githubRepository?.split("/")[1] ?? "";
}
