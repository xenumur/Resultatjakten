import { TournamentProvider } from './TournamentProvider';
import { MockTournamentProvider } from './MockTournamentProvider';
import { ApiFootballProvider } from './ApiFootballProvider';
import { OpenFootballProvider } from './OpenFootballProvider';

const providers: Record<string, TournamentProvider> = {
  mock: new MockTournamentProvider(),
  api_football: new ApiFootballProvider(),
  open_football: new OpenFootballProvider(),
};

export function getProvider(providerId: string): TournamentProvider {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Provider ${providerId} hittades inte.`);
  }
  return provider;
}
