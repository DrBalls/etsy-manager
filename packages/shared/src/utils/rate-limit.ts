import { RateLimitError } from './errors';

export function isRateLimitError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  
  if (error && typeof error === 'object' && 'status' in error) {
    return error.status === 429;
  }
  
  return false;
}

export function getRetryAfter(headers: Headers): number | null {
  const retryAfter = headers.get('Retry-After') || headers.get('X-RateLimit-Reset');
  
  if (!retryAfter) {
    return null;
  }
  
  const retryAfterNum = parseInt(retryAfter, 10);
  if (isNaN(retryAfterNum)) {
    return null;
  }
  
  // If value is greater than current timestamp, it's a Unix timestamp
  if (retryAfterNum > Date.now() / 1000) {
    return (retryAfterNum * 1000) - Date.now();
  }
  
  // Otherwise, it's seconds to wait
  return retryAfterNum * 1000;
}

export class ExponentialBackoff {
  private attempt = 0;
  
  constructor(
    private config: {
      maxRetries: number;
      initialDelay: number;
      maxDelay: number;
      factor: number;
    }
  ) {}
  
  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry: (error: any) => boolean
  ): Promise<T> {
    while (this.attempt < this.config.maxRetries) {
      try {
        return await fn();
      } catch (error) {
        if (!shouldRetry(error) || this.attempt >= this.config.maxRetries - 1) {
          throw error;
        }
        
        const delay = Math.min(
          this.config.initialDelay * Math.pow(this.config.factor, this.attempt),
          this.config.maxDelay
        );
        
        await this.sleep(delay);
        this.attempt++;
      }
    }
    
    throw new Error('Maximum retries exceeded');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}