/**
 * Pipeline execution context - tracks state across stages
 */

// import { v4 as uuidv4 } from 'uuid';
import { generateRunId } from '../../../utils/id';
import { PipelineStage, PipelineRequest, StageResult } from './types';
import { logger } from '../../../utils/logger';

export class PipelineContext {
  readonly runId: string;
  readonly request: PipelineRequest;
  readonly startTime: number;

  private stageResults: Map<PipelineStage, StageResult> = new Map();
  private data: Map<string, any> = new Map();
  private metrics: Map<string, any> = new Map();

  constructor(request: PipelineRequest) {
    // this.runId = uuidv4();
    this.runId = generateRunId();
    this.request = request;
    this.startTime = Date.now();

    logger.info('Pipeline context created', {
      runId: this.runId,
      language: request.language,
    });
  }

  /**
   * Record stage execution result
   */
  recordStageResult(
    stage: PipelineStage,
    status: 'success' | 'failed' | 'skipped',
    duration: number,
    error?: string,
    data?: Record<string, any>,
  ): void {
    this.stageResults.set(stage, {
      stage,
      status,
      duration,
      error,
      data,
    });

    logger.info('Stage completed', {
      runId: this.runId,
      stage,
      status,
      duration,
    });
  }

  /**
   * Store data for next stages
   */
  setData(key: string, value: any): void {
    this.data.set(key, value);
  }

  /**
   * Retrieve data from previous stages
   */
  getData(key: string): any {
    return this.data.get(key);
  }

  /**
   * Record metric
   */
  recordMetric(key: string, value: any): void {
    this.metrics.set(key, value);
  }

  /**
   * Get total duration so far
   */
  getTotalDuration(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get all stage results
   */
  getStageResults(): Map<PipelineStage, StageResult> {
    return new Map(this.stageResults);
  }

  /**
   * Get all metrics
   */
  getMetrics(): Map<string, any> {
    return new Map(this.metrics);
  }
}
