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

describe('App', () => {
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
    render(<NavigationMenu items={buildItems()} activePath="https://tenant.test/catalog" />)

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
    const renderLink = ({ item, linkProps }) => {
      const { href: _unusedHref, ...rest } = linkProps
      return (
        <button type="button" {...rest}>
          {item.label}
        </button>
      )
    }

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

  it('manages roving tabindex for horizontal menus', async () => {
    const user = userEvent.setup()

    render(<NavigationMenu items={buildItems()} label="Main navigation" />)

    const home = screen.getByRole('link', { name: 'Home' })
    const catalog = screen.getByRole('link', { name: /Catalog/ })

    await user.tab()

    expect(home).toHaveFocus()
    expect(home).toHaveAttribute('tabindex', '0')
    expect(catalog).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowRight}')

    expect(catalog).toHaveFocus()
    expect(catalog).toHaveAttribute('tabindex', '0')
    expect(home).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowLeft}')

    expect(home).toHaveFocus()
  })

  it('allows entering and leaving nested menus with arrow keys', async () => {
    const user = userEvent.setup()

    render(<NavigationMenu items={buildItems()} label="Main navigation" />)

    const catalog = screen.getByRole('link', { name: /Catalog/ })
    const music = screen.getByRole('link', { name: 'Music' })
    const books = screen.getByRole('link', { name: 'Books' })

    await user.tab()
    await user.keyboard('{ArrowRight}')
    expect(catalog).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(music).toHaveFocus()
    expect(music).toHaveAttribute('tabindex', '0')

    await user.keyboard('{ArrowDown}')
    expect(books).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(catalog).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(music).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(catalog).toHaveFocus()
  })

  it('supports vertical navigation focus management', async () => {
    const user = userEvent.setup()

    render(
      <NavigationMenu items={buildItems()} orientation="vertical" label="Sidebar navigation" />,
    )

    const home = screen.getByRole('link', { name: 'Home' })
    const catalog = screen.getByRole('link', { name: /Catalog/ })
    const blog = screen.getByRole('link', { name: 'Blog' })

    await user.tab()
    expect(home).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(catalog).toHaveFocus()

    await user.keyboard('{End}')
    expect(blog).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(catalog).toHaveFocus()
  })
})
