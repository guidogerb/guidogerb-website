/**
 * @template KeyboardEventHandlerT
 * @typedef {import('react').KeyboardEventHandler<KeyboardEventHandlerT>} KeyboardEventHandler
 */

/**
 * Creates a keyboard event handler that delegates to `handler` only when the browser reports the matching `KeyboardEvent.code`.
 *
 * Useful when wiring up onKeyDown/onKeyUp listeners without having to repeat guard clauses in component code.
 *
 * @template KeyboardEventHandlerT
 * @param {string} code Keyboard event `code` to listen for (for example `'Enter'` or `'Escape'`).
 * @param {import('react').EventHandler<any>} handler Callback executed when the code matches.
 * @returns {import('react').KeyboardEventHandler<KeyboardEventHandlerT>} React-compatible handler enforcing the guard.
 */
export function handleKeyPress(code, handler) {
  return (e) => e.code === code && handler(e)
}
