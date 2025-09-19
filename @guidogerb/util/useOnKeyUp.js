import React, { useCallback } from 'react'

/**
 * React hook that returns a memoised key-up handler which fires only for the specified key.
 *
 * When `stopPropagation` is true the handler also prevents further propagation and default browser behaviour, making it
 * useful for custom keyboard shortcuts inside components such as dialogs.
 *
 * @template KeyboardEventElementT
 * @param {string} targetKey Key to watch for (for example `'Enter'`).  See MDN's KeyboardEvent key values reference.
 * @param {import('react').KeyboardEventHandler<KeyboardEventElementT>} func Function invoked when the key is pressed.
 * @param {boolean} [stopPropagation] Whether to stop propagation and prevent default behaviour when the key matches.
 * @returns {(event: React.KeyboardEvent<KeyboardEventElementT>) => boolean} Memoised handler returning whether the key matched.
 */
export function useOnKeyUp(targetKey, func, stopPropagation) {
  return useCallback(
    (e) => {
      const isMatchingKey = e.key === targetKey
      if (isMatchingKey) {
        if (stopPropagation) {
          e.stopPropagation()
          e.preventDefault()
        }
        func(e)
      }
      return isMatchingKey
    },
    [func, stopPropagation, targetKey],
  )
}
