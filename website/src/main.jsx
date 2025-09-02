import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from '@guidogerb/components-auth'

const env = import.meta.env || {};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider
      authority={env.VITE_COGNITO_AUTHORITY}
      metadataUrl={env.VITE_COGNITO_METADATA_URL}
      clientId={env.VITE_COGNITO_CLIENT_ID}
      redirectUri={env.VITE_REDIRECT_URI}
      responseType={env.VITE_RESPONSE_TYPE}
      scope={env.VITE_COGNITO_SCOPE}
    >
      <App />
    </AuthProvider>
  </StrictMode>,
)
