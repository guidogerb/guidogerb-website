import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from '@guidogerb/components-auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <AuthProvider
          authority={import.meta.env.VITE_COGNITO_AUTHORITY}
          metadataUrl={import.meta.env.VITE_COGNITO_METADATA_URL}
          client_id={import.meta.env.VITE_COGNITO_CLIENT_ID}
          redirect_uri={import.meta.env.VITE_REDIRECT_URI}
          response_type={import.meta.env.VITE_RESPONSE_TYPE}
          scope={import.meta.env.VITE_COGNITO_SCOPE}
          post_logout_redirect_uri={import.meta.env.VITE_COGNITO_POST_LOGOUT_REDIRECT_URI}
          loginCallbackPath={import.meta.env.VITE_LOGIN_CALLBACK_PATH || '/auth/loginCallback'}
      >
          <App />
      </AuthProvider>
  </StrictMode>,
)
