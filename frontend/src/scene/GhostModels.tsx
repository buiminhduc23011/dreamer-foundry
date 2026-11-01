import { useMemo, useRef, useState } from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { DustyProject } from '../types';
import { useLabStore } from '../store/labStore';
import { BurstEmitter, RisingEmitter } from './particles';

export interface GhostModelProps {
  sagging: boolean;
}

/** Per-frame hologram flicker helper — returns opacity multiplier */
function useFlickerOpacity(sagging: boolean, base: number) {
  const ref = useRef(base);
  const phase = useMemo(() => Math.random() * 40, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const idle = base * (0.9 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
    ref.current = sagging ? base * (0.55 + 0.25 * Math.sin(t * 15.7) * Math.sin(t * 4.3)) : idle;
  });
  return ref;
}

const HOLO = '#2ee6ff';
const HOLO_DIM = '#1899b3';
const AMBER = '#ffb02e';
const STEEL = '#3a4a55';

/* ================================================================== */
/* STARK-FORK-EYE — wireframe forklift + scanning AI camera cone        */
/* ================================================================== */

export function ForkliftModel({ sagging }: GhostModelProps) {
  const coneRef = useRef<THREE.Mesh>(null);
  const holoOp = useFlickerOpacity(sagging, 0.55);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (coneRef.current) {
      coneRef.current.rotation.y = Math.sin(t * 0.6) * 0.9;
      (coneRef.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.35;
    }
  });

  return (
    <group>
      {/* forklift body — dusty solid-ish wireframe hybrid */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.5, 0.7, 0.9]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.52, 0.72, 0.92]} />
        <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.25} />
      </mesh>
      {/* overhead guard cage */}
      {[-0.5, 0.5].map((x) =>
        [-0.35, 0.35].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 1.25, z]}>
            <boxGeometry args={[0.05, 0.8, 0.05]} />
            <meshBasicMaterial color={HOLO} wireframe transparent opacity={0.5} />
          </mesh>
        ))
      )}
      <mesh position={[0, 1.68, 0]}>
        <boxGeometry args={[1.15, 0.05, 0.85]} />
        <meshBasicMaterial color={HOLO} wireframe transparent opacity={0.5} />
      </mesh>
      {/* mast + forks */}
      {[0.85, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]}>
          <boxGeometry args={[0.08, 1.6, 0.5]} />
          <meshBasicMaterial color={HOLO} wireframe transparent opacity={0.45} />
        </mesh>
      ))}
      {[-0.18, 0.18].map((z) => (
        <mesh key={z} position={[1.35, 0.28, z]}>
          <boxGeometry args={[0.9, 0.05, 0.12]} />
          <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.6} />
        </mesh>
      ))}
      {/* OAK-1 AI camera bolted to the cage */}
      <mesh position={[0.55, 1.45, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.16, 0.1, 0.22]} />
        <meshStandardMaterial color="#101820" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.62, 1.41, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.035, 0.035, 0.06, 12]} />
        <meshBasicMaterial color={AMBER} />
      </mesh>
      {/* AI vision cone sweeping the floor */}
      <mesh ref={coneRef} position={[1.9, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.1, 0.02, 24, 1, true]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* wheels */}
      {[[-0.55, -0.42], [-0.55, 0.42], [0.55, -0.42], [0.55, 0.42]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.16, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.1, 16]} />
          <meshStandardMaterial color="#141a20" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================== */
/* STARK-SKY-GHOST — quadcopter on cables, 3 spinning + 1 dead prop     */
/* ================================================================== */

