import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryable, CircuitBreaker } from '@/utils/efile/retry';
import { ServerError, AuthenticationError, SubmissionError } from '@/utils/efile/errors';

describe('Retry utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('retryable', () => {
    it('should return the result if function succeeds on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retryable(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
    
    it('should retry on failure and succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();
      
      // Start the retryable function, but don't await it yet
      const resultPromise = retryable(fn, { retries: 3, baseDelay: 10, onRetry });
      
      // Fast-forward time to complete all retries
      await vi.runAllTimersAsync();
      
      // Now await the result
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(onRetry).toHaveBeenCalledTimes(2);
    });
    
    it('should throw when the operation always fails', async () => {
      // Define the error outside the function
      class TestError extends Error {
        constructor() {
          super('Always fails');
          this.name = 'TestError';
        }
      }
      
      const fn = vi.fn().mockRejectedValue(new TestError());

      // Start the retryable function and capture any error
      const resultPromise = retryable(fn, { retries: 2, baseDelay: 10 }).catch(e => e);

      // Fast-forward time to complete all retries
      await vi.runAllTimersAsync();

      const err = await resultPromise;

      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Always fails');
      expect(err.name).toBe('TestError');

      // And still assert it retried the expected number of times
      expect(fn).toHaveBeenCalledTimes(3);
    });
    
    it('should not retry on authentication errors', async () => {
      const error = new AuthenticationError('Invalid credentials');
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(retryable(fn)).rejects.toThrow('Invalid credentials');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
    
    it('should not retry on certain submission errors', async () => {
      const error = new SubmissionError('Invalid submission', 2003);
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(retryable(fn)).rejects.toThrow('Invalid submission');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
    
    it('should use exponential backoff with jitter', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue('success');
      
      const resultPromise = retryable(fn, { baseDelay: 100 });
      
      // First failure occurs immediately
      expect(fn).toHaveBeenCalledTimes(1);
      
      // First retry should be around 100ms
      await vi.advanceTimersByTimeAsync(150);
      expect(fn).toHaveBeenCalledTimes(2);
      
      // Second retry should be around 200ms
      await vi.advanceTimersByTimeAsync(300);
      expect(fn).toHaveBeenCalledTimes(3);
      
      // Resolve the promise
      const result = await resultPromise;
      expect(result).toBe('success');
    });
  });
  
  describe('CircuitBreaker', () => {
    it('should execute function normally when closed', async () => {
      const circuitBreaker = new CircuitBreaker();
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
    
    it('should open after threshold failures', async () => {
      const circuitBreaker = new CircuitBreaker(2);
      const error = new Error('Service unavailable');
      const fn = vi.fn().mockRejectedValue(error);
      
      // First failure
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service unavailable');
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      // Second failure - should open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Service unavailable');
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Further calls should fail without calling the function
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
      expect(fn).toHaveBeenCalledTimes(2); // Only called twice, not for the third attempt
    });
    
    it('should enter half-open state after timeout', async () => {
      const circuitBreaker = new CircuitBreaker(2, 1000);
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue('success');
      
      // Fail twice to open the circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Advance time to trigger timeout
      vi.advanceTimersByTime(1500);
      
      // Circuit should now allow a test call
      const result = await circuitBreaker.execute(fn);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
    
    it('should be more aggressive with server errors', async () => {
      const circuitBreaker = new CircuitBreaker(4);
      const error = new ServerError('Server overloaded', 500);
      const fn = vi.fn().mockRejectedValue(error);
      
      // For server errors, the threshold is effectively halved
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      await expect(circuitBreaker.execute(fn)).rejects.toThrow();
      
      // Circuit should open after 2 server errors despite threshold being 4
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
    
    it('should reset on successful execution', async () => {
      const circuitBreaker = new CircuitBreaker();
      
      // Manually set the internal state
      circuitBreaker.reset(); // This sets state to CLOSED
      expect(circuitBreaker.getState()).toBe('CLOSED');
      
      const fn = vi.fn().mockResolvedValue('success');
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });
});