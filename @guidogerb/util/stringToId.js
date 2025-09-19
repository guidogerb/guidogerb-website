/**
 * Converts human-readable text into a lowercase, hyphenated string that is safe to use as an HTML id attribute.
 *
 * The function strips non-alphanumeric characters (except for hyphens) and collapses whitespace into single hyphen
 * separators.
 *
 * @param {string} inputString The string to convert into an identifier.
 * @returns {string} Sanitised id that can be used in the DOM.
 */
export function stringToId(inputString) {
  let retVal
  retVal = inputString?.toLowerCase()
  retVal = retVal?.replaceAll(' ', '-')
  retVal = retVal?.replaceAll(/[^a-zA-Z0-9-]+/g, '')
  return retVal
}
