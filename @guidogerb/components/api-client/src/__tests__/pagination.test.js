import { describe, expect, it, vi } from 'vitest'
import { collectPaginatedResults } from '../../index.js'

describe('collectPaginatedResults', () => {
  it('collects pages until the API signals there are no additional results', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [{ id: 1 }], cursor: 'cursor-1', hasNextPage: true })
      .mockResolvedValueOnce({ items: [{ id: 2 }], cursor: null, hasNextPage: false })

    const result = await collectPaginatedResults({ fetchPage })

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage.mock.calls[0][0]).toEqual({})
    expect(fetchPage.mock.calls[1][0]).toEqual({ cursor: 'cursor-1' })
    expect(result.pages).toHaveLength(2)
    expect(result.items).toEqual([{ id: 1 }, { id: 2 }])
    expect(result.stopReason).toBe('exhausted')
    expect(result.hasMore).toBe(false)
    expect(result.cursor).toBeNull()
    expect(result.nextParams).toBeUndefined()
  })

  it('derives cursors from pageInfo metadata and preserves initial parameters', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: ['first'],
        pageInfo: { hasNextPage: true, endCursor: 'page-2' },
      })
      .mockResolvedValueOnce({
        items: ['second'],
        pageInfo: { hasNextPage: false, endCursor: null },
      })

    const initialParams = { tenantId: 'tenant-42', limit: 25 }

    const result = await collectPaginatedResults({ fetchPage, initialParams })

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage.mock.calls[0][0]).toEqual({ tenantId: 'tenant-42', limit: 25 })
    expect(fetchPage.mock.calls[1][0]).toEqual({ tenantId: 'tenant-42', limit: 25, cursor: 'page-2' })
    expect(initialParams).toEqual({ tenantId: 'tenant-42', limit: 25 })
    expect(result.items).toEqual(['first', 'second'])
    expect(result.cursor).toBeNull()
  })

  it('returns continuation metadata when the max page limit is reached', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a'], cursor: 'cursor-a', hasNextPage: true })
      .mockResolvedValueOnce({ items: ['b'], cursor: 'cursor-b', hasNextPage: true })
      .mockResolvedValueOnce({ items: ['c'], cursor: 'cursor-c', hasNextPage: true })

    const result = await collectPaginatedResults({ fetchPage, maxPages: 2 })

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(result.stopReason).toBe('max-pages')
    expect(result.hasMore).toBe(true)
    expect(result.cursor).toBe('cursor-b')
    expect(result.nextParams).toEqual({ cursor: 'cursor-b' })
    expect(result.items).toEqual(['a', 'b'])
  })

  it('stops when the aggregated item count reaches the configured limit', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['one', 'two'], cursor: 'cursor-a', hasNextPage: true })
      .mockResolvedValueOnce({ items: ['three', 'four', 'five'], cursor: 'cursor-b', hasNextPage: true })

    const result = await collectPaginatedResults({
      fetchPage,
      maxItems: 4,
      initialParams: { tenantId: 'tenant-42' },
    })

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage.mock.calls[0][0]).toEqual({ tenantId: 'tenant-42' })
    expect(fetchPage.mock.calls[1][0]).toEqual({ tenantId: 'tenant-42', cursor: 'cursor-a' })
    expect(result.items).toEqual(['one', 'two', 'three', 'four'])
    expect(result.stopReason).toBe('max-items')
    expect(result.cursor).toBe('cursor-b')
    expect(result.nextParams).toEqual({ tenantId: 'tenant-42', cursor: 'cursor-b' })
    expect(result.hasMore).toBe(true)
  })

  it('treats exhausted pages as final when the item limit is met without a next cursor', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: ['alpha', 'beta', 'gamma'], cursor: null, hasNextPage: false })

    const result = await collectPaginatedResults({ fetchPage, maxItems: 2 })

    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(result.items).toEqual(['alpha', 'beta'])
    expect(result.stopReason).toBe('max-items')
    expect(result.cursor).toBeNull()
    expect(result.nextParams).toBeUndefined()
    expect(result.hasMore).toBe(false)
  })

  it('prevents infinite loops when a cursor repeats unless explicitly disabled', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1], cursor: 'dup', hasNextPage: true })
      .mockResolvedValueOnce({ items: [2], cursor: 'dup', hasNextPage: true })

    const result = await collectPaginatedResults({ fetchPage })

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(result.stopReason).toBe('duplicate-cursor')
    expect(result.hasMore).toBe(false)
    expect(result.items).toEqual([1, 2])

    const continued = await collectPaginatedResults({
      fetchPage: vi
        .fn()
        .mockResolvedValueOnce({ items: ['x'], cursor: 'dup', hasNextPage: true })
        .mockResolvedValueOnce({ items: ['y'], cursor: 'dup', hasNextPage: true })
        .mockResolvedValueOnce({ items: ['z'], cursor: null, hasNextPage: false }),
      stopOnDuplicateCursor: false,
    })

    expect(continued.pages).toHaveLength(3)
    expect(continued.stopReason).toBe('exhausted')
    expect(continued.items).toEqual(['x', 'y', 'z'])
  })

  it('supports custom item extraction and accumulation toggles', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ data: { results: ['alpha'] }, nextCursor: 'next', hasMore: true })
      .mockResolvedValueOnce({ data: { results: ['beta'] }, nextCursor: null, hasMore: false })

    const aggregated = await collectPaginatedResults({
      fetchPage,
      extractItems: (page) => page?.data?.results ?? [],
    })

    expect(aggregated.items).toEqual(['alpha', 'beta'])

    const withoutAggregation = await collectPaginatedResults({
      fetchPage: vi.fn().mockResolvedValue({ items: ['only'], cursor: null, hasNextPage: false }),
      accumulateItems: false,
    })

    expect(withoutAggregation.items).toBeUndefined()
  })

  it('invokes the onPage callback with frozen parameter snapshots', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1], cursor: 'cursor-1', hasNextPage: true })
      .mockResolvedValueOnce({ items: [], cursor: null, hasNextPage: false })
    const onPage = vi.fn()

    await collectPaginatedResults({ fetchPage, onPage, initialParams: { limit: 10 } })

    expect(onPage).toHaveBeenCalledTimes(2)
    const [[, context]] = onPage.mock.calls
    expect(Object.isFrozen(context.params)).toBe(true)
    expect(context.params).toEqual({ limit: 10 })
  })
})
