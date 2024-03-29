import * as THREE from 'three'
import { useEffect, useRef, useState } from 'react'
import {
  Canvas,
  extend,
  useFrame,
  useThree,
  useLoader,
  useGraph,
} from '@react-three/fiber'
import {
  useCursor,
  MeshPortalMaterial,
  CameraControls,
  Gltf,
  Text,
  useAnimations,
  MeshReflectorMaterial,
} from '@react-three/drei'
import { useRoute, useLocation } from 'wouter'
import { easing, geometry } from 'maath'
import { suspend } from 'suspend-react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useLoading } from './LoadingContext'
import LoadingIndicator from './LoadingIndicator'
extend(geometry)
const GOLDENRATIO = 1.61803398875
const regular = import('@pmndrs/assets/fonts/inter_regular.woff')
const medium = import('@pmndrs/assets/fonts/inter_medium.woff')
function GammaCorrection() {
  const { gl } = useThree()

  useEffect(() => {
    gl.gammaFactor = 2.2
    gl.gammaOutput = true
  }, [gl])

  return null
}
const modelSources = [
  '/free__rubiks_cube_3d/scene.gltf',
  '/ballon_dog/scene.gltf',
  '/GLaDOS/scene.gltf',
]

export const App = () => {
  const { setLoading } = useLoading()

  useEffect(() => {
    // Show loading indicator
    setLoading(true)

    // Load all models and wait until they are all loaded
    const loaders = modelSources.map((src) => {
      return new Promise((resolve, reject) => {
        new GLTFLoader().load(src, resolve, null, reject)
      })
    })

    Promise.all(loaders).then(() => {
      // All models have been loaded
      setLoading(false) // Hide loading indicator
    })
  }, [setLoading]) // Dependency array

  return (
    <>
      <LoadingIndicator />
      <Canvas
        camera={{ fov: 75, position: [0, 0, 0] }}
        eventSource={document.getElementById('root')}
        eventPrefix='client'>
        <color attach='background' args={['#f0f0f0']} />
        <GammaCorrection /> {/* Include the custom component here */}
        <group position={[0, -0.8, 0]}>
          <Frame
            id='01'
            name={`Rubix\nCube`}
            author=':SDC PERFORMANCE™️'
            bg='#e4cdac'
            position={[-1.15, 0, 0]}
            rotation={[0, 0.5, 0]}
            modelScale={0.62}
            modelPosition={[0.2, -0.3, -4]}
            modelSrc='/free__rubiks_cube_3d/scene.gltf'
            lightPosition={[0, -0.7, -2]}
            lightIntensity={1}
            lightAngle={Math.PI / 6}
            modelRotation={[0, 0, 0]}
            lightPenumbra={0.7}
            hasReflector={true} // This frame will have a reflector
          />
          <Frame
            id='02'
            name={`Ballon\nDog`}
            author=':Octaclee'
            bg='#301934'
            modelSrc='/ballon_dog/scene.gltf'
            modelPosition={[0, -2, -6]}
            modelRotation={[0, 0.5, 0]}
            lightPosition={[-10, 10, 15]}
            lightIntensity={10}
            lightAngle={Math.PI / 6}
            modelScale={10.1089}
            lightPenumbra={0.7}
            shouldRotate={true} // Set to true to enable rotation
            rotationSpeeds={{ x: 0.0, y: 0.02, z: 0.0 }}
            shouldApplySpecialEffect={true} // This prop is true only for the balloon dog frame

            // hasReflector={true} // This frame will have a reflector
          />

          <Frame
            id='03'
            name={`GLaDOS`}
            author=':DAVID.3D.ART'
            bg='#FF4500'
            position={[1.15, 0, 0]}
            rotation={[0, -0.5, 0]}
            modelScale={10.5}
            modelPosition={[0.01, -0.1, -3]}
            modelSrc='/GLaDOS/scene.gltf'
            lightPosition={[-5, 3, 0]}
            lightIntensity={0.8}
            lightAngle={Math.PI / 6}
            lightPenumbra={0.7}
            modelRotation={[0, 0, 0]}
            shouldRotate={true} // Set to true to enable rotation
            rotationSpeeds={{ x: 0.01, y: 0.0, z: 0.01 }}
          />
        </group>
        <Rig />
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.9}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
      </Canvas>
    </>
  )
}

