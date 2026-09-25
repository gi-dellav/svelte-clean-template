import { describe, expect, it } from "bun:test";
import { parseRepo, resolveBase } from "../src/lib/base.js";

describe("parseRepo", () => {
  it("extracts the repo from owner/repo", () => {
    expect(parseRepo("owner/my-repo")).toBe("my-repo");
  });

  it("returns empty string for missing or malformed values", () => {
    expect(parseRepo(undefined)).toBe("");
    expect(parseRepo("")).toBe("");
    expect(parseRepo("owner")).toBe("");
  });
});

describe("resolveBase", () => {
  it("prefers an explicit override untouched", () => {
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: "/custom/", hasActions: true }),
    ).toBe("/custom/");
    expect(resolveBase({ repo: "my-repo", isUserSite: true, baseOverride: "/", hasActions: true })).toBe("/");
  });

  it("derives the Pages sub-path on CI for project sites", () => {
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: undefined, hasActions: true }),
    ).toBe("/my-repo/");
  });

  it("serves user sites and local runs from root", () => {
    expect(
      resolveBase({ repo: "owner.github.io", isUserSite: true, baseOverride: undefined, hasActions: true }),
    ).toBe("/");
    expect(
      resolveBase({ repo: "my-repo", isUserSite: false, baseOverride: undefined, hasActions: false }),
    ).toBe("/");
    expect(resolveBase({ repo: "", isUserSite: false, baseOverride: undefined, hasActions: true })).toBe("/");
  });
});
