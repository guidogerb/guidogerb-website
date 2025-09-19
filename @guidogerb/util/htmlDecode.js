// https://stackoverflow.com/a/34064434/1478933
/**
 * Decodes HTML entities (such as `&amp;` or `&#x27;`) into their literal characters using the browser's HTML parser.
 *
 * @param {string} input Markup or text that may contain encoded entities.
 * @returns {string} Decoded string value (or an empty string when parsing fails).
 */
export function htmlDecode(input) {
  const doc = new DOMParser().parseFromString(input, 'text/html')
  return doc.documentElement.textContent ?? ''
}
