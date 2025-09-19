import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { joinClassNames, resolveSlot } from '../utils.js'

describe('public page utilities', () => {
  it('invokes slot functions lazily and returns their value', () => {
    const factory = vi.fn(() => <div data-testid="slot" />)
    const result = resolveSlot(factory)
    expect(factory).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ props: { 'data-testid': 'slot' } })
  })

  it('returns null for empty slot values', () => {
    expect(resolveSlot(null)).toBeNull()
    expect(resolveSlot(undefined)).toBeNull()
  })

  it('joins class names while filtering falsy entries', () => {
    const combined = joinClassNames('base', false, 'active', null, undefined, 'custom')
    expect(combined).toBe('base active custom')
  })
})
