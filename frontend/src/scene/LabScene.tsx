import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLabStore } from '../store/labStore';
import { AmbientDust } from './particles';
import { ArcReactor } from './ArcReactor';
import { Workbench } from './Workbench';
import { AgvModel, AmrRover, amrWorldPos, BipedModel, DroneModel, ForkliftModel, FumeExtractorModel } from './GhostModels';
import {
  DeveloperStation,
  FireExtinguisher,
  FloorCableRamp,
  ServerCabinet,
  StorageRack,
  ThreeDPrinterStation,
  WhiteboardStand,
} from './LabFurniture';
import { labAudio } from '../audio/labAudio';
import type { DustyProject } from '../types';
import { CameraRig } from './CameraRig';

function SpatialAudioSync({ projects, sagging }: { projects: DustyProject[]; sagging: boolean }) {
  const posMap = useMemo(() => {
    const m: Record<string, [number, number, number]> = {};
    for (const p of projects) m[p.id] = p.position as [number, number, number];
    return m;
  }, [projects]);

  useFrame(({ camera, clock }, dt) => {
    labAudio.updateSpatialFrame(camera, posMap, amrWorldPos, sagging, clock.elapsedTime, dt);
  });
  return null;
}

/* ---------- procedural offline Studio IBL cho vật liệu kim loại PBR ---------- */
function StudioIBL() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const envScene = new RoomEnvironment();
    const rt = pmrem.fromScene(envScene, 0.04);
    scene.environment = rt.texture;
    if ('environmentIntensity' in scene) {
      (scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.48;
    }
    envScene.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ---------- overhead fluorescents that stutter on bad power ---------- */
function FlickerSpot({ position, sagging, brownout }: { position: [number, number, number]; sagging: boolean; brownout: boolean }) {
  const light = useRef<THREE.SpotLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 100, []);
  const color = useMemo(() => new THREE.Color('#d4f1ff'), []);
  const amber = useMemo(() => new THREE.Color('#ffb02e'), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const buzz = Math.sin(t * 31) * Math.sin(t * 7.7) > -0.985 ? 1 : 0.65;
    // Brownout test: toàn lab chuyển amber và giật mạnh hơn sag thường.
    const sag = brownout ? 0.35 + Math.random() * 0.4 : sagging ? 0.6 + 0.25 * Math.sin(t * 14 + seed) * Math.sin(t * 4.4 + seed) : 1;
    if (light.current) {
      light.current.intensity = 38 * buzz * sag;
      light.current.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (brownout ? 0.08 : 0.045) * buzz * sag;
      m.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
  });
  return (
    <group position={position}>
      <spotLight ref={light} angle={0.58} penumbra={0.65} distance={22} decay={1.3} color="#d4f1ff" intensity={38} target-position={[position[0], 0, position[2]]} />
      {/* fake volumetric beam */}
      <mesh ref={cone} position={[0, -2.5, 0]}>
        <coneGeometry args={[1.9, 5, 24, 1, true]} />
        <meshBasicMaterial color="#d4f1ff" transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.7, 0.12, 0.35]} />
        <meshStandardMaterial color="#1a2530" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------- bunker shell: floor, grid, walls, ceiling clutter & lab gear ---------- */
