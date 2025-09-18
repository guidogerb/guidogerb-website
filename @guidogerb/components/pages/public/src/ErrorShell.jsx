import { PublicShell } from './PublicShell.jsx'
import { renderActions } from './actions.jsx'
import { joinClassNames } from './utils.js'

export function ErrorShell({
  statusCode = 404,
  title = 'Page not found',
  description = 'We could not locate the requested page.',
  children,
  actions,
  actionsLabel = 'Available actions',
  header,
  footer,
  className,
  statusLabel,
  ...rest
}) {
  const actionNodes = renderActions(actions, { scope: 'error-shell', defaultVariant: 'secondary' })
  const normalizedStatus =
    statusCode === null || statusCode === undefined ? null : String(statusCode).trim()

  return (
    <PublicShell
      header={header}
      footer={footer}
      className={joinClassNames('error-shell', className)}
      {...rest}
    >
      <section className="error-shell__hero" role="alert" aria-live="polite">
        {normalizedStatus ? (
          <p className="error-shell__status" aria-label={statusLabel}>
            {normalizedStatus}
          </p>
        ) : null}
        {title ? <h1 className="error-shell__title">{title}</h1> : null}
        {description ? <p className="error-shell__description">{description}</p> : null}
        {actionNodes ? (
          <div className="error-shell__actions" role="group" aria-label={actionsLabel}>
            {actionNodes}
          </div>
        ) : null}
      </section>
      {children ? <div className="error-shell__body">{children}</div> : null}
    </PublicShell>
  )
}
