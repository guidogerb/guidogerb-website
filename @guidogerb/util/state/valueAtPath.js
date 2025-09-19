import { split } from 'lodash'

/**
 * Safely reads a nested property from an object using a dot-delimited path string.
 *
 * Missing intermediate objects simply short-circuit to `undefined` instead of throwing.  The return type is generic so it
 * can be asserted when used in TypeScript-aware codebases.
 *
 * @template ObjectT
 * @template ValueT
 * @param {object} param
 * @param {ObjectT | null} param.object Object to traverse.
 * @param {string} param.path Dot-delimited path string (e.g. `'a.b.c'`).
 * @returns {ValueT} Value located at the path or `undefined` if any segment is missing.
 */
export function valueAtPath({ object, path }) {
  // eslint-disable-next-line jsdoc/no-undefined-types
  return /** @type {ValueT} */ (
    /** @type {any} */ (
      split(path, '.').reduce(
        (obj, field) =>
          field && obj
            ? // @ts-expect-error just go ahead and give it a try...
              obj[field]
            : obj,
        object,
      )
    )
  )
}
