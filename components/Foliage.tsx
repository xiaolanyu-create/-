import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';

// Shader for the magical foliage
// Uses mix() to transition between scatter and tree positions
const vertexShader = `
  uniform float uTime;
  uniform float uProgress; // 0.0 = Scattered, 1.0 = Tree
  
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  
  varying float vAlpha;
  varying vec3 vColor;

  // Cubic Ease In Out
  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    // Easing for smooth transition
    float t = easeInOutCubic(uProgress);
    
    // Interpolate position
    vec3 pos = mix(aScatterPos, aTreePos, t);
    
    // Add "Breathing" and "Floating" noise
    // Scatter state has more chaotic movement, Tree state has gentle breathing
    float breathe = sin(uTime * 2.0 + aRandom * 10.0) * 0.05;
    float floatY = sin(uTime * 0.5 + aRandom * 20.0) * (0.5 * (1.0 - t)); // More float in scatter
    
    // Apply micro movements
    pos.x += breathe * (0.2 + 0.8 * (1.0-t)); // More X shake in scatter
    pos.y += breathe * 0.1 + floatY;
    pos.z += breathe * (0.2 + 0.8 * (1.0-t));
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Size attenuation: larger when close, but clamped
    float baseSize = 0.15;
    // Particles sparkle more in tree form
    float sparkle = 1.0 + sin(uTime * 3.0 + aRandom * 100.0) * 0.5 * t; 
    
    gl_PointSize = baseSize * (300.0 / -mvPosition.z) * sparkle;
    gl_Position = projectionMatrix * mvPosition;
    
    // Pass randomness to fragment
    vAlpha = 0.6 + 0.4 * sin(uTime + aRandom * 10.0);
    
    // Color Mix: Deep Emerald to Golden Green
    // In scatter mode, they are slightly darker/mysterious
    vec3 emerald = vec3(0.0, 0.25, 0.1);
    vec3 gold = vec3(1.0, 0.8, 0.2);
    
    // Edge glow effect based on random
    vColor = mix(emerald, gold, aRandom * 0.2 * t);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    // Circular particle with soft edge
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float r = length(xy);
    if (r > 0.5) discard;
    
    // Glow gradient
    float glow = 1.0 - (r * 2.0);
    glow = pow(glow, 1.5);
    
    gl_FragColor = vec4(vColor, vAlpha * glow);
  }
`;

interface FoliageProps {
  count?: number;
  state: TreeState;
}

const Foliage: React.FC<FoliageProps> = ({ count = 4000, state }) => {
  const meshRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Target progress value for animation
  const targetProgress = useRef(0);

  const { attributes, uniforms } = useMemo(() => {
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    const radius = 3.5; // Base radius of tree
    const height = 9;   // Height of tree

    for (let i = 0; i < count; i++) {
      // 1. Scatter Positions (Sphere / Cloud)
      const rScatter = 15 * Math.cbrt(Math.random()); // Spread out
      const thetaScatter = Math.random() * Math.PI * 2;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      
      scatterPos[i * 3] = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      scatterPos[i * 3 + 1] = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      scatterPos[i * 3 + 2] = rScatter * Math.cos(phiScatter);

      // 2. Tree Positions (Cone spiral)
      // Normalized height (0 at bottom, 1 at top)
      const hNorm = Math.random(); 
      // Cone radius at this height (tapers to 0 at top)
      const rCone = (1 - hNorm) * radius; 
      const angle = hNorm * 30.0 + (Math.random() * Math.PI * 2); // Spiral up
      
      treePos[i * 3] = rCone * Math.cos(angle);
      treePos[i * 3 + 1] = (hNorm * height) - (height / 2); // Center y
      treePos[i * 3 + 2] = rCone * Math.sin(angle);
      
      // Random attributes
      randoms[i] = Math.random();
    }

    return {
      attributes: {
        aScatterPos: new THREE.BufferAttribute(scatterPos, 3),
        aTreePos: new THREE.BufferAttribute(treePos, 3),
        aRandom: new THREE.BufferAttribute(randoms, 1),
      },
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      }
    };
  }, [count]);

  useFrame((stateCtx, delta) => {
    if (!shaderRef.current) return;

    // Update Time
    shaderRef.current.uniforms.uTime.value += delta;

    // Smooth transition logic
    const target = state === TreeState.TREE_SHAPE ? 1.0 : 0.0;
    // Linear interpolation for the uniform value (damped)
    const current = shaderRef.current.uniforms.uProgress.value;
    const speed = 1.5; // Transition speed
    
    let next = current + (target - current) * speed * delta;
    
    // Clamp
    if (Math.abs(target - next) < 0.001) next = target;
    
    shaderRef.current.uniforms.uProgress.value = next;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" {...attributes.aScatterPos} /> {/* Initial generic pos */}
        <bufferAttribute attach="attributes-aScatterPos" {...attributes.aScatterPos} />
        <bufferAttribute attach="attributes-aTreePos" {...attributes.aTreePos} />
        <bufferAttribute attach="attributes-aRandom" {...attributes.aRandom} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;
