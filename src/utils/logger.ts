// src/utils/logger.ts

import pino from 'pino';

export const createLogger = (name: string) => {
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss Z',
      },
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  });
};