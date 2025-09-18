import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header.jsx'
import { HeaderContextProvider } from '../HeaderContextProvider.jsx'
import { createHeaderSettings, resetHeaderSettings } from '../settings.js'

function renderHeader(overrides, props = {}) {
  const settings = createHeaderSettings(overrides ?? {})

  return render(
    <HeaderContextProvider defaultSettings={settings}>
      <Header {...props} />
    </HeaderContextProvider>,
  )
}

describe('Header', () => {
  beforeEach(() => {
    resetHeaderSettings()
  })

  it('renders the brand, announcements, navigation, and actions', () => {
    renderHeader({
      brand: {
        title: 'PickleCheeze',
        tagline: 'Fermented delights delivered',
        href: '/home',
        logoSrc: '/logo.svg',
      },
      announcements: [
        { id: 'beta', message: 'Beta launch underway', tone: 'success', href: '/updates' },
      ],
      primaryLinks: [
        { label: 'Stories', href: '/stories' },
        { label: 'Events', href: '/events' },
      ],
      secondaryLinks: [
        { label: 'Docs', href: '/docs' },
      ],
      utilityLinks: [
        { label: 'Support', href: '/support' },
      ],
      actions: [
        { label: 'Contact', href: '/contact', variant: 'secondary' },
        { label: 'Subscribe', href: '/subscribe', variant: 'primary', external: true },
      ],
    })

    const brandLink = screen.getByRole('link', { name: /Fermented delights delivered/ })
    expect(brandLink).toHaveAttribute('href', '/home')
    expect(within(brandLink).getByText('PickleCheeze')).toBeInTheDocument()
    const logo = brandLink.querySelector('img')
    expect(logo).toBeTruthy()
    expect(logo).toHaveAttribute('src', '/logo.svg')
    expect(logo).toHaveAttribute('alt', '')

    const announcementsRegion = screen.getByLabelText('Announcements')
    const announcementItems = within(announcementsRegion).getAllByRole('listitem')
    expect(announcementItems).toHaveLength(1)
    expect(
      within(announcementItems[0]).getByRole('link', { name: 'Beta launch underway' }),
    ).toHaveAttribute('href', '/updates')

    const primaryNav = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(primaryNav).getAllByRole('link')).toHaveLength(2)

    const utilityNav = screen.getByRole('navigation', { name: 'Utility navigation' })
    expect(within(utilityNav).getByRole('link', { name: 'Support' })).toHaveAttribute('href', '/support')

    const secondaryNav = screen.getByRole('navigation', { name: 'Secondary navigation' })
    expect(within(secondaryNav).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')

    const subscribeLink = screen.getByRole('link', { name: 'Subscribe' })
    expect(subscribeLink).toHaveAttribute('data-variant', 'primary')
    expect(subscribeLink).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('data-variant', 'secondary')
  })

  it('omits optional sections when data collections are empty', () => {
    const { container } = renderHeader({
      announcements: [],
      primaryLinks: [],
      secondaryLinks: [],
      utilityLinks: [],
      actions: [],
    })

    expect(screen.queryByLabelText('Announcements')).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Secondary navigation' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Utility navigation' })).toBeNull()
    expect(container.querySelector('.gg-header__actions')).toBeNull()
  })

  it('invokes custom control renderers when toggles are enabled', () => {
    const renderAuthControls = vi.fn(() => <div data-testid="auth-controls">auth</div>)
    const renderTenantSwitcher = vi.fn(() => <button data-testid="tenant-switcher">Switch</button>)
    const renderThemeToggle = vi.fn(() => <button data-testid="theme-toggle">Theme</button>)

    renderHeader(
      {
        showAuthControls: true,
        showTenantSwitcher: true,
        showThemeToggle: true,
      },
      {
        renderAuthControls,
        renderTenantSwitcher,
        renderThemeToggle,
      },
    )

    expect(renderAuthControls).toHaveBeenCalledWith({ settings: expect.objectContaining({ showAuthControls: true }) })
    expect(renderTenantSwitcher).toHaveBeenCalledWith({ settings: expect.objectContaining({ showTenantSwitcher: true }) })
    expect(renderThemeToggle).toHaveBeenCalledWith({ settings: expect.objectContaining({ showThemeToggle: true }) })

    expect(screen.getByTestId('auth-controls')).toBeInTheDocument()
    expect(screen.getByTestId('tenant-switcher')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('does not invoke control renderers when toggles are disabled', () => {
    const renderAuthControls = vi.fn(() => <div />)
    const renderTenantSwitcher = vi.fn(() => <div />)
    const renderThemeToggle = vi.fn(() => <div />)

    renderHeader(
      {
        showAuthControls: false,
        showTenantSwitcher: false,
        showThemeToggle: false,
      },
      {
        renderAuthControls,
        renderTenantSwitcher,
        renderThemeToggle,
      },
    )

    expect(renderAuthControls).not.toHaveBeenCalled()
    expect(renderTenantSwitcher).not.toHaveBeenCalled()
    expect(renderThemeToggle).not.toHaveBeenCalled()
  })

  it('forwards navigation clicks through the onNavigate handler', async () => {
    const onNavigate = vi.fn()

    renderHeader(
      {
        primaryLinks: [
          { label: 'Stories', href: '/stories' },
        ],
      },
      { onNavigate },
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: 'Stories' }))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].item).toMatchObject({ label: 'Stories', href: '/stories' })
  })

  it('marks active navigation links based on the activePath prop', () => {
    renderHeader(
      {
        primaryLinks: [
          { label: 'Stories', href: '/stories' },
        ],
      },
      { activePath: '/stories' },
    )

    expect(screen.getByRole('link', { name: 'Stories' })).toHaveAttribute('aria-current', 'page')
  })
})
