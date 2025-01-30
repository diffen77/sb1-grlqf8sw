import { z } from 'zod';

// Common validation schemas
export const matchSchema = z.object({
  id: z.string().uuid(),
  homeTeam: z.string().min(1, 'Home team is required'),
  awayTeam: z.string().min(1, 'Away team is required'),
  datetime: z.string().datetime(),
  odds: z.object({
    home: z.number().positive(),
    draw: z.number().positive(),
    away: z.number().positive()
  }),
  statistics: z.object({
    homeForm: z.string(),
    awayForm: z.string(),
    headToHead: z.string()
  }).optional()
});

export const betSelectionSchema = z.enum(['1', 'X', '2']);

export const betSlipSchema = z.record(z.string(), z.array(betSelectionSchema));

// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public details: z.ZodError) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Validation functions
export function validateMatch(data: unknown) {
  try {
    return matchSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid match data', error);
    }
    throw error;
  }
}

export function validateBetSlip(data: unknown) {
  try {
    return betSlipSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid bet slip data', error);
    }
    throw error;
  }
}

export function validateApiUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL must use HTTP or HTTPS protocol');
    }
    return true;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Please enter a valid URL');
    }
    throw err;
  }
}