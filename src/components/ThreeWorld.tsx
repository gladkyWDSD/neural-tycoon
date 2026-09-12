import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { GameState } from '../game/types'
import { activeCards } from '../game/gpu'
import { maxStaff, cardsTraining } from '../game/state'
import type { Job } from './OfficeView'
import { buildWorld, type Place3D } from './three/scenes'
import './ThreeWorld.css'

interface Props {
  state: GameState
  jobs: Job[]
  place: Place3D
  onPlace: (place: Place3D) => void
  onStaffMenu: (id: string, x: number, y: number) => void
  onFallback: () => void
}
const TITLES: Record<Place3D, string> = { office: 'Headquarters', campus: 'Company campus', lab: 'Research lab', hall: 'Datacenter' }

export default function ThreeWorld(props: Props) {
  const { state, jobs, place, onPlace, onFallback } = props
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  useEffect(() => { latest.current = props })
  const reset = useRef<() => void>(() => {})
  const [hover, setHover] = useState('')
  const [failed, setFailed] = useState(false)
  // Simulation ticks update the HUD without recreating geometry or resetting the camera.
  const structure = JSON.stringify([place, maxStaff(state), state.officeLevel, state.companyName,
    state.staff.map(person => [person.id, person.name, person.role]), state.sabbaticals,
    state.amenities, state.datacenters, state.rentedDatacenters, state.fabs, state.dataSources, activeCards(state)])

  useEffect(() => {
    const element = host.current
    if (!element) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch {
      const failure = requestAnimationFrame(() => setFailed(true))
      return () => cancelAnimationFrame(failure)
    }
    const world = buildWorld(place, latest.current.state)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(place === 'campus' ? '#a8c9d1' : '#7697a6')
    scene.add(world.root)
    scene.add(new THREE.HemisphereLight('#e4f5ff', '#736e55', 2.5))
    const sun = new THREE.DirectionalLight('#fff0d3', 3.2)
    sun.position.set(-12, 25, 15)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const span = Math.max(world.width, world.depth) * 0.75
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 100 })
    sun.shadow.bias = -0.0005
    sun.shadow.normalBias = 0.04
    scene.add(sun)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.setAttribute('aria-label', `${TITLES[place]} 3D scene. Drag to rotate, scroll to zoom; click people or buildings.`)
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.tabIndex = 0
    element.appendChild(renderer.domElement)
    const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 250)
    camera.position.set(25, 28, 34)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.8, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.09
    controls.minPolarAngle = 0.25
    controls.maxPolarAngle = Math.PI / 2 - 0.12
    controls.minZoom = 0.6
    controls.maxZoom = 4
    controls.enablePan = false
    controls.update()
    const fit = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width < 1 || height < 1) return
      const aspect = width / height
      // Fit the room's projected bounds, including its walls, at any screen shape.
      const bounds = new THREE.Box3().setFromObject(world.root)
      camera.zoom = 1
      camera.updateMatrixWorld()
      let halfW = 0, halfH = 0
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const p = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse)
        halfW = Math.max(halfW, Math.abs(p.x)); halfH = Math.max(halfH, Math.abs(p.y))
      }
      const vertical = Math.max(halfH, halfW / aspect) * 1.12
      camera.left = -vertical * aspect; camera.right = vertical * aspect
      camera.top = vertical; camera.bottom = -vertical
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    reset.current = () => {
      controls.target.set(0, 0.8, 0)
      camera.position.set(25, 28, 34)
      controls.update()
      fit()
    }
    reset.current()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pick = (event: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(world.root, true)[0]
      if (hit?.instanceId !== undefined) return hit.object.userData.targets?.[hit.instanceId] as { label?: string; place?: Place3D; staffId?: string } | undefined
      let object: THREE.Object3D | null = hit?.object ?? null
      while (object && !object.userData.label) object = object.parent
      return object?.userData as { label?: string; place?: Place3D; staffId?: string } | undefined
    }
    let down: { x: number; y: number; id: number } | null = null
    const onDown = (event: PointerEvent) => {
      if (down) { down = null; return }
      if (event.button === 0) down = { x: event.clientX, y: event.clientY, id: event.pointerId }
    }
    const onMove = (event: PointerEvent) => {
      if (event.buttons) return
      const hit = pick(event)
      setHover(hit?.label ?? '')
      renderer.domElement.style.cursor = hit?.place || hit?.staffId ? 'pointer' : 'grab'
    }
    const onUp = (event: PointerEvent) => {
      if (!down || event.pointerId !== down.id) return
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
      down = null
      if (moved > 6) return
      const hit = pick(event)
      if (hit?.staffId) latest.current.onStaffMenu(hit.staffId, event.clientX, event.clientY)
      else if (hit?.place) { setHover(''); latest.current.onPlace(hit.place) }
    }
    const onContext = (event: MouseEvent) => {
      event.preventDefault()
      const hit = pick(event)
      if (hit?.staffId) latest.current.onStaffMenu(hit.staffId, event.clientX, event.clientY)
    }
    const onCancel = () => { down = null }
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') reset.current()
      if (event.key === '+' || event.key === '=') camera.zoom = Math.min(4, camera.zoom * 1.15)
      if (event.key === '-') camera.zoom = Math.max(0.6, camera.zoom / 1.15)
      camera.updateProjectionMatrix()
    }
    const lost = (event: Event) => { event.preventDefault(); setFailed(true) }
    const canvas = renderer.domElement
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('contextmenu', onContext)
    canvas.addEventListener('keydown', onKey)
    canvas.addEventListener('webglcontextlost', lost)
    let last = 0, elapsed = 0
    renderer.setAnimationLoop((time: number) => {
      const delta = Math.min((time - last) / 1000, 0.1)
      last = time
      if (document.hidden) return
      if (!latest.current.state.paused) elapsed += delta
      world.models.animations.forEach(animate => animate(elapsed))
      controls.update()
      renderer.render(scene, camera)
    })
    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('contextmenu', onContext)
      canvas.removeEventListener('keydown', onKey)
      canvas.removeEventListener('webglcontextlost', lost)
      controls.dispose()
      world.root.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose() })
      world.models.dispose()
      sun.shadow.map?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    }
  }, [place, structure])

  return <div className="world3d">
    <div className="world3d-toolbar">
      <div className="world3d-title"><span className="world3d-dot" />{TITLES[place]}<small>3D</small></div>
      <nav aria-label="Game locations">
        {(['office', 'campus', 'lab', 'hall'] as const).map(room => <button key={room}
          aria-current={room === place ? 'page' : undefined} onClick={() => { setHover(''); setFailed(false); onPlace(room) }}>
          {{ office: 'Office', campus: 'Campus', lab: 'Lab', hall: 'Servers' }[room]}</button>)}
      </nav>
    </div>
    <div className="world3d-viewport" ref={host} />
    {failed && <div className="world3d-error"><p>3D rendering isn’t available in this browser.</p><button onClick={onFallback}>Continue in 2D</button></div>}
    <div className="world3d-bottom">
      <span>{hover || (place === 'hall' ? `${activeCards(state)} powered GPUs · ${cardsTraining(state)} training`
        : place === 'lab' && state.chipDesign ? `Gen ${state.chipDesign.toLevel} tape-out · ${Math.ceil(state.chipDesign.weeksRemaining)} weeks`
        : 'Drag to rotate · Scroll or pinch to zoom · Tap to select')}</span>
      <button onClick={() => reset.current()}>Reset view</button>
    </div>
    {jobs.length > 0 && <div className="world3d-jobs" aria-label="Active jobs">{jobs.map(job => <div key={job.id}>
      <span>{job.label}</span><progress aria-label={job.label} value={Math.max(0, Math.min(1, job.progress))} max={1} />
    </div>)}</div>}
  </div>
}
