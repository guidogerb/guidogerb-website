import { createHeaderSettings } from '@guidogerb/header'

export const headerSettings = createHeaderSettings({
  brand: {
    title: 'GuidoGerb Publishing',
    tagline: 'Production • Distribution • Rights',
    href: '/',
  },
  announcements: [
    {
      id: '2025-catalog',
      message: 'Spring 2025 release slate now accepting submissions.',
      href: '/resources',
      tone: 'highlight',
    },
    {
      id: 'analytics',
      message: 'New catalog analytics dashboards available for partners.',
      href: '/partner-portal',
      tone: 'info',
    },
  ],
  primaryLinks: [
    {
      id: 'solutions',
      label: 'Solutions',
      href: '/solutions',
      description: 'Editorial, production, and catalog strategy',
    },
    {
      id: 'platform',
      label: 'Platform',
      href: '/platform',
      description: 'Rights management and analytics suite',
    },
    {
      id: 'distribution',
      label: 'Distribution',
      href: '/distribution',
      description: 'Global channels and direct-to-audience tools',
    },
  ],
  secondaryLinks: [
    {
      id: 'resources',
      label: 'Resources',
      href: '/resources',
      description: 'Guides, templates, and submission criteria',
    },
    {
      id: 'newsletter',
      label: 'Newsletter',
      href: '/newsletter',
      description: 'Quarterly industry insights and release notes',
    },
  ],
  utilityLinks: [
    { id: 'partner-portal', label: 'Partner portal', href: '/partner-portal' },
    {
      id: 'support',
      label: 'Support',
      href: 'mailto:support@guidogerbpublishing.com',
      external: true,
    },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ],
  actions: [
    {
      id: 'consult',
      label: 'Schedule a consult',
      href: '/contact',
      variant: 'primary',
    },
    {
      id: 'catalog',
      label: 'View catalog PDF',
      href: '/files/2025-catalog.pdf',
    },
  ],
  showAuthControls: false,
  showTenantSwitcher: false,
  showThemeToggle: false,
})

export default headerSettings
