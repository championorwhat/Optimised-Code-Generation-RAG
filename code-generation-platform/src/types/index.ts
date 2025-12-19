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
    config?: Record<string, any>;
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
    input: any;
    expectedOutput: any;
    description?: string;
  }
  
  export interface TestResult {
    id: string;
    name: string;
    status: 'pass' | 'fail' | 'error';
    duration: number; // ms
    errorMessage?: string;
    stackTrace?: string;
    actualOutput?: any;
    expectedOutput?: any;
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
    details?: Record<string, any>;
  }
  