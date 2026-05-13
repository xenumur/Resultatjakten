
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('stage, home_team, away_team, api_match_num')
    .eq('game_id', 'a95d5f2a-7182-4541-b0e5-7977a461d331') // I need to find the gameId for "Nytt VM 2026 Test"
    .in('stage', ['Round of 32', 'Round of 16'])
    .order('api_match_num', { ascending: true })

  if (error) {
    console.error(error)
    return
  }

  console.log(JSON.stringify(matches, null, 2))
}

run()
