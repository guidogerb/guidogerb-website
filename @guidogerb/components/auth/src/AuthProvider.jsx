import React from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';
import { getOidcConfig } from './config';

// Wrapper that configures react-oidc-context from props or Vite env
// Usage:
// <AuthProvider>
//   <App/>
// </AuthProvider>
export default function AuthProvider({
  authority,
  metadataUrl,
  clientId,
  redirectUri,
  responseType,
  scope,
  onSigninCallback,
  children,
}) {
  const config = getOidcConfig({ authority, metadataUrl, clientId, redirectUri, responseType, scope });

  // Validate: either authority or metadataUrl must be provided
  const hasAuthority = !!config.authority && String(config.authority).trim() !== '';
  const hasMetadata = !!config.metadataUrl && String(config.metadataUrl).trim() !== '';
  if (!hasAuthority && !hasMetadata) {
    const message = 'AuthProvider misconfigured: No authority or metadataUrl configured on settings. Set VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL (and related VITE_* vars), or pass props to <AuthProvider>.';
    // eslint-disable-next-line no-console
    console.error(message, { config });
    throw new Error(message);
  }

  // Default callback recommended by react-oidc-context docs to clean up hash
  const defaultSigninCb = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };

  return (
    <OidcAuthProvider {...config} onSigninCallback={onSigninCallback || defaultSigninCb}>
      {children}
    </OidcAuthProvider>
  );
}
