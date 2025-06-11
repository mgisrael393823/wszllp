import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

// Mock data for tests
interface TestData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  date: string;
  amount: number;
  isComplete: boolean;
}

const mockData: TestData[] = [
  { id: '1', name: 'Item 1', status: 'active', date: '2024-01-15', amount: 100, isComplete: true },
  { id: '2', name: 'Item 2', status: 'inactive', date: '2024-02-20', amount: 200, isComplete: false },
  { id: '3', name: 'Item 3', status: 'pending', date: '2024-03-25', amount: 300, isComplete: true },
  { id: '4', name: 'Test Item', status: 'active', date: '2024-04-10', amount: 150, isComplete: false },
  { id: '5', name: 'Another Test', status: 'active', date: '2024-05-05', amount: 250, isComplete: true },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      filterVariant: 'text',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterVariant: 'select',
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
      ],
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    meta: {
      filterVariant: 'date-range',
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => `$${row.original.amount}`,
  },
  {
    accessorKey: 'isComplete',
    header: 'Complete',
    cell: ({ row }) => (row.original.isComplete ? 'Yes' : 'No'),
  },
];

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Core Rendering', () => {
    it('renders table with data', () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<DataTable data={[]} columns={columns} />);
      
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(<DataTable data={[]} columns={columns} isLoading />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders error state', () => {
      const error = new Error('Failed to load data');
      render(<DataTable data={[]} columns={columns} error={error} />);
      
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <DataTable data={mockData} columns={columns} className="custom-table" />
      );
      
      expect(container.querySelector('.custom-table')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by column when header is clicked', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const nameHeader = screen.getByText('Name');
      
      // Get initial order
      const initialRows = screen.getAllByRole('row');
      expect(initialRows[1]).toHaveTextContent('Item 1');
      
      // Click to sort ascending
      await userEvent.click(nameHeader);
      
      await waitFor(() => {
        const sortedRows = screen.getAllByRole('row');
        expect(sortedRows[1]).toHaveTextContent('Another Test');
      });
      
      // Click again to sort descending
      await userEvent.click(nameHeader);
      
      await waitFor(() => {
        const sortedRows = screen.getAllByRole('row');
        expect(sortedRows[1]).toHaveTextContent('Test Item');
      });
    });

    it('shows sort indicators', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const nameHeader = screen.getByText('Name');
      await userEvent.click(nameHeader);
      
      // Should show ascending indicator
      expect(nameHeader.closest('th')).toHaveTextContent('▲');
      
      await userEvent.click(nameHeader);
      
      // Should show descending indicator
      expect(nameHeader.closest('th')).toHaveTextContent('▼');
    });
  });

  describe('Filtering', () => {
    it('filters by text input', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const textFilter = screen.getByPlaceholderText('Filter Name...');
      
      await userEvent.type(textFilter, 'Test');
      
      await waitFor(() => {
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText('Another Test')).toBeInTheDocument();
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      });
    });

    it('filters by select dropdown', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const selectFilter = screen.getByRole('combobox', { name: /filter status/i });
      
      await userEvent.selectOptions(selectFilter, 'active');
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.queryByText('Item 2')).not.toBeInTheDocument();
      });
    });

    it('clears filters when clear button is clicked', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const textFilter = screen.getByPlaceholderText('Filter Name...');
      await userEvent.type(textFilter, 'Test');
      
      await waitFor(() => {
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      });
      
      const clearButton = screen.getByText('Clear Filters');
      await userEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(textFilter).toHaveValue('');
      });
    });

    it('handles date range filtering', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      const startDateInput = screen.getByLabelText('Start date');
      const endDateInput = screen.getByLabelText('End date');
      
      await userEvent.type(startDateInput, '2024-02-01');
      await userEvent.type(endDateInput, '2024-04-30');
      
      await waitFor(() => {
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('Item 3')).toBeInTheDocument();
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Another Test')).not.toBeInTheDocument();
      });
    });
  });

  describe('Row Selection', () => {
    it('selects individual rows', async () => {
      const onRowSelectionChange = vi.fn();
      render(
        <DataTable 
          data={mockData} 
          columns={columns} 
          enableRowSelection
          onRowSelectionChange={onRowSelectionChange}
        />
      );
      
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
      
      await userEvent.click(firstRowCheckbox);
      
      expect(firstRowCheckbox).toBeChecked();
      expect(onRowSelectionChange).toHaveBeenCalledWith(expect.objectContaining({
        '1': true
      }));
    });

    it('selects all rows with header checkbox', async () => {
      const onRowSelectionChange = vi.fn();
      render(
        <DataTable 
          data={mockData} 
          columns={columns} 
          enableRowSelection
          onRowSelectionChange={onRowSelectionChange}
        />
      );
      
      const headerCheckbox = screen.getAllByRole('checkbox')[0];
      
      await userEvent.click(headerCheckbox);
      
      expect(headerCheckbox).toBeChecked();
      expect(onRowSelectionChange).toHaveBeenCalledWith({
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true,
      });
    });
  });

  describe('Pagination', () => {
    it('paginates data correctly', async () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
        status: 'active' as const,
        date: '2024-01-01',
        amount: 100,
        isComplete: false,
      }));
      
      render(<DataTable data={largeData} columns={columns} />);
      
      // Should show first page items
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 10')).toBeInTheDocument();
      expect(screen.queryByText('Item 11')).not.toBeInTheDocument();
      
      // Click next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);
      
      // Should show second page items
      await waitFor(() => {
        expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
        expect(screen.getByText('Item 11')).toBeInTheDocument();
        expect(screen.getByText('Item 20')).toBeInTheDocument();
      });
      
      // Click last page
      const lastButton = screen.getByRole('button', { name: /last/i });
      await userEvent.click(lastButton);
      
      // Should show last page items
      await waitFor(() => {
        expect(screen.getByText('Item 21')).toBeInTheDocument();
        expect(screen.getByText('Item 25')).toBeInTheDocument();
      });
    });

    it('changes page size', async () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
        status: 'active' as const,
        date: '2024-01-01',
        amount: 100,
        isComplete: false,
      }));
      
      render(<DataTable data={largeData} columns={columns} />);
      
      // Initially shows 10 items
      expect(screen.getByText('Item 10')).toBeInTheDocument();
      expect(screen.queryByText('Item 11')).not.toBeInTheDocument();
      
      // Change to 25 items per page
      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      await userEvent.selectOptions(pageSizeSelect, '25');
      
      await waitFor(() => {
        expect(screen.getByText('Item 25')).toBeInTheDocument();
        expect(screen.queryByText('Item 26')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large datasets efficiently', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
        status: ['active', 'inactive', 'pending'][i % 3] as TestData['status'],
        date: new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 1000),
        isComplete: i % 2 === 0,
      }));
      
      const { container } = render(<DataTable data={largeData} columns={columns} />);
      
      // Should only render visible rows (10 by default)
      const rows = container.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(10);
    });

    it('handles custom cell renderers', () => {
      const customColumns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'status',
          header: 'Status',
          cell: ({ row }) => (
            <span className={`status-${row.original.status}`}>
              {row.original.status.toUpperCase()}
            </span>
          ),
        },
      ];
      
      render(<DataTable data={mockData} columns={customColumns} />);
      
      const statusCell = screen.getByText('ACTIVE');
      expect(statusCell).toHaveClass('status-active');
    });

    it('handles column visibility toggle', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      // Assuming column visibility is handled via a dropdown
      const visibilityButton = screen.getByRole('button', { name: /columns/i });
      await userEvent.click(visibilityButton);
      
      const amountCheckbox = screen.getByRole('checkbox', { name: /amount/i });
      await userEvent.click(amountCheckbox);
      
      await waitFor(() => {
        expect(screen.queryByText('Amount')).not.toBeInTheDocument();
        expect(screen.queryByText('$100')).not.toBeInTheDocument();
      });
    });

    it('maintains filter state during sorting', async () => {
      render(<DataTable data={mockData} columns={columns} />);
      
      // Apply filter
      const textFilter = screen.getByPlaceholderText('Filter Name...');
      await userEvent.type(textFilter, 'Item');
      
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Item')).toBeInTheDocument();
        expect(screen.queryByText('Another Test')).not.toBeInTheDocument();
      });
      
      // Sort while filtered
      const nameHeader = screen.getByText('Name');
      await userEvent.click(nameHeader);
      
      // Should maintain filter
      await waitFor(() => {
        expect(screen.queryByText('Another Test')).not.toBeInTheDocument();
        const rows = screen.getAllByRole('row');
        expect(rows[1]).toHaveTextContent('Item 1');
      });
    });
  });
});