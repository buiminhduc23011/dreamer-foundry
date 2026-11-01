import { useMemo, useRef, useState } from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { DustyProject } from '../types';
import { useLabStore } from '../store/labStore';
import { BurstEmitter, RisingEmitter } from './particles';
import { labAudio } from '../audio/labAudio';

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

const MODEL_URLS = {
  forklift: '/models/forklift.glb?v=3',
  fumeExtractor: '/models/fume_extractor.glb?v=3',
  drone: '/models/drone.glb?v=3',
  droneRotor: '/models/drone_rotor.glb?v=3',
  agv: '/models/agv.glb?v=3',
  biped: '/models/biped.glb?v=3',
  amr: '/models/amr.glb?v=5',
} as const;

/* ================================================================== */
/* PRJ-FORK-EYE — OpenRobotics Warehouse Forklift + OAK-1 W AI Vision  */
/* ================================================================== */

export function ForkliftModel({ sagging }: GhostModelProps) {
  const { scene } = useGLTF(MODEL_URLS.forklift);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const fanRef = useRef<THREE.Mesh>(null);
  const holoOp = useFlickerOpacity(sagging, 0.55);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (fanRef.current) {
      fanRef.current.rotation.z = Math.sin(t * 0.9) * 0.28;
      (fanRef.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.28;
    }
  });

  return (
    <group rotation={[0, 0.88, 0]}>
      <primitive object={cloned} position={[0, 0, 0]} scale={1} />

      {/* Quạt quét thị giác máy tính OAK-1 W phía trước càng nâng (+Z) */}
      <mesh ref={fanRef} position={[0, 0.02, 0.88]} rotation={[-Math.PI / 2, 0, Math.PI * 0.18]}>
        <circleGeometry args={[1.05, 28, 0, Math.PI * 0.64]} />
        <meshBasicMaterial
          color={AMBER}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Vòng an toàn kho bãi quanh xe nâng */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.12, 1.17, 40]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* PRJ-SKY-GHOST — COSTAR Shafter Quadcopter + VLP-16 + RealSense      */
/* ================================================================== */

const DRONE_MOTORS: { pos: [number, number, number]; dir: number; dead?: boolean }[] = [
  { pos: [-0.5317, 0.0336, 0.3141], dir: 1 },
  { pos: [-0.4351, 0.0336, -0.4384], dir: -1 },
  { pos: [0.4351, 0.0336, -0.4384], dir: 1 },
  { pos: [0.5317, 0.0336, 0.3141], dir: -1, dead: true },
];

