import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Same node interface as our SVG renderer
interface DiagramNode {
  id: string
  x: number
  y: number
  elevation: number
  width: number
  depth: number
  height: number
  color: string
  label: string
}

interface ThreeRendererProps {
  nodes: DiagramNode[]
  onNodeMove?: (id: string, x: number, y: number) => void
  width?: number
  height?: number
}

// Color palette matching our SVG renderer
const COLOR_MAP: Record<string, { top: number; side: number; front: number }> = {
  blue: { top: 0x60a5fa, side: 0x3b82f6, front: 0x2563eb },
  violet: { top: 0xa78bfa, side: 0x8b5cf6, front: 0x7c3aed },
  cyan: { top: 0x22d3ee, side: 0x06b6d4, front: 0x0891b2 },
  emerald: { top: 0x34d399, side: 0x10b981, front: 0x059669 },
  amber: { top: 0xfbbf24, side: 0xf59e0b, front: 0xd97706 },
  rose: { top: 0xfb7185, side: 0xf43f5e, front: 0xe11d48 },
  slate: { top: 0x94a3b8, side: 0x64748b, front: 0x475569 },
}

export default function ThreeRenderer({ nodes, onNodeMove, width = 500, height = 400 }: ThreeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sceneReady, setSceneReady] = useState(0) // Increment to trigger node updates
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.OrthographicCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
  } | null>(null)
  const dragRef = useRef<{
    isDragging: boolean
    object: THREE.Mesh | null
    plane: THREE.Plane
    offset: THREE.Vector3
    intersection: THREE.Vector3
  }>({
    isDragging: false,
    object: null,
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), // XZ plane (Y=up)
    offset: new THREE.Vector3(),
    intersection: new THREE.Vector3(),
  })
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    // Clean up any existing canvas (handles React StrictMode double-mount)
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild)
    }

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a) // slate-900

    // Orthographic camera for isometric view (no perspective distortion)
    const aspect = width / height
    const frustumSize = 400
    const camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      2000
    )

    // Position camera for isometric view matching SVG renderer
    //
    // COORDINATE MAPPING:
    //   Our system:      Three.js:
    //   X (right)    ->  X (right)
    //   Y (depth)    ->  Z (depth, +Z = toward camera in Three.js default)
    //   Z (up)       ->  Y (up)
    //
    // SVG isometric: screenX = (x - y) * cos30, screenY = -(x + y) * sin30 - z
    //   - Origin at canvas bottom, +X,+Y,+Z go UP on screen
    //   - +X goes UP-RIGHT, +Y goes UP-LEFT, +Z goes straight UP
    //   - This is viewing from "front-left-below" looking UP at the positive quadrant
    //
    // For Three.js to match this orientation:
    //   - Camera at NEGATIVE Three.js Z (negative our Y) = in front of scene
    //   - Camera at NEGATIVE Three.js X (negative our X) = to the left of scene
    //   - Camera at POSITIVE Three.js Y (positive our Z) = above the scene
    //
    // This creates a view where objects in positive X,Y,Z extend up-right from the camera's POV
    //
    // Node positions in THREE.JS coordinates:
    //   Client:   x=40, y=10, z=25   (center of 80x20x50 box at our 0,0,0)
    //   API:      x=165, y=52, z=27  (at our 120,0,40)
    //   Service:  x=290, y=90, z=25  (at our 250,0,80)
    //   Database: x=290, y=9, z=125  (at our 250,100,0)
    //
    // Scene center - Z is now negated, so nodes span Z from 0 to -125 (roughly)
    const sceneCenter = { x: 150, y: 45, z: -50 }

    // Camera position for isometric-like view where:
    //   - +X (our X) goes to the RIGHT on screen
    //   - +Y (our depth) mapped to -Z, so objects at high Y appear to the LEFT
    //   - +Z (our elevation) goes UP on screen
    //
    // Camera at (-X, +Y, +Z) relative to scene center
    // This views from front-left-above, looking toward positive X and negative Z
    camera.position.set(
      sceneCenter.x - 400,   // LEFT of scene (so +X objects appear on RIGHT)
      sceneCenter.y + 350,   // ABOVE scene
      sceneCenter.z + 350    // BEHIND scene (positive Z, so -Z/high-Y objects appear LEFT)
    )
    camera.lookAt(sceneCenter.x, sceneCenter.y, sceneCenter.z)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // Orbit controls - use scene center defined above
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(sceneCenter.x, sceneCenter.y, sceneCenter.z)
    controls.update()

    // Lighting - position light to match isometric shading from SVG
    // Light comes from front-right-above in our system
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    // Light from positive X (right), positive Y (up in Three.js = our Z), negative Z (front = our negative Y)
    directionalLight.position.set(300, 400, -200)
    scene.add(directionalLight)

    // Grid helper on the floor (XZ plane in Three.js = XY floor in our system)
    // Z is negated, so grid centered at negative Z
    const gridHelper = new THREE.GridHelper(400, 8, 0x334155, 0x1e293b)
    gridHelper.position.set(150, 0, -50)
    scene.add(gridHelper)

    // Custom colored axes at origin
    // X axis (red) - Three.js +X direction (our +X)
    const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(200, 0, 0)
    ])
    const xAxis = new THREE.Line(xAxisGeom, new THREE.LineBasicMaterial({ color: 0xf87171, linewidth: 3 }))
    scene.add(xAxis)

    // Y axis (green in our system) - Three.js NEGATIVE Z direction (our +Y is negated to -Z)
    const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -200)  // Negative Z direction
    ])
    const yAxis = new THREE.Line(yAxisGeom, new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 3 }))
    scene.add(yAxis)

    // Z axis (blue in our system) - Three.js +Y direction (up)
    const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 150, 0)
    ])
    const zAxis = new THREE.Line(zAxisGeom, new THREE.LineBasicMaterial({ color: 0x60a5fa, linewidth: 3 }))
    scene.add(zAxis)

    sceneRef.current = { scene, camera, renderer, controls }

    // Trigger node updates now that scene is ready
    setSceneReady(prev => prev + 1)

    // Mouse event handlers for dragging
    const onMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.current.setFromCamera(mouse.current, camera)

      const meshes = scene.children.filter(
        (child): child is THREE.Mesh => child instanceof THREE.Mesh && child.userData.isNode
      )
      const intersects = raycaster.current.intersectObjects(meshes)

      if (intersects.length > 0) {
        controls.enabled = false
        dragRef.current.isDragging = true
        dragRef.current.object = intersects[0].object as THREE.Mesh

        // Set the drag plane at the object's Y position
        const obj = dragRef.current.object
        dragRef.current.plane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, obj.position.y, 0)
        )

        if (raycaster.current.ray.intersectPlane(dragRef.current.plane, dragRef.current.intersection)) {
          dragRef.current.offset.copy(dragRef.current.intersection).sub(obj.position)
        }

        renderer.domElement.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!dragRef.current.isDragging || !dragRef.current.object) return

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.current.setFromCamera(mouse.current, camera)

      if (raycaster.current.ray.intersectPlane(dragRef.current.plane, dragRef.current.intersection)) {
        const newPos = dragRef.current.intersection.sub(dragRef.current.offset)
        dragRef.current.object.position.x = newPos.x
        dragRef.current.object.position.z = newPos.z
      }
    }

    const onMouseUp = () => {
      if (dragRef.current.isDragging && dragRef.current.object && onNodeMove) {
        const obj = dragRef.current.object
        const nodeId = obj.userData.nodeId
        const node = nodes.find(n => n.id === nodeId)
        if (node) {
          // Convert Three.js position back to our coordinate system
          // Three.js X = ourX + width/2, so ourX = X - width/2
          // Three.js Z = -(ourY + depth/2), so ourY = -Z - depth/2
          const newX = Math.round(obj.position.x - node.width / 2)
          const newY = Math.round(-obj.position.z - node.depth / 2)
          onNodeMove(nodeId, newX, newY)
        }
      }

      dragRef.current.isDragging = false
      dragRef.current.object = null
      controls.enabled = true
      renderer.domElement.style.cursor = 'grab'
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('mouseleave', onMouseUp)
    renderer.domElement.style.cursor = 'grab'

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('mouseleave', onMouseUp)
      renderer.dispose()
      controls.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [width, height])

  // Update nodes when they change or scene becomes ready
  useEffect(() => {
    if (!sceneRef.current || sceneReady === 0) return
    const { scene } = sceneRef.current

    // Remove existing node meshes
    const toRemove: THREE.Object3D[] = []
    scene.traverse((child) => {
      if (child.userData.isNode) {
        toRemove.push(child)
      }
    })
    toRemove.forEach((obj) => scene.remove(obj))

    // Add nodes as 3D boxes
    nodes.forEach((node) => {
      const colors = COLOR_MAP[node.color] || COLOR_MAP.slate

      // Create box geometry
      // Note: Three.js Y is up, so we map our elevation to Y
      const geometry = new THREE.BoxGeometry(node.width, node.height, node.depth)

      // Create materials for each face (matching our SVG shading)
      const materials = [
        new THREE.MeshLambertMaterial({ color: colors.side }),   // right
        new THREE.MeshLambertMaterial({ color: colors.side }),   // left
        new THREE.MeshLambertMaterial({ color: colors.top }),    // top
        new THREE.MeshLambertMaterial({ color: colors.front }),  // bottom
        new THREE.MeshLambertMaterial({ color: colors.front }),  // front
        new THREE.MeshLambertMaterial({ color: colors.side }),   // back
      ]

      const mesh = new THREE.Mesh(geometry, materials)

      // Position: Our X → Three.js X, Our Y → NEGATIVE Three.js Z (flipped), Our Z → Three.js Y
      mesh.position.set(
        node.x + node.width / 2,
        node.elevation + node.height / 2,
        -(node.y + node.depth / 2)  // Negate to flip Y direction
      )

      mesh.userData.isNode = true
      mesh.userData.nodeId = node.id
      scene.add(mesh)

      // Add label sprite
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 256
      canvas.height = 64
      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label, 128, 32)

      const texture = new THREE.CanvasTexture(canvas)
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      })
      const sprite = new THREE.Sprite(spriteMaterial)
      sprite.position.set(
        node.x + node.width / 2,
        node.elevation + node.height + 15,
        -(node.y + node.depth / 2)  // Negate to match mesh
      )
      sprite.scale.set(60, 15, 1)
      sprite.userData.isNode = true
      scene.add(sprite)
    })
  }, [nodes, sceneReady])

  return (
    <div className="relative">
      <div ref={containerRef} className="rounded-lg overflow-hidden" />
      <div className="absolute top-2 left-2 text-[10px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
        Drag boxes to move · Drag space to orbit · Scroll to zoom
      </div>
    </div>
  )
}
