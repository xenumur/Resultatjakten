
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: games, error } = await supabase
    .from('games')
    .select('id, name, group_id')
    .ilike('name', '%Nytt VM 2026 Test%');

  if (error) {
    console.error(error);
    return;
  }

  console.log(JSON.stringify(games, null, 2));
}

run();
