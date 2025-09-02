// Utilities to read OIDC/Cognito configuration from environment or props
// Consumers can provide props to AuthProviderWrapper to override these.

// Read a value from Vite env with fallback
const readEnv = (key, fallback) => {
  try {
    // import.meta.env is defined in Vite build environments
    const val = import.meta?.env?.[key];
    return (val === undefined || val === null || val === '') ? fallback : val;
  } catch {
    return fallback;
  }
};

export function getEnvConfig() {
  // Using VITE_ prefix so Vite exposes these to the client bundle
  const authority = readEnv('VITE_COGNITO_AUTHORITY', undefined);
  const clientId = readEnv('VITE_COGNITO_CLIENT_ID', undefined);
  const redirectUri = readEnv('VITE_REDIRECT_URI', typeof window !== 'undefined' ? window.location.origin : undefined);
  const responseType = readEnv('VITE_RESPONSE_TYPE', 'code');
  const scope = readEnv('VITE_COGNITO_SCOPE', 'email openid phone');
  const cognitoDomain = readEnv('VITE_COGNITO_DOMAIN', undefined);
  const logoutUri = readEnv('VITE_LOGOUT_URI', redirectUri);

  return {
    authority,
    clientId,
    redirectUri,
    responseType,
    scope,
    cognitoDomain,
    logoutUri,
  };
}

export function getOidcConfig(overrides = {}) {
  const env = getEnvConfig();
  const authority = overrides.authority ?? env.authority;
  const client_id = overrides.clientId ?? env.clientId;
  const redirect_uri = overrides.redirectUri ?? env.redirectUri;
  const response_type = overrides.responseType ?? env.responseType;
  const scope = overrides.scope ?? env.scope;

  return {
    authority,
    client_id,
    redirect_uri,
    response_type,
    scope,
  };
}

export function getLogoutUrl(overrides = {}) {
  const env = getEnvConfig();
  const clientId = overrides.clientId ?? env.clientId;
  const logoutUri = overrides.logoutUri ?? env.logoutUri;
  const domain = overrides.cognitoDomain ?? env.cognitoDomain;
  if (!clientId || !logoutUri || !domain) return undefined;
  const url = `${domain.replace(/\/$/, '')}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`;
  return url;
}
