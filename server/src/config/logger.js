/**
 * Structured Logger for CampusBridge Server
 * Supports request ID tracing, color-coded dev outputs, and structured JSON for production.
 */

const levels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

const colors = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m'
};

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const requestId = meta.requestId ? `[${meta.requestId}]` : '';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    return JSON.stringify({
      timestamp,
      level,
      message,
      requestId: meta.requestId || undefined,
      ...meta
    });
  }

  const color = level === levels.ERROR ? colors.RED :
                level === levels.WARN ? colors.YELLOW :
                level === levels.INFO ? colors.CYAN : colors.GRAY;

  const metaStr = Object.keys(meta).length > 0 && !(Object.keys(meta).length === 1 && meta.requestId)
    ? ` ${colors.GRAY}${JSON.stringify(meta)}${colors.RESET}`
    : '';

  return `${colors.GRAY}${timestamp}${colors.RESET} ${color}[${level}]${colors.RESET} ${colors.GREEN}${requestId}${colors.RESET} ${message}${metaStr}`;
}

export const logger = {
  info(message, meta) {
    console.log(formatMessage(levels.INFO, message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage(levels.WARN, message, meta));
  },
  error(message, meta) {
    console.error(formatMessage(levels.ERROR, message, meta));
  },
  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage(levels.DEBUG, message, meta));
    }
  }
};

export default logger;
