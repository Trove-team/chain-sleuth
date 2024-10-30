// src/utils/logger.ts

import pino from 'pino';

export const createLogger = (name: string) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const baseConfig = {
    name,
    level: process.env.LOG_LEVEL || 'info',
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  };

  if (isProduction) {
    // Production configuration - simple JSON logging
    return pino({
      ...baseConfig,
      formatters: {
        level: (label) => ({ level: label }),
      },
    });
  }

  // Development configuration - pretty printing
  return pino({
    ...baseConfig,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'HH:MM:ss Z',
      },
    },
  });
};