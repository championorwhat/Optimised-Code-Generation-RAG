/* src/store/uiStore.ts */

import { create } from 'zustand';
import { UIState } from '@/types';

interface UIStoreState extends UIState {
  // Actions
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedModels: (models: string[]) => void;
  setViewMode: (mode: 'grid' | 'side-by-side' | 'detail') => void;
  toggleTestLogs: () => void;
  resetUI: () => void;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  activeTab: 'generated',
  selectedModels: [],
  viewMode: 'grid',
  showTestLogs: false,
};

export const useUIStore = create<UIStoreState>((set) => ({
  ...initialState,

  toggleSidebar: () =>
    set((state) => ({
      ...state,
      sidebarCollapsed: !state.sidebarCollapsed,
    })),

  setActiveTab: (tab) =>
    set((state) => ({
      ...state,
      activeTab: tab,
    })),

  setSelectedModels: (models) =>
    set((state) => ({
      ...state,
      selectedModels: models,
    })),

  setViewMode: (mode) =>
    set((state) => ({
      ...state,
      viewMode: mode,
    })),

  toggleTestLogs: () =>
    set((state) => ({
      ...state,
      showTestLogs: !state.showTestLogs,
    })),

  resetUI: () => set(() => initialState),
}));
