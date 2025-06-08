import React, { useState } from 'react';
import { useList, useDelete } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Users, Mail, Phone, Search } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Table from '../ui/Table';
import Input from '../ui/Input';
import Pagination from '../ui/Pagination';
import { Contact } from '../../types/schema';

interface ContactListProps {
  searchTerm?: string;
  filter?: string;
}

const ContactList: React.FC<ContactListProps> = ({ 
  searchTerm = '',
  filter = 'all'
}) => {
  const navigate = useNavigate();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Show 20 contacts per page
  
  // Build filters based on search term and filter type
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
  
  // Use Refine's useList hook to get contacts with pagination
  const { data, isLoading, isError } = useList<Contact>({
    resource: 'contacts',
    filters,
    sorters: [{ field: 'name', order: 'asc' }],
    pagination: {
      current: currentPage,
      pageSize: itemsPerPage,
    },
  });
  
  // Set up delete hook
  const { mutate: deleteContact } = useDelete();
  
  const contacts = data?.data || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Handle delete contact
  const handleDeleteContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    // Confirm before deleting
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
  
  // Column definitions for the table
  const columns = [
    {
      header: 'Name',
      accessor: (item: Contact) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
            {item.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="font-medium text-neutral-900">{item.name}</div>
            <div className="text-sm text-neutral-500">{item.role || 'Contact'}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Email',
      accessor: (item: Contact) => (
        <div className="flex items-center">
          <Mail size={16} className="text-neutral-400 mr-2" />
          <span>{item.email || '—'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Phone',
      accessor: (item: Contact) => (
        <div className="flex items-center">
          <Phone size={16} className="text-neutral-400 mr-2" />
          <span>{item.phone || '—'}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (item: Contact) => (
        <div className="flex space-x-2">
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${item.id}`)}
            icon={<Eye size={16} />}
            aria-label="View contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={() => navigate(`/contacts/${item.id}/edit`)}
            icon={<Edit size={16} />}
            aria-label="Edit contact"
          />
          <Button
            variant="text"
            size="sm"
            onClick={(e) => handleDeleteContact(item.id, e)}
            icon={<Trash2 size={16} />}
            aria-label="Delete contact"
          />
        </div>
      ),
    },
  ];
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  return (
    <Card>
      {/* Search bar within the list component */}
      <div className="p-4 border-b border-neutral-200">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-neutral-400" />
          </div>
          <Input
            type="text"
            placeholder="Search contacts..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="pl-10"
            fullWidth
          />
        </div>
      </div>
      
      {/* Contacts table */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-500">Loading contacts...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center">
          <div className="text-error-500 bg-error-50 p-4 rounded-md inline-flex items-center mb-2">
            <span className="mr-2">⚠️</span> Error loading contacts
          </div>
          <p className="text-neutral-500">Please try again later</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto h-24 w-24 text-neutral-400">
            <Users size={64} className="mx-auto" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-neutral-900">No contacts found</h3>
          <p className="mt-1 text-neutral-500">
            {localSearchTerm
              ? `No results found for "${localSearchTerm}"`
              : "Get started by adding your first contact"}
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => navigate('/contacts/new')}
            >
              Add Contact
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Table
            data={contacts}
            columns={columns}
            keyField="id"
            onRowClick={(item) => navigate(`/contacts/${item.id}`)}
          />
          {totalPages > 1 && (
            <div className="p-4 border-t border-neutral-200">
              <Pagination
                currentPage={currentPage}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default ContactList;