import { useState } from 'react';
import { selectProject, useLabStore } from '../store/labStore';
import type { RoadmapItem, RoadmapStatus } from '../types';

type TabKey = 'hardware' | 'firmware' | 'software';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'hardware', label: '🔧 HARDWARE' },
  { key: 'firmware', label: '💾 FIRMWARE' },
  { key: 'software', label: '🖥️ SOFTWARE' },
];

const statusStyle: Record<RoadmapStatus, { tag: string; cls: string }> = {
  Xong: { tag: '[XONG]', cls: 'text-emerald-300 border-emerald-400/40' },
  DangNgap: { tag: '[ĐANG NGÁP]', cls: 'amber-text border-amber-glow/40' },
  TrongMo: { tag: '[TRONG MƠ]', cls: 'text-danger border-danger/40' },
};

const numToStatus: RoadmapStatus[] = ['Xong', 'DangNgap', 'TrongMo'];

function RoadmapRow({ item }: { item: RoadmapItem }) {
  // SignalR may deliver numeric enums if protocol options ever regress — normalize defensively.
  const raw = item.status as unknown as number | RoadmapStatus;
  const status = typeof raw === 'number' ? numToStatus[raw] : raw;
  const st = statusStyle[status] ?? statusStyle.DangNgap;
  return (
    <li className="mb-2 flex gap-2">
      <span className={`shrink-0 border px-1 font-mono text-[8px] leading-4 ${st.cls}`}>{st.tag}</span>
      <span className="font-mono text-[10px] leading-relaxed text-holo/80">{item.description}</span>
    </li>
  );
}

export function InspectorDrawer() {
  const project = useLabStore(selectProject);
  const select = useLabStore((s) => s.select);
  const incense = useLabStore((s) => s.incense);
  const bonk = useLabStore((s) => s.bonk);
  const cleanDust = useLabStore((s) => s.cleanDust);
  const boom = useLabStore((s) => s.boom);
  const [tab, setTab] = useState<TabKey>('hardware');

  if (!project) return null;

  return (
    <aside className="hud-panel animate-holo-flicker pointer-events-auto fixed bottom-3 right-3 top-20 z-40 flex w-[400px] max-w-[46vw] flex-col">
      {/* header */}
      <div className="border-b border-holo/20 px-4 py-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="hud-title holo-text text-xs font-bold">{project.codeName}</div>
            <div className="font-mono text-[10px] text-holo/70">{project.name}</div>
          </div>
          <button onClick={() => select(null)} className="border border-holo/40 px-2 py-0.5 font-mono text-[10px] text-holo/70 hover:bg-holo/10">
            ✕
          </button>
        </div>
        <p className="mt-2 font-mono text-[9px] italic leading-relaxed text-holo/60">"{project.tagline}"</p>
      </div>

      {/* vitals */}
      <div className="grid grid-cols-3 gap-px border-b border-holo/20 bg-holo/10 font-mono text-[9px]">
        <div className="bg-void/80 p-2 text-center">
          <div className="text-holo/50">HOÀN THÀNH</div>
          <div className="holo-text text-sm font-bold">{project.completionPercent}%</div>
        </div>
        <div className="bg-void/80 p-2 text-center">
          <div className="text-holo/50">PHỦ BỤI</div>
          <div className={`text-sm font-bold ${project.dustLevel > 80 ? 'text-danger' : 'amber-text'}`}>{Math.round(project.dustLevel)}%</div>
        </div>
        <div className="bg-void/80 p-2 text-center">
          <div className="text-holo/50">CỘNG ĐỒNG</div>
          <div className="text-sm text-holo">🕯{project.incenseCount} 🔨{project.bonkCount}</div>
        </div>
      </div>

      <div className="overflow-y-auto px-4 py-3">
        <div className="mb-2 font-mono text-[9px]">
          <span className="text-holo/50">TRẠNG THÁI MA: </span>
          <span className="amber-text">{project.ghostStatus}</span>
        </div>
        <div className="mb-2 font-mono text-[9px]">
          <span className="text-holo/50">BIÊN BẢN HƯ HỎNG: </span>
          <span className="text-holo/80">{project.damageReport}</span>
        </div>
        <div className="mb-3 font-mono text-[9px]">
          <span className="text-holo/50">NGHỊCH LÝ THỜI GIAN: </span>
          <span className="text-danger/90">{project.timeParadox}</span>
        </div>

        {/* roadmap tabs */}
        <div className="mb-2 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 border px-1 py-1.5 font-mono text-[8px] transition-colors ${
                tab === t.key ? 'border-holo bg-holo/15 text-holo' : 'border-holo/20 text-holo/50 hover:border-holo/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ul className="min-h-[120px]">
          {project.roadmap[tab].map((item, i) => (
            <RoadmapRow key={i} item={item} />
          ))}
        </ul>
      </div>

      {/* action buttons */}
      <div className="mt-auto grid grid-cols-2 gap-1.5 border-t border-holo/20 p-3">
        <button onClick={() => cleanDust(project.id)} className="border border-holo/40 px-2 py-2 font-mono text-[9px] text-holo transition-colors hover:bg-holo/15">
          💨 XỊT KHÍ NÉN THỔI BỤI
        </button>
        <button onClick={() => incense(project.id)} className="hud-panel-amber border px-2 py-2 font-mono text-[9px] text-amber-incense transition-colors hover:bg-amber-glow/15">
          🕯️ THẮP HƯƠNG ĐỘ TRÌ
        </button>
        <button onClick={() => bonk(project.id)} className="border border-holo/40 px-2 py-2 font-mono text-[9px] text-holo transition-colors hover:bg-holo/15">
          🔨 GÕ MỎ HÀN GIỤC TIẾN ĐỘ
        </button>
        <button onClick={() => boom(project.id)} className="border border-danger/50 px-2 py-2 font-mono text-[9px] text-danger transition-colors hover:bg-danger/15">
          💥 TEST MOSFET (NỔ)
        </button>
      </div>
    </aside>
  );
}
