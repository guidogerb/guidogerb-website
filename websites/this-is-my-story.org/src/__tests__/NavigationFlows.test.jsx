import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUseAuth, navigateSpy } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  navigateSpy: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('../App.css', () => ({}), { virtual: true })
vi.mock('../assets/story-circle.svg', () => ({ default: 'story-circle.svg' }))

async function renderApp(initialPath = '/') {
  window.history.replaceState({}, '', initialPath)

  const module = await import('../App.jsx')
  const App = module.default
  return render(<App />)
}

describe('This-Is-My-Story navigation flows', () => {
  beforeEach(() => {
    vi.resetModules()
    mockUseAuth.mockReset()
    mockUseAuth.mockReturnValue({ isAuthenticated: false })
    navigateSpy.mockReset()
  })

  it('prevents default navigation and redirects home from the not-found route', async () => {
    await renderApp('/missing')

    const primaryAction = await screen.findByRole('link', {
      name: 'Return to storyteller hub',
    })

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(primaryAction, clickEvent)

    expect(navigateSpy).toHaveBeenCalledWith('/')
    expect(clickEvent.defaultPrevented).toBe(true)
  })

  it('redirects visitors back to the landing page from maintenance notices', async () => {
    await renderApp('/maintenance')

    const maintenanceAction = await screen.findByRole('link', {
      name: 'Return to storyteller hub',
    })

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
    fireEvent(maintenanceAction, clickEvent)

    expect(navigateSpy).toHaveBeenCalledWith('/')
    expect(clickEvent.defaultPrevented).toBe(true)
  })

  it('exposes hero navigation anchors that link to in-page sections', async () => {
    await renderApp('/')

    const explorePrograms = await screen.findByRole('link', { name: 'Explore our programs' })
    const joinStudio = await screen.findByRole('link', { name: 'Join the storyteller studio' })

    expect(explorePrograms).toHaveAttribute('href', '#programs')
    expect(joinStudio).toHaveAttribute('href', '#studio')
  })
})
