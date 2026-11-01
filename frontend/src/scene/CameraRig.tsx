import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';
import { amrWorldPos } from './GhostModels';

const HOME_POS = new THREE.Vector3(0, 5.2, 11.5);
const HOME_TGT = new THREE.Vector3(0, 1.2, -2.6);
const AMR_ID = 'amr-slam'; // con duy nhất không đứng yên — camera phải bám theo
const TMP = new THREE.Vector3();

// Quỹ đạo orbit toàn cảnh của cinematic tour — không zoom vào từng dự án.
const TOUR_CENTER = new THREE.Vector3(0, 1.1, -0.8);
const TOUR_RX = 11.8;
const TOUR_RZ = 10.6;
const TOUR_H = 5.3;

const IDLE_DELAY_S = 6;    // giây im lặng trước khi tour tự chạy
const LERP_K = 1.55;       // tốc độ damp của glide cinematic
const ORBIT_SPEED = 0.075; // rad/s — một vòng ~84s, nhẹ từ từ

/**
 * Cinematic Museum Rig — idle 6s là camera bay orbit êm quanh toàn cảnh lab
 * như flyover documentary; click/select vẫn glide cận cảnh từng workbench.
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null);
  const { camera, gl } = useThree();

  const cur = useRef(HOME_POS.clone());
  const curTgt = useRef(HOME_TGT.clone());
  const goal = useRef(HOME_POS.clone());
  const goalTgt = useRef(HOME_TGT.clone());
  const baseOffset = useRef(new THREE.Vector3());
  const driving = useRef(false);
  const focusKey = useRef('');
  const tourAngle = useRef(0);
  const tourStartT = useRef(0);
  const lastShake = useRef(0);
  const shakeStart = useRef(-1);

  // User input bất kỳ → cắt tour, trả điều khiển về tay.
  useEffect(() => {
    const act = () => useLabStore.getState().recordActivity();
    const el = gl.domElement;
    window.addEventListener('pointerdown', act, { passive: true });
    window.addEventListener('keydown', act, { passive: true });
    el.addEventListener('wheel', act, { passive: true });
    const c = controls.current;
    const onGrab = () => act();
    c?.addEventListener('controlstart', onGrab);
    return () => {
      window.removeEventListener('pointerdown', act);
      window.removeEventListener('keydown', act);
      el.removeEventListener('wheel', act);
      c?.removeEventListener('controlstart', onGrab);
    };
  }, [gl]);

  useFrame(({ clock }, dt) => {
    const s = useLabStore.getState();
    const c = controls.current;
    const t = clock.elapsedTime;
    const projects = s.projects;

    // ---- idle 6s → bật cinematic orbit toàn cảnh ----
    if (!s.tourActive && projects.length > 0 && Date.now() - s.lastActivity > IDLE_DELAY_S * 1000) {
      tourStartT.current = t;
      s.setTour(true, null);
    }

    // ---- resolve focus → điểm đến mới khi focus đổi ----
    const focus = s.tourActive
      ? 'tour'
      : s.selectedId
        ? `sel:${s.selectedId}`
        : 'none';
    if (focus !== focusKey.current) {
      const wasTour = focusKey.current === 'tour';
      focusKey.current = focus;

      const setProjectGoal = (id: string | null) => {
        const p = projects.find((x) => x.id === id);
        if (!p) return false;
        // AMR đang lang thang — chốt offset đuổi theo thay vì bám tọa độ tĩnh.
        if (id === AMR_ID) {
          goalTgt.current.copy(amrWorldPos);
          goalTgt.current.y += 0.45;
          goal.current.copy(goalTgt.current).add(TMP.set(1.3, 2.0, 3.8));
          return true;
        }
        const [x, y, z] = p.position;
        goal.current.set(x * 0.55, y + 1.9, z + 4.7);
        goalTgt.current.set(x, y + 1.0, z);
        return true;
      };

      if (focus === 'tour') {
        // Chốt góc orbit theo vị trí camera hiện tại → vào quỹ đạo liền mạch.
        tourAngle.current = Math.atan2(
          (cur.current.x - TOUR_CENTER.x) / TOUR_RX,
          (cur.current.z - TOUR_CENTER.z) / TOUR_RZ,
        );
        tourStartT.current = t;
        goalTgt.current.copy(TOUR_CENTER);
        driving.current = true;
      } else if (focus === 'none') {
        // Tour bị cắt giữa chừng → giữ nguyên vị trí; user deselect → glide về wide shot.
        if (wasTour) driving.current = false;
        else {
          goal.current.copy(HOME_POS);
          goalTgt.current.copy(HOME_TGT);
          driving.current = true;
        }
      } else {
        const id = focus.slice(focus.indexOf(':') + 1);
        if (setProjectGoal(id)) {
          baseOffset.current.subVectors(goal.current, goalTgt.current);
          driving.current = true;
        }
      }
    }

    // ---- AMR tracking: target bám theo vị trí sống của con robot lang thang ----
    const amrFocused = !s.tourActive && s.selectedId === AMR_ID;
    if (amrFocused) {
      goalTgt.current.copy(amrWorldPos);
      goalTgt.current.y += 0.45;
      if (!s.tourActive) goal.current.copy(goalTgt.current).add(baseOffset.current);
      driving.current = true;
    }

    // ---- cinematic drive: lerp position + lookAt target ----
    if (driving.current && c) {
      // Tour: quỹ đạo ellipse quanh tâm lab — flyover chậm, không stop, không zoom.
      if (s.tourActive) {
        const a = tourAngle.current + (t - tourStartT.current) * ORBIT_SPEED;
        goal.current.set(
          TOUR_CENTER.x + Math.sin(a) * TOUR_RX,
          TOUR_H + Math.sin(t * 0.16) * 0.4,
          TOUR_CENTER.z + Math.cos(a) * TOUR_RZ,
        );
        goalTgt.current.copy(TOUR_CENTER);
        goalTgt.current.y += Math.sin(t * 0.35) * 0.15;
      }
      const k = 1 - Math.exp(-dt * LERP_K);
      cur.current.lerp(goal.current, k);
      curTgt.current.lerp(goalTgt.current, k);
      c.setLookAt(cur.current.x, cur.current.y, cur.current.z, curTgt.current.x, curTgt.current.y, curTgt.current.z, false);
      // Glide xong → thả lái cho user (tour thì lái liên tục vì orbit drift).
      if (!s.tourActive && !amrFocused && cur.current.distanceTo(goal.current) < 0.04) driving.current = false;
    }

    // ---- bonk shake ----
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
      minDistance={2.2}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.05}
      smoothTime={0.5}
      draggingSmoothTime={0.12}
    />
  );
}
