/**
 * Safely converts a value into a string while treating `null`, `undefined` and empty values as an empty string.
 *
 * Particularly useful when binding values to uncontrolled form elements where `null` is not an acceptable value but `0`
 * should be preserved.
 *
 * @param {string | number | null | undefined} value Value to convert.
 * @returns {string} String representation or an empty string for absent values.
 */
export function toSafeString(value) {
  return !value && value !== 0 ? '' : `${value}`
}
