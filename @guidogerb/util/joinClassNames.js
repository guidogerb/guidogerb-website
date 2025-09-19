import { castArray, identity, trim } from 'lodash'

/**
 * Accepts any combination of strings, arrays, booleans, nulls or undefined values and joins the truthy class names into a
 * single space-delimited string.
 *
 * The utility is deliberately forgiving – anything that is not a string simply passes through the filtering stage and is
 * ignored.  Arrays are flattened recursively so nested lists of classes are supported.
 *
 * @param {(string | boolean | any[] | null | undefined)[]} classNames Values representing CSS class names.
 * @returns {string} A string safe to pass to React's `className` prop.
 */
export function joinClassNames(...classNames) {
  return (
    // convert passed in parameters to an array
    castArray(Array.from(classNames))
      // in case classes were passed as an array, flatten the array so its just one level; ie [['1', '2'], '3'] becomes ['1', '2', '3']
      .flat(Infinity)

      // trim spaces off
      .map((className) => (typeof className === 'string' ? trim(className) : className))

      // remove blanks
      .filter(identity)

      // put a space between them all
      .join(' ')
  )
}
