import { prisma } from './db.server';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string;
  userId?: string;
  tenantId?: string;
  route?: string;
  method?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
}

class Logger {
  private requestId: string;
  
  constructor(requestId?: string) {
    this.requestId = requestId || crypto.randomUUID();
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      ...context
    };
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV) {
      const colors = {
        DEBUG: '\x1b[34m', // Blue
        INFO: '\x1b[32m',  // Green
        WARN: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m', // Red
        FATAL: '\x1b[35m'  // Magenta
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level]}[${level}]${reset} [${entry.requestId}] ${message}`, context ? JSON.stringify(context, null, 2) : '');
    }
    
    // In production (or if specifically configured), send to log aggregation service
    if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_DB === 'true') {
      this.sendToLogService(entry);
    }
  }
  
  debug(message: string, context?: Record<string, any>) {
    this.log('DEBUG', message, context);
  }
  
  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }
  
  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('ERROR', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  fatal(message: string, error?: Error, context?: Record<string, any>) {
    this.log('FATAL', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
  
  private async sendToLogService(entry: LogEntry) {
    try {
      let status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO' = 'INFO';
      
      switch (entry.level) {
        case 'DEBUG':
        case 'INFO':
          status = 'INFO';
          break;
        case 'WARN':
          status = 'WARNING';
          break;
        case 'ERROR':
        case 'FATAL':
          status = 'ERROR';
          break;
      }
      
      // Specifically mark success events if requested via context
      if (entry.context?.success === true) {
        status = 'SUCCESS';
      }

      await prisma.log.create({
        data: {
          userId: entry.userId,
          event: entry.message,
          status: status,
          module: entry.route || 'SYSTEM'
        }
      });
    } catch (err) {
      // Fail silently to avoid infinite loops
      console.error("Failed to write log to DB", err);
    }
  }
}

export function createLogger(requestId?: string) {
  return new Logger(requestId);
}
