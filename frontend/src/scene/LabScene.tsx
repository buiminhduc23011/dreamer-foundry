import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useLabStore } from '../store/labStore';
import { AmbientDust } from './particles';
import { Workbench } from './Workbench';
import {
  BipedModel,
  DroneModel,
  ForkliftModel,
  JarvisCoreModel,
  RemoteIoModel,
} from './GhostModels';
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
    labAudio.updateSpatialFrame(camera, posMap, sagging, clock.elapsedTime, dt);
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

/* ---------- đèn rọi trần nhà xưởng rung nhẹ khi sụt áp 5V ---------- */
function FlickerSpot({
  position,
  sagging,
  brownout,
}: {
  position: [number, number, number];
  sagging: boolean;
  brownout: boolean;
}) {
  const light = useRef<THREE.SpotLight>(null);
  const cone = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * 100, []);
  const color = useMemo(() => new THREE.Color('#d4f1ff'), []);
  const amber = useMemo(() => new THREE.Color('#ffb02e'), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const buzz = Math.sin(t * 31) * Math.sin(t * 7.7) > -0.985 ? 1 : 0.65;
    const sag = brownout
      ? 0.35 + Math.random() * 0.4
      : sagging
        ? 0.6 + 0.25 * Math.sin(t * 14 + seed) * Math.sin(t * 4.4 + seed)
        : 1;
    if (light.current) {
      light.current.intensity = 38 * buzz * sag;
      light.current.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
    if (cone.current) {
      const m = cone.current.material as THREE.MeshBasicMaterial;
      m.opacity = (brownout ? 0.075 : 0.038) * buzz * sag;
      m.color.lerpColors(color, amber, brownout ? 0.85 : 0);
    }
  });
  return (
    <group position={position}>
      <spotLight
        ref={light}
        angle={0.58}
        penumbra={0.65}
        distance={22}
        decay={1.3}
        color="#d4f1ff"
        intensity={38}
        target-position={[position[0], 0, position[2]]}
      />
      <mesh ref={cone} position={[0, -2.5, 0]}>
        <coneGeometry args={[1.9, 5, 24, 1, true]} />
        <meshBasicMaterial
          color="#d4f1ff"
          transparent
          opacity={0.038}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[0.72, 0.12, 0.36]} />
        <meshStandardMaterial color="#1a2530" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ---------- kết cấu hầm R&D: sàn bê tông, giàn trần, cáp điện & nội thất chi tiết ---------- */
