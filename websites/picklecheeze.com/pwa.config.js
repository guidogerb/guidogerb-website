export const pwaConfig = {
  siteName: 'Pickle Cheeze',
  shortName: 'PickleCheeze',
  description: 'Artisan jams, funky pickles, and digital goodies from Pickle Cheeze.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'PC',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.picklecheeze.com',
    production: 'https://picklecheeze.com',
    staging: 'https://picklecheeze.com',
  },
}
