import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import {
  CustomRenderer as CatalogCustomRenderer,
  Default as CatalogDefault,
  ListView as CatalogListView,
  PhysicalFocus as CatalogPhysicalFocus,
} from '../__stories__/Catalog.stories.jsx'

const renderStory = (story) => {
  if (typeof story === 'function') {
    return render(story())
  }

  if (story && typeof story.render === 'function') {
    return render(story.render(story.args ?? {}))
  }

  throw new Error('Unsupported story shape')
}

describe('Catalog stories', () => {
  it('renders the default catalog playground without crashing', async () => {
    renderStory(CatalogDefault)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /digital delivery/i })).toBeInTheDocument()
    })
  })

  it('renders the list view variation', async () => {
    renderStory(CatalogListView)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('data-active', 'true')
    })
  })

  it('renders the physical fulfillment focused view', async () => {
    renderStory(CatalogPhysicalFocus)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /physical shipment/i })).toBeInTheDocument()
    })
  })

  it('renders the custom renderer story with bespoke markup', async () => {
    renderStory(CatalogCustomRenderer)

    await waitFor(() => {
      expect(screen.getAllByTestId('custom-product').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Add to crate').length).toBeGreaterThan(0)
    })
  })
})
