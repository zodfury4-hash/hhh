import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GlobeProps {
  active: boolean;
}

export function GlobeTelemetry({ active }: GlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const arcsRef = useRef<THREE.Group>(null);

  // Generate geographic dots around sphere
  const dotsGeometry = useMemo(() => {
    const count = 350;
    const positions = new Float32Array(count * 3);
    const radius = 2.0;

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Generate 4 dynamic flight arcs between major traffic hubs
  const arcCurves = useMemo(() => {
    const curves: THREE.QuadraticBezierCurve3[] = [];
    const hubs = [
      new THREE.Vector3(-1.4, 0.9, 1.1),  // North America
      new THREE.Vector3(0.3, 1.2, 1.5),   // Europe
      new THREE.Vector3(1.5, 0.4, 1.2),   // East Asia
      new THREE.Vector3(0.8, -1.0, 1.4),  // Australia
    ];

    for (let i = 0; i < hubs.length - 1; i++) {
      const p1 = hubs[i];
      const p2 = hubs[i + 1];
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(2.6); // arc above globe surface
      curves.push(new THREE.QuadraticBezierCurve3(p1, mid, p2));
    }
    return curves;
  }, []);

  useFrame((state, delta) => {
    if (!globeRef.current || !active) return;
    globeRef.current.rotation.y += delta * 0.25;
    globeRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
  });

  if (!active) return null;

  return (
    <group ref={globeRef} position={[0, 0, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* Inner Transparent Sphere */}
      <mesh>
        <sphereGeometry args={[1.98, 32, 32]} />
        <meshPhysicalMaterial
          color="#0070f3"
          transparent
          opacity={0.12}
          roughness={0.1}
          clearcoat={1.0}
        />
      </mesh>

      {/* Wireframe Latitude / Longitude Rings */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Surface Geographic Points */}
      <points geometry={dotsGeometry}>
        <pointsMaterial
          size={0.06}
          color="#00c8ff"
          transparent
          opacity={0.85}
        />
      </points>

      {/* Traffic Arcs */}
      <group ref={arcsRef}>
        {arcCurves.map((curve, idx) => {
          const points = curve.getPoints(50);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          return (
            <line key={idx} geometry={lineGeo}>
              <lineBasicMaterial color="#00d2ff" transparent opacity={0.7} />
            </line>
          );
        })}
      </group>
    </group>
  );
}
