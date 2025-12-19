/* src/services/dashboard.ts */

import { api } from './api';

export interface DashboardKPI {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface DashboardData {
  kpis: DashboardKPI[];
  recentRuns: any[];
  topModels: any[];
}

export const dashboardAPI = {
  // Get dashboard data
  getData: () => api.get<DashboardData>('/dashboard'),

  // Get KPIs
  getKPIs: () =>
    api.get<DashboardKPI[]>('/dashboard/kpis'),

  // Get recent runs
  getRecentRuns: (limit = 10) =>
    api.get('/dashboard/recent-runs', { params: { limit } }),

  // Get statistics
  getStats: (timeRange = '30d') =>
    api.get('/dashboard/stats', { params: { timeRange } }),
};
