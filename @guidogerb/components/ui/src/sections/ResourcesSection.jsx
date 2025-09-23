const DEFAULT_COLUMNS = Object.freeze([
  Object.freeze({
    title: 'Author onboarding',
    description:
      'Provide contributors with a clear path from first draft to launch. Templates, checklists, and personal consultations ensure every project is ready for distribution.',
    features: Object.freeze([
      'Submission portal with formatting guidelines and asset requirements',
      'Release readiness scorecards and marketing asset checklists',
      'Quarterly planning sessions with our editorial and licensing leads',
    ]),
  }),
  Object.freeze({
    title: 'Marketing toolkit',
    description:
      'Keep campaigns consistent with modular launch kits tailored to recordings, educational content, and performance rights packages.',
    features: Object.freeze([
      'Pre-built email, social, and press release templates',
      'Digital ad creative sized for arts presenters and music retailers',
      'Audience journey maps to align nurture and paid campaigns',
    ]),
  }),
  Object.freeze({
    title: 'Compliance resources',
    description:
      'Stay ahead of regional reporting and royalty requirements. Our resource library keeps your team current on mechanical, performance, and educational licensing rules.',
    features: Object.freeze([
      'Regional royalty calendars and automated filing reminders',
      'Template agreements for composers, arrangers, and narrators',
      'Security checklist covering data residency and archival policies',
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

  const features = sanitizeFeatures(column.features ?? column.bullets ?? column.items, fallback.features)

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

export function ResourcesSection({ id = 'resources', columns }) {
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

ResourcesSection.DEFAULT_COLUMNS = DEFAULT_COLUMNS
