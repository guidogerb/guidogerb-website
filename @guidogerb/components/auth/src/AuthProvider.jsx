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
  clientId,
  redirectUri,
  responseType,
  scope,
  onSigninCallback,
  children,
}) {
  const config = getOidcConfig({ authority, clientId, redirectUri, responseType, scope });

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
