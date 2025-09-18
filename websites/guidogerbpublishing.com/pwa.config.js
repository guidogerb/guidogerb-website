export const pwaConfig = {
  siteName: 'Guidogerb Publishing',
  shortName: 'GuidogerbPub',
  description: 'Publishing experiments and digital releases from the Guidogerb collective.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'GP',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.guidogerbpublishing.com',
    production: 'https://guidogerbpublishing.com',
    staging: 'https://guidogerbpublishing.com',
  },
}
