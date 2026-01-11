import { useState, useEffect } from 'react'
import DiagramEditor from './components/editor/DiagramEditor'

function App() {
  const [isDark, setIsDark] = useState(true)

  // Apply dark mode class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div className={isDark ? 'dark' : ''}>
      <DiagramEditor isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
    </div>
  )
}

export default App