export function DroneModel({ sagging }: GhostModelProps) {
  const { scene: bodyScene } = useGLTF(MODEL_URLS.drone);
  const { scene: rotorScene } = useGLTF(MODEL_URLS.droneRotor);
  const clonedBody = useMemo(() => bodyScene.clone(true), [bodyScene]);
  const clonedRotors = useMemo(
    () => DRONE_MOTORS.map(() => rotorScene.clone(true)),
    [rotorScene]
  );

  const group = useRef<THREE.Group>(null);
  const rotorRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkRef = useRef<THREE.Mesh>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  const lidarRing = useRef<THREE.Mesh>(null);
  const nextSpark = useRef(0);
  const holoOp = useFlickerOpacity(sagging, 0.5);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;

    // 3 motor sống quay tít, motor thứ 4 cháy ESC chỉ giật cục & xẹt lửa
    DRONE_MOTORS.forEach((m, i) => {
      const r = rotorRefs.current[i];
      if (!r) return;
      if (m.dead) {
        r.rotation.y = 0.45 + Math.sin(t * 23) * (sparkRef.current?.visible ? 0.14 : 0.015);
        r.rotation.z = -0.14;
        r.rotation.x = 0.08;
      } else {
        r.rotation.y += dt * 28 * m.dir;
      }
    });

    if (t > nextSpark.current) {
      nextSpark.current = t + 0.9 + Math.random() * 3.0;
      if (sparkRef.current) sparkRef.current.visible = true;
      if (sparkLight.current) sparkLight.current.intensity = 4.2;
      labAudio.triggerDroneSpark();
    }
    if (sparkRef.current?.visible && Math.random() < 0.3) sparkRef.current.visible = false;
    if (sparkLight.current) sparkLight.current.intensity *= 0.82;

    if (lidarRing.current) {
      lidarRing.current.rotation.z = t * 5.2;
      (lidarRing.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.45;
    }

    if (group.current) {
      group.current.position.y = 0.86 + Math.sin(t * 1.45) * 0.035;
      group.current.rotation.z = -0.05 + Math.sin(t * 0.75) * 0.035;
      group.current.rotation.x = Math.cos(t * 0.55) * 0.028;
    }
  });

  return (
    <group ref={group} position={[0, 0.92, 0]} rotation={[0, -0.28, 0]} scale={1.18}>
      {/* 4 dây cáp treo bảo hiểm từ khung trần xuống 4 tay carbon */}
      {DRONE_MOTORS.map(({ pos: [mx, , mz] }, i) => (
        <mesh key={`cable-${i}`} position={[mx * 0.84, 1.45, mz * 0.84]}>
          <cylinderGeometry args={[0.006, 0.006, 2.85, 6]} />
          <meshStandardMaterial color="#58697a" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}

      {/* Khung carbon COSTAR Shafter + VLP-16 LiDAR + RealSense ZR300 + pin LiPo phồng + mút rửa bát */}
      <primitive object={clonedBody} position={[0, 0, 0]} scale={1} />

      {/* 4 cánh quạt carbon riêng biệt */}
      {DRONE_MOTORS.map((m, i) => (
        <group
          key={`rotor-${i}`}
          ref={(el) => {
            rotorRefs.current[i] = el;
          }}
          position={m.pos}
        >
          <primitive object={clonedRotors[i]} />
        </group>
      ))}

      {/* Tia quét mỏng quanh tháp LiDAR VLP-16 */}
      <mesh ref={lidarRing} position={[0, 0.255, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.19, 32, 1, 0, Math.PI * 0.7]} />
        <meshBasicMaterial
          color={HOLO}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Tia lửa điện tại motor cháy ESC */}
      <mesh ref={sparkRef} position={[0.532, 0.055, 0.314]} visible={false}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#fff7ae" />
      </mesh>
      <pointLight
        ref={sparkLight}
        position={[0.532, 0.09, 0.314]}
        color="#ffd76b"
        intensity={0}
        distance={3.5}
      />
    </group>
  );
}

/* ================================================================== */
/* PRJ-IRON-BIPED — UC Berkeley 12-DoF CNC Humanoid + 80/20 Gantry     */
/* ================================================================== */

export function BipedModel({ sagging }: GhostModelProps) {
  const { scene } = useGLTF(MODEL_URLS.biped);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const ringRef = useRef<THREE.Mesh>(null);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const blueprints = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.35;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.55;
    }
    if (blueprints.current) blueprints.current.rotation.y = t * 0.16;
  });

  return (
    <group rotation={[0, 0.22, 0]}>
      {/* Vòng hiệu chuẩn lực phản hồi mặt đất dưới chân Biped */}
      <mesh ref={ringRef} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.14, 0.012, 8, 64]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.007, 8, 64]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.32} />
      </mesh>

      {/* Khung CNC 6061-T6 UC Berkeley Humanoid 12 bậc tự do treo trên giá 80/20 */}
      <primitive object={cloned} position={[0, 0, 0]} scale={0.96} />

      {/* Các mảnh bản vẽ CAD v19_final_FINAL2.step bay lơ lửng quanh giàn giáo */}
      <group ref={blueprints}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 1.18, 1.15 + Math.sin(i * 2.3) * 0.32, Math.sin(a) * 1.18]}
              rotation={[i, i * 0.7, 0]}
            >
              <boxGeometry args={[0.13, 0.17, 0.008]} />
              <meshBasicMaterial color={HOLO_DIM} wireframe transparent opacity={0.38} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ================================================================== */
/* PRJ-SMOKE-TRAP — Centrifugal Blower + Soldering Bench & PLA Hood    */
/* ================================================================== */

