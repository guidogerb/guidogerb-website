import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { AiSupport } from '../AiSupport.jsx'

// Smoke test: component should render with minimal props without throwing.
// Use persistConversation={false} to avoid touching storage and avoid form submission to prevent network.

describe('AiSupport', () => {
  it('runs without errors (renders and unmounts)', () => {
    const { unmount } = render(<AiSupport endpoint="/api/test" persistConversation={false} />)

    // Basic elements should be present
    expect(screen.getByTestId('ai-support-form')).toBeInTheDocument()
    expect(screen.getByTestId('ai-support-messages')).toBeInTheDocument()

    unmount()
  })
})
