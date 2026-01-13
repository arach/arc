import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import DiagramEditor from './components/editor/DiagramEditor'
import LandingPage from './components/LandingPage'
import Docs from './components/docs/Docs'
import IsometricDemo from './components/IsometricDemo'
import './landing.css'

function EditorPage() {
  const [isDark, setIsDark] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Clean up dark mode when leaving editor
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return <DiagramEditor isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
}

function LandingPageWrapper() {
  const navigate = useNavigate()

  // Ensure dark mode is removed on landing page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return <LandingPage onLaunchEditor={() => navigate('/editor')} />
}

function DocsWrapper() {
  const navigate = useNavigate()

  // Ensure dark mode is removed on docs
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return <Docs onBack={() => navigate('/')} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/docs" element={<DocsWrapper />} />
        <Route path="/docs/:page" element={<DocsWrapper />} />
        <Route path="/iso-demo" element={<IsometricDemo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
