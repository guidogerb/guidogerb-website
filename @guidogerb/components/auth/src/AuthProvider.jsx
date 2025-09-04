import React from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import LoginCallback from './LoginCallback';

export default function AuthProvider({
  children,
  authority,
  metadataUrl,
  client_id,
  redirect_uri,
  response_type,
  scope,
  post_logout_redirect_uri,
  loginCallbackPath = '/auth/loginCallback',
}) {
  // Merge props with environment fallbacks
  // Use Vite's import.meta.env directly; in our app this exists at runtime
  const env = import.meta?.env ?? {};

  const currentOrigin = (typeof window !== 'undefined' && window.location) ? window.location.origin : undefined;
  const envRedirect = env?.VITE_REDIRECT_URI;
  const effectiveRedirectUri = redirect_uri || envRedirect || (currentOrigin ? `${currentOrigin}${loginCallbackPath}` : undefined);

  const cfg = {
    authority: authority ?? env?.VITE_COGNITO_AUTHORITY,
    metadataUrl: metadataUrl ?? env?.VITE_COGNITO_METADATA_URL,
    client_id: client_id ?? env?.VITE_COGNITO_CLIENT_ID,
    redirect_uri: effectiveRedirectUri,
    response_type: response_type ?? env?.VITE_RESPONSE_TYPE ?? 'code',
    scope: scope ?? env?.VITE_COGNITO_SCOPE ?? 'openid profile email',
    post_logout_redirect_uri: post_logout_redirect_uri ?? env?.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI,
  };

  // Validate required settings (either authority OR metadataUrl must be provided)
  const missing = [];
  if (!cfg.authority && !cfg.metadataUrl) missing.push('authority or metadataUrl');
  if (!cfg.client_id) missing.push('client_id');
  if (!cfg.redirect_uri) missing.push('redirect_uri');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[AuthProvider] Missing required OIDC settings:', missing.join(', '), '\nConfig received:', cfg);
    return (
      <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 16 }}>
        <h2>Protected Area</h2>
        <div>
          Encountering error... Missing required OIDC settings: {missing.join(', ')}
          <div style={{ marginTop: 8, color: '#a00' }}>
            Hint: ensure OIDC is configured via environment or props. For production, set VITE_ENV secret to include VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL, VITE_COGNITO_CLIENT_ID, and VITE_REDIRECT_URI.
          </div>
        </div>
      </div>
    );
  }

  // Warn if configured redirect URI doesn't match the current origin (common cause of redirect_mismatch)
  if (currentOrigin && cfg.redirect_uri) {
    const origin = currentOrigin;
    const url = new URL(cfg.redirect_uri, origin);
    const originMatches = cfg.redirect_uri.startsWith(origin);
    const hostAliasMatches = !originMatches && origin.includes('localhost') && url.hostname === '127.0.0.1' && cfg.redirect_uri.startsWith(`${url.protocol}//127.0.0.1:${url.port || ''}`);
    if (!originMatches && !hostAliasMatches) {
      // eslint-disable-next-line no-console
      console.error('[AuthProvider] redirect_uri mismatch.\n - Current origin: ', origin, '\n - Configured redirect_uri:', cfg.redirect_uri,
        '\nAction: Update Cognito App client Callback URLs to include EXACT URL below, or adjust VITE_REDIRECT_URI to match your site URL.\n ->', `${origin}${loginCallbackPath}`);
    }
  }

  // Non-sensitive log to aid debugging (avoid logging client secrets; we don't have any here)
  // eslint-disable-next-line no-console
  console.log('[AuthProvider] Using redirect_uri:', cfg.redirect_uri);

  const isLoginCallback = typeof window !== 'undefined' && window.location && window.location.pathname === loginCallbackPath;
  return (
    <OidcAuthProvider {...cfg}>
      {isLoginCallback ? <LoginCallback /> : children}
    </OidcAuthProvider>
  );
}
