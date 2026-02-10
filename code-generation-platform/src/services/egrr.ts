/**
 * EGRR Pipeline API Service
 * 
 * Connects the frontend to the EGRR (Execution-Grounded Retrieval Refinement) pipeline backend.
 */

import axios, { AxiosInstance } from 'axios';
import { EGRRGenerateRequest, EGRRGenerateResponse } from '@/types';

// Backend API URL - EGRR Pipeline runs on port 8000
const EGRR_API_URL = process.env.NEXT_PUBLIC_EGRR_API_URL || 'http://localhost:8000/api';

// Create axios instance for EGRR API
const egrrClient: AxiosInstance = axios.create({
  baseURL: EGRR_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for long-running pipeline
});

// Add request interceptor for logging
egrrClient.interceptors.request.use(
  (config) => {
    console.log(`[EGRR API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[EGRR API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
egrrClient.interceptors.response.use(
  (response) => {
    console.log(`[EGRR API] Response ${response.status}:`, response.data);
    return response;
  },
  (error) => {
    console.error('[EGRR API] Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * SSE Event types from the backend
 */
export interface SSEEvent {
  event: string;
  data: {
    iteration?: number;
    phase?: string;
    phase_display?: string;
    description?: string;
    result?: Record<string, unknown>;
    duration_ms?: number;
    timestamp?: number;
    decision?: string;
    will_continue?: boolean;
    // Pipeline complete data
    run_id?: string;
    status?: string;
    code?: string;
    explanation?: string;
    iterations?: number;
    coverage?: number;
    tests_passed?: number;
    tests_failed?: number;
    total_duration_ms?: number;
    retrieved_patterns?: string[];
    decision_rationale?: string;
    // Additional fields
    max_iterations?: number;
    query?: string;
  };
}

/**
 * Callback type for SSE events
 */
export type SSEEventCallback = (event: SSEEvent) => void;

/**
 * EGRR Pipeline API functions
 */
export const egrrAPI = {
  /**
   * Generate code using the EGRR pipeline (non-streaming)
   */
  generate: async (request: EGRRGenerateRequest): Promise<EGRRGenerateResponse> => {
    const response = await egrrClient.post<EGRRGenerateResponse>('/generate', request);
    return response.data;
  },

  /**
   * Generate code using the EGRR pipeline with SSE streaming
   * Returns an AbortController to allow cancellation
   */
  generateStream: (
    request: EGRRGenerateRequest,
    onEvent: SSEEventCallback,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): AbortController => {
    const abortController = new AbortController();
    
    const startStream = async () => {
      try {
        const response = await fetch(`${EGRR_API_URL}/generate/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Response body is null');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            onComplete?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              currentData = line.slice(5).trim();
            } else if (line === '' && currentEvent && currentData) {
              try {
                const parsedData = JSON.parse(currentData);
                onEvent({
                  event: currentEvent,
                  data: parsedData
                });
              } catch {
                console.warn('Failed to parse SSE data:', currentData);
              }
              currentEvent = '';
              currentData = '';
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onError?.(error as Error);
        }
      }
    };

    startStream();
    return abortController;
  },

  /**
   * Health check for the EGRR backend
   */
  healthCheck: async (): Promise<{ status: string; version?: string }> => {
    try {
      const response = await egrrClient.get('/health');
      return response.data;
    } catch {
      return { status: 'unavailable' };
    }
  },

  /**
   * Get corpus statistics
   */
  getCorpusStats: async (): Promise<{ document_count: number; categories: string[] }> => {
    const response = await egrrClient.get('/corpus/stats');
    return response.data;
  },
};

/**
 * Helper function to format duration in human-readable form
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Helper function to get phase display name
 */
export function getPhaseDisplayName(phase: string): string {
  const names: Record<string, string> = {
    retrieval: 'Retrieval',
    generation: 'Generation',
    execution: 'Execution',
    review: 'Review',
    decision: 'Decision',
  };
  return names[phase] || phase;
}

/**
 * Helper function to get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: 'text-green-400',
    passed: 'text-green-400',
    partial: 'text-yellow-400',
    failed: 'text-red-400',
    pending: 'text-neutral-400',
    running: 'text-blue-400',
    TERMINATE_SUCCESS: 'text-green-400',
    TERMINATE_MAX_ITERATIONS: 'text-yellow-400',
    CONTINUE: 'text-blue-400',
  };
  return colors[status] || 'text-neutral-400';
}

/**
 * Helper function to get status badge variant
 * Maps to Badge component variants: 'primary' | 'success' | 'danger' | 'warning' | 'neutral'
 */
export function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'primary' | 'neutral' {
  const variants: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'neutral'> = {
    success: 'success',
    passed: 'success',
    partial: 'warning',
    failed: 'danger',
    pending: 'neutral',
    running: 'primary',
    TERMINATE_SUCCESS: 'success',
    TERMINATE_MAX_ITERATIONS: 'warning',
    CONTINUE: 'primary',
  };
  return variants[status] || 'neutral';
}

export default egrrAPI;
