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
    const config = {authority, metadataUrl, client_id, redirect_uri, response_type, scope, post_logout_redirect_uri};
    console.log('AuthProvider config: ', JSON.stringify(config));
    const isLoginCallback = typeof window !== 'undefined' && window.location && window.location.pathname === loginCallbackPath;
    return (
        <OidcAuthProvider {...config}>
            {isLoginCallback && LoginCallback ? LoginCallback : children}
        </OidcAuthProvider>
    );
}
