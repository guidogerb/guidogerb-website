const DEFAULT_RESOURCES = {
  stagePlotHref: '/files/stage-plot.pdf',
  rehearsalChecklistHref: '/files/rehearsal-checklist.pdf',
  productionEmail: 'hello@garygerber.com',
  productionEmailSubject: 'Collaboration Notes',
}

function readEnvironmentValue(key) {
  if (typeof process !== 'undefined' && process?.env && process.env[key] != null) {
    return process.env[key]
  }

  try {
    if (
      typeof import.meta !== 'undefined' &&
      import.meta &&
      typeof import.meta.env !== 'undefined' &&
      import.meta.env &&
      import.meta.env[key] != null
    ) {
      return import.meta.env[key]
    }
  } catch (_) {
    // `import.meta` is not supported in this environment.
  }

  return undefined
}

function createMailtoHref(address, subject) {
  if (!address) {
    return ''
  }

  if (address.startsWith('mailto:')) {
    return address
  }

  const baseHref = `mailto:${address}`

  if (!subject) {
    return baseHref
  }

  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}subject=${encodeURIComponent(subject)}`
}

function resolveRehearsalResources(rehearsalResources = {}) {
  const overrides =
    rehearsalResources && typeof rehearsalResources === 'object' ? rehearsalResources : {}

  const stagePlotHref =
    overrides.stagePlotHref ??
    readEnvironmentValue('VITE_REHEARSAL_RESOURCES_STAGE_PLOT_URL') ??
    DEFAULT_RESOURCES.stagePlotHref

  const rehearsalChecklistHref =
    overrides.rehearsalChecklistHref ??
    readEnvironmentValue('VITE_REHEARSAL_RESOURCES_CHECKLIST_URL') ??
    DEFAULT_RESOURCES.rehearsalChecklistHref

  const productionEmail =
    overrides.productionEmail ??
    readEnvironmentValue('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL') ??
    DEFAULT_RESOURCES.productionEmail

  const productionEmailSubject =
    overrides.productionEmailSubject ??
    readEnvironmentValue('VITE_REHEARSAL_RESOURCES_PRODUCTION_EMAIL_SUBJECT') ??
    DEFAULT_RESOURCES.productionEmailSubject

  const productionEmailHref =
    overrides.productionEmailHref ?? createMailtoHref(productionEmail, productionEmailSubject)

  return {
    stagePlotHref,
    rehearsalChecklistHref,
    productionEmailHref,
  }
}

export default function Welcome({ children, rehearsalResources, useAuthHook }) {
  const auth = typeof useAuthHook === 'function' ? useAuthHook() : null

  if (auth?.error) {
    return <div className="welcome-error">Sign-in failed: {auth.error.message}</div>
  }

  if (!auth?.isAuthenticated) {
    return <div className="welcome-loading">Loading rehearsal room…</div>
  }

  const name =
    auth?.user?.profile?.['cognito:username'] ?? auth?.user?.profile?.name ?? 'userNotAvailable'
  const email = auth?.user?.profile?.email
  const { stagePlotHref, rehearsalChecklistHref, productionEmailHref } =
    resolveRehearsalResources(rehearsalResources)

  return (
    <div className="welcome-card">
      <h3>Welcome back, {name}!</h3>
      {email ? <p className="welcome-subhead">Signed in as {email}</p> : null}
      <p>
        You now have access to scores, stage plots, and rehearsal notes for upcoming engagements.
        Reach out if anything looks out of date before the next planning session.
      </p>
      <ul className="welcome-links">
        <li>
          <a href={stagePlotHref}>Download latest stage plot</a>
        </li>
        <li>
          <a href={rehearsalChecklistHref}>Rehearsal checklist</a>
        </li>
        <li>
          <a href={productionEmailHref}>Email production team</a>
        </li>
      </ul>
      {children}
    </div>
  )
}
