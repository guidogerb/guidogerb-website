import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Footer } from '../Footer.jsx'

const renderFooter = (props = {}) => render(<Footer {...props} />)

describe('Footer', () => {
  it('renders brand, sections, social links, and legal metadata', () => {
    renderFooter({
      brand: { name: 'GuidoGerb Studios', href: 'https://guidogerb.com' },
      description: 'Story-driven performances and publishing partners.',
      sections: [
        {
          id: 'programs',
          title: 'Programs',
          links: [
            { label: 'Concerts', href: '/concerts', description: 'Seasonal residencies' },
            { label: 'Workshops', href: '/workshops', badge: 'New', badgeTone: 'success' },
          ],
        },
        {
          title: 'Contact',
          links: [{ label: 'Email', href: 'mailto:hello@guidogerb.com' }],
        },
      ],
      socialLinks: [
        { label: 'Instagram', href: 'https://instagram.com/guidogerb', external: true },
      ],
      legalLinks: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
      copyright: '© 2025 Guido & Gerber, LLC',
    })

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GuidoGerb Studios' })).toHaveAttribute(
      'href',
      'https://guidogerb.com',
    )
    expect(
      screen.getByText('Story-driven performances and publishing partners.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Programs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Concerts/ })).toHaveAttribute('href', '/concerts')
    expect(screen.getByText('Seasonal residencies')).toBeInTheDocument()
    expect(screen.getByText('New')).toHaveAttribute('data-tone', 'success')
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/guidogerb',
    )
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument()
    expect(screen.getByText('© 2025 Guido & Gerber, LLC')).toBeInTheDocument()
  })

  it('marks external links with target and rel attributes', () => {
    renderFooter({
      sections: [
        {
          title: 'Resources',
          links: [
            { label: 'Partner Portal', href: 'https://partners.guidogerb.com', external: true },
          ],
        },
      ],
    })

    const link = screen.getByRole('link', { name: 'Partner Portal' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer noopener')
  })

  it('applies default icons to known social links', () => {
    renderFooter({
      socialLinks: [
        { label: 'LinkedIn', href: 'https://linkedin.com/company/guidogerb', external: true },
        { label: 'Studio Blog', href: 'https://example.com/blog' },
      ],
    })

    const linkedin = screen.getByRole('link', { name: 'LinkedIn' })
    const linkedinIcon = linkedin.querySelector('svg')
    expect(linkedinIcon).not.toBeNull()
    expect(linkedinIcon).toHaveAttribute('aria-hidden', 'true')

    const blogLink = screen.getByRole('link', { name: 'Studio Blog' })
    expect(blogLink.querySelector('svg')).toBeNull()
  })

  it('adds legal callout icons and respects explicit overrides', () => {
    renderFooter({
      legalLinks: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms', icon: <span data-testid="terms-icon">*</span> },
      ],
    })

    const privacy = screen.getByRole('link', { name: 'Privacy' })
    const privacyIcon = privacy.querySelector('svg')
    expect(privacyIcon).not.toBeNull()
    expect(privacyIcon).toHaveAttribute('aria-hidden', 'true')

    const terms = screen.getByRole('link', { name: 'Terms' })
    expect(terms.querySelector('svg')).toBeNull()
    expect(screen.getByTestId('terms-icon')).toBeInTheDocument()
  })

  it('invokes onNavigate when provided', () => {
    const handleNavigate = vi.fn()
    renderFooter({
      sections: [{ title: 'Company', links: [{ label: 'About', href: '/about' }] }],
      onNavigate: handleNavigate,
    })

    const link = screen.getByRole('link', { name: 'About' })
    fireEvent.click(link)

    expect(handleNavigate).toHaveBeenCalledTimes(1)
    expect(handleNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.objectContaining({ label: 'About', href: '/about' }),
        event: expect.any(Object),
      }),
    )
  })

  it('renders nothing when sections and brand details are absent', () => {
    renderFooter()

    const contentInfo = screen.getByRole('contentinfo')
    expect(contentInfo.querySelector('.gg-footer__sections')).toBeNull()
    expect(contentInfo.querySelector('.gg-footer__brand')).toBeNull()
  })
})
