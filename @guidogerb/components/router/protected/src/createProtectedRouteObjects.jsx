import Protected from '@guidogerb/components-pages-protected'
import { createRouteObjects } from '@guidogerb/components-router-public'
import { applyGuard } from './applyGuard.jsx'

export function createProtectedRouteObjects(routes, options = {}) {
  const {
    fallback,
    defaultFallback,
    guard = Protected,
    guardProps,
    protectFallback = false,
    wrapElement,
  } = options

  const guardWrapper = (element, route = {}) =>
    applyGuard(element, route, {
      guard,
      guardProps,
      protectFallback,
      afterGuard: wrapElement,
    })

  return createRouteObjects(routes, {
    fallback,
    defaultFallback,
    wrapElement: guardWrapper,
  })
}
