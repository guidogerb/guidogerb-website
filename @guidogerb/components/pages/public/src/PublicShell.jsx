import { forwardRef } from 'react'
import { joinClassNames, resolveSlot } from './utils.js'

const DEFAULT_MAX_WIDTH = '72rem'

export const PublicShell = forwardRef(function PublicShell(
  {
    as: Root = 'div',
    header,
    footer,
    children,
    className,
    mainProps,
    contentProps,
    width = DEFAULT_MAX_WIDTH,
    ...rest
  },
  ref,
) {
  const { style: mainStyle, ...mainRest } = mainProps ?? {}
  const { style: contentStyle, ...contentRest } = contentProps ?? {}

  const composedClassName = joinClassNames('public-shell', className)
  const resolvedHeader = resolveSlot(header)
  const resolvedFooter = resolveSlot(footer)

  const mergedContentStyle = width
    ? { maxWidth: width, marginInline: 'auto', ...(contentStyle ?? {}) }
    : contentStyle

  return (
    <Root ref={ref} className={composedClassName} {...rest}>
      {resolvedHeader ? (
        <header className="public-shell__header" role="banner">
          {resolvedHeader}
        </header>
      ) : null}
      <main className="public-shell__main" style={mainStyle} {...mainRest}>
        <div className="public-shell__content" style={mergedContentStyle} {...contentRest}>
          {children}
        </div>
      </main>
      {resolvedFooter ? (
        <footer className="public-shell__footer" role="contentinfo">
          {resolvedFooter}
        </footer>
      ) : null}
    </Root>
  )
})
