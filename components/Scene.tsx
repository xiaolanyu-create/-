import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeState } from '../types';
import Foliage from './Foliage';
import Ornaments from './Ornaments';

interface SceneProps {
  treeState: TreeState;
}

const SceneContent: React.FC<SceneProps> = ({ treeState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2 + 0.2}
        minDistance={5}
        maxDistance={25}
        autoRotate={treeState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* Lighting - Luxury Setup */}
      <ambientLight intensity={0.2} color="#001a0f" />
      {/* Warm Fill */}
      <spotLight position={[10, 10, 10]} angle={0.5} penumbra={1} intensity={100} color="#ffd700" castShadow />
      {/* Rim Light */}
      <spotLight position={[-10, 5, -10]} angle={0.5} penumbra={1} intensity={200} color="#cceeff" />
      {/* Core Glow */}
      <pointLight position={[0, 0, 0]} intensity={50} color="#ffaa00" distance={10} decay={2} />

      {/* Environment for reflections */}
      <Environment preset="city" environmentIntensity={0.8} />

      {/* Background Ambience */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* The Tree Components */}
      <group position={[0, -2, 0]}>
        {/* Needle/Foliage Particles */}
        <Foliage state={treeState} count={6000} />
        
        {/* Ornaments: Gold Boxes */}
        <Ornaments state={treeState} count={150} type="cube" colorTheme="gold" />
        {/* Ornaments: Red Baubles */}
        <Ornaments state={treeState} count={200} type="sphere" colorTheme="red" />
        {/* Ornaments: Silver Baubles */}
        <Ornaments state={treeState} count={100} type="sphere" colorTheme="silver" />
      </group>

      {/* Post Processing for Cinematic Feel */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.6} // Only bright things glow
          luminanceSmoothing={0.7} 
          intensity={1.5} 
          radius={0.7}
          levels={8}
          mipmapBlur
        />
        <ToneMapping /> 
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </>
  );
};

const Scene: React.FC<SceneProps> = (props) => {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        shadows
        dpr={[1, 2]} // Handle high DPI
        gl={{ 
          antialias: false, // Let EffectComposer handle AA logic if needed, or save perf
          toneMapping: THREE.ReinhardToneMapping,
          toneMappingExposure: 1.5,
          alpha: false
        }}
      >
        <color attach="background" args={['#000502']} />
        <Suspense fallback={null}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
