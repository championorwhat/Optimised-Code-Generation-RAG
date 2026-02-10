/**
 * User & Auth Types
 */
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'admin' | 'user' | 'viewer';
    createdAt: Date;
  }
  
  /**
   * Model Types
   */
  export interface Model {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'custom';
    apiKey?: string;
    config?: Record<string, unknown>;
    costPerToken: number;
    avgLatency: number; // ms
    passRate: number; // 0-100
    totalRuns: number;
    status: 'active' | 'inactive' | 'testing';
    createdAt: Date;
    updatedAt: Date;
  }
  
  /**
   * Run Types
   */
  export interface RunModel {
    modelId: string;
    modelName: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    generatedCode: string;
    error?: string;
    executionTime: number; // ms
    tokensUsed: number;
    cost: number;
    testResults?: TestResult[];
  }
  
  export interface Run {
    id: string;
    prompt: string;
    language: string;
    selectedModels: string[];
    models: RunModel[];
    status: 'queued' | 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    testSuiteId?: string;
    refinements?: Refinement[];
    createdAt: Date;
    completedAt?: Date;
    createdBy: string;
  }
  
  export interface CreateRunPayload {
    prompt: string;
    language: string;
    selectedModels: string[];
    timeout?: number;
    parallelMode?: boolean;
    testSuiteId?: string;
  }
  
  /**
   * Test Types
   */
  export interface TestCase {
    id: string;
    name: string;
    input: unknown;
    expectedOutput: unknown;
    description?: string;
  }
  
  export interface TestResult {
    id: string;
    name: string;
    status: 'pass' | 'fail' | 'error';
    duration: number; // ms
    errorMessage?: string;
    stackTrace?: string;
    actualOutput?: unknown;
    expectedOutput?: unknown;
  }
  
  export interface TestSuite {
    id: string;
    name: string;
    description?: string;
    language: string;
    testCases: TestCase[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  }
  
  /**
   * Comparison & Refinement Types
   */
  export interface Refinement {
    id: string;
    modelId: string;
    instruction: string;
    refinedCode: string;
    testResults?: TestResult[];
    createdAt: Date;
  }
  
  export interface ComparisonMetrics {
    modelId: string;
    testsPassed: number;
    testsFailed: number;
    passRate: number;
    avgLatency: number;
    cost: number;
    codeComplexity: number;
    readability: number;
    score: number;
  }
  
  /**
   * UI State Types
   */
  export interface UIState {
    sidebarCollapsed: boolean;
    activeTab: string;
    selectedModels: string[];
    viewMode: 'grid' | 'side-by-side' | 'detail';
    showTestLogs: boolean;
  }
  
  /**
   * API Response Types
   */
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }
  
  /**
   * Error Types
   */
  export interface ApiError {
    status: number;
    message: string;
    code: string;
    details?: Record<string, unknown>;
  }
/**
 * EGRR Pipeline Types
 */
export type EGRRPhase = 'retrieval' | 'generation' | 'execution' | 'review' | 'decision';
export type EGRRStatus = 'success' | 'partial' | 'failed' | 'pending' | 'running';

export interface PhaseResult {
  duration_ms: number;
  [key: string]: unknown;
}

export interface RetrievalPhaseResult extends PhaseResult {
  queries: string[];
  documents_retrieved: number;
  pattern_ids: string[];
}

export interface GenerationPhaseResult extends PhaseResult {
  code?: string;
  code_length: number;
  confidence: number;
  explanation?: string;
  patterns_used: string[];
}


export interface ExecutionPhaseResult extends PhaseResult {
  status: string;
  exit_code: number;
  tests_passed: number;
  tests_failed: number;
  coverage: number;
  stdout_preview: string;
  stderr_preview: string;
}

export interface ReviewPhaseResult extends PhaseResult {
  quality_score: number;
  correctness_status: string;
  security_status: string;
  robustness_status: string;
  critical_issues_count: number;
  critical_issues: string[];
}

export interface DecisionPhaseResult extends PhaseResult {
  decision: string;
  rationale: string;
  next_focus?: string;
}

export interface IterationDetail {
  iteration_number: number;
  phase_results: {
    retrieval?: RetrievalPhaseResult;
    generation?: GenerationPhaseResult;
    execution?: ExecutionPhaseResult;
    review?: ReviewPhaseResult;
    decision?: DecisionPhaseResult;
  };
  retrieval_count: number;
  code_generated: boolean;
  execution_status: string | null;
  tests_passed: number;
  tests_failed: number;
  coverage: number;
  critical_issues: string[];
  decision: string | null;
  duration_ms: number;
}

export interface EGRRGenerateRequest {
  query: string;
  language?: string;
  max_iterations?: number;
  use_rag?: boolean;
}

export interface EGRRGenerateResponse {
  code: string;
  explanation: string;
  iterations: number;
  status: EGRRStatus;
  coverage: number | null;
  tests_passed: number | null;
  tests_failed: number | null;
  iteration_details: IterationDetail[];
  total_duration_ms: number;
  retrieved_patterns: string[];
}

export interface EGRRRunState {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentIteration: number;
  currentPhase: EGRRPhase | null;
  result: EGRRGenerateResponse | null;
  error: string | null;
  startTime: Date | null;
}  