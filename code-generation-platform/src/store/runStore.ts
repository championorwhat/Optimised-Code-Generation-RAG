/* src/store/runStore.ts */

import { create } from 'zustand';
import { Run, RunModel } from '@/types';

interface RunState {
  currentRun: Run | null;
  runs: Run[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentRun: (run: Run) => void;
  addRun: (run: Run) => void;
  updateRun: (id: string, updates: Partial<Run>) => void;
  updateModelStatus: (
    runId: string,
    modelId: string,
    updates: Partial<RunModel>
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetStore: () => void;
}

export const useRunStore = create<RunState>((set) => ({
  currentRun: null,
  runs: [],
  isLoading: false,
  error: null,

  setCurrentRun: (run) =>
    set((state) => ({
      ...state,
      currentRun: run,
    })),

  addRun: (run) =>
    set((state) => ({
      ...state,
      runs: [run, ...state.runs],
    })),

  updateRun: (id, updates) =>
    set((state) => {
      const updatedRuns = state.runs.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      return {
        ...state,
        runs: updatedRuns,
        currentRun:
          state.currentRun?.id === id
            ? { ...state.currentRun, ...updates }
            : state.currentRun,
      };
    }),

  updateModelStatus: (runId, modelId, updates) =>
    set((state) => {
      const updatedRuns = state.runs.map((run) =>
        run.id === runId
          ? {
              ...run,
              models: run.models.map((m) =>
                m.modelId === modelId ? { ...m, ...updates } : m
              ),
            }
          : run
      );

      return {
        ...state,
        runs: updatedRuns,
        currentRun:
          state.currentRun?.id === runId
            ? {
                ...state.currentRun,
                models: state.currentRun.models.map((m) =>
                  m.modelId === modelId ? { ...m, ...updates } : m
                ),
              }
            : state.currentRun,
      };
    }),

  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
    })),

  setError: (error) =>
    set((state) => ({
      ...state,
      error,
    })),

  clearError: () =>
    set((state) => ({
      ...state,
      error: null,
    })),

  resetStore: () =>
    set(() => ({
      currentRun: null,
      runs: [],
      isLoading: false,
      error: null,
    })),
}));
