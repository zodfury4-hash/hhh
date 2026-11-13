import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

export function DriftingParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();

  const count = isMobile ? 22 : 44;

  const { positions, metadata } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const meta: { angle: number; radius: number; speed: number; baseY: number; bobSpeed: number; bobAmp: number }[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const radius = 2.4 + Math.random() * 2.8;
      const baseY = (Math.random() - 0.5) * 2.6;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = baseY;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      meta.push({
        angle,
        radius,
        speed: (0.12 + Math.random() * 0.18) * (Math.random() > 0.5 ? 1 : -1),
        baseY,
        bobSpeed: 0.8 + Math.random() * 1.2,
        bobAmp: 0.15 + Math.random() * 0.25,
      });
    }

    return { positions: pos, metadata: meta };
  }, [count]);

  // Create soft radial circle particle texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(56, 189, 248, 1)');
      grad.addColorStop(0.35, 'rgba(0, 112, 243, 0.7)');
      grad.addColorStop(1, 'rgba(0, 112, 243, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || isReduced) return;
    const time = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      const m = metadata[i];
      m.angle += delta * m.speed;
      const px = Math.cos(m.angle) * m.radius;
      const py = m.baseY + Math.sin(time * m.bobSpeed) * m.bobAmp;
      const pz = Math.sin(m.angle) * m.radius;
      posAttr.setXYZ(i, px, py, pz);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.24}
        map={particleTexture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
