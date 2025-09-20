import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockProtected } = vi.hoisted(() => ({
  mockProtected: vi.fn(),
}))

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: ({ children, ...props }) => {
    mockProtected(props)
    return <div data-testid="protected-shell">{children}</div>
  },
}))

vi.mock('../../welcome-page/index.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="welcome-component">Welcome module</div>,
}))

import {
  DistributionSection,
  HeroSection,
  NewsletterSection,
  PartnerPortalSection,
  PlatformSection,
  ResourcesSection,
} from '../index.js'

describe('marketing sections', () => {
  beforeEach(() => {
    mockProtected.mockClear()
  })

  it('renders the hero content without crashing', () => {
    render(<HeroSection />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /GuidoGerb Publishing brings manuscripts to market/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders platform details for catalog workflows', () => {
    render(<PlatformSection />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Integrated publishing console' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Collaborative editorial workflows' }),
    ).toBeInTheDocument()
  })

  it('renders distribution capabilities overview', () => {
    render(<DistributionSection />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Distribution channels' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Direct-to-audience storefronts' }),
    ).toBeInTheDocument()
  })

  it('renders resource program highlights', () => {
    render(<ResourcesSection />)

    expect(screen.getByRole('heading', { level: 2, name: 'Author onboarding' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Marketing toolkit' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Compliance resources' })).toBeInTheDocument()
  })

  it('renders newsletter subscription form', () => {
    render(<NewsletterSection />)

    expect(screen.getByRole('form', { name: 'Newsletter sign up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
  })

  it('renders the partner portal section with the protected wrapper', () => {
    render(<PartnerPortalSection logoutUri="/logout" />)

    expect(screen.getByRole('heading', { level: 2, name: 'Partner operations portal' })).toBeInTheDocument()
    expect(mockProtected).toHaveBeenCalledWith(expect.objectContaining({ logoutUri: '/logout' }))
    expect(screen.getByTestId('welcome-component')).toBeInTheDocument()
  })
})
