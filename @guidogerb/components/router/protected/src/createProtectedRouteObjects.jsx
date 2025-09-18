import Protected from '@guidogerb/components-pages-protected'
import { createRouteObjects } from '@guidogerb/components-router-public'

export function createProtectedRouteObjects(routes, options = {}) {
  const { fallback, guard = Protected, guardProps, protectFallback = false, wrapElement } = options

  const guardWrapper = (element, route = {}) => {
    let output = element

    if (
      route.guard === false ||
      route.isProtected === false ||
      (route.isFallback && !protectFallback)
    ) {
      output = element
    } else {
      const GuardComponent = route.guard || guard
      const mergedProps = { ...(guardProps ?? {}), ...(route.guardProps ?? {}) }
      output = <GuardComponent {...mergedProps}>{element}</GuardComponent>
    }

    return wrapElement ? wrapElement(output, route) : output
  }

  return createRouteObjects(routes, {
    fallback,
    wrapElement: guardWrapper,
  })
}
