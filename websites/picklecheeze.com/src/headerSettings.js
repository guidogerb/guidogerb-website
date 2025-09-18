import { createHeaderSettings } from '@guidogerb/header'

export const headerSettings = createHeaderSettings({
  brand: {
    title: 'PickleCheeze',
    tagline: 'Fermented provisions & plant-based cheese lab',
    href: '/',
  },
  announcements: [
    {
      id: 'spring-share',
      message: 'Spring fermentation shares are now open — reserve jars before they sell out.',
      href: '/market',
      tone: 'highlight',
    },
    {
      id: 'workshop-series',
      message: 'Cultured Cheeze Lab workshops return in April with new aging techniques.',
      href: '/events',
      tone: 'info',
    },
  ],
  primaryLinks: [
    {
      id: 'fermentation',
      label: 'Fermentation club',
      href: '/fermentation',
      description: 'Seasonal pickles and brined vegetables on subscription',
    },
    {
      id: 'cheeze-lab',
      label: 'Cheeze lab',
      href: '/cheese-lab',
      description: 'Plant-based wheels, spreads, and rind-aged experiments',
    },
    {
      id: 'events',
      label: 'Events & tastings',
      href: '/events',
      description: 'Pop-up supper clubs and private pairing sessions',
    },
  ],
  secondaryLinks: [
    {
      id: 'market',
      label: 'Marketplace',
      href: '/market',
      description: 'Preorder jars, wheels, and pantry extras',
    },
    {
      id: 'newsletter',
      label: 'Brine dispatch',
      href: '/newsletter',
      description: 'Monthly recipes, releases, and behind-the-brine notes',
    },
  ],
  utilityLinks: [
    { id: 'partners', label: 'Partner portal', href: '/partners' },
    { id: 'contact', label: 'Contact', href: '/contact' },
  ],
  actions: [
    {
      id: 'reserve-share',
      label: 'Reserve a share',
      href: '/market',
      variant: 'primary',
    },
    {
      id: 'book-tasting',
      label: 'Book a tasting',
      href: '/events',
    },
  ],
  showAuthControls: false,
  showTenantSwitcher: false,
  showThemeToggle: false,
})

export default headerSettings
