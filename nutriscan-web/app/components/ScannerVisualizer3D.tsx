'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface ScannerProps {
  score?: 'A' | 'B' | 'C' | 'D' | 'E' | 'UNKNOWN';
  isScanning?: boolean;
}

const GRADE_TINTS: Record<string, string> = {
  A: '#15803d',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  E: '#ef4444',
  UNKNOWN: '#9BD86F',
};

function PrismCore({ score, isScanning }: ScannerProps) {
  const prismRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Mesh>(null);

  const activeColor = score ? GRADE_TINTS[score] || '#9BD86F' : '#9BD86F';

  useFrame((state, delta) => {
    if (prismRef.current) {
      prismRef.current.rotation.y += delta * (isScanning ? 2.5 : 0.5);
      prismRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.7) * 0.15;
    }
    if (laserRef.current && isScanning) {
      laserRef.current.position.y = Math.sin(state.clock.elapsedTime * 5) * 0.8;
    }
  });

  return (
    <group ref={prismRef}>
      {/* Outer Floating Geometric Prism */}
      <mesh>
        <octahedronGeometry args={[1.2, 0]} />
        <meshPhysicalMaterial
          color={activeColor}
          transmission={0.65}
          opacity={1}
          transparent
          roughness={0.15}
          metalness={0.1}
          ior={1.4}
        />
      </mesh>

      {/* Internal Core Nucleus */}
      <mesh>
        <sphereGeometry args={[0.45, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={activeColor}
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Scanning Laser Beam Plane */}
      {isScanning && (
        <mesh ref={laserRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 2.5]} />
          <meshBasicMaterial
            color="#9BD86F"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default function ScannerVisualizer3D({ score, isScanning }: ScannerProps) {
  return (
    <div className="w-full h-56 md:h-64 relative flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 3.8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} />
        <directionalLight position={[-3, -3, -2]} color="#9BD86F" intensity={0.5} />
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
          <PrismCore score={score} isScanning={isScanning} />
        </Float>
        <ContactShadows position={[0, -1.3, 0]} opacity={0.3} scale={4} blur={2.2} />
      </Canvas>
    </div>
  );
}