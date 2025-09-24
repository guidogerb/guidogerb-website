const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]'

const cloneParams = (params) => {
  if (!isPlainObject(params)) return {}
  return { ...params }
}

const defaultExtractItems = (result) => {
  if (Array.isArray(result?.items)) {
    return result.items
  }
  if (Array.isArray(result?.data)) {
    return result.data
  }
  return null
}

const resolveCursorCandidate = (source) => {
  if (!source) return null

  const direct =
    source.cursor ??
    source.nextCursor ??
    source.nextPageToken ??
    source.pageToken ??
    source.paginationToken ??
    null

  if (direct != null && direct !== '') {
    return direct
  }

  const pageInfo = source.pageInfo ?? source.pagination ?? null
  if (!pageInfo) return null

  const infoCursor =
    pageInfo.endCursor ??
    pageInfo.nextCursor ??
    pageInfo.cursor ??
    pageInfo.nextPageToken ??
    pageInfo.token ??
    null

  return infoCursor != null && infoCursor !== '' ? infoCursor : null
}

const defaultGetCursor = (result) => resolveCursorCandidate(result)

const defaultHasNext = (result) => {
  if (!result) return false

  if (typeof result.hasNextPage !== 'undefined') {
    return Boolean(result.hasNextPage)
  }

  if (typeof result.hasMore !== 'undefined') {
    return Boolean(result.hasMore)
  }

  if (typeof result.nextPage !== 'undefined') {
    return Boolean(result.nextPage)
  }

  const pageInfo = result.pageInfo ?? result.pagination ?? null
  if (pageInfo) {
    if (typeof pageInfo.hasNextPage !== 'undefined') {
      return Boolean(pageInfo.hasNextPage)
    }
    if (typeof pageInfo.hasMore !== 'undefined') {
      return Boolean(pageInfo.hasMore)
    }
    if (typeof pageInfo.nextPageToken !== 'undefined') {
      return Boolean(pageInfo.nextPageToken)
    }
    if (typeof pageInfo.next !== 'undefined') {
      return Boolean(pageInfo.next)
    }
  }

  const cursor = resolveCursorCandidate(result)
  if (cursor != null && cursor !== '') {
    return true
  }

  if (Array.isArray(result.items)) {
    return result.items.length > 0 && cursor != null
  }

  return false
}

const encodeCursorKey = (cursor) => {
  if (cursor === null || cursor === undefined) return '__null__'
  if (typeof cursor === 'string') return cursor
  if (typeof cursor === 'number' || typeof cursor === 'boolean') return String(cursor)
  try {
    return JSON.stringify(cursor)
  } catch {
    return String(cursor)
  }
}

const coercePositiveInteger = (value, fallback) => {
  if (Number.isInteger(value) && value > 0) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  return fallback
}

/**
 * Collects responses from cursor-based paginated endpoints.
 *
 * @param {Object} options
 * @param {Function} options.fetchPage - Fetch function invoked for each page.
 * @param {Object} [options.initialParams] - Base parameters forwarded to every request.
 * @param {string} [options.cursorParam="cursor"] - Parameter name used for cursor pagination.
 * @param {Function} [options.getCursor] - Extracts the cursor from a response.
 * @param {Function} [options.hasNext] - Determines whether another page should be requested.
 * @param {Function} [options.extractItems] - Retrieves items from each page for aggregation.
 * @param {Function} [options.onPage] - Optional callback invoked after each page resolves.
 * @param {boolean} [options.accumulateItems=true] - Whether to collect items across pages.
 * @param {boolean} [options.stopOnDuplicateCursor=true] - Prevent infinite loops when a cursor repeats.
 * @param {number} [options.maxPages=50] - Safety cap for the number of requests issued.
 * @returns {Promise<{pages: Array, items?: Array, cursor: unknown, nextParams?: Object, pageCount: number, stopReason: string, hasMore: boolean}>}
 */
export const collectPaginatedResults = async ({
  fetchPage,
  initialParams,
  cursorParam = 'cursor',
  getCursor = defaultGetCursor,
  hasNext = defaultHasNext,
  extractItems = defaultExtractItems,
  onPage,
  accumulateItems = true,
  stopOnDuplicateCursor = true,
  maxPages = 50,
} = {}) => {
  if (typeof fetchPage !== 'function') {
    throw new TypeError('collectPaginatedResults requires a fetchPage function')
  }

  const limit = coercePositiveInteger(maxPages, 50)
  const baseParams = cloneParams(initialParams)
  const pages = []
  const aggregatedItems = accumulateItems ? [] : undefined
  const seenCursors = new Set()

  let cursorForNextPage = baseParams[cursorParam] ?? null
  let nextParams = { ...baseParams }
  let stopReason = 'exhausted'
  let pageNumber = 0

  while (pageNumber < limit) {
    pageNumber += 1
    const paramsForRequest = { ...nextParams }
    const result = await fetchPage(paramsForRequest, {
      page: pageNumber,
      cursor: cursorForNextPage,
    })

    pages.push(result)

    if (typeof onPage === 'function') {
      await onPage(result, {
        page: pageNumber,
        params: Object.freeze({ ...paramsForRequest }),
      })
    }

    if (aggregatedItems) {
      const items = extractItems(result, {
        page: pageNumber,
        cursor: cursorForNextPage,
      })
      if (Array.isArray(items) && items.length > 0) {
        aggregatedItems.push(...items)
      }
    }

    const nextCursor = getCursor(result, {
      page: pageNumber,
      previousCursor: cursorForNextPage,
      params: paramsForRequest,
    })

    const continuePaging = hasNext(result, {
      page: pageNumber,
      cursor: nextCursor,
      params: paramsForRequest,
    })

    if (!continuePaging) {
      cursorForNextPage = nextCursor ?? null
      stopReason = 'exhausted'
      break
    }

    if (nextCursor === null || nextCursor === undefined || nextCursor === '') {
      cursorForNextPage = null
      stopReason = 'exhausted'
      break
    }

    const cursorKey = encodeCursorKey(nextCursor)
    if (stopOnDuplicateCursor && seenCursors.has(cursorKey)) {
      cursorForNextPage = nextCursor
      stopReason = 'duplicate-cursor'
      break
    }

    seenCursors.add(cursorKey)
    cursorForNextPage = nextCursor
    nextParams = { ...baseParams, [cursorParam]: nextCursor }

    if (pageNumber >= limit) {
      stopReason = 'max-pages'
      break
    }
  }

  return {
    pages,
    items: aggregatedItems,
    cursor: cursorForNextPage ?? null,
    nextParams:
      cursorForNextPage !== null && cursorForNextPage !== undefined
        ? { ...baseParams, [cursorParam]: cursorForNextPage }
        : undefined,
    pageCount: pages.length,
    stopReason,
    hasMore: stopReason === 'max-pages',
  }
}

export default collectPaginatedResults
