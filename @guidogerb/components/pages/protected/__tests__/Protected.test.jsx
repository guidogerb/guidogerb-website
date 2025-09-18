import { render, screen } from '@testing-library/react'

import Protected from '../index.jsx'

const { mockAuthRender, mockUseAuth } = vi.hoisted(() => ({
  mockAuthRender: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('@guidogerb/components-auth', () => ({
  __esModule: true,
  Auth: (props) => {
    mockAuthRender(props)
    return <>{props.children}</>
  },
  useAuth: mockUseAuth,
}))

describe('Protected', () => {
  beforeEach(() => {
    mockAuthRender.mockClear()
    mockUseAuth.mockReset()
  })

  it('renders a loading placeholder until authentication completes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false })

    render(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('Protected Loading...')).toBeInTheDocument()
    expect(screen.queryByText('secret child')).not.toBeInTheDocument()
  })

  it('surfaces authentication errors from the auth context', () => {
    const error = new Error('Boom')
    mockUseAuth.mockReturnValue({ error })

    render(
      <Protected>
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('Sign-in failed: Boom')).toBeInTheDocument()
  })

  it('passes through props to Auth and renders children once authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true })

    render(
      <Protected logoutUri="/bye">
        <div>secret child</div>
      </Protected>,
    )

    expect(screen.getByText('secret child')).toBeInTheDocument()
    expect(mockAuthRender).toHaveBeenCalledWith(
      expect.objectContaining({
        autoSignIn: true,
        logoutUri: '/bye',
      }),
    )
  })
})
