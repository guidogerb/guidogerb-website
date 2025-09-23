const DEFAULT_EYEBROW = 'Publishing operations for modern catalogs'
const DEFAULT_TITLE =
  'GuidoGerb Publishing brings manuscripts to market with full-service production and rights management.'
const DEFAULT_LEDE =
  'From editorial strategy to digital distribution, we partner with authors, ensembles, and arts organizations to deliver releases across print, audio, and interactive channels.'
const DEFAULT_HIGHLIGHTS_LABEL = 'Publishing impact highlights'
const DEFAULT_HIGHLIGHTS = Object.freeze([
  Object.freeze({
    label: '600+',
    description: 'active titles across scores, recordings, and digital editions',
  }),
  Object.freeze({
    label: '40',
    description: 'new releases shepherded each season with dedicated launch plans',
  }),
  Object.freeze({
    label: '85%',
    description: 'catalog revenue delivered through direct-to-audience storefronts',
  }),
])

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const normalizeHighlight = (item) => {
  if (!item || typeof item !== 'object') return null

  const label = [item.label, item.value]
    .map((candidate) => (isNonEmptyString(candidate) ? candidate.trim() : null))
    .find(Boolean)

  const description = [item.description, item.copy, item.text]
    .map((candidate) => (isNonEmptyString(candidate) ? candidate.trim() : null))
    .find(Boolean)

  if (!label || !description) return null

  return { label, description }
}

const normalizeHighlights = (highlights) => {
  if (!Array.isArray(highlights)) return DEFAULT_HIGHLIGHTS

  const normalized = highlights.map(normalizeHighlight).filter(Boolean)
  return normalized.length > 0 ? normalized : DEFAULT_HIGHLIGHTS
}

export function HeroSection({
  id = 'solutions',
  eyebrow = DEFAULT_EYEBROW,
  title = DEFAULT_TITLE,
  lede = DEFAULT_LEDE,
  highlights,
  highlightsLabel = DEFAULT_HIGHLIGHTS_LABEL,
}) {
  const highlightItems = normalizeHighlights(highlights)

  return (
    <section className="hero" id={id}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
      <dl className="hero-highlights" aria-label={highlightsLabel}>
        {highlightItems.map((item, index) => (
          <div key={item.label || index}>
            <dt>{item.label}</dt>
            <dd>{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

HeroSection.DEFAULT_EYEBROW = DEFAULT_EYEBROW
HeroSection.DEFAULT_TITLE = DEFAULT_TITLE
HeroSection.DEFAULT_LEDE = DEFAULT_LEDE
HeroSection.DEFAULT_HIGHLIGHTS = DEFAULT_HIGHLIGHTS
HeroSection.DEFAULT_HIGHLIGHTS_LABEL = DEFAULT_HIGHLIGHTS_LABEL
