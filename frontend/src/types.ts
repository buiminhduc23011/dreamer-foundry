export type RoadmapStatus = 'Xong' | 'DangNgap' | 'TrongMo';

export interface RoadmapItem {
  status: RoadmapStatus;
  description: string;
}

export interface Roadmap {
  hardware: RoadmapItem[];
  firmware: RoadmapItem[];
  software: RoadmapItem[];
}

export interface DustyProject {
  id: string;
  codeName: string;
  name: string;
  tagline: string;
  ghostStatus: string;
  damageReport: string;
  timeParadox: string;
  completionPercent: number;
  dustLevel: number;
  smoking: boolean;
  position: number[];
  incenseCount: number;
  bonkCount: number;
  roadmap: Roadmap;
}

export interface LabStats {
  friedIcCount: number;
  viewerPressure: number;
  voltage: number;
  voltageSagging: boolean;
  totalIncense: number;
  totalBonks: number;
  mosfetExplosions: number;
  averageDust?: number;
}

export interface LabEvent {
  type: string;
  projectId?: string | null;
  message: string;
  at: string;
}

export interface GraveyardEntry {
  id: string;
  component: string;
  epitaph: string;
  causeOfDeath: string;
  diedAt: string;
}

export interface BadIdea {
  id: string;
  title: string;
  submittedBy: string;
  cursedLevel: number;
  submittedAt: string;
}

export type ConnectionMode = 'connecting' | 'live' | 'mock';

export type FxType = 'incense' | 'dust' | 'bonk' | 'boom';
