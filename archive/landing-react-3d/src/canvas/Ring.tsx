import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function OrbitRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const isReduced = useReducedMotion();

  useFrame((state, delta) => {
    if (!ringRef.current || isReduced) return;
    const time = state.clock.getElapsedTime();

    ringRef.current.rotation.z += delta * 0.4;
    ringRef.current.rotation.x = Math.PI * 0.38 + Math.sin(time * 0.7) * 0.08;
    ringRef.current.position.y = Math.sin(time * 1.3 + 0.4) * 0.15;
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI * 0.38, 0, 0]}>
      <torusGeometry args={[3.8, 0.024, 16, 120]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}
