import { create } from 'zustand';
import { connectLab, type LabClient } from '../api/labApi';
import { labAudio } from '../audio/labAudio';
import type {
  BadIdea,
  ConnectionMode,
  DustyProject,
  FxType,
  GraveyardEntry,
  LabEvent,
  LabStats,
  RoastComment,
  TourFocus,
} from '../types';
import { REACTOR_FOCUS } from '../types';

const MAX_FEED = 40;
const MAX_EXCUSES = 8;

const evtTypeToFx: Record<string, FxType> = {
  incense: 'incense',
  'clean-dust': 'dust',
  bonk: 'bonk',
  boom: 'boom',
};

interface LabStore {
  client: LabClient | null;
  started: boolean;
  mode: ConnectionMode;
  projects: DustyProject[];
  stats: LabStats | null;
  feed: LabEvent[];
  excuseLog: { text: string; at: Date }[];
  excuseBusy: boolean;

  selectedId: string | null;
  panicMode: boolean;
  graveyardOpen: boolean;
  ideasOpen: boolean;
  graveyard: GraveyardEntry[];
  badIdeas: BadIdea[];
  roasts: Record<string, RoastComment[]>;

  /** Cinematic auto-tour — idle 6s là bật, đổi focus mỗi 12s. */
  tourActive: boolean;
  tourFocusId: TourFocus | null;
  lastActivity: number;
  /** Brownout test — đèn lab chuyển amber trong ~2s. */
  brownoutActive: boolean;

  /** AMR SLAM: 'auto' = chạy vòng patrol + mất định vị ngẫu nhiên, 'manual' = lái bằng bàn phím. */
  amrMode: 'auto' | 'manual';
  setAmrMode: (mode: 'auto' | 'manual') => void;

  /** Per-project FX nonces — bumped every time a lab event lands, watched by 3D components. */
  fx: Record<string, Record<FxType, number>>;
  /** Global FX — camera shake on bonk, screen flash on boom. */
  shakeNonce: number;
  flashNonce: number;
  homeNonce: number;

  init: () => void;
  select: (id: string | null) => void;
  resetHome: () => void;
  incense: (id: string) => void;
  bonk: (id: string) => void;
  cleanDust: (id: string) => void;
  boom: (id: string) => void;
  cleanAll: () => void;
  brownout: () => void;
  requestExcuse: () => Promise<void>;
  togglePanic: () => void;
  setGraveyardOpen: (open: boolean) => Promise<void>;
  setIdeasOpen: (open: boolean) => Promise<void>;
  submitBadIdea: (title: string, by: string, cursed: number) => Promise<void>;
  upvoteIdea: (id: string) => void;
  loadRoasts: (projectId: string) => Promise<void>;
  submitRoast: (projectId: string, author: string, role: string, text: string) => Promise<void>;

  /** Ghi nhận tương tác người dùng — reset idle timer, cắt tour ngay. */
  recordActivity: () => void;
  setTour: (active: boolean, focus: TourFocus | null) => void;
  /** Đẩy event local (vd AMR mất định vị) vào live feed + serial monitor. */
  pushFeed: (type: string, projectId: string | null, message: string) => void;
}

