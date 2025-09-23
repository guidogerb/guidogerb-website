import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const SECTION_MAP = Object.freeze({
  '/': 'top',
  '/fermentation': 'fermentation',
  '/cheese-lab': 'cheese-lab',
  '/events': 'events',
  '/market': 'market',
  '/newsletter': 'newsletter',
  '/partners': 'partner-hub',
  '/contact': 'contact',
})

export const AUXILIARY_PATHS = Object.freeze(['/auth/callback'])

export const MARKETING_PATHS = Object.freeze([
  ...Object.keys(SECTION_MAP),
  ...AUXILIARY_PATHS,
])

function scrollToSection(id) {
  if (!id || typeof document === 'undefined') return
  const element = document.getElementById(id)
  if (element?.scrollIntoView) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function useMarketingNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const activePath = location.pathname || '/'

  useEffect(() => {
    const sectionId = SECTION_MAP[activePath]
    if (sectionId) {
      scrollToSection(sectionId)
    }
  }, [activePath])

  const handleNavigate = useCallback(
    ({ item }) => {
      if (!item?.href || typeof window === 'undefined') return

      const href = String(item.href)

      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        window.location.href = href
        return
      }

      try {
        const url = new URL(href, window.location.origin)

        if (item.external || url.origin !== window.location.origin) {
          const target = item.target ?? '_blank'
          window.open(url.href, target, 'noopener')
          return
        }

        const targetPath = url.pathname || '/'
        const sectionId =
          SECTION_MAP[targetPath] || (url.hash ? url.hash.replace('#', '') : undefined)

        if (sectionId) {
          if (targetPath !== activePath) {
            navigate(targetPath)
          } else {
            scrollToSection(sectionId)
          }
          return
        }

        if (targetPath !== activePath || url.search || url.hash) {
          navigate(url.pathname + url.search + url.hash)
        }
      } catch {
        window.location.assign(href)
      }
    },
    [navigate, activePath],
  )

  const navigateHome = useCallback(
    (event) => {
      if (event?.preventDefault) {
        event.preventDefault()
      }
      if (typeof window === 'undefined') return
      if (activePath !== '/') {
        navigate('/')
      } else {
        scrollToSection('top')
      }
    },
    [activePath, navigate],
  )

  return { activePath, handleNavigate, navigateHome }
}
