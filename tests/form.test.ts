import { describe, expect, it } from "bun:test";
import { emailField, isBlank, minLength, required, validateAll, validEmail } from "../src/lib/form.js";

describe("isBlank / required", () => {
  it("treats whitespace as blank with a labelled message", () => {
    expect(isBlank("   ")).toBe(true);
    expect(isBlank("x")).toBe(false);
    expect(required("", "Name")).toBe("Name is required.");
    expect(required("  ")).toBe("This field is required.");
    expect(required("ok")).toBeUndefined();
  });
});

describe("validEmail / emailField", () => {
  it("accepts trimmed addresses, rejects the rest", () => {
    expect(validEmail("a@b.co")).toBe(true);
    expect(validEmail("  a@b.co  ")).toBe(true);
    expect(validEmail("a@b")).toBe(false);
    expect(validEmail("a b@c.co")).toBe(false);
    expect(validEmail("")).toBe(false);
  });

  it("requires then validates", () => {
    expect(emailField("")).toBe("Email is required.");
    expect(emailField("bad")).toBe("Enter a valid email address.");
    expect(emailField("a@b.co")).toBeUndefined();
  });
});

describe("minLength", () => {
  it("checks the trimmed length", () => {
    expect(minLength("abc", 3)).toBeUndefined();
    expect(minLength("  ab  ", 3)).toBe("This field must be at least 3 characters.");
    expect(minLength("", 1, "Bio")).toBe("Bio must be at least 1 characters.");
  });
});

describe("validateAll", () => {
  it("collects per-field errors, omits valid fields", () => {
    const errors = validateAll(
      { name: "", email: "bad" },
      { name: (v) => required(v, "Name"), email: emailField },
    );
    expect(errors).toEqual({ name: "Name is required.", email: "Enter a valid email address." });
  });

  it("treats missing values as empty and returns {} when valid", () => {
    expect(validateAll({}, { name: (v) => required(v, "Name") })).toEqual({
      name: "Name is required.",
    });
    expect(
      validateAll({ name: "Ada" }, { name: (v) => required(v, "Name") }),
    ).toEqual({});
  });
});