export function FumeExtractorModel({ sagging }: GhostModelProps) {
  const { scene } = useGLTF(MODEL_URLS.fumeExtractor);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const holoOp = useFlickerOpacity(sagging, 0.5);

  return (
    <group rotation={[0, 0.24, 0]}>
      {/* Bàn hàn ESD + quạt ly tâm gang OpenRobotics + ống ruột gà + phễu PLA vênh nhiệt + trạm hàn */}
      <primitive object={cloned} position={[0, 0, 0]} scale={0.94} />

      {/* Làn khói nhựa thông mảnh bốc lên từ mũi mỏ hàn trên PCB chui vào phễu PLA */}
      <group position={[-0.33, 0.13, 0.21]}>
        <RisingEmitter
          active
          color="#b8d4e3"
          count={45}
          height={0.38}
          radius={0.075}
          speed={0.34}
          size={0.038}
          opacity={0.38}
          wobble={0.32}
        />
      </group>

      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.15, 36]} />
        <meshBasicMaterial color={HOLO} transparent opacity={holoOp.current * 0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* PRJ-GHOST-AGV — Neobotix MP-400 Warehouse AGV + SICK MicroScan3     */
/* ================================================================== */

export function AgvModel({ sagging }: GhostModelProps) {
  const { scene } = useGLTF(MODEL_URLS.agv);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const holoOp = useFlickerOpacity(sagging, 0.5);
  const beacon = useRef<THREE.Mesh>(null);
  const scanFan = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beacon.current) {
      (beacon.current.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(t * 6.5) > 0.35 ? 0.95 : 0.2;
    }
    if (scanFan.current) {
      (scanFan.current.material as THREE.MeshBasicMaterial).opacity = holoOp.current * 0.32;
    }
  });

  return (
    <group rotation={[0, -0.68, 0]}>
      {/* Xe tự hành công nghiệp Neobotix MP-400 + cảm biến SICK MicroScan3 + dàn con lăn + cục sạc quấn bánh */}
      <primitive object={cloned} position={[0, 0, 0]} scale={0.94} />

      {/* Mặt phẳng tia laser an toàn SICK MicroScan3 quét sát sàn phía mũi xe (+Z) */}
      <mesh ref={scanFan} position={[0, 0.14, 0.72]} rotation={[-Math.PI / 2, 0, Math.PI * 0.15]}>
        <circleGeometry args={[0.92, 32, 0, Math.PI * 0.7]} />
        <meshBasicMaterial
          color={HOLO}
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Đèn cảnh báo tháp tín hiệu nhấp nháy ở góc sau */}
      <mesh ref={beacon} position={[-0.36, 1.02, -0.55]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/* PRJ-AMR-SLAM — NUS SEDS 4-Swerve Omnidirectional SLAM Robot         */
/* ================================================================== */

export const amrWorldPos = new THREE.Vector3(0, 0, 3.0);

const AMR_RADIUS = 0.68;          // bán kính thân AMR để tránh va chạm vật lý
const AMR_WHEEL_RADIUS = 0.1493;  // bán kính thực của bánh xe CAD (m) -> v = omega * R
const AMR_CRUISE_SPEED = 1.35;    // tốc độ tuần tra định mức (m/s)
const CRASH_DUR = 2.8;            // giây mất định vị xoay tại chỗ

const SWERVE_MODULES = [
  { steer: 'Steer_FL', wheel: 'Wheel_FL', rx: 0.4898, rz: 0.4809 },
  { steer: 'Steer_FR', wheel: 'Wheel_FR', rx: -0.4898, rz: 0.4809 },
  { steer: 'Steer_BL', wheel: 'Wheel_BL', rx: 0.4898, rz: -0.4809 },
  { steer: 'Steer_BR', wheel: 'Wheel_BR', rx: -0.4898, rz: -0.4809 },
] as const;

// Lộ trình tuần tra khép kín (Nav2 Spline) đi theo hành lang trống giữa các bệ trưng bày & Arc Reactor
const PATROL_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.0, 0, 3.0),     // Trạm sạc DOCK-01
    new THREE.Vector3(3.5, 0, 2.2),     // Sảnh trước bên phải
    new THREE.Vector3(3.55, 0, -0.9),   // Hành lang phải (giữa Reactor & IRON-BIPED)
    new THREE.Vector3(1.85, 0, -3.05),  // Hành lang sau phải (giữa Reactor & GHOST-AGV)
    new THREE.Vector3(0.0, 0, -3.55),   // Hành lang sau trung tâm (dưới SKY-GHOST)
    new THREE.Vector3(-1.85, 0, -3.05), // Hành lang sau trái (giữa Reactor & SMOKE-TRAP)
    new THREE.Vector3(-3.25, 0, -0.85), // Hành lang trái (né mũi càng xe nâng FORK-EYE & Reactor)
    new THREE.Vector3(-3.5, 0, 2.2),    // Sảnh trước bên trái
  ],
  true,
  'catmullrom',
  0.5
);
const PATROL_LENGTH = PATROL_CURVE.getLength();

