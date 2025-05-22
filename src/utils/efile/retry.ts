import { EFileError, AuthenticationError, ServerError, SubmissionError } from './errors';

/**
 * Check if an error should be retried
 */
function isRetryableError(error: unknown): boolean {
  // Don't retry authentication errors
  if (error instanceof AuthenticationError) {
    return false;
  }
  
  // Check for errors with isRecoverable method
  if (error.isRecoverable && typeof error.isRecoverable === 'function') {
    return error.isRecoverable();
  }
  
  // For submission errors with certain codes, don't retry
  if (error instanceof SubmissionError && 
      (error.code === 2003 || error.code === 2004)) {
    return false;
  }
  
  // Most other errors can be retried
  return true;
}

/**
 * Retry a function with exponential backoff.
 * 
 * @param fn The function to retry
 * @param options Configuration options
 * @returns The result of the function
 */
export async function retryable<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
    retryableErrors?: Array<typeof Error>;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelay = 500,
    maxDelay = 10000,
    onRetry = () => {},
  } = options;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      
      // Check if we should retry this error
      if (!isRetryableError(err)) {
        throw err;
      }
      
      // Don't retry after max attempts
      if (attempt > retries) {
        // If this was a server error, add retry info
        if (err instanceof ServerError) {
          err.message = `${err.message} (Retried ${attempt} times)`;
        }
        throw err;
      }
      
      // Apply exponential backoff with additional delay for server errors
      let multiplier = 1;
      if (err instanceof ServerError) {
        multiplier = 2;
      }

      const jitter = Math.random() * 0.3 + 0.85;
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) * jitter * multiplier,
        maxDelay,
      );

      if (onRetry) onRetry(attempt, err as Error);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

/**
 * Circuit breaker pattern to prevent repeated calls to failing services.
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private lastError: Error | null = null;
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 30000,
    private halfOpenMaxCalls: number = 3
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if timeout has elapsed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new EFileError(
          `Circuit breaker is open due to multiple failures. Last error: ${this.lastError?.message}`,
          this.lastError instanceof EFileError ? this.lastError.code : undefined
        );
      }
    }
    
    try {
      const result = await fn();
      
      // Success, reset the circuit
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (err) {
      // Record the failure
      this.failureCount++;
      this.lastFailureTime = Date.now();
      this.lastError = err as Error;
      
      // For server errors, be more aggressive with circuit breaking
      const serverErrorMultiplier = err instanceof ServerError ? 2 : 1;
      
      // Check if we need to open the circuit
      if ((this.failureCount >= this.threshold / serverErrorMultiplier) || 
          (this.state === 'HALF_OPEN' && this.failureCount >= this.halfOpenMaxCalls)) {
        this.state = 'OPEN';
      }
      
      throw err;
    }
  }
  
  reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastError = null;
  }
  
  getState(): string {
    return this.state;
  }
}