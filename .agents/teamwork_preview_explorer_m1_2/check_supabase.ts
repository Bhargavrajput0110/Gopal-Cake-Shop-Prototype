import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['branches', 'users', 'categories', 'products', 'orders', 'settings'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`Error querying table "${table}":`, error.message);
    } else {
      console.log(`Table "${table}": Query successful. Total records fetched = ${data.length}`);
      if (data.length > 0) {
        console.log(`Columns in "${table}":`, Object.keys(data[0]));
        console.log(`Sample row in "${table}":`, JSON.stringify(data[0], null, 2));
      } else {
        console.log(`Table "${table}" is empty.`);
      }
    }
    console.log('----------------------------------------');
  }
}

checkTables();
