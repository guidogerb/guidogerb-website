import { render, screen, within } from '@testing-library/react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const useAuthMock = vi.hoisted(() =>
  vi.fn(() => ({ isAuthenticated: true, user: { profile: { name: 'Partner Tester', email: 'partner@example.com' } } })),
)

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  Auth: ({ children, ...props }) => (
    <div data-testid="auth-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  useAuth: () => useAuthMock(),
}))

let FermentationHeroSection
let NewsletterSignupSection
let PartnerHubSection

beforeAll(async () => {
  vi.resetModules()
  ;({ FermentationHeroSection } = await import('../FermentationHeroSection.jsx'))
  ;({ NewsletterSignupSection } = await import('../NewsletterSignupSection.jsx'))
  ;({ PartnerHubSection } = await import('../PartnerHubSection.jsx'))
})

afterAll(() => {
  vi.resetModules()
})

describe('PickleCheeze landing sections', () => {
  beforeEach(() => {
    useAuthMock.mockClear()
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      user: { profile: { name: 'Partner Tester', email: 'partner@example.com' } },
    })
  })

  it('renders fermentation hero branding with highlight metrics', () => {
    render(<FermentationHeroSection />)

    const heading = screen.getByRole('heading', {
      level: 1,
      name: /PickleCheeze cultures vegetables and plant-based cheeze/i,
    })

    const hero = heading.closest('section')
    expect(hero).not.toBeNull()
    expect(hero).toHaveClass('hero')
    expect(
      within(hero ?? document.body).getByText(
        /We ferment in small batches using hyper-local produce/i,
      ),
    ).toBeInTheDocument()

    const highlights = within(hero ?? document.body).getAllByRole('definition')
    expect(highlights).toHaveLength(3)
    const metrics = within(hero ?? document.body).getAllByRole('term')
    expect(metrics).toHaveLength(3)
    expect(highlights[0]).toHaveTextContent('Average ferment time')
    expect(metrics[0]).toHaveTextContent('48 hrs')
  })

  it('prevents default navigation when submitting the newsletter form', () => {
    render(<NewsletterSignupSection />)

    const form = screen.getByRole('form', { name: /newsletter sign up/i })
    const email = within(form).getByRole('textbox', { name: /email address/i })
    const submit = within(form).getByRole('button', { name: /notify me/i })

    expect(email).toHaveAttribute('placeholder', 'you@example.com')
    expect(submit).toHaveAttribute('type', 'submit')

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submitEvent)
    expect(submitEvent.defaultPrevented).toBe(true)
  })

  it('wires the partner hub through the protected welcome experience', () => {
    const logoutUri = '/auth/logout'
    render(
      <PartnerHubSection logoutUri={logoutUri} />,
    )

    const sectionHeading = screen.getByRole('heading', { level: 2, name: /partner pantry/i })
    const section = sectionHeading.closest('section')
    expect(section).not.toBeNull()
    expect(section).toHaveClass('protected')
    expect(
      within(section ?? document.body).getByText(
        /Chefs, buyers, and collaborators can review seasonal availability/i,
      ),
    ).toBeInTheDocument()

    const authNode = screen.getByTestId('auth-provider')
    expect(authNode).toBeInTheDocument()
    const authProps = JSON.parse(authNode.getAttribute('data-props') ?? '{}')
    expect(authProps.logoutUri).toBe(logoutUri)
    expect(screen.getByText(/Welcome back, Partner Tester!/i)).toBeInTheDocument()
    expect(screen.getByText('Signed in as partner@example.com')).toBeInTheDocument()
    expect(useAuthMock).toHaveBeenCalled()
  })
})
