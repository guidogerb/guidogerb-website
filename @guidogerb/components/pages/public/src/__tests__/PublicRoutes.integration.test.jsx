import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ErrorShell } from '../ErrorShell.jsx'
import { MarketingShell } from '../MarketingShell.jsx'

function MarketingLanding() {
  return (
    <MarketingShell
      header={<span>Stream4Cloud</span>}
      footer={<span>© Stream4Cloud</span>}
      eyebrow="Live control rooms"
      title="Broadcast orchestration without the waitlist"
      description="Coordinate creative, ad operations, and compliance teams from a single dashboard."
      media={<img alt="Live broadcast operators" src="/assets/stream4cloud.jpg" />}
      aside={
        <ul>
          <li>Global PoPs with managed SLAs</li>
          <li>Hybrid events ready out of the box</li>
        </ul>
      }
      actions={[
        { label: 'Book a control room tour', href: 'https://stream4cloud.com/demo' },
        { label: 'Contact partner success', href: 'mailto:success@stream4cloud.com' },
      ]}
      actionsLabel="Key partner actions"
    >
      <p>
        Stream4Cloud accelerates rehearsals, monetisation, and broadcast analytics so your team can
        focus on the live experience.
      </p>
    </MarketingShell>
  )
}

function NotFound() {
  return (
    <ErrorShell
      statusCode={404}
      title="Page not found"
      description="The requested marketing page is unavailable."
      actions={[{ label: 'Return to homepage', href: '/' }]}
      actionsLabel="Recovery links"
    >
      <p>Please double-check the URL or reach out to partner success for assistance.</p>
    </ErrorShell>
  )
}

describe('Public marketing routes', () => {
  it('renders marketing content without requiring protected providers', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<MarketingLanding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Broadcast orchestration without the waitlist',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('banner')).toHaveTextContent('Stream4Cloud')
    expect(screen.getByRole('link', { name: 'Book a control room tour' })).toHaveAttribute(
      'href',
      'https://stream4cloud.com/demo',
    )
    expect(screen.getByRole('contentinfo')).toHaveTextContent('© Stream4Cloud')
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('surfaces a not-found marketing route fallback when paths are missing', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <MemoryRouter initialEntries={['/unavailable']}>
        <Routes>
          <Route path="/" element={<MarketingLanding />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Page not found')
    expect(screen.getByText(/marketing page is unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to homepage' })).toHaveAttribute('href', '/')
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
