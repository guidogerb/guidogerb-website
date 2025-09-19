import { notNull } from './notNull'

/**
 * Asserts that every item in an array is defined and returns a narrowed array type.
 *
 * Because the function throws on the first `null` or `undefined` value, it should only be used when missing entries are
 * truly exceptional and should halt execution.
 *
 * @template T
 * @param {T[] | null | undefined} array Array to validate (or `null`/`undefined` if optional).
 * @param {string} errorMessage Message included in the thrown error when any element is missing.
 * @returns {NonNullable<T>[]} Array where TypeScript understands that `null` and `undefined` have been removed.
 */
export function notNullArray(array, errorMessage) {
  if (array === null || array === undefined) {
    throw new Error(errorMessage)
  }
  return array.map((value) => notNull(value, errorMessage))
}
