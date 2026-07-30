import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ArcStandalone } from './hudson/standalone'

// Force dark mode for Hudson shell
document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ArcStandalone />
  </StrictMode>,
)
