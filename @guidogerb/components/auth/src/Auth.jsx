import { useAuth } from "react-oidc-context";
import { getLogoutUrl } from './config';

// Auth wrapper component: guards its children behind OIDC authentication
// Usage: <Auth><Protected /></Auth>
function Auth({ children, autoSignIn = false }) {
    const auth = useAuth();

    const signOutRedirect = () => {
        const url = getLogoutUrl();
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
        return <div>Encountering error... {auth.error.message}</div>;
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
        // Trigger redirect sign-in automatically if requested
        auth.signinRedirect();
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