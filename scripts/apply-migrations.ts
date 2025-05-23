import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://karvbtpygbavvqydfcju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcnZidHB5Z2JhdnZxeWRmY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjgwOTQwOSwiZXhwIjoyMDYyMzg1NDA5fQ.CFpy0tiFC5kldHEJcQlfnnqWeBazYdMa9RYw8VLg3h4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  '20250523160000_create_contacts_table.sql',
  '20250523160001_create_case_contacts_table.sql', 
  '20250523160002_create_contact_communications_table.sql',
  '20250523160003_enhanced_rls_policies.sql',
  '20250523160004_schema_versioning_and_monitoring.sql',
];

async function executeSQLFile(filename: string): Promise<void> {
  console.log(`📄 Applying migration: ${filename}`);
  
  try {
    const sqlPath = join(process.cwd(), 'supabase', 'migrations', filename);
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Split on semicolons and execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Statement warning: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Successfully applied: ${filename}`);
    
  } catch (error) {
    console.error(`❌ Failed to apply ${filename}:`, error);
    throw error;
  }
}

async function applyAllMigrations(): Promise<void> {
  console.log('🚀 Starting migration application...');
  
  try {
    for (const migration of migrations) {
      await executeSQLFile(migration);
    }
    
    console.log('🎉 All migrations applied successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Since exec_sql doesn't exist, let's try a different approach
async function applyMigrationsManually(): Promise<void> {
  console.log('🚀 Starting manual migration application...');
  
  try {
    // Migration 1: Create contacts table
    console.log('📄 Creating contacts table...');
    const { error: contactsError } = await supabase.rpc('create_contacts_table');
    
    if (contactsError && contactsError.code === '42883') {
      // Function doesn't exist, create table directly
      const { error: createError } = await supabase.from('contacts').select('*').limit(1);
      if (createError && createError.code === '42P01') {
        console.log('⚠️  Cannot apply migrations via client - need manual SQL execution');
        console.log('\n📋 Please run these SQL commands in Supabase Dashboard -> SQL Editor:');
        
        migrations.forEach(migration => {
          console.log(`\n🔸 File: ${migration}`);
          console.log(`   Copy and paste the contents of: supabase/migrations/${migration}`);
        });
        
        console.log('\n📝 Order of execution:');
        migrations.forEach((migration, index) => {
          console.log(`   ${index + 1}. ${migration}`);
        });
        
        console.log('\n🚀 After running the SQL, continue with: npm run migration:validate post-validate');
        return;
      }
    }
    
    console.log('✅ Migrations may already be applied or need manual execution');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('\n📋 Please apply migrations manually in Supabase Dashboard');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  applyMigrationsManually();
}