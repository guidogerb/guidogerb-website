import { useEffect } from 'react';
import auth  from './AuthProvider';

export default function LoginCallback() {
  useEffect(() => {
    let canceled = false;
    // react-oidc-context will typically handle the callback automatically when the provider is mounted
    // This component exists mainly to provide a route and simple UX while the library processes the response.
    (async () => {
      try {
        // If already authenticated, just go to home
        if (auth.isAuthenticated) {
          window.history.replaceState({}, document.title, '/');
          return;
        }
        // If not loading and not authenticated, wait a tick to allow internal processing
        await new Promise((r) => setTimeout(r, 50));
        if (!canceled && auth.isAuthenticated) {
          window.history.replaceState({}, document.title, '/');
        }
      } catch (e) {
        console.error('Error during login callback handling:', e);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [auth]);

  if (auth.error) {
    return (
      <div>
        Sign-in failed: {auth.error.message}
      </div>
    );
  }

  return (
    <div>
      Completing sign-in...
    </div>
  );
}
