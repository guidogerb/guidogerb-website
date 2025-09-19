/**
 * Returns a list of elements within the provided container that can receive focus via keyboard navigation.
 *
 * The selector is adapted from the jQuery UI tabbable selector list and trimmed to match the needs of the component library.
 * Disabled elements are explicitly filtered out because they are technically tabbable but should be skipped by focus traps.
 *
 * @param {HTMLElement} element Root element whose descendants should be evaluated for focusability.
 * @returns {HTMLElement[]} A flat array of focusable descendants in DOM order.
 */
export function getFocusableElements(element) {
  // @ts-expect-error Element vs HTMLElement... why?!?!?!
  return [
    ...element.querySelectorAll(
      'a[href], area[href], button, input, textarea, select, object, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((item) => !item.hasAttribute('disabled'))
}
