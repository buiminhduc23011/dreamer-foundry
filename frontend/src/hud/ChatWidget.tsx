import { useEffect, useRef, useState } from 'react';
import { AiOutlineCheck, AiOutlineMinus, AiOutlineReload, AiOutlineRobot, AiOutlineSend, AiOutlineSetting } from 'react-icons/ai';
import { MdOutlineSupportAgent } from 'react-icons/md';
import { useLabStore } from '../store/labStore';
import type { ChatTurn, GeminiStatus } from '../types';

const CHIPS = [
  'Bao giờ con Robot đi được?',
  'Tại sao mạch của tôi hay nổ?',
  'Kẻ Mộng Mơ đang trốn ở đâu?',
  'Còn mấy con IC sống sót?',
];

const GREETING =
  'TRỢ LÝ TRỰC BAN đã trực tuyến. Tôi là linh hồn con chip bị sét đánh, giờ canh cái hầm này.';

const MODELS = [
  { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Khuyên dùng)' },
  { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash' },
  { id: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
  { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
];

const STATUS_DESC: Record<GeminiStatus, { label: string; cls: string }> = {
  online: { label: 'ONLINE — Sẵn sàng phục vụ', cls: 'text-emerald-300' },
  invalid: { label: 'INVALID — Sai key hoặc hết quota', cls: 'text-red-400' },
  no_key: { label: 'CHƯA CÀI KEY — Chế độ offline dự phòng', cls: 'text-amber-400' },
  unreachable: { label: 'UNREACHABLE — Không kết nối được Google', cls: 'text-amber-400' },
  locked: { label: 'LOCKED — Đang khóa', cls: 'text-cyan-200/50' },
};

interface Typing {
  text: string;
  shown: number;
}

/** Widget chat nổi góc phải dưới — trợ lý ảo đắp chiếu trực ban hầm ngầm. */
export function ChatWidget() {
  const client = useLabStore((s) => s.client);
  const mode = useLabStore((s) => s.mode);
  const recordActivity = useLabStore((s) => s.recordActivity);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const greeted = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Key config state
  const [showConfig, setShowConfig] = useState(false);
  const [chatConfig, setChatConfig] = useState<{ hasKey: boolean; model: string; status: GeminiStatus } | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-2.0-flash');
  const [savingKey, setSavingKey] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Fetch chat config khi mở
  const loadConfig = async () => {
    if (!client) return;
    try {
      const cfg = await client.getChatConfig();
      setChatConfig(cfg);
      if (cfg.model) setModelInput(cfg.model);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) {
      void loadConfig();
      if (!greeted.current) {
        greeted.current = true;
        setTyping({ text: GREETING, shown: 0 });
      }
    }
  }, [open, client]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typewriter — AI gõ từng ký tự cho đúng chất máy ma.
  useEffect(() => {
    if (!typing) return;
    if (typing.shown >= typing.text.length) {
      setMsgs((m) => [...m, { role: 'model', text: typing.text }]);
      setTyping(null);
      return;
    }
    const t = setTimeout(
      () => setTyping((ty) => (ty ? { ...ty, shown: Math.min(ty.text.length, ty.shown + 2) } : ty)),
      16,
    );
    return () => clearTimeout(t);
  }, [typing]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing, busy, open]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || busy) return;
    recordActivity();
    const history = msgs.slice(-10);
    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    const r = client
      ? await client.chat(text, history)
      : { reply: 'Client chưa kết nối — giống mọi dự án trong xưởng.', offline: true };
    setBusy(false);
    setTyping({ text: r.reply, shown: 0 });
  };

  const handleSaveKey = async () => {
    if (!client) return;
    setSavingKey(true);
    setSaveMsg('');
    try {
      const res = await client.saveChatConfig(keyInput.trim(), modelInput.trim());
      setChatConfig(res);
      setKeyInput('');
      setSaveMsg(res.status === 'online' ? '✅ Đã lưu vĩnh viễn! AI đã Online.' : `Đã lưu key. Trạng thái: ${res.status}`);
      setTimeout(() => setSaveMsg(''), 4000);
    } catch {
      setSaveMsg('❌ Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSavingKey(false);
    }
  };

  const dot = mode === 'live' ? 'dot-live' : mode === 'mock' ? 'dot-mock' : 'dot-dead';

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); recordActivity(); }}
        title="Trợ Lý Ảo Đắp Chiếu"
        className="chat-fab fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full hud-panel text-xl"
      >
        <span className={`chat-led absolute right-1 top-1 dot ${dot}`} />
        <MdOutlineSupportAgent className="text-[26px] text-[#2ee6ff]" />
      </button>
    );
  }

  const currentStatus = chatConfig ? STATUS_DESC[chatConfig.status] ?? STATUS_DESC.no_key : STATUS_DESC.no_key;

  return (
    <div className="chat-panel hud-panel fixed bottom-5 right-5 z-50 flex h-[520px] w-[390px] max-w-[94vw] flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-cyan-400/20 px-3 py-2">
        <span className={`chat-led dot ${dot}`} />
        <div className="min-w-0">
          <div className="hud-title truncate text-[11px] text-[#2ee6ff]">TRỢ LÝ TRỰC BAN HẦM NGẦM</div>
          <div className="text-[9px] tracking-widest text-cyan-200/40">GHOSTLAB AI // ĐẮP CHIẾU EDITION</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setShowConfig((c) => !c)}
            title="Cài đặt Gemini API Key (dùng chung cho mọi người)"
            className={`border px-2 py-0.5 text-[11px] transition-colors ${
              showConfig
                ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                : 'border-cyan-400/30 text-cyan-200/70 hover:bg-cyan-400/10'
            }`}
          >
            <AiOutlineSetting className="inline-block" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="border border-cyan-400/30 px-2 py-0.5 text-[11px] text-cyan-200/70 hover:bg-cyan-400/10"
          >
            <AiOutlineMinus className="inline-block" />
          </button>
        </div>
      </div>

      {/* config popover / panel */}
      {showConfig && (
        <div className="border-b border-amber-400/30 bg-[#06101c]/95 p-3 text-[11px] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300">CẤU HÌNH GEMINI API KEY</span>
            <span className={`text-[10px] font-mono ${currentStatus.cls}`}>● {currentStatus.label}</span>
          </div>
          <div className="text-[10px] text-cyan-200/60 leading-relaxed">
            Key được lưu trên server (vĩnh viễn). Chỉ cần cài một lần, bất kỳ ai vào web cũng có thể hỏi trực tiếp AI.
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-cyan-200/80">GEMINI API KEY:</div>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={chatConfig?.hasKey ? '•••••••••••••••••••• (Đã có key, nhập mới để đổi)' : 'Dán key AIzaSy... vào đây'}
              className="w-full border border-cyan-400/30 bg-black/50 px-2 py-1 text-cyan-100 outline-none placeholder:text-cyan-200/30 focus:border-cyan-300/60"
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-cyan-200/80">MODEL:</div>
            <select
              value={modelInput}
              onChange={(e) => setModelInput(e.target.value)}
              className="w-full border border-cyan-400/30 bg-[#081424] px-2 py-1 text-cyan-100 outline-none focus:border-cyan-300/60"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => void handleSaveKey()}
              disabled={savingKey || (!keyInput.trim() && !chatConfig?.hasKey)}
              className="border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-[11px] text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
            >
              {savingKey ? 'ĐANG LƯU...' : 'LƯU VĨNH VIỄN'}
            </button>
            <button
              onClick={() => void loadConfig()}
              className="border border-cyan-400/30 px-2 py-1 text-[11px] text-cyan-200/70 hover:bg-cyan-400/10"
              title="Kiểm tra lại kết nối"
            >
              <AiOutlineReload className="inline-block" />
            </button>
            {saveMsg && <span className="text-[10px] font-mono text-amber-300">{saveMsg}</span>}
          </div>
        </div>
      )}

      {/* notice when no key */}
      {!showConfig && chatConfig && !chatConfig.hasKey && (
        <div className="flex items-center justify-between border-b border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-[10px] text-amber-200">
          <span>Chưa cài Gemini Key (đang dùng câu đùa offline)</span>
          <button
            onClick={() => setShowConfig(true)}
            className="underline font-bold text-amber-300 hover:text-white"
          >
            Cài ngay
          </button>
        </div>
      )}

      {/* messages */}
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="log-line ml-8 border border-cyan-400/25 bg-cyan-400/10 px-2 py-1.5 text-[11px] leading-snug text-cyan-100">
              <span className="mr-1 text-cyan-300/60">›</span>{m.text}
            </div>
          ) : (
            <div key={i} className="log-line mr-6 border border-purple-300/20 bg-purple-400/10 px-2 py-1.5 text-[11px] leading-snug text-purple-100/90">
              <div className="mb-0.5 text-[8px] tracking-[0.2em] text-purple-300/50"><AiOutlineRobot className="mr-1 inline-block align-[-2px] text-[10px]" />TRỢ LÝ</div>
              {m.text}
            </div>
          ),
        )}
        {typing && (
          <div className="log-line mr-6 border border-purple-300/20 bg-purple-400/10 px-2 py-1.5 text-[11px] leading-snug text-purple-100/90">
            <div className="mb-0.5 text-[8px] tracking-[0.2em] text-purple-300/50"><AiOutlineRobot className="mr-1 inline-block align-[-2px] text-[10px]" />TRỢ LÝ đang gõ</div>
            {typing.text.slice(0, typing.shown)}
            <span className="serial-cursor text-cyan-300">▌</span>
          </div>
        )}
        {busy && (
          <div className="mr-6 px-1 text-[10px] text-cyan-200/50">
            <span className="typing-dot">●</span><span className="typing-dot" style={{ animationDelay: '0.18s' }}>●</span><span className="typing-dot" style={{ animationDelay: '0.36s' }}>●</span>
            <span className="ml-1">đang kêu gọi linh hồn con chip…</span>
          </div>
        )}
      </div>

      {/* quick chips */}
      <div className="flex gap-1.5 overflow-x-auto border-t border-cyan-400/15 px-2 py-1.5">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => void send(c)}
            disabled={busy}
            className="whitespace-nowrap border border-cyan-400/30 px-2 py-1 text-[9.5px] text-cyan-200/70 hover:bg-cyan-400/15 hover:text-cyan-100 disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      {/* input */}
      <form
        onSubmit={(e) => { e.preventDefault(); void send(); }}
        className="flex items-center gap-1.5 border-t border-cyan-400/20 px-2 py-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi trợ lý đắp chiếu…"
          maxLength={500}
          className="min-w-0 flex-1 border border-cyan-400/25 bg-black/40 px-2 py-1.5 text-[11px] text-cyan-100 outline-none placeholder:text-cyan-200/30 focus:border-cyan-300/60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="border border-cyan-400/40 bg-cyan-400/10 px-2.5 py-1.5 text-[11px] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-40"
        >
          <AiOutlineSend className="inline-block" />
        </button>
      </form>
    </div>
  );
}
