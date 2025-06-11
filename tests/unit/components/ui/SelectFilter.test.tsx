import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SelectFilter } from '@/components/ui/table-filters/SelectFilter';
import { Column } from '@tanstack/react-table';

// Mock column with options
const createMockColumn = (filterValue = '', options = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
]): Column<any, unknown> => ({
  id: 'status',
  getFilterValue: () => filterValue,
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
      filterOptions: options,
    },
  },
} as any);

describe('SelectFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with all options', () => {
    const column = createMockColumn();
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // Check for "All" option
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    
    // Check for defined options
    expect(screen.getByRole('option', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
  });

  it('displays current filter value', () => {
    const column = createMockColumn('active');
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('active');
  });

  it('calls setFilterValue when option is selected', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'inactive');
    
    expect(column.setFilterValue).toHaveBeenCalledWith('inactive');
  });

  it('clears filter when "All" is selected', async () => {
    const column = createMockColumn('active');
    const user = userEvent.setup();
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');
    
    expect(column.setFilterValue).toHaveBeenCalledWith(undefined);
  });

  it('shows item counts for each option', () => {
    const column = createMockColumn();
    render(<SelectFilter column={column} />);
    
    expect(screen.getByText('Active (5)')).toBeInTheDocument();
    expect(screen.getByText('Inactive (3)')).toBeInTheDocument();
    expect(screen.getByText('Pending (2)')).toBeInTheDocument();
  });

  it('handles missing filterOptions gracefully', () => {
    const column = createMockColumn();
    column.columnDef.meta = { filterVariant: 'select' };
    
    render(<SelectFilter column={column} />);
    
    // Should still render with just "All" option
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
  });

  it('updates when filter value changes externally', () => {
    const column = createMockColumn('active');
    const { rerender } = render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('active');
    
    // Update column filter value
    column.getFilterValue = () => 'pending';
    rerender(<SelectFilter column={column} />);
    
    expect(select).toHaveValue('pending');
  });

  it('handles options with numeric values', async () => {
    const numericOptions = [
      { label: 'Priority 1', value: 1 },
      { label: 'Priority 2', value: 2 },
      { label: 'Priority 3', value: 3 },
    ];
    const column = createMockColumn('', numericOptions);
    const user = userEvent.setup();
    
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '2');
    
    expect(column.setFilterValue).toHaveBeenCalledWith(2);
  });

  it('handles options with boolean values', async () => {
    const booleanOptions = [
      { label: 'Completed', value: true },
      { label: 'Not Completed', value: false },
    ];
    const column = createMockColumn('', booleanOptions);
    const user = userEvent.setup();
    
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'true');
    
    expect(column.setFilterValue).toHaveBeenCalledWith(true);
  });

  it('applies custom className', () => {
    const column = createMockColumn();
    const { container } = render(<SelectFilter column={column} className="custom-select" />);
    
    expect(container.querySelector('.custom-select')).toBeInTheDocument();
  });

  it('disables options with zero count', () => {
    const column = createMockColumn();
    column.getFacetedUniqueValues = () => new Map([
      ['active', 5],
      ['inactive', 0],
      ['pending', 2],
    ]);
    
    render(<SelectFilter column={column} />);
    
    const inactiveOption = screen.getByRole('option', { name: 'Inactive (0)' });
    expect(inactiveOption).toBeDisabled();
  });

  it('handles keyboard navigation', async () => {
    const column = createMockColumn();
    const user = userEvent.setup();
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.click(select);
    
    // Navigate with keyboard
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    
    expect(column.setFilterValue).toHaveBeenCalledWith('inactive');
  });

  it('is accessible', () => {
    const column = createMockColumn();
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-label', expect.stringContaining('Filter Status'));
  });

  it('handles very long option lists', () => {
    const manyOptions = Array.from({ length: 50 }, (_, i) => ({
      label: `Option ${i + 1}`,
      value: `option_${i + 1}`,
    }));
    const column = createMockColumn('', manyOptions);
    
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    // All options should be rendered
    expect(screen.getAllByRole('option')).toHaveLength(51); // 50 + "All" option
  });

  it('handles special characters in option values', async () => {
    const specialOptions = [
      { label: 'With Space', value: 'with space' },
      { label: 'With-Dash', value: 'with-dash' },
      { label: 'With_Underscore', value: 'with_underscore' },
    ];
    const column = createMockColumn('', specialOptions);
    const user = userEvent.setup();
    
    render(<SelectFilter column={column} />);
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'with space');
    
    expect(column.setFilterValue).toHaveBeenCalledWith('with space');
  });
});