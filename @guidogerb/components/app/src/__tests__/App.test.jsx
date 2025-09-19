import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppBasic } from '../App.jsx'

describe('AppBasic', () => {
  it('renders without crashing', () => {
    const { container } = render(<AppBasic />)
    expect(container).toBeTruthy()
    expect(
      screen.getByRole('heading', { name: /todo app component implementation/i }),
    ).toBeInTheDocument()
  })
})
