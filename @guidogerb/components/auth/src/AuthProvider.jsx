import React from 'react';
import {AuthProvider as OidcAuthProvider} from 'react-oidc-context';

export default function AuthProvider({
                                         children,
                                         authority,
                                         metadataUrl,
                                         client_id,
                                         redirect_uri,
                                         response_type,
                                         scope,
                                         post_logout_redirect_uri,
                                     }) {
    const config = {authority, metadataUrl, client_id, redirect_uri, response_type, scope, post_logout_redirect_uri};
    console.log('AuthProvider config: ', JSON.stringify(config));
    return (
        <OidcAuthProvider {...config}>
            {children}
        </OidcAuthProvider>
    );
}
