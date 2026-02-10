/**
 * Type definitions for Gemma3 adapter
 */

export interface GenerateRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
  }
  
  export interface GenerateResponse {
    text: string;
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'OTHER';
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  }
  
  export interface ModelConfig {
    modelName: string;
    apiKey?: string;
    baseUrl?: string;
    timeout: number;
    maxRetries: number;
    retryDelayMs: number;
  }
  
  export interface RateLimitConfig {
    requestsPerMinute: number;
    tokensPerMinute: number;
  }
  
//   export enum DeploymentMode {
//     API = 'api',
//     LOCAL = 'local',
//     VERTEX = 'vertex',
//   }
  

export enum DeploymentMode {
    API = 'api',      // Google GenAI (Gemini/Gemma via Google)
    LOCAL = 'local',  // Ollama, etc.
    VERTEX = 'vertex',
    HF = 'hf'         // Hugging Face Inference API
  }
  
  export interface AdapterError extends Error {
    code: string;
    retryable: boolean;
    details?: Record<string, any>;
  }