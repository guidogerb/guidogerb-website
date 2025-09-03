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
  client_id,
  redirect_uri,
  response_type,
  scope,
  post_logout_redirect_uri,
  children,
}) {
  const config  = {
      authority: import.meta.env.VITE_COGNITO_AUTHORITY,            // optional if using metadataUrl
      metadataUrl: import.meta.env.VITE_COGNITO_METADATA_URL,       // optional if using authority
      client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
      redirect_uri: import.meta.env.VITE_REDIRECT_URI,
      on_signin_callback: import.meta.env.VITE_REDIRECT_URI,
      post_logout_redirect_uri: import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI,
      scope: import.meta.env.VITE_COGNITO_SCOPE ?? "openid profile email",
      response_type: import.meta.env.VITE_RESPONSE_TYPE ?? "code",
  }

  // Default callback recommended by react-oidc-context docs to clean up hash
  const defaultSigninCb = () => {
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  };

  return (
    <OidcAuthProvider {...config} onSigninCallback={config.on_signin_callback || defaultSigninCb}>
      {children}
    </OidcAuthProvider>
  );
}
