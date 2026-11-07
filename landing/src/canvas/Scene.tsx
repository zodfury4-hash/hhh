import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { ScrollRig } from './ScrollRig';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAppStore } from '../lib/store';

interface MasterSceneProps {
  mousePosition: { x: number; y: number };
}

export function MasterScene({ mousePosition }: MasterSceneProps) {
  const isMobile = useIsMobile();
  const setWebglAvailable = useAppStore((s) => s.setWebglAvailable);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const cvs = document.createElement('canvas');
      const gl = cvs.getContext('webgl') || cvs.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        setWebglAvailable(false);
      }
    } catch {
      setHasWebGL(false);
      setWebglAvailable(false);
    }
  }, [setWebglAvailable]);

  if (!hasWebGL) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 7.8], fov: 42 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        className="pointer-events-none"
      >
        <Suspense fallback={null}>
          {/* Studio Lighting Rig */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 6, 7]} intensity={2.2} color="#00d2ff" />
          <directionalLight position={[-6, -3, -5]} intensity={2.6} color="#ffffff" />
          <pointLight position={[0, 1, 5]} intensity={1.8} distance={25} color="#0066ff" />

          {/* Lightweight Environment Reflections */}
          <Environment resolution={128}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer
                form="circle"
                intensity={4}
                rotation-x={Math.PI / 2}
                position={[0, 5, -9]}
                scale={[10, 10, 1]}
                color="#00c8ff"
              />
              <Lightformer
                form="ring"
                intensity={2}
                position={[-5, 2, -1]}
                scale={[10, 5, 1]}
                color="#ffffff"
              />
              <Lightformer
                form="rect"
                intensity={2}
                position={[10, 0, 1]}
                scale={[10, 10, 1]}
                color="#38bdf8"
              />
            </group>
          </Environment>

          {/* Master 3D Scroll Rig (Persistent Object + Scrollytelling Transitions) */}
          <ScrollRig mousePosition={mousePosition} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Alias for convenience
export const HeroScene = MasterScene;
