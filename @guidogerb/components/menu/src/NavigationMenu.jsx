import { forwardRef, useCallback } from 'react'

const BASE_CLASS = 'gg-navigation-menu'

const LIST_ATTR = 'data-nav-list'
const ITEM_ATTR = 'data-nav-item'
const LINK_ATTR = 'data-nav-link'
const LIST_SELECTOR = `ul[${LIST_ATTR}="true"]`
const ITEM_SELECTOR = `li[${ITEM_ATTR}="true"]`
const FOCUSABLE_SELECTOR = `:scope > ${ITEM_SELECTOR} > [${LINK_ATTR}="true"]`

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

const getOrientation = (list) =>
  list?.dataset?.orientation === 'horizontal' ? 'horizontal' : 'vertical'

const getFocusableItems = (list) => {
  if (!list) return []
  return Array.from(list.querySelectorAll(FOCUSABLE_SELECTOR))
}

const focusElement = (element) => {
  if (!element) return false
  if (typeof element.focus === 'function') {
    element.focus()
  }
  return document.activeElement === element
}

const setRovingTabIndex = (element) => {
  const list = element?.closest(LIST_SELECTOR)
  if (!list) return
  const items = getFocusableItems(list)
  items.forEach((item) => {
    item.tabIndex = item === element ? 0 : -1
  })
}

const moveFocus = (current, list, strategy) => {
  const items = getFocusableItems(list)
  if (items.length === 0) return false

  const currentIndex = Math.max(items.indexOf(current), 0)
  let nextIndex = currentIndex

  switch (strategy) {
    case 'next':
      nextIndex = (currentIndex + 1) % items.length
      break
    case 'prev':
      nextIndex = (currentIndex - 1 + items.length) % items.length
      break
    case 'first':
      nextIndex = 0
      break
    case 'last':
      nextIndex = items.length - 1
      break
    default:
      break
  }

  const next = items[nextIndex]
  if (!next) return false

  setRovingTabIndex(next)
  focusElement(next)
  return true
}

const focusFirstInList = (list) => {
  const items = getFocusableItems(list)
  if (!items.length) return false
  const first = items[0]
  setRovingTabIndex(first)
  focusElement(first)
  return true
}

const focusParentTrigger = (list) => {
  const parentItem = list?.closest(ITEM_SELECTOR)
  if (!parentItem) return false
  const trigger = parentItem.querySelector(`:scope > [${LINK_ATTR}="true"]`)
  if (!trigger) return false
  setRovingTabIndex(trigger)
  focusElement(trigger)
  return true
}

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
  const setNavRef = useCallback(
    (node) => {
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const handleItemFocus = useCallback((event) => {
    setRovingTabIndex(event.currentTarget)
  }, [])

  const handleItemKeyDown = useCallback((event) => {
    const key = event.key
    if (
      ![
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Escape',
      ].includes(key)
    ) {
      return
    }

    const current = event.currentTarget
    const list = current.closest(LIST_SELECTOR)
    if (!list) return

    const orientationValue = getOrientation(list)
    const currentItem = current.closest(ITEM_SELECTOR)
    const childList = currentItem?.querySelector(`:scope > ${LIST_SELECTOR}`) ?? null

    if (key === 'Home') {
      event.preventDefault()
      moveFocus(current, list, 'first')
      return
    }

    if (key === 'End') {
      event.preventDefault()
      moveFocus(current, list, 'last')
      return
    }

    if (key === 'Escape') {
      const handled = focusParentTrigger(list)
      if (handled) {
        event.preventDefault()
      }
      return
    }

    if (orientationValue === 'horizontal') {
      if (key === 'ArrowRight') {
        event.preventDefault()
        moveFocus(current, list, 'next')
        return
      }

      if (key === 'ArrowLeft') {
        event.preventDefault()
        moveFocus(current, list, 'prev')
        return
      }

      if (key === 'ArrowDown' && childList) {
        event.preventDefault()
        focusFirstInList(childList)
        return
      }

      if (key === 'ArrowUp') {
        const handled = focusParentTrigger(list)
        if (handled) {
          event.preventDefault()
        }
        return
      }
    } else {
      if (key === 'ArrowDown') {
        event.preventDefault()
        moveFocus(current, list, 'next')
        return
      }

      if (key === 'ArrowUp') {
        event.preventDefault()
        moveFocus(current, list, 'prev')
        return
      }

      if (key === 'ArrowRight' && childList) {
        event.preventDefault()
        focusFirstInList(childList)
        return
      }

      if (key === 'ArrowLeft') {
        const handled = focusParentTrigger(list)
        if (handled) {
          event.preventDefault()
        }
        return
      }
    }
  }, [])

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

    const focusableIndex = collection.findIndex((item) => matchActive(activePath, item?.href))
    const defaultFocusableIndex = focusableIndex >= 0 ? focusableIndex : level === 0 ? 0 : -1

    return collection.map((item, index) => {
      if (!isNonEmptyString(item?.label)) return null

      const key = getItemKey(item, index, level)
      const itemHasChildren = hasChildren(item)
      const isActive = matchActive(activePath, item?.href)
      const isFocusable = defaultFocusableIndex === index

      const linkProps = {
        className: `${BASE_CLASS}__link`,
        href: normalizeHref(item?.href),
        onClick: handleLinkClick(item),
        onFocus: handleItemFocus,
        onKeyDown: handleItemKeyDown,
        tabIndex: isFocusable ? 0 : -1,
        [LINK_ATTR]: 'true',
      }

      if (isActive) {
        linkProps['aria-current'] = 'page'
      }

      if (isExternal(item)) {
        linkProps.target = '_blank'
        linkProps.rel = 'noreferrer noopener'
      }

      if (itemHasChildren) {
        linkProps['aria-haspopup'] = 'true'
      }

      const content = renderLink({ item, linkProps, level, isActive, hasChildren: itemHasChildren })

      return (
        <li
          key={key}
          className={`${BASE_CLASS}__item${itemHasChildren ? ` ${BASE_CLASS}__item--has-children` : ''}${
            isActive ? ` ${BASE_CLASS}__item--active` : ''
          }`}
          data-level={level}
          data-has-children={itemHasChildren ? 'true' : undefined}
          {...{ [ITEM_ATTR]: 'true' }}
        >
          {content}
          {itemHasChildren ? (
            <ul
              className={`${BASE_CLASS}__sublist`}
              role="list"
              data-orientation="vertical"
              {...{ [LIST_ATTR]: 'true' }}
            >
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
      ref={setNavRef}
      className={navClassName}
      aria-label={navProps['aria-label'] ?? label}
      data-orientation={orientationValue}
    >
      <ul
        className={mergedListClassName}
        role="list"
        data-orientation={orientationValue}
        {...{ [LIST_ATTR]: 'true' }}
        {...restListProps}
      >
        {renderItems(items)}
      </ul>
    </nav>
  )
})

export default NavigationMenu
