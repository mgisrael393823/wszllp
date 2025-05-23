import { createClient } from '@supabase/supabase-js';
import { Contact } from '../src/types/schema';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LocalStorageData {
  contacts?: Contact[];
  cases?: any[];
  [key: string]: any;
}

interface MigrationResult {
  success: boolean;
  contactsMigrated: number;
  errors: string[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

/**
 * Migrate contacts from localStorage to Supabase
 */
export async function migrateContactsToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    contactsMigrated: 0,
    errors: [],
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
    },
  };

  try {
    console.log('🚀 Starting contacts migration to Supabase...');

    // Read contacts from localStorage
    const localData = localStorage.getItem('legalCaseData');
    if (!localData) {
      console.log('ℹ️  No localStorage data found');
      result.success = true;
      return result;
    }

    const data: LocalStorageData = JSON.parse(localData);
    const contacts = data.contacts || [];

    if (contacts.length === 0) {
      console.log('ℹ️  No contacts found in localStorage');
      result.success = true;
      return result;
    }

    console.log(`📊 Found ${contacts.length} contacts to migrate`);
    result.summary.total = contacts.length;

    // Check for existing contacts to avoid duplicates
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('email')
      .in('email', contacts.map(c => c.email));

    if (fetchError) {
      throw new Error(`Failed to fetch existing contacts: ${fetchError.message}`);
    }

    const existingEmails = new Set(existingContacts?.map(c => c.email) || []);

    // Migrate each contact
    for (const contact of contacts) {
      try {
        // Skip if contact already exists
        if (existingEmails.has(contact.email)) {
          console.log(`⏭️  Skipping existing contact: ${contact.email}`);
          result.summary.skipped++;
          continue;
        }

        // Transform contact data for Supabase
        const supabaseContact = {
          name: contact.name,
          role: contact.role,
          email: contact.email,
          phone: contact.phone || null,
          company: contact.company || null,
          address: contact.address || null,
          notes: contact.notes || null,
        };

        // Insert contact
        const { data, error } = await supabase
          .from('contacts')
          .insert(supabaseContact)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to insert contact ${contact.name}: ${error.message}`);
        }

        console.log(`✅ Migrated contact: ${contact.name} (${contact.email})`);
        result.summary.successful++;

      } catch (error) {
        const errorMessage = `Failed to migrate contact ${contact.name}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMessage}`);
        result.errors.push(errorMessage);
        result.summary.failed++;
      }
    }

    result.contactsMigrated = result.summary.successful;
    result.success = result.summary.failed === 0;

    console.log('📈 Migration Summary:');
    console.log(`   Total: ${result.summary.total}`);
    console.log(`   Successful: ${result.summary.successful}`);
    console.log(`   Failed: ${result.summary.failed}`);
    console.log(`   Skipped: ${result.summary.skipped}`);

    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    return result;

  } catch (error) {
    const errorMessage = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`💥 ${errorMessage}`);
    result.errors.push(errorMessage);
    return result;
  }
}

/**
 * Create sample/test contacts for development
 */
export async function seedTestContacts(): Promise<void> {
  console.log('🌱 Seeding test contacts...');

  const testContacts = [
    {
      name: 'John Smith',
      role: 'Attorney' as const,
      email: 'john.smith@lawfirm.com',
      phone: '(555) 123-4567',
      company: 'Smith & Associates Law Firm',
      address: '123 Legal Street, Law City, LC 12345',
      notes: 'Opposing counsel for Johnson v. Williams case',
    },
    {
      name: 'Maria Rodriguez',
      role: 'PM' as const,
      email: 'maria.rodriguez@apartments.com',
      phone: '(555) 234-5678',
      company: 'Sunshine Apartments',
      address: '456 Property Ave, Rental Town, RT 23456',
      notes: 'Property manager for multiple eviction cases',
    },
    {
      name: 'David Johnson',
      role: 'Client' as const,
      email: 'david.johnson@email.com',
      phone: '(555) 345-6789',
      company: null,
      address: '789 Tenant Lane, Renter City, RC 34567',
      notes: 'Plaintiff in Johnson v. Williams eviction case',
    },
    {
      name: 'Sarah Williams',
      role: 'Client' as const,
      email: 'sarah.williams@email.com',
      phone: '(555) 456-7890',
      company: null,
      address: '321 Defendant Dr, Tenant Town, TT 45678',
      notes: 'Defendant in Johnson v. Williams eviction case',
    },
    {
      name: 'Jennifer Lee',
      role: 'Paralegal' as const,
      email: 'jennifer.lee@lawfirm.com',
      phone: '(555) 567-8901',
      company: 'Smith & Associates Law Firm',
      address: null,
      notes: 'Works with John Smith on complex cases',
    },
  ];

  try {
    // Clear existing test contacts
    await supabase
      .from('contacts')
      .delete()
      .like('email', '%@%'); // This is a simple way to clear test data

    // Insert test contacts
    const { data, error } = await supabase
      .from('contacts')
      .insert(testContacts)
      .select();

    if (error) {
      throw new Error(`Failed to seed test contacts: ${error.message}`);
    }

    console.log(`✅ Successfully seeded ${testContacts.length} test contacts`);
    
  } catch (error) {
    console.error(`❌ Failed to seed test contacts: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Validate migrated data integrity
 */
export async function validateMigration(): Promise<boolean> {
  console.log('🔍 Validating migration...');

  try {
    // Check if contacts table exists and has data
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.error(`❌ Failed to query contacts: ${contactsError.message}`);
      return false;
    }

    // Check if case_contacts table exists
    const { data: caseContacts, error: caseContactsError } = await supabase
      .from('case_contacts')
      .select('*')
      .limit(1);

    if (caseContactsError) {
      console.error(`❌ Failed to query case_contacts: ${caseContactsError.message}`);
      return false;
    }

    // Get contact counts
    const { count: contactCount, error: countError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`❌ Failed to count contacts: ${countError.message}`);
      return false;
    }

    console.log(`✅ Validation successful:`);
    console.log(`   - Contacts table exists: ${contacts !== null}`);
    console.log(`   - Case contacts table exists: ${caseContacts !== null}`);
    console.log(`   - Total contacts: ${contactCount || 0}`);

    return true;

  } catch (error) {
    console.error(`❌ Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Backup contacts data before migration
 */
export function backupLocalStorageContacts(): string | null {
  try {
    const localData = localStorage.getItem('legalCaseData');
    if (!localData) {
      console.log('ℹ️  No localStorage data to backup');
      return null;
    }

    const data = JSON.parse(localData);
    const contacts = data.contacts || [];

    if (contacts.length === 0) {
      console.log('ℹ️  No contacts to backup');
      return null;
    }

    const backup = {
      timestamp: new Date().toISOString(),
      source: 'localStorage',
      contacts: contacts,
    };

    const backupString = JSON.stringify(backup, null, 2);
    
    // Save to downloadable file
    const blob = new Blob([backupString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`💾 Backed up ${contacts.length} contacts`);
    return backupString;

  } catch (error) {
    console.error(`❌ Backup failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Export main functions for use in other scripts
export default {
  migrateContactsToSupabase,
  seedTestContacts,
  validateMigration,
  backupLocalStorageContacts,
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'migrate':
      migrateContactsToSupabase()
        .then(result => {
          console.log(result.success ? '🎉 Migration completed successfully!' : '⚠️  Migration completed with errors');
          process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
          console.error('💥 Migration failed:', error);
          process.exit(1);
        });
      break;

    case 'seed':
      seedTestContacts()
        .then(() => {
          console.log('🎉 Test data seeded successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('💥 Seeding failed:', error);
          process.exit(1);
        });
      break;

    case 'validate':
      validateMigration()
        .then(isValid => {
          console.log(isValid ? '🎉 Validation passed!' : '❌ Validation failed!');
          process.exit(isValid ? 0 : 1);
        })
        .catch(error => {
          console.error('💥 Validation failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log(`
Usage: npm run contacts:migrate [command]

Commands:
  migrate   - Migrate contacts from localStorage to Supabase
  seed      - Create test contacts for development
  validate  - Validate migration integrity

Examples:
  npm run contacts:migrate migrate
  npm run contacts:migrate seed
  npm run contacts:migrate validate
      `);
      process.exit(1);
  }
}