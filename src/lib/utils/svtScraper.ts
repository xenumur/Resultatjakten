
export async function fetchSvtBroadcasters() {
  try {
    const response = await fetch('https://www.svt.se/sport/fotboll/all-fakta-om-fotbolls-vm-2026', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Simple regex-based extraction since we don't have a full DOM parser here
    // We look for patterns like "Sverige–Tunisien (SVT)" or "SVT1...: Sverige-Tunisien"
    
    const svtMatches: [string, string][] = [];
    const tv4Matches: [string, string][] = [];
    const svtPlaceholders: string[] = [];

    // Extract all team-team pairings
    // This is a bit risky with just regex but let's try to find common patterns
    const lines = html.split(/[<>\n]/); // Split by tags and newlines
    
    for (const line of lines) {
      if (!line.includes('–') && !line.includes('-')) continue;
      
      const channel = line.includes('(TV4)') ? 'TV4' : (line.includes('SVT') ? 'SVT' : null);
      if (!channel) continue;
      
      const match = line.match(/([A-ZÅÄÖa-zåäö\s&]+)[\-–]([A-ZÅÄÖa-zåäö\s&]+)/);
      if (match) {
        let t1 = match[1].trim();
        let t2 = match[2].trim();
        
        // Clean up time/date prefixes
        t1 = t1.replace(/^[0-9]{2}\.[0-9]{2}\s+/, '').replace(/^.*:\s*/, '').trim();
        t2 = t2.trim();
        if (t2.includes(',')) t2 = t2.split(',')[0].trim();
        
        if (channel === 'SVT') {
          // Check if it's a real team match or a placeholder
          // Placeholder examples: 1E, W74, 3A/B/C
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
    console.error('Error fetching SVT broadcasters:', error);
    return null;
  }
}
