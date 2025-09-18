const realLocation = window.location

export const setMockLocation = (url) => {
  const parsed = new URL(url)
  const location = {
    href: parsed.href,
    origin: parsed.origin,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    assign: vi.fn(),
    replace: vi.fn(),
  }

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: location,
  })

  return location
}

export const restoreLocation = () => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: realLocation,
  })
}
