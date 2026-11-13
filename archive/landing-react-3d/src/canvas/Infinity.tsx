import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

// Custom 3D Lemniscate Knot Curve in Three.js
class Lemniscate3DCurve extends THREE.Curve<THREE.Vector3> {
  scale: number;
  heightOffset: number;

  constructor(scale = 2.8, heightOffset = 0.72) {
    super();
    this.scale = scale;
    this.heightOffset = heightOffset;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()): THREE.Vector3 {
    const theta = t * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const denom = 1 + sinT * sinT;

    // Lemniscate of Bernoulli
    const x = (this.scale * cosT) / denom;
    const y = (this.scale * sinT * cosT) / denom;

    // Smooth sinusoidal height separation to weave strands cleanly without collision
    const z = this.heightOffset * sinT;

    return optionalTarget.set(x, y, z);
  }
}

interface InfinityKnotProps {
  mousePosition?: { x: number; y: number };
}

export function InfinityKnot({ mousePosition }: InfinityKnotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  // Create geometry with vertex color gradient: #00c8ff -> #0066ff -> #0047d6
  const { geometry } = useMemo(() => {
    const scale = isMobile ? 2.1 : 2.75;
    const tubeRadius = isMobile ? 0.32 : 0.42;
    const curve = new Lemniscate3DCurve(scale, 0.72);
    const geo = new THREE.TubeGeometry(curve, 160, tubeRadius, 28, true);

    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);

    const colLeft = new THREE.Color('#00c8ff');
    const colMid = new THREE.Color('#0066ff');
    const colRight = new THREE.Color('#0047d6');

    for (let i = 0; i < count; i++) {
      const x = geo.attributes.position.getX(i);
      const alpha = Math.min(Math.max((x + scale) / (scale * 2), 0), 1);
      let c = new THREE.Color();
      if (alpha < 0.5) {
        c = colLeft.clone().lerp(colMid, alpha * 2);
      } else {
        c = colMid.clone().lerp(colRight, (alpha - 0.5) * 2);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geo };
  }, [isMobile]);

  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    const time = state.clock.getElapsedTime();

    if (!isReduced) {
      // Continuous slow rotation & bobbing
      meshRef.current.rotation.y += delta * 0.35;
      meshRef.current.rotation.x = Math.sin(time * 0.8) * 0.08;

      const bobY = Math.sin(time * 1.3) * 0.2;
      meshRef.current.position.y = bobY;

      // Mouse parallax tilt lerp on desktop
      if (mousePosition && !isMobile) {
        const targetRotY = mousePosition.x * 0.45;
        const targetRotX = -mousePosition.y * 0.35;

        groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.08;
        groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.08;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.14}
          metalness={0.16}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          reflectivity={0.9}
        />
      </mesh>
    </group>
  );
}
