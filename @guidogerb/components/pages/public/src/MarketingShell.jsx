import { PublicShell } from './PublicShell.jsx'
import { renderActions } from './actions.jsx'
import { joinClassNames, resolveSlot } from './utils.js'

export function MarketingShell({
  header,
  footer,
  eyebrow,
  title,
  description,
  children,
  media,
  aside,
  actions,
  actionsLabel = 'Primary actions',
  heroProps,
  className,
  contentProps,
  ...rest
}) {
  const heroActions = renderActions(actions, { scope: 'marketing-shell' })
  const resolvedMedia = resolveSlot(media)
  const resolvedAside = resolveSlot(aside)

  const { className: heroClassNameProp, ...heroRest } = heroProps ?? {}
  const heroClassName = joinClassNames('marketing-shell__hero', heroClassNameProp)

  return (
    <PublicShell
      header={header}
      footer={footer}
      className={joinClassNames('marketing-shell', className)}
      contentProps={contentProps}
      {...rest}
    >
      <section className={heroClassName} {...heroRest}>
        {eyebrow ? <p className="marketing-shell__eyebrow">{eyebrow}</p> : null}
        {title ? <h1 className="marketing-shell__title">{title}</h1> : null}
        {description ? <p className="marketing-shell__lede">{description}</p> : null}
        {heroActions ? (
          <div className="marketing-shell__actions" role="group" aria-label={actionsLabel}>
            {heroActions}
          </div>
        ) : null}
      </section>

      {resolvedMedia ? <div className="marketing-shell__media">{resolvedMedia}</div> : null}
      {resolvedAside ? <aside className="marketing-shell__aside">{resolvedAside}</aside> : null}
      {children ? <div className="marketing-shell__body">{children}</div> : null}
    </PublicShell>
  )
}
