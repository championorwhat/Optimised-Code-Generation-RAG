/**
 * Token bucket rate limiter for API quota management
 */

interface TokenBucket {
    tokens: number;
    lastRefillTime: number;
  }
  
  export class RateLimiter {
    private requestBucket: TokenBucket;
    private tokenBucket: TokenBucket;
    private readonly requestLimit: number;
    private readonly tokenLimit: number;
    private readonly refillIntervalMs: number;
  
    constructor(
      requestsPerMinute: number,
      tokensPerMinute: number,
    ) {
      this.requestLimit = requestsPerMinute;
      this.tokenLimit = tokensPerMinute;
      this.refillIntervalMs = 60000; // 1 minute
  
      this.requestBucket = {
        tokens: requestsPerMinute,
        lastRefillTime: Date.now(),
      };
  
      this.tokenBucket = {
        tokens: tokensPerMinute,
        lastRefillTime: Date.now(),
      };
    }
  
    /**
     * Check if request can proceed and consume tokens
     */
    canProceed(requestTokens: number): boolean {
      this._refillBuckets();
  
      const hasRequests = this.requestBucket.tokens >= 1;
      const hasTokens = this.tokenBucket.tokens >= requestTokens;
  
      if (hasRequests && hasTokens) {
        this.requestBucket.tokens -= 1;
        this.tokenBucket.tokens -= requestTokens;
        return true;
      }
  
      return false;
    }
  
    /**
     * Get estimated wait time in ms
     */
    getWaitTimeMs(): number {
      this._refillBuckets();
  
      if (this.requestBucket.tokens >= 1) {
        return 0;
      }
  
      const timeSinceLastRefill = Date.now() - this.requestBucket.lastRefillTime;
      return Math.max(0, this.refillIntervalMs - timeSinceLastRefill);
    }
  
    /**
     * Refill buckets based on elapsed time
     */
    private _refillBuckets(): void {
      const now = Date.now();
      const elapsedMs = now - this.requestBucket.lastRefillTime;
  
      if (elapsedMs >= this.refillIntervalMs) {
        this.requestBucket.tokens = this.requestLimit;
        this.requestBucket.lastRefillTime = now;
  
        this.tokenBucket.tokens = this.tokenLimit;
        this.tokenBucket.lastRefillTime = now;
      }
    }
  }
  