import { useMemo } from 'react'
import { useAuth } from 'react-oidc-context'
import SignOutButton from './SignOutButton.jsx'

const mergeStyles = (...styles) => Object.assign({}, ...styles.filter(Boolean))

const computeInitials = (value, fallback = 'GG') => {
  if (!value) return fallback
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return fallback
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return letters ? letters.toUpperCase() : fallback
}

const resolveProfile = (user) => {
  const profile = user?.profile ?? {}
  const displayName =
    profile.name ?? profile.preferred_username ?? profile.given_name ?? profile.email ?? 'Signed in user'
  const secondary = profile.email ?? profile.preferred_username ?? ''
  const avatarUrl = profile.picture ?? profile.avatar_url ?? null
  return { displayName, secondary, avatarUrl }
}

export default function SignOutControl({
  title = 'Ready to head out?',
  message = 'Sign out to keep your account secure.',
  user,
  avatarUrl,
  accentColor = '#38bdf8',
  surface = 'dark',
  layout = 'horizontal',
  buttonProps = {},
  className,
  style,
  ...sectionProps
}) {
  const auth = useAuth()
  const sessionUser = user ?? auth?.user ?? null
  const { displayName, secondary, avatarUrl: profileAvatar } = resolveProfile(sessionUser)
  const resolvedAvatar = avatarUrl ?? profileAvatar
  const initials = computeInitials(displayName)

  const containerStyle = useMemo(
    () =>
      mergeStyles(
        {
          display: 'flex',
          flexDirection: layout === 'vertical' ? 'column' : 'row',
          alignItems: layout === 'vertical' ? 'stretch' : 'center',
          gap: layout === 'vertical' ? '1.75rem' : '1.5rem',
          padding: '1.75rem',
          borderRadius: '1.5rem',
          background:
            surface === 'light'
              ? '#f8fafc'
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 46%, #0b1120 100%)',
          color: surface === 'light' ? '#0f172a' : '#f8fafc',
          boxShadow:
            surface === 'light'
              ? '0 18px 48px rgba(15, 23, 42, 0.16)'
              : '0 26px 54px rgba(15, 23, 42, 0.45)',
          border:
            surface === 'light'
              ? '1px solid rgba(15, 23, 42, 0.08)'
              : '1px solid rgba(148, 163, 184, 0.18)',
        },
        style,
      ),
    [layout, surface, style],
  )

  const infoStackStyle = useMemo(
    () =>
      mergeStyles(
        {
          display: 'flex',
          flexDirection: layout === 'vertical' ? 'column' : 'row',
          alignItems: layout === 'vertical' ? 'center' : 'flex-start',
          gap: layout === 'vertical' ? '1.25rem' : '1.5rem',
          flex: 1,
          textAlign: layout === 'vertical' ? 'center' : 'left',
        },
      ),
    [layout],
  )

  const avatarStyle = useMemo(
    () => ({
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '999px',
      border: `2px solid ${accentColor}`,
      display: 'grid',
      placeItems: 'center',
      fontWeight: 600,
      fontSize: '1.15rem',
      color: surface === 'light' ? '#0f172a' : '#f8fafc',
      backgroundColor: surface === 'light' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.55)',
      overflow: 'hidden',
      boxShadow: '0 14px 32px rgba(15, 23, 42, 0.35)',
      flexShrink: 0,
    }),
    [accentColor, surface],
  )

  const buttonContainerStyle = useMemo(
    () =>
      mergeStyles(
        {
          marginTop: 0,
          alignItems: layout === 'vertical' ? 'center' : 'flex-end',
          width: layout === 'vertical' ? '100%' : undefined,
        },
        buttonProps.containerStyle,
      ),
    [buttonProps.containerStyle, layout],
  )

  const resolvedButtonProps = useMemo(
    () => ({
      variant: buttonProps.variant ?? (surface === 'light' ? 'primary' : 'secondary'),
      size: buttonProps.size ?? 'md',
      ...buttonProps,
      containerStyle: buttonContainerStyle,
    }),
    [buttonProps, buttonContainerStyle, surface],
  )

  return (
    <section
      className={className}
      style={containerStyle}
      data-auth-signout-control=""
      {...sectionProps}
    >
      <div style={infoStackStyle}>
        <div style={avatarStyle} aria-hidden="true">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            initials
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            alignItems: layout === 'vertical' ? 'center' : 'flex-start',
            flex: 1,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.3rem',
              letterSpacing: '-0.01em',
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                letterSpacing: '-0.005em',
              }}
            >
              {displayName}
            </span>
            {secondary ? (
              <span
                style={{
                  fontSize: '0.9rem',
                  opacity: surface === 'light' ? 0.7 : 0.85,
                }}
              >
                {secondary}
              </span>
            ) : null}
          </div>
          {message ? (
            <p
              style={{
                margin: 0,
                fontSize: '0.95rem',
                lineHeight: 1.5,
                opacity: surface === 'light' ? 0.75 : 0.88,
              }}
            >
              {message}
            </p>
          ) : null}
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              height: '4px',
              width: layout === 'vertical' ? '3.5rem' : '5rem',
              borderRadius: '999px',
              backgroundColor: accentColor,
              opacity: surface === 'light' ? 0.65 : 0.85,
            }}
          />
        </div>
      </div>
      <div style={{ width: layout === 'vertical' ? '100%' : 'auto' }}>
        <SignOutButton {...resolvedButtonProps} />
      </div>
    </section>
  )
}
