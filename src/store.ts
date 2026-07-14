import { create } from "zustand";
import type { EewData, EqData } from "./lib/wsTypes";

export type PanelMode = "auto" | "realtime" | "past";
export type EewSource = "wolfx" | "fan" | "exptechEew" | "cenc" | "jma" | "emsc" | "kmoni" | "exptechStn" | "palert" | "shakealert" | "geonet" | "breq" | "kmaStn" | "usgs";

interface AppState {
  sourceConnections: Record<EewSource, boolean>;
  mapReady: boolean;

  eews: Map<string, EewData>;
  activeEewId: string | null;
  cycleIndex: number;

  pastEvents: EqData[];
  selectedEventId: string | null;

  panelMode: PanelMode;

  updateAvailable: boolean;
  latestVersion: string | null;

  setSourceConnection: (source: EewSource, connected: boolean) => void;
  setMapReady: (ready: boolean) => void;
  setUpdateStatus: (available: boolean, latestVersion: string | null) => void;

  upsertEew: (id: string, data: EewData) => void;
  deleteEew: (id: string) => void;
  cycleActiveEew: () => void;

  addPastEvent: (event: EqData) => void;
  setSelectedEventId: (id: string | null) => void;

  setPanelMode: (mode: PanelMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sourceConnections: {
    exptechStn: false,
    shakealert: false,
    geonet: false,
    breq: false,
    exptechEew: false,
    palert: false,
    kmoni: false,
    wolfx: false,
    emsc: false,
    cenc: false,
    jma: false,
    fan: false,
    kmaStn: false,
    usgs: false,
  },
  mapReady: false,

  eews: new Map(),
  activeEewId: null,
  cycleIndex: 0,

  pastEvents: [],
  selectedEventId: null,

  panelMode: "auto",

  updateAvailable: false,
  latestVersion: null,

  setSourceConnection: (source, connected) => set((state) => ({
    sourceConnections: { ...state.sourceConnections, [source]: connected },
  })),
  setMapReady: (ready) => set({ mapReady: ready }),
  setUpdateStatus: (available, latestVersion) => set({ updateAvailable: available, latestVersion }),

  upsertEew: (id, data) => set((state) => {
    const eews = new Map(state.eews);
    eews.set(id, data);
    return { eews, activeEewId: id };
  }),

  deleteEew: (id) => set((state) => {
    const eews = new Map(state.eews);
    eews.delete(id);

    let activeEewId = state.activeEewId;
    if (eews.size === 0) {
      activeEewId = null;
    } else if (eews.size === 1 || activeEewId === id) {
      activeEewId = Array.from(eews.keys())[0];
    }

    return { eews, activeEewId };
  }),

  cycleActiveEew: () => set((state) => {
    if (state.eews.size === 0) return {};
    const ids = Array.from(state.eews.keys());
    const nextIndex = state.cycleIndex % ids.length;
    return { activeEewId: ids[nextIndex], cycleIndex: state.cycleIndex + 1 };
  }),

  addPastEvent: (event) => set((state) => {
    const idx = state.pastEvents.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      const pastEvents = [...state.pastEvents];
      pastEvents[idx] = event;
      return { pastEvents };
    }
    return { pastEvents: [event, ...state.pastEvents] };
  }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),

  setPanelMode: (mode) => set({ panelMode: mode }),
}));
