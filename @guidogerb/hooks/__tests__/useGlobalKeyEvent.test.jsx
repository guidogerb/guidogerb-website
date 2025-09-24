import React from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGlobalKeyEvent } from '../useGlobalKeyEvent.js'

function KeyListener({ onKeyDown, onKeyUp }) {
  const pressed = useGlobalKeyEvent({ whichKeyCode: 'Slash', onKeyDown, onKeyUp })
  return <span data-testid="status">{pressed ? 'pressed' : 'idle'}</span>
}

describe('useGlobalKeyEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tracks key state and forwards handlers for matching keys', () => {
    const onKeyDown = vi.fn()
    const onKeyUp = vi.fn()

    render(<KeyListener onKeyDown={onKeyDown} onKeyUp={onKeyUp} />)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Slash', code: 'Slash' }))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('pressed')
    expect(onKeyDown).toHaveBeenCalledTimes(1)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Slash', code: 'Slash' }))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('idle')
    expect(onKeyUp).toHaveBeenCalledTimes(1)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('idle')
    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it('cleans up registered listeners on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const view = render(<KeyListener />)

    const keydownListener = addSpy.mock.calls.find(([eventName]) => eventName === 'keydown')[1]
    const keyupListener = addSpy.mock.calls.find(([eventName]) => eventName === 'keyup')[1]

    view.unmount()

    expect(removeSpy).toHaveBeenCalledWith('keydown', keydownListener)
    expect(removeSpy).toHaveBeenCalledWith('keyup', keyupListener)
  })
})
