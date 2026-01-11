import { useCallback, useEffect, useRef, useState } from 'react'
import type { Point, Transform } from '../types/editor'
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../types/editor'

interface UseCanvasTransformOptions {
  initialZoom?: number
  initialPan?: Point
  panModeActive?: boolean
  onTransformChange?: (transform: Transform) => void
}

interface CanvasTransformState {
  zoom: number
  pan: Point
  isPanning: boolean
}

export function useCanvasTransform(options: UseCanvasTransformOptions = {}) {
  const { initialZoom = 1, initialPan = { x: 0, y: 0 }, panModeActive = false, onTransformChange } = options

  const [state, setState] = useState<CanvasTransformState>({
    zoom: initialZoom,
    pan: initialPan,
    isPanning: false,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 })
  const spacePressed = useRef(false)

  const setZoom = useCallback((newZoom: number, focalPoint?: Point) => {
    setState((prev) => {
      const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom))

      if (focalPoint && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = focalPoint.x - rect.left
        const mouseY = focalPoint.y - rect.top

        const canvasX = (mouseX - prev.pan.x) / prev.zoom
        const canvasY = (mouseY - prev.pan.y) / prev.zoom

        const newPanX = mouseX - canvasX * clampedZoom
        const newPanY = mouseY - canvasY * clampedZoom

        return {
          ...prev,
          zoom: clampedZoom,
          pan: { x: newPanX, y: newPanY },
        }
      }

      return { ...prev, zoom: clampedZoom }
    })
  }, [])

  const setPan = useCallback((pan: Point) => {
    setState((prev) => ({ ...prev, pan }))
  }, [])

  const zoomIn = useCallback(
    (focalPoint?: Point) => {
      setState((prev) => {
        const newZoom = Math.min(ZOOM_MAX, prev.zoom * ZOOM_STEP)
        if (focalPoint && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const mouseX = focalPoint.x - rect.left
          const mouseY = focalPoint.y - rect.top
          const canvasX = (mouseX - prev.pan.x) / prev.zoom
          const canvasY = (mouseY - prev.pan.y) / prev.zoom
          return {
            ...prev,
            zoom: newZoom,
            pan: {
              x: mouseX - canvasX * newZoom,
              y: mouseY - canvasY * newZoom,
            },
          }
        }
        return { ...prev, zoom: newZoom }
      })
    },
    []
  )

  const zoomOut = useCallback(
    (focalPoint?: Point) => {
      setState((prev) => {
        const newZoom = Math.max(ZOOM_MIN, prev.zoom / ZOOM_STEP)
        if (focalPoint && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const mouseX = focalPoint.x - rect.left
          const mouseY = focalPoint.y - rect.top
          const canvasX = (mouseX - prev.pan.x) / prev.zoom
          const canvasY = (mouseY - prev.pan.y) / prev.zoom
          return {
            ...prev,
            zoom: newZoom,
            pan: {
              x: mouseX - canvasX * newZoom,
              y: mouseY - canvasY * newZoom,
            },
          }
        }
        return { ...prev, zoom: newZoom }
      })
    },
    []
  )

  const resetTransform = useCallback(() => {
    setState({ zoom: 1, pan: { x: 0, y: 0 }, isPanning: false })
  }, [])

  const fitToView = useCallback((contentSize: { width: number; height: number }, padding = 40) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = (rect.width - padding * 2) / contentSize.width
    const scaleY = (rect.height - padding * 2) / contentSize.height
    const zoom = Math.min(scaleX, scaleY, 1)

    const panX = (rect.width - contentSize.width * zoom) / 2
    const panY = (rect.height - contentSize.height * zoom) / 2

    setState({ zoom, pan: { x: panX, y: panY }, isPanning: false })
  }, [])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      const isPinch = e.ctrlKey || e.metaKey

      if (isPinch) {
        const delta = -e.deltaY * 0.01
        const newZoom = state.zoom * (1 + delta)
        setZoom(newZoom, { x: e.clientX, y: e.clientY })
      } else {
        setState((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x - e.deltaX,
            y: prev.pan.y - e.deltaY,
          },
        }))
      }
    },
    [state.zoom, setZoom]
  )

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      const shouldPan = e.button === 1 || (e.button === 0 && spacePressed.current) || (e.button === 0 && panModeActive)
      if (shouldPan) {
        e.preventDefault()
        isPanningRef.current = true
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
        setState((prev) => ({ ...prev, isPanning: true }))
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      }
    },
    [panModeActive]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPanningRef.current) return

      const dx = e.clientX - lastPanPoint.current.x
      const dy = e.clientY - lastPanPoint.current.y
      lastPanPoint.current = { x: e.clientX, y: e.clientY }

      setState((prev) => ({
        ...prev,
        pan: {
          x: prev.pan.x + dx,
          y: prev.pan.y + dy,
        },
      }))
    },
    []
  )

  const handlePointerUp = useCallback(() => {
    isPanningRef.current = false
    setState((prev) => ({ ...prev, isPanning: false }))
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat) {
      spacePressed.current = true
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spacePressed.current = false
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('pointerleave', handlePointerUp)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointerleave', handlePointerUp)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown, handleKeyUp])

  useEffect(() => {
    onTransformChange?.({ zoom: state.zoom, pan: state.pan })
  }, [state.zoom, state.pan, onTransformChange])

  const screenToCanvas = useCallback(
    (screenPoint: Point): Point => {
      if (!containerRef.current) return screenPoint
      const rect = containerRef.current.getBoundingClientRect()
      return {
        x: (screenPoint.x - rect.left - state.pan.x) / state.zoom,
        y: (screenPoint.y - rect.top - state.pan.y) / state.zoom,
      }
    },
    [state.zoom, state.pan]
  )

  const canvasToScreen = useCallback(
    (canvasPoint: Point): Point => {
      if (!containerRef.current) return canvasPoint
      const rect = containerRef.current.getBoundingClientRect()
      return {
        x: canvasPoint.x * state.zoom + state.pan.x + rect.left,
        y: canvasPoint.y * state.zoom + state.pan.y + rect.top,
      }
    },
    [state.zoom, state.pan]
  )

  const transformStyle: React.CSSProperties = {
    transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
    transformOrigin: '0 0',
    transition: state.isPanning ? 'none' : 'transform 0.1s ease-out',
  }

  return {
    containerRef,
    zoom: state.zoom,
    pan: state.pan,
    isPanning: state.isPanning,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    resetTransform,
    fitToView,
    screenToCanvas,
    canvasToScreen,
    transformStyle,
  }
}
