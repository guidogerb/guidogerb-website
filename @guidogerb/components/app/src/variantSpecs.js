import {
  APP_BASIC_TENANT_CONTROLS,
  APP_SHELL_LAYOUT_BLUEPRINT,
  APP_SHELL_PROVIDER_BLUEPRINT,
} from './App.jsx'

const deepFreeze = (value) => {
  if (Array.isArray(value)) {
    for (const entry of value) {
      deepFreeze(entry)
    }
    return Object.freeze(value)
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      deepFreeze(entry)
    }
    return Object.freeze(value)
  }

  return value
}

const sharedBlueprintSummary = deepFreeze({
  providerOrder: APP_SHELL_PROVIDER_BLUEPRINT.order,
  layoutRegions: APP_SHELL_LAYOUT_BLUEPRINT.regions.map((region) => ({
    id: region.id,
    role: region.role,
    description: region.description,
  })),
  tenantControlGroups: Object.entries(APP_BASIC_TENANT_CONTROLS).map(([group, controls]) => ({
    id: group,
    controls: [...controls],
  })),
})

const createVariantSpec = (spec) => {
  const {
    enhancements = {},
    operations = {},
    focusAreas = [],
    targetedTenants = [],
    recommendedPackages = [],
    blueprint = sharedBlueprintSummary,
  } = spec

  const normalized = {
    id: spec.id,
    label: spec.label,
    summary: spec.summary,
    inheritsFrom: spec.inheritsFrom ?? null,
    targetedTenants,
    focusAreas,
    recommendedPackages,
    blueprint,
    enhancements: {
      providers: enhancements.providers ?? [],
      publicRoutes: enhancements.publicRoutes ?? [],
      protectedRoutes: enhancements.protectedRoutes ?? [],
    },
    operations: {
      environment: operations.environment ?? [],
      notes: operations.notes ?? [],
    },
  }

  return deepFreeze(normalized)
}

const basicVariantSpec = createVariantSpec({
  id: 'basic',
  label: 'AppBasic',
  summary:
    'Marketing-first baseline that wires shared providers, public landing pages, and a protected dashboard shell.',
  targetedTenants: [
    'Publishing teams launching marketing sites with authenticated partner portals.',
    'Labels that need a guided starting point before layering analytics or commerce features.',
  ],
  focusAreas: [
    {
      id: 'marketing',
      title: 'Marketing launchpad',
      description:
        'Ships hero, feature, pricing, and legal routes so tenants can publish quickly with brand-aligned copy.',
    },
    {
      id: 'dashboard',
      title: 'Protected portal baseline',
      description:
        'Includes the guarded dashboard entry point, logout wiring, and loading/error scaffolding for tenant modules.',
    },
  ],
  recommendedPackages: [
    '@guidogerb/components-pages-public',
    '@guidogerb/components-pages-protected',
    '@guidogerb/components-menu',
  ],
  enhancements: {
    providers: [],
    publicRoutes: [
      {
        path: '/',
        title: 'Marketing landing',
        description:
          'Default hero and CTA sections rendered through `@guidogerb/components-pages-public`.',
      },
      {
        path: '/privacy',
        title: 'Privacy policy',
        description: 'Branded legal fallback that ships with the public marketing shell.',
      },
    ],
    protectedRoutes: [
      {
        path: '/dashboard',
        title: 'Dashboard home',
        description:
          'Placeholder workspace encouraging tenants to slot analytics, commerce, or collaboration modules.',
      },
    ],
  },
  operations: {
    environment: [
      'OIDC client ID and redirect URIs required by `@guidogerb/components-auth`.',
      'API base URL and request hooks consumed by `@guidogerb/components-api`.',
      'Storage namespace prefix shared between authentication, feature flags, and cache preferences.',
    ],
    notes: [
      'Acts as the foundation other variants extend; navigation, footer, and page collections stay overrideable.',
      'Service worker registration is enabled by default but can be toggled with the existing `serviceWorker` prop.',
    ],
  },
})

