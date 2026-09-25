import { describe, expect, it } from "bun:test";
import {
  browserStorage,
  clearStored,
  memoryStorage,
  readStored,
  writeStored,
  type StorageLike,
} from "../src/lib/storage.js";

describe("memoryStorage", () => {
  it("round-trips values and removes them", () => {
    const storage = memoryStorage();
    expect(storage.getItem("k")).toBeNull();
    storage.setItem("k", "v");
    expect(storage.getItem("k")).toBe("v");
    storage.removeItem("k");
    expect(storage.getItem("k")).toBeNull();
  });

  it("seeds from initial values", () => {
    const storage = memoryStorage({ a: "1" });
    expect(storage.getItem("a")).toBe("1");
  });
});

describe("readStored", () => {
  it("parses stored JSON", () => {
    expect(readStored(memoryStorage({ n: "42" }), "n", 0)).toBe(42);
  });

  it("falls back when missing, corrupt, or storage is unavailable", () => {
    const storage = memoryStorage({ bad: "{oops" });
    expect(readStored(storage, "missing", "d")).toBe("d");
    expect(readStored(storage, "bad", "d")).toBe("d");
    expect(readStored(undefined, "n", "d")).toBe("d");
  });

  it("falls back when getItem throws (e.g. Safari private mode)", () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(readStored(throwing, "k", "d")).toBe("d");
  });
});

describe("writeStored / clearStored", () => {
  it("persists JSON and clears keys", () => {
    const storage = memoryStorage();
    writeStored(storage, "t", { a: 1 });
    expect(storage.getItem("t")).toBe(`{"a":1}`);
    clearStored(storage, "t");
    expect(storage.getItem("t")).toBeNull();
  });

  it("swallows quota/private-mode failures and undefined storage", () => {
    const throwing: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => {
      writeStored(throwing, "k", 1);
      clearStored(throwing, "k");
      writeStored(undefined, "k", 1);
      clearStored(undefined, "k");
    }).not.toThrow();
  });
});

describe("browserStorage", () => {
  it("returns undefined outside the browser instead of throwing", () => {
    // Bun has no `localStorage` global, mirroring SSR/test environments.
    expect(browserStorage()).toBeUndefined();
  });
});
