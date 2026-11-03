'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { soundFX } from '@/lib/audioEffects'
import {
  HeartPulse,
  RotateCcw,
  Sparkles,
  Video,
  Volume2,
  VolumeX,
  Activity,
} from 'lucide-react'

export interface BiomarkerData {
  id: string
  name: string
  metric: string
  status: 'optimal' | 'stable' | 'active'
  category: string
  description: string
  color: number
  hexColor: string
}

const BIOMARKERS: BiomarkerData[] = [
  {
    id: 'cardio',
    name: 'Cardiovascular Vitality',
    metric: '72 BPM • 118/76 mmHg',
    status: 'optimal',
    category: 'Heart & Hemodynamics',
    description: 'Autonomous rhythm analysis with synchronized QRS waveform and cardiac output.',
    color: 0x38bdf8,
    hexColor: '#38bdf8',
  },
  {
    id: 'neural',
    name: 'Cognitive & Neural Sync',
    metric: '99.4% Coherence',
    status: 'optimal',
    category: 'Neuro-Synaptic Axis',
    description: 'Multi-modal conversational empathy mapping with low-latency phoneme alignment.',
    color: 0x818cf8,
    hexColor: '#818cf8',
  },
  {
    id: 'immune',
    name: 'Clinical Safety Protocol',
    metric: 'Level 1-4 Active',
    status: 'stable',
    category: 'Triage Engine',
    description: 'Deterministic 4-tier clinical risk screening with instant 112 emergency escalation.',
    color: 0x34d399,
    hexColor: '#34d399',
  },
  {
    id: 'respiratory',
    name: 'Oxygenation & Lung Dynamics',
    metric: '99% SpO2 • 14 rpm',
    status: 'optimal',
    category: 'Pulmonary Dynamics',
    description: 'Natural respiratory cycle monitoring and acoustic speech cadence analysis.',
    color: 0x2dd4bf,
    hexColor: '#2dd4bf',
  },
  {
    id: 'metabolic',
    name: 'Metabolic & Lab Analytics',
    metric: '48 Biomarkers',
    status: 'active',
    category: 'Document Intelligence',
    description: 'Computer-vision CBC, lipid panel, and thyroid automated report interpretation.',
    color: 0xfbbf24,
    hexColor: '#fbbf24',
  },
  {
    id: 'cellular',
    name: 'Stress & Autonomic Balance',
    metric: 'HRV 68ms • Calm',
    status: 'optimal',
    category: 'Mind & Wellbeing',
    description: 'Empathetic stress management, guided breathing exercises, and autonomic balance.',
    color: 0xc084fc,
    hexColor: '#c084fc',
  },
]

interface Hero3DSceneProps {
  onSelectDoctor?: (doctorId: 'dr_arjun' | 'dr_ananya') => void
}

