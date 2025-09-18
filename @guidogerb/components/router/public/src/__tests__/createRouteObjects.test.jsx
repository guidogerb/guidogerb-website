import { describe, expect, it, vi } from 'vitest'
import { createRouteObjects } from '../createRouteObjects.jsx'
import { Navigate } from 'react-router-dom'

describe('createRouteObjects', () => {
  it('normalizes nested route definitions', () => {
    const routes = createRouteObjects([
      {
        path: '/',
        element: <div>Home</div>,
        children: [
          {
            index: true,
            element: <div>Index</div>,
          },
          {
            path: 'about',
            redirectTo: '/company',
          },
        ],
      },
    ])

    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/')
    expect(routes[0].children).toHaveLength(2)
    expect(routes[0].children[0]).toMatchObject({ index: true })
    expect(routes[0].children[1].element.type).toBe(Navigate)
  })

  it('invokes wrapElement for each route including fallback', () => {
    const wrapElement = vi.fn((element) => element)
    const routes = createRouteObjects(
      [
        {
          path: '/',
          element: <div>Home</div>,
        },
      ],
      { fallback: <div>Not found</div>, wrapElement },
    )

    expect(routes).toHaveLength(2)
    expect(wrapElement).toHaveBeenCalledTimes(2)
    const fallbackCall = wrapElement.mock.calls[1]
    expect(fallbackCall[1]).toMatchObject({ isFallback: true })
  })

  it('throws when fallback definition is missing an element', () => {
    expect(() => createRouteObjects([], { fallback: { path: '*', loader: () => null } })).toThrow(
      /Fallback routes must include an element/,
    )
  })
})
