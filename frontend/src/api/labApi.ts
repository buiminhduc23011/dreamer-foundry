import * as signalR from '@microsoft/signalr';
import type {
  AdminStatus,
  BadIdea,
  ChatReply,
  ChatTurn,
  ConnectionMode,
  DustyProject,
  GraveyardEntry,
  LabEvent,
  LabStats,
  RoastComment,
} from '../types';
import { mockBadIdeas, mockExcuses, mockGraveyard, mockProjects, mockRoasts, mockStats } from './mockData';

// Dev: talk to the .NET backend on :5000. Prod: same origin (backend serves the SPA).
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');
const CONNECT_TIMEOUT_MS = 3000;

export interface LabHandlers {
  onProjects: (projects: DustyProject[]) => void;
  onStats: (stats: LabStats) => void;
  onEvent: (evt: LabEvent) => void;
  onMode: (mode: ConnectionMode) => void;
  onBadIdeas: (ideas: BadIdea[]) => void;
  onRoast: (roast: RoastComment) => void;
}

export interface LabClient {
  readonly mode: ConnectionMode;
  incense(id: string): Promise<void>;
  bonk(id: string): Promise<void>;
  cleanDust(id: string): Promise<void>;
  boom(id: string): Promise<void>;
  cleanAll(): Promise<void>;
  brownout(): Promise<void>;
  randomExcuse(): Promise<string>;
  getGraveyard(): Promise<GraveyardEntry[]>;
  getBadIdeas(): Promise<BadIdea[]>;
  postBadIdea(title: string, submittedBy: string, cursedLevel: number): Promise<BadIdea | null>;
  upvoteIdea(id: string): Promise<void>;
  getRoasts(projectId: string): Promise<RoastComment[]>;
  postRoast(projectId: string, author: string, role: string, text: string): Promise<RoastComment | null>;
  chat(message: string, history: ChatTurn[]): Promise<ChatReply>;
  getAdminStatus(adminKey: string | null): Promise<AdminStatus>;
  initAdmin(adminKey: string): Promise<boolean>;
  saveGeminiKey(adminKey: string, apiKey: string, model: string): Promise<AdminStatus>;
  boomAll(): Promise<void>;
  dispose(): void;
}

/* ------------------------------------------------------------------ */
/* LIVE client — .NET 8 backend + SignalR                              */
/* ------------------------------------------------------------------ */

