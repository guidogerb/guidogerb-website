import React from 'react';
import {AuthProvider as OidcAuthProvider} from 'react-oidc-context';
import LoginCallback from './LoginCallback';

export default function AuthProvider({
                                        children,
                                        authority,
                                        metadataUrl,
                                        client_id,
                                        redirect_uri,
                                        response_type,
                                        scope,
                                        post_logout_redirect_uri,
                                        loginCallbackPath = '/auth/loginCallback',
                                    }) {
    // Compute a sensible default redirect URI for development if not provided via props/env
    const currentOrigin = (typeof window !== 'undefined' && window.location) ? window.location.origin : undefined;
    const effectiveRedirectUri = redirect_uri || (currentOrigin ? `${currentOrigin}${loginCallbackPath}` : undefined);

    // Warn if configured redirect URI doesn't match the current origin (common cause of redirect_mismatch)
    if (currentOrigin && effectiveRedirectUri) {
        const origin = currentOrigin;
        const url = new URL(effectiveRedirectUri, origin);
        const originMatches = effectiveRedirectUri.startsWith(origin);
        const hostAliasMatches = !originMatches && origin.includes('localhost') && url.hostname === '127.0.0.1' && effectiveRedirectUri.startsWith(`${url.protocol}//127.0.0.1:${url.port || ''}`);
        if (!originMatches && !hostAliasMatches) {
            // eslint-disable-next-line no-console
            console.error('[AuthProvider] redirect_uri mismatch.\n - Current origin: ', origin, '\n - Configured redirect_uri:', effectiveRedirectUri,
                '\nAction: Update Cognito App client Callback URLs to include EXACT URL below, or adjust VITE_REDIRECT_URI to match your dev URL.\n ->', `${origin}${loginCallbackPath}`);
        }
    }

    const config = {authority, metadataUrl, client_id, redirect_uri: effectiveRedirectUri, response_type, scope, post_logout_redirect_uri};
    console.log('[AuthProvider] Using redirect_uri:', effectiveRedirectUri);
    const isLoginCallback = typeof window !== 'undefined' && window.location && window.location.pathname === loginCallbackPath;
    return (
        <OidcAuthProvider {...config}>
            {isLoginCallback ? <LoginCallback /> : children}
        </OidcAuthProvider>
    );
}
