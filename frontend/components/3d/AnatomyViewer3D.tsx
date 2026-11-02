'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { soundFX } from '@/lib/audioEffects'
import {
  Heart,
  Brain,
  Wind,
  Dna,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react'

type SystemId = 'cardio' | 'neural' | 'pulmonary' | 'cellular'

interface OrganSystem {
  id: SystemId
  title: string
  subtitle: string
  icon: typeof Heart
  color: number
  hexColor: string
  description: string
  clinicalMetrics: { label: string; value: string; unit: string }[]
}

const SYSTEMS: OrganSystem[] = [
  {
    id: 'cardio',
    title: 'Cardiovascular System',
    subtitle: 'Myocardial & Hemodynamic Diagnostics',
    icon: Heart,
    color: 0xef4444,
    hexColor: '#ef4444',
    description:
      'Real-time myocardial rhythm analysis with QRS complex telemetry, stroke volume assessment, and coronary vascular resistance tracking.',
    clinicalMetrics: [
      { label: 'Resting Heart Rate', value: '72', unit: 'BPM' },
      { label: 'Blood Pressure', value: '118/76', unit: 'mmHg' },
      { label: 'Ejection Fraction', value: '62%', unit: 'EF' },
      { label: 'Cardiac Output', value: '5.2', unit: 'L/min' },
    ],
  },
  {
    id: 'neural',
    title: 'Neuro-Synaptic Axis',
    subtitle: 'Cerebral Cortex & Autonomic Regulation',
    icon: Brain,
    color: 0x818cf8,
    hexColor: '#818cf8',
    description:
      'Synaptic coherence evaluation with multi-modal neural pattern recognition, cognitive stress load index, and vagal nerve tone estimation.',
    clinicalMetrics: [
      { label: 'Synaptic Coherence', value: '99.4%', unit: 'Sync' },
      { label: 'HRV Autonomic Tone', value: '68', unit: 'ms' },
      { label: 'Stress Biomarker Index', value: '18', unit: '/100 (Calm)' },
      { label: 'Sleep Recovery Phase', value: '88%', unit: 'REM' },
    ],
  },
  {
    id: 'pulmonary',
    title: 'Pulmonary Architecture',
    subtitle: 'Respiratory Cadence & Gas Exchange',
    icon: Wind,
    color: 0x06b6d4,
    hexColor: '#06b6d4',
    description:
      'Dynamic broncho-alveolar expansion monitoring, peak inspiratory flow, acoustic breath sound analysis, and oxygen saturation dynamics.',
    clinicalMetrics: [
      { label: 'Oxygen Saturation', value: '99%', unit: 'SpO2' },
      { label: 'Respiratory Rate', value: '14', unit: 'Breaths/min' },
      { label: 'Vital Lung Capacity', value: '4.8', unit: 'Liters' },
      { label: 'FEV1 / FVC Ratio', value: '84%', unit: 'Index' },
    ],
  },
  {
    id: 'cellular',
    title: 'Biomarker Nanosphere',
    subtitle: 'Hematology, CBC & Immunological Receptors',
    icon: Dna,
    color: 0x10b981,
    hexColor: '#10b981',
    description:
      'Cellular receptor affinity modeling, erythrocyte indices, lipid transport fractions, and immune leukocyte distribution profiles.',
    clinicalMetrics: [
      { label: 'Hemoglobin (Hb)', value: '14.6', unit: 'g/dL' },
      { label: 'Total Leukocyte Count', value: '6,400', unit: '/mcL' },
      { label: 'Platelet Count', value: '280k', unit: '/mcL' },
      { label: 'Total Cholesterol', value: '172', unit: 'mg/dL' },
    ],
  },
]

export function AnatomyViewer3D() {
  const mountRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animFrameId = useRef<number | null>(null)

  const [activeSystemId, setActiveSystemId] = useState<SystemId>('cardio')
  const [isRotating, setIsRotating] = useState(true)
  const [wireframeMode, setWireframeMode] = useState(false)

  const organGroupRef = useRef<THREE.Group | null>(null)
  const mousePosRef = useRef({ isDragging: false, prevX: 0, prevY: 0 })

  const currentSystem = SYSTEMS.find((s) => s.id === activeSystemId) || SYSTEMS[0]

  // Build 3D Organ Models dynamically based on activeSystemId
  const buildOrganMesh = useCallback(
    (scene: THREE.Scene, sysId: SystemId, isWire: boolean) => {
      if (organGroupRef.current) {
        scene.remove(organGroupRef.current)
      }

      const root = new THREE.Group()
      organGroupRef.current = root

      const mainMat = new THREE.MeshStandardMaterial({
        color: currentSystem.color,
        emissive: currentSystem.color,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.6,
        wireframe: isWire,
      })

      const accentMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: currentSystem.color,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        wireframe: isWire,
      })

      if (sysId === 'cardio') {
        // Anatomical Heart Model
        const heartGroup = new THREE.Group()

        // Left & Right Ventricles
        const leftVent = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), mainMat)
        leftVent.scale.set(0.95, 1.4, 0.9)
        leftVent.position.set(-0.25, -0.3, 0)
        leftVent.rotation.z = 0.25
        heartGroup.add(leftVent)

        const rightVent = new THREE.Mesh(new THREE.SphereGeometry(0.78, 32, 32), mainMat)
        rightVent.scale.set(0.9, 1.25, 0.85)
        rightVent.position.set(0.35, -0.25, 0.1)
        rightVent.rotation.z = -0.15
        heartGroup.add(rightVent)

        // Aorta Arch Curve
        const aortaCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.6, 0),
          new THREE.Vector3(-0.2, 1.3, 0),
          new THREE.Vector3(0.5, 1.4, -0.1),
          new THREE.Vector3(0.8, 0.7, -0.3),
        ])
        const aortaMesh = new THREE.Mesh(
          new THREE.TubeGeometry(aortaCurve, 24, 0.24, 16, false),
          accentMat
        )
        heartGroup.add(aortaMesh)

        // Pulmonary Artery
        const pulmCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.1, 0.5, 0.3),
          new THREE.Vector3(0.35, 1.05, 0.3),
          new THREE.Vector3(-0.4, 1.15, -0.1),
        ])
        const pulmMesh = new THREE.Mesh(
          new THREE.TubeGeometry(pulmCurve, 20, 0.18, 16, false),
          mainMat
        )
        heartGroup.add(pulmMesh)

        // Coronary Arteries Network
        for (let i = 0; i < 4; i++) {
          const arteryGeo = new THREE.CylinderGeometry(0.02, 0.04, 1.1, 8)
          const artery = new THREE.Mesh(arteryGeo, accentMat)
          artery.position.set(-0.2 + i * 0.15, -0.2 - i * 0.1, 0.85)
          artery.rotation.z = 0.4 + i * 0.15
          artery.rotation.y = 0.3
          heartGroup.add(artery)
        }

        root.add(heartGroup)
      } else if (sysId === 'neural') {
        // Brain Hemispheres & Synapses
        const brainGroup = new THREE.Group()

        const leftHem = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), mainMat)
        leftHem.scale.set(0.85, 1.1, 1.35)
        leftHem.position.set(-0.5, 0, 0)
        brainGroup.add(leftHem)

        const rightHem = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), mainMat)
        rightHem.scale.set(0.85, 1.1, 1.35)
        rightHem.position.set(0.5, 0, 0)
        brainGroup.add(rightHem)

        // Synaptic Nodes Bursting
        for (let i = 0; i < 18; i++) {
          const synGeo = new THREE.SphereGeometry(0.065, 16, 16)
          const syn = new THREE.Mesh(synGeo, accentMat)
          const theta = Math.random() * Math.PI * 2
          const phi = Math.random() * Math.PI
          const r = 1.25
          syn.position.set(
            Math.sin(phi) * Math.cos(theta) * r,
            Math.sin(phi) * Math.sin(theta) * 0.9,
            Math.cos(phi) * r
          )
          brainGroup.add(syn)
        }

        root.add(brainGroup)
      } else if (sysId === 'pulmonary') {
        // Respiratory Bronchial Tree & Lungs
        const lungGroup = new THREE.Group()

        // Trachea
        const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.2, 20), accentMat)
        trachea.position.set(0, 0.9, 0)
        lungGroup.add(trachea)

        // Left & Right Bronchi
        const leftLung = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.2, 24), mainMat)
        leftLung.position.set(-0.85, -0.4, 0)
        leftLung.rotation.z = 0.15
        lungGroup.add(leftLung)

        const rightLung = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.2, 24), mainMat)
        rightLung.position.set(0.85, -0.4, 0)
        rightLung.rotation.z = -0.15
        lungGroup.add(rightLung)

        root.add(lungGroup)
      } else {
        // Biomarker Cell Sphere with Receptors
        const cellGroup = new THREE.Group()

        const coreCell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 3), mainMat)
        cellGroup.add(coreCell)

        // Surface Receptors
        for (let i = 0; i < 28; i++) {
          const recGroup = new THREE.Group()
          const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8), accentMat)
          stalk.position.y = 0.19
          recGroup.add(stalk)

          const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09), accentMat)
          head.position.y = 0.38
          recGroup.add(head)

          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(Math.random() * 2 - 1)
          const r = 1.2

          recGroup.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          )
          recGroup.lookAt(0, 0, 0)
          recGroup.rotateX(Math.PI / 2)
          cellGroup.add(recGroup)
        }

        root.add(cellGroup)
      }

      scene.add(root)
    },
    [currentSystem]
  )

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 500

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0, 5.8)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8)
    keyLight.position.set(3, 4, 3)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.8)
    fillLight.position.set(-3, -2, -2)
    scene.add(fillLight)

    buildOrganMesh(scene, activeSystemId, wireframeMode)

    const handleResize = () => {
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
      renderer.dispose()
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [activeSystemId, buildOrganMesh, wireframeMode])

  // Mouse Interaction (Orbiting)
  const handlePointerDown = (e: React.PointerEvent) => {
    mousePosRef.current.isDragging = true
    mousePosRef.current.prevX = e.clientX
    mousePosRef.current.prevY = e.clientY
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!mousePosRef.current.isDragging || !organGroupRef.current) return
    const deltaX = e.clientX - mousePosRef.current.prevX
    const deltaY = e.clientY - mousePosRef.current.prevY
    mousePosRef.current.prevX = e.clientX
    mousePosRef.current.prevY = e.clientY

    organGroupRef.current.rotation.y += deltaX * 0.01
    organGroupRef.current.rotation.x += deltaY * 0.01
  }

  const handlePointerUp = () => {
    mousePosRef.current.isDragging = false
  }

  // Animation Loop: Organic heartbeat, breathing, or synaptic pulsation
  useEffect(() => {
    const clock = new THREE.Clock()

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      if (organGroupRef.current) {
        if (isRotating && !mousePosRef.current.isDragging) {
          organGroupRef.current.rotation.y += 0.008
        }

        // Biological Rhythmic Dynamics
        if (activeSystemId === 'cardio') {
          // Double systolic heartbeat pump
          const beat = Math.pow(Math.sin(t * 3.8), 6) * 0.12 + Math.pow(Math.sin(t * 3.8 + 0.3), 8) * 0.08
          organGroupRef.current.scale.set(1 + beat, 1 + beat * 1.1, 1 + beat)
        } else if (activeSystemId === 'pulmonary') {
          // Natural smooth inhalation / exhalation
          const breath = Math.sin(t * 1.8) * 0.08
          organGroupRef.current.scale.set(1 + breath, 1 + breath, 1 + breath)
        } else if (activeSystemId === 'neural') {
          // Gentle floating synaptic ripple
          organGroupRef.current.position.y = Math.sin(t * 2.0) * 0.08
        } else {
          // Cellular receptor spin
          organGroupRef.current.rotation.z = Math.sin(t * 0.8) * 0.1
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    }
  }, [activeSystemId, isRotating])

  const handleSystemSelect = (sysId: SystemId) => {
    setActiveSystemId(sysId)
    soundFX.playClick()
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill mb-3">
          <Sparkles size={13} className="text-sky-400" />
          <span className="text-xs font-mono font-semibold text-sky-300 uppercase tracking-wider">
            Interactive 3D Anatomy & Organ Explorer
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
          Autonomous Physiological Diagnostics
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Explore photorealistic WebGL 3D organ architectures. Inspect hemodynamics, synaptic
          patterns, and cellular biomarkers with real-time clinical parameters.
        </p>
      </div>

      {/* Main 3D Stage & Metric Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive System Selector Tabs */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {SYSTEMS.map((sys) => {
            const Icon = sys.icon
            const isSelected = sys.id === activeSystemId
            return (
              <button
                key={sys.id}
                onClick={() => handleSystemSelect(sys.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isSelected
                    ? 'glass-card border-sky-500/50 shadow-lg shadow-sky-500/10 -translate-y-0.5'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${sys.hexColor}20`,
                    color: sys.hexColor,
                    border: `1px solid ${sys.hexColor}40`,
                  }}
                >
                  <Icon size={22} className={isSelected ? 'animate-pulse' : ''} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-white truncate">{sys.title}</h3>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                        Active 3D
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{sys.subtitle}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Center / Right: 3D WebGL Canvas Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative w-full h-[450px] sm:h-[500px] rounded-3xl glass-panel border border-white/10 overflow-hidden shadow-2xl select-none">
            {/* Canvas Mount */}
            <div
              ref={mountRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            />

            {/* Specular HUD Framing */}
            <div className="pointer-events-none absolute inset-0 p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-5 h-5 border-t border-l border-sky-400/60" />
                <div className="w-5 h-5 border-t border-r border-sky-400/60" />
              </div>
              <div className="flex justify-between items-end">
                <div className="w-5 h-5 border-b border-l border-sky-400/60" />
                <div className="w-5 h-5 border-b border-r border-sky-400/60" />
              </div>
            </div>

            {/* 3D Viewport Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setWireframeMode(!wireframeMode)}
                aria-label="Toggle wireframe rendering mode"
                className={`p-2 rounded-xl text-xs glass-pill transition-all ${
                  wireframeMode
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Toggle Wireframe Shading"
              >
                <Layers size={15} />
              </button>

              <button
                onClick={() => setIsRotating(!isRotating)}
                aria-label="Toggle auto rotation"
                className={`px-3 py-1.5 rounded-xl text-xs font-mono glass-pill transition-all ${
                  isRotating
                    ? 'text-sky-300 bg-sky-950/60 border-sky-700/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isRotating ? 'Auto-Orbit' : 'Manual'}
              </button>
            </div>

            {/* Live Model Badge (Top Left) */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 glass-card px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg">
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: currentSystem.hexColor }}
              />
              <div>
                <h3 className="text-xs font-bold text-white leading-none">{currentSystem.title}</h3>
                <span className="text-[10px] text-slate-400 font-mono">3D Bio-Mechanical Rig</span>
              </div>
            </div>

            {/* Hint (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg glass-pill text-[10px] text-slate-400 font-mono pointer-events-none">
              <Activity size={12} className="text-sky-400 animate-pulse" />
              <span>Drag to rotate 360° • Biological Kinematics Active</span>
            </div>
          </div>

          {/* Clinical Telemetry Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {currentSystem.clinicalMetrics.map((met, i) => (
              <div
                key={i}
                className="glass-card p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all text-center sm:text-left"
              >
                <span className="text-[11px] font-mono text-slate-400 block mb-1 truncate">
                  {met.label}
                </span>
                <div className="flex items-baseline justify-center sm:justify-start gap-1">
                  <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                    {met.value}
                  </span>
                  <span className="text-[10px] text-sky-400 font-mono">{met.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
