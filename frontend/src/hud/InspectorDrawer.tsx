import { useEffect, useState, type FormEvent } from 'react';
import type { IconType } from 'react-icons';
import { AiFillCaretUp, AiOutlineBulb, AiOutlineClose, AiOutlineCode, AiOutlineComment, AiOutlineFire, AiOutlineOrderedList } from 'react-icons/ai';
import { GiDeathSkull } from 'react-icons/gi';
import { MdOutlineAir, MdOutlineBuild, MdOutlineHardware, MdOutlineMemory, MdOutlineWhatshot } from 'react-icons/md';
import { selectProject, useLabStore } from '../store/labStore';
import type { RoadmapItem, RoadmapStatus } from '../types';

type LayerKey = 'hardware' | 'firmware' | 'software';
type MainTab = 'roadmap' | 'roasts' | 'ideas';

const LAYERS: { key: LayerKey; label: string; icon: IconType }[] = [
  { key: 'hardware', label: 'HARDWARE', icon: MdOutlineBuild },
  { key: 'firmware', label: 'FIRMWARE', icon: MdOutlineMemory },
  { key: 'software', label: 'SOFTWARE', icon: AiOutlineCode },
];

const statusStyle: Record<RoadmapStatus, { tag: string; cls: string }> = {
  Xong: { tag: '[XONG]', cls: 'text-emerald-300 border-emerald-400/40' },
  DangNgap: { tag: '[ĐANG NGÁP]', cls: 'amber-text border-amber-glow/40' },
  TrongMo: { tag: '[TRONG MƠ]', cls: 'text-danger border-danger/40' },
};

const numToStatus: RoadmapStatus[] = ['Xong', 'DangNgap', 'TrongMo'];

const ROLE_SUGGESTIONS = ['Người Qua Đường', 'Thánh Xúi Dại', 'Kỹ Sư Bếp Núc', 'Nạn Nhân Tái Phạm', 'Nhà Nghiên Cứu Bụi', 'Chủ Nợ Linh Kiện'];

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

/* ---------------- Tab 1: 3-layer roadmap ---------------- */
function RoadmapTab({ project }: { project: NonNullable<ReturnType<typeof selectProject>> }) {
  const [layer, setLayer] = useState<LayerKey>('hardware');
  return (
    <>
      <div className="mb-2 flex gap-1">
        {LAYERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setLayer(t.key)}
            className={`flex-1 border px-1 py-1.5 font-mono text-[8px] transition-colors ${
              layer === t.key ? 'border-holo bg-holo/15 text-holo' : 'border-holo/20 text-holo/50 hover:border-holo/50'
            }`}
          >
            <t.icon className="mr-0.5 inline-block align-[-2px] text-[10px]" />{t.label}
          </button>
        ))}
      </div>
      <ul className="min-h-[120px]">
        {project.roadmap[layer].map((item, i) => (
          <RoadmapRow key={i} item={item} />
        ))}
      </ul>
    </>
  );
}

/* ---------------- Tab 2: Góc cà khịa ---------------- */
function RoastsTab({ projectId }: { projectId: string }) {
  const roasts = useLabStore((s) => s.roasts[projectId]);
  const loadRoasts = useLabStore((s) => s.loadRoasts);
  const submitRoast = useLabStore((s) => s.submitRoast);
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    void loadRoasts(projectId);
  }, [projectId, loadRoasts]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    void submitRoast(projectId, author.trim(), role.trim(), text.trim());
    setText('');
  };

  return (
    <>
      <form onSubmit={onSubmit} className="mb-3 border border-holo/15 bg-void/60 p-2">
        <div className="mb-1.5 flex gap-1.5">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={40}
            placeholder="Bí danh"
            className="w-1/2 border border-holo/30 bg-void/80 px-1.5 py-1 font-mono text-[9px] text-holo placeholder:text-holo/30 focus:border-holo focus:outline-none"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={40}
            list="roast-roles"
            placeholder="Role tag (vd: Thánh Xúi Dại)"
            className="w-1/2 border border-holo/30 bg-void/80 px-1.5 py-1 font-mono text-[9px] text-holo placeholder:text-holo/30 focus:border-holo focus:outline-none"
          />
          <datalist id="roast-roles">
            {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
          </datalist>
        </div>
        <div className="flex gap-1.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder="Cà khịa dự án này một phát đi…"
            className="flex-1 border border-holo/30 bg-void/80 px-1.5 py-1 font-mono text-[9px] text-holo placeholder:text-holo/30 focus:border-holo focus:outline-none"
          />
          <button type="submit" className="border border-holo/50 px-2 py-1 font-mono text-[9px] font-bold text-holo hover:bg-holo/15">
            GỬI
          </button>
        </div>
      </form>
      <div className="space-y-2">
        {(roasts ?? []).map((r) => (
          <div key={r.id} className="border border-holo/15 bg-void/60 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] font-bold text-holo">{r.author}</span>
              <span className="border border-amber-glow/40 px-1 font-mono text-[7px] text-amber-glow">{r.role}</span>
            </div>
            <p className="font-mono text-[9px] leading-relaxed text-holo/75">"{r.text}"</p>
          </div>
        ))}
        {(roasts ?? []).length === 0 && (
          <div className="font-mono text-[9px] text-holo/40">Chưa có ai cà khịa. Dự án đang được… thương hại.</div>
        )}
      </div>
    </>
  );
}

