import { isValidElement } from 'react'
import { Navigate } from 'react-router-dom'

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const DEFAULT_FALLBACK_COPY = Object.freeze({
  title: 'Page not found',
  description:
    'We could not find the requested page. Check the address or use the links below to continue browsing.',
  primaryAction: Object.freeze({ label: 'Go back home', href: '/' }),
})

const DEFAULT_FALLBACK_CLASS = 'gg-public-router__fallback'

const normalizeAction = (action) => {
  if (!isPlainObject(action)) return null
  const label = typeof action.label === 'string' ? action.label.trim() : ''
  const href = typeof action.href === 'string' ? action.href.trim() : ''
  if (!label || !href) return null

  const normalized = { label, href }

  if (typeof action.target === 'string' && action.target.trim().length > 0) {
    normalized.target = action.target
  }

  if (typeof action.rel === 'string' && action.rel.trim().length > 0) {
    normalized.rel = action.rel
  }

  if (typeof action['aria-label'] === 'string' && action['aria-label'].trim().length > 0) {
    normalized['aria-label'] = action['aria-label']
  }

  if (typeof action.className === 'string' && action.className.trim().length > 0) {
    normalized.className = action.className
  }

  return normalized
}

const buildLinkProps = (action, variant) => {
  const { label, href, className, ...rest } = action
  const classNames = [
    'gg-public-router__fallback-link',
    `gg-public-router__fallback-link--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    label,
    props: {
      href,
      className: classNames || undefined,
      ...rest,
    },
  }
}

const buildGeneratedFallbackDefinition = (config) => {
  if (config === false) {
    return null
  }

  if (isPlainObject(config) && (config.element !== undefined || config.lazy !== undefined)) {
    return {
      path: config.path ?? '*',
      ...config,
      isFallback: true,
    }
  }

  const options = isPlainObject(config) ? config : {}

  const resolvedPrimary =
    normalizeAction(options.primaryAction) ??
    normalizeAction({ label: options.homeLabel, href: options.homeHref }) ??
    DEFAULT_FALLBACK_COPY.primaryAction

  const resolvedSecondary =
    normalizeAction(options.secondaryAction) ??
    normalizeAction({ label: options.supportLabel, href: options.supportHref }) ??
    null

  const title =
    typeof options.title === 'string' && options.title.trim().length > 0
      ? options.title.trim()
      : DEFAULT_FALLBACK_COPY.title

  const description =
    typeof options.description === 'string' && options.description.trim().length > 0
      ? options.description.trim()
      : DEFAULT_FALLBACK_COPY.description

  const lang =
    typeof options.lang === 'string' && options.lang.trim().length > 0
      ? options.lang.trim()
      : undefined

  const containerClass = [DEFAULT_FALLBACK_CLASS, options.className].filter(Boolean).join(' ')

  return {
    path: '*',
    element: (
      <DefaultFallback
        title={title}
        description={description}
        primaryAction={resolvedPrimary}
        secondaryAction={resolvedSecondary}
        lang={lang}
        className={containerClass || undefined}
      />
    ),
    isFallback: true,
  }
}

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

export function createRouteObjects(routes, { fallback, wrapElement, defaultFallback } = {}) {
  const initialRoutes = Array.isArray(routes) ? routes.filter(Boolean) : []
  const normalizedRoutes = initialRoutes
    .map((route) => toRouteObject(route, wrapElement))
    .filter(Boolean)

  const hasCatchAll = normalizedRoutes.some((route) => route.path === '*' || route.path === '/*')

  let fallbackDefinition = null

  if (fallback && !hasCatchAll) {
    fallbackDefinition =
      typeof fallback === 'object' &&
      fallback !== null &&
      !Array.isArray(fallback) &&
      !isValidElement(fallback)
        ? { path: fallback.path ?? '*', ...fallback, isFallback: true }
        : { path: '*', element: fallback, isFallback: true }
  } else if (!fallback && !hasCatchAll) {
    fallbackDefinition = buildGeneratedFallbackDefinition(defaultFallback)
  }

  if (fallbackDefinition) {
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

function DefaultFallback({ title, description, primaryAction, secondaryAction, lang, className }) {
  const primary = buildLinkProps(primaryAction, 'primary')
  const secondary = secondaryAction ? buildLinkProps(secondaryAction, 'secondary') : null

  return (
    <section
      role="alert"
      aria-live="polite"
      className={className || DEFAULT_FALLBACK_CLASS}
      data-router-fallback="default"
      lang={lang}
    >
      <div className="gg-public-router__fallback-inner">
        <h1 className="gg-public-router__fallback-title">{title}</h1>
        <p className="gg-public-router__fallback-description">{description}</p>
        <nav aria-label="Suggested destinations" className="gg-public-router__fallback-actions">
          <a {...primary.props}>{primary.label}</a>
          {secondary ? <a {...secondary.props}>{secondary.label}</a> : null}
        </nav>
      </div>
    </section>
  )
}

DefaultFallback.displayName = 'DefaultPublicRouterFallback'
