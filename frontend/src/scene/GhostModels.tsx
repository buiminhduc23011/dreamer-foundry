import { useMemo, useRef, useState } from 'react';
import { AiOutlineWarning } from 'react-icons/ai';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, Sparkles, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { DustyProject } from '../types';
import { useLabStore } from '../store/labStore';
import { BurstEmitter, RisingEmitter } from './particles';
import { labAudio } from '../audio/labAudio';
import { LabChair } from './LabFurniture';
import {
  getHmiScreenTexture,
  getJarvisHudTexture,
  getSiemensFaceplateTexture,
} from './labTextures';

export interface GhostModelProps {
  sagging: boolean;
  brownout?: boolean;
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
const GOLD = '#ffcf6b';

const MODEL_URLS = {
  forklift: '/models/forklift.glb?v=3',
  drone: '/models/drone.glb?v=3',
  droneRotor: '/models/drone_rotor.glb?v=3',
  biped: '/models/biped.glb?v=3',
  amr: '/models/amr.glb?v=5',
} as const;

/* ================================================================== */
/* 1. PRJ-FORK-EYE — OpenRobotics Warehouse Forklift + OAK-1 W Vision  */
/* ================================================================== */

export function ForkliftModel({ sagging }: GhostModelProps) {
  const { scene } = useGLTF(MODEL_URLS.forklift);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat && mat.name === 'ForkliftPBR') {
          mat.metalness = 0.25;
          mat.roughness = 0.55;
          mat.color.set('#f59e0b');
          mat.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene]);

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
    <group rotation={[0, 0.35, 0]} scale={0.76}>
      <primitive object={cloned} position={[0, 0, 0]} />

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
/* 2. PRJ-REMOTE-IO — Siemens SIMATIC ET 200SP Distributed I/O Rig     */
/* ================================================================== */

interface SliceSpec {
  tag: string;
  safety?: boolean;
  lightBu?: boolean;
  fault?: boolean;
  analog?: boolean;
}

const ET200_SLICES: SliceSpec[] = [
  { tag: 'DI16', lightBu: true },
  { tag: 'DI16' },
  { tag: 'DQ16', fault: true },
  { tag: 'DQ16' },
  { tag: 'AI4', lightBu: true, analog: true, fault: true },
  { tag: 'AQ2', analog: true },
  { tag: 'F-DI', safety: true, lightBu: true },
  { tag: 'F-DQ', safety: true },
];

