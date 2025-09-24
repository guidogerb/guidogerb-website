import { describe, expect, it } from 'vitest'
import { ApiError, normalizeApiError } from '../../index.js'

describe('normalizeApiError', () => {
  it('falls back to a generic message when no details are available', () => {
    const normalized = normalizeApiError(null)
    expect(normalized.message).toBe('Unknown API error')
    expect(normalized.details).toEqual([])
    expect(normalized.fieldErrors).toEqual({})
    expect(normalized.hasFieldErrors).toBe(false)
  })

  it('prefers structured payload messaging over the base error message', () => {
    const error = new ApiError('Request failed', {
      status: 422,
      statusText: 'Unprocessable Entity',
      data: {
        code: 'invalid_request',
        message: 'The payload is invalid.',
        errors: [
          { message: 'Email is required', field: 'email', code: 'required' },
          { detail: 'Name must be fewer than 80 characters', path: ['profile', 'name'] },
        ],
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.message).toBe('The payload is invalid.')
    expect(normalized.status).toBe(422)
    expect(normalized.statusText).toBe('Unprocessable Entity')
    expect(normalized.code).toBe('invalid_request')
    expect(normalized.details).toEqual([
      { message: 'Email is required', code: 'required', field: 'email', path: null },
      { message: 'Name must be fewer than 80 characters', code: null, field: 'profile.name', path: 'profile.name' },
    ])
    expect(normalized.fieldErrors).toEqual({
      email: ['Email is required'],
      'profile.name': ['Name must be fewer than 80 characters'],
    })
    expect(normalized.hasFieldErrors).toBe(true)
    expect(normalized.isApiError).toBe(true)
  })

  it('normalizes object-based field error maps and string payloads', () => {
    const error = new ApiError('Validation error', {
      status: 400,
      data: {
        errors: {
          password: ['Password too short', 'Password must include a symbol'],
          email: 'Email address is invalid',
        },
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.message).toBe('Validation error')
    expect(normalized.details).toHaveLength(3)
    expect(normalized.fieldErrors).toEqual({
      password: ['Password too short', 'Password must include a symbol'],
      email: ['Email address is invalid'],
    })
  })

  it('handles non-ApiError values by inspecting generic fields', () => {
    const normalized = normalizeApiError({
      message: 'Gateway timed out',
      status: 504,
      statusText: 'Gateway Timeout',
      data: 'Upstream request exceeded the time limit',
    })

    expect(normalized.message).toBe('Upstream request exceeded the time limit')
    expect(normalized.status).toBe(504)
    expect(normalized.statusText).toBe('Gateway Timeout')
    expect(normalized.isApiError).toBe(false)
  })
})
