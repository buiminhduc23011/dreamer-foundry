import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { useLabStore } from '../store/labStore';

const HOME_POS: [number, number, number] = [0, 5.2, 11.5];
const HOME_TGT: [number, number, number] = [0, 1.2, -1.5];

/**
 * Camera fly-to: clicking a pedestal dollys in beside it; deselecting
 * returns to the bunker wide shot. Bonk events shake the whole frame.
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null);
  const selectedId = useLabStore((s) => s.selectedId);
  const projects = useLabStore((s) => s.projects);
  const shakeNonce = useLabStore((s) => s.shakeNonce);
  const lastShake = useRef(0);
  const shakeStart = useRef(-1);
  const { camera } = useThree();

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (!selectedId) {
      void c.setLookAt(...HOME_POS, ...HOME_TGT, true);
      return;
    }
    const p = projects.find((x) => x.id === selectedId);
    if (!p) return;
    const [x, y, z] = p.position;
    // approach from the front, slightly above, offset toward the aisle
    const dirX = x * 0.35;
    void c.setLookAt(x + dirX * 0.4, y + 1.7, z + 4.6, x, y + 1.0, z, true);
  }, [selectedId, projects]);

  useFrame(({ clock }) => {
    if (shakeNonce !== lastShake.current) {
      lastShake.current = shakeNonce;
      shakeStart.current = clock.elapsedTime;
    }
    const t = clock.elapsedTime - shakeStart.current;
    if (shakeStart.current >= 0 && t < 0.45) {
      const k = (1 - t / 0.45) * 0.07;
      camera.position.x += Math.sin(clock.elapsedTime * 91) * k;
      camera.position.y += Math.cos(clock.elapsedTime * 83) * k;
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={2.5}
      maxDistance={18}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={0.55}
      draggingSmoothTime={0.12}
    />
  );
}
