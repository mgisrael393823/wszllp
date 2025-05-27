import { DataProvider, BaseRecord, GetListParams, CreateParams, UpdateParams, DeleteOneParams, GetOneParams } from "@refinedev/core";
import { supabase } from '../../lib/supabaseClient';
import { getTableName, isSandboxUser } from '../sandbox';

/**
 * Enhanced Supabase Data Provider with Sandbox Support
 * Automatically routes to sandbox tables for demo user
 */
export const createSandboxDataProvider = (): DataProvider => {
  const getCurrentUserEmail = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  };

  return {
    getList: async ({ resource, pagination, sorters, filters, meta }: GetListParams) => {
      const userEmail = await getCurrentUserEmail();
      const tableName = getTableName(resource, userEmail);
      
      const { current = 1, pageSize = 10 } = pagination || {};
      const from = (current - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from(tableName).select('*', { count: 'exact' });

      // Apply filters
      if (filters) {
        filters.forEach((filter) => {
          if (filter.operator === 'eq') {
            query = query.eq(filter.field, filter.value);
          } else if (filter.operator === 'contains') {
            query = query.ilike(filter.field, `%${filter.value}%`);
          }
        });
      }

      // Apply sorting
      if (sorters) {
        sorters.forEach((sorter) => {
          query = query.order(sorter.field, { ascending: sorter.order === 'asc' });
        });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
      };
    },

    getOne: async ({ resource, id }: GetOneParams) => {
      const userEmail = await getCurrentUserEmail();
      const tableName = getTableName(resource, userEmail);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
      };
    },

    create: async ({ resource, variables }: CreateParams) => {
      const userEmail = await getCurrentUserEmail();
      const tableName = getTableName(resource, userEmail);

      // Add user_id for sandbox user (demo data uses a placeholder)
      const { data: { user } } = await supabase.auth.getUser();
      const dataWithUserId = {
        ...variables,
        user_id: user?.id,
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(dataWithUserId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
      };
    },

    update: async ({ resource, id, variables }: UpdateParams) => {
      const userEmail = await getCurrentUserEmail();
      const tableName = getTableName(resource, userEmail);

      const { data, error } = await supabase
        .from(tableName)
        .update(variables)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
      };
    },

    deleteOne: async ({ resource, id }: DeleteOneParams) => {
      const userEmail = await getCurrentUserEmail();
      const tableName = getTableName(resource, userEmail);

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data,
      };
    },

    getApiUrl: () => process.env.SUPABASE_URL || '',

    // Optional: Custom method to check if user is in sandbox mode
    custom: async ({ url, method, meta }) => {
      if (url === 'sandbox-status') {
        const userEmail = await getCurrentUserEmail();
        return {
          data: {
            isSandbox: isSandboxUser(userEmail),
            userEmail,
            tablePrefix: isSandboxUser(userEmail) ? 'sandbox_' : '',
          },
        };
      }
      
      throw new Error(`Custom method not implemented: ${url}`);
    },
  };
};

export default createSandboxDataProvider;