import {
  DistributionSection,
  HeroSection,
  NewsletterSection,
  PlatformSection,
  ResourcesSection,
} from '@guidogerb/components-ui'

export const MARKETING_CONTENT_ENDPOINT = '/cms/publishing/marketing'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const pickString = (...candidates) => {
  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) {
      return candidate.trim()
    }
  }
  return undefined
}

const cloneHighlight = (item) => ({ label: item.label, description: item.description })

const cloneArticle = (article = {}) => ({
  title: article.title,
  description: article.description,
  features: Array.isArray(article.features) ? [...article.features] : [],
})

const cloneNewsletter = (newsletter) => ({
  title: newsletter.title,
  description: newsletter.description,
  formLabel: newsletter.formLabel,
  buttonLabel: newsletter.buttonLabel,
  placeholder: newsletter.placeholder,
  inputLabel: newsletter.inputLabel,
})

const DEFAULT_MARKETING_CONTENT = Object.freeze({
  hero: Object.freeze({
    eyebrow: HeroSection.DEFAULT_EYEBROW,
    title: HeroSection.DEFAULT_TITLE,
    lede: HeroSection.DEFAULT_LEDE,
    highlightsLabel: HeroSection.DEFAULT_HIGHLIGHTS_LABEL,
    highlights: HeroSection.DEFAULT_HIGHLIGHTS.map(cloneHighlight),
  }),
  platform: PlatformSection.DEFAULT_COLUMNS.map(cloneArticle),
  distribution: DistributionSection.DEFAULT_COLUMNS.map(cloneArticle),
  resources: ResourcesSection.DEFAULT_COLUMNS.map(cloneArticle),
  newsletter: cloneNewsletter({
    title: NewsletterSection.DEFAULT_TITLE,
    description: NewsletterSection.DEFAULT_DESCRIPTION,
    formLabel: NewsletterSection.DEFAULT_FORM_LABEL,
    buttonLabel: NewsletterSection.DEFAULT_BUTTON_LABEL,
    placeholder: NewsletterSection.DEFAULT_PLACEHOLDER,
    inputLabel: NewsletterSection.DEFAULT_INPUT_LABEL,
  }),
})

const sanitizeHighlights = (highlights, fallback) => {
  if (!Array.isArray(highlights)) {
    return fallback.map(cloneHighlight)
  }

  const normalized = highlights
    .map((item) => {
      if (!item || typeof item !== 'object') return null

      const label = pickString(item.label, item.value)
      const description = pickString(item.description, item.copy, item.text)

      if (!label || !description) return null

      return { label, description }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : fallback.map(cloneHighlight)
}

const sanitizeArticles = (articles, fallback) => {
  if (!Array.isArray(articles) || articles.length === 0) {
    return fallback.map(cloneArticle)
  }

  const normalized = articles
    .map((article, index) => {
      const base = fallback[index] ?? {}

      if (!article || typeof article !== 'object') {
        return cloneArticle(base)
      }

      const title = pickString(article.title, article.heading) ?? base.title
      const description =
        pickString(article.description, article.copy, article.body) ?? base.description
      const featuresSource = article.features ?? article.bullets ?? article.items

      const features = Array.isArray(featuresSource)
        ? featuresSource.map((item) => pickString(item)).filter(Boolean)
        : Array.isArray(base.features)
          ? [...base.features]
          : []

      return {
        title,
        description,
        features:
          features.length > 0 ? features : Array.isArray(base.features) ? [...base.features] : [],
      }
    })
    .filter(
      (article) =>
        isNonEmptyString(article.title) ||
        isNonEmptyString(article.description) ||
        (Array.isArray(article.features) && article.features.length > 0),
    )

  return normalized.length > 0 ? normalized : fallback.map(cloneArticle)
}

const sanitizeNewsletter = (newsletter, fallback) => {
  if (!newsletter || typeof newsletter !== 'object') {
    return cloneNewsletter(fallback)
  }

  return {
    title: pickString(newsletter.title, newsletter.heading) ?? fallback.title,
    description:
      pickString(newsletter.description, newsletter.copy, newsletter.body) ?? fallback.description,
    formLabel:
      pickString(newsletter.formLabel, newsletter['form_label'], newsletter.formTitle) ??
      fallback.formLabel,
    buttonLabel:
      pickString(newsletter.buttonLabel, newsletter.ctaLabel, newsletter.cta?.label) ??
      fallback.buttonLabel,
    placeholder:
      pickString(
        newsletter.placeholder,
        newsletter.inputPlaceholder,
        newsletter.input?.placeholder,
      ) ?? fallback.placeholder,
    inputLabel:
      pickString(
        newsletter.inputLabel,
        newsletter['input_label'],
        newsletter.input?.label,
        newsletter.label,
      ) ?? fallback.inputLabel,
  }
}

export const getDefaultMarketingContent = () => ({
  hero: {
    ...DEFAULT_MARKETING_CONTENT.hero,
    highlights: DEFAULT_MARKETING_CONTENT.hero.highlights.map(cloneHighlight),
  },
  platform: DEFAULT_MARKETING_CONTENT.platform.map(cloneArticle),
  distribution: DEFAULT_MARKETING_CONTENT.distribution.map(cloneArticle),
  resources: DEFAULT_MARKETING_CONTENT.resources.map(cloneArticle),
  newsletter: cloneNewsletter(DEFAULT_MARKETING_CONTENT.newsletter),
})

export const normalizeMarketingContent = (content) => {
  const fallback = DEFAULT_MARKETING_CONTENT
  const source = content && typeof content === 'object' ? content : {}
  const heroSource = source.hero ?? source.Hero ?? {}

  return {
    hero: {
      eyebrow: pickString(heroSource.eyebrow, heroSource.tagline) ?? fallback.hero.eyebrow,
      title: pickString(heroSource.title, heroSource.heading) ?? fallback.hero.title,
      lede:
        pickString(heroSource.lede, heroSource.description, heroSource.copy) ?? fallback.hero.lede,
      highlightsLabel:
        pickString(
          heroSource.highlightsLabel,
          heroSource['highlights_label'],
          heroSource.metricsLabel,
        ) ?? fallback.hero.highlightsLabel,
      highlights: sanitizeHighlights(
        heroSource.highlights ?? heroSource.metrics,
        fallback.hero.highlights,
      ),
    },
    platform: sanitizeArticles(source.platform ?? source.platformSections, fallback.platform),
    distribution: sanitizeArticles(source.distribution, fallback.distribution),
    resources: sanitizeArticles(source.resources, fallback.resources),
    newsletter: sanitizeNewsletter(source.newsletter, fallback.newsletter),
  }
}

export const buildMarketingContentUrl = (baseUrl) => {
  if (!isNonEmptyString(baseUrl)) return null
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  return `${trimmed}${MARKETING_CONTENT_ENDPOINT}`
}

export const fetchMarketingContent = async ({
  baseUrl,
  fetchImpl = globalThis.fetch,
  signal,
} = {}) => {
  const url = buildMarketingContentUrl(baseUrl)
  if (!url || typeof fetchImpl !== 'function') {
    return getDefaultMarketingContent()
  }

  const response = await fetchImpl(url, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to load marketing content (${response.status})`)
  }

  const payload = await response.json()
  return normalizeMarketingContent(payload)
}

export default DEFAULT_MARKETING_CONTENT
