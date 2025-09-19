/**
 * Wraps an event handler and automatically prevents default behaviour and event bubbling before executing the callback.
 *
 * This helper is primarily used around button click handlers to ensure that the action does not trigger parent listeners or
 * submit forms.  The returned function preserves React's synthetic event signature so it can be passed directly to
 * JSX props.
 *
 * @template {Element} ElementT
 * @param {import('react').MouseEventHandler<ElementT>} func The handler to execute once the event has been neutralised.
 * @returns {import('react').MouseEventHandler<ElementT>} The wrapped handler that can be attached to event listeners.
 */
export function handleEvent(func) {
  return (e) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    if (e.stopPropagation) {
      e.stopPropagation()
    }

    // react support
    if (e?.nativeEvent?.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }

    func.call(e.target, e)
  }
}
