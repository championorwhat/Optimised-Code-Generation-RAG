/**
 * Pipeline type definitions
 */

export enum PipelineStage {
    PREPROCESSING = 'preprocessing',
    MODEL_INVOCATION = 'modelInvocation',
    NORMALIZATION = 'normalization',
    OPTIMIZATION = 'optimization',
    VALIDATION = 'validation',
    TESTING = 'testing',
    PACKAGING = 'packaging',
  }
  
  export enum PipelineStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    SUCCESS = 'success',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
  }
  
  export interface StageResult {
    stage: PipelineStage;
    status: 'success' | 'failed' | 'skipped';
    duration: number; // ms
    error?: string;
    data?: Record<string, any>;
  }
  
  export interface PipelineOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    skipOptimization?: boolean;
    skipValidation?: boolean;
    skipTesting?: boolean;
    testSuiteId?: string;
    language?: string;
  }
  
  export interface PipelineRequest {
    prompt: string;
    language?: string;
    model?: string;
    testSuiteId?: string;
    options?: PipelineOptions;
  }
  
  export interface ArtifactMetadata {
    id: string;
    type: 'code' | 'test_result' | 'analysis';
    language: string;
    createdAt: number;
    size: number;
  }
  
  export interface PipelineResult {
    runId: string;
    status: PipelineStatus;
    code: string;
    language: string;
    duration: number;
    stages: Map<PipelineStage, StageResult>;
    testsPassed?: number;
    testsFailed?: number;
    artifacts: Map<string, ArtifactMetadata>;
    error?: string;
  }
  