function Rig({
  position = new THREE.Vector3(0, 0, 2),
  focus = new THREE.Vector3(0, 0, 0),
}) {
  const { controls, scene } = useThree()
  const [, params] = useRoute('/item/:id')
  useEffect(() => {
    const active = scene.getObjectByName(params?.id)
    if (active) {
      active.parent.localToWorld(position.set(0, GOLDENRATIO * 0.75, 0.25))
      active.parent.localToWorld(focus.set(0, GOLDENRATIO / 2, -2))
    }
    controls?.setLookAt(...position.toArray(), ...focus.toArray(), true)
  })
  return (
    <CameraControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
  )
}

function Frame({
  id,
  name,
  author,
  bg,
  width = 1,
  height = GOLDENRATIO,
  modelSrc,
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  lightPosition = [0, 5, 5],
  lightIntensity = 1,
  lightAngle = Math.PI / 6,
  lightPenumbra = 0,
  hasReflector = false,
  shouldRotate = false,
  // initialRotation = [0, 0, 0],
  rotationSpeeds = { x: 0.01, y: 0.01, z: 0.01 },
  children,
  shouldApplySpecialEffect = false,
  ...props
}) {
  const portal = useRef()
  const modelRef = useRef() // Reference to the model

  const [, setLocation] = useLocation()
  const [, params] = useRoute('/item/:id')
  const [hovered, hover] = useState(false)
  const gltf = useLoader(GLTFLoader, modelSrc)
  const { animations } = gltf
  const { ref, mixer } = useAnimations(animations)
  useEffect(() => {
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        mixer.clipAction(clip).play()
        console.log(mixer._actions[0])
      })
    }
  }, [animations, mixer])

  const onDoubleClick = (e) => (
    e.stopPropagation(), setLocation('/item/' + e.object.name)
  )
  useCursor(hovered)
  useFrame((state, delta) => mixer?.update(delta))
  useFrame(() => {
    if (shouldRotate && modelRef.current) {
      modelRef.current.rotation.x += rotationSpeeds.x
      modelRef.current.rotation.y += rotationSpeeds.y
      modelRef.current.rotation.z += rotationSpeeds.z
    }
  })

  useFrame((state, dt) =>
    easing.damp(portal.current, 'blend', params?.id === id ? 1 : 0, 0.2, dt)
  )
  const setRefs = (node) => {
    // Assign to modelRef
    modelRef.current = node
    // Assign to ref from useAnimations
    ref.current = node
  }

  useEffect(() => {
    if (shouldApplySpecialEffect && modelRef.current) {
      modelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#ff69b4'), // Pink color
            opacity: 0.7, // Adjust opacity as needed
            transparent: true, // Required for opacity to work
            roughness: 0.2, // Low roughness for glossiness
            metalness: 0.99, // Adju opacity to work
          })
        }
      })
    }
  }, [shouldApplySpecialEffect, modelRef.current])

  const reflector = hasReflector && (
    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <MeshReflectorMaterial
        color={bg}
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={10}
        depthScale={1}
        minDepthThreshold={1}
        maxDepthThreshold={1}
        metalness={1}
        roughness={0.7}
      />
    </mesh>
  )
  return (
    <group {...props}>
      <Text
        font={suspend(medium).default}
        fontSize={0.18}
        anchorY='top'
        anchorX='left'
        lineHeight={0.8}
        position={[-0.375, 1.525, 0.01]}
        material-toneMapped={false}>
        {name}
      </Text>
      <Text
        font={suspend(regular).default}
        fontSize={0.1}
        anchorX='right'
        position={[0.4, 0.15, 0.01]}
        material-toneMapped={false}>
        :{id}
      </Text>
      <Text
        font={suspend(regular).default}
        fontSize={0.04}
        anchorX='right'
        position={[0.0, 0.132, 0.01]}
        material-toneMapped={false}>
        {author}
      </Text>
      <mesh
        name={id}
        position={[0, GOLDENRATIO / 2, 0]}
        onDoubleClick={onDoubleClick}
        onPointerOver={(e) => hover(true)}
        onPointerOut={() => hover(false)}>
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial
          ref={portal}
          events={params?.id === id}
          side={THREE.DoubleSide}>
          <color attach='background' args={[bg]} />
          <spotLight
            position={lightPosition}
            intensity={lightIntensity}
            angle={lightAngle}
            penumbra={lightPenumbra}
            castShadow
          />
          {reflector}
          <Gltf
            ref={setRefs}
            scale={modelScale}
            position={modelPosition}
            rotation={modelRotation}
            src={modelSrc}
            object={gltf.scene}
          />
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 10]} intensity={0.25} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  )
}