function Propeller({ position, spinning, broken }: { position: [number, number, number]; spinning: boolean; broken?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && spinning) ref.current.rotation.y += dt * 18;
  });
  return (
    <group position={position} rotation={broken ? [0.6, 0, 0.35] : [0, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, 0.09, 10]} />
        <meshStandardMaterial color={STEEL} metalness={0.7} roughness={0.4} />
      </mesh>
      <group ref={ref} position={[0, 0.07, 0]}>
        <mesh>
          <boxGeometry args={[0.5, 0.012, 0.045]} />
          <meshBasicMaterial color={broken ? '#5a4a3a' : HOLO} transparent opacity={broken ? 0.8 : 0.6} wireframe={!broken} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.5, 0.012, 0.045]} />
          <meshBasicMaterial color={broken ? '#5a4a3a' : HOLO} transparent opacity={broken ? 0.8 : 0.6} wireframe={!broken} />
        </mesh>
      </group>
    </group>
  );
}

export function DroneModel({ sagging }: GhostModelProps) {
  const sparkRef = useRef<THREE.Mesh>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const nextSpark = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    // occasional electric spark from the dead motor
    if (t > nextSpark.current) {
      nextSpark.current = t + 0.8 + Math.random() * 3.5;
      if (sparkRef.current) sparkRef.current.visible = true;
      if (sparkLight.current) sparkLight.current.intensity = 3;
    }
    if (sparkRef.current?.visible && Math.random() < 0.3) sparkRef.current.visible = false;
    if (sparkLight.current) sparkLight.current.intensity *= 0.8;
    // drone sways on its cables, forever mid-crash
    const sway = Math.sin(t * 0.7) * 0.03;
    if (group.current) {
      group.current.rotation.z = sway;
      group.current.rotation.x = Math.cos(t * 0.5) * 0.02;
    }
  });

  const group = useRef<THREE.Group>(null);
  const arms: [number, number][] = [
    [0.55, 0.55],
    [-0.55, 0.55],
    [-0.55, -0.55],
    [0.55, -0.55],
  ];

  return (
    <group ref={group}>
      {/* suspension cables to the ceiling */}
      {arms.map(([x, z], i) => (
        <mesh key={`c${i}`} position={[x * 0.7, 1.4, z * 0.7]}>
          <cylinderGeometry args={[0.008, 0.008, 2.4, 4]} />
          <meshBasicMaterial color="#4a5560" />
        </mesh>
      ))}
      {/* central body */}
      <mesh>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshStandardMaterial color="#1a242e" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.52, 0.16, 0.52]} />
        <meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current * 0.5} />
      </mesh>
      {/* swollen LiPo pack */}
      <mesh position={[0, -0.11, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.22]} />
        <meshStandardMaterial color="#6b2e2e" emissive="#300" />
      </mesh>
      {/* arms */}
      {arms.map(([x, z], i) => (
        <mesh key={`a${i}`} position={[x / 2, 0, z / 2]} rotation={[0, Math.atan2(z, x), 0]}>
          <boxGeometry args={[0.75, 0.04, 0.07]} />
          <meshStandardMaterial color="#141b22" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* props — front-right is the casualty */}
      <Propeller position={[arms[0][0], 0.1, arms[0][1]]} spinning broken />
      <Propeller position={[arms[1][0], 0.1, arms[1][1]]} spinning />
      <Propeller position={[arms[2][0], 0.1, arms[2][1]]} spinning />
      <Propeller position={[arms[3][0], 0.1, arms[3][1]]} spinning />
      {/* spark at the dead motor */}
      <mesh ref={sparkRef} position={[arms[0][0], 0.12, arms[0][1]]} visible={false}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial color="#fff7ae" />
      </mesh>
      <pointLight ref={sparkLight} position={[arms[0][0], 0.15, arms[0][1]]} color="#ffd76b" intensity={0} distance={3} />
    </group>
  );
}

/* ================================================================== */
/* STARK-MARK-0.1-BIPED — one real leg, one wireframe dream leg         */
/* ================================================================== */

