import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NavigationMenu } from '../NavigationMenu.jsx'

const buildItems = () => [
  {
    id: 'home',
    label: 'Home',
    href: '/',
  },
  {
    id: 'catalog',
    label: 'Catalog',
    href: '/catalog',
    description: 'Browse all products',
    children: [
      { label: 'Music', href: '/catalog/music' },
      { label: 'Books', href: '/catalog/books' },
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    href: 'https://blog.example.com',
    external: true,
  },
]

describe('NavigationMenu', () => {
  it('renders a navigation landmark with list semantics', () => {
    render(<NavigationMenu items={buildItems()} label="Tenant navigation" />)

    const nav = screen.getByRole('navigation', { name: 'Tenant navigation' })
    expect(nav).toBeInTheDocument()
    expect(nav).toHaveAttribute('data-orientation', 'horizontal')

    const lists = screen.getAllByRole('list')
    expect(lists).toHaveLength(2)
    expect(lists[0]).toHaveAttribute('data-orientation', 'horizontal')

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Catalog/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Music' })).toBeInTheDocument()
  })

  it('marks the active item and supports external links', () => {
    render(
      <NavigationMenu
        items={buildItems()}
        activePath="https://tenant.test/catalog"
      />,
    )

    const activeLink = screen.getByRole('link', { name: /Catalog/ })
    expect(activeLink).toHaveAttribute('aria-current', 'page')

    const external = screen.getByRole('link', { name: 'Blog' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('invokes onNavigate when a link is activated', async () => {
    const handleNavigate = vi.fn()
    const user = userEvent.setup()

    render(<NavigationMenu items={buildItems()} onNavigate={handleNavigate} />)

    await user.click(screen.getByRole('link', { name: 'Books' }))

    expect(handleNavigate).toHaveBeenCalledTimes(1)
    const payload = handleNavigate.mock.calls[0][0]
    expect(payload.item).toMatchObject({ label: 'Books', href: '/catalog/books' })
    expect(payload.event?.type).toBe('click')
  })

  it('supports custom link renderers', () => {
    const renderLink = ({ item, linkProps }) => (
      <button type="button" onClick={linkProps.onClick}>
        {item.label}
      </button>
    )

    render(
      <NavigationMenu
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings', href: '/settings' },
        ]}
        renderLink={renderLink}
        orientation="vertical"
        label="Account"
      />,
    )

    const nav = screen.getByRole('navigation', { name: 'Account' })
    expect(nav).toHaveClass('gg-navigation-menu--vertical')

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})
