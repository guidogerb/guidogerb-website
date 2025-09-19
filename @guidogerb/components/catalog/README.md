# @guidogerb/components/catalog

Feature-complete catalog primitives for storefront experiences that sell both digital subscriptions and physical goods.

## Overview

`Catalog` orchestrates GraphQL catalog queries, client-side filtering, and persistent shopper preferences. It wraps
`@guidogerb/components-api` to execute GraphQL operations and relies on `@guidogerb/components-storage` to cache
view settings, filter selections, and search terms. The component ships with opinionated UI scaffolding so tenants can drop
in a full-featured browsing surface and progressively customize the presentation layer.

### Key capabilities

- Fetches catalog data from a configurable GraphQL endpoint using the shared API client with automatic retries.
- Normalizes product payloads spanning subscriptions, streaming bundles, albums, ebooks, video libraries, swag, and other
  physical items.
- Groups products by fulfillment channel (digital, physical, hybrid) and exposes filters for product type, fulfillment mode,
  and curated tags.
- Provides search, sorting, and layout toggles with persisted preferences powered by the storage controller.
- Supports infinite pagination via GraphQL page info, and emits callbacks when fresh data is hydrated.
- Ships with a default product renderer while allowing consumers to supply bespoke card/list item markup.

## Installation

The package is published as a private workspace dependency:

```sh
pnpm add @guidogerb/components-catalog
```

## Usage

```tsx
import { useMemo } from 'react'
import { Catalog } from '@guidogerb/components-catalog'
import { createClient } from '@guidogerb/components-api'
import { createStorageController } from '@guidogerb/components-storage'

const client = createClient({ baseUrl: 'https://commerce.api.guidogerb.com' })
const storage = createStorageController({ namespace: 'tenant-123.catalog' })

export function StorefrontCatalog() {
  return (
    <Catalog
      client={client}
      storage={storage}
      graphQLEndpoint="/graphql/catalog"
      pageSize={32}
      onProductSelect={(product) => {
        // Navigate to PDP, add to cart, or open media preview
        console.log('Selected product', product)
      }}
    />
  )
}
```

### GraphQL contract

`Catalog` issues the query below by default. Consumers can provide an alternate query string via the `query` prop when the
backend schema diverges.

```graphql
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
      price {
        amount
        currency
        interval
      }
      availability {
        status
        fulfillment
        stock
        releaseDate
      }
      media {
        type
        url
      }
      metadata
    }
  }
}
```

The component expects a classic GraphQL response envelope (`{ data, errors }`) and will surface descriptive error messages
when the `errors` array is populated or `data.catalog` is missing.

## Props

| Prop               | Type                                               | Default               | Description |
| ------------------ | -------------------------------------------------- | --------------------- | ----------- |
| `apiBaseUrl`       | `string`                                           | —                     | Base URL forwarded to `createClient` when an explicit `client` is not provided. |
| `client`           | `{ post(path, options) => Promise<any> }`          | —                     | Preconfigured API client instance. Overrides `apiBaseUrl`. |
| `graphQLEndpoint`  | `string`                                           | `"/graphql"`         | Path invoked on the client when issuing catalog queries. |
| `query`            | `string`                                           | `DEFAULT_CATALOG_QUERY` | GraphQL document string used for catalog requests. |
| `storage`          | `StorageController`                                | memory-scoped store   | Storage controller powering persisted preferences. |
| `storageNamespace` | `string`                                           | `'guidogerb.catalog'` | Namespace passed to `createStorageController` when `storage` is omitted. |
| `storageKey`       | `string`                                           | `'catalog.preferences'` | Storage key used to persist layout + filter state. |
| `initialView`      | `'grid' &#124; 'list'`                              | `'grid'`              | Initial layout mode. Persisted overrides take precedence. |
| `initialFilters`   | `Partial<{ types: string[]; fulfillment: string[]; availability: string[]; tags: string[]; search: string }>` | `{}` | Seeds the filter state and search term. |
| `initialSort`      | `keyof Catalog.SORT_OPTIONS`                       | `'featured'`          | Default sort key applied before user interaction. |
| `pageSize`         | `number`                                           | `24`                  | Number of records requested per GraphQL page. |
| `onProductSelect`  | `(product) => void`                                | —                     | Handler invoked when a product CTA is activated. |
| `onData`           | `({ items, pageInfo, raw }) => void`               | —                     | Fired after each successful fetch with normalized products. |
| `renderProduct`    | `({ product, viewMode, onSelect }) => ReactNode`   | built-in renderer     | Custom renderer for catalog entries. |
| `searchPlaceholder`| `string`                                           | `'Search catalog'`    | Placeholder text for the search input. |
| `emptyState`       | `ReactNode`                                        | `'No products match your filters.'` | Message displayed when zero results remain after filtering. |

## Accessibility & customization

- Semantic landmarks (`role="search"`, `aria-live="polite"`, grouped filter legends) support assistive technology flows.
- Facet controls emit deterministic data attributes (`data-fulfillment`, `data-active`) to simplify tenant theming.
- Consumers can fully override the product renderer while still inheriting built-in event payloads and storage integration.

## Testing

The package ships with Vitest + Testing Library coverage. Run the suite with:

```sh
pnpm --filter @guidogerb/components-catalog test
```

## Related packages

- [`@guidogerb/components-api`](../api-client/README.md) for HTTP transport primitives.
- [`@guidogerb/components-storage`](../storage/README.md) for cross-environment storage controllers and persistence helpers.
