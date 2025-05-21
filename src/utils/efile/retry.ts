export async function retryable<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { retries = 3, baseDelay = 500 } = options;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const delay = baseDelay * 2 ** (attempt - 1);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}
