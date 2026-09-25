/**
 * Minimal field validators. Each returns the error message or `undefined`
 * when valid — compose per-field, then combine with `validateAll` on submit.
 *
 * Markup contract (see `knowledge/frontend-patterns.md` §5 + `.field` /
 * `.label` / `.input` / `.form-error` in `src/app.css`):
 * - `<label class="label" for="…">` + `<input class="input" id="…">`
 * - `aria-invalid` + `aria-describedby` pointing at the `.form-error` id
 * - error `<p class="form-error" role="alert">` so screen readers announce it
 */

export function isBlank(value: string): boolean {
  return value.trim() === "";
}

/** Required-field check. `label` prefixes the message (`"Name is required."`). */
export function required(value: string, label = "This field"): string | undefined {
  return isBlank(value) ? `${label} is required.` : undefined;
}

/** Pragmatic (not RFC-complete) email check on the trimmed value. */
export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Required + format check for email fields. */
export function emailField(value: string, label = "Email"): string | undefined {
  if (isBlank(value)) return `${label} is required.`;
  return validEmail(value) ? undefined : "Enter a valid email address.";
}

export function minLength(value: string, min: number, label = "This field"): string | undefined {
  if (value.trim().length >= min) return undefined;
  return `${label} must be at least ${min} characters.`;
}

export type FieldValidators = Record<string, (value: string) => string | undefined>;

/**
 * Run every validator against `values[name] ?? ""`; returns `{ name: message }`
 * for failures only. Submit when `Object.keys(errors).length === 0`.
 */
export function validateAll(
  values: Record<string, string>,
  validators: FieldValidators,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [name, validate] of Object.entries(validators)) {
    const message = validate(values[name] ?? "");
    if (message !== undefined) errors[name] = message;
  }
  return errors;
}
