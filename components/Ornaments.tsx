import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

interface OrnamentProps {
  count?: number;
  state: TreeState;
  type: 'cube' | 'sphere';
  colorTheme: 'gold' | 'red' | 'silver';
}

const Ornaments: React.FC<OrnamentProps> = ({ count = 200, state, type, colorTheme }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions
  const data = useMemo(() => {
    const temp = [];
    const radius = 3.8; // Slightly larger than foliage
    const height = 9;

    for (let i = 0; i < count; i++) {
      // Scatter Data
      const rScatter = 12 * Math.cbrt(Math.random());
      const thetaScatter = Math.random() * Math.PI * 2;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      const xS = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      const yS = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      const zS = rScatter * Math.cos(phiScatter);

      // Tree Data
      const hNorm = Math.random();
      // Bias larger items (cubes) to bottom if needed, but random is fine for now
      const rCone = (1 - hNorm) * radius;
      // Add some randomness to radius so they aren't perfectly on surface
      const rActual = rCone + (Math.random() - 0.5) * 0.5; 
      
      const angle = hNorm * 25.0 + (Math.random() * Math.PI * 2);

      const xT = rActual * Math.cos(angle);
      const yT = (hNorm * height) - (height / 2);
      const zT = rActual * Math.sin(angle);

      // Rotation & Scale
      const scale = 0.1 + Math.random() * 0.25;
      
      temp.push({
        scatter: new THREE.Vector3(xS, yS, zS),
        tree: new THREE.Vector3(xT, yT, zT),
        scale,
        rotationSpeed: Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, [count, type]);

  // Current progress value (ref to avoid re-renders)
  const progress = useRef(0);

  useFrame((stateCtx, delta) => {
    if (!meshRef.current) return;

    // Interpolate progress
    const target = state === TreeState.TREE_SHAPE ? 1.0 : 0.0;
    const speed = 1.2; // Slightly different speed than foliage for depth
    progress.current += (target - progress.current) * speed * delta;
    
    const t = progress.current;
    
    // Ease function for position (Smoothstep)
    const smoothT = t * t * (3 - 2 * t);

    // Update every instance
    data.forEach((item, i) => {
      // Lerp Position
      dummy.position.lerpVectors(item.scatter, item.tree, smoothT);

      // Add floating noise
      const time = stateCtx.clock.elapsedTime;
      const floatAmp = (1.0 - smoothT) * 0.5 + 0.05; // Less floating in tree mode
      dummy.position.y += Math.sin(time + item.phase) * floatAmp * delta;
      dummy.position.x += Math.cos(time * 0.5 + item.phase) * (floatAmp * 0.5) * delta;

      // Rotation
      dummy.rotation.x = time * item.rotationSpeed + item.phase;
      dummy.rotation.y = time * item.rotationSpeed * 0.5 + item.phase;

      // Scale (Pop in effect logic could go here, but constant scale is fine)
      dummy.scale.setScalar(item.scale);

      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Materials setup
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      roughness: 0.15,
      metalness: 0.9,
    });
    
    if (colorTheme === 'gold') m.color.set('#FFD700');
    if (colorTheme === 'red') m.color.set('#8B0000');
    if (colorTheme === 'silver') m.color.set('#E0E0E0');
    
    return m;
  }, [colorTheme]);

  const geometry = useMemo(() => {
    return type === 'cube' 
      ? new THREE.BoxGeometry(1, 1, 1) 
      : new THREE.SphereGeometry(0.6, 16, 16);
  }, [type]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow receiveShadow />
  );
};

export default Ornaments;
