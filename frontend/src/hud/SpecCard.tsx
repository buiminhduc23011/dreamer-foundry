import { useEffect, useState } from 'react';
import { AiOutlineVideoCamera } from 'react-icons/ai';
import { selectTourProject, useLabStore } from '../store/labStore';
import { REACTOR_FOCUS } from '../types';

interface LiveStats {
  vbus: string;
  mcu: string;
  pwm: string;
}

/** Telemetry dao động kiểu "đang đo thật" — nhiễu quanh giá trị nền của từng project. */
function useLiveTelemetry(seed: string) {
  const [stats, setStats] = useState<LiveStats>({ vbus: '5.00', mcu: '42.0', pwm: '38' });
  useEffect(() => {
    const base = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const tick = () => {
      setStats({
        vbus: (4.6 + Math.random() * 0.6).toFixed(2),
        mcu: (38 + (base % 17) + Math.random() * 9).toFixed(1),
        pwm: String(24 + ((base + Math.floor(Math.random() * 40)) % 62)),
      });
    };
    tick();
    const t = window.setInterval(tick, 700);
    return () => window.clearInterval(t);
  }, [seed]);
  return stats;
}

function StatRow({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-holo/10 py-1">
      <span className="font-mono text-[9px] text-holo/50">{label}</span>
      <span className={`font-mono text-[11px] font-bold ${warn ? 'text-danger' : 'text-holo'}`}>
        {value} <span className="text-[8px] font-normal text-holo/40">{unit}</span>
      </span>
    </div>
  );
}

/** Holographic Spec Card — trượt vào từ mép phải khi cinematic tour ghé station. */
export function SpecCard() {
  const tourActive = useLabStore((s) => s.tourActive);
  const focusId = useLabStore((s) => s.tourFocusId);
  const project = useLabStore(selectTourProject);
  const stats = useLiveTelemetry(focusId ?? 'none');

  if (!tourActive || !focusId) return null;
  const isReactor = focusId === REACTOR_FOCUS;
  if (!isReactor && !project) return null;

  return (
    <aside key={focusId} className="spec-card hud-panel pointer-events-none fixed right-3 top-1/2 z-40 w-[320px] -translate-y-1/2">
      <div className="border-b border-holo/20 px-4 py-2.5">
        <div className="font-mono text-[8px] tracking-[0.3em] text-holo/50">
          {isReactor ? 'CORE SCAN // TRUNG TÂM' : 'STATION SCAN // CINEMATIC TOUR'}
        </div>
        <div className="hud-title holo-text mt-0.5 text-xs font-bold">
          {isReactor ? 'ARC REACTOR MK-DUST' : project!.codeName}
        </div>
        <div className="font-mono text-[9px] text-holo/60">
          {isReactor ? 'Lõi năng lượng trung tâm hầm' : project!.name}
        </div>
      </div>

      <div className="px-4 py-2">
        {isReactor ? (
          <>
            <StatRow label="V_BUS RAIL" value={stats.vbus} unit="V" />
            <StatRow label="CORE TEMP" value={stats.mcu} unit="°C" />
            <StatRow label="CONTAINMENT" value={stats.pwm} unit="%" />
            <StatRow label="TRẠNG THÁI" value="UNSTABLE" unit="" warn />
            <p className="mt-2 font-mono text-[9px] italic leading-relaxed text-amber-glow/90">
              "Lõi reactor chạy bằng niềm tin và một cái aptomat từ năm 2019. Đừng chạm."
            </p>
          </>
        ) : (
          <>
            <StatRow label="V_BUS" value={stats.vbus} unit="V" />
            <StatRow label="MCU TEMP" value={stats.mcu} unit="°C" warn={+stats.mcu > 80} />
            <StatRow label="PWM DUTY" value={stats.pwm} unit="%" />
            <StatRow label="DUST LEVEL" value={project!.dustLevel.toFixed(1)} unit="%" warn={project!.dustLevel > 80} />
            <div className="mt-2 border-l-2 border-amber-glow/50 pl-2">
              <div className="font-mono text-[8px] tracking-[0.25em] text-amber-glow/70">LÝ DO BIỆN MINH HIỆN TẠI</div>
              <p className="mt-1 font-mono text-[9px] italic leading-relaxed text-holo/75">
                "{project!.tagline}"
              </p>
            </div>
            <div className="mt-2 font-mono text-[8px] text-holo/40">
              {project!.ghostStatus} · {project!.timeParadox}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/** Badge nhấp nháy báo cinematic tour đang chạy. */
export function TourBadge() {
  const tourActive = useLabStore((s) => s.tourActive);
  if (!tourActive) return null;
  return (
    <div className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2">
      <div className="tour-badge hud-panel hud-panel-amber px-3 py-1.5 font-mono text-[10px] font-bold text-amber-glow">
        <AiOutlineVideoCamera className="mr-1 inline-block align-[-2px] text-[13px]" />[CINEMATIC LAB TOUR: ACTIVE]
      </div>
    </div>
  );
}
