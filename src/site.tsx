import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ArcRoutes } from './App'
import './index.css'

document.documentElement.classList.remove('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ArcRoutes />
    </HashRouter>
  </StrictMode>,
)
