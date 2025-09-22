import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from '@guidogerb/components-auth'
import { registerSW } from '@guidogerb/components-sw'

if (import.meta.env.VITE_ENABLE_SW === 'true') {
  registerSW({ url: '/sw.js' })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
