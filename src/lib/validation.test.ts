import { describe, it, expect } from 'vitest';
import { validateMatch, validateBetSlip, ValidationError } from './validation';

describe('Match Validation', () => {
  it('validates a correct match object', () => {
    const validMatch = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      datetime: '2024-02-01T15:00:00Z',
      odds: {
        home: 1.5,
        draw: 3.2,
        away: 2.1
      }
    };

    expect(() => validateMatch(validMatch)).not.toThrow();
  });

  it('throws ValidationError for invalid match data', () => {
    const invalidMatch = {
      id: 'not-a-uuid',
      homeTeam: '',
      awayTeam: 'Team B',
      datetime: 'invalid-date',
      odds: {
        home: -1,
        draw: 0,
        away: 'not-a-number'
      }
    };

    expect(() => validateMatch(invalidMatch)).toThrow(ValidationError);
  });
});

describe('Bet Slip Validation', () => {
  it('validates a correct bet slip', () => {
    const validBetSlip = {
      'match-1': ['1', 'X'],
      'match-2': ['2']
    };

    expect(() => validateBetSlip(validBetSlip)).not.toThrow();
  });

  it('throws ValidationError for invalid bet selections', () => {
    const invalidBetSlip = {
      'match-1': ['1', '3'], // '3' is not a valid selection
      'match-2': ['X']
    };

    expect(() => validateBetSlip(invalidBetSlip)).toThrow(ValidationError);
  });
});