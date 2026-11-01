import { create } from 'zustand';
import { connectLab, type LabClient } from '../api/labApi';
import type {
  BadIdea,
  ConnectionMode,
  DustyProject,
  FxType,
  GraveyardEntry,
  LabEvent,
  LabStats,
} from '../types';

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

  /** Per-project FX nonces — bumped every time a lab event lands, watched by 3D components. */
  fx: Record<string, Record<FxType, number>>;
  /** Global FX — camera shake on bonk, screen flash on boom. */
  shakeNonce: number;
  flashNonce: number;

  init: () => void;
  select: (id: string | null) => void;
  incense: (id: string) => void;
  bonk: (id: string) => void;
  cleanDust: (id: string) => void;
  boom: (id: string) => void;
  requestExcuse: () => Promise<void>;
  togglePanic: () => void;
  setGraveyardOpen: (open: boolean) => Promise<void>;
  setIdeasOpen: (open: boolean) => Promise<void>;
  submitBadIdea: (title: string, by: string, cursed: number) => Promise<void>;
}

export const useLabStore = create<LabStore>((set, get) => ({
  client: null,
  started: false,
  mode: 'connecting',
  projects: [],
  stats: null,
  feed: [],
  excuseLog: [
    { text: 'J.A.R.V.I.S. Ngáo khởi động. Đang quét phòng lab... phát hiện 99% bụi, 1% hy vọng.', at: new Date() },
  ],
  excuseBusy: false,
  selectedId: null,
  panicMode: false,
  graveyardOpen: false,
  ideasOpen: false,
  graveyard: [],
  badIdeas: [],
  fx: {},
  shakeNonce: 0,
  flashNonce: 0,

  init: () => {
    if (get().started) return;
    set({ started: true });
    void connectLab({
      onProjects: (projects) => set({ projects }),
      onStats: (stats) => set({ stats }),
      onMode: (mode) => set({ mode }),
      onEvent: (evt) =>
        set((s) => {
          const fxType = evtTypeToFx[evt.type];
          const fx = { ...s.fx };
          let { shakeNonce, flashNonce } = s;
          if (fxType && evt.projectId) {
            const cur = fx[evt.projectId] ?? { incense: 0, dust: 0, bonk: 0, boom: 0 };
            fx[evt.projectId] = { ...cur, [fxType]: cur[fxType] + 1 };
          }
          if (evt.type === 'bonk') shakeNonce++;
          if (evt.type === 'boom') flashNonce++;
          return { feed: [evt, ...s.feed].slice(0, MAX_FEED), fx, shakeNonce, flashNonce };
        }),
    }).then((client) => set({ client }));
  },

  select: (id) => set({ selectedId: id }),

  incense: (id) => void get().client?.incense(id),
  bonk: (id) => void get().client?.bonk(id),
  cleanDust: (id) => void get().client?.cleanDust(id),
  boom: (id) => void get().client?.boom(id),

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

  togglePanic: () => set((s) => ({ panicMode: !s.panicMode })),

  setGraveyardOpen: async (open) => {
    set({ graveyardOpen: open });
    if (open) {
      const g = await get().client?.getGraveyard();
      if (g) set({ graveyard: g });
    }
  },
  setIdeasOpen: async (open) => {
    set({ ideasOpen: open });
    if (open) {
      const ideas = await get().client?.getBadIdeas();
      if (ideas) set({ badIdeas: ideas });
    }
  },
  submitBadIdea: async (title, by, cursed) => {
    const idea = await get().client?.postBadIdea(title, by, cursed);
    if (idea) set((s) => ({ badIdeas: [idea, ...s.badIdeas] }));
  },
}));

export const selectProject = (s: LabStore) =>
  s.projects.find((p) => p.id === s.selectedId) ?? null;
