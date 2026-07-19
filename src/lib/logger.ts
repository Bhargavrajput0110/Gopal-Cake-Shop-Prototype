import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

/**
 * Creates a child logger with the given context.
 * Automatically injects correlationId if provided.
 */
export function getLogger(context: {
  correlationId?: string;
  userId?: string;
  branchId?: string;
  orderId?: string;
  transferId?: string;
  module?: string;
}) {
  return logger.child(context);
}
