/**
 * Main pipeline orchestrator
 */

import { PipelineContext } from './context';
import { PipelineStage, PipelineStatus, PipelineResult, PipelineRequest } from './types';
import * as stages from './stages';
import { Gemma3Adapter } from '../adapter/gemma3.adapter';
import { logger } from '../../../utils/logger';
import { StorageService } from '../../../services/storageService';

export class PipelineRunner {
  private adapter: Gemma3Adapter;
  private storage: StorageService;

  constructor(adapter: Gemma3Adapter, storage: StorageService) {
    this.adapter = adapter;
    this.storage = storage;
  }

  /**
   * Execute full pipeline
   */
  async run(request: PipelineRequest): Promise<PipelineResult> {
    const ctx = new PipelineContext(request);

    try {
      logger.info('Pipeline started', { runId: ctx.runId });

      // Execute stages in sequence
      await stages.preprocessingStage(ctx);
      await stages.modelInvocationStage(ctx, this.adapter);
      await stages.normalizationStage(ctx);
      await stages.optimizationStage(ctx, null);
      await stages.validationStage(ctx, null);
      await stages.testingStage(ctx, null);
      await stages.packagingStage(ctx, this.storage);

      logger.info('Pipeline completed successfully', { runId: ctx.runId });

      return this._buildResult(ctx, PipelineStatus.SUCCESS);
    } catch (error) {
      logger.error('Pipeline failed', {
        runId: ctx.runId,
        error: error instanceof Error ? error.message : String(error),
      });

      return this._buildResult(
        ctx,
        PipelineStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  /**
   * Build final result
   */
  private _buildResult(
    ctx: PipelineContext,
    status: PipelineStatus,
    error?: string,
  ): PipelineResult {
    const code = ctx.getData('optimizedCode') || ctx.getData('extractedCode') || '';
    const language = ctx.getData('language') || 'unknown';
    const testResult = ctx.getData('testResult');

    return {
      runId: ctx.runId,
      status,
      code,
      language,
      duration: ctx.getTotalDuration(),
      stages: ctx.getStageResults(),
      testsPassed: testResult?.passed,
      testsFailed: testResult?.failed,
      artifacts: new Map(),
      error,
    };
  }
}
