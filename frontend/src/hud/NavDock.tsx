import { useLabStore } from '../store/labStore';

const dockItems = [
  { id: 'fork-eye', label: 'FORK-EYE', icon: '🏗️' },
  { id: 'sky-ghost', label: 'SKY-GHOST', icon: '🚁' },
  { id: 'mark-biped', label: 'MARK-0.1', icon: '🦿' },
];

/** Bottom-center quick nav — jump the camera to a pedestal. */
export function NavDock() {
  const projects = useLabStore((s) => s.projects);
  const selectedId = useLabStore((s) => s.selectedId);
  const select = useLabStore((s) => s.select);

  if (projects.length === 0) return null;

  return (
    <nav className="pointer-events-auto fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1.5">
      <button
        onClick={() => select(null)}
        className={`hud-panel px-3 py-2 font-mono text-[9px] transition-colors ${!selectedId ? 'bg-holo/15 text-holo' : 'text-holo/60 hover:text-holo'}`}
      >
        ⌂ TỔNG QUAN
      </button>
      {dockItems.map((d) => {
        const p = projects.find((x) => x.id === d.id);
        if (!p) return null;
        const active = selectedId === d.id;
        return (
          <button
            key={d.id}
            onClick={() => select(active ? null : d.id)}
            className={`hud-panel px-3 py-2 font-mono text-[9px] transition-colors ${active ? 'bg-holo/15 text-holo' : 'text-holo/60 hover:text-holo'}`}
          >
            {d.icon} {d.label}
            <span className="ml-1.5 text-[8px]" style={{ color: p.dustLevel > 80 ? '#ff4d5e' : '#ffb02e' }}>
              {Math.round(p.dustLevel)}%bụi
            </span>
          </button>
        );
      })}
    </nav>
  );
}
