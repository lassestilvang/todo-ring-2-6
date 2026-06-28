import winston from 'winston';
import Transport from 'winston-transport';

// Papertrail transport setup
const papertrailTransport = new Transport({
  host: process.env.PAPERTRAIL_HOST || 'logs.papertrail.io',
  port: parseInt(process.env.PAPERTRAIL_PORT || '80', 10),
  token: process.env.PAPERTRAIL_TOKEN,
  protocol: 'https',
  compressed: true
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  ),
  transports: [
    papertrailTransport,
    new winston.transports.File({
      filename: 'logs/app.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

export default logger;