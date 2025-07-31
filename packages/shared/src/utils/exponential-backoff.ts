export interface BackoffOptions {
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  maxRetries?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export class ExponentialBackoff {
  private initialDelay: number;
  private maxDelay: number;
  private factor: number;
  private maxRetries: number;
  private onRetry?: (error: Error, attempt: number) => void;

  constructor(options: BackoffOptions = {}) {
    this.initialDelay = options.initialDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 60000; // 60 seconds
    this.factor = options.factor || 2;
    this.maxRetries = options.maxRetries || 5;
    this.onRetry = options.onRetry;
  }

  async execute<T>(
    fn: () => Promise<T>,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (shouldRetry && !shouldRetry(lastError)) {
          throw lastError;
        }

        // Check if we've exhausted retries
        if (attempt === this.maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.initialDelay * Math.pow(this.factor, attempt),
          this.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay * (0.5 + Math.random() * 0.5);

        // Call retry callback if provided
        if (this.onRetry) {
          this.onRetry(lastError, attempt + 1);
        }

        // Wait before retrying
        await this.sleep(jitteredDelay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Helper function for simple retry scenarios
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options?: BackoffOptions
): Promise<T> {
  const backoff = new ExponentialBackoff(options);
  return backoff.execute(fn);
}

// Specific retry logic for OAuth token operations
export async function retryOAuthOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withExponentialBackoff(operation, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    onRetry: (error, attempt) => {
      console.log(
        `${operationName} failed (attempt ${attempt}):`,
        error.message
      );
    },
  });
}

// Check if an error is retryable
export function isRetryableError(error: Error): boolean {
  // Network errors
  if (error.name === 'NetworkError' || error.name === 'FetchError') {
    return true;
  }

  // Check for specific error messages
  const message = error.message.toLowerCase();
  const retryableMessages = [
    'network',
    'timeout',
    'econnreset',
    'econnrefused',
    'etimedout',
    'esockettimedout',
    'rate limit',
    'too many requests',
    '429',
    '503',
    '504',
  ];

  return retryableMessages.some((msg) => message.includes(msg));
}

// Check if error is due to rate limiting
export function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  );
}

// Extract retry-after header value
export function getRetryAfter(headers: Headers): number | null {
  const retryAfter = headers.get('retry-after');
  if (!retryAfter) return null;

  // Check if it's a number (seconds) or a date
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try to parse as date
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}