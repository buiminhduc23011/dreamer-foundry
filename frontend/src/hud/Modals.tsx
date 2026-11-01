import { useState, type FormEvent } from 'react';
import { useLabStore } from '../store/labStore';

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/70 backdrop-blur-sm" onClick={onClose}>
      <div className="hud-panel w-[560px] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-holo/20 px-4 py-3">
          <div className="hud-title holo-text text-xs font-bold">{title}</div>
          <button onClick={onClose} className="border border-holo/40 px-2 py-0.5 font-mono text-[10px] text-holo/70 hover:bg-holo/10">
            ✕
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Nghĩa Địa Linh Kiện ---------------- */
export function GraveyardModal() {
  const open = useLabStore((s) => s.graveyardOpen);
  const graveyard = useLabStore((s) => s.graveyard);
  const close = () => void useLabStore.getState().setGraveyardOpen(false);

  if (!open) return null;
  return (
    <ModalShell title="🪦 NGHĨA ĐỊA LINH KIỆN — HALL OF FALLEN SILICON" onClose={close}>
      <p className="mb-4 font-mono text-[9px] italic text-holo/50">
        Những con chip đã hy sinh thân mình thả khói ma thuật để nhân loại được… thất vọng. Xin dành một phút mặc niệm (và một nén hương điện tử).
      </p>
      {graveyard.map((g) => (
        <div key={g.id} className="mb-3 border border-holo/15 bg-void/60 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[11px] font-bold text-holo">{g.component}</span>
            <span className="font-mono text-[8px] text-holo/40">{new Date(g.diedAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="mt-1 font-mono text-[9px] italic text-holo/70">"{g.epitaph}"</div>
          <div className="mt-1 font-mono text-[8px] text-danger/80">⚰ Nguyên nhân: {g.causeOfDeath}</div>
        </div>
      ))}
    </ModalShell>
  );
}

/* ---------------- Xúi Dại Kỹ Sư ---------------- */
export function BadIdeasModal() {
  const open = useLabStore((s) => s.ideasOpen);
  const ideas = useLabStore((s) => s.badIdeas);
  const submit = useLabStore((s) => s.submitBadIdea);
  const upvote = useLabStore((s) => s.upvoteIdea);
  const close = () => void useLabStore.getState().setIdeasOpen(false);
  const [title, setTitle] = useState('');
  const [by, setBy] = useState('');
  const [cursed, setCursed] = useState(70);

  if (!open) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void submit(title.trim(), by.trim(), cursed);
    setTitle('');
  };

  return (
    <ModalShell title="💡 XÚI DẠI KỸ SƯ — SUBMIT A TERRIBLE IDEA" onClose={close}>
      <p className="mb-3 font-mono text-[9px] italic text-holo/50">
        Kỹ sư trưởng của lab này có một điểm yếu chí mạng: không thể cưỡng lại ý tưởng mới. Hãy phân tán sự chú ý của anh ấy thêm nữa.
      </p>
      <form onSubmit={onSubmit} className="mb-4 border border-amber-glow/30 bg-amber-glow/5 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Ý tưởng dự án tồi tệ (vd: drone giao cơm rang bằng rocket)…"
          className="mb-2 w-full border border-holo/30 bg-void/80 px-2 py-1.5 font-mono text-[10px] text-holo placeholder:text-holo/30 focus:border-holo focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            value={by}
            onChange={(e) => setBy(e.target.value)}
            maxLength={40}
            placeholder="Bí danh (tùy chọn)"
            className="flex-1 border border-holo/30 bg-void/80 px-2 py-1.5 font-mono text-[10px] text-holo placeholder:text-holo/30 focus:border-holo focus:outline-none"
          />
          <label className="flex items-center gap-1 font-mono text-[8px] text-amber-glow">
            NGUY HIỂM
            <input type="range" min={0} max={100} value={cursed} onChange={(e) => setCursed(+e.target.value)} className="w-16 accent-amber-glow" />
            {cursed}%
          </label>
          <button type="submit" className="border border-amber-glow/50 px-3 py-1.5 font-mono text-[9px] font-bold text-amber-glow hover:bg-amber-glow/15">
            GỬI →
          </button>
        </div>
      </form>
      {[...ideas].sort((a, b) => b.upvotes - a.upvotes).map((i) => (
        <div key={i.id} className="mb-2 flex items-start gap-2 border border-holo/15 bg-void/60 p-3">
          <button
            onClick={() => upvote(i.id)}
            className="flex shrink-0 flex-col items-center border border-holo/30 px-2 py-1 font-mono text-[9px] text-holo transition-colors hover:border-amber-glow hover:text-amber-glow"
            title="Upvote ý tưởng tồi này"
          >
            <span>▲</span>
            <span className="font-bold">{i.upvotes}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] text-holo">{i.title}</div>
            <div className="mt-1 flex justify-between font-mono text-[8px] text-holo/40">
              <span>— {i.submittedBy}</span>
              <span className={i.cursedLevel > 80 ? 'text-danger' : 'text-amber-glow'}>ĐỘ NGUY HIỂM: {i.cursedLevel}%</span>
            </div>
          </div>
        </div>
      ))}
      {ideas.length === 0 && <div className="font-mono text-[9px] text-holo/40">Chưa có ai xúi dại. Kỹ sư đang an toàn… tạm thời.</div>}
    </ModalShell>
  );
}
