import { useMemo } from 'react'
import { Catalog } from '../Catalog.jsx'
import { createStorageController } from '@guidogerb/components-storage'

const meta = {
  title: 'Components/Catalog/Catalog',
  component: Catalog,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    initialView: {
      control: 'inline-radio',
      options: ['grid', 'list'],
    },
    pageSize: {
      control: { type: 'number', min: 1, max: 10 },
    },
  },
  args: {
    initialView: 'grid',
    pageSize: 3,
    searchPlaceholder: 'Search catalog',
  },
}

export default meta

export const MOCK_PRODUCTS = [
  {
    id: 'digital-mastering',
    sku: 'DIGI-001',
    slug: 'mix-mastering',
    title: 'Mix & Master Subscription',
    subtitle: 'Unlimited digital mastering',
    description: 'Monthly plan that delivers polished mixes with 48 hour turnaround.',
    type: 'SUBSCRIPTION',
    format: 'Streaming',
    genres: ['Audio'],
    tags: ['Featured', 'Studio'],
    badges: ['Popular'],
    price: { amount: 9900, currency: 'USD', interval: 'Month' },
    availability: { status: 'AVAILABLE', fulfillment: 'DIGITAL' },
    media: [],
    metadata: { runtime: 'Unlimited' },
  },
  {
    id: 'vinyl-boxset',
    sku: 'VINYL-900',
    slug: 'limited-box-set',
    title: 'Guidogerb Classics Vinyl Box',
    subtitle: 'Hand numbered pressing',
    description: 'Seven LP anthology pressed on 180 gram vinyl with archival booklet.',
    type: 'ALBUM',
    format: 'Vinyl',
    genres: ['Jazz'],
    tags: ['Collector'],
    badges: ['Limited'],
    price: { amount: 24900, currency: 'USD' },
    availability: { status: 'PREORDER', fulfillment: 'PHYSICAL' },
    media: [],
    metadata: { discs: 7 },
  },
  {
    id: 'lesson-pack',
    sku: 'LESSON-030',
    slug: 'private-lessons',
    title: 'Private Lesson 3-Pack',
    subtitle: 'Remote theory deep dive',
    description: 'Three sixty minute sessions covering improvisation and arrangement.',
    type: 'SERVICE',
    format: 'Virtual',
    genres: ['Education'],
    tags: ['Mentorship'],
    badges: ['Staff pick'],
    price: { amount: 45000, currency: 'USD' },
    availability: { status: 'AVAILABLE', fulfillment: 'DIGITAL' },
    media: [],
    metadata: { lessons: 3 },
  },
  {
    id: 'tour-tee',
    sku: 'MERCH-007',
    slug: 'world-tour-shirt',
    title: 'World Tour T-Shirt',
    subtitle: 'Soft-touch cotton blend',
    description: 'Tour artwork on a unisex tee with sustainable packaging.',
    type: 'MERCH',
    format: 'Apparel',
    genres: ['Merch'],
    tags: ['New'],
    badges: ['Ships worldwide'],
    price: { amount: 3500, currency: 'USD' },
    availability: { status: 'IN_STOCK', fulfillment: 'PHYSICAL' },
    media: [],
    metadata: { sizes: ['S', 'M', 'L', 'XL'] },
  },
  {
    id: 'bundle-hybrid',
    sku: 'BUNDLE-123',
    slug: 'membership-bundle',
    title: 'Streaming + Vinyl Bundle',
    subtitle: 'Access everywhere with limited drops',
    description: 'Hybrid bundle that includes digital streaming and quarterly vinyl shipments.',
    type: 'BUNDLE',
    format: 'Hybrid',
    genres: ['Hybrid'],
    tags: ['Bundle'],
    badges: ['Best value'],
    price: { amount: 14900, currency: 'USD', interval: 'Month' },
    availability: { status: 'AVAILABLE', fulfillment: 'HYBRID' },
    media: [],
    metadata: { shipmentsPerYear: 4 },
  },
]

