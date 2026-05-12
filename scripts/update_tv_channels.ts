
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS for this bulk update

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchSvtBroadcasters() {
  try {
    const response = await fetch('https://www.svt.se/sport/fotboll/all-fakta-om-fotbolls-vm-2026');
    if (!response.ok) return null;
    const html = await response.text();
    
    const svtMatches: [string, string][] = [];
    const svtPlaceholders: string[] = [];

    const lines = html.split(/[<>\n]/);
    for (const line of lines) {
      if (!line.includes('–') && !line.includes('-')) continue;
      const channel = line.includes('(TV4)') ? 'TV4' : (line.includes('SVT') ? 'SVT' : null);
      if (!channel) continue;
      
      const match = line.match(/([A-ZÅÄÖa-zåäö\s&]+)[\-–]([A-ZÅÄÖa-zåäö\s&]+)/);
      if (match) {
        let t1 = match[1].trim();
        let t2 = match[2].trim();
        t1 = t1.replace(/^[0-9]{2}\.[0-9]{2}\s+/, '').replace(/^.*:\s*/, '').trim();
        t2 = t2.trim();
        if (t2.includes(',')) t2 = t2.split(',')[0].trim();
        
        if (channel === 'SVT') {
          const isPlaceholder = /^[123][A-L]/.test(t1) || /^[WLR][0-9]/.test(t1) || t1.includes('/');
          if (isPlaceholder) {
            svtPlaceholders.push(`${t1} – ${t2}`);
          } else {
            svtMatches.push([t1, t2]);
          }
        }
      }
    }
    return { svtMatches, svtPlaceholders };
  } catch (error) {
    console.error('Error fetching SVT:', error);
    return null;
  }
}

const teamMap: Record<string, string> = {
  "Mexiko": "Mexico", "Sydafrika": "South Africa", "Sydkorea": "South Korea",
  "Tjeckien": "Czech Republic", "Kanada": "Canada", "Bosnien och Hercegovina": "Bosnia & Herzegovina",
  "USA": "USA", "Paraguay": "Paraguay", "Qatar": "Qatar", "Schweiz": "Switzerland",
  "Brasilien": "Brazil", "Marocko": "Morocco", "Skottland": "Scotland", "Haiti": "Haiti",
  "Australien": "Australia", "Turkiet": "Turkey", "Tyskland": "Germany", "Curacao": "Curaçao",
  "Nederländerna": "Netherlands", "Japan": "Japan", "Elfenbenskusten": "Ivory Coast",
  "Ecuador": "Ecuador", "Sverige": "Sweden", "Tunisien": "Tunisia", "Spanien": "Spain",
  "Kap Verde": "Cape Verde", "Belgien": "Belgium", "Egypten": "Egypt", "Saudiarabien": "Saudi Arabia",
  "Uruguay": "Uruguay", "Iran": "Iran", "Nya Zeeland": "New Zealand", "Frankrike": "France",
  "Senegal": "Senegal", "Irak": "Iraq", "Norge": "Norway", "Argentina": "Argentina",
  "Algeriet": "Algeria", "Österrike": "Austria", "Jordanien": "Jordan", "Portugal": "Portugal",
  "DR Kongo": "DR Congo", "England": "England", "Kroatien": "Croatia", "Ghana": "Ghana",
  "Panama": "Panama", "Uzbekistan": "Uzbekistan", "Colombia": "Colombia"
}

async function run() {
  console.log('Starting TV channel update...');
  const svtData = await fetchSvtBroadcasters();
  if (!svtData) {
    console.error('Failed to fetch SVT data');
    return;
  }

  const { svtMatches, svtPlaceholders } = svtData;
  console.log(`Found ${svtMatches.length} SVT matches and ${svtPlaceholders.length} placeholders.`);

  // Reset all to TV4 first
  const { error: resetError } = await supabase.from('matches').update({ broadcaster: 'TV4' }).not('id', 'is', null);
  if (resetError) console.error('Reset error:', resetError);

  for (const [t1, t2] of svtMatches) {
    const t1En = teamMap[t1] || t1;
    const t2En = teamMap[t2] || t2;
    
    await supabase.from('matches')
      .update({ broadcaster: 'SVT' })
      .or(`and(home_team.eq."${t1En}",away_team.eq."${t2En}"),and(home_team.eq."${t2En}",away_team.eq."${t1En}")`);
    
    if (t1En !== t1 || t2En !== t2) {
      await supabase.from('matches')
        .update({ broadcaster: 'SVT' })
        .or(`and(home_team.eq."${t1}",away_team.eq."${t2}"),and(home_team.eq."${t2}",away_team.eq."${t1}")`);
    }
  }

  for (const p of svtPlaceholders) {
    const [ph, pa] = p.split(/[–-]/).map(s => s.trim());
    await supabase.from('matches')
      .update({ broadcaster: 'SVT' })
      .or(`and(home_team.eq."${ph}",away_team.eq."${pa}"),and(home_team.eq."${pa}",away_team.eq."${ph}")`);
  }

  console.log('Update complete!');
}

run();
