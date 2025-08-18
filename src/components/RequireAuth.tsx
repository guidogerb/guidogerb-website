import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

/**
 * RequireAuth: Minimal guard that enforces an authenticated session.
 * Treats any signed-in user as ROLE_AUTHENTICATED.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  if (authStatus !== 'authenticated') {
    return (
      <div className="container" style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
        <h2>Authentication required</h2>
        <p>You must be signed in to access this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