export function BipedModel({ sagging }: GhostModelProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const blueprints = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.6;
    }
    if (blueprints.current) blueprints.current.rotation.y = t * 0.15;
  });

  const legX = 0.22;

  return (
    <group>
      {/* calibration ring */}
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.015, 8, 64]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.4} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.008, 8, 64]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.35} />
      </mesh>

      {/* pelvis — the expensive paperweight */}
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.75, 0.35, 0.42]} />
        <meshStandardMaterial color="#2a3540" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[0.77, 0.37, 0.44]} />
        <meshBasicMaterial color={HOLO} wireframe transparent opacity={0.3} />
      </mesh>
      {/* arc-reactor hip joint */}
      <mesh position={[0, 1.72, 0.22]}>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
        <meshBasicMaterial color={HOLO} />
      </mesh>

      {/* LEFT leg — actually machined, bolted, real */}
      <group position={[-legX, 0, 0]}>
        <mesh position={[0, 1.32, 0]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#3a4a55" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position={[0, 0.95, 0]}><boxGeometry args={[0.22, 0.65, 0.3]} /><meshStandardMaterial color="#2a3540" metalness={0.85} roughness={0.35} /></mesh>
        <mesh position={[0, 0.58, 0]}><sphereGeometry args={[0.11, 16, 16]} /><meshStandardMaterial color="#3a4a55" metalness={0.9} roughness={0.3} /></mesh>
        <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.16, 0.55, 0.22]} /><meshStandardMaterial color="#2a3540" metalness={0.85} roughness={0.35} /></mesh>
        <mesh position={[0, 0.05, 0.08]}><boxGeometry args={[0.22, 0.1, 0.42]} /><meshStandardMaterial color="#1c252e" metalness={0.8} roughness={0.5} /></mesh>
      </group>

      {/* RIGHT leg — pure hologram blueprint, drifting in and out of spec */}
      <group position={[legX, 0, 0]}>
        <mesh position={[0, 1.32, 0]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current} /></mesh>
        <mesh position={[0, 0.95, 0]}><boxGeometry args={[0.22, 0.65, 0.3]} /><meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current} /></mesh>
        <mesh position={[0, 0.58, 0]}><sphereGeometry args={[0.11, 10, 10]} /><meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current} /></mesh>
        <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.16, 0.55, 0.22]} /><meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current} /></mesh>
        <mesh position={[0, 0.05, 0.08]}><boxGeometry args={[0.22, 0.1, 0.42]} /><meshBasicMaterial color={HOLO} wireframe transparent opacity={holoOp.current} /></mesh>
      </group>

      {/* orbiting CAD revision fragments — v19_final_FINAL2.step */}
      <group ref={blueprints}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.5, 1.4 + Math.sin(i * 2.3) * 0.4, Math.sin(a) * 1.5]} rotation={[i, i * 0.7, 0]}>
              <boxGeometry args={[0.14, 0.18, 0.01]} />
              <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.35} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ================================================================== */
/* PRJ-SMOKE-TRAP — blower box + articulated duct + warped PLA funnel   */
/* ================================================================== */

