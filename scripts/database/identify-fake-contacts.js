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

// Known legitimate companies/domains
const legitimateDomains = [
  'mlcproperties.com',
  'smartrepm.com',
  'thechicagopm.com',
  'bkchicago.com',
  'svn.com',
  'pabcormanagement.com',
  'mo2properties.com',
  'citypropertymanagement.net',
  'artpropertymgmt.com',
  'citypadsre.com',
  'schoeneman.com',
  'littproperties.com',
  'schmitzproperties.com',
  '606realty.com',
  'randele.com',
  'sykorapropertymgt.com',
  'budigproperties.com',
  'johnhoganproperties.com',
  'rentalsbyjp.com',
  'apchicago.com'
];

// Known fake or suspicious patterns
const suspiciousPatterns = [
  // Test/sample data
  { pattern: /test|sample|demo|fake/i, description: 'Test data' },
  // Generic names
  { pattern: /john\s*doe|jane\s*doe|abc\s*corp/i, description: 'Generic names' }
];

// Specific suspicious contacts (based on user feedback)
const knownFakeContacts = [
  'cara@schoeneman.com', // User confirmed this is fake
];

// Names that seem generic or made up when paired with real company domains
const suspiciousNames = [
  'cara collins',
  'john johnson', // Too generic
  'danny huggans', // Suspicious when paired with citypadsre.com
];

// Known legitimate contact patterns (property management companies often have these)
const legitimatePatterns = [
  /evictions@/i,  // Eviction departments
  /accounting@/i, // Accounting departments
  /^[a-z]+\.[a-z]+@/i, // firstname.lastname@ format
  /^[a-z]{2,}@/i // Short name/initial formats common in business
];

async function analyzeContacts() {
  try {
    console.log('🔍 Analyzing contacts for potential fake entries...\n');
    
    // Get all contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }
    
    console.log(`📊 Total contacts found: ${contacts?.length || 0}\n`);
    
    const suspiciousContacts = [];
    const legitimateContacts = [];
    const unknownContacts = [];
    
    contacts.forEach(contact => {
      const email = contact.email?.toLowerCase() || '';
      const name = contact.name?.toLowerCase() || '';
      const domain = email.split('@')[1] || '';
      
      // Check if it's a known legitimate domain
      const hasLegitDomain = legitimateDomains.includes(domain);
      
      // Check for suspicious patterns
      let isSuspicious = false;
      let suspiciousReason = '';
      
      for (const { pattern, description } of suspiciousPatterns) {
        if (pattern.test(name) || pattern.test(email)) {
          isSuspicious = true;
          suspiciousReason = description;
          break;
        }
      }
      
      // Check if email follows legitimate patterns
      let followsLegitPattern = false;
      for (const pattern of legitimatePatterns) {
        if (pattern.test(email)) {
          followsLegitPattern = true;
          break;
        }
      }
      
      // Check if it's a known fake contact
      if (knownFakeContacts.includes(email)) {
        isSuspicious = true;
        suspiciousReason = 'Confirmed fake contact';
      }
      
      // Check if the name is suspicious
      if (!isSuspicious && suspiciousNames.includes(name)) {
        isSuspicious = true;
        suspiciousReason = 'Suspicious name pattern';
      }
      
      // Special check: single first name with company domain might be fake
      if (!isSuspicious && hasLegitDomain && email.match(/^[a-z]+@/) && !email.includes('.') && !followsLegitPattern) {
        isSuspicious = true;
        suspiciousReason = 'Single first name with company domain (possibly fake)';
      }
      
      // Categorize the contact
      if (isSuspicious) {
        suspiciousContacts.push({ ...contact, reason: suspiciousReason });
      } else if (hasLegitDomain && followsLegitPattern) {
        legitimateContacts.push(contact);
      } else {
        unknownContacts.push(contact);
      }
    });
    
    // Display results
    console.log('🚨 SUSPICIOUS CONTACTS (Potentially Fake):');
    console.log('='.repeat(60));
    if (suspiciousContacts.length > 0) {
      suspiciousContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} <${contact.email}>`);
        console.log(`   ID: ${contact.id}`);
        console.log(`   Reason: ${contact.reason}`);
        console.log(`   Company: ${contact.company || 'N/A'}`);
        console.log('-'.repeat(40));
      });
    } else {
      console.log('No suspicious contacts found.\n');
    }
    
    console.log('\n✅ LEGITIMATE CONTACTS:');
    console.log('='.repeat(60));
    console.log(`Found ${legitimateContacts.length} contacts with legitimate patterns\n`);
    
    console.log('❓ UNKNOWN/NEEDS REVIEW:');
    console.log('='.repeat(60));
    if (unknownContacts.length > 0) {
      unknownContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.name} <${contact.email}>`);
        console.log(`   Company: ${contact.company || 'N/A'}`);
      });
    } else {
      console.log('No unknown contacts.\n');
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`- Suspicious: ${suspiciousContacts.length}`);
    console.log(`- Legitimate: ${legitimateContacts.length}`);
    console.log(`- Unknown: ${unknownContacts.length}`);
    console.log(`- Total: ${contacts.length}`);
    
    // Return the suspicious contact IDs for potential deletion
    return suspiciousContacts.map(c => c.id);
    
  } catch (error) {
    console.error('Exception when analyzing contacts:', error);
  }
}

async function deleteSuspiciousContacts(contactIds) {
  if (!contactIds || contactIds.length === 0) {
    console.log('\nNo contacts to delete.');
    return;
  }
  
  console.log(`\n🗑️  Preparing to delete ${contactIds.length} suspicious contacts...`);
  
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
    
    console.log(`✅ Successfully deleted ${data?.length || 0} suspicious contacts`);
    
  } catch (error) {
    console.error('Exception when deleting contacts:', error);
  }
}

async function main() {
  console.log('🚀 Fake Contact Detection Tool\n');
  
  // Analyze contacts
  const suspiciousIds = await analyzeContacts();
  
  // Check if --delete flag was passed
  const shouldDelete = process.argv.includes('--delete');
  
  if (shouldDelete && suspiciousIds && suspiciousIds.length > 0) {
    console.log('\n⚠️  WARNING: About to delete suspicious contacts!');
    console.log('Press Ctrl+C within 5 seconds to cancel...');
    
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await deleteSuspiciousContacts(suspiciousIds);
  } else if (suspiciousIds && suspiciousIds.length > 0) {
    console.log('\n💡 To delete suspicious contacts, run:');
    console.log('   node scripts/database/identify-fake-contacts.js --delete');
  }
}

main().catch(console.error);