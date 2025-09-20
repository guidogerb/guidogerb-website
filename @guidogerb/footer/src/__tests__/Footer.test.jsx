import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Footer } from '../Footer.jsx'

const createBaselineFooterProps = () => ({
  brand: { name: 'GuidoGerb Studios', href: 'https://guidogerb.com' },
  description: 'Story-driven performances and publishing partners.',
  sections: [
    {
      id: 'programs',
      title: 'Programs',
      description: 'Seasonal offerings and residencies',
      links: [
        { label: 'Concerts', href: '/concerts', description: 'Seasonal residencies' },
        { label: 'Workshops', href: '/workshops', badge: 'New', badgeTone: 'success' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'Email', href: 'mailto:hello@guidogerb.com' },
        { label: 'Visit Us', href: '/visit', description: 'Schedule a studio tour' },
      ],
    },
  ],
  socialLinks: [
    { label: 'Instagram', href: 'https://instagram.com/guidogerb', external: true },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/guidogerb', external: true },
  ],
  legalLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
  copyright: '© 2025 Guido & Gerber, LLC',
  children: <div data-testid="footer-extra">Beta Program</div>,
})

const renderFooter = (props = {}) => render(<Footer {...props} />)

describe('Footer', () => {
  it('renders brand, sections, social links, and legal metadata', () => {
    renderFooter(createBaselineFooterProps())

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
    expect(screen.getByTestId('footer-extra')).toBeInTheDocument()
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

  it('matches snapshot for the baseline marketing layout', () => {
    const { asFragment } = renderFooter(createBaselineFooterProps())

    expect(asFragment()).toMatchInlineSnapshot(`
      <DocumentFragment>
        <footer
          class="gg-footer"
        >
          <div
            class="gg-footer__inner"
          >
            <section
              class="gg-footer__brand"
            >
              <div
                class="gg-footer__brand-heading"
              >
                <a
                  class="gg-footer__brand-link"
                  href="https://guidogerb.com"
                >
                  <span
                    class="gg-footer__brand-name"
                  >
                    GuidoGerb Studios
                  </span>
                </a>
              </div>
              <p
                class="gg-footer__description"
              >
                Story-driven performances and publishing partners.
              </p>
              <ul
                class="gg-footer__social-list"
                role="list"
              >
                <li
                  class="gg-footer__social-item"
                >
                  <a
                    aria-label="Instagram"
                    class="gg-footer__social-link"
                    href="https://instagram.com/guidogerb"
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    <span
                      aria-hidden="true"
                      class="gg-footer__social-icon"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        focusable="false"
                        height="1em"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        width="1em"
                      >
                        <rect
                          height="15.5"
                          rx="4"
                          width="15.5"
                          x="4.25"
                          y="4.25"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="4.25"
                        />
                        <circle
                          cx="16.75"
                          cy="7.25"
                          fill="currentColor"
                          r="1.25"
                          stroke="none"
                        />
                      </svg>
                    </span>
                  </a>
                </li>
                <li
                  class="gg-footer__social-item"
                >
                  <a
                    aria-label="LinkedIn"
                    class="gg-footer__social-link"
                    href="https://linkedin.com/company/guidogerb"
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    <span
                      aria-hidden="true"
                      class="gg-footer__social-icon"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        focusable="false"
                        height="1em"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        width="1em"
                      >
                        <rect
                          height="15"
                          rx="2.5"
                          width="15"
                          x="4.5"
                          y="4.5"
                        />
                        <circle
                          cx="8.5"
                          cy="8.5"
                          fill="currentColor"
                          r="1.2"
                          stroke="none"
                        />
                        <path
                          d="M7.75 11h1.5v7h-1.5z"
                          fill="currentColor"
                          stroke="none"
                        />
                        <path
                          d="M11 11h1.5v1.1c.4-.8 1.2-1.3 2.3-1.3 1.7 0 2.75 1 2.75 3.17V18h-1.5v-3.16c0-.98-.37-1.62-1.3-1.62-.95 0-1.5.68-1.5 1.68V18H11Z"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    </span>
                  </a>
                </li>
              </ul>
            </section>
            <div
              class="gg-footer__sections"
            >
              <section
                class="gg-footer__section"
              >
                <h2
                  class="gg-footer__section-title"
                >
                  Programs
                </h2>
                <p
                  class="gg-footer__section-description"
                >
                  Seasonal offerings and residencies
                </p>
                <ul
                  class="gg-footer__links"
                  role="list"
                >
                  <li
                    class="gg-footer__link-item"
                  >
                    <a
                      class="gg-footer__link"
                      href="/concerts"
                    >
                      <span
                        class="gg-footer__link-label"
                      >
                        <span>
                          Concerts
                        </span>
                      </span>
                      <span
                        class="gg-footer__link-description"
                      >
                        Seasonal residencies
                      </span>
                    </a>
                  </li>
                  <li
                    class="gg-footer__link-item"
                  >
                    <a
                      class="gg-footer__link"
                      href="/workshops"
                    >
                      <span
                        class="gg-footer__link-label"
                      >
                        <span>
                          Workshops
                        </span>
                        <span
                          class="gg-footer__link-badge"
                          data-tone="success"
                        >
                          New
                        </span>
                      </span>
                    </a>
                  </li>
                </ul>
              </section>
              <section
                class="gg-footer__section"
              >
                <h2
                  class="gg-footer__section-title"
                >
                  Contact
                </h2>
                <ul
                  class="gg-footer__links"
                  role="list"
                >
                  <li
                    class="gg-footer__link-item"
                  >
                    <a
                      class="gg-footer__link"
                      href="mailto:hello@guidogerb.com"
                    >
                      <span
                        class="gg-footer__link-label"
                      >
                        <span>
                          Email
                        </span>
                      </span>
                    </a>
                  </li>
                  <li
                    class="gg-footer__link-item"
                  >
                    <a
                      class="gg-footer__link"
                      href="/visit"
                    >
                      <span
                        class="gg-footer__link-label"
                      >
                        <span>
                          Visit Us
                        </span>
                      </span>
                      <span
                        class="gg-footer__link-description"
                      >
                        Schedule a studio tour
                      </span>
                    </a>
                  </li>
                </ul>
              </section>
            </div>
          </div>
          <div
            class="gg-footer__extra"
          >
            <div
              data-testid="footer-extra"
            >
              Beta Program
            </div>
          </div>
          <div
            class="gg-footer__meta"
          >
            <ul
              class="gg-footer__legal-list"
              role="list"
            >
              <li
                class="gg-footer__legal-item"
              >
                <a
                  class="gg-footer__link"
                  href="/privacy"
                >
                  <span
                    class="gg-footer__link-label"
                  >
                    <span
                      aria-hidden="true"
                      class="gg-footer__link-icon"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        focusable="false"
                        height="1em"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        width="1em"
                      >
                        <path
                          d="M12 3.75 6 6v6c0 3.8 2.8 7.45 6 8.25 3.2-.8 6-4.45 6-8.25V6Z"
                        />
                        <path
                          d="m10.25 12.25 1.75 1.75 2.5-3.25"
                        />
                      </svg>
                    </span>
                    <span>
                      Privacy
                    </span>
                  </span>
                </a>
              </li>
              <li
                class="gg-footer__legal-item"
              >
                <a
                  class="gg-footer__link"
                  href="/terms"
                >
                  <span
                    class="gg-footer__link-label"
                  >
                    <span
                      aria-hidden="true"
                      class="gg-footer__link-icon"
                    >
                      <svg
                        aria-hidden="true"
                        fill="none"
                        focusable="false"
                        height="1em"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        viewBox="0 0 24 24"
                        width="1em"
                      >
                        <path
                          d="M8.5 4.75h6.75L18 7.5v11a1.75 1.75 0 0 1-1.75 1.75H8.75A1.75 1.75 0 0 1 7 18.5v-11A1.75 1.75 0 0 1 8.75 4.75Z"
                        />
                        <path
                          d="M15.5 4.75V7.5H18"
                        />
                        <path
                          d="M9.5 11h4.5"
                        />
                        <path
                          d="M9.5 14h4.5"
                        />
                        <path
                          d="M9.5 17h3"
                        />
                      </svg>
                    </span>
                    <span>
                      Terms
                    </span>
                  </span>
                </a>
              </li>
            </ul>
            <p
              class="gg-footer__copyright"
            >
              <small>
                © 2025 Guido & Gerber, LLC
              </small>
            </p>
          </div>
        </footer>
      </DocumentFragment>
    `)
  })
})
