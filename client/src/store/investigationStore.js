import { create } from "zustand";

export const useInvestigationStore = create((set) => ({
  selectedEntity: null,

  setSelectedEntity: (entity) =>
    set({ selectedEntity: entity }),

  clearSelectedEntity: () =>
    set({ selectedEntity: null }),
}));