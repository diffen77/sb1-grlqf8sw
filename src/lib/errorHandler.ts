import { ApiError, ValidationError } from './validation';

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  context: Record<string, any>;
  stack?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private readonly MAX_LOGS = 1000;

  log(error: Error, level: ErrorLog['level'] = 'error', context: Record<string, any> = {}) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level,
      code: this.getErrorCode(error),
      message: error.message,
      context: {
        ...context,
        errorType: error.constructor.name
      }
    };

    if (error.stack) {
      errorLog.stack = error.stack;
    }

    this.logs.unshift(errorLog);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // In development, log to console
    if (import.meta.env.DEV) {
      console.error('Error logged:', errorLog);
    }

    // TODO: In production, send to error tracking service
  }

  private getErrorCode(error: Error): string {
    if (error instanceof ApiError) {
      return `API_${error.code}`;
    }
    if (error instanceof ValidationError) {
      return 'VALIDATION_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  getLogs(
    filter?: { level?: ErrorLog['level']; code?: string },
    limit = 50
  ): ErrorLog[] {
    let filtered = this.logs;

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level);
    }
    if (filter?.code) {
      filtered = filtered.filter(log => log.code === filter.code);
    }

    return filtered.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();

// Global error handler
export function handleError(error: unknown, context: Record<string, any> = {}) {
  let level: ErrorLog['level'] = 'error';
  
  if (error instanceof ValidationError) {
    level = 'warn';
  }

  if (error instanceof Error) {
    errorLogger.log(error, level, context);
  } else {
    errorLogger.log(new Error(String(error)), level, context);
  }
}