
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient('https://bjvprodaupvaoqctangt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdnByb2RhdXB2YW9xY3Rhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzAyNzksImV4cCI6MjA5NDAwNjI3OX0.Gw0XLkoZfXimCRqNN_BBSpSSEps5lngDkdmUQ1yj17E');
  
  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, stage, home_team, away_team, api_match_num, game_id')
    .in('stage', ['Round of 32', 'Round of 16'])
    .limit(1000);

  if (error) {
    console.error(error);
    return;
  }

  // Filter for the game "Nytt VM 2026 Test"
  // Since we don't have the gameId, let's find it from the matches
  // Actually, let's just look for the teams mentioned in the image
  const testMatches = matches.filter(m => 
    m.home_team === 'Czech Republic' || 
    m.home_team === 'Germany' || 
    m.home_team === 'Norway' ||
    m.home_team === 'Brazil' ||
    m.home_team === 'Belgium'
  );

  if (testMatches.length > 0) {
    const gameId = testMatches[0].game_id;
    const gameMatches = matches.filter(m => m.game_id === gameId);
    console.log(JSON.stringify(gameMatches, null, 2));
  } else {
    console.log("No matches found for those teams");
  }
}

run();
