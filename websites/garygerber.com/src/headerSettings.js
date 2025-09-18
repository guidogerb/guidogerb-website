import { createHeaderSettings } from '@guidogerb/header'

export const headerSettings = createHeaderSettings({
  brand: {
    title: 'Gary Gerber',
    tagline: 'Composer • Pianist • Educator',
    href: '/',
  },
  announcements: [
    {
      id: 'residency',
      message: '2025 residency dates are now booking — inquire below.',
      href: '/contact',
      tone: 'highlight',
    },
    {
      id: 'album',
      message: 'New album “Northern Lights” premieres this spring.',
      href: '/recordings',
      tone: 'info',
    },
  ],
  primaryLinks: [
    {
      id: 'programs',
      label: 'Programs',
      href: '/programs',
      description: 'Concert seasons & special engagements',
    },
    {
      id: 'consulting',
      label: 'Consulting',
      href: '/consulting',
      description: 'Workshops for music schools and arts orgs',
    },
    {
      id: 'about',
      label: 'About',
      href: '/about',
      description: 'Biography, collaborators, and press quotes',
    },
  ],
  secondaryLinks: [
    {
      id: 'recordings',
      label: 'Recordings',
      href: '/recordings',
      description: 'Listen to studio and live releases',
    },
    {
      id: 'education',
      label: 'Education',
      href: '/education',
      description: 'Studio resources & curriculum guides',
    },
  ],
  utilityLinks: [
    { id: 'press-kit', label: 'Press kit', href: '/press' },
    { id: 'newsletter', label: 'Newsletter', href: '/newsletter' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ],
  actions: [
    {
      id: 'book',
      label: 'Book a performance',
      href: '/contact',
      variant: 'primary',
    },
    {
      id: 'listen',
      label: 'Listen now',
      href: 'https://open.spotify.com/playlist/37i9dQZF1DWUAeTOoyNaiz',
      external: true,
    },
  ],
  showAuthControls: false,
  showTenantSwitcher: false,
  showThemeToggle: false,
})

export default headerSettings
