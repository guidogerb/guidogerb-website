/**
 * Determines whether a point lies within the inclusive bounds of a `DOMRect`.
 *
 * @param {DOMRect} rect Rectangle whose boundaries will be checked.
 * @param {{ x: number, y: number }} point Coordinates to test, usually `MouseEvent` positions.
 * @returns {boolean} True if the point is inside or on the edge of the rectangle.
 */
export function rectContainsPoint(rect, point) {
  return (
    rect.left <= point.x && rect.right >= point.x && rect.top <= point.y && rect.bottom >= point.y
  )
}
