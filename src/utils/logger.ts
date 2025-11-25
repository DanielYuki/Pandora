import winston from 'winston';
import config from './config';

// Helper function to format objects for console output
const formatObject = (obj: any): string => {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'object') {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return '[Object]';
    }
  }

  return String(obj);
};

// Create different formats for console and file logging
const consoleFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss', // Only show time for console logs
  }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let output = `${timestamp} [${level}]: ${message}`;

    // Only show detailed object information in debug mode
    if (config.LOG_LEVEL === 'debug') {
      // Handle objects and additional metadata
      const metaKeys = Object.keys(meta);
      if (metaKeys.length > 0) {
        output += '\n';
        metaKeys.forEach(key => {
          const value = meta[key];
          if (typeof value === 'object' && value !== null) {
            const formatted = formatObject(value);
            output += `  ${key}:\n${formatted
              .split('\n')
              .map((line: string) => `    ${line}`)
              .join('\n')}\n`;
          } else {
            output += `  ${key}: ${value}\n`;
          }
        });
      }

      // Handle stack traces
      if (stack && typeof stack === 'string') {
        output += `\n  Stack:\n${stack
          .split('\n')
          .map((line: string) => `    ${line}`)
          .join('\n')}`;
      }
    }

    return output;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transport in production
// TODO: test file transport in production
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    })
  );
}

export default logger;
