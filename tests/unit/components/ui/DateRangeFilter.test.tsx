import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DateRangeFilter } from '@/components/ui/table-filters/DateRangeFilter';
import { Column } from '@tanstack/react-table';

// Mock column
const createMockColumn = (filterValue: [string, string] | undefined = undefined): Column<any, unknown> => ({
  id: 'dateColumn',
  getFilterValue: () => filterValue,
  setFilterValue: vi.fn(),
  getFacetedUniqueValues: () => new Map(),
  getFacetedMinMaxValues: () => ['2024-01-01', '2024-12-31'],
  columnDef: {
    accessorKey: 'date',
    header: 'Date',
  },
} as any);

describe('DateRangeFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders start and end date inputs', () => {
    const column = createMockColumn();
    render(<DateRangeFilter column={column} />);
    
    expect(screen.getByLabelText('Start date')).toBeInTheDocument();
    expect(screen.getByLabelText('End date')).toBeInTheDocument();
  });

  it('displays current filter values', () => {
    const column = createMockColumn(['2024-03-01', '2024-03-31']);
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    expect(startInput).toHaveValue('2024-03-01');
    expect(endInput).toHaveValue('2024-03-31');
  });

  it('calls setFilterValue when start date changes', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    await user.type(startInput, '2024-05-15');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(['2024-05-15', '']);
    });
  });

  it('calls setFilterValue when end date changes', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const endInput = screen.getByLabelText('End date');
    await user.type(endInput, '2024-06-30');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(['', '2024-06-30']);
    });
  });

  it('updates both dates', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    await user.type(startInput, '2024-01-01');
    await user.type(endInput, '2024-12-31');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenLastCalledWith(['2024-01-01', '2024-12-31']);
    });
  });

  it('clears filter when both dates are empty', async () => {
    const column = createMockColumn(['2024-03-01', '2024-03-31']);
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    await user.clear(startInput);
    await user.clear(endInput);
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(undefined);
    });
  });

  it('shows min and max dates from faceted values', () => {
    const column = createMockColumn();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    expect(startInput).toHaveAttribute('min', '2024-01-01');
    expect(startInput).toHaveAttribute('max', '2024-12-31');
    expect(endInput).toHaveAttribute('min', '2024-01-01');
    expect(endInput).toHaveAttribute('max', '2024-12-31');
  });

  it('validates date range (end date cannot be before start date)', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    await user.type(startInput, '2024-06-01');
    await user.type(endInput, '2024-05-01');
    
    // End date should be constrained to start date minimum
    expect(endInput).toHaveAttribute('min', '2024-06-01');
  });

  it('handles invalid date inputs gracefully', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    
    // Try to input invalid date
    await user.type(startInput, 'invalid-date');
    
    // Browser should handle validation, filter should not be called with invalid date
    expect(column.setFilterValue).not.toHaveBeenCalledWith(['invalid-date', '']);
  });

  it('preserves partial date ranges', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    
    // Only set start date
    await user.type(startInput, '2024-07-01');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(['2024-07-01', '']);
    });
  });

  it('handles date picker interactions', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    
    // Click to open date picker
    await user.click(startInput);
    
    // Input should be focused
    expect(startInput).toHaveFocus();
  });

  it('applies custom className', () => {
    const column = createMockColumn();
    const { container } = render(<DateRangeFilter column={column} className="custom-date-filter" />);
    
    expect(container.querySelector('.custom-date-filter')).toBeInTheDocument();
  });

  it('updates when filter value changes externally', () => {
    const column = createMockColumn();
    const { rerender } = render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    expect(startInput).toHaveValue('');
    expect(endInput).toHaveValue('');
    
    // Update column filter value
    column.getFilterValue = () => ['2024-08-01', '2024-08-31'];
    rerender(<DateRangeFilter column={column} />);
    
    expect(startInput).toHaveValue('2024-08-01');
    expect(endInput).toHaveValue('2024-08-31');
  });

  it('handles keyboard navigation', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    // Tab between inputs
    await user.click(startInput);
    await user.tab();
    
    expect(endInput).toHaveFocus();
  });

  it('is accessible', () => {
    const column = createMockColumn();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    expect(startInput).toHaveAttribute('type', 'date');
    expect(endInput).toHaveAttribute('type', 'date');
    expect(startInput).toHaveAttribute('aria-label', expect.stringContaining('Start date'));
    expect(endInput).toHaveAttribute('aria-label', expect.stringContaining('End date'));
  });

  it('shows date format placeholder', () => {
    const column = createMockColumn();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    // Date inputs should have proper placeholders
    expect(startInput).toHaveAttribute('placeholder', 'yyyy-mm-dd');
    expect(endInput).toHaveAttribute('placeholder', 'yyyy-mm-dd');
  });

  it('handles different date formats', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    
    // Input date in ISO format
    await user.type(startInput, '2024-09-15');
    
    await waitFor(() => {
      expect(column.setFilterValue).toHaveBeenCalledWith(['2024-09-15', '']);
    });
  });

  it('handles edge cases for date boundaries', () => {
    const column = createMockColumn();
    column.getFacetedMinMaxValues = () => undefined;
    
    render(<DateRangeFilter column={column} />);
    
    const startInput = screen.getByLabelText('Start date');
    const endInput = screen.getByLabelText('End date');
    
    // Should not have min/max when faceted values are undefined
    expect(startInput).not.toHaveAttribute('min');
    expect(startInput).not.toHaveAttribute('max');
    expect(endInput).not.toHaveAttribute('min');
    expect(endInput).not.toHaveAttribute('max');
  });
});