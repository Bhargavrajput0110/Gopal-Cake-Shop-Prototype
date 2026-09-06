import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listFiles() {
  const { data, error } = await supabase.storage.from('media').list('gopal-cakes/references', {
    limit: 10,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  
  if (error) {
    console.error("Error listing files:", error);
  } else {
    console.log("Files:", data);
  }
}
listFiles();
