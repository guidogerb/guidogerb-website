export default {
  brand: {
    name: 'PickleCheeze',
    href: '#top',
  },
  description:
    'Small-batch fermentation studio crafting vegetable brines, cultured cheeze, and seasonal pantry staples.',
  sections: [
    {
      id: 'offerings',
      title: 'Offerings',
      links: [
        { label: 'Fermentation club', href: '/fermentation' },
        { label: 'Cheeze lab', href: '/cheese-lab' },
        { label: 'Marketplace', href: '/market' },
      ],
    },
    {
      id: 'community',
      title: 'Community',
      links: [
        { label: 'Events & tastings', href: '/events' },
        { label: 'Brine dispatch', href: '/newsletter' },
        {
          label: 'Partner portal',
          href: '/partners',
          description: 'Protected resources for chefs and grocers',
        },
      ],
    },
  ],
  socialLinks: [
    { label: 'Instagram', href: 'https://instagram.com/picklecheeze', external: true },
    { label: 'TikTok', href: 'https://tiktok.com/@picklecheeze', external: true },
  ],
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: '© ' + new Date().getFullYear() + ' PickleCheeze Fermentation Cooperative. All rights reserved.',
}
