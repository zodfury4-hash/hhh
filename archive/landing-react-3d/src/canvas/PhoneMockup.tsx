import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PhoneMockupProps {
  progress: number;
  active: boolean;
}

export function PhoneMockup({ progress, active }: PhoneMockupProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const time = state.clock.getElapsedTime();

    // Tilt smoothly with scroll and gentle harmonic float
    const targetY = THREE.MathUtils.lerp(-4, 0, Math.min(progress * 1.5, 1));
    const targetRotX = THREE.MathUtils.lerp(0.5, 0.15, progress) + Math.sin(time * 0.8) * 0.04;
    const targetRotY = THREE.MathUtils.lerp(-0.6, 0.25, progress) + Math.cos(time * 0.6) * 0.05;

    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.1;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.1;
    groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.1;
  });

  if (!active) return null;

  return null;
}