export function RemoteIoModel({ sagging }: GhostModelProps) {
  const siemensFace = useMemo(() => getSiemensFaceplateTexture(), []);
  const hmiTex = useMemo(() => getHmiScreenTexture(), []);

  const bfLedRef = useRef<THREE.MeshBasicMaterial>(null);
  const sfSlotLedRef = useRef<THREE.MeshBasicMaterial>(null);
  const andonRedRef = useRef<THREE.MeshBasicMaterial>(null);
  const andonLightRef = useRef<THREE.PointLight>(null);
  const chLedGroupRef = useRef<THREE.Group>(null);
  const relayFlagsRef = useRef<(THREE.Mesh | null)[]>([]);

  // 2 đường cáp PROFINET xanh lá cây chống nhiễu uốn cong từ 2 cổng RJ45 X1 P1R/P2R xuống máng cáp
  const profinetCableA = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.305, 0.245, 0.088),
      new THREE.Vector3(-0.315, 0.175, 0.145),
      new THREE.Vector3(-0.34, 0.105, 0.125),
      new THREE.Vector3(-0.46, 0.088, 0.085),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.0055, 8, false);
  }, []);

  const profinetCableB = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.278, 0.245, 0.088),
      new THREE.Vector3(-0.272, 0.165, 0.152),
      new THREE.Vector3(-0.18, 0.098, 0.125),
      new THREE.Vector3(0.05, 0.088, 0.085),
    ]);
    return new THREE.TubeGeometry(curve, 20, 0.0055, 8, false);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const blink2Hz = Math.sin(t * Math.PI * 4) > 0;
    const sagFactor = sagging ? 0.45 + 0.35 * Math.sin(t * 19) : 1;

    if (bfLedRef.current) {
      bfLedRef.current.color.set(blink2Hz ? '#ff2a3c' : '#3b0a10');
    }
    if (sfSlotLedRef.current) {
      sfSlotLedRef.current.color.set(!blink2Hz ? '#ff2a3c' : '#450a11');
    }
    if (andonRedRef.current) {
      andonRedRef.current.color.set(blink2Hz ? '#ff3344' : '#4a0f16');
    }
    if (andonLightRef.current) {
      andonLightRef.current.intensity = (blink2Hz ? 1.8 : 0.15) * sagFactor;
    }

    if (chLedGroupRef.current) {
      chLedGroupRef.current.children.forEach((child, idx) => {
        const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        const active = Math.sin(t * (2.2 + (idx % 5) * 0.85) + idx * 1.3) > -0.15;
        m.color.set(active ? '#22c55e' : '#0f291a');
      });
    }

    relayFlagsRef.current.forEach((flag, idx) => {
      if (!flag) return;
      const closed = Math.sin(t * (1.6 + idx * 0.7) + idx * 2.1) > 0.25;
      flag.position.z = closed ? 0.056 : 0.051;
    });
  });

  return (
    <group position={[0, 0, 0.04]}>
      {/* ========================================================= */}
      {/* 1. KHUNG PANEL THỬ NGHIỆM THÉP BẮT CHẶT TRÊN MẶT BÀN ESD  */}
      {/* ========================================================= */}
      {[-0.56, 0.56].map((fx) => (
        <group key={`stand-foot-${fx}`} position={[fx, 0, 0]}>
          <mesh position={[0, 0.008, 0.02]}>
            <boxGeometry args={[0.08, 0.016, 0.34]} />
            <meshStandardMaterial color="#1e293b" metalness={0.78} roughness={0.35} />
          </mesh>
          {[-0.12, 0.14].map((bz) => (
            <mesh key={bz} position={[0, 0.02, bz]}>
              <cylinderGeometry args={[0.009, 0.009, 0.012, 6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.28, -0.04]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[0.042, 0.55, 0.032]} />
            <meshStandardMaterial color="#273548" metalness={0.75} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Tấm Sub-plate thép mạ kẽm (Backplate tủ điện công nghiệp) */}
      <group position={[0, 0.285, -0.035]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0, -0.015]}>
          <boxGeometry args={[1.22, 0.52, 0.014]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.32} />
        </mesh>

        {/* ========================================================= */}
        {/* 2. MÁNG CÁP RĂNG LƯỢC PVC XÁM (Slotted Wiring Ducts)       */}
        {/* ========================================================= */}
        {[0.21, -0.195].map((dy, di) => (
          <group key={`duct-${di}`} position={[-0.08, dy, 0.024]}>
            <mesh>
              <boxGeometry args={[0.98, 0.046, 0.056]} />
              <meshStandardMaterial color="#64748b" roughness={0.55} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0, 0.029]}>
              <boxGeometry args={[0.984, 0.048, 0.005]} />
              <meshStandardMaterial color="#78879b" roughness={0.48} metalness={0.12} />
            </mesh>
            {Array.from({ length: 28 }, (_, si) => -0.45 + si * 0.033).map((sx, si) => (
              <mesh key={si} position={[sx, di === 0 ? -0.023 : 0.023, 0.008]}>
                <boxGeometry args={[0.009, 0.006, 0.042]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}

        {/* ========================================================= */}
        {/* 3. THANH RAY NHÔM TIÊU CHUẨN DIN 35mm (TS35 Top-Hat Rail)  */}
        {/* ========================================================= */}
        <group position={[-0.06, 0.015, 0.004]}>
          <mesh>
            <boxGeometry args={[1.04, 0.035, 0.008]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.22} />
          </mesh>
          {[0.015, -0.015].map((ry) => (
            <mesh key={ry} position={[0, ry, 0.005]}>
              <boxGeometry args={[1.04, 0.005, 0.006]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.18} />
            </mesh>
          ))}
          {[-0.505, 0.445].map((cx) => (
            <mesh key={cx} position={[cx, 0, 0.022]}>
              <boxGeometry args={[0.014, 0.052, 0.042]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* ========================================================= */}
        {/* 4. BỘ NGUỒN SIEMENS SITOP PSU100S 24V / 10A (Trái cùng)    */}
        {/* ========================================================= */}
        <group position={[-0.435, 0.015, 0.052]}>
          <mesh>
            <boxGeometry args={[0.105, 0.145, 0.098]} />
            <meshStandardMaterial color="#27323d" metalness={0.45} roughness={0.48} />
          </mesh>
          <mesh position={[0, 0.042, 0.05]}>
            <boxGeometry args={[0.106, 0.018, 0.002]} />
            <meshBasicMaterial color="#009999" />
          </mesh>
          {[-0.035, -0.018, 0, 0.018, 0.035].map((vx) => (
            <mesh key={vx} position={[vx, 0.062, 0.02]}>
              <boxGeometry args={[0.007, 0.022, 0.05]} />
              <meshStandardMaterial color="#090e14" roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[-0.032, 0.018, 0.05]}>
            <boxGeometry args={[0.008, 0.008, 0.003]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0.028, 0.018, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.004, 10]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
          {[-0.032, -0.01, 0.012, 0.034].map((tx, ti) => (
            <group key={ti}>
              <mesh position={[tx, -0.058, 0.046]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.008, 10]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[tx, -0.13, 0.038]}>
                <cylinderGeometry args={[0.003, 0.003, 0.13, 6]} />
                <meshStandardMaterial color={ti < 2 ? '#dc2626' : '#1d4ed8'} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>

        {/* ========================================================= */}
        {/* 5. TRẠM SIEMENS SIMATIC ET 200SP: IM 155-6 PN + 8 SLICE    */}
        {/* ========================================================= */}
        <group position={[-0.31, 0.015, 0.044]}>
          <mesh>
            <boxGeometry args={[0.092, 0.136, 0.082]} />
            <meshStandardMaterial color="#2d3741" metalness={0.3} roughness={0.52} />
          </mesh>
          <mesh position={[0, 0.012, 0.042]}>
            <planeGeometry args={[0.088, 0.108]} />
            <meshBasicMaterial map={siemensFace} />
          </mesh>
          <mesh position={[-0.026, 0.022, 0.044]}>
            <boxGeometry args={[0.009, 0.007, 0.004]} />
            <meshBasicMaterial ref={bfLedRef} color="#ff2a3c" />
          </mesh>
          <mesh position={[-0.026, 0.032, 0.044]}>
            <boxGeometry args={[0.009, 0.007, 0.004]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
          <mesh position={[-0.026, 0.012, 0.044]}>
            <boxGeometry args={[0.009, 0.007, 0.004]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>

          {[-0.015, 0.015].map((px, pi) => (
            <group key={pi} position={[px, -0.044, 0.048]}>
              <mesh>
                <boxGeometry args={[0.021, 0.032, 0.028]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
              </mesh>
              <mesh position={[0, -0.012, 0.006]}>
                <boxGeometry args={[0.016, 0.014, 0.016]} />
                <meshStandardMaterial color="#009999" roughness={0.4} />
              </mesh>
              <mesh position={[-0.005, 0.012, 0.015]}>
                <boxGeometry args={[0.004, 0.004, 0.002]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
              <mesh position={[0.005, 0.012, 0.015]}>
                <boxGeometry args={[0.004, 0.004, 0.002]} />
                <meshBasicMaterial color="#eab308" />
              </mesh>
            </group>
          ))}
        </group>

        {/* 8 Slice I/O Modules (DI 16, DQ 16, AI 4, AQ 2, PROFIsafe F-DI/F-DQ) */}
        <group position={[-0.232, 0.015, 0.04]}>
          {ET200_SLICES.map((slice, idx) => {
            const sx = idx * 0.034;
            const bodyCol = slice.safety ? '#eab308' : '#313d49';
            const buCol = slice.lightBu ? '#cbd5e1' : '#475569';
            return (
              <group key={`slice-${idx}`} position={[sx, 0, 0]}>
                <mesh position={[0, 0.032, 0.002]}>
                  <boxGeometry args={[0.032, 0.072, 0.076]} />
                  <meshStandardMaterial color={bodyCol} roughness={0.45} metalness={0.18} />
                </mesh>
                <mesh position={[0, 0.062, 0.041]}>
                  <boxGeometry args={[0.028, 0.008, 0.002]} />
                  <meshBasicMaterial
                    color={
                      slice.safety
                        ? '#fef08a'
                        : slice.analog
                          ? '#0284c7'
                          : slice.tag.startsWith('DI')
                            ? '#f8fafc'
                            : '#009999'
                    }
                  />
                </mesh>
                <mesh position={[0, 0.048, 0.041]}>
                  <boxGeometry args={[0.012, 0.005, 0.003]} />
                  {slice.fault ? (
                    <meshBasicMaterial ref={idx === 2 ? sfSlotLedRef : undefined} color="#ff2a3c" />
                  ) : (
                    <meshBasicMaterial color="#22c55e" />
                  )}
                </mesh>

                <mesh position={[0, -0.036, 0.008]}>
                  <boxGeometry args={[0.032, 0.066, 0.084]} />
                  <meshStandardMaterial color={buCol} roughness={0.5} metalness={0.12} />
                </mesh>

                {[-0.007, 0.007].map((px) =>
                  [0, 1, 2, 3].map((py) => (
                    <mesh key={`${px}-${py}`} position={[px, -0.014 - py * 0.013, 0.051]}>
                      <boxGeometry args={[0.007, 0.008, 0.004]} />
                      <meshStandardMaterial
                        color={py === 3 ? '#dc2626' : py === 2 ? '#2563eb' : '#f97316'}
                        roughness={0.4}
                      />
                    </mesh>
                  ))
                )}

                {[-0.008, 0.008].map((wx, wi) => {
                  const wireCol = slice.safety
                    ? '#eab308'
                    : slice.analog
                      ? '#a855f7'
                      : wi === 0
                        ? '#2563eb'
                        : '#0f172a';
                  return (
                    <group key={`w-${wi}`}>
                      <mesh position={[wx, -0.072, 0.042]}>
                        <cylinderGeometry args={[0.0028, 0.0028, 0.018, 6]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
                      </mesh>
                      <mesh position={[wx, -0.135, 0.036]}>
                        <cylinderGeometry args={[0.002, 0.002, 0.12, 6]} />
                        <meshStandardMaterial color={wireCol} roughness={0.55} />
                      </mesh>
                      <mesh position={[wx, 0.135, 0.032]}>
                        <cylinderGeometry args={[0.0018, 0.0018, 0.13, 6]} />
                        <meshStandardMaterial color={wi === 0 ? '#dc2626' : '#1d4ed8'} roughness={0.55} />
                      </mesh>
                    </group>
                  );
                })}
              </group>
            );
          })}

          <group ref={chLedGroupRef}>
            {ET200_SLICES.map((_, idx) =>
              [0, 1, 2, 3].map((ch) => (
                <mesh
                  key={`cled-${idx}-${ch}`}
                  position={[idx * 0.034 + (ch % 2 === 0 ? -0.006 : 0.006), 0.032 - Math.floor(ch / 2) * 0.014, 0.042]}
                >
                  <boxGeometry args={[0.006, 0.005, 0.002]} />
                  <meshBasicMaterial color="#22c55e" />
                </mesh>
              ))
            )}
          </group>

          <mesh position={[ET200_SLICES.length * 0.034 - 0.008, 0, 0]}>
            <boxGeometry args={[0.014, 0.134, 0.076]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
        </group>

        {/* ========================================================= */}
        {/* 6. DÀN 4 RƠ-LE KIẾNG TRUNG GIAN 24VDC (Finder / Omron)    */}
        {/* ========================================================= */}
        <group position={[0.145, 0.015, 0.042]}>
          {[0, 1, 2, 3].map((ri) => {
            const rx = ri * 0.042;
            return (
              <group key={`relay-${ri}`} position={[rx, 0, 0]}>
                <mesh position={[0, 0, -0.008]}>
                  <boxGeometry args={[0.036, 0.118, 0.056]} />
                  <meshStandardMaterial color="#111827" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.005, 0.032]}>
                  <boxGeometry args={[0.03, 0.052, 0.042]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    transparent
                    opacity={0.55}
                    roughness={0.18}
                    metalness={0.1}
                  />
                </mesh>
                <mesh position={[0, 0.005, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.026, 12]} />
                  <meshStandardMaterial color="#b45309" metalness={0.75} roughness={0.3} />
                </mesh>
                <mesh
                  ref={(el) => {
                    relayFlagsRef.current[ri] = el;
                  }}
                  position={[0, 0.018, 0.054]}
                >
                  <boxGeometry args={[0.012, 0.01, 0.005]} />
                  <meshStandardMaterial color="#f97316" roughness={0.4} />
                </mesh>
                <mesh position={[0, -0.014, 0.054]}>
                  <boxGeometry args={[0.006, 0.004, 0.002]} />
                  <meshBasicMaterial color={ri % 2 === 0 ? '#22c55e' : '#0f291a'} />
                </mesh>
                <mesh position={[0, 0.005, 0.055]}>
                  <boxGeometry args={[0.032, 0.056, 0.0015]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* ========================================================= */}
        {/* 7. MÀN HÌNH SIEMENS SIMATIC HMI TP700 COMFORT & E-STOP     */}
        {/* ========================================================= */}
        <group position={[0.455, 0.085, 0.032]}>
          <mesh>
            <boxGeometry args={[0.255, 0.175, 0.036]} />
            <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.019]}>
            <planeGeometry args={[0.228, 0.145]} />
            <meshBasicMaterial map={hmiTex} />
          </mesh>
        </group>

        <group position={[0.455, -0.115, 0.042]}>
          <mesh>
            <boxGeometry args={[0.086, 0.086, 0.058]} />
            <meshStandardMaterial color="#eab308" roughness={0.42} />
          </mesh>
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.004, 24]} />
            <meshStandardMaterial color="#fef08a" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.044]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.018, 0.024, 24]} />
            <meshStandardMaterial color="#dc2626" roughness={0.35} />
          </mesh>
        </group>
      </group>

      {/* 2 Sợi cáp xanh lá PROFINET Industrial Ethernet đặc trưng của Siemens */}
      <group position={[0, 0.285, -0.035]} rotation={[-0.12, 0, 0]}>
        <mesh geometry={profinetCableA}>
          <meshStandardMaterial color="#00b347" roughness={0.38} metalness={0.1} />
        </mesh>
        <mesh geometry={profinetCableB}>
          <meshStandardMaterial color="#00b347" roughness={0.38} metalness={0.1} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 8. CỘT ĐÈN THÁP CẢNH BÁO CÔNG NGHIỆP 3 TẦNG (Andon Tower)  */}
      {/* ========================================================= */}
      <group position={[0.56, 0.54, -0.09]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.16, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.165, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.025, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.198, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.042, 20]} />
          <meshStandardMaterial color="#14532d" transparent opacity={0.75} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.242, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.042, 20]} />
          <meshBasicMaterial color="#d97706" />
        </mesh>
        <mesh position={[0, 0.286, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.042, 20]} />
          <meshBasicMaterial ref={andonRedRef} color="#ff3344" />
        </mesh>
        <mesh position={[0, 0.312, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.012, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <pointLight ref={andonLightRef} position={[0, 0.29, 0.05]} color="#ff3344" intensity={1.5} distance={2.8} />
      </group>
    </group>
  );
}

/* ================================================================== */
/* 3. PRJ-JARVIS-CORE — Tony Stark's J.A.R.V.I.S. Holo-Table & AI Core */
/* ================================================================== */

const EQ_BAR_COUNT = 28;

export function JarvisCoreModel({ sagging, brownout = false }: GhostModelProps) {
  const hud0 = useMemo(() => getJarvisHudTexture(0), []);
  const hud1 = useMemo(() => getJarvisHudTexture(1), []);
  const hud2 = useMemo(() => getJarvisHudTexture(2), []);

  const ringOuterRef = useRef<THREE.Group>(null);
  const ringMidRef = useRef<THREE.Group>(null);
  const ringInnerRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Points>(null);
  const hudOrbitRef = useRef<THREE.Group>(null);
  const eqBarsRef = useRef<(THREE.Mesh | null)[]>([]);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const arcFloorLightRef = useRef<THREE.PointLight>(null);

  const neuralPositions = useMemo(() => {
    const count = 360;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = i % 3 === 0 ? 0.22 + Math.random() * 0.14 : 0.42 + Math.random() * 0.28;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const sagMul = brownout
      ? 0.35 + 0.3 * Math.sin(t * 25)
      : sagging
        ? 0.55 + 0.28 * Math.sin(t * 17)
        : 0.92 + 0.08 * Math.sin(t * 3.4);

    if (ringOuterRef.current) {
      ringOuterRef.current.rotation.y += dt * 0.42;
      ringOuterRef.current.rotation.x = 0.32 + Math.sin(t * 0.5) * 0.14;
    }
    if (ringMidRef.current) {
      ringMidRef.current.rotation.x -= dt * 0.68;
      ringMidRef.current.rotation.z += dt * 0.36;
    }
    if (ringInnerRef.current) {
      ringInnerRef.current.rotation.y -= dt * 1.15;
      ringInnerRef.current.rotation.z = Math.cos(t * 0.9) * 0.45;
    }
    if (nucleusRef.current) {
      const pulse = 1 + Math.sin(t * 4.2) * 0.07 + Math.sin(t * 11.5) * 0.025;
      nucleusRef.current.scale.setScalar(pulse);
      nucleusRef.current.rotation.y = t * 0.55;
      nucleusRef.current.rotation.x = t * 0.31;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = -t * 0.18;
      cloudRef.current.rotation.z = Math.sin(t * 0.3) * 0.12;
    }
    if (hudOrbitRef.current) {
      hudOrbitRef.current.rotation.y = t * 0.22;
    }

    for (let i = 0; i < EQ_BAR_COUNT; i++) {
      const bar = eqBarsRef.current[i];
      if (!bar) continue;
      const speechEnv = Math.max(0.15, Math.sin(t * 2.3) * Math.cos(t * 0.9) + 0.45);
      const wave = Math.abs(Math.sin(t * 9.5 + i * 0.65) * Math.cos(t * 4.1 - i * 0.35));
      const h = 0.025 + speechEnv * wave * 0.16;
      bar.scale.y = h / 0.06;
    }

    if (coreLightRef.current) {
      coreLightRef.current.intensity = 9.5 * sagMul;
    }
    if (arcFloorLightRef.current) {
      arcFloorLightRef.current.intensity = 11 * sagMul;
    }
  });

  return (
    <group>
      {/* ========================================================= */}
      {/* 1. ĐẾ SÀN BÁT GIÁC TITAN & LÕI ARC REACTOR TRUNG TÂM       */}
      {/* ========================================================= */}
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[1.42, 1.54, 0.056, 8]} />
        <meshStandardMaterial color="#131c27" metalness={0.84} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0.062, 0]}>
        <cylinderGeometry args={[1.08, 1.22, 0.024, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.82} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0.078, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.02, 40]} />
        <meshBasicMaterial color={brownout ? AMBER : HOLO} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={`coil-${i}`} position={[Math.cos(a) * 0.52, 0.088, Math.sin(a) * 0.52]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.14, 0.022, 0.055]} />
            <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
          </mesh>
        );
      })}
      <pointLight ref={arcFloorLightRef} position={[0, 0.35, 0]} color={HOLO} intensity={11} distance={10} decay={1.8} />

      {/* ========================================================= */}
      {/* 2. CHÂN TRỤ TITAN CNC & BÀN KÍNH CẢM ỨNG STARK HOLO-TABLE   */}
      {/* ========================================================= */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <group key={`strut-${i}`} rotation={[0, a, 0]}>
            <mesh position={[0.78, 0.43, 0]} rotation={[0, 0, 0.24]}>
              <boxGeometry args={[0.095, 0.78, 0.14]} />
              <meshStandardMaterial color="#273445" metalness={0.86} roughness={0.26} />
            </mesh>
            <mesh position={[0.835, 0.43, 0]} rotation={[0, 0, 0.24]}>
              <boxGeometry args={[0.008, 0.66, 0.02]} />
              <meshBasicMaterial color={HOLO} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.26, 0.38, 0.72, 24, 1, true]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, 0.805, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.3, 0.032, 16, 64]} />
        <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.22} />
      </mesh>

      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[1.29, 1.29, 0.022, 64]} />
        <meshStandardMaterial
          color="#0c1926"
          metalness={0.35}
          roughness={0.08}
          transparent
          opacity={0.78}
        />
      </mesh>

      {[0.48, 0.82, 1.14].map((r, ri) => (
        <mesh key={`tbl-ring-${ri}`} position={[0, 0.833, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r, r + (ri === 1 ? 0.018 : 0.009), 64]} />
          <meshBasicMaterial color={ri === 1 ? AMBER : HOLO} transparent opacity={0.58} side={THREE.DoubleSide} />
        </mesh>
      ))}

      <mesh position={[0, 0.835, 0]}>
        <cylinderGeometry args={[0.32, 0.35, 0.018, 36]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.846, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.008, 36]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const px = Math.cos(a) * 1.18;
        const pz = Math.sin(a) * 1.18;
        return (
          <group key={`proj-${i}`} position={[px, 0.845, pz]} rotation={[0, -a, 0]}>
            <mesh rotation={[0, 0, 0.45]}>
              <boxGeometry args={[0.085, 0.036, 0.055]} />
              <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[-0.035, 0.02, 0]} rotation={[0, 0, 0.45]}>
              <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
              <meshBasicMaterial color={i % 2 === 0 ? AMBER : HOLO} />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 1.24, 0]}>
        <cylinderGeometry args={[0.68, 0.28, 0.78, 32, 1, true]} />
        <meshBasicMaterial
          color={AMBER}
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group position={[0.78, 0.81, 0.98]} rotation={[0, -0.62, 0]}>
        <mesh position={[0, -0.04, -0.12]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.08, 0.03, 0.28]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh rotation={[0.28, 0, 0]}>
          <boxGeometry args={[0.52, 0.014, 0.26]} />
          <meshStandardMaterial color="#0c1926" metalness={0.4} roughness={0.1} transparent opacity={0.82} />
        </mesh>
        <mesh position={[0, 0.009, 0]} rotation={[-Math.PI / 2 + 0.28, 0, 0]}>
          <planeGeometry args={[0.46, 0.2]} />
          <meshBasicMaterial color={HOLO} wireframe transparent opacity={0.45} />
        </mesh>
      </group>
      <LabChair position={[1.18, 0, 1.48]} rotation={[0, -2.25, 0]} hasBackrest={true} />

      {/* ========================================================= */}
      {/* 3. QUẢ CẦU TRÍ TUỆ NHÂN TẠO HOLOGRAM J.A.R.V.I.S. (y=1.66m)*/}
      {/* ========================================================= */}
      <group position={[0, 1.66, 0]}>
        <mesh ref={nucleusRef}>
          <icosahedronGeometry args={[0.24, 1]} />
          <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.85} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshBasicMaterial color="#fff3c4" />
        </mesh>

        <points ref={cloudRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[neuralPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={AMBER}
            size={0.022}
            transparent
            opacity={0.88}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>

        <group ref={ringOuterRef}>
          <mesh>
            <torusGeometry args={[0.68, 0.009, 12, 80]} />
            <meshBasicMaterial color={AMBER} transparent opacity={0.85} />
          </mesh>
          <mesh rotation={[0, 0, 0.4]}>
            <torusGeometry args={[0.73, 0.014, 8, 48, Math.PI * 0.65]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.75} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI + 0.4]}>
            <torusGeometry args={[0.73, 0.014, 8, 48, Math.PI * 0.55]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.75} />
          </mesh>
        </group>

        <group ref={ringMidRef}>
          <mesh>
            <torusGeometry args={[0.54, 0.008, 12, 72]} />
            <meshBasicMaterial color={HOLO} transparent opacity={0.72} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.57, 0.012, 8, 40, Math.PI * 0.8]} />
            <meshBasicMaterial color={AMBER} transparent opacity={0.68} />
          </mesh>
        </group>

        <group ref={ringInnerRef}>
          <mesh>
            <torusGeometry args={[0.38, 0.01, 10, 64]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.9} />
          </mesh>
        </group>

        <group position={[0, -0.08, 0]}>
          {Array.from({ length: EQ_BAR_COUNT }, (_, i) => {
            const a = (i / EQ_BAR_COUNT) * Math.PI * 2;
            const r = 0.82;
            return (
              <mesh
                key={`eq-${i}`}
                ref={(el) => {
                  eqBarsRef.current[i] = el;
                }}
                position={[Math.cos(a) * r, 0, Math.sin(a) * r]}
                rotation={[0, -a, 0]}
              >
                <boxGeometry args={[0.014, 0.06, 0.014]} />
                <meshBasicMaterial color={i % 3 === 0 ? HOLO : AMBER} transparent opacity={0.85} />
              </mesh>
            );
          })}
        </group>

        <group ref={hudOrbitRef}>
          {[hud0, hud1, hud2].map((tex, hi) => {
            const a = (hi / 3) * Math.PI * 2 + 0.4;
            const r = 1.04;
            return (
              <mesh
                key={`jhud-${hi}`}
                position={[Math.cos(a) * r, (hi - 1) * 0.14, Math.sin(a) * r]}
                rotation={[0, -a + Math.PI / 2, 0]}
              >
                <planeGeometry args={[0.56, 0.28]} />
                <meshBasicMaterial
                  map={tex}
                  transparent
                  opacity={0.86}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </group>

        <pointLight ref={coreLightRef} color={AMBER} intensity={9.5} distance={8.5} decay={1.8} />
      </group>
    </group>
  );
}

/* ================================================================== */
/* 4. PRJ-SKY-GHOST — Grounded 80/20 Flight Test Cage + Tethered Drone */
/* ================================================================== */

const DRONE_MOTORS: { pos: [number, number, number]; dir: number; dead?: boolean }[] = [
  { pos: [-0.5317, 0.0336, 0.3141], dir: 1 },
  { pos: [-0.4351, 0.0336, -0.4384], dir: -1 },
  { pos: [0.4351, 0.0336, -0.4384], dir: 1 },
  { pos: [0.5317, 0.0336, 0.3141], dir: -1, dead: true },
];

const CAGE_X = 0.62;
const CAGE_Z = 0.37;
const CAGE_H = 1.12;
const CAGE_CORNERS: [number, number][] = [
  [-CAGE_X, CAGE_Z],
  [-CAGE_X, -CAGE_Z],
  [CAGE_X, -CAGE_Z],
  [CAGE_X, CAGE_Z],
];

const UP_VEC = new THREE.Vector3(0, 1, 0);

export function DroneModel({ sagging }: GhostModelProps) {
  const { scene: bodyScene } = useGLTF(MODEL_URLS.drone);
  const { scene: rotorScene } = useGLTF(MODEL_URLS.droneRotor);
  const clonedBody = useMemo(() => bodyScene.clone(true), [bodyScene]);
  const clonedRotors = useMemo(
    () => DRONE_MOTORS.map(() => rotorScene.clone(true)),
    [rotorScene]
  );

  const droneRig = useRef<THREE.Group>(null);
  const rotorRefs = useRef<(THREE.Group | null)[]>([]);
  const topTetherRefs = useRef<(THREE.Mesh | null)[]>([]);
  const botTetherRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sparkRef = useRef<THREE.Mesh>(null);
  const sparkLight = useRef<THREE.PointLight>(null);
  const lidarRing = useRef<THREE.Mesh>(null);
  const nextSpark = useRef(0);
  const holoOp = useFlickerOpacity(sagging, 0.5);

  const tmpArm = useMemo(() => new THREE.Vector3(), []);
  const tmpAnchor = useMemo(() => new THREE.Vector3(), []);
  const tmpDir = useMemo(() => new THREE.Vector3(), []);
  const tmpMid = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;

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

    const droneScale = 0.82;
    const hoverY = 0.56 + Math.sin(t * 1.65) * 0.028;
    const rollZ = -0.045 + Math.sin(t * 0.85) * 0.032;
    const pitchX = Math.cos(t * 0.62) * 0.025;
    const yawY = -0.18 + Math.sin(t * 0.45) * 0.02;

    if (droneRig.current) {
      droneRig.current.position.set(0, hoverY, 0.04);
      droneRig.current.rotation.set(pitchX, yawY, rollZ);
      droneRig.current.scale.setScalar(droneScale);
      droneRig.current.updateMatrix();

      for (let i = 0; i < 4; i++) {
        const [mx, my, mz] = DRONE_MOTORS[i].pos;
        tmpArm.set(mx * 0.75, my, mz * 0.75).applyMatrix4(droneRig.current.matrix);

        const [cx, cz] = CAGE_CORNERS[i];

        const topMesh = topTetherRefs.current[i];
        if (topMesh) {
          tmpAnchor.set(cx, CAGE_H - 0.02, cz + 0.04);
          tmpDir.subVectors(tmpArm, tmpAnchor);
          const len = tmpDir.length();
          tmpMid.addVectors(tmpAnchor, tmpArm).multiplyScalar(0.5);
          tmpQuat.setFromUnitVectors(UP_VEC, tmpDir.normalize());
          topMesh.position.copy(tmpMid);
          topMesh.quaternion.copy(tmpQuat);
          topMesh.scale.set(1, len, 1);
        }

        const botMesh = botTetherRefs.current[i];
        if (botMesh) {
          tmpAnchor.set(cx * 0.78, 0.03, cz * 0.78 + 0.04);
          tmpDir.subVectors(tmpArm, tmpAnchor);
          const len = tmpDir.length();
          tmpMid.addVectors(tmpAnchor, tmpArm).multiplyScalar(0.5);
          tmpQuat.setFromUnitVectors(UP_VEC, tmpDir.normalize());
          botMesh.position.copy(tmpMid);
          botMesh.quaternion.copy(tmpQuat);
          botMesh.scale.set(1, len, 1);
        }
      }
    }
  });

  return (
    <group>
      {/* 1. Khung lồng thử nghiệm nhôm định hình 2020 bắt chặt trên mặt bàn thao tác */}
      <group position={[0, 0, 0.04]}>
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[0.98, 0.024, 0.62]} />
          <meshStandardMaterial color="#111827" roughness={0.75} metalness={0.2} />
        </mesh>
        {[-0.46, 0.46].map((sx) => (
          <mesh key={`warn-${sx}`} position={[sx, 0.025, 0]}>
            <boxGeometry args={[0.028, 0.004, 0.58]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        ))}

        {CAGE_CORNERS.map(([cx, cz], idx) => (
          <group key={`post-${idx}`} position={[cx, 0, cz]}>
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.075, 0.02, 0.075]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, CAGE_H / 2, 0]}>
              <boxGeometry args={[0.028, CAGE_H, 0.028]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.86} roughness={0.24} />
            </mesh>
            <mesh position={[cx > 0 ? -0.024 : 0.024, CAGE_H - 0.028, 0]}>
              <boxGeometry args={[0.032, 0.032, 0.026]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[cx > 0 ? -0.12 : 0.12, 0.028, cz > 0 ? -0.08 : 0.08]}>
              <torusGeometry args={[0.014, 0.004, 8, 16]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {[-CAGE_Z, CAGE_Z].map((cz) => (
          <mesh key={`top-x-${cz}`} position={[0, CAGE_H, cz]}>
            <boxGeometry args={[CAGE_X * 2 + 0.028, 0.028, 0.028]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.86} roughness={0.24} />
          </mesh>
        ))}
        {[-CAGE_X, CAGE_X].map((cx) => (
          <mesh key={`top-z-${cx}`} position={[cx, CAGE_H, 0]}>
            <boxGeometry args={[0.028, 0.028, CAGE_Z * 2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.86} roughness={0.24} />
          </mesh>
        ))}

        <mesh position={[0, CAGE_H, 0]}>
          <boxGeometry args={[0.032, 0.028, CAGE_Z * 2]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* 2. 8 dây cáp thép chịu lực căng động theo tư thế Drone */}
      {[0, 1, 2, 3].map((i) => (
        <group key={`tethers-${i}`}>
          <mesh
            ref={(el) => {
              topTetherRefs.current[i] = el;
            }}
          >
            <cylinderGeometry args={[0.0032, 0.0032, 1, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
          </mesh>
          <mesh
            ref={(el) => {
              botTetherRefs.current[i] = el;
            }}
          >
            <cylinderGeometry args={[0.0032, 0.0032, 1, 6]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.75} roughness={0.32} />
          </mesh>
        </group>
      ))}

      {/* 3. Quadcopter COSTAR Shafter bay trong lồng test */}
      <group ref={droneRig} position={[0, 0.56, 0.04]} scale={0.82}>
        <primitive object={clonedBody} position={[0, 0, 0]} scale={1} />

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

        <mesh ref={sparkRef} position={[0.532, 0.055, 0.314]} visible={false}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color="#fff7ae" />
        </mesh>
        <pointLight
          ref={sparkLight}
          position={[0.532, 0.09, 0.314]}
          color="#ffd76b"
          intensity={0}
          distance={3.2}
        />
      </group>
    </group>
  );
}

/* ================================================================== */
/* 5. PRJ-IRON-BIPED — UC Berkeley 12-DoF CNC Humanoid + 80/20 Gantry  */
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
    <group rotation={[0, -0.35, 0]} scale={0.78}>
      <mesh ref={ringRef} position={[0, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.01, 8, 64]} />
        <meshBasicMaterial color={HOLO} transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.54, 0.006, 8, 64]} />
        <meshBasicMaterial color={AMBER} transparent opacity={0.32} />
      </mesh>

      <primitive object={cloned} position={[0, 0, 0]} scale={0.96} />

      <group ref={blueprints}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.88, 1.05 + Math.sin(i * 2.3) * 0.25, Math.sin(a) * 0.88]}
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
/* 6. PRJ-AMR-SLAM — 4-Swerve Omnidirectional SLAM Robot (No Dock)    */
/* ================================================================== */

