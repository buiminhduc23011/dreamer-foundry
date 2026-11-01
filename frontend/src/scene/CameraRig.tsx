import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';
import { amrWorldPos } from './GhostModels';

const HOME_POS = new THREE.Vector3(0, 5.2, 11.5);
const HOME_TGT = new THREE.Vector3(0, 1.2, -2.6);
const AMR_ID = 'amr-slam';
const TMP = new THREE.Vector3();
const LERP_K = 4.2;

/**
 * Điều khiển Camera tự do bằng chuột/cảm ứng (không tự xoay Cinematic Tour).
 * Khi bấm chọn dự án hoặc nút TỔNG QUAN thì camera lướt mượt tới góc nhìn tương ứng.
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

  // Khi người dùng chủ động kéo/lăn chuột → nhả lái tự động ngay để không giằng chuột
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

      // Đọc vị trí camera hiện tại từ CameraControls để chuyển cảnh mượt từ đúng chỗ đang đứng
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
            const [x, y, z] = p.position;
            goal.current.set(x * 0.55, y + 1.9, z + 4.7);
            goalTgt.current.set(x, y + 1.0, z);
            amrChasing.current = false;
          }
          driving.current = true;
        }
      }
    }

    // Nếu đang chọn AMR và chưa kéo chuột thủ công thì bám theo robot đang chạy
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

    // Rung nhẹ khi gõ đầu / nổ mạch
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
      minDistance={2.0}
      maxDistance={24}
      maxPolarAngle={Math.PI / 2.04}
      smoothTime={0.25}
      draggingSmoothTime={0.1}
    />
  );
}
