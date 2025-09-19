/**
 * Runtime assertion that a value is neither `null` nor `undefined`.
 *
 * In addition to throwing a descriptive error when the value is missing, the function narrows the TypeScript type to
 * `NonNullable<T>` for subsequent code paths.
 *
 * @template T
 * @param {T} value Value that should be validated.
 * @param {string} errorMessage Message included in the thrown error when validation fails.
 * @returns {NonNullable<T>} The same value but with a narrowed type contract.
 */
export function notNull(value, errorMessage) {
  if (value === null || value === undefined) {
    throw new Error(errorMessage)
  }
  return value
}
