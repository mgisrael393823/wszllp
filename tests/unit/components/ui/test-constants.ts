// Test constants for DataTable components
// This file centralizes all test-related constants to make tests more maintainable

export const TEST_IDS = {
  // DataTable
  DATA_TABLE: 'data-table',
  TABLE_CONTENT: 'table-content',
  TABLE_FILTERS: 'table-filters',
  TABLE_PAGINATION: 'table-pagination',
  COLUMN_VISIBILITY_TOGGLE: 'column-visibility-toggle',
  
  // Pagination
  PAGINATION_FIRST: 'pagination-first',
  PAGINATION_PREVIOUS: 'pagination-previous', 
  PAGINATION_NEXT: 'pagination-next',
  PAGINATION_LAST: 'pagination-last',
  
  // Filters (dynamic based on column id)
  textFilter: (columnId: string) => `text-filter-${columnId}`,
  selectFilter: (columnId: string) => `select-filter-${columnId}`,
  dateRangeFilter: (columnId: string) => `date-range-filter-${columnId}`,
  dateFilterStart: (columnId: string) => `date-filter-start-${columnId}`,
  dateFilterEnd: (columnId: string) => `date-filter-end-${columnId}`,
  clearFilter: (columnId: string) => `clear-filter-${columnId}`,
} as const;

export const ARIA_LABELS = {
  // Filter accessibility labels
  filterColumn: (columnId: string) => `Filter ${columnId}`,
  clearFilter: (columnId: string) => `Clear ${columnId} filter`,
  startDate: (columnId: string) => `Start date for ${columnId} filter`,
  endDate: (columnId: string) => `End date for ${columnId} filter`,
  
  // Pagination accessibility labels
  FIRST_PAGE: 'Go to first page',
  PREVIOUS_PAGE: 'Go to previous page',
  NEXT_PAGE: 'Go to next page',
  LAST_PAGE: 'Go to last page',
} as const;

export const PLACEHOLDERS = {
  // Dynamic placeholders
  searchColumn: (columnId: string) => `Search ${columnId}...`,
  dateInput: 'yyyy-mm-dd',
} as const;

export const TEST_COLUMN_IDS = {
  NAME: 'name',
  STATUS: 'status',
  DATE: 'date',
  AMOUNT: 'amount',
  COMPLETE: 'isComplete',
  TEST_COLUMN: 'testColumn',
} as const;