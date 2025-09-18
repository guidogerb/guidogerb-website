import { useMemo } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { createRouteObjects } from './createRouteObjects.jsx'

export function PublicRouter({
  routes = [],
  fallback,
  basename,
  router = createBrowserRouter,
  routerOptions,
  wrapElement,
}) {
  const routeObjects = useMemo(
    () => createRouteObjects(routes, { fallback, wrapElement }),
    [routes, fallback, wrapElement],
  )

  const routerInstance = useMemo(() => {
    const options = { ...(routerOptions ?? {}) }
    if (basename && options.basename === undefined) {
      options.basename = basename
    }
    return router(routeObjects, options)
  }, [router, routeObjects, routerOptions, basename])

  return <RouterProvider router={routerInstance} />
}
