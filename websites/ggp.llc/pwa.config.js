export const pwaConfig = {
  siteName: 'GGP LLC',
  shortName: 'GGP',
  description: 'GGP LLC storefront and creative technology experiments.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'GGP',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.ggp.llc',
    production: 'https://ggp.llc',
    staging: 'https://ggp.llc',
  },
}
