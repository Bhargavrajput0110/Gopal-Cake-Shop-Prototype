import './env'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { withBranchIsolation } from './prisma-extension'
import { logger } from './logger'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || ''
  if (!connectionString) return new PrismaClient()

  try {
    const isCloud = connectionString.includes('supabase.com') || connectionString.includes('render.com') || process.env.NODE_ENV === 'production'
    
    const pool = new Pool({ 
      connectionString,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined
    })
    
    const schemaMatch = connectionString.match(/schema=([^&]+)/)
    const schema = schemaMatch ? schemaMatch[1] : 'public'
    
    const adapter = new PrismaPg(pool, { schema })
    
    const client = new PrismaClient({ 
      adapter, 
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ] 
    });

    setupPrismaLogging(client);
    return client;
  } catch (error) {
    console.error('[Prisma] Adapter initialization failed, falling back to standard PrismaClient:', error)
    const client = new PrismaClient({ 
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ] 
    });
    setupPrismaLogging(client);
    return client;
  }
}

function setupPrismaLogging(client: any) {
  const slowQueryMs = Number(process.env.SLOW_QUERY_MS) || 500;
  
  client.$on('query', (e: any) => {
    if (e.duration >= slowQueryMs) {
      logger.warn({
        query: e.query,
        params: e.params,
        duration: e.duration,
        threshold: slowQueryMs,
      }, 'Slow Database Query Detected');
    }
  });

  client.$on('error', (e: any) => {
    logger.error({ message: e.message, target: e.target }, 'Database Error');
  });
}

export const prisma = process.env.NODE_ENV === 'test' 
  ? createPrismaClient() 
  : (globalForPrisma.prisma || createPrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function getIsolatedPrisma(branchId: string | null, role: string | null) {
  if (!role) return prisma
  return prisma.$extends(withBranchIsolation(branchId, role))
}