export function FumeExtractorModel({ sagging }: GhostModelProps) {
  const fanRef = useRef<THREE.Group>(null);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const funnel = useRef<THREE.Group>(null);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    // quạt lồng sóc quay vù vù — ồn như phản lực cất cánh
    if (fanRef.current) fanRef.current.rotation.z += dt * 22;
    // phễu hút lắc nhẹ theo cơn gió chính nó tạo ra
    if (funnel.current) {
      funnel.current.rotation.z = Math.sin(t * 2.1) * 0.05;
      funnel.current.rotation.x = Math.cos(t * 1.7) * 0.04;
    }
  });

  return (
    <group>
      {/* thân máy — hộp tôn sơn tĩnh điện xỉn màu */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.0, 1.0, 0.8]} />
        <meshStandardMaterial color="#2a3138" metalness={0.75} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.02, 1.02, 0.82]} />
        <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.2} />
      </mesh>

      {/* mặt quạt lồng sóc phía trước */}
      <mesh position={[0, 0.62, 0.41]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 24]} />
        <meshStandardMaterial color="#151b21" metalness={0.8} roughness={0.4} />
      </mesh>
      <group ref={fanRef} position={[0, 0.62, 0.44]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0]}>
            <boxGeometry args={[0.06, 0.26, 0.015]} />
            <meshBasicMaterial color={HOLO} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
      {/* lưới bảo vệ quạt */}
      <mesh position={[0, 0.62, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.012, 8, 32]} />
        <meshBasicMaterial color={HOLO_DIM} transparent opacity={0.5} />
      </mesh>

      {/* cánh tay ống hút gấp khúc lên khỏi thân máy */}
      <mesh position={[-0.3, 1.15, -0.1]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.09, 0.09, 0.7, 12]} />
        <meshStandardMaterial color="#3a4a55" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[-0.62, 1.42, -0.1]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color="#1c252e" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[-0.78, 1.5, -0.05]} rotation={[0, 0, 1.9]}>
        <cylinderGeometry args={[0.08, 0.08, 0.55, 12]} />
        <meshStandardMaterial color="#3a4a55" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* phễu hút PLA in 3D — cong vênh vì nắng, đang ngửa ra hút khói */}
      <group ref={funnel} position={[-0.95, 1.35, 0.15]} rotation={[0.9, 0.2, 0.9]}>
        <mesh>
          <coneGeometry args={[0.3, 0.35, 12, 1, true]} />
          <meshStandardMaterial color={AMBER} metalness={0.1} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <coneGeometry args={[0.31, 0.36, 12, 1, true]} />
          <meshBasicMaterial color={AMBER} wireframe transparent opacity={0.2} />
        </mesh>
      </group>

      {/* cảm biến DS18B20 lòi dây + mỏ hàn đang cắm */}
      <mesh position={[0.35, 1.0, 0.3]} rotation={[0.5, 0, -0.4]}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 8]} />
        <meshStandardMaterial color="#8a4a2e" roughness={0.7} />
      </mesh>
      <mesh position={[0.48, 0.85, 0.42]} rotation={[0.5, 0, -0.4]}>
        <cylinderGeometry args={[0.008, 0.012, 0.3, 8]} />
        <meshStandardMaterial color="#c8d4dc" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* LED báo nhiệt — chớp amber khi quạt 'chuẩn bị bốc mùi khét' */}
      <mesh position={[0.4, 0.92, 0.41]}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
        <meshBasicMaterial color={AMBER} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* PRJ-GHOST-AGV — gầm thấp laser-cut, LiDAR quay, thanh dò line mù sáng */
/* ================================================================== */

