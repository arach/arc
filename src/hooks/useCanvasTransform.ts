import { useCallback, useEffect, useRef, useState } from 'react'
import type { Point, Transform } from '../types/editor'
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, DEFAULT_ZOOM_LEVELS } from '../types/editor'

interface UseCanvasTransformOptions {
  initialZoom?: number | 'fit'
  initialPan?: Point
  panModeActive?: boolean
  onTransformChange?: (transform: Transform) => void
  contentSize?: { width: number; height: number }  // Required for 'fit' calculation
  zoomLevels?: number[]      // Custom zoom level steps (overrides zoomStep)
  zoomStep?: number          // Zoom increment per step (default: 0.05 = 5%)
}

interface CanvasTransformState {
  zoom: number
  pan: Point
  isPanning: boolean
}

export function useCanvasTransform(options: UseCanvasTransformOptions = {}) {
  const {
    initialZoom = 1,
    initialPan = { x: 0, y: 0 },
    panModeActive = false,
    onTransformChange,
    contentSize,
    zoomLevels,
    zoomStep = ZOOM_STEP,
  } = options

  // Generate zoom levels from step if not explicitly provided
  const effectiveZoomLevels = zoomLevels || DEFAULT_ZOOM_LEVELS
  const minZoom = effectiveZoomLevels[0] ?? ZOOM_MIN
  const maxZoom = effectiveZoomLevels[effectiveZoomLevels.length - 1] ?? ZOOM_MAX

  // Track if we need to calculate 'fit' zoom on mount
  const needsFitZoom = initialZoom === 'fit'
  const initialZoomValue = typeof initialZoom === 'number' ? initialZoom : 1

  const [state, setState] = useState<CanvasTransformState>({
    zoom: initialZoomValue,
    pan: initialPan,
    isPanning: false,
  })

  // Store the initial/default zoom for reset (will be updated after fit calculation)
  const defaultZoomRef = useRef<number>(initialZoomValue)

  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 })
  const spacePressed = useRef(false)

  // Find the nearest zoom level from the available levels
  const findNearestZoomLevel = useCallback((targetZoom: number): number => {
    let nearest = effectiveZoomLevels[0]
    let minDiff = Math.abs(targetZoom - nearest)

    for (const level of effectiveZoomLevels) {
      const diff = Math.abs(targetZoom - level)
      if (diff < minDiff) {
        minDiff = diff
        nearest = level
      }
    }
    return nearest
  }, [effectiveZoomLevels])

  const setZoom = useCallback((newZoom: number, focalPoint?: Point) => {
    setState((prev) => {
      const clampedZoom = Math.min(maxZoom, Math.max(minZoom, newZoom))

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
  }, [minZoom, maxZoom])

  const setPan = useCallback((pan: Point) => {
    setState((prev) => ({ ...prev, pan }))
  }, [])

  // Find next zoom level up from current
  const getNextZoomLevel = useCallback((currentZoom: number): number => {
    for (const level of effectiveZoomLevels) {
      if (level > currentZoom + 0.001) {  // Small epsilon for floating point
        return level
      }
    }
    return effectiveZoomLevels[effectiveZoomLevels.length - 1]
  }, [effectiveZoomLevels])

  // Find next zoom level down from current
  const getPrevZoomLevel = useCallback((currentZoom: number): number => {
    for (let i = effectiveZoomLevels.length - 1; i >= 0; i--) {
      if (effectiveZoomLevels[i] < currentZoom - 0.001) {  // Small epsilon for floating point
        return effectiveZoomLevels[i]
      }
    }
    return effectiveZoomLevels[0]
  }, [effectiveZoomLevels])

  const zoomIn = useCallback(
    (focalPoint?: Point) => {
      setState((prev) => {
        const newZoom = getNextZoomLevel(prev.zoom)
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
    [getNextZoomLevel]
  )

  const zoomOut = useCallback(
    (focalPoint?: Point) => {
      setState((prev) => {
        const newZoom = getPrevZoomLevel(prev.zoom)
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
    [getPrevZoomLevel]
  )

  const resetTransform = useCallback(() => {
    setState({ zoom: defaultZoomRef.current, pan: { x: 0, y: 0 }, isPanning: false })
  }, [])

  const fitToView = useCallback((size: { width: number; height: number }, padding = 40) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = (rect.width - padding * 2) / size.width
    const scaleY = (rect.height - padding * 2) / size.height
    const rawZoom = Math.min(scaleX, scaleY, 1)  // Cap at 100%

    // Round to nearest zoom step
    const roundedZoom = findNearestZoomLevel(rawZoom)

    const panX = (rect.width - size.width * roundedZoom) / 2
    const panY = (rect.height - size.height * roundedZoom) / 2

    setState({ zoom: roundedZoom, pan: { x: panX, y: panY }, isPanning: false })

    return roundedZoom  // Return for use in initial 'fit' calculation
  }, [findNearestZoomLevel])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()  // Prevent scroll events from escaping the container

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

  // Handle initial 'fit' calculation on mount
  const hasFittedRef = useRef(false)
  useEffect(() => {
    if (needsFitZoom && contentSize && containerRef.current && !hasFittedRef.current) {
      hasFittedRef.current = true

      const rect = containerRef.current.getBoundingClientRect()
      const padding = 40
      const scaleX = (rect.width - padding * 2) / contentSize.width
      const scaleY = (rect.height - padding * 2) / contentSize.height
      const rawZoom = Math.min(scaleX, scaleY, 1)  // Cap at 100%

      // Round to nearest zoom step
      const fittedZoom = findNearestZoomLevel(rawZoom)
      defaultZoomRef.current = fittedZoom  // Store for reset

      const panX = (rect.width - contentSize.width * fittedZoom) / 2
      const panY = (rect.height - contentSize.height * fittedZoom) / 2

      setState({ zoom: fittedZoom, pan: { x: panX, y: panY }, isPanning: false })
    }
  }, [needsFitZoom, contentSize, findNearestZoomLevel])

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
    minZoom,
    maxZoom,
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