function Bunker() {
  const debris = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (Math.random() - 0.5) * 16,
        z: (Math.random() - 0.5) * 10 - 1,
        r: Math.random() * Math.PI,
        s: 0.04 + Math.random() * 0.07,
        c: i % 4 === 0 ? '#1e3a5f' : i % 3 === 0 ? '#1f4e38' : '#1e2833',
      })),
    []
  );
  return (
    <group>
      {/* concrete floor — nền bê tông hầm R&D xưởng thực tế */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#121a24" roughness={0.85} metalness={0.15} />
      </mesh>
      <Grid
        position={[0, 0.005, 0]}
        args={[44, 44]}
        cellSize={0.8}
        cellColor="#173e4b"
        sectionSize={4}
        sectionColor="#266d82"
        fadeDistance={32}
        fadeStrength={1.5}
        infiniteGrid
      />
      {/* back wall + side hints */}
      <mesh position={[0, 4, -9.5]}>
        <planeGeometry args={[44, 9]} />
        <meshStandardMaterial color="#0f1720" roughness={0.88} />
      </mesh>
      {/* wall pipes */}
      {[-7.5, -4, -0.5, 3, 6.5].map((x, i) => (
        <mesh key={i} position={[x, 4.2, -9.3]}>
          <cylinderGeometry args={[0.09, 0.09, 8, 8]} />
          <meshStandardMaterial color="#1a232e" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* ceiling trusses */}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 5.6, -2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.18, 14, 0.18]} />
          <meshStandardMaterial color="#18222d" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* cable droops */}
      {[-5.5, -2.2, 1.8, 4.6].map((x, i) => (
        <mesh key={i} position={[x, 5.0, -3.5]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.9 + (i % 3) * 0.25, 0.025, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#16202a" roughness={0.8} />
        </mesh>
      ))}

      {/* ======================================================= */}
      {/* TRANG BỊ & NỘI THẤT PHÒNG LAB THỰC TẾ                  */}
      {/* ======================================================= */}

      {/* 1. Bàn máy tính kỹ sư lập trình (Developer Station) bên trái */}
      <DeveloperStation position={[-8.2, 0, -1.5]} rotation={[0, Math.PI * 0.45, 0]} />

      {/* 2. Trạm máy in 3D FDM đang chạy bên phải */}
      <ThreeDPrinterStation position={[8.0, 0, -1.8]} rotation={[0, -Math.PI * 0.42, 0]} />

      {/* 3. Kệ sắt công nghiệp chứa linh kiện & cuộn filament (2 bên tường) */}
      <StorageRack position={[-8.8, 0, -5.8]} rotation={[0, Math.PI * 0.5, 0]} />
      <StorageRack position={[8.8, 0, -5.8]} rotation={[0, -Math.PI * 0.5, 0]} />

      {/* 4. Tủ Rack Server & Mạng 19-inch 42U ở góc sau bên phải */}
      <ServerCabinet position={[6.6, 0, -8.6]} rotation={[0, -0.3, 0]} />

      {/* 5. Bảng trắng kỹ sư di động ở góc sau bên trái */}
      <WhiteboardStand position={[-6.2, 0, -8.5]} rotation={[0, 0.28, 0]} />

      {/* 6. Bình chữa cháy treo tường & an toàn phòng lab */}
      <FireExtinguisher position={[0, 1.1, -9.4]} />
      <FireExtinguisher position={[-9.2, 1.1, 1.5]} rotation={[0, Math.PI / 2, 0]} />

      {/* 7. Gờ bọc cáp điện cao su vát sàn kết nối các khu vực */}
      <FloorCableRamp from={[-7.2, 0, -1.5]} to={[-4.8, 0, -1.8]} width={0.16} />
      <FloorCableRamp from={[5.8, 0, -8.0]} to={[3.8, 0, -6.8]} width={0.16} />

      {/* Linh kiện rơi vãi trên sàn lab */}
      {debris.map((p, i) => (
        <mesh key={i} position={[p.x, 0.02, p.z]} rotation={[0, p.r, 0]}>
          <boxGeometry args={[p.s * 2.2, p.s * 0.7, p.s * 1.5]} />
          <meshStandardMaterial color={p.c} roughness={0.7} />
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
      <StudioIBL />
      <fog attach="fog" args={['#0e1622', 22, 60]} />
      
      {/* Ambient & Hemisphere Lighting — ánh sáng xưởng cân bằng, giữ độ tương phản */}
      <ambientLight intensity={0.52} color="#58839e" />
      <hemisphereLight intensity={0.4} color="#72a8c9" groundColor="#16202a" />

      {/* Main Studio Key & Fill Lights — chiếu sáng rõ khối chi tiết mà không bị lóa trắng */}
      <directionalLight position={[7, 12, 9]} intensity={0.95} color="#def2ff" />
      <directionalLight position={[-8, 9, -5]} intensity={0.55} color="#8ec5e5" />
      <directionalLight position={[0, 8, 12]} intensity={0.35} color="#b3e5fc" />

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

      <Suspense fallback={null}>
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
        {byId('amr-slam') && <AmrRover project={byId('amr-slam')!} sagging={sagging} />}
      </Suspense>

      <CameraRig />
      <SpatialAudioSync projects={projects} sagging={sagging || brownout} />
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
