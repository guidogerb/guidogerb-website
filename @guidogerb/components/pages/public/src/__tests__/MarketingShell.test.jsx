import { render, screen } from '@testing-library/react'
import { MarketingShell } from '../MarketingShell.jsx'

describe('MarketingShell', () => {
  it('renders hero content, media, and aside slots', () => {
    render(
      <MarketingShell
        header={<div>Header</div>}
        footer={<div>Footer</div>}
        eyebrow="For presenters"
        title="Story-driven performances"
        description="Immersive residencies and concerts."
        media={<img alt="Gary at the piano" src="/piano.jpg" />}
        aside={<p>Availability updated monthly.</p>}
        actions={[{ label: 'Book a consultation', href: '/contact' }, { label: 'Download program', href: '/program.pdf', download: true }]}
      >
        <ul>
          <li>Residencies</li>
          <li>Commissioned works</li>
        </ul>
      </MarketingShell>,
    )

    expect(screen.getByRole('banner')).toHaveTextContent('Header')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Footer')
    expect(screen.getByRole('heading', { name: 'Story-driven performances' })).toBeInTheDocument()
    expect(screen.getByText('Immersive residencies and concerts.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Gary at the piano' })).toBeInTheDocument()
    expect(screen.getByText('Availability updated monthly.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Book a consultation' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'Download program' })).toHaveAttribute('download')
    expect(screen.getByText('Residencies')).toBeInTheDocument()
  })

  it('merges hero props and renders provided actions label', () => {
    render(
      <MarketingShell
        eyebrow="Label"
        title="Title"
        description="Description"
        heroProps={{ className: 'custom-hero', id: 'hero' }}
        actions={[{ label: 'Start', href: '/start', external: true }]}
        actionsLabel="Primary CTAs"
      />,
    )

    const hero = screen.getByRole('group', { name: 'Primary CTAs' }).closest('section')
    expect(hero).toHaveAttribute('id', 'hero')
    expect(hero).toHaveClass('marketing-shell__hero')
    expect(hero).toHaveClass('custom-hero')
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('target', '_blank')
  })
})
