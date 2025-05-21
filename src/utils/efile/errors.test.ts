import assert from 'assert';
import { mapMessageCode } from './errors';

assert.equal(mapMessageCode(0), 'Success');
assert.equal(mapMessageCode(1001), 'Invalid credentials');
assert.equal(mapMessageCode(9999), 'Unexpected error');
