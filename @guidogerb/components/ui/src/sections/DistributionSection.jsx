const DEFAULT_COLUMNS = Object.freeze([
  Object.freeze({
    title: 'Distribution channels',
    description:
      'Launch simultaneously across streaming, retail, and licensing partners. We handle ingestion and compliance so your team can stay focused on building the catalog.',
    features: Object.freeze([
      'Direct delivery to Apple Music, Spotify, and classical-focused DSPs',
      'Global print-on-demand and warehouse fulfillment management',
      'Synchronization licensing pipeline with broadcast ready assets',
    ]),
  }),
  Object.freeze({
    title: 'Direct-to-audience storefronts',
    description:
      'Pair traditional channels with branded storefronts for ensembles, artists, and educators. Flexible bundles and subscription models help you grow recurring revenue.',
    features: Object.freeze([
      'Customizable microsites with secure score and media delivery',
      'Dynamic pricing tiers for studios, institutions, and touring groups',
      'Customer analytics with cohort retention and royalty forecasting',
    ]),
  }),
])

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const sanitizeFeatures = (features, fallback = []) => {
  if (!Array.isArray(features)) return fallback

  const normalized = features
    .map((item) => (isNonEmptyString(item) ? item.trim() : null))
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback
}

const sanitizeColumn = (column, fallback = {}) => {
  if (!column || typeof column !== 'object') return fallback

  const title = [column.title, column.heading]
    .map((candidate) => (isNonEmptyString(candidate) ? candidate.trim() : null))
    .find(Boolean)

  const description = [column.description, column.copy, column.body]
    .map((candidate) => (isNonEmptyString(candidate) ? candidate.trim() : null))
    .find(Boolean)

  const features = sanitizeFeatures(
    column.features ?? column.bullets ?? column.items,
    fallback.features,
  )

  return {
    title: title ?? fallback.title,
    description: description ?? fallback.description,
    features: features ?? fallback.features ?? [],
  }
}

const normalizeColumns = (columns) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    return DEFAULT_COLUMNS
  }

  const normalized = columns
    .map((column, index) => sanitizeColumn(column, DEFAULT_COLUMNS[index] ?? {}))
    .filter((column) => isNonEmptyString(column?.title) || isNonEmptyString(column?.description))

  return normalized.length > 0 ? normalized : DEFAULT_COLUMNS
}

export function DistributionSection({ id = 'distribution', columns }) {
  const resolvedColumns = normalizeColumns(columns)

  return (
    <section className="content-grid" id={id}>
      {resolvedColumns.map((column, index) => (
        <article key={column.title || index}>
          {column.title ? <h2>{column.title}</h2> : null}
          {column.description ? <p>{column.description}</p> : null}
          {column.features && column.features.length > 0 ? (
            <ul className="feature-list">
              {column.features.map((feature, featureIndex) => (
                <li key={`${feature}-${featureIndex}`}>{feature}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </section>
  )
}

DistributionSection.DEFAULT_COLUMNS = DEFAULT_COLUMNS
