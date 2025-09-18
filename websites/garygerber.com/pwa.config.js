export const pwaConfig = {
  siteName: 'Gary Gerber',
  shortName: 'GaryGerber',
  description: 'Stories, releases, and creative work from Gary Gerber.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'GG',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.garygerber.com',
    production: 'https://garygerber.com',
    staging: 'https://garygerber.com',
  },
}
