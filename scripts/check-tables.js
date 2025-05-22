import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    console.log('Checking database tables...');
    
    // Use RPC to run a SQL query that lists all tables
    const { data, error } = await supabase.rpc('list_tables', {});
    
    if (error) {
      console.error('Error checking tables:', error);
      
      // Try an alternative approach - checking if specific tables exist
      console.log('Trying alternative approach...');
      
      const tables = ['cases', 'hearings'];
      const results = {};
      
      for (const table of tables) {
        try {
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
            
          if (countError) {
            console.log(`Table ${table} check error:`, countError.message);
            results[table] = false;
          } else {
            console.log(`Table ${table} exists with approximately ${count} rows`);
            results[table] = true;
          }
        } catch (e) {
          console.log(`Exception checking table ${table}:`, e.message);
          results[table] = false;
        }
      }
      
      console.log('Table check results:', results);
    } else {
      console.log('Database tables:');
      console.log(data);
    }
  } catch (error) {
    console.error('Exception when checking tables:', error);
  }
}

listTables().catch(console.error);