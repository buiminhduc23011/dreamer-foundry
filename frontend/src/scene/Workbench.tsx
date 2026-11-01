import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { MdOutlineCloud } from 'react-icons/md';
import type { DustyProject } from '../types';
import { useLabStore } from '../store/labStore';
import { BurstEmitter, Cobweb, RisingEmitter } from './particles';
import { LabWorkbench, VehicleBay } from './LabFurniture';

interface WorkbenchProps {
  project: DustyProject;
  sagging: boolean;
  children: ReactNode;
}

const dustColor = (d: number) => (d > 80 ? '#ff4d5e' : d > 55 ? '#ffb02e' : '#3dffa0');

/**
 * Technical workstation for hardware lab R&D:
 * - Floor vehicles (Forklift, AGV) have marked vehicle maintenance bays with diagnostics laptop & tool carts.
 * - Benchtop rigs (Smoke-Trap, Drone, Biped) have heavy-duty industrial ESD workbenches with
 *   power supplies, oscilloscopes, soldering stations, task lamps, and ergonomic rolling lab chairs.
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

  // Phân biệt xe sàn khoang bảo dưỡng vs thiết bị đặt trên bàn thao tác
  const isVehicle = project.id === 'fork-eye' || project.id === 'ghost-agv';
  const baseY = isVehicle ? 0.035 : 0.75;

  // phase lệch nhau cho từng workstation để hover không đồng bộ máy móc
  const hoverPhase = useMemo(
    () => project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 6.28,
    [project.id]
  );

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
    // incense makes the status ring burn brighter
    const boost = incenseActive ? 1.8 : 1;
    const flicker = sagging ? 0.55 + 0.25 * Math.sin(t * 16.3) * Math.sin(t * 5.1) : 1;
    if (ringMat.current) ringMat.current.opacity = Math.min(1, 0.45 * boost * flicker);
    if (glowLight.current) glowLight.current.intensity = 2.2 * boost * flicker + boomFlash.current * 30;
    boomFlash.current *= 0.85;

    // bonk jolts the model trên mặt bàn hoặc sàn khoang
    if (modelGroup.current) {
      const dt = t - bonkT.current;
      if (dt >= 0 && dt < 0.5) {
        const k = (1 - dt / 0.5) * 0.06;
        modelGroup.current.position.x = Math.sin(t * 90) * k;
        modelGroup.current.position.y = baseY + Math.abs(Math.sin(t * 65)) * k * 0.45;
        modelGroup.current.rotation.z = Math.sin(t * 70) * k * 0.5;
      } else {
        modelGroup.current.position.x = 0;
        modelGroup.current.position.y = baseY + Math.sin(t * 0.85 + hoverPhase) * 0.005;
        modelGroup.current.rotation.z = 0;
      }
    }
    if (dustSparkle.current) dustSparkle.current.rotation.y = t * 0.05;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(project.id);
  };

  const esdColor = project.id === 'iron-biped' ? '#1d4a36' : project.id === 'sky-ghost' ? '#1e293b' : '#1b455b';

  return (
    <group position={project.position as [number, number, number]}>
      {/* 1. Phần bàn ghế kỹ thuật / khoang bảo dưỡng vật lý */}
      {isVehicle ? (
        <VehicleBay
          size={project.id === 'fork-eye' ? [2.6, 2.8] : [2.4, 2.4]}
          rotation={[0, project.id === 'fork-eye' ? 0.15 : -0.2, 0]}
        />
      ) : (
        <LabWorkbench
          esdColor={esdColor}
          hasChair={true}
          chairOffset={[0.3, 0, 0.95]}
          chairRotation={[0, -0.25, 0]}
        />
      )}

      {/* Vòng định vị laser trạng thái chìm vào mặt sàn/bàn */}
      <mesh position={[0, isVehicle ? 0.038 : baseY + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[isVehicle ? 1.15 : 0.9, isVehicle ? 1.25 : 0.98, 36]} />
        <meshBasicMaterial ref={ringMat} color="#2ee6ff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Cảnh báo đỏ dưới dự án sắp đắp chiếu hoàn toàn */}
      {project.dustLevel > 80 && (
        <mesh position={[0, isVehicle ? 0.04 : baseY + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[isVehicle ? 0.95 : 0.75, isVehicle ? 1.02 : 0.82, 36]} />
          <meshBasicMaterial color="#ff4d5e" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Mô hình dự án R&D được đặt chính xác trên bàn / trong khoang */}
      <group ref={modelGroup} position={[0, baseY, 0]} onClick={onClick}>
        {children}
      </group>

      {/* Lớp bụi vi hạt bám trên mô hình */}
      <group ref={dustSparkle} position={[0, baseY + 0.6, 0]}>
        <DustCoat opacity={dustOpacity} />
      </group>

      {/* Mạng nhện giăng cho dự án bị bỏ rơi quá lâu */}
      {project.dustLevel > 85 && (
        <>
          <Cobweb position={[0.7, baseY + 0.9, 0.5]} rotation={[0, -Math.PI / 4, 0.3]} radius={0.55} />
          <Cobweb position={[-0.7, baseY + 0.7, -0.4]} rotation={[0, Math.PI / 3, -0.2]} radius={0.48} />
        </>
      )}

      {/* Cột khói bốc lên khi quá nhiệt/chập cháy */}
      <group position={[0, baseY + 0.8, 0]}>
        <RisingEmitter active={project.smoking} color="#6b5a8a" count={60} height={2.0} radius={0.28} speed={0.5} size={0.09} opacity={0.35} />
        <RisingEmitter active={project.smoking} color="#8a7a9a" count={40} height={2.5} radius={0.4} speed={0.3} size={0.13} opacity={0.2} />
      </group>

      {/* Cột khói nhang cúng bái tâm linh */}
      <group position={[0, baseY + 0.05, 0]}>
        <RisingEmitter active={incenseActive} color="#ffcf6b" count={140} height={2.4} radius={0.5} speed={0.7} size={0.055} opacity={0.85} wobble={0.8} />
        <RisingEmitter active={incenseActive} color="#ffb02e" count={60} height={2.0} radius={0.25} speed={0.9} size={0.08} opacity={0.6} />
      </group>

      {/* Vụ nổ xịt bụi khí nén khi bấm xịt bụi */}
      <group position={[0, baseY + 0.6, 0]}>
        <BurstEmitter nonce={fx.dust} count={260} speed={3.2} color="#9fc4d4" />
      </group>

      <pointLight ref={glowLight} position={[0, baseY + 0.9, 0]} color="#2ee6ff" intensity={2.2} distance={4.5} decay={2} />

      {/* Thẻ Holographic thông số HUD lơ lửng phía trên bàn */}
      {!selected && (
        <Html position={[0, baseY + (isVehicle ? 2.25 : 1.95), 0]} center distanceFactor={8} className="holo-tag">
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
              {project.smoking && <span className="text-danger animate-pulse"><MdOutlineCloud className="inline-block align-[-2px]" /> KHÓI</span>}
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
      const r = 0.3 + Math.random() * 0.9;
      positions.current[i * 3] = Math.cos(a) * r;
      positions.current[i * 3 + 1] = Math.random() * 1.4 - 0.3;
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
