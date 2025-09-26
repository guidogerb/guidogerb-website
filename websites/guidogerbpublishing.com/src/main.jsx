import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@guidogerb/css/reset.css'
import '@guidogerb/css/tokens.css'
import './index.css'
import { AppBasic } from '@guidogerb/components-app'
import { guidogerbPublishingAppBasicProps } from './appBasicPlan.jsx'

const rootElement = document.getElementById('root')

createRoot(rootElement).render(
  <StrictMode>
    <AppBasic {...guidogerbPublishingAppBasicProps} />
  </StrictMode>,
)
