import * as THREE from 'three';
import { useEffect, useRef, useState } from 'react';
import {
  Canvas,
  extend,
  useFrame,
  useThree,
  useLoader,
} from '@react-three/fiber';
import {
  useCursor,
  MeshPortalMaterial,
  CameraControls,
  Gltf,
  Text,
  useAnimations,
  MeshReflectorMaterial,
} from '@react-three/drei';
import { useRoute, useLocation } from 'wouter';
import { easing, geometry } from 'maath';
import { suspend } from 'suspend-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Bloom, EffectComposer } from '@react-three/postprocessing';

extend(geometry);
const GOLDENRATIO = 1.61803398875;
const regular = import('@pmndrs/assets/fonts/inter_regular.woff');
const medium = import('@pmndrs/assets/fonts/inter_medium.woff');

export const App = () => (
  <Canvas
    camera={{ fov: 75, position: [0, 0, 0] }}
    eventSource={document.getElementById('root')}
    eventPrefix='client'>
    <color attach='background' args={['#f0f0f0']} />

    <group position={[0, -0.8, 0]}>
      <Frame
        id='01'
        name={`Mercedes\nBenz`}
        author='SDC PERFORMANCE™️'
        bg='#e4cdac'
        position={[-1.15, 0, 0]}
        rotation={[0, 0.5, 0]}
        modelScale={0.62}
        modelPosition={[0, -0.4, -4]}
        modelSrc='/free__rubiks_cube_3d/scene.gltf'
        lightPosition={[0, -0.7, -2]}
        lightIntensity={1}
        lightAngle={Math.PI / 6}
        lightPenumbra={0.7}
        hasReflector={true} // This frame will have a reflector
      />
      <Frame
        id='02'
        name={`FedEx\nVan`}
        author=''
        bg='#545454'
        modelSrc='/free_cyberpunk_hovercar/scene.gltf'
        modelPosition={[0, -1.5, -8]}
        modelRotation={[0, 0, 0]}
        lightPosition={[-5, 3, 0]}
        lightIntensity={1.8}
        lightAngle={Math.PI / 6}
        modelScale={1.2}
        lightPenumbra={0.7}
      />

      <Frame
        id='03'
        name={`Bimbo\nsemi`}
        author='re1monsen'
        bg='#d1d1ca'
        position={[1.15, 0, 0]}
        rotation={[0, -0.5, 0]}
        modelScale={0.5}
        modelPosition={[0, -0.1, -3]}
        modelSrc='/space_station_3/scene.gltf'
        lightPosition={[-5, 3, 0]}
        lightIntensity={0.8}
        lightAngle={Math.PI / 6}
        lightPenumbra={0.7}
      />
    </group>
    <Rig />
    <EffectComposer>
      <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} height={300} />
      {/* Add more passes as needed */}
    </EffectComposer>
    {/* <Environment /> */}
  </Canvas>
);

function Rig({
  position = new THREE.Vector3(0, 0, 2),
  focus = new THREE.Vector3(0, 0, 0),
}) {
  const { controls, scene } = useThree();
  const [, params] = useRoute('/item/:id');
  useEffect(() => {
    const active = scene.getObjectByName(params?.id);
    if (active) {
      active.parent.localToWorld(position.set(0, GOLDENRATIO * 0.75, 0.25));
      active.parent.localToWorld(focus.set(0, GOLDENRATIO / 2, -2));
    }
    controls?.setLookAt(...position.toArray(), ...focus.toArray(), true);
  });
  return (
    <CameraControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
  );
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
  children,
  ...props
}) {
  const portal = useRef();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/item/:id');
  const [hovered, hover] = useState(false);
  const gltf = useLoader(GLTFLoader, modelSrc);
  const { animations } = gltf;
  const { ref, mixer } = useAnimations(animations);
  useEffect(() => {
    if (animations && animations.length > 0) {
      animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }
  }, [animations, mixer]);
  useEffect(() => {
    if (id === '02' && gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.metalness = 1; // Fully metallic
          child.material.roughness = 0.1; // Shiny surface
          child.material.needsUpdate = true; // Ensure the material updates
        }
      });
    }
  }, [gltf, id]);

  const onDoubleClick = (e) => (
    e.stopPropagation(), setLocation('/item/' + e.object.name)
  );
  useCursor(hovered);
  useFrame((state, delta) => mixer?.update(delta));

  useFrame((state, dt) =>
    easing.damp(portal.current, 'blend', params?.id === id ? 1 : 0, 0.2, dt)
  );
  const reflector = hasReflector && (
    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeBufferGeometry args={[10, 10]} />
      <MeshReflectorMaterial
        color={bg}
        blur={[300, 100]} // Amount of blur (width, height)
        resolution={1024} // Texture resolution
        mixBlur={1} // Mix value for blur
        mixStrength={10} // Strength of the reflections
        depthScale={1} // Depth of the reflections
        minDepthThreshold={1}
        maxDepthThreshold={1}
        metalness={1} // Define how metallic the surface should be
        roughness={.7} // Define the roughness of the surface
      />
    </mesh>
  );
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
            scale={modelScale}
            position={modelPosition}
            rotation={modelRotation}
            src={modelSrc}
            ref={ref}
            object={gltf.scene}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
        </MeshPortalMaterial>
      </mesh>
    </group>
  );
}