import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { withBranchIsolation } from './prisma-extension'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || ''
  const pool = new Pool({ connectionString })
  
  const schemaMatch = connectionString.match(/schema=([^&]+)/)
  const schema = schemaMatch ? schemaMatch[1] : 'public'
  
  const adapter = new PrismaPg(pool, { schema })
  
  return new PrismaClient({ adapter, log: ['query'] })
}

export const prisma = process.env.NODE_ENV === 'test' 
  ? createPrismaClient() 
  : (globalForPrisma.prisma || createPrismaClient())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export function getIsolatedPrisma(branchId: string | null, role: string | null) {
  if (!role) return prisma
  return prisma.$extends(withBranchIsolation(branchId, role))
}
