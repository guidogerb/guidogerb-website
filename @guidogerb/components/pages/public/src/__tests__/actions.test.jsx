import { render } from '@testing-library/react'
import { renderAction, renderActions } from '../actions.jsx'
import { createElement } from 'react'

describe('actions helpers', () => {
  it('renders link and button actions with sensible defaults', () => {
    const button = renderAction({ label: 'Retry', onClick: () => {} }, 0, { scope: 'shell' })
    const link = renderAction({ label: 'Docs', href: 'https://example.com/docs' }, 1, { scope: 'shell' })

    const { getByRole } = render(
      <div>
        {button}
        {link}
      </div>,
    )

    expect(getByRole('button', { name: 'Retry' })).toHaveClass('page-action--primary')
    const docsLink = getByRole('link', { name: 'Docs' })
    expect(docsLink).toHaveAttribute('href', 'https://example.com/docs')
    expect(docsLink).toHaveAttribute('target', '_blank')
  })

  it('clones React elements and applies scope classes', () => {
    const custom = createElement('button', { className: 'cta' }, 'Call to action')
    const rendered = renderAction(custom, 0, { scope: 'marketing-shell' })

    const { getByRole } = render(rendered)
    expect(getByRole('button', { name: 'Call to action' })).toHaveClass('cta')
    expect(getByRole('button', { name: 'Call to action' })).toHaveClass('marketing-shell__action')
  })

  it('filters out empty entries when rendering an action list', () => {
    const actions = renderActions([null, undefined, { label: 'Contact', href: '/contact' }], {
      scope: 'shell',
      defaultVariant: 'secondary',
    })

    const { getByRole } = render(<div>{actions}</div>)
    const contactLink = getByRole('link', { name: 'Contact' })
    expect(contactLink).toHaveClass('page-action--secondary')
  })
})
