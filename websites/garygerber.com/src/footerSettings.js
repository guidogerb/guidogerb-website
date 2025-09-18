export default {
  brand: {
    name: 'Gary Gerber',
    href: '#top',
  },
  description:
    'Composer, pianist, and educator shaping immersive concert residencies, recordings, and storytelling workshops.',
  sections: [
    {
      id: 'programs',
      title: 'Programs',
      links: [
        { label: 'Residencies', href: '/programs' },
        { label: 'Recordings', href: '/recordings' },
        { label: 'Education', href: '/education' },
      ],
    },
    {
      id: 'studio',
      title: 'Studio resources',
      links: [
        { label: 'Rehearsal room', href: '/rehearsal', description: 'Protected collaborator portal' },
        { label: 'Newsletter', href: '/newsletter' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  ],
  socialLinks: [
    { label: 'Instagram', href: 'https://instagram.com/garygerbermusic', external: true },
    { label: 'YouTube', href: 'https://youtube.com/@garygerber', external: true },
  ],
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: '© ' + new Date().getFullYear() + ' Gary Gerber Studios. All rights reserved.',
}
