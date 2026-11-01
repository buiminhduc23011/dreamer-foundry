import { useCallback, useEffect, useRef, useState } from 'react';
import { AiOutlineClose, AiOutlineReload, AiOutlineSave } from 'react-icons/ai';
import { MdOutlineAdminPanelSettings, MdOutlineAir, MdOutlineWhatshot } from 'react-icons/md';
import { useLabStore } from '../store/labStore';
import type { AdminStatus, GeminiStatus } from '../types';

const SECRET_PATH = '/ghost-admin-secret-key-99';
const SESSION_KEY = 'ghost-admin-key';

const STATUS_LABEL: Record<GeminiStatus, { text: string; cls: string }> = {
  online: { text: 'ONLINE — Đang hút máu CPU', cls: 'text-green-400' },
  invalid: { text: 'INVALID — Chưa nạp tiền / Sai key', cls: 'text-red-400' },
  no_key: { text: 'NO KEY — Chưa cấu hình', cls: 'text-amber-400' },
  unreachable: { text: 'UNREACHABLE — Google cũng đang đắp chiếu', cls: 'text-amber-400' },
  locked: { text: 'LOCKED — Chưa mở khoá', cls: 'text-cyan-200/50' },
};

/** Trang admin bí mật — mở bằng URL huyền thoại hoặc Ctrl+Shift+G ×3. */
export function SecretAdmin() {
  const client = useLabStore((s) => s.client);
  const recordActivity = useLabStore((s) => s.recordActivity);
  const [open, setOpen] = useState(() => window.location.pathname === SECRET_PATH);
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(SESSION_KEY) ?? '');
  const [authed, setAuthed] = useState(false);
  const [needsInit, setNeedsInit] = useState<boolean | null>(null);
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-2.0-flash');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [log, setLog] = useState<string[]>(['GHOSTLAB CENTRAL COMMAND khởi động — phiên bí mật, không lưu dấu.']);
  const press = useRef({ n: 0, at: 0 });

  const addLog = useCallback((line: string) => setLog((l) => [...l.slice(-6), `> ${line}`]), []);

  // Ctrl+Shift+G ×3 trong 1.5s → mở/đóng cửa hầm bí mật.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) { close(); return; }
      if (!(e.ctrlKey && e.shiftKey && e.code === 'KeyG')) return;
      const now = Date.now();
      press.current = now - press.current.at < 1500 ? { n: press.current.n + 1, at: now } : { n: 1, at: now };
      if (press.current.n >= 3) { press.current.n = 0; setOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const close = useCallback(() => {
    setOpen(false);
    if (window.location.pathname === SECRET_PATH) window.history.replaceState(null, '', '/');
  }, []);

  // Probe status khi mở — thử luôn adminKey lưu trong session.
  useEffect(() => {
    if (!open || !client) return;
    setNeedsInit(null);
    client.getAdminStatus(adminKey || null)
      .then((s) => {
        setNeedsInit(!s.adminSet);
        if (s.adminSet && s.geminiStatus !== 'locked') {
          setAuthed(true); setStatus(s); setModelInput(s.model);
          addLog('Mã chỉ huy hợp lệ — chào mừng quay lại, Kẻ Mộng Mơ.');
        }
      })
      .catch(() => { setNeedsInit(false); setAuthed(false); });
  }, [open, client]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async (key: string) => {
    if (!client) return;
    const s = await client.getAdminStatus(key);
    setStatus(s);
    setModelInput(s.model);
  }, [client]);

  const unlock = async () => {
    if (!client || !keyInput.trim()) return;
    recordActivity();
    try {
      const s = await client.getAdminStatus(keyInput.trim());
      setAuthed(true); setStatus(s); setModelInput(s.model);
      setAdminKey(keyInput.trim());
      sessionStorage.setItem(SESSION_KEY, keyInput.trim());
      setKeyInput('');
      addLog('MỞ KHÓA THÀNH CÔNG — quyền lực tuyệt đối trong tầm tay.');
    } catch {
      addLog('SAI MÃ CHỈ HUY — vụ truy cập này đã bị ghi vào sổ tội lỗi.');
    }
  };

  const init = async () => {
    if (!client || keyInput.trim().length < 4) { addLog('Mã chỉ huy tối thiểu 4 ký tự.'); return; }
    recordActivity();
    const ok = await client.initAdmin(keyInput.trim());
    if (!ok) { addLog('KHỞI TẠO THẤT BẠI — ai đó đã chiếm quyền chỉ huy rồi.'); return; }
    setAdminKey(keyInput.trim());
    sessionStorage.setItem(SESSION_KEY, keyInput.trim());
    setKeyInput('');
    setNeedsInit(false);
    setAuthed(true);
    addLog('MÃ CHỈ HUY ĐÃ NIÊM PHONG — giữ kỹ, quên là tự đào mồ.');
    await refresh(keyInput.trim());
  };

  const saveKey = async () => {
    if (!client) return;
    recordActivity();
    try {
      const s = await client.saveGeminiKey(adminKey, apiKeyInput.trim(), modelInput.trim());
      setStatus(s); setApiKeyInput('');
      addLog(s.keyConfigured ? `KEY ĐÃ LƯU — kiểm tra kết nối: ${s.geminiStatus.toUpperCase()}.` : 'ĐÃ XOÁ KEY — trợ lý quay về trạng thái chết não.');
    } catch {
      addLog('LƯU THẤT BẠI — backend nói không (hoặc mã chỉ huy hết hạn).');
    }
  };

  const hazard = async (fn: () => Promise<void>, label: string) => {
    recordActivity();
    await fn();
    addLog(label);
  };

  if (!open) return null;
  const st = status ? STATUS_LABEL[status.geminiStatus] : STATUS_LABEL.locked;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020408]/85 backdrop-blur-sm" onClick={close}>
      <div
        className="chat-panel hud-panel hud-panel-amber flex max-h-[92vh] w-[560px] max-w-[94vw] flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-amber-400/25 px-4 py-2.5">
          <span className="dot dot-mock chat-led" />
          <div className="hud-title text-[12px] text-[#ffb02e]"><MdOutlineAdminPanelSettings className="mr-1.5 inline-block align-[-2px] text-[15px]" />GHOSTLAB CENTRAL COMMAND // CONFIG SECRETS</div>
          <button onClick={close} className="ml-auto border border-amber-400/40 px-2 py-0.5 text-[11px] text-amber-200/80 hover:bg-amber-400/15"><AiOutlineClose className="inline-block" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-[11px]">
          {!client && <div className="amber-text">Backend chưa kết nối — central command chạy trên niềm tin.</div>}

          {/* unlock / bootstrap */}
          {!authed && needsInit === null && <div className="text-cyan-200/60">Đang dò quyền truy cập<span className="serial-cursor">▌</span></div>}
          {!authed && needsInit === false && (
            <div className="space-y-2">
              <div className="text-cyan-200/70">NHẬP MÃ CHỈ HUY để mở khoá cấu hình:</div>
              <div className="flex gap-2">
                <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void unlock()}
                  placeholder="command key…" autoFocus
                  className="min-w-0 flex-1 border border-amber-400/40 bg-black/50 px-2 py-1.5 text-amber-100 outline-none placeholder:text-amber-200/30" />
                <button onClick={() => void unlock()} className="border border-amber-400/50 bg-amber-400/10 px-3 text-amber-100 hover:bg-amber-400/25">MỞ KHÓA</button>
              </div>
            </div>
          )}
          {!authed && needsInit === true && (
            <div className="space-y-2">
              <div className="amber-text">CHƯA CÓ MÃ CHỈ HUY — khởi tạo lần đầu (4-64 ký tự, nhớ kỹ không ai cứu được):</div>
              <div className="flex gap-2">
                <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void init()}
                  placeholder="tạo command key…" autoFocus
                  className="min-w-0 flex-1 border border-amber-400/40 bg-black/50 px-2 py-1.5 text-amber-100 outline-none placeholder:text-amber-200/30" />
                <button onClick={() => void init()} className="border border-amber-400/50 bg-amber-400/10 px-3 text-amber-100 hover:bg-amber-400/25">KHỞI TẠO</button>
              </div>
            </div>
          )}

          {/* authed panel */}
          {authed && (
            <>
              <div className="border border-cyan-400/20 bg-black/30 px-3 py-2">
                <div className="text-cyan-200/50">GEMINI NEURAL CORE — <span className="text-cyan-100/80">{status?.model}</span></div>
                <div className={`mt-0.5 text-[12px] font-bold ${st.cls}`}>● {st.text}</div>
              </div>

              <div className="space-y-1.5">
                <div className="text-cyan-200/70">MODEL ID:</div>
                <input value={modelInput} onChange={(e) => setModelInput(e.target.value)}
                  className="w-full border border-cyan-400/25 bg-black/40 px-2 py-1.5 text-cyan-100 outline-none focus:border-cyan-300/60" />
                <div className="text-cyan-200/70">GEMINI API KEY <span className="text-cyan-200/40">(để trống + lưu = xoá key):</span></div>
                <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIza…" autoComplete="off"
                  className="w-full border border-cyan-400/25 bg-black/40 px-2 py-1.5 text-cyan-100 outline-none placeholder:text-cyan-200/25 focus:border-cyan-300/60" />
                <div className="flex gap-2">
                  <button onClick={() => void saveKey()} className="border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-400/25"><AiOutlineSave className="mr-1 inline-block align-[-2px]" />LƯU KEY</button>
                  <button onClick={() => void refresh(adminKey).then(() => addLog('Đã kiểm tra lại kết nối.'))} className="border border-cyan-400/30 px-3 py-1.5 text-cyan-200/70 hover:bg-cyan-400/10"><AiOutlineReload className="mr-1 inline-block align-[-2px]" />KIỂM TRA</button>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-amber-400/20 pt-2.5">
                <div className="text-amber-200/70">LAB HAZARD CONTROLS — quyền hạn tuyệt đối, trách nhiệm thì không:</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void hazard(() => client!.cleanAll(), 'ĐÃ XỊT KHÍ NÉN — toàn bộ bụi về 0%.')}
                    className="border border-cyan-400/50 bg-cyan-400/10 px-3 py-1.5 text-cyan-100 hover:bg-cyan-400/25">
                    <MdOutlineAir className="mr-1 inline-block align-[-2px]" />RESET TOÀN BỘ ĐỘ BỤI VỀ 0%
                  </button>
                  <button onClick={() => void hazard(() => client!.boomAll(), 'HOẢ HOẠN ĐÃ KÍCH HOẠT — toàn bộ IC bùm. Rất vui.')}
                    className="border border-red-400/60 bg-red-500/10 px-3 py-1.5 text-red-200 hover:bg-red-500/25">
                    <MdOutlineWhatshot className="mr-1 inline-block align-[-2px]" />KÍCH HOẢ HOẠN GIẢ LẬP (BÙM TOÀN BỘ IC)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* command log */}
          <div className="space-y-0.5 border-t border-cyan-400/15 pt-2 font-mono text-[10px] text-cyan-200/50">
            {log.map((l, i) => <div key={i} className="log-line">{l}</div>)}
          </div>
        </div>

        <div className="border-t border-amber-400/15 px-4 py-1.5 text-[9px] tracking-widest text-amber-200/30">
          TRUY CẬP TRÁI PHÉP SẼ BỊ GHI VÀO SỔ TỘI LỖI CÙNG 47 LẦN RESET WATCHDOG • CTRL+SHIFT+G ×3 ĐỂ ẨN
        </div>
      </div>
    </div>
  );
}
