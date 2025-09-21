import { useCallback, useEffect, useId, useMemo, useReducer, useState } from 'react'
import { createClient } from '@guidogerb/components-api'
import { createStorageController } from '@guidogerb/components-storage'

export const DEFAULT_CATALOG_QUERY = `
  query Catalog(
    $filters: CatalogFilterInput
    $search: String
    $pagination: CatalogPaginationInput
    $sort: CatalogSortInput
  ) {
    catalog(filters: $filters, search: $search, pagination: $pagination, sort: $sort) {
      pageInfo {
        total
        hasNextPage
        endCursor
      }
      items {
        id
        sku
        slug
        title
        subtitle
        description
        type
        format
        genres
        tags
        badges
        rating
        duration
        productUrl
        previewUrl
        price {
          amount
          currency
          interval
          trialDays
        }
        availability {
          status
          stock
          releaseDate
          fulfillment
          shipsIn
        }
        media {
          type
          url
          preview
        }
        metadata
      }
    }
  }
`

const DEFAULT_SORT_KEY = 'featured'

const SORT_OPTIONS = {
  featured: {
    label: 'Featured',
    sort: { field: 'FEATURED', direction: 'DESC' },
  },
  newest: {
    label: 'Newest arrivals',
    sort: { field: 'RELEASE_DATE', direction: 'DESC' },
  },
  priceAsc: {
    label: 'Price: Low to high',
    sort: { field: 'PRICE', direction: 'ASC' },
  },
  priceDesc: {
    label: 'Price: High to low',
    sort: { field: 'PRICE', direction: 'DESC' },
  },
  titleAsc: {
    label: 'Title: A to Z',
    sort: { field: 'TITLE', direction: 'ASC' },
  },
}

const FULFILLMENT_FILTERS = [
  { value: 'DIGITAL', label: 'Digital delivery' },
  { value: 'PHYSICAL', label: 'Physical shipment' },
  { value: 'HYBRID', label: 'Hybrid bundle' },
]

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const buildScopeSuffix = (scope) => {
  if (!scope || typeof scope !== 'object') return ''

  const segments = []

  if (isNonEmptyString(scope.tenantId)) {
    segments.push(`tenant:${scope.tenantId}`)
  }

  if (isNonEmptyString(scope.environment)) {
    segments.push(`env:${scope.environment}`)
  }

  return segments.join('::')
}

const buildScopedIdentifier = (base, scope) => {
  const normalizedBase = isNonEmptyString(base) ? base : 'catalog'
  const suffix = buildScopeSuffix(scope)
  return suffix ? `${normalizedBase}::${suffix}` : normalizedBase
}

const initialState = {
  status: 'idle',
  items: [],
  pageInfo: { total: 0, hasNextPage: false, endCursor: null },
  facets: { productTypes: [], fulfillment: [], tags: [] },
  error: null,
  isAppending: false,
}

const catalogReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START': {
      return {
        ...state,
        status: action.append || state.items.length ? 'refreshing' : 'loading',
        isAppending: Boolean(action.append),
        error: null,
      }
    }
    case 'FETCH_SUCCESS': {
      const nextItems = action.append ? [...state.items, ...action.items] : action.items
      const nextFacets = computeFacets(nextItems)
      return {
        status: 'success',
        items: nextItems,
        pageInfo: action.pageInfo ?? initialState.pageInfo,
        facets: nextFacets,
        error: null,
        isAppending: false,
      }
    }
    case 'FETCH_FAILURE': {
      return {
        ...state,
        status: 'error',
        error: action.error,
        isAppending: false,
      }
    }
    case 'RESET': {
      return { ...initialState }
    }
    default:
      return state
  }
}

const toArray = (value) => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const normalizeProduct = (product) => ({
  ...product,
  genres: toArray(product?.genres),
  tags: toArray(product?.tags),
  badges: toArray(product?.badges),
  media: toArray(product?.media),
  availability: {
    status: product?.availability?.status ?? 'UNSPECIFIED',
    stock: product?.availability?.stock ?? null,
    releaseDate: product?.availability?.releaseDate ?? null,
    fulfillment: product?.availability?.fulfillment ?? 'UNKNOWN',
    shipsIn: product?.availability?.shipsIn ?? null,
  },
  price: product?.price
    ? {
        amount: Number(product.price.amount ?? 0),
        currency: product.price.currency ?? 'USD',
        interval: product.price.interval ?? null,
        trialDays: product.price.trialDays ?? null,
      }
    : null,
})

