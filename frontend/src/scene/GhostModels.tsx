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
