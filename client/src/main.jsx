import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PortalPathProvider } from './context/PortalPathContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortalPathProvider>
      <App />
    </PortalPathProvider>
  </StrictMode>,
)
