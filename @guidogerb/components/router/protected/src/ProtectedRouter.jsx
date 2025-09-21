import { useCallback } from 'react'
import Protected from '@guidogerb/components-pages-protected'
import { PublicRouter } from '@guidogerb/components-router-public'
import { applyGuard } from './applyGuard.jsx'

export function ProtectedRouter({
  routes = [],
  fallback,
  defaultFallback,
  guard = Protected,
  guardProps,
  protectFallback = false,
  wrapElement,
  ...rest
}) {
  const guardWrapper = useCallback(
    (element, route = {}) =>
      applyGuard(element, route, {
        guard,
        guardProps,
        protectFallback,
        afterGuard: wrapElement,
      }),
    [guard, guardProps, protectFallback, wrapElement],
  )

  return (
    <PublicRouter
      {...rest}
      routes={routes}
      fallback={fallback}
      defaultFallback={defaultFallback}
      wrapElement={guardWrapper}
    />
  )
}
