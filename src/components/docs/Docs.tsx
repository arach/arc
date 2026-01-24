import { useParams, useNavigate } from 'react-router-dom'
import OverviewPage from './OverviewPage'
import QuickstartPage from './QuickstartPage'
import DiagramFormatPage from './DiagramFormatPage'
import ThemesPage from './ThemesPage'
import LLMPage from './LLMPage'

export default function Docs() {
  const { page } = useParams<{ page?: string }>()
  const navigate = useNavigate()
  const currentPage = page || 'index'

  const handleNavigate = (newPage: string) => {
    if (newPage === 'index') {
      navigate('/docs')
    } else {
      navigate(`/docs/${newPage}`)
    }
  }

  // Common props for all pages
  const pageProps = {
    currentPage,
    onNavigate: handleNavigate,
  }

  // Render the appropriate page
  switch (currentPage) {
    case 'overview':
      return <OverviewPage {...pageProps} />
    case 'quickstart':
      return <QuickstartPage {...pageProps} />
    case 'diagram-format':
      return <DiagramFormatPage {...pageProps} />
    case 'themes':
      return <ThemesPage {...pageProps} />
    case 'llm':
      return <LLMPage {...pageProps} />
    // Add more pages here as they're created:
    // case 'templates':
    //   return <TemplatesPage {...pageProps} />
    // case 'architecture':
    //   return <ArchitecturePage {...pageProps} />
    // case 'exports':
    //   return <ExportsPage {...pageProps} />
    default:
  }
}