function Bunker() {
  const debris = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: (Math.random() - 0.5) * 16,
        z: (Math.random() - 0.5) * 10 - 1.5,
        r: Math.random() * Math.PI,
        s: 0.035 + Math.random() * 0.055,
        c: i % 4 === 0 ? '#1e3a5f' : i % 3 === 0 ? '#1f4e38' : '#1e2833',
      })),
    []
  );
  return (
    <group>
      {/* Nền bê tông mài hầm R&D */}
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
      {/* Tường hậu & đường ống kỹ thuật */}
      <mesh position={[0, 4, -9.5]}>
        <planeGeometry args={[44, 9]} />
        <meshStandardMaterial color="#0f1720" roughness={0.88} />
      </mesh>
      {[-7.5, -4, -0.5, 3, 6.5].map((x, i) => (
        <mesh key={i} position={[x, 4.2, -9.3]}>
          <cylinderGeometry args={[0.09, 0.09, 8, 8]} />
          <meshStandardMaterial color="#1a232e" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* Khung dầm thép trần hầm */}
      {[-6, -2, 2, 6].map((x) => (
        <mesh key={x} position={[x, 5.6, -2]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.18, 14, 0.18]} />
          <meshStandardMaterial color="#18222d" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* Dây cáp treo võng trên trần */}
      {[-5.5, -2.2, 1.8, 4.6].map((x, i) => (
        <mesh key={i} position={[x, 5.0, -3.5]} rotation={[0.5, 0, 0]}>
          <torusGeometry args={[0.9 + (i % 3) * 0.25, 0.025, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#16202a" roughness={0.8} />
        </mesh>
      ))}

      {/* ======================================================= */}
      {/* HỆ THỐNG BÀN GHẾ & MÁY MÓC PHÒNG LAB CHI TIẾT CAO       */}
      {/* ======================================================= */}

      {/* 1. Bàn máy tính kỹ sư lập trình nhúng (PC kính RTX, 2 màn hình VS Code + SCADA, ghế lưới) */}
      <DeveloperStation position={[-8.4, 0, 1.2]} rotation={[0, Math.PI * 0.42, 0]} />

      {/* 2. Trạm máy in 3D CoreXY buồng kín đang chạy (Voron/Bambu + DryBox + Gantry chuyển động) */}
      <ThreeDPrinterStation position={[8.3, 0, 1.2]} rotation={[0, -Math.PI * 0.42, 0]} />

      {/* 3. Kệ kho công nghiệp 4 tầng chứa thùng linh kiện & cuộn nhựa in */}
      <StorageRack position={[-9.0, 0, -4.8]} rotation={[0, Math.PI * 0.48, 0]} />
      <StorageRack position={[9.0, 0, -4.8]} rotation={[0, -Math.PI * 0.48, 0]} />

      {/* 4. Tủ Rack Server 42U cửa lưới chạy Local LLM cho J.A.R.V.I.S. & Switch PROFINET */}
      <ServerCabinet position={[6.5, 0, -8.3]} rotation={[0, -0.28, 0]} />

      {/* 5. Bảng trắng kỹ sư vẽ sơ đồ opto Remote I/O, đồ thị PID Drone & kiến trúc J.A.R.V.I.S. */}
      <WhiteboardStand position={[-6.3, 0, -8.3]} rotation={[0, 0.28, 0]} />

      {/* 6. Bình chữa cháy CO2 an toàn phòng thí nghiệm */}
      <FireExtinguisher position={[0, 1.1, -9.4]} />
      <FireExtinguisher position={[-9.3, 1.1, 2.8]} rotation={[0, Math.PI / 2, 0]} />

      {/* 7. Gờ cao su bảo vệ cáp điện chạy ngầm dưới sàn từ tủ Server tới trung tâm J.A.R.V.I.S. & bàn test */}
      <FloorCableRamp from={[5.8, 0, -7.7]} to={[1.2, 0, -1.5]} width={0.16} />
      <FloorCableRamp from={[-7.5, 0, 1.1]} to={[-1.3, 0, -0.7]} width={0.16} />
      <FloorCableRamp from={[-3.0, 0, -4.6]} to={[-0.8, 0, -1.6]} width={0.14} />

      {/* Bo mạch & ốc vít vụn vương trên sàn xưởng */}
      {debris.map((p, i) => (
        <mesh key={i} position={[p.x, 0.015, p.z]} rotation={[0, p.r, 0]}>
          <boxGeometry args={[p.s * 2.1, p.s * 0.5, p.s * 1.4]} />
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

      <ambientLight intensity={0.52} color="#58839e" />
      <hemisphereLight intensity={0.4} color="#72a8c9" groundColor="#16202a" />

      <directionalLight position={[7, 12, 9]} intensity={0.95} color="#def2ff" />
      <directionalLight position={[-8, 9, -5]} intensity={0.55} color="#8ec5e5" />
      <directionalLight position={[0, 8, 12]} intensity={0.35} color="#b3e5fc" />

      {/* Bấm ra khoảng trống để bỏ chọn dự án */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={() => select(null)} visible={false}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial />
      </mesh>

      <Bunker />
      <AmbientDust />

      {projects.map((p) => (
        <FlickerSpot
          key={`spot-${p.id}`}
          position={[p.position[0], 5.4, p.position[2]]}
          sagging={sagging}
          brownout={brownout}
        />
      ))}

      <Suspense fallback={null}>
        {byId('fork-eye') && (
          <Workbench project={byId('fork-eye')!} sagging={sagging}>
            <ForkliftModel sagging={sagging} />
          </Workbench>
        )}
        {byId('remote-io') && (
          <Workbench project={byId('remote-io')!} sagging={sagging}>
            <RemoteIoModel sagging={sagging} />
          </Workbench>
        )}
        {byId('jarvis-core') && (
          <Workbench project={byId('jarvis-core')!} sagging={sagging}>
            <JarvisCoreModel sagging={sagging} brownout={brownout} />
          </Workbench>
        )}
        {byId('sky-ghost') && (
          <Workbench project={byId('sky-ghost')!} sagging={sagging}>
            <DroneModel sagging={sagging} />
          </Workbench>
        )}
        {byId('iron-biped') && (
          <Workbench project={byId('iron-biped')!} sagging={sagging}>
            <BipedModel sagging={sagging} />
          </Workbench>
        )}
      </Suspense>

      <CameraRig />
      <SpatialAudioSync projects={projects} sagging={sagging || brownout} />
    </>
  );
}

export function LabScene() {
  return (
    <Canvas
      camera={{ position: [0, 5.2, 11.2], fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.75]}
      onPointerMissed={() => useLabStore.getState().select(null)}
    >
      <SceneContent />
    </Canvas>
  );
}
