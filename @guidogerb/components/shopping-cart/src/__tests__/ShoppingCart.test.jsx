import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ShoppingCart } from '../ShoppingCart.jsx'
import { CartProvider } from '../context/CartContext.jsx'

// Smoke test: render/unmount without side effects or external providers

describe('ShoppingCart', () => {
  it('runs without errors (renders and unmounts)', () => {
    const { unmount } = render(
      <CartProvider>
        <ShoppingCart />
      </CartProvider>,
    )

    // Basic UI should be present
    expect(screen.getByText('Cart')).toBeInTheDocument()
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()

    unmount()
  })
})
