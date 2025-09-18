import { render, screen } from '@testing-library/react'
import { ErrorShell } from '../ErrorShell.jsx'

describe('ErrorShell', () => {
  it('renders status, description, and actions within an alert section', () => {
    render(
      <ErrorShell
        statusCode={500}
        title="Unexpected error"
        description="Something went wrong while loading the rehearsal portal."
        actions={[{ label: 'Try again', onClick: () => {} }, { label: 'Contact support', href: 'mailto:help@example.com' }]}
      >
        <p>Reference ID: abc123</p>
      </ErrorShell>,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('500')
    expect(screen.getByRole('heading', { name: 'Unexpected error' })).toBeInTheDocument()
    expect(screen.getByText('Something went wrong while loading the rehearsal portal.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', 'mailto:help@example.com')
    expect(screen.getByText('Reference ID: abc123')).toBeInTheDocument()
  })

  it('omits the status block when not provided', () => {
    render(
      <ErrorShell
        statusCode={null}
        title="Not found"
        description="Missing page"
        actions={[{ label: 'Go home', href: '/' }]}
        actionsLabel="Fallback actions"
      />,
    )

    expect(screen.queryByText('404')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Fallback actions' })).toBeInTheDocument()
  })
})
