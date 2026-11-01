import { AiOutlineFire, AiOutlineWarning } from 'react-icons/ai';
import { MdOutlineHardware, MdOutlineWhatshot } from 'react-icons/md';
import { useLabStore } from '../store/labStore';
import { AudioDeck } from './AudioDeck';

const modeLabel = { connecting: 'ĐANG KẾT NỐI…', live: 'SIGNALR • LIVE', mock: 'MÔ PHỎNG NỘI BỘ' } as const;
const modeDot = { connecting: 'dot-dead', live: 'dot-live', mock: 'dot-mock' } as const;

export function TopBar() {
  const mode = useLabStore((s) => s.mode);
  const stats = useLabStore((s) => s.stats);
  const brownoutActive = useLabStore((s) => s.brownoutActive);
  const sagging = (stats?.voltageSagging ?? false) || brownoutActive;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-stretch gap-2 p-3">
      {/* identity block */}
      <div className="hud-panel pointer-events-auto flex items-center gap-3 px-4 py-2">
        <img src="/dbi-logo.svg" alt="DBI" className="h-8 w-8 rounded-md" />
        <div>
          <div className="hud-title holo-text text-sm font-bold">GHOSTLAB</div>
          <div className="font-mono text-[9px] tracking-[0.3em] text-holo/60">VAPORWARE GRAVEYARD v3.0</div>
        </div>
      </div>

      {/* telemetry strip */}
      <div className={`hud-panel pointer-events-auto flex flex-1 items-center gap-5 overflow-x-auto px-4 py-2 font-mono text-[10px] ${sagging ? 'voltage-sag' : ''}`}>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <i className={`dot ${modeDot[mode]}`} />
          <span className={mode === 'live' ? 'text-emerald-300' : 'text-amber-glow'}>{modeLabel[mode]}</span>
        </span>
        <span className="whitespace-nowrap text-holo/80">
          IC ĐÃ BỐC KHÓI: <b className="text-danger">{stats?.friedIcCount ?? 27}</b>
        </span>
        <span className="whitespace-nowrap text-holo/80">
          BỤI TB PHÒNG LAB: <b className="amber-text">{stats?.averageDust?.toFixed(0) ?? '—'}%</b>
        </span>
        <span className="whitespace-nowrap text-holo/80">
          ÁP LỰC NGƯỜI XEM: <b className="holo-text">{stats?.viewerPressure ?? 0}</b>
        </span>
        <span className="whitespace-nowrap text-holo/80">
          ARC REACTOR:{' '}
          <b className={sagging ? 'text-danger animate-pulse' : 'text-emerald-300'}>
            {brownoutActive ? '3.2' : (stats?.voltage.toFixed(1) ?? '5.0')}V{sagging ? <><AiOutlineWarning className="inline-block align-[-2px]" />SAG</> : ''}
          </b>
        </span>
        <span className="whitespace-nowrap text-holo/50">
          <AiOutlineFire className="inline-block align-[-2px] text-[12px]" /> {stats?.totalIncense ?? 0} · <MdOutlineHardware className="inline-block align-[-2px] text-[12px]" /> {stats?.totalBonks ?? 0} · <MdOutlineWhatshot className="inline-block align-[-2px] text-[12px]" /> {stats?.mosfetExplosions ?? 0}
        </span>
      </div>

      {/* audio controls */}
      <div className="pointer-events-auto flex gap-2">
        <AudioDeck />
      </div>
    </header>
  );
}
