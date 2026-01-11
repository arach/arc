import { useEffect, useState } from 'react'
import DiagramEditor from './components/editor/DiagramEditor'
import LandingPage from './components/LandingPage'
import './landing.css'

const EDITOR_HASH = '#editor'

function App() {
  const [isDark, setIsDark] = useState(true)
  const [activeView, setActiveView] = useState<'landing' | 'editor'>(() =>
    window.location.hash === EDITOR_HASH ? 'editor' : 'landing',
  )

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(window.location.hash === EDITOR_HASH ? 'editor' : 'landing')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Apply dark mode class to document when editor is active.
  useEffect(() => {
    if (activeView === 'editor' && isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [activeView, isDark])

  const handleLaunchEditor = () => {
    window.location.hash = EDITOR_HASH
  }

  if (activeView === 'landing') {
    return <LandingPage onLaunchEditor={handleLaunchEditor} />
  }

  return <DiagramEditor isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
}

export default App
