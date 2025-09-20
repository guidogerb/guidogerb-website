const createIconComponent = (renderChildren, options = {}) => {
  const {
    displayName,
    viewBox = '0 0 24 24',
    strokeWidth = 1.5,
    strokeLinecap = 'round',
    strokeLinejoin = 'round',
    fill = 'none',
  } = options

  const IconComponent = ({ title, ...props } = {}) => {
    const accessibleProps = title ? { role: 'img' } : { 'aria-hidden': 'true' }

    return (
      <svg
        width="1em"
        height="1em"
        focusable="false"
        viewBox={viewBox}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
        fill={fill}
        {...accessibleProps}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {renderChildren()}
      </svg>
    )
  }

  IconComponent.displayName = displayName ?? 'FooterIcon'

  return IconComponent
}

const InstagramIcon = createIconComponent(
  () => (
    <>
      <rect x="4.25" y="4.25" width="15.5" height="15.5" rx="4" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="16.75" cy="7.25" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  { displayName: 'FooterInstagramIcon' },
)

const YouTubeIcon = createIconComponent(
  () => (
    <>
      <rect x="3.75" y="7.25" width="16.5" height="9.5" rx="3.5" />
      <path d="M11.25 9.75 15.75 12l-4.5 2.25Z" fill="currentColor" stroke="none" />
    </>
  ),
  { displayName: 'FooterYouTubeIcon' },
)

const LinkedInIcon = createIconComponent(
  () => (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M7.75 11h1.5v7h-1.5z" fill="currentColor" stroke="none" />
      <path
        d="M11 11h1.5v1.1c.4-.8 1.2-1.3 2.3-1.3 1.7 0 2.75 1 2.75 3.17V18h-1.5v-3.16c0-.98-.37-1.62-1.3-1.62-.95 0-1.5.68-1.5 1.68V18H11Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  { displayName: 'FooterLinkedInIcon' },
)

const TikTokIcon = createIconComponent(
  () => (
    <>
      <path d="M14.25 4.75v6.9a2.85 2.85 0 1 1-2-2.73V6.25" />
      <path d="M14.25 5.75c.7 1.2 1.95 1.98 3.25 2.05v2.05c-1.55-.08-2.88-.66-3.9-1.57" />
      <circle cx="10.5" cy="13.75" r="2" />
    </>
  ),
  { displayName: 'FooterTikTokIcon' },
)

const SubstackIcon = createIconComponent(
  () => (
    <>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
      <path d="M5 8.5h14" />
      <path d="m8.5 13 3.5 2 3.5-2" />
    </>
  ),
  { displayName: 'FooterSubstackIcon' },
)

const FacebookIcon = createIconComponent(
  () => (
    <>
      <circle cx="12" cy="12" r="8" />
      <path
        d="M12.75 8h2V6h-2c-1.66 0-3 1.34-3 3v1.5H9v2h1.75V18h2.25v-5.5h1.75l.35-2H13v-.5c0-.28.22-.5.5-.5Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  { displayName: 'FooterFacebookIcon' },
)

const XIcon = createIconComponent(
  () => (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
      <path d="m8 8 8 8" />
      <path d="m16 8-8 8" />
    </>
  ),
  { displayName: 'FooterXIcon' },
)

const SpotifyIcon = createIconComponent(
  () => (
    <>
      <circle cx="12" cy="12" r="7.25" />
      <path d="M8.75 10.25c2.3-.5 4.9-.32 7 .47" />
      <path d="M9.25 13c1.85-.32 3.9-.18 5.6.45" />
      <path d="M9.75 15.5c1.26-.16 2.6-.04 3.75.35" />
    </>
  ),
  { displayName: 'FooterSpotifyIcon' },
)

const BandcampIcon = createIconComponent(
  () => (
    <>
      <rect x="4.5" y="5" width="15" height="14" rx="2" />
      <path d="m9 9 3.5 3-3.5 3H6l3-6Z" fill="currentColor" stroke="none" />
    </>
  ),
  { displayName: 'FooterBandcampIcon' },
)

const PrivacyIcon = createIconComponent(
  () => (
    <>
      <path d="M12 3.75 6 6v6c0 3.8 2.8 7.45 6 8.25 3.2-.8 6-4.45 6-8.25V6Z" />
      <path d="m10.25 12.25 1.75 1.75 2.5-3.25" />
    </>
  ),
  { displayName: 'FooterPrivacyIcon' },
)

const TermsIcon = createIconComponent(
  () => (
    <>
      <path d="M8.5 4.75h6.75L18 7.5v11a1.75 1.75 0 0 1-1.75 1.75H8.75A1.75 1.75 0 0 1 7 18.5v-11A1.75 1.75 0 0 1 8.75 4.75Z" />
      <path d="M15.5 4.75V7.5H18" />
      <path d="M9.5 11h4.5" />
      <path d="M9.5 14h4.5" />
      <path d="M9.5 17h3" />
    </>
  ),
  { displayName: 'FooterTermsIcon' },
)

const CookiesIcon = createIconComponent(
  () => (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="10" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="15" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  { displayName: 'FooterCookiesIcon' },
)

const AccessibilityIcon = createIconComponent(
  () => (
    <>
      <circle cx="12" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6.5 10.5h11" />
      <path d="M12 8v10" />
      <path d="M8.25 16.5 12 14.25l3.75 2.25" />
    </>
  ),
  { displayName: 'FooterAccessibilityIcon' },
)

const CopyrightIcon = createIconComponent(
  () => (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M14.5 9.5a3 3 0 1 0 0 5" />
    </>
  ),
  { displayName: 'FooterCopyrightIcon' },
)

export const SOCIAL_ICON_COMPONENTS = Object.freeze({
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
  tiktok: TikTokIcon,
  substack: SubstackIcon,
  facebook: FacebookIcon,
  x: XIcon,
  spotify: SpotifyIcon,
  bandcamp: BandcampIcon,
})

export const LEGAL_ICON_COMPONENTS = Object.freeze({
  privacy: PrivacyIcon,
  terms: TermsIcon,
  cookies: CookiesIcon,
  accessibility: AccessibilityIcon,
  copyright: CopyrightIcon,
})

export const DEFAULT_SOCIAL_ICONS = Object.freeze(
  Object.fromEntries(
    Object.entries(SOCIAL_ICON_COMPONENTS).map(([key, Component]) => [key, <Component />]),
  ),
)

export const DEFAULT_LEGAL_ICONS = Object.freeze(
  Object.fromEntries(
    Object.entries(LEGAL_ICON_COMPONENTS).map(([key, Component]) => [key, <Component />]),
  ),
)

const TEXT_FIELDS = ['id', 'label', 'href', 'description', 'rel', 'target']

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const buildLookupValue = (link) =>
  TEXT_FIELDS.map((field) => (isNonEmptyString(link?.[field]) ? link[field].toLowerCase() : ''))
    .filter(Boolean)
    .join(' ')

const SOCIAL_ICON_MATCHERS = [
  { key: 'instagram', pattern: /\binsta(?:gram)?\b|instagram\.com/i },
  { key: 'youtube', pattern: /\byou ?tube\b|youtu\.be/i },
  { key: 'linkedin', pattern: /\blinked ?in\b|linkedin\.com/i },
  { key: 'tiktok', pattern: /\btik ?tok\b|tiktok\.com/i },
  { key: 'substack', pattern: /\bsubstack\b|substack\.com/i },
  { key: 'facebook', pattern: /\bfacebook\b|fb\.com/i },
  { key: 'x', pattern: /\b(?:x|twitter)\b|twitter\.com|t\.co/i },
  { key: 'spotify', pattern: /\bspotify\b|open\.spotify\.com/i },
  { key: 'bandcamp', pattern: /\bbandcamp\b|bandcamp\.com/i },
]

const LEGAL_ICON_MATCHERS = [
  { key: 'privacy', pattern: /\bprivacy\b|data protection|gdpr/i },
  { key: 'terms', pattern: /\bterms\b|\bagreement\b|\blegal\b/i },
  { key: 'cookies', pattern: /\bcookies?\b/i },
  { key: 'accessibility', pattern: /\baccessibility\b|\bada\b/i },
  { key: 'copyright', pattern: /\bcopyright\b|©|&copy;/i },
]

const getRegistryForCategory = (category) => {
  if (category === 'social') return SOCIAL_ICON_COMPONENTS
  if (category === 'legal') return LEGAL_ICON_COMPONENTS
  return null
}

const getMatchersForCategory = (category) => {
  if (category === 'social') return SOCIAL_ICON_MATCHERS
  if (category === 'legal') return LEGAL_ICON_MATCHERS
  return []
}

export const resolveDefaultIcon = (link, category) => {
  const registry = getRegistryForCategory(category)
  if (!registry) return null

  const lookupValue = buildLookupValue(link)
  if (!lookupValue) return null

  const matchers = getMatchersForCategory(category)
  const matcher = matchers.find(({ pattern }) => pattern.test(lookupValue))
  if (!matcher) return null

  const IconComponent = registry[matcher.key]
  if (!IconComponent) return null

  return <IconComponent />
}

export const getDefaultSocialIcon = (link) => resolveDefaultIcon(link, 'social')

export const getDefaultLegalIcon = (link) => resolveDefaultIcon(link, 'legal')

export const applyDefaultIcons = (links, category) => {
  if (!Array.isArray(links) || links.length === 0) return []

  return links.map((link) => {
    if (!link || typeof link !== 'object') return link
    if (link.icon) return link

    const icon = resolveDefaultIcon(link, category)
    if (!icon) return link

    return { ...link, icon }
  })
}
