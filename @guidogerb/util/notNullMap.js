/**
 * Convenience wrapper for {@link notNull} that throws a generic message and is therefore easy to pass to `map`.
 *
 * Usage pattern: `values.filter(Boolean).map(notNullMap)`.
 *
 * @template T
 * @param {T} value Value that must be defined.
 * @returns {NonNullable<T>} The same value with a narrowed type signature.
 */
export function notNullMap(value) {
  if (value === null || value === undefined) {
    throw new Error('notNullMap: value is null or undefined')
  }
  return value
}
