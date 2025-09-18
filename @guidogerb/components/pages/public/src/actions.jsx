import { cloneElement, isValidElement } from 'react'

function buildClassName(scope, variant, existingClassName) {
  const classes = []
  if (existingClassName) {
    classes.push(existingClassName)
  }
  if (scope) {
    classes.push(`${scope}__action`)
  }
  classes.push('page-action')
  if (variant) {
    classes.push(`page-action--${variant}`)
  }
  return classes.join(' ').trim()
}

function normalizeContent(action) {
  if (typeof action === 'string') {
    return { label: action }
  }
  return action
}

export function renderAction(action, index, { scope = 'page', defaultVariant = 'primary' } = {}) {
  if (!action && action !== 0) return null

  if (isValidElement(action)) {
    return cloneElement(action, {
      key: action.key ?? index,
      className: buildClassName(scope, undefined, action.props?.className),
    })
  }

  const normalized = normalizeContent(action) || {}
  const {
    label,
    children,
    href,
    onClick,
    variant = defaultVariant,
    key,
    rel,
    target,
    type = 'button',
    external,
    ariaLabel,
    download,
  } = normalized

  const content = children ?? label
  if (!content && content !== 0) return null

  const className = buildClassName(scope, variant)

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href)
    return (
      <a
        key={key ?? `${index}-link`}
        className={className}
        href={href}
        rel={rel ?? (isExternal ? 'noreferrer noopener' : undefined)}
        target={target ?? (isExternal ? '_blank' : undefined)}
        aria-label={ariaLabel}
        onClick={onClick}
        download={download}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      key={key ?? `${index}-button`}
      className={className}
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  )
}

export function renderActions(actions, options) {
  if (!Array.isArray(actions) || actions.length === 0) return null
  const rendered = actions
    .map((action, index) => renderAction(action, index, options))
    .filter(Boolean)

  return rendered.length > 0 ? rendered : null
}