/* ---------------- Tab 3: Đấu trường xúi dại ---------------- */
function IdeasTab() {
  const ideas = useLabStore((s) => s.badIdeas);
  const upvoteIdea = useLabStore((s) => s.upvoteIdea);
  const setIdeasOpen = useLabStore((s) => s.setIdeasOpen);

  return (
    <>
      <button
        onClick={() => void setIdeasOpen(true)}
        className="mb-3 w-full border border-amber-glow/40 px-2 py-1.5 font-mono text-[9px] font-bold text-amber-glow transition-colors hover:bg-amber-glow/15"
      >
        <AiOutlineBulb className="mr-1 inline-block align-[-2px]" />XÚI DẠI Ý TƯỞNG MỚI →
      </button>
      <div className="space-y-2">
        {[...ideas].sort((a, b) => b.upvotes - a.upvotes).map((i, rank) => (
          <div key={i.id} className="flex items-start gap-2 border border-holo/15 bg-void/60 p-2">
            <button
              onClick={() => upvoteIdea(i.id)}
              className="flex shrink-0 flex-col items-center border border-holo/30 px-1.5 py-1 font-mono text-[9px] text-holo transition-colors hover:border-amber-glow hover:text-amber-glow"
              title="Upvote ý tưởng tồi này"
            >
              <span><AiFillCaretUp /></span>
              <span className="font-bold">{i.upvotes}</span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] leading-relaxed text-holo/85">
                {rank === 0 && i.upvotes > 0 && <span className="mr-1 text-danger"><GiDeathSkull className="inline-block align-[-2px]" /></span>}
                {i.title}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[7px] text-holo/40">
                <span>— {i.submittedBy}</span>
                <span className={i.cursedLevel > 80 ? 'text-danger' : 'text-amber-glow'}>NGUY HIỂM {i.cursedLevel}%</span>
              </div>
            </div>
          </div>
        ))}
        {ideas.length === 0 && (
          <div className="font-mono text-[9px] text-holo/40">Đấu trường trống. Kỹ sư đang an toàn… tạm thời.</div>
        )}
      </div>
    </>
  );
}

/* ---------------- Deep Inspection Drawer ---------------- */
const MAIN_TABS: { key: MainTab; label: string; icon: IconType }[] = [
  { key: 'roadmap', label: 'ROADMAP', icon: AiOutlineOrderedList },
  { key: 'roasts', label: 'CÀ KHỊA', icon: AiOutlineComment },
  { key: 'ideas', label: 'XÚI DẠI', icon: AiOutlineBulb },
];

export function InspectorDrawer() {
  const project = useLabStore(selectProject);
  const select = useLabStore((s) => s.select);
  const incense = useLabStore((s) => s.incense);
  const bonk = useLabStore((s) => s.bonk);
  const cleanDust = useLabStore((s) => s.cleanDust);
  const boom = useLabStore((s) => s.boom);
  const [tab, setTab] = useState<MainTab>('roadmap');

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
            <AiOutlineClose className="inline-block" />
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
          <div className="text-sm text-holo"><AiOutlineFire className="inline-block align-[-2px] text-[12px]" />{project.incenseCount} <MdOutlineHardware className="inline-block align-[-2px] text-[12px]" />{project.bonkCount}</div>
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

        {/* main tabs */}
        <div className="mb-3 flex gap-1 border-b border-holo/15 pb-2">
          {MAIN_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 border px-1 py-1.5 font-mono text-[8px] transition-colors ${
                tab === t.key ? 'border-amber-glow/60 bg-amber-glow/10 text-amber-glow' : 'border-holo/20 text-holo/50 hover:border-holo/50'
              }`}
            >
              <t.icon className="mr-0.5 inline-block align-[-2px] text-[10px]" />{t.label}
            </button>
          ))}
        </div>

        {tab === 'roadmap' && <RoadmapTab project={project} />}
        {tab === 'roasts' && <RoastsTab projectId={project.id} />}
        {tab === 'ideas' && <IdeasTab />}
      </div>

      {/* action buttons — SignalR backed */}
      <div className="mt-auto grid grid-cols-2 gap-1.5 border-t border-holo/20 p-3">
        <button onClick={() => incense(project.id)} className="hud-panel-amber border px-2 py-2 font-mono text-[9px] text-amber-incense transition-colors hover:bg-amber-glow/15">
          <AiOutlineFire className="mr-1 inline-block align-[-2px] text-[11px]" />THẮP HƯƠNG ĐỘ TRÌ
        </button>
        <button onClick={() => bonk(project.id)} className="border border-holo/40 px-2 py-2 font-mono text-[9px] text-holo transition-colors hover:bg-holo/15">
          <MdOutlineHardware className="mr-1 inline-block align-[-2px] text-[11px]" />GÕ ĐẦU GIỤC TIẾN ĐỘ
        </button>
        <button onClick={() => cleanDust(project.id)} className="border border-holo/40 px-2 py-2 font-mono text-[9px] text-holo transition-colors hover:bg-holo/15">
          <MdOutlineAir className="mr-1 inline-block align-[-2px] text-[11px]" />XỊT KHÍ NÉN THỔI BỤI
        </button>
        <button onClick={() => boom(project.id)} className="border border-danger/50 px-2 py-2 font-mono text-[9px] text-danger transition-colors hover:bg-danger/15">
          <MdOutlineWhatshot className="mr-1 inline-block align-[-2px] text-[11px]" />TEST MOSFET (NỔ)
        </button>
      </div>
    </aside>
  );
}
