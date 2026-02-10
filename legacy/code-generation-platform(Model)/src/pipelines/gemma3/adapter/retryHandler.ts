/**
 * Exponential backoff retry handler for resilience
 */

import { AdapterError } from './types';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRYABLE_CODES = [
  'RATE_LIMIT_EXCEEDED',
  'SERVICE_UNAVAILABLE',
  'DEADLINE_EXCEEDED',
  'INTERNAL_ERROR',
];

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  isRetryable: (err: any) => boolean = (err) =>
    DEFAULT_RETRYABLE_CODES.includes(err.code),
): Promise<T> {
  let lastError: any;
  let delayMs = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) {
        break; // Last attempt failed, throw
      }

      if (!isRetryable(error)) {
        throw error; // Non-retryable error, fail immediately
      }

      // Wait before retrying
      await _delay(delayMs);

      // Exponential backoff
      delayMs = Math.min(
        delayMs * config.backoffMultiplier,
        config.maxDelayMs,
      );
    }
  }

  throw lastError;
}

function _delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
