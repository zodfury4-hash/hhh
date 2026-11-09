import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

interface QrCubesProps {
  progress: number; // 0 (start of section) to 1 (end of section)
  active: boolean;
  mousePosition?: { x: number; y: number };
}

/**
 * High-Taste 3D Holographic Precision Crystal & Gyro Matrix
 * Designed strictly to match HEA Link's clean UI design system:
 * - Anti-slop: pure geometric precision, crown glass refraction, no messy pixel cubes
 * - Precision chamfered outer crystal with cyan hairline outline
 * - Living luminous energy core with harmonic breathing pulse
 * - Dual precessing gyro rings with orbital telemetry satellites
 * - Holographic laser scanning disc gliding through the crystal
 * - Natural cubic ease entrance/exit and responsive cursor parallax
 */
export function QrCubes({ progress, active, mousePosition }: QrCubesProps) {
  const masterGroupRef = useRef<THREE.Group>(null);
  const outerCrystalRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const scanDiscRef = useRef<THREE.Mesh>(null);
  const innerMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  // Pre-generate edge lines for precision chamfered outline
  const edgesGeometry = useMemo(() => {
    const octGeo = new THREE.OctahedronGeometry(1.28, 0);
    return new THREE.EdgesGeometry(octGeo);
  }, []);

  useFrame((state, delta) => {
    if (!masterGroupRef.current) return;

    if (!active) {
      masterGroupRef.current.visible = false;
      return;
    }
    masterGroupRef.current.visible = true;

    const time = state.clock.getElapsedTime();

    // Smooth entry and exit envelope based on scroll progress (0 -> 1)
    // 0.0 - 0.2: smooth entrance scale-in
    // 0.2 - 0.8: full presentation scale
    // 0.8 - 1.0: smooth exit scale-out
    let scaleFactor = 1;
    if (progress < 0.2) {
      const t = Math.max(0, progress / 0.2);
      scaleFactor = t * t * (3 - 2 * t);
    } else if (progress > 0.8) {
      const t = Math.max(0, (1 - progress) / 0.2);
      scaleFactor = t * t * (3 - 2 * t);
    }

    // Master floating bobbing
    const floatY = Math.sin(time * 1.4) * 0.12;
    masterGroupRef.current.position.y = floatY;

    // Apply scale smoothly
    const baseScale = isMobile ? 0.78 : 1.05;
    const currentScale = baseScale * scaleFactor;
    masterGroupRef.current.scale.set(currentScale, currentScale, currentScale);

    // Mouse parallax tilt on desktop
    if (!isReduced && mousePosition && !isMobile) {
      const targetParallaxY = mousePosition.x * 0.35;
      const targetParallaxX = -mousePosition.y * 0.25;
      masterGroupRef.current.rotation.y += (targetParallaxY - masterGroupRef.current.rotation.y) * 0.06;
      masterGroupRef.current.rotation.x += (targetParallaxX - masterGroupRef.current.rotation.x) * 0.06;
    }

    if (!isReduced) {
      // 1. Rotate outer glass crystal
      if (outerCrystalRef.current) {
        outerCrystalRef.current.rotation.y += delta * 0.45;
        outerCrystalRef.current.rotation.x = Math.sin(time * 0.7) * 0.15;
        outerCrystalRef.current.rotation.z = Math.cos(time * 0.5) * 0.08;
      }

      // 2. Counter-rotate inner luminous core with breathing intensity
      if (innerCoreRef.current) {
        innerCoreRef.current.rotation.y -= delta * 0.65;
        innerCoreRef.current.rotation.z = Math.sin(time * 1.1) * 0.2;
      }
      if (innerMaterialRef.current) {
        const pulse = 1.4 + Math.sin(time * 2.4) * 0.5;
        innerMaterialRef.current.emissiveIntensity = pulse;
      }

      // 3. Orbital Gyro Rings precession
      if (ring1Ref.current) {
        ring1Ref.current.rotation.z += delta * 0.35;
        ring1Ref.current.rotation.x = 0.45 + Math.sin(time * 0.6) * 0.1;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.y -= delta * 0.4;
        ring2Ref.current.rotation.z = -0.55 + Math.cos(time * 0.5) * 0.12;
      }

      // 4. Smooth holographic scanning ring gliding vertically
      if (scanDiscRef.current) {
        scanDiscRef.current.position.y = Math.sin(time * 1.6) * 0.85;
        scanDiscRef.current.rotation.z += delta * 0.2;
      }
    }
  });

  return (
    <group ref={masterGroupRef} position={[0, 0, 0]}>
      {/* 1. Precision Outer Glass Octahedron */}
      <mesh ref={outerCrystalRef} castShadow receiveShadow>
        <octahedronGeometry args={[1.28, 0]} />
        <meshPhysicalMaterial
          color="#0070f3"
          roughness={0.08}
          metalness={0.12}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          transmission={0.7}
          thickness={1.1}
          ior={1.52}
          transparent
          opacity={0.92}
        />

        {/* Crisp Chamfered Hairline Outline */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#00d2ff" transparent opacity={0.65} linewidth={1} />
        </lineSegments>
      </mesh>

      {/* 2. Inner Floating Luminous Energy Core */}
      <mesh ref={innerCoreRef} scale={[0.55, 0.55, 0.55]}>
        <octahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial
          ref={innerMaterialRef}
          color="#00c8ff"
          emissive="#0066ff"
          emissiveIntensity={1.5}
          roughness={0.18}
          metalness={0.82}
        />
      </mesh>

      {/* 3. Primary Orbital Gyro Ring + Satellites */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[1.82, 0.016, 16, 96]} />
          <meshStandardMaterial
            color="#00c8ff"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
        {/* Orbital Node 1 */}
        <mesh position={[1.82, 0, 0]}>
          <sphereGeometry args={[0.048, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Orbital Node 2 */}
        <mesh position={[-1.82, 0, 0]}>
          <sphereGeometry args={[0.048, 16, 16]} />
          <meshBasicMaterial color="#00d2ff" />
        </mesh>
      </group>

      {/* 4. Secondary Precessing Gyro Ring + Satellites */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[2.14, 0.013, 16, 96]} />
          <meshStandardMaterial
            color="#38bdf8"
            metalness={0.88}
            roughness={0.2}
          />
        </mesh>
        {/* Orbital Node 3 */}
        <mesh position={[0, 2.14, 0]}>
          <sphereGeometry args={[0.042, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* 5. Holographic Scanning Light Disc */}
      <mesh ref={scanDiscRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 1.35, 64]} />
        <meshBasicMaterial
          color="#00c8ff"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Soft Ambient Light Pool / Ground Halo */}
      <mesh position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 48]} />
        <meshBasicMaterial
          color="#0070f3"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
