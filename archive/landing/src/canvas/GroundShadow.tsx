import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function GroundShadow() {
  const meshRef = useRef<THREE.Mesh>(null);

  const shadowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0, 112, 243, 0.32)');
      grad.addColorStop(0.35, 'rgba(0, 90, 220, 0.16)');
      grad.addColorStop(0.7, 'rgba(0, 80, 200, 0.04)');
      grad.addColorStop(1, 'rgba(0, 70, 180, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const bob = Math.sin(time * 1.3) * 0.2;
    meshRef.current.scale.set(1.0 - bob * 0.15, 1.0 - bob * 0.15, 1.0);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.4, 0]}
    >
      <planeGeometry args={[6.4, 3.2]} />
      <meshBasicMaterial
        map={shadowTexture}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </mesh>
  );
}