const computeFacets = (items) => {
  const productTypes = new Map()
  const fulfillment = new Map()
  const tags = new Map()

  items.forEach((item) => {
    if (item.type) {
      const entry = productTypes.get(item.type) ?? { value: item.type, label: item.type, count: 0 }
      entry.count += 1
      productTypes.set(item.type, entry)
    }

    const fulfillmentChannel = item.availability?.fulfillment
    if (fulfillmentChannel) {
      const entry = fulfillment.get(fulfillmentChannel) ?? {
        value: fulfillmentChannel,
        label: getFulfillmentLabel(fulfillmentChannel),
        count: 0,
      }
      entry.count += 1
      fulfillment.set(fulfillmentChannel, entry)
    }

    item.tags?.forEach((tag) => {
      const entry = tags.get(tag) ?? { value: tag, label: tag, count: 0 }
      entry.count += 1
      tags.set(tag, entry)
    })
  })

  const sortByLabel = (a, b) => a.label.localeCompare(b.label)

  return {
    productTypes: Array.from(productTypes.values()).sort(sortByLabel),
    fulfillment: Array.from(fulfillment.values()).sort(sortByLabel),
    tags: Array.from(tags.values()).sort(sortByLabel),
  }
}

const getFulfillmentLabel = (value) => {
  const preset = FULFILLMENT_FILTERS.find((option) => option.value === value)
  if (preset) return preset.label
  const lower = value.toLowerCase().replace(/[_-]/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

const buildVariables = ({ filters, search, sortKey, pageSize, cursor }) => {
  const sort = SORT_OPTIONS[sortKey]?.sort ?? SORT_OPTIONS[DEFAULT_SORT_KEY].sort

  const filterPayload = {
    productTypes: filters.types?.length ? filters.types : undefined,
    fulfillment: filters.fulfillment?.length ? filters.fulfillment : undefined,
    availabilityStatuses: filters.availability?.length ? filters.availability : undefined,
    tags: filters.tags?.length ? filters.tags : undefined,
  }

  return {
    search: search || undefined,
    filters: Object.values(filterPayload).some((value) => value !== undefined)
      ? filterPayload
      : undefined,
    pagination: {
      first: pageSize,
      after: cursor ?? undefined,
    },
    sort,
  }
}

const formatPrice = (price) => {
  if (!price) return 'Included'
  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency ?? 'USD',
    minimumFractionDigits: 2,
  })
  const amount = formatter.format((price.amount ?? 0) / 100)
  if (price.interval) {
    return `${amount} / ${price.interval.toLowerCase()}`
  }
  return amount
}

const readPreferences = (storage, key) => {
  if (!storage) return null
  try {
    return storage.get(key, null)
  } catch (error) {
    return null
  }
}

const persistPreferences = (storage, key, value) => {
  if (!storage) return
  try {
    storage.set(key, value)
  } catch (error) {
    // Swallow errors for non-critical persistence
  }
}

