import * as signalR from '@microsoft/signalr';
import type {
  BadIdea,
  ConnectionMode,
  DustyProject,
  GraveyardEntry,
  LabEvent,
  LabStats,
} from '../types';
import { mockBadIdeas, mockExcuses, mockGraveyard, mockProjects, mockStats } from './mockData';

// Dev: talk to the .NET backend on :5000. Prod: same origin (backend serves the SPA).
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? (import.meta.env.DEV ? 'http://localhost:5000' : '');
const CONNECT_TIMEOUT_MS = 3000;

export interface LabHandlers {
  onProjects: (projects: DustyProject[]) => void;
  onStats: (stats: LabStats) => void;
  onEvent: (evt: LabEvent) => void;
  onMode: (mode: ConnectionMode) => void;
}

export interface LabClient {
  readonly mode: ConnectionMode;
  incense(id: string): Promise<void>;
  bonk(id: string): Promise<void>;
  cleanDust(id: string): Promise<void>;
  boom(id: string): Promise<void>;
  randomExcuse(): Promise<string>;
  getGraveyard(): Promise<GraveyardEntry[]>;
  getBadIdeas(): Promise<BadIdea[]>;
  postBadIdea(title: string, submittedBy: string, cursedLevel: number): Promise<BadIdea | null>;
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
  hub.onclose(() => handlers.onMode('mock')); // hub died → drift into mock physics

  await hub.start();

  handlers.onProjects(projects);
  handlers.onStats(stats);
  handlers.onMode('live');

  const post = async (id: string, action: string) => {
    try {
      await fetchJson(`/api/projects/${id}/${action}`, { method: 'POST' });
    } catch {
      handlers.onEvent({
        type: 'system',
        message: 'J.A.R.V.I.S.: API không phản hồi — hành động của ngài đã bị bụi nuốt.',
        at: new Date().toISOString(),
      });
    }
  };

  return {
    mode: 'live',
    incense: (id) => post(id, 'incense'),
    bonk: (id) => post(id, 'bonk'),
    cleanDust: (id) => post(id, 'clean-dust'),
    boom: (id) => post(id, 'boom'),
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
        emit('power', 'J.A.R.V.I.S.: nguồn hồi phục 5.0V. Ai đó đã rút ấm siêu tốc.');
      }
    } else if (Math.random() < 0.08) {
      sagging = true;
      sagTicks = 1 + Math.floor(Math.random() * 3);
      stats.voltage = 3.1 + Math.random() * 0.4;
      stats.voltageSagging = true;
      emit('power', `⚡ SỤT NGUỒN: rail 5V còn ${stats.voltage.toFixed(1)}V. Hologram chớp tắt như đuốc sắp tàn.`);
    }
    pushState();
  }, 4000);

  const find = (id: string) => projects.find((p) => p.id === id);

  pushState();
  handlers.onMode('mock');
  emit('system', 'J.A.R.V.I.S. Ngáo: backend .NET không thấy đâu — chuyển sang chế độ MÔ PHỎNG NỘI BỘ. Bụi vẫn tích đều đặn.');

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
      emit('bonk', `🔨 Cộp! ${p.codeName} vừa ăn một gõ mỏ hàn giục tiến độ. Áp lực người xem: ${stats.viewerPressure}.`, id);
    },
    cleanDust: async (id) => {
      const p = find(id);
      if (!p) return;
      p.dustLevel = Math.max(0, p.dustLevel - 25);
      pushState();
      emit('clean-dust', `💨 Khí nén xịt vào ${p.codeName}. Độ phủ bụi còn ${p.dustLevel.toFixed(0)}%. (Bụi đang lấp lại ngay khi ngài đọc dòng này.)`, id);
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
    randomExcuse: async () => mockExcuses[Math.floor(Math.random() * mockExcuses.length)],
    getGraveyard: async () => structuredClone(mockGraveyard),
    getBadIdeas: async () => [...ideas],
    postBadIdea: async (title, submittedBy, cursedLevel) => {
      const idea: BadIdea = {
        id: Math.random().toString(36).slice(2, 10),
        title,
        submittedBy: submittedBy || 'Anonymous Enabler',
        cursedLevel,
        submittedAt: new Date().toISOString(),
      };
      ideas.unshift(idea);
      emit('bad-idea', `💡 ${idea.submittedBy} vừa xúi dại kỹ sư ý tưởng mới: "${idea.title}". Độ nguy hiểm: ${idea.cursedLevel}%.`);
      return idea;
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
