import { isValidElement } from 'react'
import { Navigate } from 'react-router-dom'

function toRouteObject(route, wrapElement) {
  if (!route) return null

  const { children, element, redirectTo, replace, state, isFallback = false, ...rest } = route

  const definitionForCallback = {
    ...rest,
    element,
    redirectTo,
    replace,
    state,
    isFallback,
  }

  let finalElement = element

  if (redirectTo !== undefined && redirectTo !== null) {
    finalElement = <Navigate to={redirectTo} replace={replace !== false} state={state} />
  }

  if (wrapElement && finalElement !== undefined) {
    finalElement = wrapElement(finalElement, definitionForCallback)
  }

  const routeObject = {}

  if (rest.path !== undefined) routeObject.path = rest.path
  if (rest.index !== undefined) routeObject.index = rest.index
  if (rest.caseSensitive !== undefined) routeObject.caseSensitive = rest.caseSensitive
  if (rest.id !== undefined) routeObject.id = rest.id
  if (rest.loader) routeObject.loader = rest.loader
  if (rest.action) routeObject.action = rest.action
  if (rest.errorElement) routeObject.errorElement = rest.errorElement
  if (rest.handle) routeObject.handle = rest.handle
  if (rest.shouldRevalidate !== undefined) routeObject.shouldRevalidate = rest.shouldRevalidate
  if (rest.lazy) routeObject.lazy = rest.lazy
  if (rest.hasErrorBoundary !== undefined) routeObject.hasErrorBoundary = rest.hasErrorBoundary

  if (finalElement !== undefined) {
    routeObject.element = finalElement
  }

  if (Array.isArray(children) && children.length > 0) {
    const childObjects = children.map((child) => toRouteObject(child, wrapElement)).filter(Boolean)

    if (childObjects.length > 0) {
      routeObject.children = childObjects
    }
  }

  return routeObject
}

export function createRouteObjects(routes, { fallback, wrapElement } = {}) {
  const initialRoutes = Array.isArray(routes) ? routes.filter(Boolean) : []
  const normalizedRoutes = initialRoutes
    .map((route) => toRouteObject(route, wrapElement))
    .filter(Boolean)

  const hasCatchAll = normalizedRoutes.some((route) => route.path === '*' || route.path === '/*')

  if (fallback && !hasCatchAll) {
    const fallbackDefinition =
      typeof fallback === 'object' &&
      fallback !== null &&
      !Array.isArray(fallback) &&
      !isValidElement(fallback)
        ? { path: fallback.path ?? '*', ...fallback, isFallback: true }
        : { path: '*', element: fallback, isFallback: true }

    if (fallbackDefinition.element === undefined && !fallbackDefinition.lazy) {
      throw new Error('Fallback routes must include an element or lazy loader.')
    }

    const fallbackRoute = toRouteObject(fallbackDefinition, wrapElement)
    if (fallbackRoute) {
      normalizedRoutes.push(fallbackRoute)
    }
  }

  return normalizedRoutes
}
