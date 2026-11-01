import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/* Ambient bunker dust — thousands of slow motes                        */
/* ------------------------------------------------------------------ */

export function AmbientDust() {
  return (
    <>
      <Sparkles count={900} scale={[18, 8, 18]} position={[0, 3.5, 0]} size={1.6} speed={0.12} opacity={0.35} color="#9fb8c4" noise={2} />
      <Sparkles count={300} scale={[14, 6, 14]} position={[0, 2.5, 0]} size={3} speed={0.05} opacity={0.15} color="#6b7f8a" noise={3} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* RisingEmitter — looping rising particles (smoke / incense columns)   */
/* ------------------------------------------------------------------ */

interface RisingEmitterProps {
  active: boolean;
  color: string;
  count?: number;
  height?: number;
  radius?: number;
  speed?: number;
  size?: number;
  opacity?: number;
  wobble?: number;
}

export function RisingEmitter({
  active,
  color,
  count = 120,
  height = 2.4,
  radius = 0.35,
  speed = 0.35,
  size = 0.05,
  opacity = 0.7,
  wobble = 0.4,
}: RisingEmitterProps) {
  const ref = useRef<THREE.Points>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        r: Math.random() * radius,
        phase: Math.random(),
        w: 0.5 + Math.random() * 1.5,
      })),
    [count, radius]
  );
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const matRef = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    if (!active || !ref.current) return;
    const t = clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const y = ((s.phase + t * speed * 0.4) % 1) * height;
      const drift = y * wobble * 0.3;
      pos.setXYZ(
        i,
        Math.cos(s.angle + t * s.w) * (s.r + drift * 0.2),
        y,
        Math.sin(s.angle + t * s.w) * (s.r + drift * 0.2)
      );
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={color}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* BurstEmitter — one-shot outward scatter (compressed-air dust blow)   */
/* ------------------------------------------------------------------ */

interface BurstEmitterProps {
  nonce: number;
  color?: string;
  count?: number;
  speed?: number;
  life?: number;
  size?: number;
}

export function BurstEmitter({ nonce, color = '#8fa8b5', count = 220, speed = 2.6, life = 1.5, size = 0.045 }: BurstEmitterProps) {
  const ref = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const startT = useRef(-1);
  const lastNonce = useRef(0);
  const velocities = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5)
          .normalize()
          .multiplyScalar(speed * (0.4 + Math.random() * 0.8));
        return v;
      }),
    [count, speed]
  );
  const positions = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(({ clock }) => {
    if (nonce !== lastNonce.current) {
      lastNonce.current = nonce;
      startT.current = clock.elapsedTime;
      if (ref.current) {
        const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) pos.setXYZ(i, 0, 0, 0);
        pos.needsUpdate = true;
      }
    }
    if (startT.current < 0 || !ref.current || !matRef.current) return;
    const t = clock.elapsedTime - startT.current;
    if (t > life) {
      matRef.current.opacity = 0;
      return;
    }
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const ease = 1 - Math.pow(1 - t / life, 2);
    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      pos.setXYZ(i, v.x * ease, v.y * ease - t * t * 0.4, v.z * ease);
    }
    pos.needsUpdate = true;
    matRef.current.opacity = 0.85 * (1 - t / life);
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        color={color}
        size={size}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Cobweb — procedural spider web for the truly haunted projects        */
/* ------------------------------------------------------------------ */

export function Cobweb({ radius = 0.9, spokes = 7, rings = 4, ...props }: { radius?: number; spokes?: number; rings?: number } & JSX.IntrinsicElements['group']) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < spokes; i++) {
      const a = (i / spokes) * Math.PI * 2;
      pts.push(0, 0, 0, Math.cos(a) * radius, Math.sin(a) * radius, 0);
    }
    for (let r = 1; r <= rings; r++) {
      const rr = (r / rings) * radius;
      for (let i = 0; i < spokes; i++) {
        const a1 = (i / spokes) * Math.PI * 2;
        const a2 = ((i + 1) / spokes) * Math.PI * 2;
        const sag = rr * 0.08;
        pts.push(
          Math.cos(a1) * rr, Math.sin(a1) * rr - sag, 0,
          Math.cos(a2) * rr, Math.sin(a2) * rr - sag, 0
        );
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [radius, spokes, rings]);

  return (
    <group {...props}>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#a8b8c0" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}
