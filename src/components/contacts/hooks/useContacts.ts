import { 
  useList, 
  useOne, 
  useCreate, 
  useUpdate, 
  useDelete
} from '@refinedev/core';
import { Contact } from '../../../types/schema';

/**
 * Custom hook for working with contacts
 * Provides simplified access to Refine's hooks for CRUD operations
 */
export const useContacts = () => {
  // Get all contacts
  const getAllContacts = (
    filters?: any[],
    sorters?: any[],
    pagination?: { current?: number; pageSize?: number }
  ) => {
    return useList<Contact>({
      resource: "contacts",
      filters,
      sorters,
      pagination
    });
  };
  
  // Get a single contact by ID
  const getContact = (id: string) => {
    return useOne<Contact>({
      resource: "contacts",
      id,
    });
  };
  
  // Create a new contact
  const createContact = () => {
    return useCreate<Contact>();
  };
  
  // Update an existing contact
  const updateContact = () => {
    return useUpdate<Contact>();
  };
  
  // Delete a contact
  const deleteContact = () => {
    return useDelete<Contact>();
  };
  
  return {
    getAllContacts,
    getContact,
    createContact,
    updateContact,
    deleteContact
  };
};