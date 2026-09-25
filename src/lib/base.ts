export interface BaseOptions {
  repo: string;
  isUserSite: boolean;
  baseOverride: string | undefined;
  hasActions: boolean;
}

/** Pure core of the Pages `base` derivation. No `process.env` access. */
export function resolveBase({ repo, isUserSite, baseOverride, hasActions }: BaseOptions): string {
  const normalized = normalizeBaseOverride(baseOverride);
  if (normalized !== undefined) return normalized;
  return hasActions && repo !== "" && !isUserSite ? `/${repo}/` : "/";
}

/** Normalize a user-supplied base: tolerate missing/extra slashes, reject empties. */
export function normalizeBaseOverride(baseOverride: string | undefined): string | undefined {
  const trimmed = baseOverride?.trim() ?? "";
  if (trimmed === "") return undefined;
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** Parse the `<owner>/<repo>` slug out of `GITHUB_REPOSITORY`. */
export function parseRepo(githubRepository: string | undefined): string {
  return githubRepository?.split("/")[1] ?? "";
}
