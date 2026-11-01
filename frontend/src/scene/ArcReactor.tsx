import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Central floor arc reactor — dims and gutters when the 5V rail sags. */
export function ArcReactor({ sagging }: { sagging: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flicker = sagging
      ? 0.25 + Math.random() * 0.35
      : 0.9 + 0.1 * Math.sin(t * 3.7) + 0.05 * Math.sin(t * 11.3);
    if (ring1.current) ring1.current.rotation.z = t * 0.6;
    if (ring2.current) ring2.current.rotation.z = -t * 0.35;
    if (light.current) light.current.intensity = 14 * flicker;
    if (coreMat.current) coreMat.current.color.setScalar(0).setRGB(0.18 * flicker, 0.9 * flicker, 1 * flicker);
    if (core.current) {
      const s = 1 + Math.sin(t * 4) * 0.03;
      core.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[0, 0.02, -1]}>
      {/* recessed floor socket */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.06, 48]} />
        <meshStandardMaterial color="#0a121a" metalness={0.8} roughness={0.5} />
      </mesh>
      {/* glowing core disc */}
      <mesh ref={core} position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.05, 48]} />
        <meshBasicMaterial ref={coreMat} color="#2ee6ff" />
      </mesh>
      {/* containment rings */}
      <mesh ref={ring1} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.03, 8, 48]} />
        <meshBasicMaterial color="#1899b3" transparent opacity={0.8} />
      </mesh>
      <mesh ref={ring2} position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.02, 8, 48]} />
        <meshBasicMaterial color="#ffb02e" transparent opacity={0.5} />
      </mesh>
      {/* triangular struts */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.4, 0.04, Math.sin(a) * 1.4]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.5, 0.04, 0.18]} />
            <meshStandardMaterial color="#1a242e" metalness={0.8} roughness={0.4} />
          </mesh>
        );
      })}
      <pointLight ref={light} position={[0, 0.8, 0]} color="#2ee6ff" intensity={14} distance={14} decay={1.8} />
    </group>
  );
}
