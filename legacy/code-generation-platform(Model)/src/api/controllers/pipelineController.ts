/**
 * HTTP request handler for pipeline API
 */

import { Request, Response } from 'express';
import { PipelineService } from '../../services/pipelineService';
import { logger } from '../../utils/logger';

export class PipelineController {
  constructor(private pipelineService: PipelineService) {}

  /**
   * POST /api/pipelines/gemma3/run
   */
  async runPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, language, model, testSuiteId, options } = req.body;

      // Validate
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Invalid or missing prompt' });
        return;
      }

      logger.info('Pipeline request received', {
        promptLength: prompt.length,
        language,
      });

      // Queue async execution
      const runId = await this.pipelineService.queuePipeline({
        prompt,
        language: language || 'javascript',
        model: model || 'gemma3:27b',
        testSuiteId,
        options,
      });

      // Immediate response with runId
      res.status(202).json({
        runId,
        status: 'queued',
        statusUrl: `/api/pipelines/${runId}`,
      });
    } catch (error) {
      logger.error('Pipeline request failed', { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * GET /api/pipelines/:runId
   */
  async getPipelineStatus(req: Request, res: Response): Promise<void> {
    try {
      const { runId } = req.params;

      const result = await this.pipelineService.getResult(runId);

      if (!result) {
        res.status(404).json({ error: 'Run not found' });
        return;
      }

      res.json({
        runId,
        status: result.status,
        duration: result.duration,
        stages: Array.from(result.stages.values()),
        result: {
          code: result.code,
          language: result.language,
          testsPassed: result.testsPassed,
          testsFailed: result.testsFailed,
        },
      });
    } catch (error) {
      logger.error('Get status failed', { error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
