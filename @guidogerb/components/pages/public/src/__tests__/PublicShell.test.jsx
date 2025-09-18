import { render, screen } from '@testing-library/react'
import { PublicShell } from '../PublicShell.jsx'

describe('PublicShell', () => {
  it('renders optional header and footer slots', () => {
    render(
      <PublicShell header={<span>Top nav</span>} footer={() => <span>Foot</span>}>
        <p>Body copy</p>
      </PublicShell>,
    )

    expect(screen.getByRole('banner')).toHaveTextContent('Top nav')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Foot')
    expect(screen.getByText('Body copy')).toBeInTheDocument()
  })

  it('allows customizing the root element and classes', () => {
    render(
      <PublicShell as="section" className="custom-shell">
        <p>Shell</p>
      </PublicShell>,
    )

    const root = screen.getByText('Shell').closest('section')
    expect(root).toHaveClass('public-shell')
    expect(root).toHaveClass('custom-shell')
  })

  it('merges main and content props while keeping width styling', () => {
    render(
      <PublicShell
        mainProps={{ 'data-testid': 'main', style: { padding: '2rem' } }}
        contentProps={{ id: 'content', style: { maxWidth: '90rem' } }}
      >
        <p>Content width</p>
      </PublicShell>,
    )

    const main = screen.getByTestId('main')
    expect(main).toHaveStyle({ padding: '2rem' })

    const content = screen.getByText('Content width').closest('div.public-shell__content')
    expect(content).toHaveAttribute('id', 'content')
    expect(content).toHaveStyle({ maxWidth: '90rem', marginInline: 'auto' })
  })
})
