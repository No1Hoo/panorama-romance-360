import { type PointerEvent, type WheelEvent, useEffect, useRef } from 'react'
import * as THREE from 'three'

type PanoramaViewerProps = {
  image: string
  onYawChange: (yaw: number) => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function PanoramaViewer({ image, onYawChange }: PanoramaViewerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null)
  const lonRef = useRef(0)
  const latRef = useRef(0)
  const dragRef = useRef<{ x: number; y: number; lon: number; lat: number } | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 1, 1100)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    const geometry = new THREE.SphereGeometry(500, 80, 48)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
    const sphere = new THREE.Mesh(geometry, material)
    let frame = 0

    scene.add(sphere)

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    rendererRef.current = renderer
    cameraRef.current = camera
    materialRef.current = material

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const animate = () => {
      latRef.current = clamp(latRef.current, -72, 72)
      const phi = THREE.MathUtils.degToRad(90 - latRef.current)
      const theta = THREE.MathUtils.degToRad(lonRef.current)
      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      )

      camera.lookAt(target)
      renderer.render(scene, camera)
      onYawChange((lonRef.current + 360) % 360)
      frame = window.requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      geometry.dispose()
      material.map?.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
      rendererRef.current = null
      cameraRef.current = null
      materialRef.current = null
    }
  }, [onYawChange])

  useEffect(() => {
    const material = materialRef.current
    if (!material) return

    let cancelled = false
    const loader = new THREE.TextureLoader()

    loader.load(image, (texture) => {
      if (cancelled) {
        texture.dispose()
        return
      }

      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      material.map?.dispose()
      material.map = texture
      material.needsUpdate = true
    })

    return () => {
      cancelled = true
    }
  }, [image])

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      lon: lonRef.current,
      lat: latRef.current,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return

    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    lonRef.current = dragRef.current.lon - dx * 0.12
    latRef.current = dragRef.current.lat + dy * 0.1
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const camera = cameraRef.current
    if (!camera) return

    camera.fov = clamp(camera.fov + event.deltaY * 0.02, 45, 92)
    camera.updateProjectionMatrix()
  }

  return (
    <div
      aria-hidden="true"
      className="panorama-canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      ref={hostRef}
    />
  )
}

export default PanoramaViewer
