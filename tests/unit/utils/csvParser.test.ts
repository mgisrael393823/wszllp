import { describe, it, expect, vi } from 'vitest';
import { parseCsv } from '../../../src/utils/dataImport/csvParser';

describe('csvParser', () => {
  it('parses comma delimited data', () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = parseCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].age).toBe('25');
  });

  it('parses semicolon delimited data', () => {
    const csv = 'name;age\nAlice;30\nBob;25';
    const result = parseCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[1].name).toBe('Bob');
  });

  it('handles quoted headers', () => {
    const csv = '"Name","Age"\n"Alice",30';
    const result = parseCsv(csv);
    expect(result[0]).toHaveProperty('Name');
    expect(result[0].Age).toBe('30');
  });

  it('logs warnings on parse errors', () => {
    const bad = 'name,age\n"Alice,30';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = parseCsv(bad);
    expect(warn).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    warn.mockRestore();
  });
});

