import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { SelectFilter } from '@/components/ui/table-filters/SelectFilter';
import { Column } from '@tanstack/react-table';

// Mock column
const createMockColumn = (filterValue = ''): Column<any, unknown> => ({
  id: 'status',
  getFilterValue: vi.fn(() => filterValue),
  setFilterValue: vi.fn(),
  getFacetedUniqueValues: () => new Map([
    ['active', 5],
    ['inactive', 3],
    ['pending', 2],
  ]),
  getFacetedMinMaxValues: () => undefined,
  columnDef: {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterVariant: 'select',
    },
  },
} as any);

describe('SelectFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const column = createMockColumn();
    const options = [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('accepts required props', () => {
    const column = createMockColumn();
    const options = [{ label: 'Test', value: 'test' }];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('handles empty options array', () => {
    const column = createMockColumn();
    const options: Array<{ label: string; value: string }> = [];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('accepts optional placeholder prop', () => {
    const column = createMockColumn();
    const options = [{ label: 'Test', value: 'test' }];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} placeholder="Choose status" />);
    }).not.toThrow();
  });

  it('calls column.getFilterValue on render', () => {
    const column = createMockColumn('active');
    const options = [{ label: 'Active', value: 'active' }];
    
    render(<SelectFilter column={column} options={options} />);
    
    expect(column.getFilterValue).toHaveBeenCalled();
  });

  it('handles column with no filter value', () => {
    const column = createMockColumn();
    const options = [{ label: 'Test', value: 'test' }];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('handles column with string filter value', () => {
    const column = createMockColumn('test');
    const options = [{ label: 'Test', value: 'test' }];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('handles multiple options', () => {
    const column = createMockColumn();
    const manyOptions = Array.from({ length: 10 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option_${i + 1}`,
    }));
    
    expect(() => {
      render(<SelectFilter column={column} options={manyOptions} />);
    }).not.toThrow();
  });

  it('handles options with special characters', () => {
    const column = createMockColumn();
    const options = [
      { label: 'With Space', value: 'with space' },
      { label: 'With-Dash', value: 'with-dash' },
      { label: 'With_Underscore', value: 'with_underscore' },
    ];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });

  it('works with different column ids', () => {
    const column = { ...createMockColumn(), id: 'priority' };
    const options = [{ label: 'High', value: 'high' }];
    
    expect(() => {
      render(<SelectFilter column={column} options={options} />);
    }).not.toThrow();
  });
});