const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isGuardConfig = (value) =>
  isPlainObject(value) &&
  (Object.prototype.hasOwnProperty.call(value, 'component') ||
    Object.prototype.hasOwnProperty.call(value, 'props') ||
    Object.prototype.hasOwnProperty.call(value, 'disabled'))

export function applyGuard(element, route = {}, options = {}) {
  const {
    guard: defaultGuard,
    guardProps: defaultGuardProps,
    protectFallback = false,
    afterGuard,
  } = options

  const routeDefinition = route ?? {}
  const routeGuard = routeDefinition.guard
  const routeGuardProps = routeDefinition.guardProps

  const shouldSkipFallbackGuard = routeDefinition.isFallback && !protectFallback
  let shouldGuard = routeDefinition.isProtected !== false && !shouldSkipFallbackGuard

  let guardComponent = defaultGuard
  let guardConfigProps = {}

  if (routeGuard === false) {
    shouldGuard = false
  } else if (isGuardConfig(routeGuard)) {
    if (routeGuard.disabled) {
      shouldGuard = false
    }

    if (routeGuard.component) {
      guardComponent = routeGuard.component
    }

    if (routeGuard.props) {
      guardConfigProps = routeGuard.props
    }
  } else if (routeGuard) {
    guardComponent = routeGuard
  }

  let output = element

  if (shouldGuard && guardComponent) {
    const GuardComponent = guardComponent
    const mergedProps = {
      ...(defaultGuardProps ?? {}),
      ...(guardConfigProps ?? {}),
      ...(routeGuardProps ?? {}),
    }

    output = <GuardComponent {...mergedProps}>{output}</GuardComponent>
  }

  return afterGuard ? afterGuard(output, routeDefinition) : output
}