const groupByFulfillment = (items) => {
  const groups = new Map()
  items.forEach((item) => {
    const key = item.availability?.fulfillment ?? 'UNKNOWN'
    const group = groups.get(key) ?? []
    group.push(item)
    groups.set(key, group)
  })

  const order = ['DIGITAL', 'PHYSICAL', 'HYBRID']
  const toLabel = (id) => getFulfillmentLabel(id)

  return Array.from(groups.entries())
    .sort((a, b) => {
      const aIndex = order.indexOf(a[0])
      const bIndex = order.indexOf(b[0])
      if (aIndex === -1 && bIndex === -1) return toLabel(a[0]).localeCompare(toLabel(b[0]))
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
    .map(([id, products]) => ({ id, label: toLabel(id), products }))
}

const defaultRenderProduct = ({ product, onSelect, viewMode }) => {
  const price = formatPrice(product.price)
  const availability = product.availability?.status
  const fulfillment = getFulfillmentLabel(product.availability?.fulfillment ?? 'UNKNOWN')
  const badgeList = product.badges?.join(', ')

  return (
    <article
      className={`gg-catalog__product gg-catalog__product--${viewMode}`}
      data-fulfillment={product.availability?.fulfillment ?? 'UNKNOWN'}
    >
      <header className="gg-catalog__product-header">
        <h3 className="gg-catalog__product-title">{product.title}</h3>
        {product.subtitle ? (
          <p className="gg-catalog__product-subtitle">{product.subtitle}</p>
        ) : null}
        {badgeList ? <p className="gg-catalog__product-badges">{badgeList}</p> : null}
      </header>
      <p className="gg-catalog__product-description">{product.description}</p>
      <dl className="gg-catalog__product-meta">
        <div>
          <dt>Type</dt>
          <dd>{product.type}</dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{product.format ?? 'N/A'}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>{price}</dd>
        </div>
        <div>
          <dt>Fulfillment</dt>
          <dd>{fulfillment}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{availability}</dd>
        </div>
      </dl>
      <footer className="gg-catalog__product-footer">
        <button
          type="button"
          className="gg-catalog__product-action"
          onClick={() => onSelect?.(product)}
        >
          View details
        </button>
      </footer>
    </article>
  )
}

defaultRenderProduct.displayName = 'CatalogProduct'

export function Catalog({
  apiBaseUrl,
  client,
  graphQLEndpoint = '/graphql',
  query = DEFAULT_CATALOG_QUERY,
  storage,
  storageNamespace = 'guidogerb.catalog',
  storageKey = 'catalog.preferences',
  storageScope,
  initialView = 'grid',
  initialFilters = {},
  initialSort = DEFAULT_SORT_KEY,
  pageSize = 24,
  onProductSelect,
  onData,
  renderProduct = defaultRenderProduct,
  searchPlaceholder = 'Search catalog',
  emptyState = 'No products match your filters.',
}) {
  const resolvedClient = useMemo(() => {
    if (client) return client
    if (!apiBaseUrl) return null
    return createClient({ baseUrl: apiBaseUrl })
  }, [apiBaseUrl, client])

  const scopedNamespace = useMemo(
    () => buildScopedIdentifier(storageNamespace, storageScope),
    [storageNamespace, storageScope],
  )

  const scopedStorageKey = useMemo(
    () => buildScopedIdentifier(storageKey, storageScope),
    [storageKey, storageScope],
  )

  const resolvedStorage = useMemo(() => {
    if (storage) return storage
    return createStorageController({ namespace: scopedNamespace })
  }, [scopedNamespace, storage])

  const storedPreferences = useMemo(
    () => readPreferences(resolvedStorage, scopedStorageKey) ?? {},
    [resolvedStorage, scopedStorageKey],
  )

  const [viewMode, setViewMode] = useState(() => storedPreferences.viewMode ?? initialView)
  const [sortKey, setSortKey] = useState(() => storedPreferences.sortKey ?? initialSort)
  const [search, setSearch] = useState(
    () => storedPreferences.search ?? initialFilters.search ?? '',
  )
  const [filters, setFilters] = useState(() => ({
    types: storedPreferences.types ?? initialFilters.types ?? [],
    fulfillment: storedPreferences.fulfillment ?? initialFilters.fulfillment ?? [],
    availability: storedPreferences.availability ?? initialFilters.availability ?? [],
    tags: storedPreferences.tags ?? initialFilters.tags ?? [],
  }))

  const [state, dispatch] = useReducer(catalogReducer, initialState)

  useEffect(() => {
    persistPreferences(resolvedStorage, scopedStorageKey, {
      viewMode,
      sortKey,
      search,
      ...filters,
    })
  }, [filters, resolvedStorage, scopedStorageKey, search, sortKey, viewMode])

  useEffect(() => {
    if (!resolvedStorage) return undefined
    const unsubscribe = resolvedStorage.subscribe?.((event) => {
      if (!event || event.key !== scopedStorageKey) return
      if (event.type === 'set') {
        const next = event.value ?? {}
        if (next.viewMode && next.viewMode !== viewMode) setViewMode(next.viewMode)
        if (next.sortKey && next.sortKey !== sortKey) setSortKey(next.sortKey)
        if (next.search !== undefined && next.search !== search) setSearch(next.search)
        setFilters((prev) => ({
          types: next.types ?? prev.types,
          fulfillment: next.fulfillment ?? prev.fulfillment,
          availability: next.availability ?? prev.availability,
          tags: next.tags ?? prev.tags,
        }))
      }
      if (event.type === 'remove' || event.type === 'clear') {
        setViewMode(initialView)
        setSortKey(initialSort)
        setSearch(initialFilters.search ?? '')
        setFilters({
          types: initialFilters.types ?? [],
          fulfillment: initialFilters.fulfillment ?? [],
          availability: initialFilters.availability ?? [],
          tags: initialFilters.tags ?? [],
        })
      }
    })
    return unsubscribe
  }, [
    initialFilters,
    initialSort,
    initialView,
    resolvedStorage,
    scopedStorageKey,
    search,
    sortKey,
    viewMode,
  ])

  const requestCatalog = useCallback(
    async ({ cursor, append } = {}) => {
      if (!resolvedClient) {
        dispatch({ type: 'FETCH_FAILURE', error: new Error('Catalog requires an API client') })
        return
      }

      dispatch({ type: 'FETCH_START', append })

      try {
        const variables = buildVariables({ filters, search, sortKey, pageSize, cursor })
        const payload = await resolvedClient.post(graphQLEndpoint, {
          json: { query, variables },
        })

        if (payload?.errors?.length) {
          const message = payload.errors.map((error) => error.message).join('; ')
          throw new Error(message)
        }

        const catalog = payload?.data?.catalog
        if (!catalog) {
          throw new Error('Catalog query returned no data')
        }

        const products = (catalog.items ?? []).map(normalizeProduct)
        const pageInfo = {
          total: catalog.pageInfo?.total ?? products.length,
          hasNextPage: Boolean(catalog.pageInfo?.hasNextPage),
          endCursor: catalog.pageInfo?.endCursor ?? null,
        }

        dispatch({ type: 'FETCH_SUCCESS', items: products, pageInfo, append })
        onData?.({ items: products, pageInfo, raw: catalog })
      } catch (error) {
        dispatch({ type: 'FETCH_FAILURE', error })
      }
    },
    [filters, graphQLEndpoint, onData, pageSize, query, resolvedClient, search, sortKey],
  )

  useEffect(() => {
    requestCatalog({ append: false })
  }, [requestCatalog])

  const loading = state.status === 'loading'
  const refreshing = state.status === 'refreshing' || state.isAppending
  const errorMessage = state.error?.message ?? null
  const groups = useMemo(() => groupByFulfillment(state.items), [state.items])

  const handleToggleType = (value) => {
    setFilters((prev) => {
      const exists = prev.types.includes(value)
      const nextTypes = exists
        ? prev.types.filter((item) => item !== value)
        : [...prev.types, value]
      return { ...prev, types: nextTypes }
    })
  }

  const handleToggleFulfillment = (value) => {
    setFilters((prev) => {
      const exists = prev.fulfillment.includes(value)
      const nextFulfillment = exists
        ? prev.fulfillment.filter((item) => item !== value)
        : [...prev.fulfillment, value]
      return { ...prev, fulfillment: nextFulfillment }
    })
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    requestCatalog({ append: false })
  }

  const handleLoadMore = () => {
    if (!state.pageInfo?.hasNextPage) return
    requestCatalog({ cursor: state.pageInfo.endCursor, append: true })
  }

  const searchId = useId()
  const sortId = useId()

  return (
    <section className={`gg-catalog gg-catalog--${viewMode}`} aria-live="polite">
      <header className="gg-catalog__toolbar">
        <form className="gg-catalog__search" role="search" onSubmit={handleSearchSubmit}>
          <label htmlFor={searchId}>Search</label>
          <input
            id={searchId}
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit">Apply</button>
        </form>

        <div className="gg-catalog__sort">
          <label htmlFor={sortId}>Sort by</label>
          <select id={sortId} value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            {Object.entries(SORT_OPTIONS).map(([key, option]) => (
              <option key={key} value={key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="gg-catalog__view-toggle" role="group" aria-label="Toggle layout">
          <button
            type="button"
            data-active={viewMode === 'grid' || undefined}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            data-active={viewMode === 'list' || undefined}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </header>

      <div className="gg-catalog__body">
        <aside className="gg-catalog__filters" aria-label="Catalog filters">
          <fieldset>
            <legend>Product types</legend>
            {state.facets.productTypes.length === 0 ? <p>No product types yet.</p> : null}
            {state.facets.productTypes.map((facet) => (
              <label key={facet.value}>
                <input
                  type="checkbox"
                  name="product-types"
                  value={facet.value}
                  checked={filters.types.includes(facet.value)}
                  onChange={() => handleToggleType(facet.value)}
                />
                {facet.label}
                <span className="gg-catalog__facet-count">({facet.count})</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Fulfillment</legend>
            {FULFILLMENT_FILTERS.map((option) => (
              <label key={option.value}>
                <input
                  type="checkbox"
                  name="fulfillment"
                  value={option.value}
                  checked={filters.fulfillment.includes(option.value)}
                  onChange={() => handleToggleFulfillment(option.value)}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </aside>

        <div className="gg-catalog__results">
          {loading ? <p>Loading catalog…</p> : null}
          {errorMessage ? (
            <div role="alert" className="gg-catalog__error">
              Failed to load catalog: {errorMessage}
            </div>
          ) : null}

          {groups.map((group) => (
            <section key={group.id} className="gg-catalog__group">
              <header className="gg-catalog__group-header">
                <h2>{group.label}</h2>
                <p>{group.products.length} products</p>
              </header>
              <ul
                className={`gg-catalog__list gg-catalog__list--${viewMode}`}
                data-fulfillment={group.id}
              >
                {group.products.map((product) => (
                  <li key={product.id} className="gg-catalog__item">
                    {renderProduct({ product, onSelect: onProductSelect, viewMode })}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {!loading && !refreshing && groups.length === 0 ? (
            <div className="gg-catalog__empty">{emptyState}</div>
          ) : null}

          {state.pageInfo?.hasNextPage ? (
            <button
              type="button"
              className="gg-catalog__load-more"
              onClick={handleLoadMore}
              disabled={refreshing}
            >
              {refreshing ? 'Loading more…' : 'Load more'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

Catalog.displayName = 'Catalog'
Catalog.SORT_OPTIONS = SORT_OPTIONS
Catalog.FULFILLMENT_FILTERS = FULFILLMENT_FILTERS

export default Catalog
