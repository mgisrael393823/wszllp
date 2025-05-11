import { 
  useList, 
  useOne, 
  useCreate, 
  useUpdate, 
  useDelete,
  UseListProps,
  UseOneProps,
  UseCreateReturnType,
  UseUpdateReturnType,
  UseDeleteReturnType,
} from '@refinedev/core';
import { Contact } from '../../../types/schema';

/**
 * Custom hook for working with contacts
 * Provides simplified access to Refine's hooks for CRUD operations
 */
export const useContacts = () => {
  // These hooks need to be used directly in components, not wrapped in functions
  // This file serves as a documentation of available hooks

  return {
    // Use these hooks directly in your components:
    // 
    // List contacts:
    // const { data, isLoading } = useList<Contact>({ resource: "contacts" });
    //
    // Get one contact:
    // const { data } = useOne<Contact>({ resource: "contacts", id });
    //
    // Create contact:
    // const { mutate } = useCreate<Contact>();
    // mutate({ resource: "contacts", values: newContact });
    //
    // Update contact:
    // const { mutate } = useUpdate<Contact>();
    // mutate({ resource: "contacts", id, values: updatedContact });
    //
    // Delete contact:
    // const { mutate } = useDelete<Contact>();
    // mutate({ resource: "contacts", id });
  };
};