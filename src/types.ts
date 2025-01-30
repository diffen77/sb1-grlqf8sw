export interface Match {
  id: string;
  eventNumber: number;
  homeTeam: string;
  home_team_medium_name?: string;
  awayTeam: string;
  away_team_medium_name?: string;
  datetime: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  statistics?: {
    homeForm: string;
    awayForm: string;
    headToHead: string;
  }
}

export type Selection = '1' | 'X' | '2';
export type MatchSelections = Selection[];