const analyticsVariantSpec = createVariantSpec({
  id: 'analytics',
  label: 'AppAnalytics',
  inheritsFrom: 'basic',
  summary:
    'Extends the base shell with analytics dashboards, consent-aware instrumentation, and scheduled report exports.',
  targetedTenants: [
    'Teams tracking streaming KPIs, release velocity, and territory performance.',
    'Analysts who need curated dashboards, benchmarking, and export tooling without building routing glue.',
  ],
  focusAreas: [
    {
      id: 'dashboards',
      title: 'Insight dashboards',
      description:
        'Prebuilt analytics layouts highlighting streaming performance, catalogue health, and partner engagement.',
    },
    {
      id: 'reporting',
      title: 'Report automation',
      description:
        'Schedules CSV/PDF exports and measurement snapshots for finance and marketing stakeholders.',
    },
  ],
  recommendedPackages: [
    '@guidogerb/components-analytics',
    '@guidogerb/components-storage',
    '@guidogerb/components-api',
  ],
  enhancements: {
    providers: [
      {
        id: 'analytics',
        package: '@guidogerb/components-analytics',
        dependsOn: ['api', 'storage'],
        description:
          'Hydrates analytics context, GA4 bindings, and consent-aware event dispatchers used across routes.',
      },
    ],
    publicRoutes: [
      {
        path: '/insights',
        title: 'Insights library',
        description:
          'Optional marketing page showcasing case studies and performance highlights sourced from analytics data.',
      },
    ],
    protectedRoutes: [
      {
        path: '/analytics',
        title: 'Analytics overview',
        description:
          'Default dashboard route surfacing streaming KPIs, top releases, and configurable comparison widgets.',
      },
      {
        path: '/reports',
        title: 'Reports & exports',
        description:
          'Workspace for scheduling exports, exploring measurement protocol fallbacks, and reviewing KPI digests.',
      },
    ],
  },
  operations: {
    environment: [
      'GA4 measurement IDs or custom analytics keys consumed by the analytics provider.',
      'S3 bucket and IAM role used for scheduled report export storage.',
    ],
    notes: [
      'Extends tenant controls with analytics dashboards and alert configuration hooks.',
      'Coordinates consent toggles between storage, the service worker, and analytics session state.',
    ],
  },
})

const commerceVariantSpec = createVariantSpec({
  id: 'commerce',
  label: 'AppCommerce',
  inheritsFrom: 'basic',
  summary:
    'Builds on the base variant with storefront, catalog management, checkout, and point-of-sale experiences.',
  targetedTenants: [
    'Artists and partners monetising catalogues with digital or physical products.',
    'Retail teams who require offline-friendly registers synced with central inventory and analytics.',
  ],
  focusAreas: [
    {
      id: 'storefront',
      title: 'Commerce landing',
      description:
        'Transforms the public marketing shell into a storefront that lists catalog entries and highlights promotions.',
    },
    {
      id: 'operations',
      title: 'Order operations',
      description:
        'Protected routes manage catalog data, fulfilment, refunds, and on-site point-of-sale sessions.',
    },
  ],
  recommendedPackages: [
    '@guidogerb/components-catalog',
    '@guidogerb/components-shopping-cart',
    '@guidogerb/components-point-of-sale',
  ],
  enhancements: {
    providers: [
      {
        id: 'catalog',
        package: '@guidogerb/components-catalog',
        dependsOn: ['api', 'storage'],
        description:
          'Synchronises product data, pricing, and availability badges used by storefront and dashboard views.',
      },
      {
        id: 'shoppingCart',
        package: '@guidogerb/components-shopping-cart',
        dependsOn: ['catalog', 'analytics'],
        description:
          'Exposes cart state, checkout flows, and conversion analytics built on top of the catalog provider.',
      },
      {
        id: 'pointOfSale',
        package: '@guidogerb/components-point-of-sale',
        dependsOn: ['catalog', 'storage', 'analytics'],
        description:
          'Adds register interfaces, offline invoice queues, and Stripe-powered payment hand-offs.',
      },
    ],
    publicRoutes: [
      {
        path: '/shop',
        title: 'Storefront',
        description:
          'Public commerce route rendering catalog listings, featured products, and add-to-cart actions.',
      },
    ],
    protectedRoutes: [
      {
        path: '/orders',
        title: 'Orders & fulfilment',
        description:
          'Back-office workspace for managing orders, refunds, and shipment status updates.',
      },
      {
        path: '/catalog',
        title: 'Catalog management',
        description:
          'Secure module for editing product metadata, inventory thresholds, and merchandising rules.',
      },
    ],
  },
  operations: {
    environment: [
      'Stripe publishable/secret keys and webhook endpoints powering checkout and POS hand-offs.',
      'Inventory service base URL or API keys synchronising stock levels with catalog views.',
      'Offline receipt storage bucket for point-of-sale failover uploads.',
    ],
    notes: [
      'Requires service worker background sync so POS queues persist during network loss.',
      'Encourages dedicated storage namespaces per tenant to isolate cart, order, and payment data.',
    ],
  },
})

export const APP_VARIANT_SPECS = deepFreeze({
  [basicVariantSpec.id]: basicVariantSpec,
  [analyticsVariantSpec.id]: analyticsVariantSpec,
  [commerceVariantSpec.id]: commerceVariantSpec,
})

export const getAppVariantSpec = (variantId) => APP_VARIANT_SPECS[variantId] ?? null

export const listAppVariantSpecs = () => Object.values(APP_VARIANT_SPECS)
