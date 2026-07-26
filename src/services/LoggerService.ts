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

  /**
   * Emits a structured [SECURITY] audit event for authorization failures.
   *
   * Logs ONLY safe, non-sensitive identifiers:
   *   userId, role, branchId, method, path, result, requestId, ip
   *
   * NEVER include: tokens, passwords, secrets, PII, or request bodies.
   *
   * Example output:
   * {
   *   "level": "SECURITY",
   *   "event": "AUTH_FAILURE",
   *   "timestamp": "2026-07-26T09:15:00.000Z",
   *   "requestId": "req_abc123",
   *   "userId": "usr_xyz",
   *   "role": "SALESPERSON",
   *   "branchId": "warasiya",
   *   "method": "POST",
   *   "path": "/api/v1/chef/production/batch",
   *   "result": "401 Unauthorized",
   *   "ip": "203.0.113.42"
   * }
   */
  static security(event: string, meta: {
    requestId?: string
    userId?: string | null
    role?: string | null
    branchId?: string | null
    method?: string
    path?: string
    result: string
    ip?: string
    reason?: string
  }) {
    console.warn(JSON.stringify({
      level: 'SECURITY',
      event,
      timestamp: new Date().toISOString(),
      ...meta,
    }))
  }
}

