/**
 * Core text generation logic for Gemma3
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateRequest, GenerateResponse, ModelConfig } from './types';
import { retryWithBackoff } from './retryHandler';
import { logger } from '../../../utils/logger';

export class Gemma3Generator {
  private client: GoogleGenerativeAI;
  private modelName: string;
  private timeout: number;
  private maxRetries: number;

  constructor(config: ModelConfig) {
    this.modelName = config.modelName || 'gemini-2.0-flash';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
  
    // Only initialize real client if an API key is provided
    if (config.apiKey) {
      this.client = new GoogleGenerativeAI(config.apiKey);
    } else {
      // @ts-expect-error: client is unused in stub mode
      this.client = null;
    }
  }
  

  /**
   * Generate code from prompt with retry logic
   */
  async generate(req: GenerateRequest): Promise<GenerateResponse> {
    if (process.env.USE_STUB_MODEL === '1') {
        const prompt = req.prompt.toLowerCase();
    
        let code = '';
        if (prompt.includes('add two numbers') && prompt.includes('python')) {
          code = [
            'def add(a: int, b: int) -> int:',
            '    \"\"\"Return the sum of a and b.\"\"\"',
            '    return a + b',
            ''
          ].join('\n');
        } else {
          code = [
            'def solve():',
            '    # TODO: implement solution',
            '    pass',
            ''
          ].join('\n');
        }
    
        return {
          text: code,
          finishReason: 'STOP',
          usage: {
            inputTokens: Math.ceil(req.prompt.length / 4),
            outputTokens: Math.ceil(code.length / 4),
          },
        };
      }
      if (!this.client) {
        throw new Error('Gemma3Generator client not initialized and stub mode is off');
      }
    logger.info('Generating with Gemma3', {
      modelName: this.modelName,
      promptLength: req.prompt.length,
      maxTokens: req.maxTokens,
    });

    const generationConfig = {
      maxOutputTokens: req.maxTokens || 1024,
      temperature: req.temperature || 0.7,
      topP: req.topP || 0.95,
      topK: req.topK || 40,
      stopSequences: req.stopSequences || [],
    };

    try {
      const response = await retryWithBackoff(
        async () => {
          const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig,
          });

          const result = await Promise.race([
            model.generateContent(req.prompt),
            this._createTimeoutPromise(),
          ]);

          return result;
        },
        {
          maxRetries: this.maxRetries,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
        },
      );

      const text =
        response.response.text() ||
        '[ERROR: No response text from model]';

      return {
        text,
        finishReason: this._mapFinishReason(
          response.response.candidates?.[0]?.finishReason || 'OTHER',
        ),
        usage: {
          inputTokens:
            response.response.usageMetadata?.promptTokenCount || 0,
          outputTokens:
            response.response.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      logger.error('Gemma3 generation failed', {
        error: error instanceof Error ? error.message : String(error),
        modelName: this.modelName,
      });
      throw error;
    }
  }

  /**
   * Map API finish reason to standard format
   */
  private _mapFinishReason(
    apiReason: string,
  ): 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'OTHER' {
    const map: Record<string, any> = {
      STOP: 'STOP',
      MAX_TOKENS: 'MAX_TOKENS',
      SAFETY: 'SAFETY',
      RECITATION: 'SAFETY',
    };
    return map[apiReason] || 'OTHER';
  }

  /**
   * Create timeout promise for request deadline
   */
  private _createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Gemma3 request timeout after ${this.timeout}ms`,
          ),
        );
      }, this.timeout);
    });
  }
}
