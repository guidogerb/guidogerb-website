const DEFAULT_COLUMNS = Object.freeze([
  Object.freeze({
    title: 'Integrated publishing console',
    description:
      'Manage your entire catalog from manuscript intake to multi-format delivery. Our console keeps metadata, assets, and rights aligned so every release stays market-ready.',
    features: Object.freeze([
      'Rights tracking for print, sync, and streaming agreements',
      'Automated ISRC, ISBN, and UPC assignment with validation rules',
      'Version history for scores, parts, and marketing collateral',
    ]),
  }),
  Object.freeze({
    title: 'Collaborative editorial workflows',
    description:
      'Bring editors, arrangers, and composers into a shared workspace. Built-in review stages keep everyone aligned on deadlines and quality gates.',
    features: Object.freeze([
      'Comment threads with score and manuscript annotations',
      'Approval checkpoints with automated reminders',
      'Asset lockers for stems, engravings, and print-ready files',
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

export function PlatformSection({ id = 'platform', columns }) {
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

PlatformSection.DEFAULT_COLUMNS = DEFAULT_COLUMNS
