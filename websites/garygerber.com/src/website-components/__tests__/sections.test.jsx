import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockProtected } = vi.hoisted(() => ({
  mockProtected: vi.fn(),
}))

vi.mock('@guidogerb/components-pages-protected', () => ({
  __esModule: true,
  default: (props) => {
    mockProtected(props)
    return <div data-testid="protected-mock">{props.children}</div>
  },
}))

import AboutPressSection from '../about-press/index.jsx'
import ConsultingSection from '../consulting-section/index.jsx'
import NewsletterSignupSection from '../newsletter-signup/index.jsx'
import ProgramsHeroSection from '../programs-hero/index.jsx'
import RecordingsEducationSection from '../recordings-education/index.jsx'
import RehearsalRoomSection from '../rehearsal-room/index.jsx'

describe('Gary Gerber marketing sections', () => {
  beforeEach(() => {
    mockProtected.mockClear()
  })

  it('renders the programs hero section without crashing', () => {
    render(<ProgramsHeroSection />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Gary Gerber shapes performances that stay with audiences long after the final encore/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders consulting services content', () => {
    render(<ConsultingSection />)
    expect(screen.getByRole('heading', { level: 2, name: 'Residencies & masterclasses' })).toBeInTheDocument()
  })

  it('renders recordings and studio resources highlights', () => {
    render(<RecordingsEducationSection />)
    expect(screen.getByRole('heading', { level: 2, name: 'Latest recordings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Studio resources' })).toBeInTheDocument()
  })

  it('renders about and press information', () => {
    render(<AboutPressSection />)
    expect(screen.getByRole('heading', { level: 2, name: 'About Gary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Press highlights' })).toBeInTheDocument()
  })

  it('renders the newsletter signup form once', () => {
    render(<NewsletterSignupSection />)
    expect(screen.getByRole('form', { name: /Newsletter sign up/i })).toBeInTheDocument()
  })

  it('renders the rehearsal room guard and forwards logout URI', () => {
    render(
      <RehearsalRoomSection logoutUri="/logout">
        <span>Portal content</span>
      </RehearsalRoomSection>,
    )

    expect(screen.getByRole('heading', { level: 2, name: 'Client rehearsal room' })).toBeInTheDocument()
    expect(mockProtected).toHaveBeenCalledTimes(1)
    expect(mockProtected).toHaveBeenCalledWith(
      expect.objectContaining({
        logoutUri: '/logout',
      }),
    )
  })
})
