import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export default function LoginCallback() {
  const auth = useAuth();

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        // If already authenticated, just go to home
        if (auth?.isAuthenticated) {
          window.history.replaceState({}, document.title, '/');
          return;
        }

        // If the URL contains an authorization response, explicitly finalize it
        const hasAuthCode = /[?&#](code|id_token|access_token)=/.test(window.location.href) || /[?&#]state=/.test(window.location.href);
        if (hasAuthCode && typeof auth?.signinRedirectCallback === 'function') {
          await auth.signinRedirectCallback();
          if (!canceled) {
            window.history.replaceState({}, document.title, '/');
          }
          return;
        }

        // Otherwise, give the provider a brief moment to process automatically
        await new Promise((r) => setTimeout(r, 150));
        if (!canceled && auth?.isAuthenticated) {
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

  if (auth?.error) {
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
