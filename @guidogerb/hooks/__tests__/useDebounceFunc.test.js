import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounceFunc } from '../useDebounceFunc.js'

describe('useDebounceFunc', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('invokes the callback immediately when the cooldown has passed and resolves the returned promise', async () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceFunc(callback, 200))

    const firstPromise = result.current('first')
    await expect(firstPromise).resolves.toBe('first')

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')

    vi.advanceTimersByTime(250)

    const secondPromise = result.current('second')
    await expect(secondPromise).resolves.toBe('second')

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('queues calls made during the cooldown and resolves with the latest value', async () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceFunc(callback, 200))

    const firstPromise = result.current('initial')
    await expect(firstPromise).resolves.toBe('initial')

    expect(callback).toHaveBeenCalledTimes(1)

    const secondPromise = result.current('queued')

    expect(callback).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(200)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('queued')
    await expect(secondPromise).resolves.toBe('queued')
  })
})
