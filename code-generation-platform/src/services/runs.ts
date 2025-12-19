/* src/services/runs.ts */

import { api } from './api';
import { Run, CreateRunPayload } from '@/types';

export const runsAPI = {
  // List all runs
  list: (page = 1, limit = 20) =>
    api.get<{ runs: Run[]; total: number }>('/runs', {
      params: { page, limit },
    }),

  // Get run by ID
  getById: (id: string) => api.get<Run>(`/runs/${id}`),

  // Create new run
  create: (payload: CreateRunPayload) => api.post<Run>('/runs', payload),

  // Update run
  update: (id: string, payload: Partial<Run>) =>
    api.patch<Run>(`/runs/${id}`, payload),

  // Delete run
  delete: (id: string) => api.delete(`/runs/${id}`),

  // Get run progress
  getProgress: (id: string) => api.get(`/runs/${id}/progress`),

  // Cancel run
  cancel: (id: string) => api.post(`/runs/${id}/cancel`),

  // Export run results
  export: (id: string, format: 'zip' | 'json' = 'zip') =>
    api.get(`/runs/${id}/export`, {
      params: { format },
      responseType: 'blob',
    }),
};
