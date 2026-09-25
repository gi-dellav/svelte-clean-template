import { afterEach, describe, expect, it } from "bun:test";
import {
  errorState,
  fetchJson,
  idleState,
  loadingState,
  okState,
  toErrorMessage,
} from "../src/lib/async.js";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("async state constructors", () => {
  it("builds each status", () => {
    expect(idleState<string>()).toEqual({ status: "idle" });
    expect(loadingState<string>()).toEqual({ status: "loading" });
    expect(okState([1])).toEqual({ status: "ok", data: [1] });
    expect(errorState<string>("boom")).toEqual({ status: "error", error: "boom" });
  });
});

describe("toErrorMessage", () => {
  it("normalizes errors, strings, and garbage", () => {
    expect(toErrorMessage(new Error("nope"))).toBe("nope");
    expect(toErrorMessage("plain")).toBe("plain");
    expect(toErrorMessage(new Error(""))).toBe("Something went wrong.");
    expect(toErrorMessage("")).toBe("Something went wrong.");
    expect(toErrorMessage(undefined)).toBe("Something went wrong.");
    expect(toErrorMessage(42)).toBe("Something went wrong.");
  });
});

describe("fetchJson", () => {
  it("resolves parsed JSON on ok responses", async () => {
    globalThis.fetch = (async () =>
      new Response(`{"a":1}`, { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
    await expect(fetchJson<{ a: number }>("https://example.com/x")).resolves.toEqual({ a: 1 });
  });

  it("throws a status Error on HTTP failures", async () => {
    globalThis.fetch = (async () => new Response("nope", { status: 404, statusText: "Not Found" })) as typeof fetch;
    const error = await fetchJson("https://example.com/x").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(toErrorMessage(error)).toBe("Request failed: 404 Not Found");
  });
});