export function AgvModel({ sagging }: GhostModelProps) {
  const lidar = useRef<THREE.Group>(null);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const beacon = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (lidar.current) lidar.current.rotation.y += dt * 6;
    // đèn beacon chớp kiểu 'tôi đang lạc, đừng hỏi'
    if (beacon.current) (beacon.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.6 * (Math.sin(t * 6) > 0.4 ? 1 : 0.12);
    // vệt quét LiDAR xoay quanh sàn — đang tìm chân bàn để đâm
    if (scanRef.current) {
      scanRef.current.rotation.y = -t * 6;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.5;
    }
  });

  const wheelXs: [number, number][] = [
    [-0.52, -0.62],
    [-0.52, 0.62],
    [0.52, -0.62],
    [0.52, 0.62],
  ];

  return (
    <group>
      {/* chassis thép laser cut gầm thấp — mặt trên phẳng để chở hàng */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[1.5, 0.28, 1.0]} />
        <meshStandardMaterial color="#232d36" metalness={0.8} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[1.52, 0.3, 1.02]} />
        <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.2} />
      </mesh>
      {/* tấm sàn chở hàng */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.4, 0.04, 0.9]} />
        <meshStandardMaterial color="#141a21" metalness={0.6} roughness={0.7} />
      </mesh>

      {/* cản va trước — mẻ một góc vì hôm nọ va vào tủ sắt */}
      <mesh position={[0, 0.3, 0.55]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[1.44, 0.14, 0.08]} />
        <meshStandardMaterial color="#6b4a2e" metalness={0.4} roughness={0.8} />
      </mesh>
      {/* dải LED vành trước */}
      <mesh position={[0, 0.42, 0.51]}>
        <boxGeometry args={[1.2, 0.03, 0.02]} />
        <meshBasicMaterial color={HOLO} transparent opacity={holoOp.current * 1.4} />
      </mesh>

      {/* 4 bánh + 2 động cơ giảm tốc kèm encoder */}
      {wheelXs.map(([x, z], i) => (
        <group key={i} position={[x, 0.18, z]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
            <meshStandardMaterial color="#10161c" roughness={0.9} />
          </mesh>
          {i < 2 && (
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.2, 0.18, 0.24]} />
              <meshStandardMaterial color="#2a3540" metalness={0.7} roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}

      {/* thanh cảm biến dò line hồng ngoại gắn trước gầm */}
      <mesh position={[0, 0.1, 0.62]}>
        <boxGeometry args={[0.9, 0.05, 0.06]} />
        <meshStandardMaterial color="#1c252e" metalness={0.7} roughness={0.5} />
      </mesh>
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.07, 0.62]}>
          <boxGeometry args={[0.04, 0.03, 0.03]} />
          <meshBasicMaterial color="#ff4d5e" transparent opacity={0.7} />
        </mesh>
      ))}

      {/* cột + đầu LiDAR mini quay không ngừng */}
      <mesh position={[0, 0.62, -0.15]}>
        <cylinderGeometry args={[0.06, 0.08, 0.26, 12]} />
        <meshStandardMaterial color="#1c252e" metalness={0.8} roughness={0.4} />
      </mesh>
      <group ref={lidar} position={[0, 0.78, -0.15]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.14, 0.09, 16]} />
          <meshStandardMaterial color="#10161c" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.12, 0, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.03]} />
          <meshBasicMaterial color={HOLO} />
        </mesh>
      </group>
      {/* vệt quét laser quanh sàn */}
      <mesh ref={scanRef} position={[0, 0.06, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.16, 48, 1, 0, 0.5]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.25} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* đèn beacon 'tôi đang lạc' */}
      <mesh ref={beacon} position={[0.55, 0.6, 0.3]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* PRJ-AMR-SLAM — swerve-drive AMR chạy loanh quanh, lâu lâu mất định vị */
/* ================================================================== */

/** Vị trí thế giới live của AMR — CameraRig bám theo để quay tracking shot. */
export const amrWorldPos = new THREE.Vector3(0, 0, 3.0);

const PATROL_RX = 5.6;    // bán kính X vòng tuần tra quanh lõi
const PATROL_RZ = 3.3;    // bán kính Z — vừa khít né dãy workbench phía sau
const PATROL_CZ = -0.9;   // tâm Z của vòng patrol
const PATROL_SPEED = 0.24; // rad/s
const CRASH_DUR = 2.6;    // giây mất định vị mỗi lần đâm lẻng xẻng

const AMR_CRASH_MSGS = [
  'AMR_SLAM: Mất định vị — xoay vòng trầm cảm lần thứ 8 trong giờ',
  'AMR_SLAM: Occupancy grid lệch 40cm, lao lẻng xẻng vào hư không',
  'AMR_SLAM: LiDAR trả về 3 bản đồ khác nhau, đang bỏ phiếu tin bản nào',
  'AMR_SLAM: micro-ROS mất gói UART — bản đồ hóa nghệ thuật trừu tượng',
  'AMR_SLAM: Kidnapped robot — tự tái định vị thẳng vào chân tủ sắt',
];

const AMR_EMPTY_FX = { incense: 0, dust: 0, bonk: 0, boom: 0 } as const;
const amrDustColor = (d: number) => (d > 80 ? '#ff4d5e' : d > 55 ? '#ffb02e' : '#3dffa0');

/**
 * AMR không ngồi trên pedestal — nó chạy vòng ellipse tuần tra sàn xưởng,
 * thỉnh thoảng 'mất định vị' giật loạn xoay vòng rồi lại chạy tiếp như không có gì.
 */
export function AmrRover({ project, sagging }: { project: DustyProject; sagging: boolean }) {
  const select = useLabStore((s) => s.select);
  const selected = useLabStore((s) => s.selectedId === project.id);
  const fx = useLabStore((s) => s.fx[project.id]) ?? AMR_EMPTY_FX;

  const body = useRef<THREE.Group>(null);
  const lidar = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const spark = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const pods = useRef<(THREE.Group | null)[]>([]);
  const wheels = useRef<(THREE.Mesh | null)[]>([]);

  const pathAngle = useRef(0.9);
  const heading = useRef(0);
  const wheelSpin = useRef(0);
  const crashStart = useRef(-1);
  const nextCrash = useRef(5 + Math.random() * 7);
  const [crashing, setCrashing] = useState(false);
  const [crashNonce, setCrashNonce] = useState(0);
  const [tagTooClose, setTagTooClose] = useState(false);

  const lastIncense = useRef(0);
  const incenseUntil = useRef(0);
  const [incenseActive, setIncenseActive] = useState(false);
  const lastBonk = useRef(0);
  const bonkT = useRef(-1);
  const lastBoom = useRef(0);
  const boomFlash = useRef(0);
  const holoOp = useFlickerOpacity(sagging, 0.5);

  const dustOpacity = Math.min(0.55, (project.dustLevel / 100) * 0.7);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const b = body.current;
    if (!b) return;

    // ---- fx nonces giống pedestal: hương / gõ / nổ / xịt bụi ----
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

    const inCrash = crashStart.current >= 0;

    if (inCrash) {
      if (t - crashStart.current >= CRASH_DUR) {
        // hết cơn: quay đầu về heading cũ rồi chạy tiếp như không có gì
        crashStart.current = -1;
        setCrashing(false);
        nextCrash.current = t + 9 + Math.random() * 13;
        b.rotation.y = heading.current;
        if (spark.current) spark.current.visible = false;
      } else {
        // đâm lẻng xẻng: giật loạn + xoay vòng trầm cảm, 4 pod lái mỗi đứa một hướng
        b.position.x += (Math.random() - 0.5) * 0.03;
        b.position.z += (Math.random() - 0.5) * 0.03;
        b.rotation.y += dt * 8.5;
        wheelSpin.current += dt * 26;
        pods.current.forEach((p, i) => {
          if (p) p.rotation.y = Math.sin(t * 11 + i * 2.4) * 2.6;
        });
        if (spark.current) spark.current.visible = Math.random() > 0.4;
      }
    } else {
      if (t > nextCrash.current) {
        crashStart.current = t;
        setCrashing(true);
        setCrashNonce((n) => n + 1);
        useLabStore.getState().pushFeed('amr-crash', project.id, AMR_CRASH_MSGS[Math.floor(Math.random() * AMR_CRASH_MSGS.length)]);
      }
      const a = (pathAngle.current += dt * PATROL_SPEED);
      b.position.set(Math.cos(a) * PATROL_RX, b.position.y, Math.sin(a) * PATROL_RZ + PATROL_CZ);
      heading.current = Math.atan2(-Math.sin(a) * PATROL_RX, Math.cos(a) * PATROL_RZ);
      b.rotation.y = heading.current + Math.sin(t * 2.2) * 0.05; // PID chưa tune nên hơi lắc
      wheelSpin.current += dt * 11;
      // 4 pod swerve lái đồng bộ + lệch nhẹ từng module cho sống động
      pods.current.forEach((p, i) => {
        if (p) p.rotation.y = Math.sin(t * 1.4 + i * 1.1) * 0.14;
      });
    }

    wheels.current.forEach((w) => {
      if (w) w.rotation.x = wheelSpin.current;
    });
    if (lidar.current) lidar.current.rotation.y += dt * (inCrash ? 16 : 7);
    if (scan.current) {
      scan.current.rotation.y = -t * 7;
      (scan.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * (inCrash ? 0.9 : 0.45);
    }
    if (beacon.current) {
      const m = beacon.current.material as THREE.MeshBasicMaterial;
      if (inCrash) {
        m.color.set('#ff4d5e');
        m.opacity = Math.sin(t * 18) > 0 ? 1 : 0.15;
      } else {
        m.color.set(AMBER);
        m.opacity = Math.sin(t * 6) > 0.4 ? 0.9 : 0.25;
      }
    }

    // bonk → nhảy dựng + hover nhẹ cho giống anh em trên pedestal
    const bt = t - bonkT.current;
    const jolt = bt >= 0 && bt < 0.5 ? (1 - bt / 0.5) * 0.08 : 0;
    b.position.y = 0.02 + Math.sin(t * 1.1) * 0.015 + Math.abs(Math.sin(t * 90)) * jolt;
    if (lamp.current) lamp.current.intensity = 1.2 + boomFlash.current * 25;
    boomFlash.current *= 0.85;

    // báo vị trí sống cho CameraRig bám theo
    amrWorldPos.copy(b.position);

    // camera áp sát thì giấu tag — khỏi bị một con robot lạc che kín màn hình
    const camDist = state.camera.position.distanceTo(b.position);
    if (camDist < 2.8 !== tagTooClose) setTagTooClose(camDist < 2.8);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(project.id);
  };

  return (
    <group>
      {/* dock sạc tại vị trí 'trạm' — xe thì đang đi lạc đâu đó trong xưởng */}
      <group position={project.position as [number, number, number]}>
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[1.1, 0.05, 1.1]} />
          <meshStandardMaterial color="#131c26" metalness={0.7} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.48, 24]} />
          <meshBasicMaterial color={HOLO} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.09, -0.3]}>
            <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
            <meshStandardMaterial color={AMBER} metalness={0.8} roughness={0.3} emissive={AMBER} emissiveIntensity={0.4} />
          </mesh>
        ))}
        <Html position={[0, 0.55, 0]} center distanceFactor={10}>
          <div className="select-none whitespace-nowrap border border-holo/25 bg-void/60 px-2 py-0.5 font-mono text-[8px] text-holo/60">
            DOCK-01 · TRẠM SẠC
          </div>
        </Html>
      </group>

      {/* con AMR đang lang thang */}
      <group ref={body} onClick={onClick}>
        {/* chassis vuông thấp gáy swerve — SBC + board driver lộ thiên */}
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[1.15, 0.22, 0.95]} />
          <meshStandardMaterial color="#24313c" metalness={0.8} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[1.17, 0.24, 0.97]} />
          <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.2} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[0.95, 0.06, 0.75]} />
          <meshStandardMaterial color="#141a21" metalness={0.6} roughness={0.7} />
        </mesh>
        <mesh position={[-0.2, 0.53, -0.1]}>
          <boxGeometry args={[0.3, 0.04, 0.24]} />
          <meshStandardMaterial color="#123524" metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 0.53, 0.12]}>
          <boxGeometry args={[0.22, 0.035, 0.18]} />
          <meshStandardMaterial color="#0f2a18" metalness={0.3} roughness={0.7} />
        </mesh>
        {/* dây UART lủng lẳng — thủ phạm mất gói tin */}
        <mesh position={[0.02, 0.56, 0]} rotation={[0, 0, 1.2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.34, 6]} />
          <meshBasicMaterial color={AMBER} />
        </mesh>

        {/* 4 module swerve: cụm lái quay quanh trục đứng + bánh trên trục ngang */}
        {([[-0.48, -0.4], [-0.48, 0.4], [0.48, -0.4], [0.48, 0.4]] as [number, number][]).map(([x, z], i) => (
          <group key={i} position={[x, 0.14, z]} ref={(g) => { pods.current[i] = g; }}>
            <mesh position={[0, 0.16, 0]}>
              <boxGeometry args={[0.15, 0.18, 0.15]} />
              <meshStandardMaterial color="#2a3540" metalness={0.75} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.02, 0.07]} ref={(m) => { wheels.current[i] = m; }} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 14]} />
              <meshStandardMaterial color="#10161c" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* cột LiDAR 2D — con dự phòng vì con kia đã vỡ */}
        <mesh position={[0, 0.62, -0.28]}>
          <cylinderGeometry args={[0.05, 0.07, 0.3, 10]} />
          <meshStandardMaterial color="#1c252e" metalness={0.8} roughness={0.4} />
        </mesh>
        <group ref={lidar} position={[0, 0.8, -0.28]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.09, 16]} />
            <meshStandardMaterial color="#10161c" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0.1, 0, 0]}>
            <boxGeometry args={[0.05, 0.035, 0.025]} />
            <meshBasicMaterial color={HOLO} />
          </mesh>
        </group>
        {/* vệt quét occupancy grid trên sàn — sáng rực khi mất định vị */}
        <mesh ref={scan} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.2, 48, 1, 0, 0.7]} />
          <meshBasicMaterial color={HOLO} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* beacon amber → đỏ chớp tắt khi 'không nhận ra bản đồ' */}
        <mesh ref={beacon} position={[0.42, 0.56, -0.3]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0.8} />
        </mesh>
        <mesh ref={spark} position={[0, 0.34, 0.52]} visible={false}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color="#fff7ae" />
        </mesh>
        <pointLight ref={lamp} position={[0, 0.8, 0]} color={HOLO} intensity={1.2} distance={4} decay={2} />

        {/* bụi bám thân xe + cột hương/vụ bụi chạy theo xe */}
        <Sparkles count={90} scale={[1.5, 0.9, 1.3]} position={[0, 0.55, 0]} size={1.8} speed={0.1} opacity={dustOpacity} color="#8a97a0" noise={2} />
        <RisingEmitter active={incenseActive} color="#ffcf6b" count={100} height={1.8} radius={0.5} speed={0.7} size={0.05} opacity={0.8} wobble={0.6} />
        <BurstEmitter nonce={fx.dust + crashNonce} count={220} speed={3} color="#9fc4d4" />
        <BurstEmitter nonce={fx.boom} count={120} speed={2.4} color={AMBER} />

        {/* tag bám theo xe — đổi trạng thái khi đang đâm lẻng xẻng, ẩn khi camera quá gần */}
        {!selected && !tagTooClose && (
          <Html position={[0, 1.3, 0]} center distanceFactor={8} className="holo-tag">
            <div
              onClick={() => select(project.id)}
              className="cursor-pointer select-none border border-holo/40 bg-void/70 px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm transition-all hover:border-holo"
            >
              <div className="font-display text-[11px] font-bold tracking-widest text-holo">{project.codeName}</div>
              <div className="mt-0.5 flex gap-3 text-[9px]">
                <span className="text-holo/70">▓ {project.completionPercent}% XONG</span>
                {crashing ? (
                  <span className="animate-pulse font-bold text-danger"><AiOutlineWarning className="inline-block align-[-2px]" /> MẤT ĐỊNH VỊ</span>
                ) : (
                  <span style={{ color: amrDustColor(project.dustLevel) }}>ĐỘ PHỦ BỤI: {Math.round(project.dustLevel)}%</span>
                )}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
