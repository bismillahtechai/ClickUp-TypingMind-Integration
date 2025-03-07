/**
 * Enhanced logging utility for the ClickUp-TypingMind Integration
 * Provides structured logging with timestamps, log levels, and request tracking
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Default to INFO in production, DEBUG in development
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

// Get configured log level from environment or use default
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL 
  ? (LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || DEFAULT_LOG_LEVEL)
  : DEFAULT_LOG_LEVEL;

// Store request contexts by ID
const requestContexts = new Map();

/**
 * Main logger class
 */
class Logger {
  constructor(module) {
    this.module = module || 'app';
  }

  /**
   * Format a log message with timestamp, level, and module
   */
  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const requestId = meta.requestId || '';
    
    let formattedMeta = '';
    if (Object.keys(meta).length > 0) {
      // Remove requestId from printed meta to avoid duplication
      const { requestId: _, ...restMeta } = meta;
      
      if (Object.keys(restMeta).length > 0) {
        try {
          formattedMeta = JSON.stringify(restMeta);
        } catch (e) {
          formattedMeta = '[Unserializable metadata]';
        }
      }
    }

    return `[${timestamp}][${level}][${this.module}]${requestId ? `[req:${requestId}]` : ''} ${message}${formattedMeta ? ` ${formattedMeta}` : ''}`;
  }

  /**
   * Log a message if the current log level allows it
   */
  _log(level, levelName, message, meta = {}) {
    if (level <= CURRENT_LOG_LEVEL) {
      const formattedMessage = this._formatMessage(levelName, message, meta);
      
      switch (level) {
        case LOG_LEVELS.ERROR:
          console.error(formattedMessage);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedMessage);
          break;
        default:
          console.log(formattedMessage);
      }
    }
  }

  /**
   * Error level logging
   */
  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, 'ERROR', message, meta);
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, 'WARN', message, meta);
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, 'INFO', message, meta);
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    this._log(LOG_LEVELS.DEBUG, 'DEBUG', message, meta);
  }

  /**
   * Trace level logging
   */
  trace(message, meta = {}) {
    this._log(LOG_LEVELS.TRACE, 'TRACE', message, meta);
  }

  /**
   * Log HTTP request details
   */
  logRequest(req, meta = {}) {
    const requestInfo = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
      ...meta
    };
    
    this.info(`HTTP ${req.method} ${req.originalUrl || req.url}`, requestInfo);
  }

  /**
   * Log HTTP response details
   */
  logResponse(res, responseTime, meta = {}) {
    const responseInfo = {
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ...meta
    };
    
    this.info(`HTTP Response: ${res.statusCode} (${responseTime}ms)`, responseInfo);
  }

  /**
   * Log API call details
   */
  logApiCall(service, method, url, meta = {}) {
    this.debug(`API Call to ${service}: ${method} ${url}`, meta);
  }
}

/**
 * Create a request logger middleware
 */
function requestLoggerMiddleware() {
  const logger = new Logger('http');
  
  return (req, res, next) => {
    // Generate a unique ID for this request
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    req.requestId = requestId;
    
    // Store the start time
    const startTime = Date.now();
    
    // Log request
    logger.logRequest(req, { requestId });
    
    // Store request context
    requestContexts.set(requestId, {
      startTime,
      method: req.method,
      url: req.originalUrl || req.url
    });
    
    // Log response when finished
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logger.logResponse(res, responseTime, { requestId });
      
      // Clean up request context
      requestContexts.delete(requestId);
    });
    
    next();
  };
}

/**
 * Create a logger for a specific module
 */
function getLogger(module) {
  return new Logger(module);
}

module.exports = {
  getLogger,
  requestLoggerMiddleware,
  LOG_LEVELS
}; 