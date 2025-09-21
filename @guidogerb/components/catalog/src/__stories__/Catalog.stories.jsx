import { useMemo } from 'react'
import { Catalog } from '../Catalog.jsx'
import { createStorageController } from '@guidogerb/components-storage'

const meta = {
  title: 'Components/Catalog/Catalog',
  component: Catalog,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

const MOCK_PRODUCTS = [
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

const INITIAL_PAGES = [
  {
    cursor: null,
    items: MOCK_PRODUCTS.slice(0, 3),
    pageInfo: { total: MOCK_PRODUCTS.length, hasNextPage: true, endCursor: 'page-2' },
  },
  {
    cursor: 'page-2',
    items: MOCK_PRODUCTS.slice(3),
    pageInfo: { total: MOCK_PRODUCTS.length, hasNextPage: false, endCursor: null },
  },
]

const filterProducts = (products, variables = {}) => {
  let filtered = [...products]

  const requestedTypes = variables.filters?.productTypes ?? []
  const requestedFulfillment = variables.filters?.fulfillment ?? []
  const searchTerm = variables.search?.toLowerCase?.()

  if (requestedTypes.length) {
    filtered = filtered.filter((product) => requestedTypes.includes(product.type))
  }

  if (requestedFulfillment.length) {
    filtered = filtered.filter((product) => requestedFulfillment.includes(product.availability.fulfillment))
  }

  if (searchTerm) {
    filtered = filtered.filter((product) =>
      [product.title, product.subtitle, product.description]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(searchTerm)),
    )
  }

  return filtered
}

const createMockClient = () => ({
  async post(_path, { json }) {
    const variables = json?.variables ?? {}
    const hasFilters = Boolean(
      variables.search ||
        variables.filters?.productTypes?.length ||
        variables.filters?.fulfillment?.length,
    )

    const requestedPage = variables.pagination?.after ?? null

    let items = MOCK_PRODUCTS
    let pageInfo = { total: MOCK_PRODUCTS.length, hasNextPage: false, endCursor: null }

    if (hasFilters) {
      items = filterProducts(MOCK_PRODUCTS, variables)
      pageInfo = { total: items.length, hasNextPage: false, endCursor: null }
    } else {
      const page = INITIAL_PAGES.find((entry) => entry.cursor === requestedPage) ?? INITIAL_PAGES[0]
      items = page.items
      pageInfo = page.pageInfo
    }

    return {
      data: {
        catalog: {
          items,
          pageInfo,
        },
      },
    }
  },
})

function CatalogPlayground(props) {
  const client = useMemo(() => createMockClient(), [])
  const storage = useMemo(
    () =>
      createStorageController({
        namespace: 'story.catalog',
        area: 'memory',
      }),
    [],
  )

  return (
    <Catalog
      client={client}
      storage={storage}
      pageSize={3}
      graphQLEndpoint="/graphql/catalog"
      onProductSelect={() => {}}
      {...props}
    />
  )
}

export { CatalogPlayground }

export const Default = {
  render: () => <CatalogPlayground />,
}

export const ListView = {
  render: () => <CatalogPlayground initialView="list" />,
}

export const PhysicalFocus = {
  render: () => (
    <CatalogPlayground
      initialFilters={{ fulfillment: ['PHYSICAL'] }}
      searchPlaceholder="Search catalog for merch"
    />
  ),
}
