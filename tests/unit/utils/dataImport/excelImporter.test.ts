import { describe, it, expect, vi } from 'vitest';
import { importFromExcel } from '../../../../src/utils/dataImport/excelImporter';

// Mock XLSX to avoid reading actual files
vi.mock('xlsx', () => ({
  read: vi.fn(() => ({
    SheetNames: [],
    Sheets: {}
  })),
  utils: {
    sheet_to_json: vi.fn(() => []),
  },
}));

describe('excelImporter', () => {
  describe('importFromExcel function signature', () => {
    it('should accept an array of files parameter', () => {
      // Verify the function exists and accepts File[] parameter
      expect(typeof importFromExcel).toBe('function');
      expect(importFromExcel.length).toBe(1); // Should accept 1 parameter (File[])
    });

    it('should return a promise', () => {
      const result = importFromExcel([]);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should return proper result structure', async () => {
      const result = await importFromExcel([]);
      
      // Verify the return structure matches ImportResult interface
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('stats');
      
      expect(result.entities).toHaveProperty('cases');
      expect(result.entities).toHaveProperty('hearings');
      expect(result.entities).toHaveProperty('documents');
      expect(result.entities).toHaveProperty('invoices');
      expect(result.entities).toHaveProperty('paymentPlans');
      expect(result.entities).toHaveProperty('contacts');
      expect(result.entities).toHaveProperty('serviceLogs');
      
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});