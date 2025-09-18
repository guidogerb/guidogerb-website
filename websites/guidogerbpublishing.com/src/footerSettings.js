export default {
  brand: {
    name: 'GuidoGerb Publishing',
    href: '#top',
  },
  description:
    'Full-service publishing operations for composers, ensembles, and arts organizations expanding their catalogs.',
  sections: [
    {
      id: 'solutions',
      title: 'Solutions',
      links: [
        { label: 'Editorial', href: '/platform' },
        { label: 'Distribution', href: '/distribution' },
        { label: 'Marketing', href: '/resources' },
      ],
    },
    {
      id: 'partners',
      title: 'Partners',
      links: [
        { label: 'Submission portal', href: '/resources', description: 'Guide for new authors' },
        { label: 'Partner portal', href: '/partner-portal' },
        { label: 'Newsletter', href: '/newsletter' },
      ],
    },
  ],
  socialLinks: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/guidogerb', external: true },
    { label: 'Substack', href: 'https://guidogerb.substack.com', external: true },
  ],
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: '© ' + new Date().getFullYear() + ' GuidoGerb Publishing, LLC. All rights reserved.',
}
