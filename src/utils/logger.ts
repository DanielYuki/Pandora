import winston from 'winston';
import config from './config';

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  transports: [
    // Console: simple, colored output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const output = `${timestamp} [${level}]: ${message}`;
          return stack ? `${output}\n${stack}` : output;
        })
      ),
    }),
  ],
});

// Add file logging in production
if (config.NODE_ENV === 'production') {
  const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

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
