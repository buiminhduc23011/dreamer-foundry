import { MdGamepad, MdRadar, MdSettings } from 'react-icons/md';
import { useLabStore } from '../store/labStore';
import { amrKeysHeld } from '../scene/GhostModels';

function HoldButton({
  label,
  sub,
  onDown,
  onUp,
}: {
  label: string;
  sub: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      className="select-none border border-holo/30 bg-void/70 px-2 py-1.5 font-mono text-[10px] font-bold text-holo transition-colors hover:border-holo active:bg-holo/25"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div>{label}</div>
      <div className="text-[7px] font-normal text-holo/50">{sub}</div>
    </button>
  );
}

/** Nút cài đặt + bàn lái tay cho AMR — hiện khi đang xem AMR hoặc đang ở chế độ manual. */
export function AmrControl() {
  const amrMode = useLabStore((s) => s.amrMode);
  const setAmrMode = useLabStore((s) => s.setAmrMode);
  const selectedId = useLabStore((s) => s.selectedId);
  const select = useLabStore((s) => s.select);
  const hasAmr = useLabStore((s) => s.projects.some((p) => p.id === 'amr-slam'));

  if (!hasAmr) return null;
  const visible = amrMode === 'manual' || selectedId === 'amr-slam';
  if (!visible) {
    // Nút cài đặt mini luôn hiện để phát hiện ra tính năng lái tay.
    return (
      <button
        onClick={() => select('amr-slam')}
        title="Cài đặt lái AMR_SLAM (Auto / Manual)"
        className="hud-panel pointer-events-auto fixed left-3 top-[76px] z-50 flex items-center gap-1.5 px-3 py-2 font-mono text-[9px] text-holo/60 transition-colors hover:border-holo hover:text-holo"
      >
        <MdSettings className="inline-block align-[-2px] text-[12px]" />
        LÁI AMR
      </button>
    );
  }

  const manual = amrMode === 'manual';

  return (
    <div className="hud-panel pointer-events-auto fixed left-3 top-[76px] z-50 w-[248px] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[9px] font-bold tracking-widest text-holo">
          <MdSettings className="mr-1 inline-block align-[-2px]" />
          AMR_SLAM • CÀI ĐẶT LÁI
        </div>
        <button
          onClick={() => select(null)}
          className="font-mono text-[9px] text-holo/40 hover:text-holo"
          title="Ẩn panel"
        >
          ✕
        </button>
      </div>

      {/* Nút cài đặt chuyển mode */}
      <div className="mb-2 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setAmrMode('auto')}
          className={`border px-2 py-1.5 font-mono text-[9px] font-bold transition-colors ${
            !manual
              ? 'border-holo bg-holo/15 text-holo'
              : 'border-holo/25 text-holo/50 hover:border-holo/60 hover:text-holo'
          }`}
          title="Tự chạy vòng patrol + mất định vị ngẫu nhiên"
        >
          <MdRadar className="mr-1 inline-block align-[-2px]" />
          AUTO
        </button>
        <button
          onClick={() => {
            select('amr-slam');
            setAmrMode('manual');
          }}
          className={`border px-2 py-1.5 font-mono text-[9px] font-bold transition-colors ${
            manual
              ? 'border-amber-glow/60 bg-amber-glow/15 text-amber-glow'
              : 'border-holo/25 text-holo/50 hover:border-amber-glow/60 hover:text-amber-glow'
          }`}
          title="Giành quyền lái bằng bàn phím"
        >
          <MdGamepad className="mr-1 inline-block align-[-2px]" />
          MANUAL
        </button>
      </div>

      {manual ? (
        <>
          <div className="mb-2 font-mono text-[8px] leading-relaxed text-holo/60">
            <div><b className="text-holo">W/S</b> tiến / lùi · <b className="text-holo">A/D</b> lách trái / phải</div>
            <div><b className="text-holo">Q/E</b> hoặc <b className="text-holo">←/→</b> xoay · <b className="text-holo">Space</b> phanh</div>
            <div><b className="text-holo">↑/↓</b> tiến / lùi · không gõ khi đang nhập text</div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <HoldButton label="▲" sub="W" onDown={() => (amrKeysHeld.forward = true)} onUp={() => (amrKeysHeld.forward = false)} />
            <div />
            <HoldButton label="◀" sub="A" onDown={() => (amrKeysHeld.strafeLeft = true)} onUp={() => (amrKeysHeld.strafeLeft = false)} />
            <HoldButton label="▼" sub="S" onDown={() => (amrKeysHeld.back = true)} onUp={() => (amrKeysHeld.back = false)} />
            <HoldButton label="▶" sub="D" onDown={() => (amrKeysHeld.strafeRight = true)} onUp={() => (amrKeysHeld.strafeRight = false)} />
            <HoldButton label="⟲" sub="Q" onDown={() => (amrKeysHeld.turnLeft = true)} onUp={() => (amrKeysHeld.turnLeft = false)} />
            <HoldButton label="■" sub="Space" onDown={() => (amrKeysHeld.brake = true)} onUp={() => (amrKeysHeld.brake = false)} />
            <HoldButton label="⟳" sub="E" onDown={() => (amrKeysHeld.turnRight = true)} onUp={() => (amrKeysHeld.turnRight = false)} />
          </div>
        </>
      ) : (
        <div className="font-mono text-[8px] leading-relaxed text-holo/55">
          Đang AUTO patrol quanh bàn J.A.R.V.I.S. Bấm <b className="text-amber-glow">MANUAL</b> để
          giành quyền lái bằng bàn phím.
        </div>
      )}
    </div>
  );
}
