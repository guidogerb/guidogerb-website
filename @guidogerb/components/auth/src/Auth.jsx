import { useEffect, useRef } from 'react';
import { useAuth } from 'react-oidc-context';

// Auth wrapper component: guards its children behind OIDC authentication
// Usage: <Auth autoSignIn><Protected /></Auth>
function Auth({ children, autoSignIn = false }, logoutUri) {
    const auth = useAuth();
    const redirectStartedRef = useRef(false);

    // Avoid calling signinRedirect in render and guard for StrictMode double-invocation
    useEffect(() => {
        if (autoSignIn && !auth.isAuthenticated && !auth.isLoading && !redirectStartedRef.current) {
            redirectStartedRef.current = true;
            auth.signinRedirect();
        }
    }, [autoSignIn, auth.isAuthenticated, auth.isLoading, auth]);

    const signOutRedirect = () => {
        const url = logoutUri;
        if (url) {
            window.location.href = url;
        } else {
            // fallback: just remove user if logout URL isn't configured
            auth.removeUser();
        }
    };

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (auth.error) {
        return (
            <div>
                Encountering error... {auth.error.message}
                <div style={{ marginTop: 8, color: '#a00' }}>
                    Hint: ensure OIDC is configured. Set either VITE_COGNITO_AUTHORITY or VITE_COGNITO_METADATA_URL, and also VITE_COGNITO_CLIENT_ID, VITE_REDIRECT_URI, VITE_COGNITO_SCOPE in your app’s .env.
                </div>
            </div>
        );
    }

    if (auth.isAuthenticated) {
        return (
            <div>
                {children ?? null}
                <div style={{ marginTop: 12 }}>
                    <button onClick={() => signOutRedirect()}>Sign out</button>
                </div>
            </div>
        );
    }

    if (autoSignIn) {
        // Redirect will be triggered by effect
        return null;
    }

    // Fallback UI when not authenticated
    return (
        <div>
            <button onClick={() => auth.signinRedirect()}>Sign in</button>
            <button onClick={() => signOutRedirect()} style={{ marginLeft: 8 }}>Sign out</button>
        </div>
    );
}

export default Auth;