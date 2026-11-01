import type { IconType } from 'react-icons';
import { AiOutlineHome, AiOutlineRobot } from 'react-icons/ai';
import { GiDeliveryDrone, GiGhost } from 'react-icons/gi';
import { MdDeveloperBoard, MdOutlineHub, MdOutlineVideocam, MdRadar } from 'react-icons/md';
import { useLabStore } from '../store/labStore';

const ICONS: Record<string, IconType> = {
  'fork-eye': MdOutlineVideocam,
  'remote-io': MdDeveloperBoard,
  'jarvis-core': MdOutlineHub,
  'sky-ghost': GiDeliveryDrone,
  'iron-biped': AiOutlineRobot,
  'amr-slam': MdRadar,
};

/** Bottom-center quick nav — jump the camera to a workstation (dock tự sinh theo roster). */
export function NavDock() {
  const projects = useLabStore((s) => s.projects);
  const selectedId = useLabStore((s) => s.selectedId);
  const select = useLabStore((s) => s.select);
  const resetHome = useLabStore((s) => s.resetHome);

  if (projects.length === 0) return null;

  return (
    <nav className="pointer-events-auto fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1.5">
      <button
        onClick={resetHome}
        className={`hud-panel px-3 py-2 font-mono text-[9px] transition-colors ${!selectedId ? 'bg-holo/15 text-holo' : 'text-holo/60 hover:text-holo'}`}
      >
        <AiOutlineHome className="inline-block align-[-2px] text-[12px]" /> TỔNG QUAN
      </button>
      {projects.map((p) => {
        const active = selectedId === p.id;
        const Icon = ICONS[p.id] ?? GiGhost;
        return (
          <button
            key={p.id}
            onClick={() => select(active ? null : p.id)}
            className={`hud-panel px-3 py-2 font-mono text-[9px] transition-colors ${active ? 'bg-holo/15 text-holo' : 'text-holo/60 hover:text-holo'}`}
          >
            <Icon className="inline-block align-[-2px] text-[12px]" /> {p.codeName.replace('PRJ-', '')}
            <span className="ml-1.5 text-[8px]" style={{ color: p.dustLevel > 80 ? '#ff4d5e' : '#ffb02e' }}>
              {Math.round(p.dustLevel)}%bụi
            </span>
          </button>
        );
      })}
    </nav>
  );
}
