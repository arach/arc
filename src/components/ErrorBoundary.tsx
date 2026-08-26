import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Changing this clears the error — useful when the input that broke it changed. */
  resetKey?: unknown
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  componentDidUpdate(prev: Props) {
    // A new input deserves a fresh attempt — otherwise one bad diagram wedges
    // the canvas until a reload, even after the edit that broke it is undone.
    if (this.state.hasError && prev.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Styled from the chrome tokens rather than Tailwind: this can render
      // inside an embed where no utility stylesheet is loaded.
      return (
        <div className="arc-error-fallback" role="alert">
          <AlertTriangle className="arc-error-icon" aria-hidden="true" />
          <h3 className="arc-error-title">This view stopped rendering</h3>
          <p className="arc-error-detail">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>
          <div className="arc-error-actions">
            <button type="button" onClick={this.handleReset} className="arc-error-btn">
              <RotateCcw aria-hidden="true" />
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} className="arc-error-btn">
              <RefreshCw aria-hidden="true" />
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
