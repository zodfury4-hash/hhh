import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface QrCubesProps {
  progress: number; // 0 (scattered) to 1 (fully assembled)
  active: boolean;
}

// 21x21 classic QR matrix bitmask pattern (corners, timing lines, data clusters)
function isQrModuleActive(row: number, col: number): boolean {
  // Top-left finder pattern 7x7
  if (row < 7 && col < 7) {
    if (row === 0 || row === 6 || col === 0 || col === 6) return true;
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
    return false;
  }
  // Top-right finder pattern 7x7
  if (row < 7 && col >= 14) {
    const c = col - 14;
    if (row === 0 || row === 6 || c === 0 || c === 6) return true;
    if (row >= 2 && row <= 4 && c >= 2 && c <= 4) return true;
    return false;
  }
  // Bottom-left finder pattern 7x7
  if (row >= 14 && col < 7) {
    const r = row - 14;
    if (r === 0 || r === 6 || col === 0 || col === 6) return true;
    if (r >= 2 && r <= 4 && col >= 2 && col <= 4) return true;
    return false;
  }
  // Timing patterns
  if (row === 6 && col % 2 === 0) return true;
  if (col === 6 && row % 2 === 0) return true;

  // Pseudo-random deterministic module pattern for the data area
  return ((row * 7 + col * 13 + row * col) % 3 === 0) || ((row + col) % 5 === 0);
}

export function QrCubes({ progress, active }: QrCubesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);

  // Compute 21x21 module grid targets and initial scattered positions
  const count = 21 * 21;
  const { targets, initialOffsets } = useMemo(() => {
    const t: { x: number; y: number; z: number; scale: number }[] = [];
    const init: { x: number; y: number; z: number; rotX: number; rotY: number }[] = [];
    const spacing = 0.17;
    const centerOffset = (21 * spacing) / 2;

    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const isModule = isQrModuleActive(r, c);
        const x = c * spacing - centerOffset;
        const y = -(r * spacing - centerOffset);
        const z = isModule ? 0.05 : 0;
        t.push({
          x,
          y,
          z,
          scale: isModule ? 1 : 0.22,
        });

        // Scatter out radially
        const angle = Math.random() * Math.PI * 2;
        const dist = 3.5 + Math.random() * 4;
        init.push({
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          z: (Math.random() - 0.5) * 4,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
        });
      }
    }
    return { targets: t, initialOffsets: init };
  }, []);

  useFrame(() => {
    if (!meshRef.current || !active) return;

    // Smooth cubic ease interpolation between scattered and assembled
    const t = Math.max(0, Math.min(1, progress));
    const smoothT = t * t * (3 - 2 * t);

    for (let i = 0; i < count; i++) {
      const tgt = targets[i];
      const ini = initialOffsets[i];

      const curX = THREE.MathUtils.lerp(ini.x, tgt.x, smoothT);
      const curY = THREE.MathUtils.lerp(ini.y, tgt.y, smoothT);
      const curZ = THREE.MathUtils.lerp(ini.z, tgt.z, smoothT);

      const curScale = THREE.MathUtils.lerp(0.01, tgt.scale * 0.14, smoothT);
      const curRotX = (1 - smoothT) * ini.rotX;
      const curRotY = (1 - smoothT) * ini.rotY;

      matrix.makeRotationX(curRotX);
      matrix.multiply(new THREE.Matrix4().makeRotationY(curRotY));
      matrix.scale(new THREE.Vector3(curScale, curScale, curScale));
      matrix.setPosition(curX, curY, curZ);

      meshRef.current.setMatrixAt(i, matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <group position={[0, 0, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 0.4]} />
        <meshPhysicalMaterial
          color="#0070f3"
          roughness={0.16}
          metalness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
        />
      </instancedMesh>
    </group>
  );
}
