import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUp() {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('productId', 'test-cake-123')
    .select();

  console.log('Cleanup Result:', data, error);
}

cleanUp();
