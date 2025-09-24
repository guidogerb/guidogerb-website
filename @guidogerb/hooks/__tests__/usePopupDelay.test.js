import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePopupDelay } from '../usePopupDelay.js'

describe('usePopupDelay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    const { startNoPopupTimer } = usePopupDelay()
    startNoPopupTimer({ cooldownMs: 0 })
    vi.runAllTimers()
    vi.useRealTimers()
  })

  it('delays the first popup and marks subsequent calls as immediate until cooldown completes', () => {
    const { startPopupTimer, startNoPopupTimer } = usePopupDelay()
    const callback = vi.fn()

    startPopupTimer(callback)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(349)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)

    const immediateCallback = vi.fn()
    startPopupTimer(immediateCallback)
    expect(immediateCallback).toHaveBeenCalledTimes(1)

    startNoPopupTimer()
    vi.advanceTimersByTime(350)

    const afterCooldown = vi.fn()
    startPopupTimer(afterCooldown)
    expect(afterCooldown).not.toHaveBeenCalled()

    vi.advanceTimersByTime(350)
    expect(afterCooldown).toHaveBeenCalledTimes(1)
  })

  it('supports overriding popup delays and cooldown durations', () => {
    const { startPopupTimer, startNoPopupTimer } = usePopupDelay()

    const shortDelayCallback = vi.fn()
    startPopupTimer(shortDelayCallback, { delayMs: 120 })
    vi.advanceTimersByTime(119)
    expect(shortDelayCallback).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(shortDelayCallback).toHaveBeenCalledTimes(1)

    startNoPopupTimer({ cooldownMs: 60 })
    vi.advanceTimersByTime(60)

    const nextCallback = vi.fn()
    startPopupTimer(nextCallback, { delayMs: 40 })
    expect(nextCallback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(40)
    expect(nextCallback).toHaveBeenCalledTimes(1)
  })

  it('falls back to synchronous execution when provided a non-positive delay', () => {
    const { startPopupTimer } = usePopupDelay()
    const callback = vi.fn()

    startPopupTimer(callback, { delayMs: 0 })
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
