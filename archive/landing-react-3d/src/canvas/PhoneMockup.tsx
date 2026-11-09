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

  return (
    <group ref={groupRef} position={[0, -4, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* Phone Outer Chassis Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 4.8, 0.22]} />
        <meshPhysicalMaterial
          color="#0b132b"
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.9}
        />
      </mesh>

      {/* Screen Glass Surface */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[2.32, 4.6]} />
        <meshPhysicalMaterial
          color="#f0f7ff"
          roughness={0.1}
          metalness={0.1}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Dynamic Island / Notch */}
      <mesh position={[0, 2.05, 0.125]}>
        <boxGeometry args={[0.7, 0.16, 0.02]} />
        <meshBasicMaterial color="#0b132b" />
      </mesh>

      {/* Floating Bio Link Card 1 */}
      <mesh position={[0, 0.8, 0.18]}>
        <boxGeometry args={[1.9, 0.44, 0.04]} />
        <meshPhysicalMaterial
          color="#0070f3"
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>

      {/* Floating Bio Link Card 2 */}
      <mesh position={[0, 0.15, 0.18]}>
        <boxGeometry args={[1.9, 0.44, 0.04]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.15}
          clearcoat={0.9}
        />
      </mesh>

      {/* Floating Bio Link Card 3 */}
      <mesh position={[0, -0.5, 0.18]}>
        <boxGeometry args={[1.9, 0.44, 0.04]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>

      {/* Floating Bio Link Card 4 */}
      <mesh position={[0, -1.15, 0.18]}>
        <boxGeometry args={[1.9, 0.44, 0.04]} />
        <meshPhysicalMaterial
          color="#00c8ff"
          roughness={0.18}
          clearcoat={0.8}
        />
      </mesh>
    </group>
  );
}
