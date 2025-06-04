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

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDateFiledColumn() {
  try {
    console.log('Adding dateFiled column to cases table...');
    
    // Use raw SQL to add the column
    const { data, error } = await supabase.rpc('sql', {
      query: 'ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS "dateFiled" TEXT;'
    });
    
    if (error) {
      console.error('Error adding column:', error);
      return;
    }
    
    console.log('Column added successfully:', data);
    
  } catch (error) {
    console.error('Exception when adding column:', error);
  }
}

addDateFiledColumn().catch(console.error);