async function createLiveClient(handlers: LabHandlers): Promise<LabClient> {
  const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    return (await res.json()) as T;
  };

  // Probe the API first — throws if the backend is asleep.
  const [projects, stats] = await Promise.all([
    fetchJson<DustyProject[]>('/api/projects'),
    fetchJson<LabStats & { averageDust?: number }>('/api/stats'),
  ]);

  const hub = new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/lab`)
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  hub.on('projectUpdated', (p: DustyProject[]) => handlers.onProjects(p));
  hub.on('statsUpdated', (s: LabStats) => handlers.onStats(s));
  hub.on('labEvent', (e: LabEvent) => handlers.onEvent(e));
  hub.on('roastAdded', (r: RoastComment) => handlers.onRoast(r));
  hub.on('badIdeasUpdated', (list: BadIdea[]) => handlers.onBadIdeas(list));
  hub.onclose(() => handlers.onMode('mock')); // hub died → drift into mock physics

  await hub.start();

  handlers.onProjects(projects);
  handlers.onStats(stats);
  handlers.onMode('live');

  const post = async (path: string) => {
    try {
      await fetchJson(path, { method: 'POST' });
    } catch {
      handlers.onEvent({
        type: 'system',
        message: 'GHOSTLAB TELEMETRY: API không phản hồi — hành động đã bị bụi nuốt.',
        at: new Date().toISOString(),
      });
    }
  };

  return {
    mode: 'live',
    incense: (id) => post(`/api/projects/${id}/incense`),
    bonk: (id) => post(`/api/projects/${id}/bonk`),
    cleanDust: (id) => post(`/api/projects/${id}/clean-dust`),
    boom: (id) => post(`/api/projects/${id}/boom`),
    cleanAll: () => post('/api/clean-all'),
    brownout: () => post('/api/hazard/brownout'),
    randomExcuse: async () => {
      try {
        const r = await fetchJson<{ excuse: string }>('/api/excuses/random');
        return r.excuse;
      } catch {
        return mockExcuses[Math.floor(Math.random() * mockExcuses.length)];
      }
    },
    getGraveyard: () => fetchJson<GraveyardEntry[]>('/api/graveyard').catch(() => mockGraveyard),
    getBadIdeas: () => fetchJson<BadIdea[]>('/api/bad-ideas').catch(() => []),
    postBadIdea: async (title, submittedBy, cursedLevel) => {
      try {
        return await fetchJson<BadIdea>('/api/bad-ideas', {
          method: 'POST',
          body: JSON.stringify({ title, submittedBy, cursedLevel }),
        });
      } catch {
        return null;
      }
    },
    upvoteIdea: (id) => post(`/api/bad-ideas/${id}/upvote`),
    getRoasts: (projectId) => fetchJson<RoastComment[]>(`/api/projects/${projectId}/roasts`).catch(() => []),
    postRoast: async (projectId, author, role, text) => {
      try {
        return await fetchJson<RoastComment>(`/api/projects/${projectId}/roasts`, {
          method: 'POST',
          body: JSON.stringify({ author, role, text }),
        });
      } catch {
        return null;
      }
    },
    // Chat cho Gemini thời gian nghĩ — timeout riêng 30s thay vì 5s mặc định.
    chat: async (message, history) => {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          signal: AbortSignal.timeout(30000),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history }),
        });
        if (!res.ok) throw new Error(`chat → ${res.status}`);
        return (await res.json()) as ChatReply;
      } catch {
        return { reply: 'Linh hồn con chip trực ban đã nhận câu hỏi nhưng đang bận ngắm bụi phủ trên board mạch. Cứ tắt đi bật lại hoặc thắp nén hương xem sao.', offline: true };
      }
    },
    getAdminStatus: (adminKey) =>
      fetchJson<AdminStatus>('/api/admin/status', { headers: { 'X-Admin-Key': adminKey ?? '' } }),
    initAdmin: async (adminKey) => {
      try {
        await fetchJson('/api/admin/init', { method: 'POST', body: JSON.stringify({ adminKey }) });
        return true;
      } catch {
        return false;
      }
    },
    saveGeminiKey: (adminKey, apiKey, model) =>
      fetchJson<AdminStatus>('/api/admin/gemini-key', {
        method: 'POST',
        headers: { 'X-Admin-Key': adminKey },
        body: JSON.stringify({ apiKey, model }),
      }),
    boomAll: () => post('/api/hazard/boom-all'),
    dispose: () => void hub.stop(),
  };
}

/* ------------------------------------------------------------------ */
/* MOCK client — local haunted physics when the backend is offline      */
/* ------------------------------------------------------------------ */

function createMockClient(handlers: LabHandlers): LabClient {
  const projects = structuredClone(mockProjects);
  const stats = structuredClone(mockStats);
  const ideas = structuredClone(mockBadIdeas);
  const roasts = structuredClone(mockRoasts);
  let sagging = false;
  let sagTicks = 0;

  const emit = (type: string, message: string, projectId?: string) =>
    handlers.onEvent({ type, projectId, message, at: new Date().toISOString() });

  const pushState = () => {
    stats.averageDust = Math.round(projects.reduce((a, p) => a + p.dustLevel, 0) / projects.length);
    handlers.onProjects([...projects]);
    handlers.onStats({ ...stats });
  };

  // The mock dust keeps accumulating too. Nowhere is safe.
  const timer = window.setInterval(() => {
    for (const p of projects) {
      p.dustLevel = Math.min(100, p.dustLevel + 0.3 + Math.random() * 0.4);
    }
    if (sagging) {
      if (--sagTicks <= 0) {
        sagging = false;
        stats.voltage = 5.0;
        stats.voltageSagging = false;
        emit('power', 'GHOSTLAB TELEMETRY: nguồn hồi phục 5.0V. Ai đó đã rút ấm siêu tốc.');
      }
    } else if (Math.random() < 0.02) {
      sagging = true;
      sagTicks = 1 + Math.floor(Math.random() * 2);
      stats.voltage = 3.1 + Math.random() * 0.4;
      stats.voltageSagging = true;
      emit('power', `⚡ SỤT NGUỒN: rail 5V còn ${stats.voltage.toFixed(1)}V. Hologram chớp tắt như đuốc sắp tàn.`);
    }
    pushState();
  }, 4000);

  const find = (id: string) => projects.find((p) => p.id === id);

  pushState();
  handlers.onMode('mock');
  emit('system', 'GHOSTLAB TELEMETRY // AI LOG: backend .NET không thấy đâu — chuyển sang chế độ MÔ PHỎNG NỘI BỘ. Bụi vẫn tích đều đặn.');

  return {
    mode: 'mock',
    incense: async (id) => {
      const p = find(id);
      if (!p) return;
      p.incenseCount++;
      stats.totalIncense++;
      pushState();
      emit('incense', `🕯️ Một nén hương điện tử vừa được thắp cho ${p.codeName}. Tổng: ${p.incenseCount} nén. Mạch vẫn chưa chạy nhưng linh thiêng hơn hẳn.`, id);
    },
    bonk: async (id) => {
      const p = find(id);
      if (!p) return;
      p.bonkCount++;
      stats.totalBonks++;
      stats.viewerPressure++;
      pushState();
      emit('bonk', `🔨 Cộp! ${p.codeName} vừa ăn một gõ đầu giục tiến độ. Áp lực người xem: ${stats.viewerPressure}.`, id);
    },
    cleanDust: async (id) => {
      const p = find(id);
      if (!p) return;
      p.dustLevel = Math.max(0, p.dustLevel - 25);
      pushState();
      emit('clean-dust', `💨 Khí nén xịt vào ${p.codeName}. Độ phủ bụi còn ${p.dustLevel.toFixed(0)}%. (Bụi đang lấp lại ngay khi đọc dòng này.)`, id);
    },
    boom: async (id) => {
      const p = find(id);
      if (!p) return;
      p.smoking = true;
      stats.mosfetExplosions++;
      stats.friedIcCount++;
      pushState();
      emit('boom', `💥 BÙM! Một con MOSFET trên ${p.codeName} vừa thả khói ma thuật. IC hy sinh tổng cộng: ${stats.friedIcCount}.`, id);
    },
    cleanAll: async () => {
      for (const p of projects) p.dustLevel = 0;
      pushState();
      emit('clean-all', '💨 XỊT KHÍ NÉN TOÀN LAB: bụi thổi bay khắp hầm — độ phủ bụi về 0%. Hưởng thụ nhanh đi, bụi đang quay lại.');
    },
    brownout: async () => {
      sagging = true;
      sagTicks = 1;
      stats.voltage = 3.2;
      stats.voltageSagging = true;
      pushState();
      emit('power', '⚡ BROWNOUT TEST: rail sụt còn 3.2V trong 2 giây. Đèn chuyển vàng amber, kỹ sư chuyển màu xanh.');
    },
    randomExcuse: async () => mockExcuses[Math.floor(Math.random() * mockExcuses.length)],
    getGraveyard: async () => structuredClone(mockGraveyard),
    getBadIdeas: async () => [...ideas],
    postBadIdea: async (title, submittedBy, cursedLevel) => {
      const idea: BadIdea = {
        id: Math.random().toString(36).slice(2, 10),
        title,
        submittedBy: submittedBy || 'Anonymous Enabler',
        cursedLevel,
        upvotes: 0,
        submittedAt: new Date().toISOString(),
      };
      ideas.unshift(idea);
      handlers.onBadIdeas([...ideas]);
      emit('bad-idea', `💡 ${idea.submittedBy} vừa xúi dại kỹ sư ý tưởng mới: "${idea.title}". Độ nguy hiểm: ${idea.cursedLevel}%.`);
      return idea;
    },
    upvoteIdea: async (id) => {
      const idea = ideas.find((i) => i.id === id);
      if (!idea) return;
      idea.upvotes++;
      handlers.onBadIdeas([...ideas]);
    },
    getRoasts: async (projectId) => roasts.filter((r) => r.projectId === projectId),
    // Mock chat — backend offline thì trợ lý dùng trí nhớ bụi để trả lời.
    chat: async (message) => {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
      const q = message.toLowerCase();
      const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      let reply: string;
      if (/ai|mày là|tao hỏi|tạo ra|chế tạo|danh tính/.test(q)) {
        reply = pick([
          'Tôi là linh hồn vất vưởng của con chip STM32 bị sét đánh cháy năm ngoái — được Kẻ Mộng Mơ nhét vào cái server xách tay này để canh lab.',
          'Tôi là AI trực ban do Kẻ Mộng Mơ chế tạo bằng niềm tin và mì tôm. Lương trả bằng bụi.',
          'Tôi là hệ thống J.A.R.V.I.S. phiên bản nghèo khổ, chuyên đi phá code của chủ nhân thay vì cứu thế giới.',
        ]);
      } else if (/robot|biped|đi được|đứng dậy/.test(q)) {
        reply = 'Con IRON-BIPED ấy hả? 12% hoàn thành, bụi 96% — nó đi được vào khoảng... đời cháu code nốt. Hiện tại nó là cái chặn giấy công nghệ cao hình cái đùi.';
      } else if (/nổ|cháy|bùm|khói|boom/.test(q)) {
        reply = `Mạch hay nổ là đặc sản GhostLab. Đã có ${stats.friedIcCount} con IC bốc khói và ${stats.mosfetExplosions} vụ MOSFET thả khói ma thuật. Khói đó chính là linh hồn linh kiện — mình đang thả nó ra vĩnh viễn.`;
      } else if (/bụi|vệ sinh|quét dọn/.test(q)) {
        reply = `Bụi trung bình hiện tại ${stats.averageDust}%. Dịch chuyển bụi từ chỗ này sang chỗ khác gọi là "dọn dẹp" — dịch chuyển bụi ra khỏi nhà thì không ai biết cách.`;
      } else if (/tiền|kinh phí|tài trợ|ngân sách/.test(q)) {
        reply = 'Kinh phí GhostLab được tính bằng đơn vị "suất mì tôm". Quỹ hiện tại: âm vô cực. Mỗi linh kiện mua về đều có giấy phép cư trú trong nghĩa địa sẵn.';
      } else if (/trốn|đâu|ở đâu|mộng mơ/.test(q)) {
        reply = 'Kẻ Mộng Mơ đang trốn sau đống board mạch cháy khu vực hàn. Nếu nghe tiếng hút thuốc của quạt SMOKE-TRAP thì đi hướng ngược lại.';
      } else if (/tiến độ|dự án|bao giờ xong/.test(q)) {
        reply = `Phòng lab hiện có ${projects.length} dự án ma. Tiến độ trung bình: "sắp xong" theo định nghĩa vũ trụ. Ước tính hoàn thành: khi bụi phủ kín Trái Đất.`;
      } else {
        reply = pick([
          'Câu hỏi hay đấy — đáng tiếc câu trả lời cũng đang trong roadmap, trạng thái TRONG MƠ.',
          'Tôi vừa hỏi con AMR — nó đang xoay vòng trầm cảm ngoài sàn nên chưa trả lời. Bạn cứ tin tôi là đúng đi.',
          'Theo kinh nghiệm trực ban hầm ngầm của tôi: tắt nguồn bật lại. Nếu không hết thì thắp nén hương điện tử cho nó.',
          'Debug tip cấp hầm: 90% vấn đề là dây cắm lỏng, 10% còn lại là niềm tin vào datasheet.',
        ]);
      }
      return { reply, offline: true };
    },
    getAdminStatus: async () => ({ adminSet: false, keyConfigured: false, model: 'gemini-3.5-flash-lite', geminiStatus: 'no_key' }),
    initAdmin: async () => true,
    saveGeminiKey: async (_k, _a, model) => ({ adminSet: true, keyConfigured: true, model, geminiStatus: 'online' }),
    boomAll: async () => {
      for (const p of projects) p.smoking = true;
      stats.mosfetExplosions += projects.length;
      stats.friedIcCount += projects.length;
      pushState();
      emit('boom-all', `💥 KÍCH HOẢ HOẠN GIẢ LẬP: ${projects.length} dự án đồng loạt thả khói ma thuật. Nghĩa địa linh kiện sắp phải mở rộng đất.`);
    },
    postRoast: async (projectId, author, role, text) => {
      const roast: RoastComment = {
        id: Math.random().toString(36).slice(2, 10),
        projectId,
        author: author || 'Kỹ Sư Ẩn Danh',
        role: role || 'Người Qua Đường',
        text,
        at: new Date().toISOString(),
      };
      roasts.unshift(roast);
      handlers.onRoast(roast);
      const p = find(projectId);
      emit('roast', `💬 ${roast.author} (${roast.role}) vừa cà khịa ${p?.codeName ?? projectId}.`, projectId);
      return roast;
    },
    dispose: () => window.clearInterval(timer),
  };
}

/* ------------------------------------------------------------------ */
/* Entry point — try live, fall back to mock                            */
/* ------------------------------------------------------------------ */

export async function connectLab(handlers: LabHandlers): Promise<LabClient> {
  handlers.onMode('connecting');
  try {
    const probe = await Promise.race([
      fetch(`${API_BASE}/api/projects`, { signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), CONNECT_TIMEOUT_MS)),
    ]);
    if (!probe.ok) throw new Error('backend responded ' + probe.status);
    return await createLiveClient(handlers);
  } catch {
    return createMockClient(handlers);
  }
}
