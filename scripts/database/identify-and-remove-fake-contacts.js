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

// Real contacts provided by user (normalized to lowercase for comparison)
const realContactNames = [
  'randy sheridan',
  'tiffany watkins',
  'matthew shamis',
  'eli cooper',
  'diana watts',
  'jayden balsom',
  'lisa rowe',
  'kiarra brown',
  'jessica chaidez',
  'marty max',
  'oralia martinez',
  'trent jones',
  'sujelit quintero',
  'brent fallows',
  'itche blumenberg',
  'sara blumenberg',
  'gitty porgesz',
  'chaya shor',
  'riva blumenberg',
  'michael kubersky',
  'aaron smith',
  'denise jackson',
  'erica kubersky',
  'ramon price',
  'micky cicchinelli',
  'kirk bennett',
  'tammi holness',
  'tru pabcor',
  'max motew',
  'brandon carlson',
  'michael motew',
  'kenneth motew',
  'giancarlo iannotta',
  'gianna delise',
  'sheryl durrment',
  'corinne mcgee',
  'ewan dickson',
  'ben erenberg',
  'daniel zivin',
  'andrew ahitow',
  'elliot offenbach',
  'james bellavia',
  'david litt',
  'mitchell schoeneman', // Note: might be "Michael Schoeneman" in DB
  'chris zepeda'
].map(name => name.toLowerCase().trim());

// Also check for company/organization names that are real
const realCompanyNames = [
  'ivy park homes',
  'mlc properties and management',
  'smart property management',
  'chicago property management',
  'bk chicago',
  'svn chicago property management',
  'pabcor management',
  'mo2 properties',
  'advantage properties chicago'
].map(name => name.toLowerCase().trim());

// First names from real contacts for partial matching
const realFirstNames = new Set(realContactNames.map(name => name.split(' ')[0]));

async function analyzeContacts() {
  try {
    console.log('🔍 Analyzing contacts to identify fake entries...\n');
    
    // Get all contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }
    
    console.log(`📊 Total contacts found: ${contacts?.length || 0}\n`);
    
    const fakeContacts = [];
    const realContacts = [];
    const maybeRealContacts = [];
    
    contacts.forEach(contact => {
      const name = contact.name?.toLowerCase().trim() || '';
      const email = contact.email?.toLowerCase() || '';
      
      // Check if it's a real contact name
      if (realContactNames.includes(name)) {
        realContacts.push(contact);
        return;
      }
      
      // Check if it's a real company name
      if (realCompanyNames.includes(name)) {
        realContacts.push(contact);
        return;
      }
      
      // Check for partial matches (e.g., "Michael Schoeneman" vs "Mitchell Schoeneman")
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ');
      
      // Special cases
      if (name === 'michael schoeneman' && realContactNames.includes('mitchell schoeneman')) {
        maybeRealContacts.push({ ...contact, note: 'Might be Mitchell Schoeneman' });
        return;
      }
      
      // Check if the first name is from a real contact but full name doesn't match
      if (realFirstNames.has(firstName) && lastName) {
        // This could be a real person with same first name, needs manual review
        maybeRealContacts.push({ ...contact, note: 'First name matches real contact' });
        return;
      }
      
      // If we get here, it's likely a fake contact
      fakeContacts.push(contact);
    });
    
    // Display results
    console.log('🚨 FAKE CONTACTS (Not in the real contacts list):');
    console.log('='.repeat(80));
    if (fakeContacts.length > 0) {
      fakeContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} <${contact.email}>`);
        console.log(`   ID: ${contact.id}`);
        console.log(`   Company: ${contact.company || 'N/A'}`);
        console.log(`   Phone: ${contact.phone || 'N/A'}`);
        console.log('-'.repeat(40));
      });
    } else {
      console.log('No fake contacts found.\n');
    }
    
    console.log('\n✅ REAL CONTACTS (Confirmed):');
    console.log('='.repeat(80));
    console.log(`Found ${realContacts.length} real contacts\n`);
    
    if (maybeRealContacts.length > 0) {
      console.log('❓ NEEDS MANUAL REVIEW:');
      console.log('='.repeat(80));
      maybeRealContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} <${contact.email}>`);
        console.log(`   Note: ${contact.note}`);
        console.log(`   Company: ${contact.company || 'N/A'}`);
      });
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`- Fake contacts to remove: ${fakeContacts.length}`);
    console.log(`- Real contacts: ${realContacts.length}`);
    console.log(`- Needs review: ${maybeRealContacts.length}`);
    console.log(`- Total: ${contacts.length}`);
    
    // Show the fake contact names for verification
    if (fakeContacts.length > 0) {
      console.log('\n📋 Fake contact names:');
      fakeContacts.forEach(c => console.log(`  - ${c.name}`));
    }
    
    // Return the fake contact IDs for deletion
    return fakeContacts.map(c => c.id);
    
  } catch (error) {
    console.error('Exception when analyzing contacts:', error);
  }
}

async function deleteFakeContacts(contactIds) {
  if (!contactIds || contactIds.length === 0) {
    console.log('\nNo contacts to delete.');
    return;
  }
  
  console.log(`\n🗑️  Preparing to delete ${contactIds.length} fake contacts...`);
  
  try {
    const { data, error } = await supabase
      .from('contacts')
      .delete()
      .in('id', contactIds)
      .select();
    
    if (error) {
      console.error('Error deleting contacts:', error);
      return;
    }
    
    console.log(`✅ Successfully deleted ${data?.length || 0} fake contacts`);
    
  } catch (error) {
    console.error('Exception when deleting contacts:', error);
  }
}

async function main() {
  console.log('🚀 Fake Contact Removal Tool\n');
  console.log('This tool will identify contacts not in the provided real contacts list.\n');
  
  // Analyze contacts
  const fakeContactIds = await analyzeContacts();
  
  // Check if --delete flag was passed
  const shouldDelete = process.argv.includes('--delete');
  
  if (shouldDelete && fakeContactIds && fakeContactIds.length > 0) {
    console.log('\n⚠️  WARNING: About to delete fake contacts!');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await deleteFakeContacts(fakeContactIds);
  } else if (fakeContactIds && fakeContactIds.length > 0) {
    console.log('\n💡 To delete fake contacts, run:');
    console.log('   node scripts/database/identify-and-remove-fake-contacts.js --delete');
  }
}

main().catch(console.error);