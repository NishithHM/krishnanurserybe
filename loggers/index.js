const winston = require('winston');
require('winston-daily-rotate-file');
const transport = new winston.transports.DailyRotateFile({
    level: 'info',
    filename: 'loggers/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  });
const logConfiguration = {
    transports: [
        transport
    ],
    format: winston.format.combine(
        winston.format.label({
            label: `Label🏷️`
        }),
        winston.format.timestamp({
           format: 'MMM-DD-YYYY HH:mm:ss'
       }),
        winston.format.printf(info => `${info.level}: ${info.label}: ${[info.timestamp]}: ${info.message}`),
    )
};

module.exports = winston.createLogger(logConfiguration);
