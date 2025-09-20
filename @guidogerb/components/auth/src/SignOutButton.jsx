import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from 'react-oidc-context'

const SIZE_STYLES = {
  sm: {
    padding: '0.45rem 1rem',
    fontSize: '0.85rem',
  },
  md: {
    padding: '0.7rem 1.6rem',
    fontSize: '0.95rem',
  },
  lg: {
    padding: '0.85rem 2rem',
    fontSize: '1.05rem',
  },
}

const VARIANT_STYLES = {
  primary: {
    color: '#ffffff',
    backgroundImage: 'linear-gradient(140deg, #10142f 0%, #1f2c6f 45%, #0b1133 100%)',
    boxShadow: '0 12px 28px rgba(16, 20, 47, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  secondary: {
    color: '#10142f',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(16, 20, 47, 0.18)',
    boxShadow: '0 10px 24px rgba(16, 20, 47, 0.12)',
  },
  danger: {
    color: '#ffffff',
    backgroundImage: 'linear-gradient(140deg, #7f1d1d 0%, #b91c1c 45%, #7f1d1d 100%)',
    boxShadow: '0 12px 28px rgba(127, 29, 29, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
}

const mergeStyles = (...styles) => Object.assign({}, ...styles.filter(Boolean))

const computeStatusMessage = (status, { pendingText, successText, errorText }, error) => {
  if (status === 'pending') return pendingText
  if (status === 'success') return successText
  if (status === 'error') {
    const suffix = error?.message ? `: ${error.message}` : ''
    return `${errorText}${suffix}`
  }
  return ''
}

export default function SignOutButton({
  redirectUri,
  children,
  pendingText = 'Signing out…',
  successText = 'Signed out. Redirecting…',
  errorText = 'Unable to sign out',
  variant = 'primary',
  size = 'md',
  showStatus = true,
  className,
  containerStyle,
  onSignOut,
  onError,
  ...buttonProps
}) {
  const auth = useAuth()
  const mountedRef = useRef(true)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(
    () => () => {
      mountedRef.current = false
    },
    [],
  )

  const {
    style: buttonStyleProp,
    className: buttonClassName,
    onClick: onClickProp,
    disabled: disabledProp,
    type: providedType,
    postLogoutRedirectUri,
    ...restButtonProps
  } = buttonProps

  const buttonType = providedType ?? 'button'
  const isPending = status === 'pending'

  const baseButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid transparent',
    letterSpacing: '0.01em',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
    cursor: disabledProp || isPending ? 'not-allowed' : 'pointer',
    transform: isPending ? 'scale(0.98)' : 'scale(1)',
    opacity: disabledProp || isPending ? 0.78 : 1,
    minWidth: '10rem',
  }

  const computedStyle = useMemo(
    () =>
      mergeStyles(
        baseButtonStyle,
        SIZE_STYLES[size] ?? SIZE_STYLES.md,
        VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary,
        buttonStyleProp,
      ),
    [buttonStyleProp, disabledProp, isPending, size, variant],
  )

  const containerStyles = useMemo(
    () =>
      mergeStyles(
        {
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0.5rem',
        },
        containerStyle,
      ),
    [containerStyle],
  )

  const updateStatus = (nextStatus, nextError = null) => {
    if (!mountedRef.current) return
    setStatus(nextStatus)
    setError(nextError)
  }

  const resolveRedirectTarget = () => {
    const explicitTarget = redirectUri ?? postLogoutRedirectUri
    if (explicitTarget) return explicitTarget
    return auth?.settings?.post_logout_redirect_uri
  }

  const executeFallbackSignOut = async (target) => {
    if (typeof auth?.removeUser === 'function') {
      await Promise.resolve(auth.removeUser())
    }

    if (target && typeof window !== 'undefined') {
      const { location } = window
      if (location) {
        if (typeof location.assign === 'function') {
          location.assign(target)
        } else {
          location.href = target
        }
      }
    }
  }

  const handleClick = async (event) => {
    if (typeof onClickProp === 'function') {
      onClickProp(event)
      if (event.defaultPrevented) {
        return
      }
    }

    if (!auth) {
      updateStatus('error', new Error('Authentication context unavailable'))
      onError?.(new Error('Authentication context unavailable'))
      return
    }

    updateStatus('pending')

    const target = resolveRedirectTarget()
    const method = typeof auth?.signoutRedirect === 'function' ? 'signoutRedirect' : 'fallback'

    try {
      if (method === 'signoutRedirect') {
        const payload = target ? { post_logout_redirect_uri: target } : undefined
        await auth.signoutRedirect(payload)
      } else {
        await executeFallbackSignOut(target)
      }

      updateStatus('success')
      onSignOut?.({ redirectUri: target ?? null, method })
    } catch (err) {
      updateStatus('error', err)
      onError?.(err)
    }
  }

  const buttonLabel = isPending ? pendingText : (children ?? 'Sign out')
  const statusMessage = computeStatusMessage(status, { pendingText, successText, errorText }, error)
  const buttonDisabled = disabledProp || isPending

  return (
    <div className={className} style={containerStyles}>
      <button
        type={buttonType}
        {...restButtonProps}
        className={buttonClassName}
        style={computedStyle}
        disabled={buttonDisabled}
        data-variant={variant}
        data-status={status}
        onClick={handleClick}
      >
        <span>{buttonLabel}</span>
      </button>
      {showStatus ? (
        <span
          role="status"
          aria-live="polite"
          style={{
            minHeight: '1.25em',
            fontSize: '0.85rem',
            color: status === 'error' ? '#a11a1a' : '#1b6b3a',
            transition: 'opacity 0.2s ease',
            opacity: status === 'idle' ? 0 : 1,
            visibility: status === 'idle' ? 'hidden' : 'visible',
          }}
        >
          {statusMessage}
        </span>
      ) : null}
    </div>
  )
}
