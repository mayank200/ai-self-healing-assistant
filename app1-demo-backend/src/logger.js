import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFilePath = process.env.LOG_FILE_PATH || path.join(logDir, 'error.log');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'app1-demo-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level}: ${stack || message}`;
        })
      )
    }),
    new winston.transports.File({
      filename: logFilePath,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => {
          return JSON.stringify({
            timestamp: info.timestamp,
            level: info.level,
            message: info.message,
            stack: info.stack,
            service: info.service
          });
        })
      )
    })
  ]
});