export const amrWorldPos = new THREE.Vector3(0, 0, 3.1);

const AMR_RADIUS = 0.68;
const AMR_WHEEL_RADIUS = 0.1493;
const AMR_CRUISE_SPEED = 1.35;
const CRASH_DUR = 2.8;

const SWERVE_MODULES = [
  { steer: 'Steer_FL', wheel: 'Wheel_FL', rx: 0.4898, rz: 0.4809 },
  { steer: 'Steer_FR', wheel: 'Wheel_FR', rx: -0.4898, rz: 0.4809 },
  { steer: 'Steer_BL', wheel: 'Wheel_BL', rx: 0.4898, rz: -0.4809 },
  { steer: 'Steer_BR', wheel: 'Wheel_BR', rx: -0.4898, rz: -0.4809 },
] as const;

// Quỹ đạo tuần tra khép kín lượn mượt quanh bàn kính J.A.R.V.I.S. trung tâm & các bàn thao tác R&D
const PATROL_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.0, 0, 3.1),
    new THREE.Vector3(3.3, 0, 2.1),
    new THREE.Vector3(3.35, 0, -1.05),
    new THREE.Vector3(1.85, 0, -3.15),
    new THREE.Vector3(0.0, 0, -3.35),
    new THREE.Vector3(-1.85, 0, -3.15),
    new THREE.Vector3(-3.3, 0, -1.0),
    new THREE.Vector3(-3.3, 0, 2.1),
  ],
  true,
  'catmullrom',
  0.5
);
const PATROL_LENGTH = PATROL_CURVE.getLength();

