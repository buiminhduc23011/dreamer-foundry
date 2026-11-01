import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';
import { amrWorldPos } from './GhostModels';

const HOME_POS = new THREE.Vector3(0, 5.2, 11.2);
const HOME_TGT = new THREE.Vector3(0, 1.25, -2.2);
const AMR_ID = 'amr-slam';
const TMP = new THREE.Vector3();
const LERP_K = 4.2;

/**
 * Điều khiển Camera tự do bằng chuột/cảm ứng.
 * Khi bấm chọn dự án (bao gồm bám theo AMR Swerve đang lượn vòng) hoặc nút TỔNG QUAN thì camera lướt mượt tới góc nhìn tương ứng.
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null);
  const { camera } = useThree();

  const cur = useRef(HOME_POS.clone());
  const curTgt = useRef(HOME_TGT.clone());
  const goal = useRef(HOME_POS.clone());
  const goalTgt = useRef(HOME_TGT.clone());
  const baseOffset = useRef(new THREE.Vector3(1.3, 2.0, 3.8));
  const driving = useRef(false);
  const amrChasing = useRef(false);
  const initialized = useRef(false);
  const focusKey = useRef('init');
  const lastHomeNonce = useRef(0);
  const lastShake = useRef(0);
  const shakeStart = useRef(-1);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stopAuto = () => {
      driving.current = false;
      amrChasing.current = false;
    };
    c.addEventListener('controlstart', stopAuto);
    return () => {
      c.removeEventListener('controlstart', stopAuto);
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const s = useLabStore.getState();
    const c = controls.current;
    const t = clock.elapsedTime;
    if (!c) return;

    if (!initialized.current) {
      initialized.current = true;
      c.setLookAt(HOME_POS.x, HOME_POS.y, HOME_POS.z, HOME_TGT.x, HOME_TGT.y, HOME_TGT.z, false);
      focusKey.current = s.selectedId ? `sel:${s.selectedId}` : 'none';
      lastHomeNonce.current = s.homeNonce;
    }

    const focus = s.selectedId ? `sel:${s.selectedId}` : 'none';
    const homeReset = s.homeNonce !== lastHomeNonce.current;

    if (focus !== focusKey.current || homeReset) {
      focusKey.current = focus;
      lastHomeNonce.current = s.homeNonce;

      c.getPosition(cur.current);
      c.getTarget(curTgt.current);

      if (focus === 'none') {
        goal.current.copy(HOME_POS);
        goalTgt.current.copy(HOME_TGT);
        amrChasing.current = false;
        driving.current = true;
      } else {
        const id = s.selectedId;
        const p = s.projects.find((x) => x.id === id);
        if (p) {
          if (id === AMR_ID) {
            goalTgt.current.copy(amrWorldPos);
            goalTgt.current.y += 0.45;
            goal.current.copy(goalTgt.current).add(TMP.set(1.3, 2.0, 3.8));
            baseOffset.current.subVectors(goal.current, goalTgt.current);
            amrChasing.current = true;
          } else {
            const [x, , z] = p.position;
            if (id === 'jarvis-core') {
              goalTgt.current.set(x, 1.45, z);
              goal.current.set(x + 0.4, 2.35, z + 3.85);
            } else if (id === 'fork-eye') {
              goalTgt.current.set(x, 0.95, z);
              goal.current.set(x * 0.62, 2.05, z + 4.3);
            } else if (id === 'remote-io') {
              goalTgt.current.set(x, 1.15, z);
              goal.current.set(x + 0.45, 1.85, z + 2.65);
            } else {
              goalTgt.current.set(x, 1.32, z);
              goal.current.set(x * 0.68, 2.15, z + 3.4);
            }
            amrChasing.current = false;
          }
          driving.current = true;
        }
      }
    }

    if (amrChasing.current && s.selectedId === AMR_ID) {
      goalTgt.current.copy(amrWorldPos);
      goalTgt.current.y += 0.45;
      goal.current.copy(goalTgt.current).add(baseOffset.current);
      driving.current = true;
    }

    if (driving.current) {
      const k = 1 - Math.exp(-dt * LERP_K);
      cur.current.lerp(goal.current, k);
      curTgt.current.lerp(goalTgt.current, k);
      c.setLookAt(cur.current.x, cur.current.y, cur.current.z, curTgt.current.x, curTgt.current.y, curTgt.current.z, false);
      if (!amrChasing.current && cur.current.distanceTo(goal.current) < 0.03) {
        driving.current = false;
      }
    }

    if (s.shakeNonce !== lastShake.current) {
      lastShake.current = s.shakeNonce;
      shakeStart.current = t;
    }
    const st = t - shakeStart.current;
    if (shakeStart.current >= 0 && st < 0.45) {
      const k = (1 - st / 0.45) * 0.07;
      camera.position.x += Math.sin(t * 91) * k;
      camera.position.y += Math.cos(t * 83) * k;
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={1.6}
      maxDistance={24}
      maxPolarAngle={Math.PI / 2.04}
      smoothTime={0.25}
      draggingSmoothTime={0.1}
    />
  );
}
