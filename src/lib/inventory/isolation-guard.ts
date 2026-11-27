/**
 * Gopal Cake Shop — Production Database Safety Isolation Guard & Circuit Breaker (Milestone M3)
 * Path: src/lib/inventory/isolation-guard.ts
 *
 * Provides fail-safe protection against accidental mutation, corruption, or truncation
 * of the live production database (`schema=public` on Supabase AWS Mumbai).
 *
 * Zero native DLL dependencies — Pure TypeScript for Windows WDAC & Next.js 16 App Router compatibility.
 */

export const MANDATORY_TEST_PREFIX = 'TEST-INV-';
export const SAFE_TEST_SCHEMA = 'postgres_test';
export const FORBIDDEN_PROD_SCHEMA = 'public';

export class IsolationBreachError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolationBreachError';
  }
}

export class DatabaseCircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseCircuitBreakerError';
  }
}

export interface DatabaseEnvironmentInfo {
  isProduction: boolean;
  schema: string;
  isTestSchema: boolean;
  host: string;
  isPooler: boolean;
}

export class DatabaseSafetyBreaker {
  /**
   * Asserts that DATABASE_URL strictly does not point to live production `public` schema.
   * Throws fatal error if targeting `public` or missing test parameter when in DB test mode.
   */
  static assertSafeDatabaseEnvironment(simulatedUrl?: string): void {
    const url = simulatedUrl || process.env.DATABASE_URL || '';

    // In pure in-memory execution mode or absent URL
    if (!url) {
      // Offline / purely in-memory execution is safe
      return;
    }

    // Check if URL targets postgres_test or test database
    const schemaMatch = url.match(/schema=([^&]+)/);
    const schema = schemaMatch ? schemaMatch[1] : 'public';

    if (schema === 'public' || (!url.includes('postgres_test') && !url.includes('_test'))) {
      throw new DatabaseCircuitBreakerError(
        'FATAL CIRCUIT BREAKER: Live production database schema (public) detected! ' +
        'Automated tests are strictly forbidden from modifying production data. ' +
        'Ensure DATABASE_URL includes "?schema=postgres_test".'
      );
    }
  }

  /**
   * Extracts schema from connection string or defaults to 'public'.
   */
  static getDatabaseSchema(simulatedUrl?: string): string {
    const url = simulatedUrl || process.env.DATABASE_URL || '';
    if (!url) return 'in_memory';
    const schemaMatch = url.match(/schema=([^&]+)/);
    return schemaMatch ? schemaMatch[1] : 'public';
  }

  /**
   * Inspects and detects database environment attributes from a connection URL.
   */
  static detectDatabaseEnvironment(simulatedUrl?: string): DatabaseEnvironmentInfo {
    const url = simulatedUrl || process.env.DATABASE_URL || '';
    if (!url) {
      return {
        isProduction: false,
        schema: 'in_memory',
        isTestSchema: true,
        host: 'localhost',
        isPooler: false
      };
    }

    const schemaMatch = url.match(/schema=([^&]+)/);
    const schema = schemaMatch ? schemaMatch[1] : 'public';
    const isTestSchema = schema === SAFE_TEST_SCHEMA || schema.endsWith('_test') || url.includes('postgres_test');
    const isPooler = url.includes('pooler') || url.includes('pgbouncer=true') || url.includes(':6543');

    let host = 'unknown';
    try {
      const matchHost = url.match(/@([^:/]+)/);
      if (matchHost) host = matchHost[1];
    } catch {
      // fallback
    }

    const isProduction = schema === FORBIDDEN_PROD_SCHEMA || !isTestSchema;

    return {
      isProduction,
      schema,
      isTestSchema,
      host,
      isPooler
    };
  }

  /**
   * Returns true if the environment is verified safe for test operations.
   */
  static isSafeTestEnvironment(simulatedUrl?: string): boolean {
    try {
      this.assertSafeDatabaseEnvironment(simulatedUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates that all test fixture keys strictly start with `TEST-INV-`.
   */
  static assertValidFixturePrefix(identifier: string): void {
    if (!identifier || !identifier.startsWith(MANDATORY_TEST_PREFIX)) {
      throw new IsolationBreachError(
        `ISOLATION BREACH: Test fixture identifier "${identifier}" must start with mandatory prefix "${MANDATORY_TEST_PREFIX}".`
      );
    }
  }

  /**
   * Asserts that a schema is safe for destructive TRUNCATE or DROP operations.
   * Catastrophic defense against truncating live Supabase tables.
   */
  static assertSafeForTruncation(schemaName?: string, connectionString?: string): void {
    const schema = schemaName || this.getDatabaseSchema(connectionString);
    if (schema === 'public' || (schema !== 'postgres_test' && !schema.endsWith('_test'))) {
      throw new DatabaseCircuitBreakerError(
        `FATAL TRUNCATION BLOCKED: Attempted to truncate or wipe database schema "${schema}"! ` +
        `Truncation is strictly forbidden on production schemas and only permitted on isolated test schema "postgres_test".`
      );
    }
  }

  /**
   * Generates a collision-resistant test fixture identifier with mandatory prefix.
   */
  static generateIsolatedFixtureId(prefix?: string): string {
    const basePrefix = prefix && prefix.startsWith(MANDATORY_TEST_PREFIX) ? prefix : MANDATORY_TEST_PREFIX;
    const cleanSub = prefix && !prefix.startsWith(MANDATORY_TEST_PREFIX) ? prefix.replace(/[^a-zA-Z0-9_-]/g, '') + '-' : '';
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${basePrefix}${cleanSub}${timestamp}-${randomHex}`;
  }

  /**
   * Executes a scoped test action and guarantees cleanup in finally block.
   */
  static async withIsolatedTestContext<T>(
    action: () => Promise<T>,
    cleanupHook?: () => Promise<void> | void
  ): Promise<T> {
    try {
      return await action();
    } finally {
      if (cleanupHook) {
        try {
          await cleanupHook();
        } catch (cleanErr) {
          console.warn('⚠️ [Cleanup Warning] Error during isolated context teardown:', cleanErr);
        }
      }
    }
  }
}

// Standalone functional exports matching PROJECT.md, SCOPE.md and DISPATCH.md interface contracts
export const assertSafeDatabaseEnvironment = DatabaseSafetyBreaker.assertSafeDatabaseEnvironment.bind(DatabaseSafetyBreaker);
export const assertValidFixturePrefix = DatabaseSafetyBreaker.assertValidFixturePrefix.bind(DatabaseSafetyBreaker);
export const assertSafeForTruncation = DatabaseSafetyBreaker.assertSafeForTruncation.bind(DatabaseSafetyBreaker);
export const getDatabaseSchema = DatabaseSafetyBreaker.getDatabaseSchema.bind(DatabaseSafetyBreaker);
export const detectDatabaseEnvironment = DatabaseSafetyBreaker.detectDatabaseEnvironment.bind(DatabaseSafetyBreaker);
export const isSafeTestEnvironment = DatabaseSafetyBreaker.isSafeTestEnvironment.bind(DatabaseSafetyBreaker);
export const generateIsolatedFixtureId = DatabaseSafetyBreaker.generateIsolatedFixtureId.bind(DatabaseSafetyBreaker);
export const withIsolatedTestContext = DatabaseSafetyBreaker.withIsolatedTestContext.bind(DatabaseSafetyBreaker);
