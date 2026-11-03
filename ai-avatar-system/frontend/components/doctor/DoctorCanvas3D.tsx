'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { DoctorId, DoctorState } from '@/lib/doctorTypes'
import { DOCTORS } from '@/lib/doctorTypes'
import { Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw, Eye } from 'lucide-react'

interface DoctorCanvas3DProps {
  doctorId: DoctorId
  doctorState: DoctorState
  audioLevel?: number // 0 to 1 for real-time speech amplitude
  isMuted?: boolean
  onStateChange?: (state: DoctorState) => void
  className?: string
}

export function DoctorCanvas3D({
  doctorId,
  doctorState,
  audioLevel = 0,
  isMuted = false,
  onStateChange,
  className = '',
}: DoctorCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Rig references for animation
  const rigRef = useRef<{
    rootGroup: THREE.Group
    headGroup: THREE.Group
    neckMesh: THREE.Mesh
    torsoGroup: THREE.Group
    coatGroup: THREE.Group
    stethGroup: THREE.Group
    leftEye: THREE.Group
    rightEye: THREE.Group
    leftEyelid: THREE.Mesh
    rightEyelid: THREE.Mesh
    leftEyebrow: THREE.Mesh
    rightEyebrow: THREE.Mesh
    upperLip: THREE.Mesh
    lowerLip: THREE.Mesh
    jawGroup: THREE.Group
    teethMesh: THREE.Mesh
    tongueMesh: THREE.Mesh
    hairGroup: THREE.Group
    gltfModel?: THREE.Object3D
    morphMeshes?: THREE.Mesh[]
  } | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [modelType, setModelType] = useState<'procedural' | 'glb'>('procedural')
  const [fps, setFps] = useState(60)

  // Internal animation state variables
  const animTimeRef = useRef(0)
  const blinkStateRef = useRef({ isBlinking: false, progress: 0, nextBlinkTime: 2.5 })
  const speechPhonemeRef = useRef({ currentViseme: 0, targetViseme: 0, blend: 0 })
  const headAnglesRef = useRef({ pitch: 0, yaw: 0, roll: 0, targetPitch: 0, targetYaw: 0, targetRoll: 0 })
  const nodCycleRef = useRef({ time: 0, active: false })

  const doctor = DOCTORS[doctorId]

  // Build the detailed 3D Procedural Doctor Rig
  const buildDoctorRig = useCallback((scene: THREE.Scene, docId: DoctorId) => {
    const isArjun = docId === 'dr_arjun'

    // Clean up old rig if present
    if (rigRef.current) {
      scene.remove(rigRef.current.rootGroup)
      rigRef.current = null
    }

    const rootGroup = new THREE.Group()
    rootGroup.position.set(0, -0.65, 0)

    // Palette & Materials
    const skinTone = isArjun ? 0xD99B72 : 0xE8BA99
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.58,
      metalness: 0.04,
    })

    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.45,
      metalness: 0.05,
    })

    const scrubMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0x0E7490 : 0x2563EB, // Cyan-700 / Blue-600
      roughness: 0.65,
      metalness: 0.02,
    })

    const stethTubingMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0x0369A1 : 0x6D28D9,
      roughness: 0.35,
      metalness: 0.1,
    })

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.15,
      metalness: 0.95,
    })

    const hairMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0x1A1412 : 0x1F1610,
      roughness: 0.8,
      metalness: 0.1,
    })

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xFAFAFA,
      roughness: 0.1,
      metalness: 0.0,
    })

    const irisMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0x3E2723 : 0x4E342E, // Warm physician brown
      roughness: 0.2,
      metalness: 0.05,
    })

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 })

    const lipMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0xBF7762 : 0xD47D75,
      roughness: 0.5,
      metalness: 0.02,
    })

    const teethMat = new THREE.MeshStandardMaterial({
      color: 0xFAFAFA,
      roughness: 0.25,
      metalness: 0.0,
    })

    // ─────────────────────────────────────────────
    // 1. Torso & Medical Coat
    // ─────────────────────────────────────────────
    const torsoGroup = new THREE.Group()

    // Inner scrub body
    const chestGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.65, 32)
    const chestMesh = new THREE.Mesh(chestGeo, scrubMat)
    chestMesh.position.set(0, 0.35, 0)
    torsoGroup.add(chestMesh)

    // Shoulders
    const leftShoulderGeo = new THREE.SphereGeometry(0.18, 24, 24)
    const leftShoulder = new THREE.Mesh(leftShoulderGeo, coatMat)
    leftShoulder.position.set(-0.46, 0.54, 0)
    torsoGroup.add(leftShoulder)

    const rightShoulder = new THREE.Mesh(leftShoulderGeo, coatMat)
    rightShoulder.position.set(0.46, 0.54, 0)
    torsoGroup.add(rightShoulder)

    // Doctor Lab Coat Body (outer layer)
    const coatGroup = new THREE.Group()
    const coatBackGeo = new THREE.CylinderGeometry(0.43, 0.49, 0.72, 32, 1, false, 0, Math.PI * 1.5)
    coatBackGeo.rotateY(Math.PI * 0.75)
    const coatBack = new THREE.Mesh(coatBackGeo, coatMat)
    coatBack.position.set(0, 0.34, 0.01)
    coatGroup.add(coatBack)

    // Lapels (Left and Right)
    const lapelGeo = new THREE.BoxGeometry(0.11, 0.45, 0.04)
    const leftLapel = new THREE.Mesh(lapelGeo, coatMat)
    leftLapel.position.set(-0.20, 0.45, 0.22)
    leftLapel.rotation.set(-0.1, 0.2, -0.22)
    coatGroup.add(leftLapel)

    const rightLapel = new THREE.Mesh(lapelGeo, coatMat)
    rightLapel.position.set(0.20, 0.45, 0.22)
    rightLapel.rotation.set(-0.1, -0.2, 0.22)
    coatGroup.add(rightLapel)

    // Doctor ID Badge on left chest
    const badgeBackGeo = new THREE.BoxGeometry(0.09, 0.12, 0.015)
    const badgeBackMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.3, metalness: 0.4 })
    const badge = new THREE.Mesh(badgeBackGeo, badgeBackMat)
    badge.position.set(-0.25, 0.42, 0.24)
    badge.rotation.set(-0.05, 0.2, 0)

    const badgeStripeGeo = new THREE.BoxGeometry(0.08, 0.025, 0.005)
    const badgeStripeMat = new THREE.MeshStandardMaterial({ color: 0x38BDF8, roughness: 0.3 })
    const badgeStripe = new THREE.Mesh(badgeStripeGeo, badgeStripeMat)
    badgeStripe.position.set(0, 0.03, 0.008)
    badge.add(badgeStripe)

    const badgeClipGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.025, 12)
    const badgeClip = new THREE.Mesh(badgeClipGeo, chromeMat)
    badgeClip.position.set(0, 0.07, 0.005)
    badgeClip.rotation.z = Math.PI / 2
    badge.add(badgeClip)

    coatGroup.add(badge)
    torsoGroup.add(coatGroup)

    // ─────────────────────────────────────────────
    // 2. Realistic Medical Stethoscope
    // ─────────────────────────────────────────────
    const stethGroup = new THREE.Group()

    // Curved tubing around neck
    const stethCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.68, 0.05),
      new THREE.Vector3(-0.24, 0.58, 0.22),
      new THREE.Vector3(-0.16, 0.36, 0.28),
      new THREE.Vector3(0.0, 0.28, 0.32), // Y-junction
      new THREE.Vector3(0.16, 0.36, 0.28),
      new THREE.Vector3(0.24, 0.58, 0.22),
      new THREE.Vector3(0.18, 0.68, 0.05),
    ])

    const stethTubingGeo = new THREE.TubeGeometry(stethCurve, 40, 0.014, 12, false)
    const stethTubingMesh = new THREE.Mesh(stethTubingGeo, stethTubingMat)
    stethGroup.add(stethTubingMesh)

    // Chest piece (bell & diaphragm) hanging on chest
    const chestpieceGroup = new THREE.Group()
    chestpieceGroup.position.set(0.08, 0.22, 0.34)
    chestpieceGroup.rotation.x = 0.2

    const bellGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.02, 24)
    const bellMesh = new THREE.Mesh(bellGeo, chromeMat)
    bellMesh.rotation.x = Math.PI / 2
    chestpieceGroup.add(bellMesh)

    const diaphragmGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.005, 24)
    const diaphragmMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.1, metalness: 0.2 })
    const diaphragmMesh = new THREE.Mesh(diaphragmGeo, diaphragmMat)
    diaphragmMesh.position.set(0, 0, 0.011)
    diaphragmMesh.rotation.x = Math.PI / 2
    chestpieceGroup.add(diaphragmMesh)

    stethGroup.add(chestpieceGroup)
    torsoGroup.add(stethGroup)
    rootGroup.add(torsoGroup)

    // ─────────────────────────────────────────────
    // 3. Neck
    // ─────────────────────────────────────────────
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.20, 24)
    const neckMesh = new THREE.Mesh(neckGeo, skinMat)
    neckMesh.position.set(0, 0.72, 0.02)
    rootGroup.add(neckMesh)

    // ─────────────────────────────────────────────
    // 4. Head Group (Animates pitch, yaw, roll)
    // ─────────────────────────────────────────────
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 0.88, 0.04)

    // Main Cranium / Face Base
    const headGeo = isArjun
      ? new THREE.SphereGeometry(0.24, 32, 32)
      : new THREE.SphereGeometry(0.22, 32, 32)
    headGeo.scale(1, 1.22, 1.08)
    const headMesh = new THREE.Mesh(headGeo, skinMat)
    headGroup.add(headMesh)

    // Cheeks & Chin definition
    const chinGeo = new THREE.SphereGeometry(0.08, 20, 20)
    chinGeo.scale(isArjun ? 1.2 : 0.9, 0.8, 1.1)
    const chinMesh = new THREE.Mesh(chinGeo, skinMat)
    chinMesh.position.set(0, -0.22, 0.17)
    headGroup.add(chinMesh)

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.045, 0.12, 16)
    noseGeo.rotateX(Math.PI / 2)
    const noseMesh = new THREE.Mesh(noseGeo, skinMat)
    noseMesh.position.set(0, -0.01, 0.26)
    headGroup.add(noseMesh)

    // Ears
    const earGeo = new THREE.SphereGeometry(0.06, 16, 16)
    earGeo.scale(0.35, 1.2, 0.7)
    const leftEar = new THREE.Mesh(earGeo, skinMat)
    leftEar.position.set(-0.25, 0.0, 0.02)
    leftEar.rotation.y = -0.3
    headGroup.add(leftEar)

    const rightEar = new THREE.Mesh(earGeo, skinMat)
    rightEar.position.set(0.25, 0.0, 0.02)
    rightEar.rotation.y = 0.3
    headGroup.add(rightEar)

    // ─────────────────────────────────────────────
    // 5. Eyes & Eyelids (Blinking & Gaze)
    // ─────────────────────────────────────────────
    const eyeSpacing = isArjun ? 0.095 : 0.088
    const eyeHeight = 0.05
    const eyeForward = 0.20

    const createEye = (isLeft: boolean) => {
      const eyeGroup = new THREE.Group()
      eyeGroup.position.set(isLeft ? -eyeSpacing : eyeSpacing, eyeHeight, eyeForward)

      // Eyeball
      const eyeballGeo = new THREE.SphereGeometry(0.042, 24, 24)
      const eyeball = new THREE.Mesh(eyeballGeo, eyeWhiteMat)
      eyeGroup.add(eyeball)

      // Iris
      const irisGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.005, 24)
      irisGeo.rotateX(Math.PI / 2)
      const iris = new THREE.Mesh(irisGeo, irisMat)
      iris.position.set(0, 0, 0.04)
      eyeGroup.add(iris)

      // Pupil
      const pupilGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.006, 20)
      pupilGeo.rotateX(Math.PI / 2)
      const pupil = new THREE.Mesh(pupilGeo, pupilMat)
      pupil.position.set(0, 0, 0.041)
      eyeGroup.add(pupil)

      // Specular highlight gleam
      const gleamGeo = new THREE.SphereGeometry(0.004, 12, 12)
      const gleamMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
      const gleam = new THREE.Mesh(gleamGeo, gleamMat)
      gleam.position.set(0.007, 0.007, 0.044)
      eyeGroup.add(gleam)

      // Upper Eyelid for Blinking
      const eyelidGeo = new THREE.SphereGeometry(0.044, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      const eyelid = new THREE.Mesh(eyelidGeo, skinMat)
      eyelid.position.set(0, 0.005, 0)
      eyelid.rotation.x = -Math.PI / 2 // Open by default
      eyeGroup.add(eyelid)

      return { eyeGroup, eyelid }
    }

    const leftEyeData = createEye(true)
    const rightEyeData = createEye(false)
    headGroup.add(leftEyeData.eyeGroup)
    headGroup.add(rightEyeData.eyeGroup)

    // Eyebrows
    const eyebrowGeo = new THREE.BoxGeometry(0.075, 0.016, 0.02)
    const eyebrowMat = new THREE.MeshStandardMaterial({
      color: isArjun ? 0x111111 : 0x221B16,
      roughness: 0.9,
    })

    const leftEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat)
    leftEyebrow.position.set(-eyeSpacing, eyeHeight + 0.065, eyeForward + 0.02)
    leftEyebrow.rotation.z = isArjun ? 0.08 : 0.04
    headGroup.add(leftEyebrow)

    const rightEyebrow = new THREE.Mesh(eyebrowGeo, eyebrowMat)
    rightEyebrow.position.set(eyeSpacing, eyeHeight + 0.065, eyeForward + 0.02)
    rightEyebrow.rotation.z = isArjun ? -0.08 : -0.04
    headGroup.add(rightEyebrow)

    // ─────────────────────────────────────────────
    // 6. Mouth, Jaw & Viseme Rig
    // ─────────────────────────────────────────────
    const jawGroup = new THREE.Group()
    jawGroup.position.set(0, -0.11, 0.16)

    // Upper Lip
    const upperLipGeo = new THREE.BoxGeometry(0.09, 0.02, 0.025)
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat)
    upperLip.position.set(0, 0.01, 0.06)
    jawGroup.add(upperLip)

    // Lower Lip
    const lowerLipGeo = new THREE.BoxGeometry(0.085, 0.022, 0.025)
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat)
    lowerLip.position.set(0, -0.022, 0.058)
    jawGroup.add(lowerLip)

    // Teeth
    const teethGeo = new THREE.BoxGeometry(0.07, 0.018, 0.02)
    const teethMesh = new THREE.Mesh(teethGeo, teethMat)
    teethMesh.position.set(0, -0.005, 0.045)
    jawGroup.add(teethMesh)

    // Tongue
    const tongueGeo = new THREE.SphereGeometry(0.03, 16, 16)
    tongueGeo.scale(1, 0.4, 1.2)
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xD9776E, roughness: 0.6 })
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat)
    tongueMesh.position.set(0, -0.025, 0.035)
    jawGroup.add(tongueMesh)

    headGroup.add(jawGroup)

    // ─────────────────────────────────────────────
    // 7. Hair Styles (Dr. Smit vs Dr. Ananya)
    // ─────────────────────────────────────────────
    const hairGroup = new THREE.Group()

    if (isArjun) {
      // Dr. Smit: Professional physician modern taper haircut
      const hairTopGeo = new THREE.SphereGeometry(0.25, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.55)
      hairTopGeo.scale(1.02, 1.16, 1.05)
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat)
      hairTop.position.set(0, 0.06, -0.02)
      hairGroup.add(hairTop)

      // Parting tuft
      const tuftGeo = new THREE.ConeGeometry(0.08, 0.16, 12)
      tuftGeo.rotateX(-0.5)
      tuftGeo.rotateZ(0.3)
      const tuft = new THREE.Mesh(tuftGeo, hairMat)
      tuft.position.set(-0.06, 0.28, 0.14)
      hairGroup.add(tuft)

      // Clean sideburns
      const sideburnGeo = new THREE.BoxGeometry(0.025, 0.10, 0.03)
      const leftSb = new THREE.Mesh(sideburnGeo, hairMat)
      leftSb.position.set(-0.245, 0.02, 0.03)
      hairGroup.add(leftSb)

      const rightSb = new THREE.Mesh(sideburnGeo, hairMat)
      rightSb.position.set(0.245, 0.02, 0.03)
      hairGroup.add(rightSb)
    } else {
      // Dr. Ananya: Elegant physician updo / layered bob
      const hairDomeGeo = new THREE.SphereGeometry(0.245, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.65)
      hairDomeGeo.scale(1.04, 1.22, 1.08)
      const hairDome = new THREE.Mesh(hairDomeGeo, hairMat)
      hairDome.position.set(0, 0.04, -0.02)
      hairGroup.add(hairDome)

      // Side locks / soft physician bangs
      const bangsGeo = new THREE.BoxGeometry(0.26, 0.07, 0.05)
      const bangs = new THREE.Mesh(bangsGeo, hairMat)
      bangs.position.set(0.04, 0.20, 0.19)
      bangs.rotation.set(-0.25, 0.1, -0.08)
      hairGroup.add(bangs)

      // Elegant doctor bun behind head
      const bunGeo = new THREE.SphereGeometry(0.11, 20, 20)
      bunGeo.scale(1.1, 0.9, 0.8)
      const bun = new THREE.Mesh(bunGeo, hairMat)
      bun.position.set(0, 0.10, -0.22)
      hairGroup.add(bun)
    }

    headGroup.add(hairGroup)
    rootGroup.add(headGroup)
    scene.add(rootGroup)

    rigRef.current = {
      rootGroup,
      headGroup,
      neckMesh,
      torsoGroup,
      coatGroup,
      stethGroup,
      leftEye: leftEyeData.eyeGroup,
      rightEye: rightEyeData.eyeGroup,
      leftEyelid: leftEyeData.eyelid,
      rightEyelid: rightEyeData.eyelid,
      leftEyebrow,
      rightEyebrow,
      upperLip,
      lowerLip,
      jawGroup,
      teethMesh,
      tongueMesh,
      hairGroup,
    }

    setIsLoading(false)
  }, [])

  // Check and load external GLB avatar if available (/avatars/dr_arjun.glb or dr_ananya.glb)
  const tryLoadGLB = useCallback((scene: THREE.Scene, docId: DoctorId) => {
    const glbUrl = `/avatars/${docId}.glb`
    const loader = new GLTFLoader()

    loader.load(
      glbUrl,
      (gltf) => {
        const model = gltf.scene
        model.position.set(0, -0.7, 0)
        model.scale.set(1, 1, 1)

        // Find meshes with morph targets
        const morphMeshes: THREE.Mesh[] = []
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
            morphMeshes.push(child as THREE.Mesh)
          }
        })

        // Clean up procedural rig and mount GLB
        if (rigRef.current) {
          scene.remove(rigRef.current.rootGroup)
        }

        const headNode = model.getObjectByName('Head') || model.getObjectByName('head') || model

        scene.add(model)
        setModelType('glb')
        setIsLoading(false)
      },
      undefined,
      (err) => {
        // Expected if custom GLB isn't placed yet — use our procedural rig
        buildDoctorRig(scene, docId)
        setModelType('procedural')
      }
    )
  }, [buildDoctorRig])

  // Setup Three.js Scene, Camera, Lighting, Consultation Room
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0C1222) // Rich clinical slate
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100)
    camera.position.set(0, 0.32, 2.05)
    camera.lookAt(0, 0.28, 0)
    cameraRef.current = camera

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Clear old canvases
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ─────────────────────────────────────────────
    // Clinical Consultation Environment & Lighting
    // ─────────────────────────────────────────────
    // Key light (warm clinical light)
    const keyLight = new THREE.DirectionalLight(0xFFF7ED, 1.8)
    keyLight.position.set(-1.2, 2.2, 2.0)
    scene.add(keyLight)

    // Fill light (cool soft telemedicine ambient)
    const fillLight = new THREE.DirectionalLight(0xE0F2FE, 1.1)
    fillLight.position.set(1.5, 1.2, 1.6)
    scene.add(fillLight)

    // Rim / Hair light (sharp silhouette definition)
    const rimLight = new THREE.DirectionalLight(0x93C5FD, 1.6)
    rimLight.position.set(0, 2.0, -1.8)
    scene.add(rimLight)

    // Ambient soft illumination
    const ambientLight = new THREE.AmbientLight(0x1E293B, 0.9)
    scene.add(ambientLight)

    // Medical Room Backdrop
    const backdropGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.8, 32, 1, true, -Math.PI * 0.45, Math.PI * 0.9)
    const backdropMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A, // Deep clinical navy
      roughness: 0.85,
      metalness: 0.1,
      side: THREE.BackSide,
    })
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat)
    backdrop.position.set(0, 0.5, 0)
    scene.add(backdrop)

    // Soft medical consultation room horizontal accent glow strip
    const accentStripGeo = new THREE.BoxGeometry(4.0, 0.04, 0.02)
    const accentStripMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 }) // Medicus cyan glow
    const accentStrip = new THREE.Mesh(accentStripGeo, accentStripMat)
    accentStrip.position.set(0, 0.65, -1.95)
    scene.add(accentStrip)

    // Clinical certificate / diploma decor on backdrop
    const certGeo = new THREE.BoxGeometry(0.36, 0.28, 0.02)
    const certMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 })
    const cert = new THREE.Mesh(certGeo, certMat)
    cert.position.set(-1.1, 0.85, -1.85)
    cert.rotation.y = 0.2
    scene.add(cert)

    // Build or try GLB
    tryLoadGLB(scene, doctorId)

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const newWidth = container.clientWidth
      const newHeight = container.clientHeight
      cameraRef.current.aspect = newWidth / newHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      renderer.dispose()
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [doctorId, tryLoadGLB])

  // ─────────────────────────────────────────────
  // Animation Loop (Breathing, Blinking, Visemes, Gaze, State Kinematics)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now()
    let frameCount = 0
    let lastFpsUpdate = performance.now()

    const animate = (now: number) => {
      animationFrameRef.current = requestAnimationFrame(animate)

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      animTimeRef.current += dt

      // FPS tracking
      frameCount++
      if (now - lastFpsUpdate > 1000) {
        setFps(frameCount)
        frameCount = 0
        lastFpsUpdate = now
      }

      const t = animTimeRef.current
      const rig = rigRef.current

      if (rig) {
        // 1. Natural Breathing Cycle (14 breaths per min ~ 0.23 Hz)
        const breathCycle = Math.sin(t * 1.5)
        rig.torsoGroup.position.y = breathCycle * 0.008
        rig.torsoGroup.scale.set(
          1 + breathCycle * 0.004,
          1 + breathCycle * 0.006,
          1 + breathCycle * 0.008
        )

        // 2. Head Kinematics by Doctor State
        let targetPitch = 0 // Nod / Tilt forward
        let targetYaw = 0   // Look left/right
        let targetRoll = 0  // Side tilt

        switch (doctorState) {
          case 'listening':
            // Leans forward attentively toward the patient with subtle micro-nods
            targetPitch = 0.08 + Math.sin(t * 1.8) * 0.025
            targetYaw = Math.sin(t * 0.7) * 0.03
            targetRoll = 0.025
            break

          case 'thinking':
            // Thoughtful upward-side gaze and brow furrow
            targetPitch = -0.06
            targetYaw = 0.12 + Math.sin(t * 0.8) * 0.03
            targetRoll = -0.05
            break

          case 'speaking':
            // Animated conversational head motion with natural cadence
            targetPitch = Math.sin(t * 3.8) * 0.045 + Math.sin(t * 1.2) * 0.02
            targetYaw = Math.cos(t * 1.5) * 0.04
            targetRoll = Math.sin(t * 2.1) * 0.02
            break

          case 'explaining':
            // Warm open gestures and empathetic nods
            targetPitch = 0.06 + Math.sin(t * 2.5) * 0.03
            targetYaw = Math.sin(t * 1.4) * 0.05
            targetRoll = 0.03
            break

          case 'interrupted':
            // Recoils back smoothly and attends to interruption
            targetPitch = -0.05
            targetYaw = 0
            targetRoll = 0
            break

          case 'idle':
          default:
            // Relaxed natural micro-drift
            targetPitch = Math.sin(t * 0.6) * 0.015
            targetYaw = Math.sin(t * 0.4) * 0.02
            targetRoll = Math.cos(t * 0.5) * 0.01
            break
        }

        // Smooth damping interpolation toward target angles
        const lerpFactor = 0.08
        headAnglesRef.current.pitch += (targetPitch - headAnglesRef.current.pitch) * lerpFactor
        headAnglesRef.current.yaw += (targetYaw - headAnglesRef.current.yaw) * lerpFactor
        headAnglesRef.current.roll += (targetRoll - headAnglesRef.current.roll) * lerpFactor

        rig.headGroup.rotation.x = headAnglesRef.current.pitch
        rig.headGroup.rotation.y = headAnglesRef.current.yaw
        rig.headGroup.rotation.z = headAnglesRef.current.roll

        // 3. Eyebrow Emotive Expression
        let browY = 0
        let browTilt = 0
        if (doctorState === 'thinking') {
          browY = -0.008
          browTilt = 0.08 // Furrowed
        } else if (doctorState === 'speaking' || doctorState === 'explaining') {
          browY = Math.sin(t * 2.5) > 0.4 ? 0.010 : 0.002 // Empathetic lifts
          browTilt = -0.02
        } else if (doctorState === 'listening') {
          browY = 0.004
        }
        rig.leftEyebrow.position.y = 0.05 + 0.065 + browY
        rig.rightEyebrow.position.y = 0.05 + 0.065 + browY
        rig.leftEyebrow.rotation.z = 0.08 + browTilt
        rig.rightEyebrow.rotation.z = -0.08 - browTilt

        // 4. Natural Blinking Loop (Every 2.8 - 4.5 seconds)
        const blink = blinkStateRef.current
        if (!blink.isBlinking && t > blink.nextBlinkTime) {
          blink.isBlinking = true
          blink.progress = 0
        }

        if (blink.isBlinking) {
          blink.progress += dt * 7.5 // ~130ms quick natural blink
          const blinkValue = Math.sin(blink.progress * Math.PI)

          if (blink.progress >= 1.0) {
            blink.isBlinking = false
            blink.progress = 0
            blink.nextBlinkTime = t + 2.5 + Math.random() * 2.5
            rig.leftEyelid.rotation.x = -Math.PI / 2
            rig.rightEyelid.rotation.x = -Math.PI / 2
          } else {
            // Eyelid closes smoothly from -PI/2 (open) to 0 (closed)
            const angle = -Math.PI / 2 + blinkValue * (Math.PI / 2)
            rig.leftEyelid.rotation.x = angle
            rig.rightEyelid.rotation.x = angle
          }
        }

        // 5. Lip-Sync & Viseme Articulation
        let jawOpen = 0
        let lipStretch = 1
        let tongueVisible = false

        if (doctorState === 'speaking') {
          // Drive mouth shapes with audio level OR simulated speech cadence
          const activeAmp = audioLevel > 0.05
            ? audioLevel * 1.4
            : 0.25 + 0.45 * Math.abs(Math.sin(t * 8.5) * Math.cos(t * 3.2))

          // Phoneme cycling (Visemes: AA, EE, OO, M)
          const phonemeCycle = (t * 6.0) % 4
          if (phonemeCycle < 1) {
            // "Ah" / "Aa" — Open jaw
            jawOpen = activeAmp * 0.038
            lipStretch = 1.0
          } else if (phonemeCycle < 2) {
            // "Ee" — Wide smile
            jawOpen = activeAmp * 0.018
            lipStretch = 1.25
          } else if (phonemeCycle < 3) {
            // "Oh" — Rounded mouth
            jawOpen = activeAmp * 0.042
            lipStretch = 0.75
            tongueVisible = true
          } else {
            // Consonants / Closed
            jawOpen = activeAmp * 0.012
            lipStretch = 1.05
          }

          // Rapid phonetic micro-tremor
          jawOpen += (Math.random() - 0.5) * 0.005 * activeAmp
        } else if (doctorState === 'explaining') {
          // Gentle warm speaking
          jawOpen = 0.015 + Math.sin(t * 4.0) * 0.012
          lipStretch = 1.15
        } else {
          // Closed / Warm rested smile
          jawOpen = 0
          lipStretch = 1.0
        }

        // Apply visemes to 3D jaw and lips
        rig.jawGroup.position.y = -0.11 - jawOpen
        rig.upperLip.scale.set(lipStretch, 1, 1)
        rig.lowerLip.scale.set(lipStretch, 1, 1)
        rig.teethMesh.position.y = -0.005 - jawOpen * 0.4
        rig.tongueMesh.visible = tongueVisible || jawOpen > 0.02
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [doctorState, audioLevel])

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${className}`}>
      {/* 3D WebGL Canvas Mount */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-30 transition-opacity">
          <div className="w-12 h-12 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin mb-4" />
          <p className="text-sky-300 font-medium text-sm">Initializing 3D {doctor.name}...</p>
          <span className="text-xs text-slate-400 mt-1">Calibrating blendshapes & facial visemes</span>
        </div>
      )}

      {/* Doctor Name & Status Badge Overlay (Top Left of 3D Canvas) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl p-2.5 px-3.5 shadow-xl">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {doctor.name.replace('Dr. ', '')[0]}
          </div>
          {/* Active Status Beacon */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
              doctorState === 'speaking'
                ? 'bg-emerald-400 animate-pulse'
                : doctorState === 'listening'
                ? 'bg-sky-400 animate-ping'
                : doctorState === 'thinking'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-sm leading-tight tracking-wide">
              {doctor.formalTitle}
            </h2>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60">
              {modelType === 'glb' ? 'GLB 3D' : 'Realtime 3D'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">{doctor.specialty}</p>
        </div>
      </div>

      {/* State & Audio Equalizer Indicator (Bottom Left of 3D View) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-1 h-3.5">
          {[0.2, 0.6, 0.4, 0.9, 0.3].map((height, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                doctorState === 'speaking'
                  ? 'bg-emerald-400 animate-pulse'
                  : doctorState === 'listening'
                  ? 'bg-sky-400'
                  : 'bg-slate-600'
              }`}
              style={{
                height:
                  doctorState === 'speaking'
                    ? `${Math.max(4, height * 14 * (audioLevel > 0 ? audioLevel * 2 : 1))}px`
                    : '4px',
              }}
            />
          ))}
        </div>

        <span className="text-xs font-mono capitalize tracking-wide text-slate-200">
          {doctorState === 'speaking'
            ? `${doctor.name} is speaking...`
            : doctorState === 'listening'
            ? 'Listening to you...'
            : doctorState === 'thinking'
            ? 'Analyzing clinical guidance...'
            : doctorState === 'interrupted'
            ? 'Interrupted — Listening'
            : 'Idle • Ready'}
        </span>
      </div>

      {/* Performance & Medical Telemedicine Indicator (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>WebRTC 60 FPS</span>
      </div>
    </div>
  )
}
