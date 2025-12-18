/**
 * Main Gemma3 adapter - unified interface for API/Local/Vertex
 */
import { DeploymentMode, ModelConfig, GenerateRequest, GenerateResponse, AdapterError } from './types';
import { Gemma3Generator } from './generate';
import { HuggingFaceGemmaClient } from './hfClient';
import { RateLimiter } from './rateLimiter';
import { logger } from '../../../utils/logger';

// export class Gemma3Adapter {
//   private generator: Gemma3Generator;
//   private rateLimiter: RateLimiter;
//   private deploymentMode: DeploymentMode;

//   constructor(
//     config: ModelConfig,
//     deploymentMode: DeploymentMode = DeploymentMode.API,
//   ) {
//     this.deploymentMode = deploymentMode;
//     this.generator = new Gemma3Generator(config);
//     this.rateLimiter = new RateLimiter(60, 90000); // Default free tier limits
//   }

//   /**
//    * Main interface: generate code from prompt
//    */
//   async generate(req: GenerateRequest): Promise<GenerateResponse> {
//     // Rate limit check
//     const estimatedTokens = this._estimateTokens(req.prompt);
//     if (!this.rateLimiter.canProceed(estimatedTokens)) {
//       const waitMs = this.rateLimiter.getWaitTimeMs();
//       const err: AdapterError = new Error(
//         `Rate limit exceeded. Retry after ${waitMs}ms`,
//       ) as AdapterError;
//       err.code = 'RATE_LIMIT_EXCEEDED';
//       err.retryable = true;
//       err.details = { waitMs };
//       throw err;
//     }

//     // Invoke generator
//     const response = await this.generator.generate(req);

//     logger.info('Gemma3 generation successful', {
//       inputTokens: response.usage.inputTokens,
//       outputTokens: response.usage.outputTokens,
//       finishReason: response.finishReason,
//     });

//     return response;
//   }

//   /**
//    * Rough token estimation (4 chars ≈ 1 token)
//    */
//   private _estimateTokens(text: string): number {
//     return Math.ceil(text.length / 4);
//   }

//   /**
//    * Health check
//    */
//   async health(): Promise<boolean> {
//     try {
//       const response = await this.generator.generate({
//         prompt: 'Say "ok"',
//         maxTokens: 10,
//       });
//       return response.text.toLowerCase().includes('ok');
//     } catch (error) {
//       logger.error('Gemma3 health check failed', { error });
//       return false;
//     }
//   }
// }





export class Gemma3Adapter {
    private generator: Gemma3Generator | null;
    private hfClient: HuggingFaceGemmaClient | null;
    private rateLimiter: RateLimiter;
    private deploymentMode: DeploymentMode;
  
    constructor(
      config: ModelConfig,
      deploymentMode: DeploymentMode = DeploymentMode.API,
    ) {
      this.deploymentMode = deploymentMode;
      this.rateLimiter = new RateLimiter(60, 90000);
  
      if (deploymentMode === DeploymentMode.HF) {
        const token = process.env.HF_API_TOKEN;
        const modelId =
          process.env.HF_GEMMA_MODEL_ID || 'google/gemma-3-27b-it';
  
        if (!token) {
          throw new Error('HF_API_TOKEN is required for HF deployment mode');
        }
  
        this.generator = null;
        this.hfClient = new HuggingFaceGemmaClient(token, modelId);
      } else {
        this.hfClient = null;
        this.generator = new Gemma3Generator(config);
      }
    }
  
    async generate(req: GenerateRequest): Promise<GenerateResponse> {
      const estimatedTokens = this._estimateTokens(req.prompt);
      if (!this.rateLimiter.canProceed(estimatedTokens)) {
        const waitMs = this.rateLimiter.getWaitTimeMs();
        const err: AdapterError = new Error(
          `Rate limit exceeded. Retry after ${waitMs}ms`,
        ) as AdapterError;
        err.code = 'RATE_LIMIT_EXCEEDED';
        err.retryable = true;
        err.details = { waitMs };
        throw err;
      }
  
      if (this.deploymentMode === DeploymentMode.HF) {
        if (!this.hfClient) {
          throw new Error('HF client not initialized');
        }
        return this.hfClient.generate(req);
      }
  
      if (!this.generator) {
        throw new Error('Gemma3Generator not initialized');
      }
  
      return this.generator.generate(req);
    }
  
    private _estimateTokens(text: string): number {
      return Math.ceil(text.length / 4);
    }
  
    async health(): Promise<boolean> {
      try {
        const response = await this.generate({
          prompt: 'Say "ok"',
          maxTokens: 10,
        });
        return response.text.toLowerCase().includes('ok');
      } catch {
        return false;
      }
    }
  }
  