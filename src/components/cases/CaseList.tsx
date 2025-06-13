import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '../../lib/supabaseClient';
import { DataTable } from '../ui/DataTable';
import { commonColumns } from '../ui/table-columns/common-columns';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';
import { useData } from '../../context/DataContext';

interface Case {
  caseId: string;
  plaintiff: string;
  defendant: string;
  address: string;
  status: string;
  dateFiled: string | null;
  createdAt: string;
  updatedAt: string;
}

const CaseList: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useData();
  const [apiCases, setApiCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check if we have local cases from DataContext
  const hasLocalCases = state.cases.length > 0;
  
  // Use local cases first, fallback to API data
  const cases = hasLocalCases ? state.cases : apiCases;

  useEffect(() => {
    // Only fetch from API if we don't have local cases
    if (!hasLocalCases) {
      fetchCases();
    } else {
      setIsLoading(false);
      setError(null);
    }
  }, [hasLocalCases]);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('cases').select('*');

      if (error) throw error;

      const mappedCases: Case[] = data.map((c) => ({
        caseId: c.id,
        plaintiff: c.plaintiff,
        defendant: c.defendant,
        address: c.address || '',
        status: c.status,
        dateFiled: c.dateFiled || null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));

      // Add sample data ONLY in development
      if (import.meta.env.DEV && mappedCases.length === 0) {
        const sampleCases: Case[] = [
          {
            caseId: 'CASE-2024-001',
            plaintiff: 'Johnson Property Management LLC',
            defendant: 'Sarah Williams',
            address: '123 Oak Street, Apt 4B, New York, NY 10001',
            status: 'Active',
            dateFiled: '2024-01-15T00:00:00Z',
            createdAt: '2024-01-10T09:00:00Z',
            updatedAt: '2024-03-01T14:30:00Z'
          },
          {
            caseId: 'CASE-2024-002',
            plaintiff: 'Riverside Apartments Inc.',
            defendant: 'Michael Chen',
            address: '456 River Road, Unit 12, Brooklyn, NY 11201',
            status: 'Pending',
            dateFiled: '2024-02-20T00:00:00Z',
            createdAt: '2024-02-15T10:30:00Z',
            updatedAt: '2024-02-25T16:45:00Z'
          },
          {
            caseId: 'CASE-2024-003',
            plaintiff: 'Urban Living Properties',
            defendant: 'Emily Rodriguez and James Rodriguez',
            address: '789 Park Avenue, Suite 5A, Manhattan, NY 10016',
            status: 'Completed',
            dateFiled: '2024-01-05T00:00:00Z',
            createdAt: '2024-01-02T08:15:00Z',
            updatedAt: '2024-02-10T11:20:00Z'
          },
          {
            caseId: 'CASE-2024-004',
            plaintiff: 'Greenfield Estates LLC',
            defendant: 'David Thompson',
            address: '321 Elm Street, Garden City, NY 11530',
            status: 'Active',
            dateFiled: '2024-03-01T00:00:00Z',
            createdAt: '2024-02-28T13:00:00Z',
            updatedAt: '2024-03-05T09:30:00Z'
          },
          {
            caseId: 'CASE-2024-005',
            plaintiff: 'Metropolitan Housing Corp.',
            defendant: 'Jessica Anderson',
            address: '555 Broadway, Apt 8C, New York, NY 10012',
            status: 'Overdue',
            dateFiled: '2024-01-25T00:00:00Z',
            createdAt: '2024-01-20T11:45:00Z',
            updatedAt: '2024-03-10T15:00:00Z'
          },
          {
            caseId: 'CASE-2024-006',
            plaintiff: 'Sunset Properties Management',
            defendant: 'Robert Martinez',
            address: '777 Sunset Blvd, Unit 3F, Queens, NY 11375',
            status: 'Active',
            dateFiled: '2024-02-10T00:00:00Z',
            createdAt: '2024-02-08T09:30:00Z',
            updatedAt: '2024-02-28T14:15:00Z'
          },
          {
            caseId: 'CASE-2024-007',
            plaintiff: 'Harbor View Apartments',
            defendant: 'Lisa Kim and John Kim',
            address: '999 Harbor Drive, Apt 15B, Staten Island, NY 10301',
            status: 'Pending',
            dateFiled: '2024-03-05T00:00:00Z',
            createdAt: '2024-03-02T10:00:00Z',
            updatedAt: '2024-03-08T16:30:00Z'
          },
          {
            caseId: 'CASE-2024-008',
            plaintiff: 'City Central Properties',
            defendant: 'Anthony Brown',
            address: '100 Central Park West, Unit 20A, New York, NY 10023',
            status: 'Completed',
            dateFiled: '2023-12-15T00:00:00Z',
            createdAt: '2023-12-10T08:00:00Z',
            updatedAt: '2024-01-30T12:00:00Z'
          },
          {
            caseId: 'CASE-2024-009',
            plaintiff: 'Lakeside Rentals LLC',
            defendant: 'Maria Garcia',
            address: '222 Lake Shore Drive, Apt 7D, White Plains, NY 10601',
            status: 'Active',
            dateFiled: '2024-02-28T00:00:00Z',
            createdAt: '2024-02-25T14:00:00Z',
            updatedAt: '2024-03-12T10:45:00Z'
          },
          {
            caseId: 'CASE-2024-010',
            plaintiff: 'Premier Property Solutions',
            defendant: 'Christopher Wilson',
            address: '444 Madison Avenue, Suite 12B, New York, NY 10022',
            status: 'Draft',
            dateFiled: null,
            createdAt: '2024-03-10T11:30:00Z',
            updatedAt: '2024-03-10T11:30:00Z'
          },
          {
            caseId: 'CASE-2024-011',
            plaintiff: 'Brooklyn Heights Management',
            defendant: 'Jennifer Davis',
            address: '888 Court Street, Apt 9A, Brooklyn, NY 11231',
            status: 'Active',
            dateFiled: '2024-01-30T00:00:00Z',
            createdAt: '2024-01-28T09:15:00Z',
            updatedAt: '2024-02-15T13:30:00Z'
          },
          {
            caseId: 'CASE-2024-012',
            plaintiff: 'Queens Plaza Associates',
            defendant: 'Kevin Lee and Susan Lee',
            address: '333 Queens Plaza, Unit 18C, Long Island City, NY 11101',
            status: 'Pending',
            dateFiled: '2024-03-08T00:00:00Z',
            createdAt: '2024-03-06T15:45:00Z',
            updatedAt: '2024-03-09T08:20:00Z'
          },
          {
            caseId: 'CASE-2024-013',
            plaintiff: 'Manhattan Towers LLC',
            defendant: 'Patricia Taylor',
            address: '666 Lexington Avenue, Apt 25F, New York, NY 10065',
            status: 'Completed',
            dateFiled: '2024-01-10T00:00:00Z',
            createdAt: '2024-01-08T10:30:00Z',
            updatedAt: '2024-02-20T14:00:00Z'
          },
          {
            caseId: 'CASE-2024-014',
            plaintiff: 'Westside Property Group',
            defendant: 'Daniel Moore',
            address: '111 West End Avenue, Unit 4G, New York, NY 10024',
            status: 'Active',
            dateFiled: '2024-02-15T00:00:00Z',
            createdAt: '2024-02-12T12:00:00Z',
            updatedAt: '2024-03-01T09:15:00Z'
          },
          {
            caseId: 'CASE-2024-015',
            plaintiff: 'Bronx Housing Partners',
            defendant: 'Michelle Jackson',
            address: '555 Grand Concourse, Apt 11B, Bronx, NY 10451',
            status: 'Overdue',
            dateFiled: '2024-01-20T00:00:00Z',
            createdAt: '2024-01-18T08:45:00Z',
            updatedAt: '2024-03-11T16:00:00Z'
          }
        ];
        
        setApiCases(sampleCases);
        console.log('📊 Loaded sample data for development (TanStack Table Demo)');
      } else {
        setApiCases(mappedCases);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Case>[] = [
    {
      accessorKey: 'plaintiff',
      header: 'Plaintiff',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'defendant',
      header: 'Defendant',
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'address',
      header: 'Address',
      meta: {
        filterVariant: 'text',
      },
    },
    commonColumns.status<Case>('status'),
    commonColumns.date<Case>('dateFiled', 'Date Filed'),
  ];

  return (
    <DataTable
      data={cases}
      columns={columns}
      isLoading={isLoading}
      error={error}
      onRowClick={(row) => navigate(`/cases/${row.caseId}`)}
      enableRowSelection
    />
  );
};

export default CaseList;