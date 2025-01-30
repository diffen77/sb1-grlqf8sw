import { Translation } from './types';

export const en: Translation = {
  fieldLabels: {
    id: 'Match ID',
    homeTeam: 'Home Team',
    awayTeam: 'Away Team',
    datetime: 'Match Time',
    'odds.home': 'Home Win',
    'odds.draw': 'Draw',
    'odds.away': 'Away Win',
    'statistics.homeForm': 'Home Team Form',
    'statistics.awayForm': 'Away Team Form',
    'statistics.headToHead': 'Head to Head'
  },
  betSelections: {
    '1': 'Home Win',
    'X': 'Draw',
    '2': 'Away Win'
  },
  matchStatus: {
    open: 'Open for Betting',
    closed: 'Registration Closed'
  },
  common: {
    loading: 'Loading matches...',
    error: 'An error occurred while loading matches',
    noMatches: 'No matches available',
    refresh: 'Refresh',
    lastUpdated: 'Last updated'
  }
};