import { forwardRef } from 'react'

const BASE_CLASS = 'gg-navigation-menu'

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const isExternal = (item) => Boolean(item?.external)

const hasChildren = (item) => Array.isArray(item?.children) && item.children.length > 0

const getItemKey = (item, index, level) => {
  if (isNonEmptyString(item?.id)) return item.id
  if (isNonEmptyString(item?.href)) return `${level}:${item.href}`
  if (isNonEmptyString(item?.label)) return `${level}:${index}:${item.label}`
  return `${level}:${index}`
}

const normalizeHref = (href) => (isNonEmptyString(href) ? href : '#')

const matchActive = (activePath, href) => {
  if (!isNonEmptyString(activePath) || !isNonEmptyString(href)) return false
  try {
    const active = new URL(activePath, 'https://local.test')
    const target = new URL(href, active)
    return active.pathname === target.pathname
  } catch (error) {
    return activePath === href
  }
}

const defaultRenderLink = ({ item, linkProps }) => (
  <a {...linkProps}>
    <span className={`${BASE_CLASS}__label`}>{item.label}</span>
    {isNonEmptyString(item.description) ? (
      <span className={`${BASE_CLASS}__description`}>{item.description}</span>
    ) : null}
  </a>
)

export const NavigationMenu = forwardRef(function NavigationMenu(
  {
    items = [],
    orientation = 'horizontal',
    label = 'Primary navigation',
    className,
    activePath,
    onNavigate,
    renderLink = defaultRenderLink,
    listProps,
    ...navProps
  },
  ref,
) {
  const orientationValue = orientation === 'vertical' ? 'vertical' : 'horizontal'
  const navClassName = [BASE_CLASS, `${BASE_CLASS}--${orientationValue}`, className]
    .filter(Boolean)
    .join(' ')

  const { className: listClassName, ...restListProps } = listProps ?? {}
  const mergedListClassName = [`${BASE_CLASS}__list`, listClassName].filter(Boolean).join(' ')

  const handleLinkClick = (item) => (event) => {
    if (typeof onNavigate === 'function') {
      if (typeof event?.preventDefault === 'function') {
        event.preventDefault()
      }
      onNavigate({ item, event })
    }
  }

  const renderItems = (collection, level = 0) => {
    if (!Array.isArray(collection) || collection.length === 0) {
      return null
    }

    return collection.map((item, index) => {
      if (!isNonEmptyString(item?.label)) return null

      const key = getItemKey(item, index, level)
      const itemHasChildren = hasChildren(item)
      const isActive = matchActive(activePath, item?.href)

      const linkProps = {
        className: `${BASE_CLASS}__link`,
        href: normalizeHref(item?.href),
        onClick: handleLinkClick(item),
      }

      if (isActive) {
        linkProps['aria-current'] = 'page'
      }

      if (isExternal(item)) {
        linkProps.target = '_blank'
        linkProps.rel = 'noreferrer noopener'
      }

      const content = renderLink({ item, linkProps, level, isActive, hasChildren: itemHasChildren })

      return (
        <li
          key={key}
          className={`${BASE_CLASS}__item${itemHasChildren ? ` ${BASE_CLASS}__item--has-children` : ''}${
            isActive ? ` ${BASE_CLASS}__item--active` : ''
          }`}
          data-level={level}
        >
          {content}
          {itemHasChildren ? (
            <ul className={`${BASE_CLASS}__sublist`} role="list">
              {renderItems(item.children, level + 1)}
            </ul>
          ) : null}
        </li>
      )
    })
  }

  return (
    <nav
      {...navProps}
      ref={ref}
      className={navClassName}
      aria-label={navProps['aria-label'] ?? label}
      data-orientation={orientationValue}
    >
      <ul
        className={mergedListClassName}
        role="list"
        data-orientation={orientationValue}
        {...restListProps}
      >
        {renderItems(items)}
      </ul>
    </nav>
  )
})

export default NavigationMenu