export function Hero3DScene({ onSelectDoctor }: Hero3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animFrameId = useRef<number | null>(null)

  const [activeBiomarker, setActiveBiomarker] = useState<BiomarkerData>(BIOMARKERS[0])
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hologramMode, setHologramMode] = useState<'dna' | 'doctor'>('dna')
  const [selectedDoctorId, setSelectedDoctorId] = useState<'dr_arjun' | 'dr_ananya'>('dr_arjun')
  const [isRotating, setIsRotating] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)

  const interactiveNodesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const dnaGroupRef = useRef<THREE.Group | null>(null)
  const particlesRef = useRef<THREE.Points | null>(null)
  const doctorAvatarGroupRef = useRef<THREE.Group | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, prevX: 0, prevY: 0 })
  const raycasterRef = useRef(new THREE.Raycaster())

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundFX.setEnabled(next)
    if (next) soundFX.playTelemetryPing()
  }

  const setupScene = useCallback(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x030712, 0.045)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 8.2)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.0)
    keyLight.position.set(4, 5, 4)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.5)
    rimLight.position.set(-4, -3, -3)
    scene.add(rimLight)

    // 1. Holographic DNA Double Helix & Neural Core
    const dnaGroup = new THREE.Group()
    dnaGroupRef.current = dnaGroup
    scene.add(dnaGroup)

    const rungCount = 34
    const strandRadius = 1.3
    const heightSpan = 5.0

    const strandMat1 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    })

    const strandMat2 = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    })

    const rungMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    })

    for (let i = 0; i < rungCount; i++) {
      const progress = i / (rungCount - 1)
      const y = (progress - 0.5) * heightSpan
      const angle = progress * Math.PI * 4.2

      const x1 = Math.cos(angle) * strandRadius
      const z1 = Math.sin(angle) * strandRadius
      const x2 = Math.cos(angle + Math.PI) * strandRadius
      const z2 = Math.sin(angle + Math.PI) * strandRadius

      const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16)
      const node1 = new THREE.Mesh(nodeGeo, strandMat1)
      node1.position.set(x1, y, z1)
      dnaGroup.add(node1)

      const node2 = new THREE.Mesh(nodeGeo, strandMat2)
      node2.position.set(x2, y, z2)
      dnaGroup.add(node2)

      const rungDist = new THREE.Vector3(x1, y, z1).distanceTo(new THREE.Vector3(x2, y, z2))
      const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, rungDist, 8)
      rungGeo.rotateZ(Math.PI / 2)
      const rung = new THREE.Mesh(rungGeo, rungMat)
      rung.position.set((x1 + x2) / 2, y, (z1 + z2) / 2)
      rung.lookAt(x1, y, z1)
      dnaGroup.add(rung)
    }

    // Concentric Bio-Energy Wireframe Shells
    const innerGeo = new THREE.IcosahedronGeometry(0.75, 2)
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    })
    const innerCore = new THREE.Mesh(innerGeo, innerMat)
    dnaGroup.add(innerCore)

    const outerGeo = new THREE.DodecahedronGeometry(1.05, 1)
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    })
    const outerCore = new THREE.Mesh(outerGeo, outerMat)
    dnaGroup.add(outerCore)

    // 2. Interactive Orbiting Biomarker Nodes
    interactiveNodesRef.current.clear()

    BIOMARKERS.forEach((bio, idx) => {
      const angle = (idx / BIOMARKERS.length) * Math.PI * 2
      const orbitR = 2.6
      const orbitY = Math.sin(idx * 1.5) * 0.9

      const nodeGroup = new THREE.Group()
      nodeGroup.position.set(Math.cos(angle) * orbitR, orbitY, Math.sin(angle) * orbitR)

      const sphereGeo = new THREE.SphereGeometry(0.18, 24, 24)
      const sphereMat = new THREE.MeshStandardMaterial({
        color: bio.color,
        emissive: bio.color,
        emissiveIntensity: 1.2,
        roughness: 0.15,
        metalness: 0.5,
      })
      const sphere = new THREE.Mesh(sphereGeo, sphereMat)
      sphere.userData = { biomarkerId: bio.id }
      nodeGroup.add(sphere)

      const ringGeo = new THREE.RingGeometry(0.24, 0.28, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: bio.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.lookAt(0, 0, 1)
      nodeGroup.add(ring)

      dnaGroup.add(nodeGroup)
      interactiveNodesRef.current.set(bio.id, sphere)
    })

    // 3. Bio-Luminescent Particle Vortex
    const particleCount = 1200
    const particleGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(particleCount * 3)
    const colorArray = new Float32Array(particleCount * 3)

    const c1 = new THREE.Color(0x38bdf8)
    const c2 = new THREE.Color(0x818cf8)
    const c3 = new THREE.Color(0x34d399)

    for (let i = 0; i < particleCount; i++) {
      const r = 1.2 + Math.random() * 4.2
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 6.2

      posArray[i * 3] = Math.cos(theta) * r
      posArray[i * 3 + 1] = y
      posArray[i * 3 + 2] = Math.sin(theta) * r

      const mix = Math.random()
      const color = mix < 0.45 ? c1 : mix < 0.85 ? c2 : c3
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeo, particleMat)
    particlesRef.current = particles
    scene.add(particles)

    // 4. Procedural 3D Doctor Hologram Model
    const docGroup = new THREE.Group()
    docGroup.visible = false
    docGroup.position.set(0, -1.8, 0)
    doctorAvatarGroupRef.current = docGroup
    scene.add(docGroup)

    const holoMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    })

    const docTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 2.2, 24), holoMat)
    docTorso.position.y = 1.1
    docGroup.add(docTorso)

    const docHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 24), holoMat)
    docHead.position.y = 2.65
    docGroup.add(docHead)

    const steth = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.05, 12, 32, Math.PI), holoMat)
    steth.position.set(0, 1.8, 0.45)
    steth.rotation.x = Math.PI / 2
    docGroup.add(steth)
  }, [])

  useEffect(() => {
    setupScene()

    const handleResize = () => {
      const container = mountRef.current
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      rendererRef.current?.dispose()
      if (mountRef.current && rendererRef.current?.domElement) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
  }, [setupScene])

  const handlePointerDown = (e: React.PointerEvent) => {
    mousePosRef.current.isDragging = true
    mousePosRef.current.prevX = e.clientX
    mousePosRef.current.prevY = e.clientY
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = mountRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

    mousePosRef.current.targetX = ndcX * 0.45
    mousePosRef.current.targetY = ndcY * 0.35

    if (mousePosRef.current.isDragging) {
      const deltaX = e.clientX - mousePosRef.current.prevX
      const deltaY = e.clientY - mousePosRef.current.prevY
      mousePosRef.current.prevX = e.clientX
      mousePosRef.current.prevY = e.clientY

      if (dnaGroupRef.current) {
        dnaGroupRef.current.rotation.y += deltaX * 0.008
        dnaGroupRef.current.rotation.x += deltaY * 0.008
      }
      if (doctorAvatarGroupRef.current) {
        doctorAvatarGroupRef.current.rotation.y += deltaX * 0.008
      }
    }

    if (cameraRef.current && hologramMode === 'dna') {
      raycasterRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current)
      const targetMeshes = Array.from(interactiveNodesRef.current.values())
      const intersects = raycasterRef.current.intersectObjects(targetMeshes)

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        const bId = hit.userData?.biomarkerId
        if (bId && bId !== hoveredNodeId) {
          setHoveredNodeId(bId)
          if (soundEnabled) soundFX.playHover()
        }
      } else if (hoveredNodeId) {
        setHoveredNodeId(null)
      }
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    mousePosRef.current.isDragging = false

    if (cameraRef.current && mountRef.current && hologramMode === 'dna') {
      const rect = mountRef.current.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      raycasterRef.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current)
      const targetMeshes = Array.from(interactiveNodesRef.current.values())
      const intersects = raycasterRef.current.intersectObjects(targetMeshes)

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        const bId = hit.userData?.biomarkerId
        const match = BIOMARKERS.find((b) => b.id === bId)
        if (match) {
          setActiveBiomarker(match)
          if (soundEnabled) soundFX.playClick()
        }
      }
    }
  }

  useEffect(() => {
    const clock = new THREE.Clock()

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      const mouse = mousePosRef.current
      mouse.x += (mouse.targetX - mouse.x) * 0.05
      mouse.y += (mouse.targetY - mouse.y) * 0.05

      if (cameraRef.current) {
        cameraRef.current.position.x = mouse.x * 2.2
        cameraRef.current.position.y = mouse.y * 1.5
        cameraRef.current.lookAt(0, 0, 0)
      }

      if (dnaGroupRef.current) {
        if (isRotating && !mouse.isDragging) {
          dnaGroupRef.current.rotation.y += 0.006
        }
        dnaGroupRef.current.position.y = Math.sin(elapsedTime * 1.2) * 0.12

        interactiveNodesRef.current.forEach((mesh, id) => {
          const isAct = id === activeBiomarker.id
          const isHov = id === hoveredNodeId
          const scale = isAct ? 1.45 : isHov ? 1.3 : 1.0 + Math.sin(elapsedTime * 2.5 + id.length) * 0.08
          mesh.scale.set(scale, scale, scale)
        })
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.035
      }

      if (doctorAvatarGroupRef.current && hologramMode === 'doctor') {
        doctorAvatarGroupRef.current.position.y = -1.8 + Math.sin(elapsedTime * 1.5) * 0.04
        doctorAvatarGroupRef.current.rotation.y = Math.sin(elapsedTime * 0.5) * 0.15 + mouse.x * 0.35
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    }
  }, [activeBiomarker, hoveredNodeId, isRotating, hologramMode])

  const handleToggleMode = (mode: 'dna' | 'doctor') => {
    setHologramMode(mode)
    if (soundEnabled) soundFX.playClick()
    if (dnaGroupRef.current) {
      dnaGroupRef.current.visible = mode === 'dna'
    }
    if (doctorAvatarGroupRef.current) {
      doctorAvatarGroupRef.current.visible = mode === 'doctor'
    }
  }

  const handleResetRotation = () => {
    if (soundEnabled) soundFX.playClick()
    if (dnaGroupRef.current) {
      dnaGroupRef.current.rotation.set(0, 0, 0)
    }
    if (doctorAvatarGroupRef.current) {
      doctorAvatarGroupRef.current.rotation.set(0, 0, 0)
    }
    mousePosRef.current.targetX = 0
    mousePosRef.current.targetY = 0
  }

  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none">
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Cyber HUD Corner Brackets */}
      <div className="pointer-events-none absolute inset-0 z-10 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="w-6 h-6 border-t-2 border-l-2 border-sky-400/70" />
          <div className="w-6 h-6 border-t-2 border-r-2 border-sky-400/70" />
        </div>
        <div className="flex justify-between items-end">
          <div className="w-6 h-6 border-b-2 border-l-2 border-sky-400/70" />
          <div className="w-6 h-6 border-b-2 border-r-2 border-sky-400/70" />
        </div>
      </div>

      {/* Top Bar Controls */}
      <div className="absolute top-5 left-5 right-5 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-pill bg-slate-900/80 border border-slate-700/60 shadow-lg">
          <button
            onClick={() => handleToggleMode('dna')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              hologramMode === 'dna'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles size={14} className={hologramMode === 'dna' ? 'animate-spin' : ''} />
            <span>Bio-Hologram Core</span>
          </button>

          <button
            onClick={() => handleToggleMode('doctor')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              hologramMode === 'doctor'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Video size={14} />
            <span>3D Doctor Hologram</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label="Toggle interaction sound effects"
            className={`p-2 rounded-xl text-xs glass-pill transition-all ${
              soundEnabled
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title={soundEnabled ? 'Mute micro-audio' : 'Enable interactive sound effects'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          <button
            onClick={() => setIsRotating(!isRotating)}
            aria-label="Toggle auto rotation"
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium glass-pill transition-all ${
              isRotating
                ? 'text-sky-300 bg-sky-950/60 border-sky-700/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            {isRotating ? 'Orbit Active' : 'Orbit Paused'}
          </button>

          <button
            onClick={handleResetRotation}
            aria-label="Reset 3D camera angle"
            className="p-2 rounded-xl text-xs text-slate-400 hover:text-white glass-pill hover:bg-slate-800/60 transition-all"
            title="Reset 3D View"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Active Biomarker HUD Telemetry Overlay */}
      {hologramMode === 'dna' && (
        <div className="absolute bottom-5 left-5 z-20 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto glass-card p-4 rounded-2xl border border-sky-500/30 shadow-2xl backdrop-blur-xl animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: activeBiomarker.hexColor }}
              />
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300 font-semibold">
                {activeBiomarker.category}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-emerald-300 border border-emerald-500/30">
              Interactive 3D Node
            </span>
          </div>

          <h3 className="text-base font-bold text-white mb-1">{activeBiomarker.name}</h3>
          <p className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 font-mono mb-2">
            {activeBiomarker.metric}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            {activeBiomarker.description}
          </p>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-500 font-mono">
              Click any 3D node to inspect
            </span>
            {onSelectDoctor && (
              <button
                onClick={() => onSelectDoctor('dr_arjun')}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
              >
                <span>Consult Doctor</span>
                <HeartPulse size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D Doctor Hologram Overlay Card */}
      {hologramMode === 'doctor' && (
        <div className="absolute bottom-5 left-5 z-20 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto glass-card p-5 rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDoctorId === 'dr_arjun' ? '/doctor/dr_arjun.jpg' : '/doctor/dr_ananya.jpg'}
                alt={selectedDoctorId === 'dr_arjun' ? 'Dr. Smit' : 'Dr. Ananya'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {selectedDoctorId === 'dr_arjun' ? 'Dr. Smit, M.D.' : 'Dr. Ananya, M.D.'}
              </h3>
              <p className="text-xs text-sky-400">
                {selectedDoctorId === 'dr_arjun' ? 'General Physician & Triage' : 'Diagnostic Lab & Wellness'}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Direct WebGL 3D Consultation with photorealistic lip-sync, viseme kinematics, and voice recognition in English, Kannada, and Hindi.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectDoctor?.(selectedDoctorId)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
            >
              <Video size={14} />
              <span>Launch Full 3D Call</span>
            </button>
            <button
              onClick={() =>
                setSelectedDoctorId(selectedDoctorId === 'dr_arjun' ? 'dr_ananya' : 'dr_arjun')
              }
              className="px-3 py-2.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Switch Doctor
            </button>
          </div>
        </div>
      )}

      {/* Instruction Pill */}
      <div className="absolute bottom-5 right-5 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill text-[11px] text-slate-400 font-mono pointer-events-none">
        <Activity size={13} className="text-sky-400 animate-pulse" />
        <span>Drag to rotate 3D space • Hover or click nodes</span>
      </div>
    </div>
  )
}
