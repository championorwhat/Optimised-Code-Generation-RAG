/**
 * API route definitions
 */

import { Router } from 'express';
import { PipelineController } from './controllers/pipelineController';
import { PipelineService } from '../services/pipelineService';
import { validateRequest } from './middleware/validation';

export function setupRoutes(
  app: Router,
  pipelineService: PipelineService,
): void {
  const controller = new PipelineController(pipelineService);

  // Pipeline endpoints
  app.post(
    '/api/pipelines/gemma3/run',
    validateRequest,
    (req, res) => controller.runPipeline(req, res),
  );

  app.get(
    '/api/pipelines/:runId',
    (req, res) => controller.getPipelineStatus(req, res),
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.get('/', (req, res) => {
    res.json({
      message: 'Gemma3 pipeline backend is running',
      endpoints: {
        runPipeline: 'POST /api/pipelines/gemma3/run',
        getStatus: 'GET /api/pipelines/:runId',
        health: 'GET /health',
      },
    });
  });
  
}