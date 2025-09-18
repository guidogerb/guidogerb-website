import { useCallback } from 'react'
import Protected from '@guidogerb/components-pages-protected'
import { PublicRouter } from '@guidogerb/components-router-public'

export function ProtectedRouter({
  routes = [],
  fallback,
  guard = Protected,
  guardProps,
  protectFallback = false,
  wrapElement,
  ...rest
}) {
  const guardWrapper = useCallback(
    (element, route = {}) => {
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
    },
    [guard, guardProps, protectFallback, wrapElement],
  )

  return (
    <PublicRouter
      {...rest}
      routes={routes}
      fallback={fallback}
      wrapElement={guardWrapper}
    />
  )
}
