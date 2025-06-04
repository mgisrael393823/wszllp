import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllContacts() {
  try {
    console.log('🗑️  Deleting ALL contacts from database...\n');
    
    // First, get count of contacts
    const { count, error: countError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting contacts:', countError);
      return;
    }
    
    console.log(`Found ${count || 0} contacts to delete.\n`);
    
    if (count === 0) {
      console.log('✅ No contacts to delete.');
      return;
    }
    
    // Delete all contacts
    const { data, error } = await supabase
      .from('contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This matches all records
      .select();
    
    if (error) {
      console.error('Error deleting contacts:', error);
      return;
    }
    
    console.log(`✅ Successfully deleted ${data?.length || 0} contacts.`);
    
    // Verify deletion
    const { count: remainingCount, error: verifyError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });
    
    if (verifyError) {
      console.error('Error verifying deletion:', verifyError);
      return;
    }
    
    console.log(`\n📊 Remaining contacts in database: ${remainingCount || 0}`);
    
  } catch (error) {
    console.error('Exception when deleting contacts:', error);
  }
}

async function main() {
  console.log('🚀 Delete All Contacts Tool\n');
  console.log('⚠️  WARNING: This will permanently delete ALL contacts from the database!\n');
  
  // Check if --confirm flag was passed
  const shouldDelete = process.argv.includes('--confirm');
  
  if (shouldDelete) {
    await deleteAllContacts();
  } else {
    console.log('❌ Safety check: You must confirm this action.');
    console.log('\n💡 To delete all contacts, run:');
    console.log('   node scripts/database/delete-all-contacts.js --confirm');
  }
}

main().catch(console.error);