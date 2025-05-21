import assert from 'assert';
import { retryable } from './retry';

(async () => {
  let attempts = 0;
  const result = await retryable(() => {
    attempts += 1;
    if (attempts < 2) {
      return Promise.reject(new Error('fail'));
    }
    return Promise.resolve('ok');
  });
  assert.equal(result, 'ok');
})();
