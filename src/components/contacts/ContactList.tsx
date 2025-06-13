import React, { useState, useMemo } from 'react';
import { useList, useDelete } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, Eye, Users, Mail, Phone } from 'lucide-react';
import { DataTable } from '../ui/DataTable';
import Button from '../ui/Button';
import { Contact } from '../../types/schema';
import { useData } from '../../context/DataContext';

interface ContactListProps {
  searchTerm?: string;
  filter?: string;
}

const ContactList: React.FC<ContactListProps> = ({ 
  searchTerm = '',
  filter = 'all'
}) => {
  const navigate = useNavigate();
  const { state } = useData();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Check if we have contacts in DataContext
  const hasLocalContacts = state.contacts && state.contacts.length > 0;
  
  // Filter local contacts based on search and filter
  const localContacts = useMemo(() => {
    if (!hasLocalContacts) return [];
    
    let filtered = state.contacts;
    
    // Apply search filter
    if (localSearchTerm) {
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        contact.phone?.includes(localSearchTerm)
      );
    }
    
    // Apply role filter
    if (filter && filter !== 'all') {
      filtered = filtered.filter(contact => contact.role === filter);
    }
    
    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.contacts, localSearchTerm, filter, hasLocalContacts]);
  
  // Build filters for Supabase query
  const filters = [];
  
  if (localSearchTerm) {
    filters.push({
      field: 'name',
      operator: 'contains',
      value: localSearchTerm,
    });
  }
  
  if (filter && filter !== 'all') {
    filters.push({
      field: 'role',
      operator: 'eq',
      value: filter,
    });
  }
  
  // Only use Supabase if no local contacts
  const { data, isLoading, isError } = useList<Contact>({
    resource: 'contacts',
    filters,
    sorters: [{ field: 'name', order: 'asc' }],
    pagination: {
      current: currentPage,
      pageSize: itemsPerPage,
    },
    queryOptions: {
      enabled: !hasLocalContacts, // Only query if no local data
    }
  });
  
  // Set up delete hook
  const { mutate: deleteContact } = useDelete();
  
  // Use local contacts if available, otherwise use Supabase data
  const contacts = hasLocalContacts ? localContacts : (data?.data || []);
  const totalCount = hasLocalContacts ? localContacts.length : (data?.total || 0);
  
  // Handle delete contact
  const handleDeleteContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(
        {
          resource: 'contacts',
          id,
        },
        {
          onSuccess: () => {
            // The list will refresh automatically
          },
        }
      );
    }
  };
  
  // Column definitions for TanStack Table
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            {row.original.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="font-medium text-neutral-900">{row.original.name}</div>
            <div className="text-sm text-neutral-500">{row.original.role || 'Contact'}</div>
          </div>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail size={16} className="text-neutral-400 mr-2" />
          <span>{row.original.email || '—'}</span>
        </div>
      ),
      meta: {
        filterVariant: 'text',
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center">
          <Phone size={16} className="text-neutral-400 mr-2" />
          <span>{row.original.phone || '—'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      meta: {
        filterVariant: 'select',
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${row.original.contactId || row.original.id}`)}
            icon={<Eye size={16} />}
            aria-label="View contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${row.original.contactId || row.original.id}/edit`)}
            icon={<Edit size={16} />}
            aria-label="Edit contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={(e) => handleDeleteContact(row.original.contactId || row.original.id, e)}
            icon={<Trash2 size={16} />}
            aria-label="Delete contact"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Handle error state
  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <div className="text-error-500 bg-error-50 p-4 rounded-md inline-flex items-center mb-2">
          <span className="mr-2">⚠️</span> Error loading contacts
        </div>
        <p className="text-neutral-500">Please try again later</p>
      </div>
    );
  }

  // Handle empty state
  if (!isLoading && contacts.length === 0 && !localSearchTerm) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-neutral-200">
        <div className="mx-auto h-24 w-24 text-neutral-400">
          <Users size={64} className="mx-auto" />
        </div>
        <h3 className="mt-2 text-lg font-medium text-neutral-900">No contacts found</h3>
        <p className="mt-1 text-neutral-500">Get started by adding your first contact</p>
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() => navigate('/contacts/new')}
          >
            Add Contact
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <DataTable
      data={contacts}
      columns={columns}
      isLoading={isLoading}
      error={isError ? new Error('Failed to load contacts') : null}
      onRowClick={(row) => navigate(`/contacts/${row.contactId || row.id}`)}
      enableRowSelection
    />
  );
};

export default ContactList;