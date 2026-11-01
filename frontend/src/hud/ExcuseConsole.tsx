import { useEffect, useRef } from 'react';
import { useLabStore } from '../store/labStore';

const evtIcon: Record<string, string> = {
  incense: '🕯️',
  bonk: '🔨',
  'clean-dust': '💨',
  'clean-all': '💨',
  boom: '💥',
  power: '⚡',
  'bad-idea': '💡',
  roast: '💬',
  system: '◈',
};

export function ExcuseConsole() {
  const excuseLog = useLabStore((s) => s.excuseLog);
  const feed = useLabStore((s) => s.feed);
  const requestExcuse = useLabStore((s) => s.requestExcuse);
  const excuseBusy = useLabStore((s) => s.excuseBusy);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [feed.length, excuseLog.length]);

  return (
    <aside className="hud-panel pointer-events-auto fixed bottom-[216px] left-3 z-40 flex w-[430px] max-w-[46vw] flex-col">
      <div className="flex items-center justify-between border-b border-holo/20 px-3 py-2">
        <div>
          <div className="hud-title holo-text text-[10px] font-bold">GHOSTLAB TELEMETRY</div>
          <div className="font-mono text-[8px] tracking-[0.2em] text-holo/50">AI LOG // BÁO CÁO LÝ DO TRỄ TIẾN ĐỘ</div>
        </div>
        <button
          onClick={() => void requestExcuse()}
          disabled={excuseBusy}
          className="border border-holo/40 px-2 py-1 font-mono text-[9px] text-holo transition-colors hover:bg-holo/10 disabled:opacity-40"
        >
          {excuseBusy ? 'ĐANG BỊA…' : '+ XIN LÝ DO'}
        </button>
      </div>

      <div ref={scrollRef} className="max-h-40 overflow-y-auto px-3 py-2">
        {/* latest excuse, highlighted */}
        {excuseLog.slice(0, 2).map((e, i) => (
          <div key={e.at.getTime() + i} className={`log-line mb-2 font-mono text-[10px] leading-relaxed ${i === 0 ? 'amber-text' : 'text-holo/70'}`}>
            <span className="text-holo/40">[{e.at.toLocaleTimeString('vi-VN')}]</span> {e.text}
          </div>
        ))}

        <div className="my-2 border-t border-holo/10" />
        <div className="mb-1 font-mono text-[8px] tracking-[0.25em] text-holo/40">— LIVE EVENT FEED —</div>

        {feed.slice(0, 14).map((e, i) => (
          <div key={`${e.at}-${i}`} className="log-line mb-1.5 font-mono text-[9px] leading-relaxed text-holo/60">
            <span className="mr-1">{evtIcon[e.type] ?? '◈'}</span>
            {e.message}
          </div>
        ))}
      </div>
    </aside>
  );
}
