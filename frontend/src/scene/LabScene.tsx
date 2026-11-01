import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';
import { AmbientDust } from './particles';
import { ArcReactor } from './ArcReactor';
import { Workbench } from './Workbench';
import { AgvModel, BipedModel, DroneModel, ForkliftModel, FumeExtractorModel } from './GhostModels';
import { CameraRig } from './CameraRig';

/* ---------- overhead fluorescents that stutter on bad power ---------- */
function FlickerSpot({ position, sagging, brownout }: { position: [number, number, number]; sagging: boolean; brownout: boolean }) {
  const light = useRef<THREE.SpotLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 100, []);
  const color = useMemo(() => new THREE.Color('#bfe9ff'), []);
  const amber = useMemo(() => new THREE.Color('#ffb02e'), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const buzz = Math.sin(t * 31) * Math.sin(t * 7.7) > -0.92 ? 1 : 0.15;
    // Brownout test: toàn lab chuyển amber và giật mạnh hơn sag thường.
    const sag = brownout ? 0.25 + Math.random() * 0.55 : sagging ? 0.3 + Math.random() * 0.4 : 1;
    if (light.current) {
      light.current.intensity = 30 * buzz * sag;
      light.current.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (brownout ? 0.08 : 0.05) * buzz * sag;
      m.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
  });
  return (
    <group position={position}>
      <spotLight ref={light} angle={0.5} penumbra={0.7} distance={18} decay={1.6} color="#bfe9ff" intensity={30} target-position={[position[0], 0, position[2]]} />
      {/* fake volumetric beam */}
      <mesh ref={cone} position={[0, -2.5, 0]}>
        <coneGeometry args={[1.8, 5, 24, 1, true]} />
        <meshBasicMaterial color="#bfe9ff" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.7, 0.12, 0.35]} />
        <meshStandardMaterial color="#141c24" metalness={0.7} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ---------- bunker shell: floor, grid, walls, ceiling clutter ---------- */
function Bunker() {
  const debris = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        x: (Math.random() - 0.5) * 17,
        z: (Math.random() - 0.5) * 11 - 1,
        r: Math.random() * Math.PI,
        s: 0.04 + Math.random() * 0.08,
        c: i % 5 === 0 ? '#1d4a2a' : '#141a21',
      })),
    []
  );
  return (
    <group>
      {/* concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0f16" roughness={0.95} metalness={0.05} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        args={[40, 40]}
        cellSize={0.8}
        cellColor="#0e2830"
        sectionSize={4}
        sectionColor="#1a4a58"
        fadeDistance={26}
        fadeStrength={2}
        infiniteGrid
      />
      {/* back wall + side hints */}
      <mesh position={[0, 4, -9.5]}>
        <planeGeometry args={[40, 9]} />
        <meshStandardMaterial color="#070b12" roughness={0.9} />
      </mesh>
      {/* wall pipes */}
      {[-7.5, -4, -0.5, 3, 6.5].map((x, i) => (
        <mesh key={i} position={[x, 4.2, -9.3]}>
          <cylinderGeometry args={[0.09, 0.09, 8, 8]} />
          <meshStandardMaterial color="#10161e" metalness={0.6} roughness={0.6} />
        </mesh>
      ))}
      {/* ceiling trusses */}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 5.6, -2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.18, 14, 0.18]} />
          <meshStandardMaterial color="#0d141b" metalness={0.6} roughness={0.7} />
        </mesh>
      ))}
      {/* cable droops */}
      {[-5.5, -2.2, 1.8, 4.6].map((x, i) => (
        <mesh key={i} position={[x, 5.0, -3.5]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.9 + (i % 3) * 0.25, 0.025, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#0d141b" roughness={0.9} />
        </mesh>
      ))}
      {/* dead monitor stack on a side desk */}
      <group position={[-8.2, 0, -3]}>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.6, 0.9, 0.7]} /><meshStandardMaterial color="#0e141b" metalness={0.6} roughness={0.7} /></mesh>
        <mesh position={[0, 1.15, 0]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.8, 0.5, 0.06]} /><meshStandardMaterial color="#05080d" /></mesh>
        <mesh position={[0, 1.15, 0.04]} rotation={[0, 0.3, 0]}><planeGeometry args={[0.7, 0.4]} /><meshBasicMaterial color="#0d2a33" /></mesh>
      </group>
      {/* thùng linh kiện lật úp bên phải */}
      <group position={[8.2, 0, -3.4]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[1.1, 0.6, 0.8]} /><meshStandardMaterial color="#1a232c" metalness={0.5} roughness={0.8} /></mesh>
        <mesh position={[0.5, 0.12, 0.6]} rotation={[0.4, 0.5, 0.2]}><boxGeometry args={[0.5, 0.3, 0.4]} /><meshStandardMaterial color="#151d25" metalness={0.5} roughness={0.8} /></mesh>
      </group>
      {/* scattered fallen components */}
      {debris.map((p, i) => (
        <mesh key={i} position={[p.x, 0.03, p.z]} rotation={[0, p.r, 0]}>
          <boxGeometry args={[p.s * 2.5, p.s, p.s * 1.6]} />
          <meshStandardMaterial color={p.c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- scene content ---------- */
function SceneContent() {
  const projects = useLabStore((s) => s.projects);
  const sagging = useLabStore((s) => s.stats?.voltageSagging ?? false);
  const brownout = useLabStore((s) => s.brownoutActive);
  const select = useLabStore((s) => s.select);

  const byId = (id: string) => projects.find((p) => p.id === id);

  return (
    <>
      <fog attach="fog" args={['#050811', 11, 30]} />
      <ambientLight intensity={0.22} color="#28404f" />
      <hemisphereLight intensity={0.22} color="#1a3038" groundColor="#05080d" />

      {/* deselect on empty-space click */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={() => select(null)} visible={false}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial />
      </mesh>

      <Bunker />
      <ArcReactor sagging={sagging} brownout={brownout} />
      <AmbientDust />

      {projects.map((p) => (
        <FlickerSpot key={`spot-${p.id}`} position={[p.position[0], 5.4, p.position[2]]} sagging={sagging} brownout={brownout} />
      ))}

      {byId('fork-eye') && (
        <Workbench project={byId('fork-eye')!} sagging={sagging}>
          <ForkliftModel sagging={sagging} />
        </Workbench>
      )}
      {byId('smoke-trap') && (
        <Workbench project={byId('smoke-trap')!} sagging={sagging}>
          <FumeExtractorModel sagging={sagging} />
        </Workbench>
      )}
      {byId('sky-ghost') && (
        <Workbench project={byId('sky-ghost')!} sagging={sagging}>
          <DroneModel sagging={sagging} />
        </Workbench>
      )}
      {byId('ghost-agv') && (
        <Workbench project={byId('ghost-agv')!} sagging={sagging}>
          <AgvModel sagging={sagging} />
        </Workbench>
      )}
      {byId('iron-biped') && (
        <Workbench project={byId('iron-biped')!} sagging={sagging}>
          <BipedModel sagging={sagging} />
        </Workbench>
      )}

      <CameraRig />
    </>
  );
}

export function LabScene() {
  return (
    <Canvas
      camera={{ position: [0, 5.2, 11.5], fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
      onPointerMissed={() => useLabStore.getState().select(null)}
    >
      <SceneContent />
    </Canvas>
  );
}
