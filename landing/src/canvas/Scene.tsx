import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { InfinityKnot } from './Infinity';
import { OrbitRing } from './Ring';
import { DriftingParticles } from './Particles';
import { GroundShadow } from './GroundShadow';
import { useIsMobile } from '../hooks/useIsMobile';
import { useAppStore } from '../lib/store';

interface HeroSceneProps {
  mousePosition: { x: number; y: number };
}

export function HeroScene({ mousePosition }: HeroSceneProps) {
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
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <picture>
          <source srcSet="/images/hero-infinity-hd.webp" type="image/webp" />
          <img
            src="/images/hero-infinity-hd.png"
            alt="HEA Link 3D Blue Infinity"
            className="w-full max-w-[540px] h-auto object-contain select-none pointer-events-none drop-shadow-xl"
            loading="eager"
          />
        </picture>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center">
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
          {/* Lighting Rig */}
          <ambientLight intensity={0.8} />

          {/* Key Light: Vibrant cyan/sky-blue */}
          <directionalLight position={[5, 6, 7]} intensity={2.2} color="#00d2ff" />

          {/* Rim Backlight: Crisp White */}
          <directionalLight position={[-6, -3, -5]} intensity={2.6} color="#ffffff" />

          {/* Fill Light: Vibrant Electric Blue */}
          <pointLight position={[0, 1, 5]} intensity={1.8} distance={25} color="#0066ff" />

          {/* Lightweight Drei Environment with Lightformers for Glossy Reflections */}
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

          {/* 3D Infinity Knot with Mouse Lerp */}
          <InfinityKnot mousePosition={mousePosition} />

          {/* Orbiting Thin Ring */}
          <OrbitRing />

          {/* Drifting Ambient Particles */}
          <DriftingParticles />

          {/* Subtle Ground Shadow */}
          <GroundShadow />
        </Suspense>
      </Canvas>
    </div>
  );
}