const filterProducts = (products, variables = {}) => {
  let filtered = [...products]

  const requestedTypes = variables.filters?.productTypes ?? []
  const requestedFulfillment = variables.filters?.fulfillment ?? []
  const requestedTags = variables.filters?.tags ?? []
  const requestedAvailability = variables.filters?.availabilityStatuses ?? []
  const searchTerm = variables.search?.toLowerCase?.()

  if (requestedTypes.length) {
    filtered = filtered.filter((product) => requestedTypes.includes(product.type))
  }

  if (requestedFulfillment.length) {
    filtered = filtered.filter((product) =>
      requestedFulfillment.includes(product.availability.fulfillment),
    )
  }

  if (requestedTags.length) {
    filtered = filtered.filter((product) =>
      product.tags?.some?.((tag) => requestedTags.includes(tag)),
    )
  }

  if (requestedAvailability.length) {
    filtered = filtered.filter((product) =>
      requestedAvailability.includes(product.availability.status),
    )
  }

  if (searchTerm) {
    filtered = filtered.filter((product) =>
      [product.title, product.subtitle, product.description, product.sku]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm)),
    )
  }

  return filtered
}

const parsePageNumber = (cursor) => {
  if (typeof cursor !== 'string') return 1
  const match = cursor.match(/page-(\d+)/)
  const parsed = match ? Number.parseInt(match[1], 10) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export const createMockCatalogClient = (products = MOCK_PRODUCTS) => ({
  async post(_path, { json }) {
    const variables = json?.variables ?? {}
    const filtered = filterProducts(products, variables)
    const requestedPageSize = Number(variables.pagination?.first) || filtered.length
    const pageSize = requestedPageSize > 0 ? requestedPageSize : filtered.length
    const requestedCursor = variables.pagination?.after ?? null
    const pageNumber = parsePageNumber(requestedCursor)
    const startIndex = (pageNumber - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = filtered.slice(startIndex, endIndex)
    const hasNextPage = endIndex < filtered.length

    return {
      data: {
        catalog: {
          items,
          pageInfo: {
            total: filtered.length,
            hasNextPage,
            endCursor: hasNextPage ? `page-${pageNumber + 1}` : null,
          },
        },
      },
    }
  },
})

export function CatalogPlayground({
  mockProducts = MOCK_PRODUCTS,
  storageNamespace = 'story.catalog',
  storageArea = 'memory',
  ...props
}) {
  const client = useMemo(() => createMockCatalogClient(mockProducts), [mockProducts])
  const storage = useMemo(
    () =>
      createStorageController({
        namespace: storageNamespace,
        area: storageArea,
      }),
    [storageNamespace, storageArea],
  )

  return (
    <Catalog
      client={client}
      storage={storage}
      graphQLEndpoint="/graphql/catalog"
      onProductSelect={() => {}}
      {...props}
    />
  )
}

export const Default = {
  render: (args) => <CatalogPlayground {...args} />,
}

export const ListView = {
  args: {
    initialView: 'list',
  },
  render: (args) => <CatalogPlayground {...args} />,
}

export const PhysicalFocus = {
  args: {
    initialFilters: { fulfillment: ['PHYSICAL'] },
    searchPlaceholder: 'Search catalog for merch',
  },
  render: (args) => <CatalogPlayground {...args} />,
}

export const CustomRenderer = {
  render: (args) => (
    <CatalogPlayground
      {...args}
      renderProduct={({ product, viewMode, onSelect }) => (
        <article data-testid="custom-product" className="catalog-story-custom-card">
          <header>
            <h3>{product.title}</h3>
            <p>{product.subtitle}</p>
          </header>
          <p>{product.description}</p>
          <dl>
            <div>
              <dt>Format</dt>
              <dd>{product.format}</dd>
            </div>
            <div>
              <dt>Fulfillment</dt>
              <dd>{product.availability.fulfillment}</dd>
            </div>
          </dl>
          <footer>
            <button type="button" onClick={() => onSelect?.(product)}>
              Add to crate
            </button>
            <span aria-label="View mode">{viewMode}</span>
          </footer>
        </article>
      )}
    />
  ),
}
