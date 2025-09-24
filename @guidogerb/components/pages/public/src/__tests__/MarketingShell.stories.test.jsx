import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  DefaultHero as MarketingShellDefaultHero,
  MediaSpotlight as MarketingShellMediaSpotlight,
  LongFormNarrative as MarketingShellLongFormNarrative,
} from '../__stories__/MarketingShell.stories.jsx'

const renderStory = (story) => {
  if (typeof story === 'function') {
    return render(story())
  }

  if (story && typeof story.render === 'function') {
    return render(story.render())
  }

  throw new Error('Unsupported story shape')
}

describe('MarketingShell stories', () => {
  it('renders the default hero layout', () => {
    renderStory(MarketingShellDefaultHero)

    expect(
      screen.getByRole('heading', { name: 'Amplify your reach with Stream4Cloud' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start free trial' })).toBeInTheDocument()
  })

  it('renders the media spotlight variant with media and aside content', () => {
    renderStory(MarketingShellMediaSpotlight)

    expect(
      screen.getByRole('img', {
        name: /concert crowd celebrating a headline performance/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Guided presets for stage/)).toBeInTheDocument()
  })

  it('renders the long-form narrative variant with grouped actions', () => {
    renderStory(MarketingShellLongFormNarrative)

    expect(
      screen.getByRole('heading', { name: 'Your catalog, curated for every platform' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Bundle episodic releases/)).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Narrative calls to action' })).toBeInTheDocument()
  })
})
