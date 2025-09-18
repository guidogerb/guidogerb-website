export const pwaConfig = {
  siteName: 'This Is My Story',
  shortName: 'ThisIsMyStory',
  description: 'Narratives, memoir projects, and audio stories from This Is My Story.',
  themeColor: '#0b0d12',
  backgroundColor: '#0b0d12',
  accentColor: '#6ea8fe',
  offlineHeadline: "You're offline",
  offlineMessage:
    "Some pages may be unavailable without a connection. Please try again when you're back online.",
  iconText: 'TS',
  routes: ['/', '/auth/callback'],
  baseUrls: {
    development: 'https://local.this-is-my-story.org',
    production: 'https://this-is-my-story.org',
    staging: 'https://this-is-my-story.org',
  },
}
