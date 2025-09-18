import { useImmer } from 'use-immer'
import { useRef } from 'react'

/**
 * React hook that mirrors the behaviour of useState + ref, backed by Immer for
 * immutable updates.
 * @template StateT
 * @param {StateT | (() => StateT)} initialState
 * @returns {[StateT, import('use-immer').Updater<StateT>, import('react').MutableRefObject<StateT>]}
 */
export function useImmerRef(initialState) {
  const resolvedState = typeof initialState === 'function' ? initialState() : initialState
  const [state, setState] = useImmer(resolvedState)
  const ref = useRef(state)
  ref.current = state
  return [state, setState, ref]
}
