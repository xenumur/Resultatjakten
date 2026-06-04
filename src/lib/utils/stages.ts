export const stageOrder = [
  'Grupp A', 'Group A',
  'Grupp B', 'Group B',
  'Grupp C', 'Group C',
  'Grupp D', 'Group D',
  'Grupp E', 'Group E',
  'Grupp F', 'Group F',
  'Grupp G', 'Group G',
  'Grupp H', 'Group H',
  'Grupp I', 'Group I',
  'Grupp J', 'Group J',
  'Grupp K', 'Group K',
  'Grupp L', 'Group L',
  'Matchday 1', 'Matchday 2', 'Matchday 3', 'Matchday 4', 'Matchday 5',
  'Matchday 6', 'Matchday 7', 'Matchday 8', 'Matchday 9', 'Matchday 10',
  'Matchday 11', 'Matchday 12', 'Matchday 13', 'Matchday 14', 'Matchday 15',
  'Matchday 16', 'Matchday 17',
  'Sextondelsfinal', 'Round of 32',
  'Åttondelsfinal', 'Round of 16',
  'Kvartsfinal', 'Quarter-final',
  'Semifinal', 'Semi-final',
  'Bronsmatch', 'Match om tredjepris', 'Match for third place',
  'Final',
];

export function compareStages(a: string, b: string): number {
  const indexA = stageOrder.indexOf(a);
  const indexB = stageOrder.indexOf(b);
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a.localeCompare(b);
}
