/* src/services/tests.ts */

import { api } from './api';
import { TestSuite, TestCase } from '@/types';

export const testsAPI = {
  // List test suites
  listSuites: () => api.get<TestSuite[]>('/test-suites'),

  // Get test suite by ID
  getSuiteById: (id: string) => api.get<TestSuite>(`/test-suites/${id}`),

  // Create test suite
  createSuite: (payload: Omit<TestSuite, 'id' | 'createdAt'>) =>
    api.post<TestSuite>('/test-suites', payload),

  // Update test suite
  updateSuite: (id: string, payload: Partial<TestSuite>) =>
    api.patch<TestSuite>(`/test-suites/${id}`, payload),

  // Delete test suite
  deleteSuite: (id: string) => api.delete(`/test-suites/${id}`),

  // Run test suite
  runSuite: (id: string, code: string) =>
    api.post(`/test-suites/${id}/run`, { code }),

  // Add test case
  addTestCase: (suiteId: string, testCase: Omit<TestCase, 'id'>) =>
    api.post(`/test-suites/${suiteId}/tests`, testCase),

  // Update test case
  updateTestCase: (suiteId: string, testId: string, payload: Partial<TestCase>) =>
    api.patch(`/test-suites/${suiteId}/tests/${testId}`, payload),

  // Delete test case
  deleteTestCase: (suiteId: string, testId: string) =>
    api.delete(`/test-suites/${suiteId}/tests/${testId}`),
};
