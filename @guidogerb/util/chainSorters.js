/**
 * Creates a comparison function that tries several comparator callbacks in sequence until one returns a non-zero result.
 *
 * This is helpful when sorting complex objects by more than one criterion.  For example:
 *
 * ```js
 * const peopleSorter = chainSorters([
 *   (a, b) => a.lastName.localeCompare(b.lastName),
 *   (a, b) => a.firstName.localeCompare(b.firstName),
 *   (a, b) => a.age - b.age,
 * ])
 *
 * people.sort(peopleSorter)
 * ```
 *
 * @param {((a: any, b: any, ...rest: any[]) => number)[]} sorters Comparator callbacks ordered by priority.
 * @param {any[]} sorterParams Additional parameters spread into every sorter invocation (useful for dependency injection).
 * @returns {(a: any, b: any) => number} Comparison function suitable for `Array.prototype.sort`.
 */
export function chainSorters(sorters, ...sorterParams) {
  return (
    // One Sorter to rule them all, One Sorter to find them,
    // One Sorter to bring them all, and in the darkness bind them,
    (a, b) =>
      (sorters || []).reduce(
        // loop through the sorters until a comparison gets a non-zero result
        (result, sorter) => (result === 0 ? sorter(a, b, ...sorterParams) : result),
        // default to zero/equals result
        0,
      )
  )
}
