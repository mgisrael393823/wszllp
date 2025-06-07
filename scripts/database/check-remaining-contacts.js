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

async function checkAllContacts() {
  try {
    console.log('🔍 Checking all contacts in production database...\n');
    
    // Get all contacts
    const { data: allContacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }
    
    console.log(`📊 Total contacts found: ${allContacts?.length || 0}\n`);
    
    if (allContacts && allContacts.length > 0) {
      console.log('📋 Contact Details:');
      console.log('='.repeat(80));
      
      allContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ID: ${contact.id}`);
        console.log(`   Name: ${contact.name || 'N/A'}`);
        console.log(`   Email: ${contact.email || 'N/A'}`);
        console.log(`   Phone: ${contact.phone || 'N/A'}`);
        console.log(`   Type: ${contact.type || 'N/A'}`);
        console.log(`   Created: ${contact.created_at}`);
        console.log(`   User ID: ${contact.user_id || 'N/A'}`);
        console.log('-'.repeat(40));
      });
      
      console.log('\n🎯 Analysis:');
      console.log(`Total contacts to remove: ${allContacts.length}`);
      
      // Check for patterns that might indicate test data
      const testPatterns = allContacts.filter(contact => 
        (contact.name && (contact.name.toLowerCase().includes('test') || 
                         contact.name.toLowerCase().includes('sample') ||
                         contact.name.toLowerCase().includes('john doe') ||
                         contact.name.toLowerCase().includes('abc corp'))) ||
        (contact.email && (contact.email.includes('test') || 
                          contact.email.includes('sample') ||
                          contact.email.includes('example.com')))
      );
      
      if (testPatterns.length > 0) {
        console.log(`\n⚠️  Contacts with test patterns: ${testPatterns.length}`);
        testPatterns.forEach((contact, index) => {
          console.log(`   ${index + 1}. ${contact.name} (${contact.email})`);
        });
      }
    } else {
      console.log('✅ No contacts found in database');
    }
    
  } catch (error) {
    console.error('Exception when checking contacts:', error);
  }
}

async function removeAllContacts() {
  try {
    console.log('\n🗑️  Removing ALL contacts from production...');
    
    const { data: deletedContacts, error } = await supabase
      .from('contacts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // This will match all records
      .select();
    
    if (error) {
      console.error('Error deleting contacts:', error);
      return false;
    }
    
    console.log(`✅ Successfully deleted ${deletedContacts?.length || 0} contacts`);
    return true;
    
  } catch (error) {
    console.error('Exception when deleting contacts:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Production Contacts Cleanup Tool\n');
  
  // First, check what contacts exist
  await checkAllContacts();
  
  // Ask for confirmation (simulated)
  console.log('\n❓ Ready to remove ALL contacts? This action cannot be undone.');
  console.log('   Run with --confirm flag to proceed with deletion');
  
  // Check if --confirm flag was passed
  const shouldDelete = process.argv.includes('--confirm');
  
  if (shouldDelete) {
    console.log('\n🔥 CONFIRMED: Proceeding with deletion...');
    const success = await removeAllContacts();
    
    if (success) {
      console.log('\n🔍 Verifying deletion...');
      await checkAllContacts();
      console.log('\n🎉 Production contacts cleanup completed!');
    }
  } else {
    console.log('\n💡 To actually delete the contacts, run:');
    console.log('   node scripts/check-remaining-contacts.js --confirm');
  }
}

main().catch(console.error);