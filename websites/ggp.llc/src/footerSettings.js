export default {
  brand: {
    name: 'GGP Regulatory Platform',
    href: '#top',
  },
  description:
    'Modernization program delivering unified licensing, compliance, and analytics for state agencies.',
  sections: [
    {
      id: 'programs',
      title: 'Programs',
      links: [
        { label: 'Licensing modernization', href: '/licensing' },
        { label: 'Compliance operations', href: '/compliance' },
        { label: 'Oversight analytics', href: '/analytics' },
      ],
    },
    {
      id: 'workspace',
      title: 'Workspace',
      links: [
        { label: 'Portal preview', href: '/portal-preview' },
        { label: 'Portal login', href: '/portal', description: 'Secure access for regulators' },
        { label: 'AI assistance', href: '/ai-support' },
      ],
    },
    {
      id: 'connect',
      title: 'Connect',
      links: [
        { label: 'Contact team', href: '/contact' },
        { label: 'Modernization briefings', href: 'https://calendly.com/ggp-regulation/modernization', external: true },
      ],
    },
  ],
  socialLinks: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/ggp-regulation', external: true },
    { label: 'YouTube', href: 'https://www.youtube.com/@ggp-regulation', external: true },
  ],
  legalLinks: [
    { label: 'Security posture', href: 'https://docs.ggp.llc/security', external: true },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright:
    '© ' +
    new Date().getFullYear() +
    ' GuidoGerb Public Sector Modernization. All rights reserved.',
}
