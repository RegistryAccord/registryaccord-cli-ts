// src/lib/errors.ts
// Custom error types for the RegistryAccord CLI

/**
 * Base error class for RegistryAccord CLI errors
 */
export class RegistryAccordError extends Error {
  public readonly code: string
  public readonly correlationId?: string
  public readonly exitCode: number
  
  constructor(message: string, code: string, exitCode: number, correlationId?: string) {
    super(message)
    this.name = 'RegistryAccordError'
    this.code = code
    this.exitCode = exitCode
    this.correlationId = correlationId
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RegistryAccordError)
    }
  }
}

/**
 * Error for validation and usage issues
 * Exit code: 2
 */
export class ValidationError extends RegistryAccordError {
  constructor(message: string, code: string = 'VALIDATION_ERROR', correlationId?: string) {
    super(message, code, 2, correlationId)
    this.name = 'ValidationError'
  }
}

/**
 * Error for authentication and authorization issues
 * Exit code: 3
 */
export class AuthError extends RegistryAccordError {
  constructor(message: string, code: string = 'AUTH_ERROR', correlationId?: string) {
    super(message, code, 3, correlationId)
    this.name = 'AuthError'
  }
}

/**
 * Error for network and transport issues
 * Exit code: 4
 */
export class NetworkError extends RegistryAccordError {
  constructor(message: string, code: string = 'NETWORK_ERROR', correlationId?: string) {
    super(message, code, 4, correlationId)
    this.name = 'NetworkError'
  }
}

/**
 * Error for server-side issues
 * Exit code: 5
 */
export class ServerError extends RegistryAccordError {
  constructor(message: string, code: string = 'SERVER_ERROR', correlationId?: string) {
    super(message, code, 5, correlationId)
    this.name = 'ServerError'
  }
}

/**
 * Error for file system issues
 * Exit code: 2 (validation error)
 */
export class FileSystemError extends RegistryAccordError {
  constructor(message: string, code: string = 'FILE_SYSTEM_ERROR', correlationId?: string) {
    super(message, code, 2, correlationId)
    this.name = 'FileSystemError'
  }
}

/**
 * Error for configuration issues
 * Exit code: 2 (validation error)
 */
export class ConfigError extends RegistryAccordError {
  constructor(message: string, code: string = 'CONFIG_ERROR', correlationId?: string) {
    super(message, code, 2, correlationId)
    this.name = 'ConfigError'
  }
}