export const useLabStore = create<LabStore>((set, get) => ({
  client: null,
  started: false,
  mode: 'connecting',
  projects: [],
  stats: null,
  feed: [],
  excuseLog: [
    { text: 'GHOSTLAB TELEMETRY // AI LOG khởi động. Đang quét phòng lab... phát hiện 99% bụi, 1% hy vọng.', at: new Date() },
  ],
  excuseBusy: false,
  selectedId: null,
  panicMode: false,
  graveyardOpen: false,
  ideasOpen: false,
  graveyard: [],
  badIdeas: [],
  roasts: {},
  tourActive: false,
  tourFocusId: null,
  lastActivity: Date.now(),
  brownoutActive: false,
  amrMode: 'auto',
  setAmrMode: (mode) => {
    set({ amrMode: mode });
    get().recordActivity();
    get().pushFeed(
      'amr-crash',
      'amr-slam',
      mode === 'manual'
        ? 'AMR_SLAM: Chuyển sang MANUAL — kỹ sư giành quyền lái bằng bàn phím (WASD + Q/E).'
        : 'AMR_SLAM: Trả về AUTO — tiếp tục chạy vòng patrol quanh bàn J.A.R.V.I.S.',
    );
  },
  fx: {},
  shakeNonce: 0,
  flashNonce: 0,
  homeNonce: 0,

  init: () => {
    if (get().started) return;
    set({ started: true });
    void connectLab({
      onProjects: (projects) => set({ projects }),
      onStats: (stats) => set({ stats }),
      onMode: (mode) => set({ mode }),
      onBadIdeas: (badIdeas) => set({ badIdeas }),
      onRoast: (roast) =>
        set((s) => ({
          roasts: { ...s.roasts, [roast.projectId]: [roast, ...(s.roasts[roast.projectId] ?? [])] },
        })),
      onEvent: (evt) =>
        set((s) => {
          const fxType = evtTypeToFx[evt.type];
          const fx = { ...s.fx };
          let { shakeNonce, flashNonce } = s;
          if (fxType && evt.projectId) {
            const cur = fx[evt.projectId] ?? { incense: 0, dust: 0, bonk: 0, boom: 0 };
            fx[evt.projectId] = { ...cur, [fxType]: cur[fxType] + 1 };
          }
          // Xịt khí nén toàn lab → mọi pedestal đồng loạt bắn bụi.
          if (evt.type === 'clean-all') {
            for (const p of s.projects) {
              const cur = fx[p.id] ?? { incense: 0, dust: 0, bonk: 0, boom: 0 };
              fx[p.id] = { ...cur, dust: cur.dust + 1 };
            }
          }
          // Hoả hoạn giả lập → toàn bộ dự án đồng loạt thả khói.
          if (evt.type === 'boom-all') {
            for (const p of s.projects) {
              const cur = fx[p.id] ?? { incense: 0, dust: 0, bonk: 0, boom: 0 };
              fx[p.id] = { ...cur, boom: cur.boom + 1 };
            }
          }
          if (evt.type === 'bonk') shakeNonce++;
          if (evt.type === 'boom' || evt.type === 'boom-all') flashNonce++;
          if (evt.type === 'boom-all') shakeNonce++;
          if (evt.type === 'incense') labAudio.playLabAction('incense');
          else if (evt.type === 'bonk') labAudio.playLabAction('bonk');
          else if (evt.type === 'clean-dust' || evt.type === 'clean-all') labAudio.playLabAction('dust');
          else if (evt.type === 'boom' || evt.type === 'boom-all') labAudio.playLabAction('boom');
          else if (evt.type === 'power') labAudio.playLabAction('brownout');
          return { feed: [evt, ...s.feed].slice(0, MAX_FEED), fx, shakeNonce, flashNonce };
        }),
    }).then((client) => set({ client }));
  },

  select: (id) => {
    const prev = get().selectedId;
    if (id === null && prev === null) return;
    set((s) => ({ selectedId: id, homeNonce: id === null ? s.homeNonce + 1 : s.homeNonce }));
    labAudio.playHudClick(id ? 640 : 420);
    get().recordActivity();
  },

  incense: (id) => void get().client?.incense(id),
  resetHome: () => {
    set((s) => ({ selectedId: null, homeNonce: s.homeNonce + 1 }));
    labAudio.playHudClick(420);
  },
  bonk: (id) => void get().client?.bonk(id),
  cleanDust: (id) => void get().client?.cleanDust(id),
  boom: (id) => void get().client?.boom(id),
  cleanAll: () => void get().client?.cleanAll(),

  brownout: () => {
    if (get().brownoutActive) return;
    set({ brownoutActive: true });
    void get().client?.brownout();
    setTimeout(() => set({ brownoutActive: false }), 2100);
  },

  requestExcuse: async () => {
    const { client, excuseBusy } = get();
    if (!client || excuseBusy) return;
    set({ excuseBusy: true });
    try {
      const text = await client.randomExcuse();
      set((s) => ({ excuseLog: [{ text, at: new Date() }, ...s.excuseLog].slice(0, MAX_EXCUSES) }));
    } finally {
      set({ excuseBusy: false });
    }
  },

  togglePanic: () => {
    set((s) => {
      const next = !s.panicMode;
      labAudio.setPanicMute(next);
      return { panicMode: next };
    });
    get().recordActivity();
  },

  setGraveyardOpen: async (open) => {
    set({ graveyardOpen: open });
    get().recordActivity();
    if (open) {
      const g = await get().client?.getGraveyard();
      if (g) set({ graveyard: g });
    }
  },
  setIdeasOpen: async (open) => {
    set({ ideasOpen: open });
    get().recordActivity();
    if (open) {
      const ideas = await get().client?.getBadIdeas();
      if (ideas) set({ badIdeas: ideas });
    }
  },
  submitBadIdea: async (title, by, cursed) => {
    const idea = await get().client?.postBadIdea(title, by, cursed);
    if (idea) set((s) => ({ badIdeas: s.badIdeas.some((b) => b.id === idea.id) ? s.badIdeas : [idea, ...s.badIdeas] }));
  },
  upvoteIdea: (id) => void get().client?.upvoteIdea(id),

  loadRoasts: async (projectId) => {
    const list = await get().client?.getRoasts(projectId);
    if (list) set((s) => ({ roasts: { ...s.roasts, [projectId]: list } }));
  },
  submitRoast: async (projectId, author, role, text) => {
    const roast = await get().client?.postRoast(projectId, author, role, text);
    if (roast) {
      set((s) => {
        const cur = s.roasts[projectId] ?? [];
        return cur.some((r) => r.id === roast.id)
          ? s
          : { roasts: { ...s.roasts, [projectId]: [roast, ...cur] } };
      });
    }
  },

  recordActivity: () => {
    const s = get();
    if (s.tourActive) set({ tourActive: false, tourFocusId: null, lastActivity: Date.now() });
    else set({ lastActivity: Date.now() });
  },

  setTour: (active, focus) => set({ tourActive: active, tourFocusId: focus }),

  pushFeed: (type, projectId, message) =>
    set((s) => ({ feed: [{ type, projectId, message, at: new Date().toISOString() }, ...s.feed].slice(0, MAX_FEED) })),
}));

export const selectProject = (s: LabStore) =>
  s.projects.find((p) => p.id === s.selectedId) ?? null;

/** Focus hiện tại của tour — project hoặc lõi reactor. */
export const selectTourProject = (s: LabStore) =>
  s.tourFocusId && s.tourFocusId !== REACTOR_FOCUS
    ? s.projects.find((p) => p.id === s.tourFocusId) ?? null
    : null;
