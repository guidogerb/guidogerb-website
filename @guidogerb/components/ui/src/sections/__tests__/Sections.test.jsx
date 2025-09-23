import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockProtected } = vi.hoisted(() => ({
  mockProtected: vi.fn(),
}))

vi.mock(
  '@guidogerb/components-pages-protected',
  () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
      mockProtected(props)
      return <div data-testid="protected-shell">{children}</div>
    },
  }),
  { virtual: true },
)

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
    expect(screen.getByLabelText(HeroSection.DEFAULT_HIGHLIGHTS_LABEL)).toBeInTheDocument()
  })

  it('supports overriding hero copy and highlights', () => {
    render(
      <HeroSection
        eyebrow="Custom eyebrow"
        title="Custom hero title"
        lede="Custom hero description"
        highlightsLabel="Custom metrics"
        highlights={[{ label: '99%', description: 'uptime' }]}
      />,
    )

    expect(screen.getByText('Custom eyebrow')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Custom hero title' })).toBeInTheDocument()
    expect(screen.getByText('Custom hero description')).toBeInTheDocument()
    expect(screen.getByRole('definition')).toHaveTextContent('uptime')
    expect(screen.getByLabelText('Custom metrics')).toBeInTheDocument()
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

  it('accepts platform copy overrides', () => {
    render(
      <PlatformSection
        columns={[
          {
            title: 'Workflow automation',
            description: 'Automate rights ingest',
            features: ['Metadata sync'],
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Workflow automation' })).toBeInTheDocument()
    expect(screen.getByText('Automate rights ingest')).toBeInTheDocument()
    expect(screen.getByText('Metadata sync')).toBeInTheDocument()
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

  it('accepts distribution copy overrides', () => {
    render(
      <DistributionSection
        columns={[
          {
            title: 'Sync partners',
            description: 'Pitch to film editors',
            features: ['Clearance workflow'],
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Sync partners' })).toBeInTheDocument()
    expect(screen.getByText('Pitch to film editors')).toBeInTheDocument()
    expect(screen.getByText('Clearance workflow')).toBeInTheDocument()
  })

  it('renders resource program highlights', () => {
    render(<ResourcesSection />)

    expect(screen.getByRole('heading', { level: 2, name: 'Author onboarding' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Marketing toolkit' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Compliance resources' }),
    ).toBeInTheDocument()
  })

  it('accepts resources copy overrides', () => {
    render(
      <ResourcesSection
        columns={[
          {
            title: 'Submission criteria',
            description: 'Detailed spec',
            features: ['PDF templates'],
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Submission criteria' })).toBeInTheDocument()
    expect(screen.getByText('Detailed spec')).toBeInTheDocument()
    expect(screen.getByText('PDF templates')).toBeInTheDocument()
  })

  it('renders newsletter subscription form', () => {
    render(<NewsletterSection />)

    expect(screen.getByRole('form', { name: 'Newsletter sign up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
  })

  it('allows customizing the newsletter form copy and submission handler', async () => {
    const handleSubmit = vi.fn((event) => event.preventDefault())

    render(
      <NewsletterSection
        title="Custom brief"
        description="Custom description"
        formLabel="Custom form"
        buttonLabel="Join"
        placeholder="partner@example.com"
        inputLabel="Partner email"
        onSubmit={handleSubmit}
      />,
    )

    const form = screen.getByRole('form', { name: 'Custom form' })
    expect(screen.getByRole('heading', { level: 2, name: 'Custom brief' })).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('partner@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument()

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('renders the partner portal section with the protected wrapper', () => {
    const StubWelcome = () => <div data-testid="welcome-component">Welcome module</div>

    render(<PartnerPortalSection logoutUri="/logout" WelcomeComponent={StubWelcome} />)

    expect(
      screen.getByRole('heading', { level: 2, name: 'Partner operations portal' }),
    ).toBeInTheDocument()
    expect(mockProtected).toHaveBeenCalledWith(expect.objectContaining({ logoutUri: '/logout' }))
    expect(screen.getByTestId('welcome-component')).toBeInTheDocument()
  })
})
