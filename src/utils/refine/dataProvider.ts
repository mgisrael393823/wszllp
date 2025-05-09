import { DataProvider } from "@refinedev/core";
import { v4 as uuidv4 } from 'uuid';

// Define a data provider that works with the existing DataContext
export const createContextDataProvider = (state: any, dispatch: any): DataProvider => ({
  getList: async ({ resource, pagination, filters, sorters }) => {
    // Get the data from state based on the resource type
    let data = [];
    
    if (resource === "contacts") {
      data = state.contacts || [];
    }
    
    // Apply filters if provided
    if (filters && filters.length > 0) {
      data = data.filter((item: any) => {
        return filters.every((filter) => {
          const { field, operator, value } = filter;
          
          switch (operator) {
            case "eq":
              return item[field] === value;
            case "ne":
              return item[field] !== value;
            case "contains":
              return String(item[field]).toLowerCase().includes(String(value).toLowerCase());
            case "in":
              return value.includes(item[field]);
            default:
              return true;
          }
        });
      });
    }
    
    // Apply sorting if provided
    if (sorters && sorters.length > 0) {
      data = [...data].sort((a, b) => {
        for (const sorter of sorters) {
          const { field, order } = sorter;
          const orderFactor = order === "asc" ? 1 : -1;
          
          if (a[field] < b[field]) return -1 * orderFactor;
          if (a[field] > b[field]) return 1 * orderFactor;
        }
        return 0;
      });
    }
    
    // Apply pagination if provided
    let total = data.length;
    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      data = data.slice(start, end);
    }
    
    return {
      data,
      total,
    };
  },
  
  getOne: async ({ resource, id }) => {
    let data = null;
    
    if (resource === "contacts") {
      data = (state.contacts || []).find((item: any) => item.contactId === id);
    }
    
    if (!data) {
      throw new Error(`${resource} with id "${id}" not found`);
    }
    
    return {
      data,
    };
  },
  
  create: async ({ resource, variables }) => {
    if (resource === "contacts") {
      const newContact = {
        ...variables,
        contactId: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({
        type: 'ADD_CONTACT',
        payload: newContact,
      });
      
      return {
        data: newContact,
      };
    }
    
    throw new Error(`Resource "${resource}" is not supported`);
  },
  
  update: async ({ resource, id, variables }) => {
    if (resource === "contacts") {
      const contacts = state.contacts || [];
      const contactIndex = contacts.findIndex((item: any) => item.contactId === id);
      
      if (contactIndex === -1) {
        throw new Error(`Contact with id "${id}" not found`);
      }
      
      const updatedContact = {
        ...contacts[contactIndex],
        ...variables,
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({
        type: 'UPDATE_CONTACT',
        payload: {
          id,
          contact: updatedContact,
        },
      });
      
      return {
        data: updatedContact,
      };
    }
    
    throw new Error(`Resource "${resource}" is not supported`);
  },
  
  deleteOne: async ({ resource, id }) => {
    if (resource === "contacts") {
      const contacts = state.contacts || [];
      const contactIndex = contacts.findIndex((item: any) => item.contactId === id);
      
      if (contactIndex === -1) {
        throw new Error(`Contact with id "${id}" not found`);
      }
      
      const deletedContact = contacts[contactIndex];
      
      dispatch({
        type: 'DELETE_CONTACT',
        payload: id,
      });
      
      return {
        data: deletedContact,
      };
    }
    
    throw new Error(`Resource "${resource}" is not supported`);
  },
  
  getApiUrl: () => {
    return "";
  },
  
  custom: async () => {
    throw new Error("Custom method is not implemented");
  },
});