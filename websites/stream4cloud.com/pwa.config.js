export const pwaConfig = {
  siteName: 'Stream4Cloud',
  shortName: 'Stream4Cloud',
  description: 'Streaming distribution tools and releases powered by Stream4Cloud.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'S4',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.stream4cloud.com',
    production: 'https://stream4cloud.com',
    staging: 'https://stream4cloud.com',
  },
}
