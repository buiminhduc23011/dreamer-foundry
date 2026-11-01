import { useRef, useState, type ReactNode } from 'react';
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

const EMPTY_FX = { incense: 0, dust: 0, bonk: 0, boom: 0 } as const;

/**
 * Trạm R&D vật lý cho từng dự án trong hầm lab:
 * - `fork-eye`: Khoang bảo dưỡng xe sàn công nghiệp (`VehicleBay`, mặt sàn y = 0.035).
 * - `jarvis-core`: Bàn kính cảm ứng tròn Stark Holo-Table tích hợp lõi Arc Reactor đặt cố định giữa sàn (y = 0).
 * - `remote-io`, `sky-ghost`, `iron-biped`: Bàn thao tác kỹ thuật ESD hạng nặng (`LabWorkbench`, mặt thảm y = 0.75)
 *   có chân bàn chạm sàn y = 0, bảng treo dụng cụ, máy hiện sóng, nguồn DC, trạm hàn & ghế xoay kỹ sư.
 */
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

  const isVehicle = project.id === 'fork-eye';
  const isHoloCore = project.id === 'jarvis-core';
  const baseY = isHoloCore ? 0.0 : isVehicle ? 0.035 : 0.75;

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

    const boost = incenseActive ? 1.8 : 1;
    const flicker = sagging ? 0.55 + 0.25 * Math.sin(t * 16.3) * Math.sin(t * 5.1) : 1;
    if (ringMat.current) ringMat.current.opacity = Math.min(1, 0.42 * boost * flicker);
    if (glowLight.current) glowLight.current.intensity = (isHoloCore ? 1.2 : 2.2) * boost * flicker + boomFlash.current * 28;
    boomFlash.current *= 0.85;

    // Khi gõ búa sửa chữa (bonk) thì cụm thiết bị rung chấn vật lý trên mặt bàn rồi đứng yên chắc chắn
    if (modelGroup.current) {
      const dt = t - bonkT.current;
      if (dt >= 0 && dt < 0.5) {
        const k = (1 - dt / 0.5) * (isHoloCore ? 0.025 : 0.055);
        modelGroup.current.position.x = Math.sin(t * 90) * k;
        modelGroup.current.position.y = baseY + Math.abs(Math.sin(t * 65)) * k * 0.4;
        modelGroup.current.rotation.z = Math.sin(t * 70) * k * 0.45;
      } else {
        modelGroup.current.position.x = 0;
        modelGroup.current.position.y = baseY;
        modelGroup.current.rotation.z = 0;
      }
    }
    if (dustSparkle.current) dustSparkle.current.rotation.y = t * 0.05;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(project.id);
  };

  const esdColor: '#164e63' | '#14532d' | '#1e293b' =
    project.id === 'iron-biped'
      ? '#14532d'
      : project.id === 'sky-ghost'
        ? '#1e293b'
        : '#164e63';

  // Xoay nhẹ bàn làm việc ở hai cánh tạo bố cục phòng lab chữ U tự nhiên hướng về trung tâm
  const benchYaw =
    project.id === 'remote-io'
      ? 0.22
      : project.id === 'sky-ghost'
        ? -0.22
        : project.id === 'iron-biped'
          ? -0.42
          : 0;

  const ringY = isHoloCore ? 0.012 : isVehicle ? 0.038 : 0.756;
  const ringInner = isHoloCore ? 1.56 : isVehicle ? 1.15 : 0.88;
  const ringOuter = isHoloCore ? 1.64 : isVehicle ? 1.24 : 0.94;
  const fxCenterY = isHoloCore ? 1.55 : baseY + 0.6;
  const tagY = isHoloCore ? 2.82 : isVehicle ? 2.28 : 2.68;

  return (
    <group position={[project.position[0], 0, project.position[2]]} rotation={[0, benchYaw, 0]}>
      {/* 1. Hạ tầng bàn ghế kỹ thuật / khoang bảo dưỡng chạm sàn y = 0 */}
      {isHoloCore ? null : isVehicle ? (
        <VehicleBay size={[2.6, 2.8]} rotation={[0, 0.18, 0]} />
      ) : (
        <LabWorkbench
          esdColor={esdColor}
          hasChair={true}
          chairOffset={[0.32, 0, 0.96]}
          chairRotation={[0, -0.28, 0]}
        />
      )}

      {/* Vòng định vị trạng thái dự án */}
      <mesh position={[0, ringY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringInner, ringOuter, 48]} />
        <meshBasicMaterial ref={ringMat} color={isHoloCore ? '#ffb02e' : '#2ee6ff'} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Cảnh báo đỏ khi dự án phủ bụi > 80% */}
      {project.dustLevel > 80 && (
        <mesh position={[0, ringY + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringInner - 0.14, ringInner - 0.08, 48]} />
          <meshBasicMaterial color="#ff4d5e" transparent opacity={0.28} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Mô hình dự án đặt chuẩn vật lý trên mặt bàn / mặt sàn */}
      <group ref={modelGroup} position={[0, baseY, 0]} onClick={onClick}>
        {children}
      </group>

      {/* Lớp hạt bụi lơ lửng bám quanh thiết bị */}
      <group ref={dustSparkle} position={[0, fxCenterY, 0]}>
        <DustCoat opacity={dustOpacity} />
      </group>

      {/* Mạng nhện giăng góc kệ cho dự án bị bỏ rơi lâu ngày */}
      {project.dustLevel > 85 && !isHoloCore && (
        <>
          <Cobweb position={[0.72, baseY + 0.85, -0.32]} rotation={[0, -Math.PI / 4, 0.3]} radius={0.48} />
          <Cobweb position={[-0.72, baseY + 0.72, -0.35]} rotation={[0, Math.PI / 3, -0.2]} radius={0.44} />
        </>
      )}

      {/* Cột khói bốc lên khi chập mạch / nổ MOSFET */}
      <group position={[0, fxCenterY + 0.2, 0]}>
        <RisingEmitter active={project.smoking} color="#6b5a8a" count={60} height={2.0} radius={0.28} speed={0.5} size={0.09} opacity={0.35} />
        <RisingEmitter active={project.smoking} color="#8a7a9a" count={40} height={2.5} radius={0.4} speed={0.3} size={0.13} opacity={0.2} />
      </group>

      {/* Khói nhang cúng debug tâm linh */}
      <group position={[0, isHoloCore ? 0.85 : baseY + 0.05, 0]}>
        <RisingEmitter active={incenseActive} color="#ffcf6b" count={140} height={2.2} radius={0.48} speed={0.7} size={0.055} opacity={0.85} wobble={0.8} />
        <RisingEmitter active={incenseActive} color="#ffb02e" count={60} height={1.9} radius={0.24} speed={0.9} size={0.08} opacity={0.6} />
      </group>

      {/* Hiệu ứng xịt bụi khí nén */}
      <group position={[0, fxCenterY, 0]}>
        <BurstEmitter nonce={fx.dust} count={260} speed={3.2} color="#9fc4d4" />
      </group>

      <pointLight ref={glowLight} position={[0, fxCenterY + 0.4, 0]} color={isHoloCore ? '#ffb02e' : '#2ee6ff'} intensity={2.0} distance={4.5} decay={2} />

      {/* Thẻ HUD Holographic lơ lửng phía trên trạm */}
      {!selected && (
        <Html position={[0, tagY, 0]} center distanceFactor={8} className="holo-tag">
          <div
            onClick={() => select(project.id)}
            className={`cursor-pointer select-none border px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm transition-all ${
              isHoloCore
                ? 'border-amber-glow/55 bg-void/80 hover:border-amber-glow'
                : 'border-holo/40 bg-void/75 hover:border-holo'
            }`}
          >
            <div
              className={`font-display text-[11px] font-bold tracking-widest ${
                isHoloCore ? 'text-amber-glow' : 'text-holo'
              }`}
            >
              {project.codeName}
            </div>
            <div className="mt-0.5 flex gap-3 text-[9px]">
              <span className="text-holo/75">▓ {project.completionPercent}% XONG</span>
              <span style={{ color: dustColor(project.dustLevel) }}>ĐỘ PHỦ BỤI: {Math.round(project.dustLevel)}%</span>
              {project.smoking && (
                <span className="animate-pulse text-danger">
                  <MdOutlineCloud className="inline-block align-[-2px]" /> KHÓI
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function DustCoat({ opacity }: { opacity: number }) {
  const matRef = useRef<THREE.PointsMaterial>(null);
  const positions = useRef<Float32Array | null>(null);

  if (!positions.current) {
    const count = 130;
    positions.current = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.random() * 0.85;
      positions.current[i * 3] = Math.cos(a) * r;
      positions.current[i * 3 + 1] = Math.random() * 1.3 - 0.25;
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
      <pointsMaterial ref={matRef} color="#8a97a0" size={0.048} transparent opacity={opacity} depthWrite={false} sizeAttenuation />
    </points>
  );
}
