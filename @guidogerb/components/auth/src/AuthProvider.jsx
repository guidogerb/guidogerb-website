import React from 'react';
import { AuthProvider as OidcAuthProvider } from 'react-oidc-context';

export default function AuthProvider({ children }) {
    // Settings for oidc-client-ts via react-oidc-context
    const userManagerSettings = {
        authority: import.meta.env.VITE_COGNITO_AUTHORITY,
        metadataUrl: import.meta.env.VITE_COGNITO_METADATA_URL,
        client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
        redirect_uri: import.meta.env.VITE_REDIRECT_URI,
        post_logout_redirect_uri: import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI,
        scope: import.meta.env.VITE_COGNITO_SCOPE ?? 'openid profile email',
        response_type: import.meta.env.VITE_RESPONSE_TYPE ?? 'code',
    };

    console.log("AuthProvider config: ", JSON.stringify(config));

    const onSigninCallback = () => {
        // Clean up the URL after redirect login
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    };

    return (
        <OidcAuthProvider {...userManagerSettings} onSigninCallback={onSigninCallback}>
            {children}
        </OidcAuthProvider>
    );
}
