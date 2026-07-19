import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  const { data: products, error: pError } = await supabase.from('products').select('*').limit(2);
  const { data: categories, error: cError } = await supabase.from('categories').select('*').limit(2);

  console.log('Products count/error:', products?.length, pError);
  console.log('Categories count/error:', categories?.length, cError);
  if (products && products.length > 0) {
    console.log('Sample Product:', JSON.stringify(products[0], null, 2));
  }
  if (categories && categories.length > 0) {
    console.log('Sample Category:', JSON.stringify(categories[0], null, 2));
  }
}

testFetch();
