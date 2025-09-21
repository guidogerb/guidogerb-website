import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  StorytellingIllustration,
  ConnectionsIllustration,
  AnalyticsIllustration,
} from '../illustrations.jsx'

describe('public page illustrations', () => {
  it('exposes default accessible copy for the storytelling scene', () => {
    render(<StorytellingIllustration />)

    expect(
      screen.getByRole('img', { name: /performer under stage lights/i }),
    ).toBeInTheDocument()
  })

  it('allows overriding copy and palette on the connections illustration', () => {
    const { container } = render(
      <ConnectionsIllustration
        title="Team collaboration blueprint"
        description="A network of colleagues coordinating a publication."
        palette={{ nodePrimary: '#ff5a5f' }}
      />,
    )

    expect(
      screen.getByRole('img', { name: 'Team collaboration blueprint' }),
    ).toBeInTheDocument()

    const description = container.querySelector('desc')
    expect(description?.textContent).toContain('network of colleagues')

    const primaryNode = container.querySelector('[data-part="node-primary"]')
    expect(primaryNode).toHaveAttribute('fill', '#ff5a5f')
  })

  it('renders analytics artwork with chart primitives ready for theming', () => {
    render(
      <AnalyticsIllustration
        data-testid="analytics-illustration"
        className="custom-illustration"
      />,
    )

    const illustration = screen.getByTestId('analytics-illustration')
    expect(illustration).toHaveClass('public-illustration')
    expect(illustration).toHaveClass('public-illustration--analytics')
    expect(illustration).toHaveClass('custom-illustration')
    expect(illustration.querySelectorAll('[data-part="bar"]').length).toBeGreaterThan(1)
    expect(illustration.querySelector('[data-part="pie-primary"]')).not.toBeNull()
  })
})
