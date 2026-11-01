import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface GhostModelProps {
  sagging: boolean;
}

/** Per-frame hologram flicker helper — returns opacity multiplier */
function useFlickerOpacity(sagging: boolean, base: number) {
  const ref = useRef(base);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const idle = base * (0.9 + 0.1 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
    ref.current = sagging ? base * (0.25 + Math.random() * 0.5) : idle;
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
