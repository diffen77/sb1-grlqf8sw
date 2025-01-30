import { Translation } from './types';

export const sv: Translation = {
  fieldLabels: {
    id: 'Match-ID',
    homeTeam: 'Hemmalag',
    awayTeam: 'Bortalag',
    datetime: 'Matchtid',
    'odds.home': 'Hemmavinst',
    'odds.draw': 'Oavgjort',
    'odds.away': 'Bortavinst',
    'statistics.homeForm': 'Hemmaform',
    'statistics.awayForm': 'Bortaform',
    'statistics.headToHead': 'Inbördes Möten'
  },
  betSelections: {
    '1': 'Hemmavinst',
    'X': 'Oavgjort',
    '2': 'Bortavinst'
  },
  matchStatus: {
    open: 'Öppen för Spel',
    closed: 'Registrering Stängd'
  },
  common: {
    loading: 'Laddar matcher...',
    error: 'Ett fel uppstod vid laddning av matcher',
    noMatches: 'Inga matcher tillgängliga',
    refresh: 'Uppdatera',
    lastUpdated: 'Senast uppdaterad'
  }
};