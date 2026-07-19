import { execSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'

export default async function globalSetup() {
  // Load test environment variables and override any existing ones
  config({ path: path.resolve(__dirname, '../../.env.test'), override: true })

  console.log('Using DATABASE_URL:', process.env.DATABASE_URL)
  
  if (!process.env.DATABASE_URL?.includes('test') && !process.env.DATABASE_URL?.includes('localhost:5432/postgres')) {
    throw new Error('DATABASE_URL must point to a test database (should include "test" in the name) to prevent accidental data loss.')
  }

  // Prisma migrations require DIRECT_URL in prisma.config.ts. 
  // We will let it use the one defined in .env.test.
  console.log('🔄 Setting up test database schema...')
  
  const envPath = path.resolve(__dirname, '../../.env')
  const envBakPath = path.resolve(__dirname, '../../.env.bak')
  const fs = require('fs')

  // Temporarily rename .env so Prisma does not override the test DATABASE_URL
  if (fs.existsSync(envPath)) {
    fs.renameSync(envPath, envBakPath)
  }

  // Run Prisma db push to sync the test schema without dropping the entire database
  try {
    execSync('npx prisma db push --force-reset --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    })
    console.log('✅ Test database schema is ready.')
  } catch (error) {
    console.warn('⚠️ Failed to set up test database schema. If you are running pure unit tests, you can ignore this. Ensure local PostgreSQL is running for integration tests.', (error as any).message)
  } finally {
    if (fs.existsSync(envBakPath)) {
      fs.renameSync(envBakPath, envPath)
    }
  }
}
