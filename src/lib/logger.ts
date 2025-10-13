// src/lib/logger.ts
// Structured logging utilities for the RegistryAccord CLI

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  correlationId?: string
  [key: string]: any
}

/**
 * Logger class for structured logging with different log levels
 */
export class Logger {
  private logLevel: LogLevel
  private correlationId?: string
  
  constructor(logLevel: LogLevel = 'info', correlationId?: string) {
    this.logLevel = logLevel
    this.correlationId = correlationId
  }
  
  /**
   * Set the correlation ID for all subsequent log entries
   */
  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId
  }
  
  /**
   * Set the log level threshold
   */
  public setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel
  }
  
  /**
   * Log an error message
   */
  public error(message: string, metadata: Record<string, any> = {}): void {
    this.log('error', message, metadata)
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, metadata: Record<string, any> = {}): void {
    this.log('warn', message, metadata)
  }
  
  /**
   * Log an info message
   */
  public info(message: string, metadata: Record<string, any> = {}): void {
    this.log('info', message, metadata)
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, metadata: Record<string, any> = {}): void {
    this.log('debug', message, metadata)
  }
  
  /**
   * Log a message with the specified level
   */
  private log(level: LogLevel, message: string, metadata: Record<string, any> = {}): void {
    // Check if we should log based on log level
    if (!this.shouldLog(level)) {
      return
    }
    
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata
    }
    
    // Add correlation ID if available
    if (this.correlationId) {
      logEntry.correlationId = this.correlationId
    }
    
    // Output the log entry as JSON
    console.error(JSON.stringify(logEntry))
  }
  
  /**
   * Determine if a message should be logged based on the current log level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    
    // If current level is -1, it means it's not a valid level, so log everything
    if (currentLevelIndex === -1) {
      return true
    }
    
    // Log if the message level is less than or equal to the current level
    return messageLevelIndex <= currentLevelIndex
  }
}

// Create a default logger instance
export const logger = new Logger()

/**
 * Create a logger with a specific correlation ID
 */
export function createLoggerWithCorrelationId(correlationId: string): Logger {
  const logger = new Logger()
  logger.setCorrelationId(correlationId)
  return logger
}
