import { useCallback, useEffect, useRef } from 'react'

/**
 * Given a function, return another function that will prevent the given function
 * from being executed until the "delay" time has expired. It will fire the function
 * immediately and then have a cool down period until it fires again.
 * @param {(...args: any[]) => void} func the function that is called after the delay
 * @param {number} [delay] minimum time in milliseconds between invocations
 * @returns {(...args: any[]) => Promise<any[]>} invoke your func (eventually); returns a promise with invoked args when finally invoked
 */
export function useDebounceFunc(func, delay = 1000) {
  const lastInvocationRef = useRef(NaN)
  const lastVarArgsRef = useRef(/** @type {any[] | null} */ (null))
  const timeoutRef = useRef(NaN)

  // clear timeout on unmount
  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return useCallback(
    (param) => {
      const promise = new Promise((resolve) => {
        const now = new Date().getTime()

        if (!lastInvocationRef.current || now - lastInvocationRef.current >= delay) {
          clearTimeout(timeoutRef.current)
          lastInvocationRef.current = now
          lastVarArgsRef.current = null
          func(param)
          resolve(param)
          return
        }

        lastVarArgsRef.current = param
        lastInvocationRef.current = now
        clearTimeout(timeoutRef.current)
        timeoutRef.current = window.setTimeout(() => {
          func(lastVarArgsRef.current)
          lastVarArgsRef.current = null
          lastInvocationRef.current = NaN
          resolve(param)
        }, delay)
      })
      return promise
    },
    [delay, func],
  )
}