const STATIC_FLOOR_OBSTACLES: { x: number; z: number; r: number }[] = [
  { x: 0.0, z: -0.8, r: 1.66 },   // Bàn kính tròn J.A.R.V.I.S. trung tâm
  { x: 1.18, z: 0.68, r: 0.44 },  // Ghế kỹ sư cạnh bàn J.A.R.V.I.S.
  { x: -5.0, z: -1.4, r: 0.65 },  // Mũi càng thép xe nâng FORK-EYE
  { x: -8.4, z: 1.2, r: 1.45 },   // Bàn máy tính DeveloperStation bên trái
  { x: 8.3, z: 1.2, r: 1.35 },    // Bàn máy in 3D bên phải
];

function wrapPi(a: number): number {
  let x = (a + Math.PI) % (Math.PI * 2);
  if (x < 0) x += Math.PI * 2;
  return x - Math.PI;
}

function resolveFloorCollisions(pos: THREE.Vector3, projects: DustyProject[]) {
  for (let pass = 0; pass < 2; pass++) {
    for (const p of projects) {
      if (p.id === 'amr-slam') continue;
      const stationR = p.id === 'jarvis-core' ? 1.66 : 1.55;
      const minD = stationR + AMR_RADIUS;
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
    pos.x = Math.max(-6.8, Math.min(6.8, pos.x));
    pos.z = Math.max(-7.2, Math.min(6.8, pos.z));
  }
}

const AMR_CRASH_MSGS = [
  'AMR_SLAM: Mất định vị — xoay vòng trầm cảm quanh bàn J.A.R.V.I.S.',
  'AMR_SLAM: Occupancy grid lệch 40cm, phanh gấp xoay Swerve tìm bản đồ',
  'AMR_SLAM: LiDAR trả về 3 bản đồ khác nhau, đang bỏ phiếu tin bản nào',
  'AMR_SLAM: micro-ROS mất gói UART — khóa 4 bánh Swerve xoay compa tại chỗ',
  'AMR_SLAM: Tìm trạm sạc cũ không thấy — tiếp tục lượn vòng vô định',
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
  const prevPos = useRef(new THREE.Vector3(0, 0, 3.1));
  const prevYaw = useRef(Math.PI * 0.5);
  const steerAngles = useRef<number[]>([0, 0, 0, 0]);
  const wheelRolls = useRef<number[]>([0, 0, 0, 0]);

  const crashStart = useRef(-1);
  const nextCrash = useRef(11 + Math.random() * 10);
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
      b.position.set(TMP_PT.x, 0.004, TMP_PT.z);
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

      resolveFloorCollisions(b.position, useLabStore.getState().projects);

      const desiredHeading = Math.atan2(TMP_TAN.x, TMP_TAN.z);
      const yawErr = wrapPi(desiredHeading - b.rotation.y);
      b.rotation.y = wrapPi(b.rotation.y + yawErr * (1 - Math.exp(-safeDt * 6.5)));
    }

    // Động học ngược 4 cụm bánh Swerve chuẩn vật lý (v_i = v_body + ω × r_i)
    const dxW = b.position.x - prevPos.current.x;
    const dzW = b.position.z - prevPos.current.z;
    const dYaw = wrapPi(b.rotation.y - prevYaw.current);

    const vxW = dxW / safeDt;
    const vzW = dzW / safeDt;
    const omegaY = dYaw / safeDt;

    const cosP = Math.cos(b.rotation.y);
    const sinP = Math.sin(b.rotation.y);
    const vxLocal = vxW * cosP - vzW * sinP;
    const vzLocal = vxW * sinP + vzW * cosP;

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      const ux = vxLocal + omegaY * m.rz;
      const uz = vzLocal - omegaY * m.rx;
      const wheelSpeed = Math.hypot(ux, uz);

      if (wheelSpeed > 0.012) {
        let desiredSteer = Math.atan2(ux, uz);
        let driveSign = 1;
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
    b.position.y = 0.004 + Math.abs(Math.sin(t * 90)) * jolt;
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
  );
}

useGLTF.preload(MODEL_URLS.forklift);
useGLTF.preload(MODEL_URLS.drone);
useGLTF.preload(MODEL_URLS.droneRotor);
useGLTF.preload(MODEL_URLS.biped);
useGLTF.preload(MODEL_URLS.amr);
