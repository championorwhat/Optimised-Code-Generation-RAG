/* src/services/models.ts */

import { api } from './api';
import { Model } from '@/types';

export const modelsAPI = {
  // List all models
  list: () => api.get<Model[]>('/models'),

  // Get model by ID
  getById: (id: string) => api.get<Model>(`/models/${id}`),

  // Create new model
  create: (payload: Omit<Model, 'id'>) => api.post<Model>('/models', payload),

  // Update model
  update: (id: string, payload: Partial<Model>) =>
    api.patch<Model>(`/models/${id}`, payload),

  // Delete model
  delete: (id: string) => api.delete(`/models/${id}`),

  // Test model connection
  testConnection: (id: string) =>
    api.post(`/models/${id}/test-connection`),
};
