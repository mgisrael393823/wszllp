/**
 * Sandbox Environment Utilities
 * Handles routing between production and demo data based on user email
 */

export const SANDBOX_EMAIL = 'evictionsandbox@gmail.com';

/**
 * Check if the current user is the sandbox demo user
 */
export const isSandboxUser = (userEmail?: string | null): boolean => {
  return userEmail === SANDBOX_EMAIL;
};

/**
 * Get the appropriate table name based on user type
 */
export const getTableName = (baseTable: string, userEmail?: string | null): string => {
  if (isSandboxUser(userEmail)) {
    return `sandbox_${baseTable}`;
  }
  return baseTable;
};

/**
 * Sandbox table mapping
 */
export const SANDBOX_TABLES = {
  cases: 'sandbox_cases',
  contacts: 'sandbox_contacts', 
  documents: 'sandbox_documents',
  hearings: 'sandbox_hearings',
} as const;

/**
 * Production table mapping
 */
export const PRODUCTION_TABLES = {
  cases: 'cases',
  contacts: 'contacts',
  documents: 'documents', 
  hearings: 'hearings',
} as const;

/**
 * Get table mapping based on user type
 */
export const getTableMapping = (userEmail?: string | null) => {
  return isSandboxUser(userEmail) ? SANDBOX_TABLES : PRODUCTION_TABLES;
};

/**
 * Sandbox demo credentials for documentation
 */
export const SANDBOX_CREDENTIALS = {
  email: SANDBOX_EMAIL,
  // Password should be set manually in Supabase Auth
  note: 'Password: SandboxDemo2024! (set in Supabase Auth dashboard)'
} as const;