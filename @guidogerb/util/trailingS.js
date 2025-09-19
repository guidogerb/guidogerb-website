/**
 * Returns an `'s'` suffix when the provided count is plural (two or more) and an empty string otherwise.
 *
 * ```js
 * `item${trailingS(count)}`
 * ```
 *
 * @param {number} value Quantity being displayed to the user.
 * @returns {string} `'s'` for plural values, otherwise an empty string.
 */
export function trailingS(value) {
  return value >= 2 ? 's' : ''
}
