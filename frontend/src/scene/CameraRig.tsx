import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLabStore } from '../store/labStore';
import { REACTOR_FOCUS } from '../types';

const HOME_POS = new THREE.Vector3(0, 5.2, 11.5);
const HOME_TGT = new THREE.Vector3(0, 1.2, -2.6);
const REACTOR_POS = new THREE.Vector3(2.8, 3.1, 4.4);
const REACTOR_TGT = new THREE.Vector3(0, 0.4, -1);

const IDLE_DELAY_S = 6;     // giây im lặng trước khi tour tự chạy
const STOP_DURATION_S = 12; // giây dừng tại mỗi station
const LERP_K = 1.55;        // tốc độ damp của glide cinematic
const ORBIT_SPEED = 0.085;  // rad/s — slow-orbit easing kiểu documentary

/**
 * Cinematic Museum Rig — camera glide bằng Vector3.lerp giữa các station,
 * auto-tour sau 6s idle, slow-orbit quanh từng chi tiết workbench.
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
  const tourIdx = useRef(0);
  const stopStart = useRef(0);
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

    // ---- waypoint list: 5 stations rồi lõi reactor ----
    const waypoints = [...projects.map((p) => p.id), REACTOR_FOCUS];

    // ---- idle 6s → bật cinematic tour ----
    if (!s.tourActive && projects.length > 0 && Date.now() - s.lastActivity > IDLE_DELAY_S * 1000) {
      tourIdx.current = 0;
      stopStart.current = t;
      s.setTour(true, waypoints[0]);
    }

    // ---- tour đổi station mỗi 12s ----
    if (s.tourActive && waypoints.length > 0) {
      if (t - stopStart.current >= STOP_DURATION_S) {
        tourIdx.current = (tourIdx.current + 1) % waypoints.length;
        stopStart.current = t;
        s.setTour(true, waypoints[tourIdx.current]);
      }
    }

    // ---- resolve focus → điểm đến mới khi focus đổi ----
    const focus = s.tourActive
      ? `tour:${s.tourFocusId ?? ''}`
      : s.selectedId
        ? `sel:${s.selectedId}`
        : 'none';
    if (focus !== focusKey.current) {
      const wasTour = focusKey.current.startsWith('tour:');
      focusKey.current = focus;

      const setProjectGoal = (id: string | null, closeUp: boolean) => {
        const p = projects.find((x) => x.id === id);
        if (!p) return false;
        const [x, y, z] = p.position;
        goal.current.set(x * (closeUp ? 0.62 : 0.55), y + (closeUp ? 1.45 : 1.9), z + (closeUp ? 4.0 : 4.7));
        goalTgt.current.set(x, y + (closeUp ? 0.85 : 1.0), z);
        return true;
      };

      if (focus === 'none') {
        // Tour bị cắt giữa chừng → giữ nguyên vị trí; user deselect → glide về wide shot.
        if (wasTour) driving.current = false;
        else {
          goal.current.copy(HOME_POS);
          goalTgt.current.copy(HOME_TGT);
          baseOffset.current.subVectors(goal.current, goalTgt.current);
          driving.current = true;
        }
      } else {
        const id = focus.slice(focus.indexOf(':') + 1);
        const closeUp = focus.startsWith('tour:');
        const ok = id === REACTOR_FOCUS
          ? (goal.current.copy(REACTOR_POS), goalTgt.current.copy(REACTOR_TGT), true)
          : setProjectGoal(id, closeUp);
        if (ok) {
          baseOffset.current.subVectors(goal.current, goalTgt.current);
          driving.current = true;
        } else if (focus.startsWith('tour:')) {
          // Waypoint trỏ id không tồn tại → nhảy sang stop kế.
          tourIdx.current = (tourIdx.current + 1) % Math.max(1, waypoints.length);
          stopStart.current = t;
          s.setTour(true, waypoints[tourIdx.current]);
        }
      }
    }

    // ---- cinematic drive: lerp position + lookAt target ----
    if (driving.current && c) {
      // Tour stop: quỹ đạo đích tự quay chậm → documentary orbit drift.
      if (s.tourActive) {
        const angle = (t - stopStart.current) * ORBIT_SPEED + tourIdx.current * 0.9;
        const rot = new THREE.Vector3().copy(baseOffset.current).applyAxisAngle(UP, angle);
        goal.current.copy(goalTgt.current).add(rot);
      }
      const k = 1 - Math.exp(-dt * LERP_K);
      cur.current.lerp(goal.current, k);
      curTgt.current.lerp(goalTgt.current, k);
      c.setLookAt(cur.current.x, cur.current.y, cur.current.z, curTgt.current.x, curTgt.current.y, curTgt.current.z, false);
      // Glide xong → thả lái cho user (tour thì lái liên tục vì orbit drift).
      if (!s.tourActive && cur.current.distanceTo(goal.current) < 0.04) driving.current = false;
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

const UP = new THREE.Vector3(0, 1, 0);
