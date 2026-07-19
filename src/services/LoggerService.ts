export class LoggerService {
  static info(message: string, meta?: any) {
    console.log(JSON.stringify({ level: 'INFO', message, ...meta, timestamp: new Date().toISOString() }))
  }

  static warn(message: string, meta?: any) {
    console.warn(JSON.stringify({ level: 'WARN', message, ...meta, timestamp: new Date().toISOString() }))
  }

  static error(message: string, error?: any, meta?: any) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...meta,
      timestamp: new Date().toISOString()
    }))
  }
}
