import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env', override: false }) // Also load DATABASE_URL
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function syncUsers() {
  console.log('Syncing Prisma users to Supabase Auth...')
  const users = await prisma.user.findMany()

  for (const user of users) {
    if (!user.email) continue

    // Check if user already exists in Supabase
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const isExisting = existingUser.users.find((u) => u.email === user.email)

    if (isExisting) {
      console.log(`User ${user.email} already exists in Supabase Auth, updating metadata...`)
      await supabase.auth.admin.updateUserById(isExisting.id, {
        user_metadata: { role: user.role, branchId: user.branchId },
      })
      continue
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: '123456', // Default password for seeded users
      email_confirm: true,
      user_metadata: {
        role: user.role,
        branchId: user.branchId,
      },
    })

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message)
    } else {
      console.log(`Successfully synced ${user.email} to Supabase Auth.`)
    }
  }

  console.log('Sync complete!')
}

syncUsers()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
