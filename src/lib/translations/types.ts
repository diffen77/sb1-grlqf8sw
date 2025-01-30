import { Match } from '../../types';

export type TranslationKey = keyof Match | 'odds.home' | 'odds.draw' | 'odds.away' | 'statistics.homeForm' | 'statistics.awayForm' | 'statistics.headToHead';

export interface Translation {
  fieldLabels: Record<TranslationKey, string>;
  betSelections: Record<'1' | 'X' | '2', string>;
  matchStatus: {
    open: string;
    closed: string;
  };
  common: {
    loading: string;
    error: string;
    noMatches: string;
    refresh: string;
    lastUpdated: string;
  };
}

export type Language = 'en' | 'sv';