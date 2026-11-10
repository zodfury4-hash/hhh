import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InfinityKnot } from './Infinity';
import { OrbitRing } from './Ring';
import { DriftingParticles } from './Particles';
import { GroundShadow } from './GroundShadow';
import { QrCubes } from './QrCubes';
import { PhoneMockup } from './PhoneMockup';
import { GlobeTelemetry } from './Globe';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useIsMobile } from '../hooks/useIsMobile';

interface ScrollRigProps {
  mousePosition: { x: number; y: number };
}

export function ScrollRig({ mousePosition }: ScrollRigProps) {
  const scroll = useScrollProgress();
  const isReduced = useReducedMotion();
  const isMobile = useIsMobile();
  const { camera } = useThree();

  const knotGroupRef = useRef<THREE.Group>(null);

  // Divide the scroll page into 7 distinct scene segments [0, 1, 2, 3, 4, 5, 6]
  // Total progress ranges 0.0 to 1.0:
  // Scene 0: Hero (0.00 - 0.14)
  // Scene 1: Short Links (0.14 - 0.28)
  // Scene 2: QR Codes (0.28 - 0.44)
  // Scene 3: Bio Pages (0.44 - 0.60)
  // Scene 4: Analytics (0.60 - 0.74)
  // Scene 5: Features & Pricing (0.74 - 0.88)
  // Scene 6: Final CTA (0.88 - 1.00)

  const isHeroScene = scroll < 0.16;
  const isShortLinksScene = scroll >= 0.14 && scroll < 0.30;
  const isQrScene = scroll >= 0.28 && scroll < 0.46;
  const isBioScene = scroll >= 0.44 && scroll < 0.62;
  const isAnalyticsScene = scroll >= 0.60 && scroll < 0.76;
  const isCtaScene = scroll >= 0.86;

  // Scene-specific relative progress
  const qrProgress = isQrScene ? (scroll - 0.28) / 0.16 : 0;
  const bioProgress = isBioScene ? (scroll - 0.44) / 0.16 : 0;

  useFrame(() => {
    if (!knotGroupRef.current) return;

    if (isReduced) {
      // In reduced motion, keep stationary default position
      knotGroupRef.current.position.set(isMobile ? 0 : 2.2, -0.45, 0);
      knotGroupRef.current.scale.set(1, 1, 1);
      return;
    }

    // Dynamic Camera Dolly across scroll
    const targetCamZ = THREE.MathUtils.lerp(7.8, 8.5, Math.sin(scroll * Math.PI));
    camera.position.z += (targetCamZ - camera.position.z) * 0.05;

    // 1. Position & Scale the Infinity Knot based on current scene
    let targetX = isMobile ? 0 : 2.2;
    let targetY = -0.45;
    let targetZ = 0;
    let targetScale = 1;
    let knotOpacity = 1;

    if (isHeroScene) {
      // Hero: Right column, positioned with comfortable breathing room from top navbar
      targetX = isMobile ? 0 : 2.2;
      targetY = -0.45;
      targetScale = 1;
    } else if (isShortLinksScene) {
      // Short Links: Object moves to center and scales up smoothly
      targetX = 0;
      targetY = 0.6;
      targetScale = 1.25;
    } else if (isQrScene) {
      // QR Codes: Seamless floating knot
      targetX = isMobile ? 0 : 2.2;
      targetY = -0.4;
      targetScale = 0.85;
      knotOpacity = 1;
    } else if (isBioScene) {
      // Bio Pages: Infinity moves to upper corner
      targetX = isMobile ? 0 : -2.6;
      targetY = 1.4;
      targetScale = 0.55;
    } else if (isAnalyticsScene) {
      // Analytics: Upper floating ornament
      targetX = isMobile ? 0 : 2.8;
      targetY = 1.5;
      targetScale = 0.5;
    } else if (isCtaScene) {
      // Final CTA: Returns to center hero position with sparkling grandeur
      targetX = 0;
      targetY = 0.3;
      targetScale = 1.15;
    } else {
      // Features & Pricing: Subtle floating background accent
      targetX = 2.4;
      targetY = -0.5;
      targetScale = 0.45;
    }

    knotGroupRef.current.position.x += (targetX - knotGroupRef.current.position.x) * 0.08;
    knotGroupRef.current.position.y += (targetY - knotGroupRef.current.position.y) * 0.08;
    knotGroupRef.current.position.z += (targetZ - knotGroupRef.current.position.z) * 0.08;

    const curScale = knotGroupRef.current.scale.x;
    const newScale = curScale + (targetScale - curScale) * 0.08;
    knotGroupRef.current.scale.set(newScale, newScale, newScale);
    knotGroupRef.current.visible = knotOpacity > 0.02;
  });

  return (
    <>
      {/* 1. Persistent 3D Infinity Knot Group */}
      <group ref={knotGroupRef} position={[isMobile ? 0 : 2.2, -0.45, 0]}>
        <InfinityKnot mousePosition={mousePosition} />
        <OrbitRing />
        <DriftingParticles />
        <GroundShadow />
      </group>

      {/* 2. Scene 2: Diamond animation hidden as requested */}

      {/* 3. Scene 3: Mobile animation hidden as requested */}

      {/* 4. Scene 4: 3D Globe with Traffic Arcs */}
      <group position={[isMobile ? 0 : -2.0, 0, 0]}>
        <GlobeTelemetry active={isAnalyticsScene} />
      </group>
    </>
  );
}
