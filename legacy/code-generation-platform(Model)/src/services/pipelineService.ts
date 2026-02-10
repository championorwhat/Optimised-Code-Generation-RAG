import { PipelineRunner } from '../pipelines/gemma3/pipeline/pipelineRunner';
import { Gemma3Adapter } from '../pipelines/gemma3/adapter/gemma3.adapter';
import { DeploymentMode } from '../pipelines/gemma3/adapter/types';
import { PipelineRequest, PipelineResult, PipelineStatus } from '../pipelines/gemma3/pipeline/types';
import { StorageService } from './storageService';
const inMemoryResults = new Map<string, PipelineResult>();

export class PipelineService {
    private runner: PipelineRunner;
    private storage: StorageService;

  constructor() {
    const adapter = new Gemma3Adapter(
      {
        modelName: process.env.GEMMA3_MODEL_NAME || 'google/gemma-3-27b-it',
        apiKey: process.env.GEMMA3_API_KEY, // unused in stub mode
        timeout: 30000,
        maxRetries: 1,
        retryDelayMs: 1000,
      },
      DeploymentMode.API,
    );

    this.storage = new StorageService();
    this.runner = new PipelineRunner(adapter, this.storage);
  }
  // Called by POST /run – for now run synchronously
  async queuePipeline(request: PipelineRequest): Promise<string> {
    const result = await this.runner.run(request);
    inMemoryResults.set(result.runId, result);
    return result.runId;
  }

  // Called by GET /:runId
  async getResult(runId: string): Promise<PipelineResult | undefined> {
    return inMemoryResults.get(runId);
  }
}