// Vật cản cố định dưới sàn (ngoài các bệ dự án động đọc từ store)
const STATIC_FLOOR_OBSTACLES: { x: number; z: number; r: number }[] = [
  { x: 0.0, z: -1.0, r: 1.56 },   // Lõi Arc Reactor giữa sàn
  { x: -5.0, z: -1.0, r: 0.65 },  // Mũi càng thép xe nâng FORK-EYE thò ra ngoài bệ
  { x: -8.2, z: -3.0, r: 1.1 },   // Bàn màn hình hỏng bên trái
  { x: 8.2, z: -3.4, r: 1.0 },    // Thùng linh kiện bên phải
];

function wrapPi(a: number): number {
  let x = (a + Math.PI) % (Math.PI * 2);
  if (x < 0) x += Math.PI * 2;
  return x - Math.PI;
}

/** Đẩy AMR ra khỏi mọi bệ trưng bày & vật cản để không bao giờ đi xuyên vật thể */
function resolveFloorCollisions(pos: THREE.Vector3, projects: DustyProject[]) {
  for (let pass = 0; pass < 2; pass++) {
    for (const p of projects) {
      if (p.id === 'amr-slam' || p.position[1] > 0.8) continue;
      const minD = 1.60 + AMR_RADIUS;
      const dx = pos.x - p.position[0];
      const dz = pos.z - p.position[2];
      const d = Math.hypot(dx, dz);
      if (d < minD) {
        const ux = d > 1e-4 ? dx / d : 1;
        const uz = d > 1e-4 ? dz / d : 0;
        pos.x = p.position[0] + ux * minD;
        pos.z = p.position[2] + uz * minD;
      }
    }
    for (const ob of STATIC_FLOOR_OBSTACLES) {
      const minD = ob.r + AMR_RADIUS;
      const dx = pos.x - ob.x;
      const dz = pos.z - ob.z;
      const d = Math.hypot(dx, dz);
      if (d < minD) {
        const ux = d > 1e-4 ? dx / d : 0;
        const uz = d > 1e-4 ? dz / d : 1;
        pos.x = ob.x + ux * minD;
        pos.z = ob.z + uz * minD;
      }
    }
    pos.x = Math.max(-7.2, Math.min(7.2, pos.x));
    pos.z = Math.max(-7.6, Math.min(6.8, pos.z));
  }
}

const AMR_CRASH_MSGS = [
  'AMR_SLAM: Mất định vị — xoay vòng trầm cảm lần thứ 8 trong giờ',
  'AMR_SLAM: Occupancy grid lệch 40cm, phanh gấp xoay tại chỗ tìm bản đồ',
  'AMR_SLAM: LiDAR trả về 3 bản đồ khác nhau, đang bỏ phiếu tin bản nào',
  'AMR_SLAM: micro-ROS mất gói UART — khóa bánh Swerve xoay compa tại chỗ',
  'AMR_SLAM: Kidnapped robot — tự tái định vị ngay trước mũi bệ trưng bày',
];

const AMR_EMPTY_FX = { incense: 0, dust: 0, bonk: 0, boom: 0 } as const;
const amrDustColor = (d: number) => (d > 80 ? '#ff4d5e' : d > 55 ? '#ffb02e' : '#3dffa0');
const TMP_PT = new THREE.Vector3();
const TMP_TAN = new THREE.Vector3();
const TMP_TAN2 = new THREE.Vector3();

