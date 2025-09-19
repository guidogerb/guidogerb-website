import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Storage } from '../Storage.jsx'

describe('Storage', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })
})
