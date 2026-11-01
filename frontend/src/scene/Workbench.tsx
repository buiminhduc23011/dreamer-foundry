import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { DustyProject } from '../types';
import { useLabStore } from '../store/labStore';
import { BurstEmitter, Cobweb, RisingEmitter } from './particles';

interface WorkbenchProps {
  project: DustyProject;
  sagging: boolean;
  children: ReactNode;
}

const dustColor = (d: number) => (d > 80 ? '#ff4d5e' : d > 55 ? '#ffb02e' : '#3dffa0');

/**
 * One haunted pedestal: hardware base + hologram ring + dust coat +
 * floating HUD tag + all interactive FX emitters.
 */
const EMPTY_FX = { incense: 0, dust: 0, bonk: 0, boom: 0 } as const;

export function Workbench({ project, sagging, children }: WorkbenchProps) {
  const select = useLabStore((s) => s.select);
  const selected = useLabStore((s) => s.selectedId === project.id);
  const fx = useLabStore((s) => s.fx[project.id]) ?? EMPTY_FX;

  const dustSparkle = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  const [incenseActive, setIncenseActive] = useState(false);
  const incenseUntil = useRef(0);
  const lastIncense = useRef(0);
  const boomFlash = useRef(0);
  const lastBoom = useRef(0);
  const modelGroup = useRef<THREE.Group>(null);
  const bonkT = useRef(-1);
  const lastBonk = useRef(0);

  // dust coat opacity tracks live dust level
  const dustOpacity = Math.min(0.55, (project.dustLevel / 100) * 0.7);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (fx.incense !== lastIncense.current) {
      lastIncense.current = fx.incense;
      incenseUntil.current = t + 6;
      setIncenseActive(true);
    }
    if (incenseActive && t > incenseUntil.current) setIncenseActive(false);
    if (fx.boom !== lastBoom.current) {
      lastBoom.current = fx.boom;
      boomFlash.current = 1;
    }
    if (fx.bonk !== lastBonk.current) {
      lastBonk.current = fx.bonk;
      bonkT.current = t;
    }
    // incense makes the hologram ring burn brighter
    const boost = incenseActive ? 1.8 : 1;
    const flicker = sagging ? 0.3 + Math.random() * 0.5 : 1;
    if (ringMat.current) ringMat.current.opacity = Math.min(1, 0.5 * boost * flicker);
    if (glowLight.current) glowLight.current.intensity = 2.5 * boost * flicker + boomFlash.current * 30;
    boomFlash.current *= 0.85;
    // bonk jolts the model
    if (modelGroup.current) {
      const dt = t - bonkT.current;
      if (dt >= 0 && dt < 0.5) {
        const k = (1 - dt / 0.5) * 0.06;
        modelGroup.current.position.x = Math.sin(t * 90) * k;
        modelGroup.current.rotation.z = Math.sin(t * 70) * k * 0.5;
      } else {
        modelGroup.current.position.x = 0;
        modelGroup.current.rotation.z = 0;
      }
    }
    if (dustSparkle.current) dustSparkle.current.rotation.y = t * 0.05;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(project.id);
  };

  return (
    <group position={project.position as [number, number, number]}>
      {/* pedestal base */}
      <mesh position={[0, 0.15, 0]} onClick={onClick}>
        <cylinderGeometry args={[1.35, 1.55, 0.3, 8]} />
        <meshStandardMaterial color="#131c26" metalness={0.7} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.34, 32]} />
        <meshBasicMaterial ref={ringMat} color="#2ee6ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* amber warning ring under the truly doomed */}
      {project.dustLevel > 80 && (
        <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.08, 32]} />
          <meshBasicMaterial color="#ff4d5e" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* the ghost project itself */}
      <group ref={modelGroup} position={[0, 0.32, 0]} onClick={onClick}>
        {children}
      </group>

      {/* dust coat clinging to the model — scales with dustLevel */}
      <group ref={dustSparkle} position={[0, 0.9, 0]}>
        <DustCoat opacity={dustOpacity} />
      </group>

      {/* cobwebs for the truly abandoned */}
      {project.dustLevel > 85 && (
        <>
          <Cobweb position={[0.8, 1.9, 0.8]} rotation={[0, -Math.PI / 4, 0.3]} radius={0.7} />
          <Cobweb position={[-0.85, 1.6, -0.6]} rotation={[0, Math.PI / 3, -0.2]} radius={0.55} />
        </>
      )}

      {/* smoke plume for the mortally wounded */}
      <group position={[0, 1.6, 0]}>
        <RisingEmitter active={project.smoking} color="#6b5a8a" count={60} height={2.2} radius={0.3} speed={0.5} size={0.09} opacity={0.35} />
        <RisingEmitter active={project.smoking} color="#8a7a9a" count={40} height={2.8} radius={0.45} speed={0.3} size={0.13} opacity={0.2} />
      </group>

      {/* golden incense offering column */}
      <group position={[0, 0.35, 0]}>
        <RisingEmitter active={incenseActive} color="#ffcf6b" count={140} height={2.6} radius={0.6} speed={0.7} size={0.055} opacity={0.85} wobble={0.8} />
        <RisingEmitter active={incenseActive} color="#ffb02e" count={60} height={2.2} radius={0.3} speed={0.9} size={0.08} opacity={0.6} />
      </group>

      {/* compressed-air dust blow */}
      <group position={[0, 0.9, 0]}>
        <BurstEmitter nonce={fx.dust} count={260} speed={3.2} color="#9fc4d4" />
      </group>

      <pointLight ref={glowLight} position={[0, 1.6, 0]} color="#2ee6ff" intensity={2.5} distance={5} decay={2} />

      {/* floating holographic tag — hides while its drawer is open */}
      {!selected && (
      <Html position={[0, 2.6, 0]} center distanceFactor={8} className="holo-tag">
        <div
          onClick={() => select(project.id)}
          className={`cursor-pointer select-none border px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm transition-all ${
            selected ? 'border-holo bg-holo/20' : 'border-holo/40 bg-void/70 hover:border-holo'
          }`}
        >
          <div className="font-display text-[11px] font-bold tracking-widest text-holo">{project.codeName}</div>
          <div className="mt-0.5 flex gap-3 text-[9px]">
            <span className="text-holo/70">▓ {project.completionPercent}% XONG</span>
            <span style={{ color: dustColor(project.dustLevel) }}>ĐỘ PHỦ BỤI: {Math.round(project.dustLevel)}%</span>
            {project.smoking && <span className="text-danger animate-pulse">☁ KHÓI</span>}
          </div>
        </div>
      </Html>
      )}
    </group>
  );
}

/** lazy sparkle coat — avoids re-mounting Sparkles (count prop is static anyway) */
function DustCoat({ opacity }: { opacity: number }) {
  const matRef = useRef<THREE.PointsMaterial>(null);
  const positions = useRef<Float32Array | null>(null);

  if (!positions.current) {
    const count = 140;
    positions.current = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 1.0;
      positions.current[i * 3] = Math.cos(a) * r;
      positions.current[i * 3 + 1] = Math.random() * 1.6 - 0.4;
      positions.current[i * 3 + 2] = Math.sin(a) * r;
    }
  }

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.opacity = opacity * (0.7 + 0.3 * Math.sin(clock.elapsedTime * 1.7));
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} color="#8a97a0" size={0.05} transparent opacity={opacity} depthWrite={false} sizeAttenuation />
    </points>
  );
}