export function AmrRover({ project, sagging }: { project: DustyProject; sagging: boolean }) {
  const { scene } = useGLTF(MODEL_URLS.amr);
  const { cloned, modules } = useMemo(() => {
    const c = scene.clone(true);
    const mods = SWERVE_MODULES.map((m) => ({
      ...m,
      steerObj: c.getObjectByName(m.steer) ?? null,
      wheelObj: c.getObjectByName(m.wheel) ?? null,
    }));
    return { cloned: c, modules: mods };
  }, [scene]);

  const select = useLabStore((s) => s.select);
  const selected = useLabStore((s) => s.selectedId === project.id);
  const fx = useLabStore((s) => s.fx[project.id]) ?? AMR_EMPTY_FX;

  const body = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const spark = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.PointLight>(null);

  const distAlong = useRef(0.0);
  const initialized = useRef(false);
  const prevPos = useRef(new THREE.Vector3(0, 0, 3.0));
  const prevYaw = useRef(Math.PI * 0.5);
  const steerAngles = useRef<number[]>([0, 0, 0, 0]);
  const wheelRolls = useRef<number[]>([0, 0, 0, 0]);

  const crashStart = useRef(-1);
  const nextCrash = useRef(9 + Math.random() * 10);
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
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);

    if (!initialized.current) {
      initialized.current = true;
      PATROL_CURVE.getPointAt(0, TMP_PT);
      PATROL_CURVE.getTangentAt(0, TMP_TAN);
      b.position.set(TMP_PT.x, 0.005, TMP_PT.z);
      const initYaw = Math.atan2(TMP_TAN.x, TMP_TAN.z);
      b.rotation.y = initYaw;
      prevPos.current.copy(b.position);
      prevYaw.current = initYaw;
    }

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
        crashStart.current = -1;
        setCrashing(false);
        nextCrash.current = t + 14 + Math.random() * 14;
        if (spark.current) spark.current.visible = false;
      } else {
        // Mất định vị SLAM: đứng yên tại chỗ, khóa 4 cụm Swerve xoay tròn tìm lại bản đồ
        b.rotation.y = wrapPi(b.rotation.y + safeDt * 3.4);
        if (spark.current) spark.current.visible = Math.random() > 0.45;
      }
    } else {
      if (t > nextCrash.current) {
        crashStart.current = t;
        setCrashing(true);
        setCrashNonce((n) => n + 1);
        labAudio.triggerAmrCrash();
        useLabStore
          .getState()
          .pushFeed('amr-crash', project.id, AMR_CRASH_MSGS[Math.floor(Math.random() * AMR_CRASH_MSGS.length)]);
      }

      // Tính độ cong phía trước để tự giảm tốc mượt khi vào cua hẹp (như bộ điều khiển Nav2 thật)
      const uCur = (distAlong.current % PATROL_LENGTH) / PATROL_LENGTH;
      const uAhead = ((distAlong.current + 0.9) % PATROL_LENGTH) / PATROL_LENGTH;
      PATROL_CURVE.getTangentAt(uCur, TMP_TAN);
      PATROL_CURVE.getTangentAt(uAhead, TMP_TAN2);
      const turnCos = Math.max(-1, Math.min(1, TMP_TAN.x * TMP_TAN2.x + TMP_TAN.z * TMP_TAN2.z));
      const cornerSlowdown = 0.62 + 0.38 * Math.max(0, turnCos);
      const speed = AMR_CRUISE_SPEED * cornerSlowdown;

      distAlong.current = (distAlong.current + speed * safeDt) % PATROL_LENGTH;
      const uNext = distAlong.current / PATROL_LENGTH;
      PATROL_CURVE.getPointAt(uNext, TMP_PT);
      PATROL_CURVE.getTangentAt(uNext, TMP_TAN);

      b.position.x = TMP_PT.x;
      b.position.z = TMP_PT.z;

      // Xử lý va chạm vật lý cứng với toàn bộ bệ trưng bày & vật cản trên sàn
      resolveFloorCollisions(b.position, useLabStore.getState().projects);

      // Mũi xe hướng mượt theo tiếp tuyến quỹ đạo (ở hành lang sau thể hiện nhẹ khả năng đi chéo Swerve)
      const desiredHeading = Math.atan2(TMP_TAN.x, TMP_TAN.z);
      const yawErr = wrapPi(desiredHeading - b.rotation.y);
      b.rotation.y = wrapPi(b.rotation.y + yawErr * (1 - Math.exp(-safeDt * 6.5)));
    }

    // -------------------------------------------------------------------------
    // Động học ngược 4 cụm bánh Swerve Drive chuẩn vật lý (v_i = v_body + ω × r_i)
    // Không trượt ngang, tốc độ lăn từng bánh khớp chính xác quãng đường mặt sàn (ω_wheel = v_i / R)
    // -------------------------------------------------------------------------
    const dxW = b.position.x - prevPos.current.x;
    const dzW = b.position.z - prevPos.current.z;
    const dYaw = wrapPi(b.rotation.y - prevYaw.current);

    const vxW = dxW / safeDt;
    const vzW = dzW / safeDt;
    const omegaY = dYaw / safeDt;

    const cosP = Math.cos(b.rotation.y);
    const sinP = Math.sin(b.rotation.y);
    // Đổi vận tốc tịnh tiến từ hệ tọa độ phòng sang hệ tọa độ gắn trên thân AMR (+X trái, +Z tiến)
    const vxLocal = vxW * cosP - vzW * sinP;
    const vzLocal = vxW * sinP + vzW * cosP;

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      // Vận tốc tiếp đất tại tâm cụm bánh thứ i: v_i = v_local + (0, ω, 0) × (rx, 0, rz)
      const ux = vxLocal + omegaY * m.rz;
      const uz = vzLocal - omegaY * m.rx;
      const wheelSpeed = Math.hypot(ux, uz);

      if (wheelSpeed > 0.012) {
        let desiredSteer = Math.atan2(ux, uz);
        let driveSign = 1;
        // Giới hạn góc bẻ lái trong [-90°, +90°] quanh vị trí gốc 0° (như giới hạn dây cáp motor Swerve thực tế)
        // để cụm motor trục hẫng & dây cáp cam luôn nằm gọn dưới gầm xe, không bao giờ lật ngược 180° ra ngoài!
        if (desiredSteer > Math.PI * 0.5) {
          desiredSteer -= Math.PI;
          driveSign = -1;
        } else if (desiredSteer < -Math.PI * 0.5) {
          desiredSteer += Math.PI;
          driveSign = -1;
        }
        const delta = desiredSteer - steerAngles.current[i];
        steerAngles.current[i] += delta * (1 - Math.exp(-safeDt * 18));
        wheelRolls.current[i] +=
          (driveSign * wheelSpeed * Math.cos(delta) * safeDt) / AMR_WHEEL_RADIUS;
      }

      if (m.steerObj) m.steerObj.rotation.set(0, steerAngles.current[i], 0);
      if (m.wheelObj) m.wheelObj.rotation.set(wheelRolls.current[i], 0, 0);
    }

    prevPos.current.copy(b.position);
    prevYaw.current = b.rotation.y;

    if (scan.current) {
      scan.current.rotation.z = -t * 7.5;
      (scan.current.material as THREE.MeshBasicMaterial).opacity =
        holoOp.current * (inCrash ? 0.9 : 0.45);
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

    const bt = t - bonkT.current;
    const jolt = bt >= 0 && bt < 0.5 ? (1 - bt / 0.5) * 0.07 : 0;
    // Khi bánh xe lăn qua thảm sạc cảm ứng DOCK-01 (cao 2.6cm), thân xe nâng/hạ mượt theo dốc thảm sạc
    const dockDx = Math.abs(b.position.x - project.position[0]);
    const dockDz = Math.abs(b.position.z - project.position[2]);
    const dockRampX = Math.max(0, Math.min(1, (0.92 - dockDx) / 0.28));
    const dockRampZ = Math.max(0, Math.min(1, (0.92 - dockDz) / 0.28));
    const dockLift = 0.026 * dockRampX * dockRampZ;
    b.position.y = 0.004 + dockLift + Math.abs(Math.sin(t * 90)) * jolt;
    if (lamp.current) lamp.current.intensity = 1.4 + boomFlash.current * 25;
    boomFlash.current *= 0.85;

    amrWorldPos.copy(b.position);

    const camDist = state.camera.position.distanceTo(b.position);
    if (camDist < 2.8 !== tagTooClose) setTagTooClose(camDist < 2.8);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(project.id);
  };

  return (
    <group>
      {/* Trạm sạc cảm ứng xuất phát DOCK-01 (vát dốc 2.6cm để bánh Swerve leo qua thật vật lý) */}
      <group position={project.position as [number, number, number]}>
        <mesh position={[0, 0.013, 0]}>
          <boxGeometry args={[1.45, 0.026, 1.45]} />
          <meshStandardMaterial color="#1a2430" metalness={0.7} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.53, 28]} />
          <meshBasicMaterial color={HOLO} transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} position={[x, 0.055, 0.66]}>
            <cylinderGeometry args={[0.026, 0.026, 0.06, 10]} />
            <meshStandardMaterial
              color={AMBER}
              metalness={0.8}
              roughness={0.3}
              emissive={AMBER}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}
        <Html position={[0, 0.55, 0]} center distanceFactor={10}>
          <div className="select-none whitespace-nowrap border border-holo/30 bg-void/70 px-2 py-0.5 font-mono text-[8px] text-holo/75 backdrop-blur-sm">
            DOCK-01 · TRẠM SẠC AMR
          </div>
        </Html>
      </group>

      {/* Robot tự hành đa hướng 4 cụm bánh Swerve (NUS OGV SLAM) */}
      <group ref={body} onClick={onClick}>
        <primitive object={cloned} position={[0, 0, 0]} scale={1} />

        {/* Vòng quét LiDAR 2D sát sàn */}
        <mesh ref={scan} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.98, 1.05, 48, 1, 0, 0.85]} />
          <meshBasicMaterial
            color={HOLO}
            transparent
            opacity={0.38}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Đèn hiệu trạng thái SLAM */}
        <mesh ref={beacon} position={[0, 0.71, -0.26]}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshBasicMaterial color={AMBER} transparent opacity={0.85} />
        </mesh>
        <mesh ref={spark} position={[0, 0.38, 0.55]} visible={false}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color="#fff7ae" />
        </mesh>
        <pointLight ref={lamp} position={[0, 0.95, 0]} color={HOLO} intensity={1.4} distance={4.5} decay={2} />

        {/* Hạt bụi & hiệu ứng tương tác */}
        <Sparkles
          count={70}
          scale={[1.35, 0.8, 1.35]}
          position={[0, 0.45, 0]}
          size={1.8}
          speed={0.1}
          opacity={dustOpacity}
          color="#9db2c2"
          noise={2}
        />
        <RisingEmitter active={incenseActive} color="#ffcf6b" count={100} height={1.8} radius={0.5} speed={0.7} size={0.05} opacity={0.8} wobble={0.6} />
        <BurstEmitter nonce={fx.dust + crashNonce} count={200} speed={3} color="#9fc4d4" />
        <BurstEmitter nonce={fx.boom} count={120} speed={2.4} color={AMBER} />

        {/* HUD Tag */}
        {!selected && !tagTooClose && (
          <Html position={[0, 1.25, 0]} center distanceFactor={8} className="holo-tag">
            <div
              onClick={() => select(project.id)}
              className="cursor-pointer select-none border border-holo/40 bg-void/80 px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm transition-all hover:border-holo"
            >
              <div className="font-display text-[11px] font-bold tracking-widest text-holo">{project.codeName}</div>
              <div className="mt-0.5 flex gap-3 text-[9px]">
                <span className="text-holo/80">▓ {project.completionPercent}% XONG</span>
                {crashing ? (
                  <span className="animate-pulse font-bold text-danger">
                    <AiOutlineWarning className="inline-block align-[-2px]" /> MẤT ĐỊNH VỊ
                  </span>
                ) : (
                  <span style={{ color: amrDustColor(project.dustLevel) }}>
                    ĐỘ PHỦ BỤI: {Math.round(project.dustLevel)}%
                  </span>
                )}
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URLS.forklift);
useGLTF.preload(MODEL_URLS.fumeExtractor);
useGLTF.preload(MODEL_URLS.drone);
useGLTF.preload(MODEL_URLS.droneRotor);
useGLTF.preload(MODEL_URLS.agv);
useGLTF.preload(MODEL_URLS.biped);
useGLTF.preload(MODEL_URLS.amr);
