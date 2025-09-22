import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import * as storageModule from '@guidogerb/components-storage'
import { Catalog } from '../Catalog.jsx'

const { createStorageController } = storageModule

const buildProduct = (overrides = {}) => ({
  id: `prod-${Math.random().toString(16).slice(2)}`,
  sku: 'SKU-001',
  slug: 'sample-product',
  title: 'All Access Streaming',
  subtitle: 'Unlimited music and video',
  description: 'Enjoy every release as soon as it drops with curated playlists.',
  type: 'SUBSCRIPTION',
  format: 'Streaming',
  genres: ['Jazz'],
  tags: ['Featured', 'Membership'],
  badges: ['New'],
  price: {
    amount: 1999,
    currency: 'USD',
    interval: 'Month',
  },
  availability: {
    status: 'AVAILABLE',
    stock: null,
    releaseDate: '2024-01-01',
    fulfillment: 'DIGITAL',
  },
  media: [],
  metadata: { runtime: 'Unlimited' },
  ...overrides,
})

const buildGraphQLPayload = ({ items, pageInfo }) => ({
  data: {
    catalog: {
      items,
      pageInfo: {
        total: items.length,
        hasNextPage: pageInfo?.hasNextPage ?? false,
        endCursor: pageInfo?.endCursor ?? null,
      },
    },
  },
})

describe('Catalog', () => {
  it('renders catalog sections grouped by fulfillment and formats price strings', async () => {
    const digitalProduct = buildProduct({ id: 'digital-1' })
    const physicalProduct = buildProduct({
      id: 'physical-1',
      title: 'Limited Edition Vinyl',
      type: 'ALBUM',
      format: 'Vinyl',
      price: { amount: 3299, currency: 'USD' },
      availability: {
        status: 'PREORDER',
        stock: 250,
        releaseDate: '2024-02-15',
        fulfillment: 'PHYSICAL',
      },
      badges: ['Collector'],
    })

    const client = {
      post: vi
        .fn()
        .mockResolvedValue(buildGraphQLPayload({ items: [digitalProduct, physicalProduct] })),
    }

    const storage = createStorageController({ namespace: 'test.catalog' })

    render(<Catalog client={client} storage={storage} />)

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledTimes(1)
    })

    expect(client.post).toHaveBeenCalledWith(
      '/graphql',
      expect.objectContaining({
        json: expect.objectContaining({
          query: expect.stringContaining('query Catalog'),
          variables: expect.objectContaining({
            pagination: expect.objectContaining({ first: 24 }),
          }),
        }),
      }),
    )

    expect(screen.getByRole('heading', { name: 'Digital delivery' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Physical shipment' })).toBeInTheDocument()

    const digitalSection = screen
      .getByRole('heading', { name: 'Digital delivery' })
      .closest('section')
    expect(
      within(digitalSection).getByRole('heading', { name: digitalProduct.title }),
    ).toBeInTheDocument()
    expect(within(digitalSection).getByText('SUBSCRIPTION')).toBeInTheDocument()
    expect(within(digitalSection).getByText('Streaming')).toBeInTheDocument()
    expect(within(digitalSection).getByText('$19.99 / month', { exact: false })).toBeInTheDocument()

    const physicalSection = screen
      .getByRole('heading', { name: 'Physical shipment' })
      .closest('section')
    expect(
      within(physicalSection).getByRole('heading', { name: 'Limited Edition Vinyl' }),
    ).toBeInTheDocument()
    expect(within(physicalSection).getByText('Vinyl')).toBeInTheDocument()
    expect(within(physicalSection).getByText('$32.99', { exact: false })).toBeInTheDocument()
  })

  it('applies product type filters and persists layout preferences in storage', async () => {
    const user = userEvent.setup()

    const availability = buildProduct().availability
    const baseProducts = [
      buildProduct({ id: 'streaming-1', type: 'SUBSCRIPTION' }),
      buildProduct({
        id: 'vinyl-1',
        title: 'Signed Vinyl',
        type: 'ALBUM',
        availability: { ...availability, fulfillment: 'PHYSICAL' },
      }),
    ]

    const client = {
      post: vi.fn().mockImplementation((_path, { json }) => {
        const requestedTypes = json?.variables?.filters?.productTypes ?? []
        if (requestedTypes.includes('ALBUM')) {
          return Promise.resolve(
            buildGraphQLPayload({ items: baseProducts.filter((item) => item.type === 'ALBUM') }),
          )
        }
        return Promise.resolve(buildGraphQLPayload({ items: baseProducts }))
      }),
    }

    const storage = createStorageController({ namespace: 'test.catalog' })

    const { rerender } = render(
      <Catalog client={client} storage={storage} initialView="list" storageKey="prefs" />,
    )

    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(1))

    const typeFilter = await screen.findByLabelText(/ALBUM/i)
    await user.click(typeFilter)

    await waitFor(() => expect(client.post).toHaveBeenCalledTimes(2))
    expect(client.post.mock.calls[1][1].json.variables.filters.productTypes).toEqual(['ALBUM'])

    await user.click(screen.getByRole('button', { name: 'Grid' }))

    expect(storage.get('prefs')).toMatchObject({
      types: ['ALBUM'],
      viewMode: 'grid',
    })

    rerender(<Catalog client={client} storage={storage} storageKey="prefs" />)

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('data-active', 'true')
  })

  it('reports GraphQL errors in an alert region', async () => {
    const client = {
      post: vi.fn().mockResolvedValue({
        data: { catalog: null },
        errors: [{ message: 'Catalog unavailable' }],
      }),
    }

    render(<Catalog client={client} />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Failed to load catalog: Catalog unavailable')
  })

  it('invokes the onProductSelect handler from the default renderer', async () => {
    const product = buildProduct({ id: 'stream-1' })
    const client = {
      post: vi.fn().mockResolvedValue(buildGraphQLPayload({ items: [product] })),
    }
    const handleSelect = vi.fn()
    const user = userEvent.setup()

    render(<Catalog client={client} onProductSelect={handleSelect} />)

    const cta = await screen.findByRole('button', { name: 'View details' })
    await user.click(cta)

    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'stream-1' }))
  })

  it('scopes generated storage namespaces with tenant and environment context', async () => {
    const spy = vi.spyOn(storageModule, 'createStorageController')
    const client = {
      post: vi.fn().mockResolvedValue(buildGraphQLPayload({ items: [] })),
    }

    try {
      render(
        <Catalog client={client} tenantId="tenant-123" environment="production" />,
      )

      await waitFor(() => {
        expect(spy).toHaveBeenCalled()
      })

      const call = spy.mock.calls.at(-1)?.[0] ?? {}
      expect(call.namespace).toBe('guidogerb.catalog::tenant-123::production')
    } finally {
      spy.mockRestore()
    }
  })
})
