import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TextFilter } from '@/components/ui/table-filters/TextFilter';
import { Column } from '@tanstack/react-table';

// Mock column
const createMockColumn = (filterValue = ''): Column<any, unknown> => ({
  id: 'testColumn',
  getFilterValue: () => filterValue,
  setFilterValue: vi.fn(),
  getFacetedUniqueValues: () => new Map(),
  getFacetedMinMaxValues: () => undefined,
  columnDef: {
    accessorKey: 'test',
    header: 'Test Column',
  },
} as any);

describe('TextFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder', () => {
    const column = createMockColumn();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Search testColumn...');
    expect(input).toBeInTheDocument();
  });

  it('displays current filter value', () => {
    const column = createMockColumn('test value');
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    expect(input).toHaveValue('test value');
  });

  it('calls setFilterValue when typing', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    await user.type(input, 'search term');
    
    // Debounced, so we need to wait
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith('search term');
    }, { timeout: 600 });
  });

  it('debounces input changes', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    
    // Type quickly
    await user.type(input, 'abc');
    
    // Should not have been called immediately
    expect(column.setFilterValue).not.toHaveBeenCalled();
    
    // Wait for debounce
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledTimes(1);
      expect(column.setFilterValue).toHaveBeenCalledWith('abc');
    }, { timeout: 600 });
  });

  it('clears filter when input is empty', async () => {
    const column = createMockColumn('existing');
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    
    // Clear the input
    await user.clear(input);
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(undefined);
    }, { timeout: 600 });
  });

  it('shows item count when available', () => {
    const column = createMockColumn();
    column.getFacetedUniqueValues = () => new Map([
      ['value1', 2],
      ['value2', 3],
      ['value3', 1],
    ]);
    
    render(<TextFilter column={column} />);
    
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('handles special characters in search', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    await user.type(input, 'test@example.com');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith('test@example.com');
    }, { timeout: 600 });
  });

  it('preserves filter value on re-render', () => {
    const column = createMockColumn('preserved value');
    const { rerender } = render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    expect(input).toHaveValue('preserved value');
    
    // Re-render with same value
    rerender(<TextFilter column={column} />);
    expect(input).toHaveValue('preserved value');
  });

  it('updates when column filter value changes externally', () => {
    const column = createMockColumn('initial');
    const { rerender } = render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    expect(input).toHaveValue('initial');
    
    // Update column filter value
    column.getFilterValue = () => 'updated';
    rerender(<TextFilter column={column} />);
    
    expect(input).toHaveValue('updated');
  });

  it('handles paste events', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    
    // Simulate paste
    await user.click(input);
    await user.paste('pasted text');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith('pasted text');
    }, { timeout: 600 });
  });

  it('trims whitespace from filter value', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    await user.type(input, '  trimmed  ');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith('trimmed');
    }, { timeout: 600 });
  });

  it('applies custom className', () => {
    const column = createMockColumn();
    const { container } = render(<TextFilter column={column} className="custom-filter" />);
    
    expect(container.querySelector('.custom-filter')).toBeInTheDocument();
  });

  it('is accessible', () => {
    const column = createMockColumn();
    render(<TextFilter column={column} />);
    
    const input = screen.getByPlaceholderText('Filter Test Column...');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('aria-label', expect.stringContaining('Filter'));
  });
});